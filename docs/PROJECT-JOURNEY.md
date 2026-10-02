# Majlis — the project so far, step by step

This is the story of the project in the order it happened, written to be read from
top to bottom. Each chapter says **what was done, why, and what you need to know to
understand it**. `README.md` and `CLAUDE.md` describe the system as it is now; this
file explains how it got there.

**Where this comes from:** the Git history, `CLAUDE.md`, and the working session of
2 October 2026. Work you did directly in the Home Assistant screens (adding devices,
areas, HACS cards) is not recorded in Git, so chapter 4 only summarises it.

---

## The picture to keep in your head

```
 Zigbee devices ──radio──> USB dongle ──> Zigbee2MQTT ──> Mosquitto ──┐
                                                                      v
 Tuya / Wi-Fi / cameras / ACs ───────────────────────────────> Home Assistant
                                                                      ^
 Tablets, phones, PC ──HTTPS──> Caddy ──┬── "/"   ────────────────────┘
                                        └── "/ws" ──> Asterisk (the intercom)
```

Everything runs on one machine: the old Lenovo laptop (`192.168.100.49`), headless,
running Ubuntu Server. Each box above is a **container** — a small sealed program —
and one file, `docker-compose.yml`, lists them all.

The single rule behind every decision: **devices talk to Home Assistant, and
everything a person touches talks to Home Assistant.** Nothing reaches around it to
a device directly. That is what lets you replace a device later without touching a
dashboard.

---

## Timeline at a glance

| Date | What happened |
|---|---|
| before 13 Sep | Planning: architecture, hardware, design mockups |
| 13 Sep | Server stack created: Home Assistant + Mosquitto (Zigbee waiting for a dongle) |
| 13 Sep | A custom web app (Svelte PWA) started as the UI |
| 13–19 Sep | Home Assistant rolled out through the house: ~750 entities, 14 areas |
| 19 Sep | **Decision:** drop the custom app, use Home Assistant dashboards |
| 19 Sep | Intercom built and proven: Asterisk + SIP Core + HTTPS through Caddy |
| 19–20 Sep | Tablet dashboard and "Majlis Glass" theme, three design rounds |
| 20 Sep | Fix: Asterisk pings each tablet every 30 s |
| 21–22 Sep | Fix: screensaver was blocking the Answer button |
| 2 Oct | Zigbee brought up: dongle, two repeaters, first device; range problem solved with a chain up the stairwell; dongle firmware updated |

---

## Chapter 1 — Planning (before the first commit)

**What was decided**

- **Home Assistant** is the centre. It turns every device, whatever the brand, into
  an *entity* (`light.something`, `climate.something`) that dashboards and
  automations can use the same way.
- **Local-first.** The house should keep working with the internet down. Cloud-only
  integrations are a last resort.
- **The host is the spare Lenovo IdeaPad 3** (i3, 6 GB RAM, 256 GB SSD). Its battery
  acts as a built-in UPS, and the lid-close action is set to "ignore" so it runs shut.
- **Docker Compose, not Home Assistant OS.** HA OS is the easy all-in-one install,
  but it takes over the whole machine. Running HA as one container among others
  keeps the laptop a normal Linux server. The price: no "add-ons" store. Anything
  extra (MQTT, Zigbee, the intercom) is another container that we define ourselves.
- **The house is treated as a codebase.** Configuration lives in Git, so every change
  is recorded and can be undone.

The planning documents are the three claude.ai pages listed in `CLAUDE.md` §14
(Blueprint, Majlis Control mockup, Host Setup). They are older than several later
decisions; where they disagree with `CLAUDE.md`, `CLAUDE.md` wins.

**The RAM limit matters.** 6 GB is enough for everything running today. Camera AI
(Frigate) is the one thing that would not fit, so it is postponed until a stronger
mini PC joins.

---

## Chapter 2 — The server stack (13 Sep, commit `e7dc69e`)

**What was built:** `docker-compose.yml` with three services.

| Service | What it is | Notes |
|---|---|---|
| `homeassistant` | The brain and the UI | Uses the host's network directly so it can discover devices on the LAN; `privileged` so it can reach USB and Bluetooth |
| `mosquitto` | An MQTT broker | A message bus. Programs publish small messages to named *topics* and others subscribe. Requires a username and password |
| `zigbee2mqtt` | Zigbee radio ⇄ MQTT translator | Defined but not started: no dongle yet, so its device path was the placeholder `CHANGEME` |

**Concepts**

- **Container:** a program packaged with everything it needs, isolated from the rest
  of the machine. `docker compose up -d` starts them; `restart: unless-stopped` brings
  them back after a reboot.
- **Volume:** a folder on the laptop that a container sees as its own. That is why
  Home Assistant's settings live in `~/Majlis/homeassistant/` and survive updates.
- **`.env`:** plain settings used by the compose file (time zone, the dongle path,
  the public name). It is committed, so it must never contain passwords.
- **`.gitignore`:** tells Git what not to record: databases, logs, passwords, keys.
  The rule of the project is *commit the structure, never the runtime or the secrets*.

**Two things learned that day**

- **`majlis.local` does not work from other devices.** The router does not pass the
  discovery traffic (mDNS) between Wi-Fi and wired, so the name only resolves on the
  laptop itself. The project standardised on the fixed IP address instead. (The
  address at the time was `192.168.100.199`; the reserved address is now
  `192.168.100.49`.)
- **A start-on-boot unit was written** (`systemd/majlis-compose.service`, commits
  `efb7495`, `837bfd8`). It starts only Home Assistant and Mosquitto, because starting
  Zigbee2MQTT without a dongle failed the whole unit. On 2 Oct this unit turned out
  **not to be installed** on the server, and it points at `~/majlis` while the repo is
  at `~/Majlis`. The containers come back after a reboot anyway through their restart
  policy.

---

## Chapter 3 — The custom app, started and later dropped (13 Sep)

**What was built:** a web app in Svelte (commits `f74d3af` → `cada20d`), meant to be
the house's own control panel, styled after the "Majlis OS" mockup. It connected to
Home Assistant over its WebSocket API, grouped entities by room, and had a climate
dial, light tiles, camera, energy and scene tiles, a navigation rail and nine pages.

**One idea from it survived:** *render by area, not by device.* An early version
looked for a room literally named "Majlis" (commit `43b42d2` fixed it). The fix was
to list whatever areas Home Assistant has and show what is in each. A new device
assigned to a room then appears with no code change. The dashboards today follow the
same rule.

**Why it was dropped (decision of 19 Sep):** it meant maintaining a second system
beside Home Assistant, and the intercom integration (next chapter) already supplied
the call screen, ringing and popups inside Home Assistant's own dashboards. One
system is easier to keep alive than two.

The app is still in Git history (`git show cada20d`). The design references were
kept in `design/`.

> **State of the removal:** the `frontend/` folder is deleted on disk, but that
> deletion has **not been committed yet**. In Git's last commit the folder still exists.

---

## Chapter 4 — Home Assistant across the house (13–19 Sep, in the HA screens)

This part was done by you in Home Assistant, not in files, so Git has no record of
the steps. The result, as recorded on 19 Sep:

- About **750 entities** in **14 areas**, all devices working.
- **HACS** installed (the community store for integrations and cards). Integrations
  include `tuya-local`, `localtuya`, `xtend_tuya`, Hikvision ones, Google Home, TCL
  and `sip_core`. Cards include Bubble Card, button-card, card-mod, auto-entities,
  mushroom, kiosk-mode and WallPanel.
- The first tablet dashboards (`TabletView`, `TabletView Test`, `Map`), made in the
  visual editor. They still exist and are untouched.

**Something to know about names.** The convention is `domain.area_device`, such as
`light.kitchen_ceiling`. The real entities do not follow it: lights are Tuya wall
switches and there is only one true `light.*` entity. So the dashboards find lights
by *integration + area*, not by the word "light".

**CasaOS.** At some point the stack was imported into CasaOS (a home-server web
panel that also owns port 80). CasaOS rewrote `docker-compose.yml` in its own style:
absolute paths, `TZ: Etc/UTC`, memory limits. That rewrite is the file actually
running, and it has deliberately **never been committed**. The committed file is the
hand-written one. Reconciling the two is still an open task.

---

## Chapter 5 — The intercom (19 Sep, commit `dcebfda`)

**Goal:** call from one wall tablet to another, inside the Home Assistant dashboard.

**The parts**

- **Asterisk** — a telephone exchange (PBX) in a container. It knows the extensions
  and connects calls.
- **SIP Core** — a Home Assistant integration that puts a softphone inside the
  dashboard. It registers the tablet's browser with Asterisk and provides the
  contacts card, the call card and the incoming-call popup.
- **Caddy** — a web server in front of both, providing HTTPS.

**Extensions** (`asterisk/roster.csv`): 201, 202, 203 are tablets 1–3, and 900 is a
shared "guest" used by anything else, such as the PC. Each tablet logs into Home
Assistant as its own user (`tab1`–`tab3`), and SIP Core maps that user to its
extension. A device can only be called while its Home Assistant page is open and awake.

**Why HTTPS was needed.** Browsers and the Home Assistant app only give a page the
microphone on a secure (`https://`) address. Over plain `http://` a call rings but
**Answer does nothing**. So the house needed a real certificate.

**How a LAN-only house gets a real certificate**

1. A free name at DuckDNS, `minjihome.duckdns.org`, points at the laptop's *LAN*
   address. It is reachable only from inside the house.
2. Certificates come from Let's Encrypt, which must be shown that you control the
   name. Normally it connects to your server from the internet. Here it can't.
3. So Caddy uses the **DNS-01 challenge**: it proves control by writing a temporary
   record at DuckDNS using your DuckDNS token. No port is opened to the internet.
4. Stock Caddy can't talk to DuckDNS, so `caddy/Dockerfile` builds a Caddy with that
   module added.

The internet is needed only when the certificate renews. Caddy then forwards `/` to
Home Assistant (port 8123) and `/ws` to Asterisk (port 8088). Port 80 belongs to
CasaOS, so Caddy's automatic redirect listener is switched off.

**Passwords** are never typed by hand. `asterisk/generate-secrets.sh` reads the
roster and writes one random password per extension into both places that must
agree: Asterisk's config and a block of options you paste into SIP Core's settings
form. All of those files are gitignored. Re-running it with `FORCE=1` changes every
password.

**No outside servers for calls.** WebRTC normally uses a STUN server (Google's by
default) to find a route between two devices. Inside one LAN it isn't needed, so it
was removed (`rtp.conf`, and an empty server list in the SIP Core options).

**A trap that cost time.** Since Home Assistant 2026.9, the `http:` section in
`configuration.yaml` is read once and then ignored. Trusting Caddy as a reverse proxy
must be done in **Settings → System → Network** (trust `127.0.0.1` and `::1`).
Without it every request through Caddy returns error 400.

**Proven that day:** calls answered both ways between tablet 2 and tablet 1, and
between the PC and tablet 1.

---

## Chapter 6 — The tablet dashboard (19–20 Sep, commit `dea5c9f`)

**What was built**

- A new dashboard at `/tablet-glass`, written as a YAML file in the repo instead of
  in the visual editor, so it is versioned.
- That file, `tablet.yaml`, is over 8,000 lines and is **generated**. The thing to
  edit is `homeassistant/dashboards/build_tablet.py`; running it rewrites
  `tablet.yaml`. A generator is used because every page repeats the same header, side
  rail and clock column, and there is one page per room.
- The **"Majlis Glass"** theme (`homeassistant/themes/majlis.yaml`): blurred glass
  cards on a near-black background.

**Layout:** a header with the greeting, a Home / Intercom / Rooms tab pill, and the
tablet's own room; below it a left rail (Lighting, Climate, Media, Garden, Doors &
locks), the content, and a clock + weather + lock column. Home Assistant's own header
and sidebar are hidden by kiosk-mode, so the tab pill is the only navigation.

**Live numbers** ("3 lights on", "AC running") are worked out in the browser from
Home Assistant's own lists of devices and areas. Nothing is hard-coded, so a new
device in an existing room shows up by itself.

**Three design rounds**

1. **v1** — first working version.
2. **v2** (20 Sep) — rebuilt after your feedback that the foundation was good but not
   friendly or pretty: bigger status cards, room tiles with a live status line, a
   Rooms search box.
3. **v3** — the **Graphite** palette. Earlier teal with multicoloured icons felt
   "exaggerated", so icons went neutral grey and colour was reserved for meaning:
   amber = on, blue = cooling, green = locked.

**Screensaver:** WallPanel shows a clock and weather after 120 seconds idle, with no
photos and nothing fetched from the internet.

**Dashboard changes need no restart** — regenerate and refresh the tablet. Changes to
`configuration.yaml` (registering the dashboard, the search helper) do need one.

---

## Chapter 7 — Two intercom fixes (20–22 Sep)

**Tablets going deaf (commit `a91d777`).** A tablet whose page sleeps silently loses
its connection to Asterisk, so a call "rings" a tablet that never hears it (SIP Core
issue #231). Asterisk now pings every tablet each 30 seconds (`qualify_frequency=30`),
which keeps the connection from idling out and lets Asterisk notice a dead one.

**The screensaver ate the Answer button (commit `8943fcc`).** WallPanel's screensaver
is a full-screen layer on top of the call popup. It swallowed the tap that woke it
and every tap for a second after, so a call to an idle tablet rang but Answer and
Decline did nothing. The fix is a small script, `majlis-call-wake.js`: when SIP Core
announces a call, it sends the screensaver a fake mouse movement at the centre of the
screen, and repeats it every 30 seconds until the call ends. The centre matters; a
movement at the corner (0,0) is treated as a swipe zone and ignored.

On 22 Sep this was found to be hit-and-miss: a single nudge arriving while the
screensaver was still fading in got lost. The script now fires a short burst of five
nudges. **That improvement is in the working folder but not yet committed.**

The script must be copied into Home Assistant's `www/` folder, which is owned by
root: `sudo install -m 644 homeassistant/dashboards/majlis-call-wake.js homeassistant/www/`.

---

## Chapter 8 — Zigbee (2 Oct, first commit `ba8e956`)

**Why Zigbee:** it is a low-power radio network for sensors, switches and plugs that
works with no cloud and no Wi-Fi. Devices relay for each other, forming a *mesh*.

**The hardware**

- **Sonoff ZBDongle-P** — the *coordinator*, the one device that owns the network.
  It sits on a USB extension cable, away from the laptop, because USB 3 ports and the
  laptop itself create interference on the same 2.4 GHz band.
- **Two HOBEIAN ZG-807Z USB repeaters** — *routers*. They do nothing except pass
  signal along. The first plan was one for each floor the server is not on; that
  did not work (see "The range problem" below).
- **One HOBEIAN ZG-IR01** — a battery-powered infrared remote with a humidity
  sensor, named "Family Room Controller". The first real device on the network.

**How a Zigbee message reaches a dashboard**

device → dongle → Zigbee2MQTT → Mosquitto → Home Assistant. Zigbee2MQTT also
announces each device to Home Assistant over MQTT, so devices appear there on their own.

**What was changed**

- `.env` — `ZIGBEE_DONGLE_PATH` set to the dongle's `/dev/serial/by-id/...` path.
  That path is tied to the dongle's serial number. The short name `ttyUSB0` can change
  after a reboot; this one cannot.
- `zigbee2mqtt/data/configuration.yaml` — replaced the first-boot stub with a real
  config: the broker's address, the adapter type for this dongle (`zstack`),
  channel 20, the web page switched on, Home Assistant discovery switched on, and
  later "last seen" and availability tracking.
- `zigbee2mqtt/data/secret.yaml` — a generated MQTT password and the Zigbee network
  key. It is gitignored. The config refers to it (`!secret.yaml ...`), which is what
  makes the config safe to commit.
- A second Mosquitto login, `zigbee2mqtt`, beside `majlis` (the one Home Assistant uses).
- The MQTT integration was added in Home Assistant.

**Problems found on the way, and what they teach**

1. **A second Mosquitto was running on the laptop**, installed as a snap package and
   holding the address `127.0.0.1:1883`. The Docker one was unreachable from the
   host. Home Assistant would have connected to the wrong, empty broker and never
   seen a Zigbee device, with no error anywhere. It was removed.
2. **The broker address inside a container is not `localhost`.** The stub said
   `mqtt://localhost:1883`; inside Zigbee2MQTT's container, "localhost" is that
   container itself. Containers on the same Compose network reach each other by
   service name: `mqtt://mosquitto:1883`. Home Assistant is different because it
   uses the host's network, so for it `127.0.0.1` is right.
3. **Mosquitto could not save its data.** Its data folder belonged to a different
   user than the container runs as, so it logged "Permission denied" every 30
   minutes. Fixed by changing the folder's owner.
4. **The repeaters would not pair from their final sockets.** With no mesh yet, each
   had to reach the dongle directly through a concrete floor. Pairing them in the
   same room as the dongle worked at once. The rule: *pair near the dongle or a
   repeater, then move the device.*
5. **"Disabled" did not mean broken.** In Home Assistant, the signal-strength sensor
   of every Zigbee device is switched off by default. In Zigbee2MQTT's list, the
   "Last seen" and "Availability" columns showed "Disabled" because those two
   features are off by default. Both are now switched on in the config.
6. **Unplugging the dongle stops Zigbee2MQTT, and it stays stopped.** Docker does not
   restart it, because the device is missing at that moment. After moving the dongle
   to another port: `sudo docker start zigbee2mqtt`. Stop it first next time.

### The range problem (the afternoon of 2 Oct)

Both repeaters paired next to the dongle with a signal of 189 and 174 out of 255,
then went silent as soon as they were moved one and two floors up. It took several
hours to pin down, partly because of readings that looked fine and were not.

**The house is the cause.** The server room is under the staircase on the ground
floor, and the house is concrete throughout. A Zigbee signal does not get through a
concrete floor slab in any useful strength. It does travel through the opening where
the stairs pass through each floor.

**What works:** a chain up the stairwell, each repeater within reach of the next.

```
dongle (server room, under the stairs)
   │  signal ~115 both ways
repeater on the ground floor, about 10 m away, facing the stairs
   │  signal ~45–97
repeater on the first floor
   │
(nothing yet on the top floor)
```

The first-floor repeater cannot hear the dongle at all (signal 0) and does not need
to; its messages hop through the one by the stairs. The Family Room Controller made
the same switch by itself, going from a signal of 1–5 straight to the dongle to 91
through the stairs repeater. That is the mesh doing its job.

**Checks that can be trusted, and ones that cannot**

- **Trust "Last seen"** jumping to the current time, and **"Availability"** staying
  Online through the check that runs about every 10 minutes.
- **Trust the Map tab** when it shows a link in both directions. A scan that says a
  repeater "failed" means that repeater did not answer.
- **Do not trust the Interview button** on a device that is already paired. It
  reports "successful" after a 10-second timeout from what Zigbee2MQTT remembers,
  even when the device never answers.
- **Do not trust a signal number recorded at pairing.** The 189 and 174 were measured
  next to the dongle and stayed on screen long after the repeaters had moved.

**What was tried that was not the cause**

- Raising the dongle's transmit power to its maximum (`transmit_power: 20`). It is
  still set; it did not fix the upstairs links.
- Moving the dongle to another USB port.
- Updating the dongle's firmware (below). Worth doing, but not the fix.

### Firmware update

The dongle shipped with firmware from July 2021. It was updated to the March 2025
release (`20250321`) from the Koenkk/Z-Stack-firmware project.

How it was done:

1. Stop Zigbee2MQTT (`sudo docker stop zigbee2mqtt`).
2. Run the `cc2538-bsl` flashing tool inside a throwaway `python:3-slim` container,
   with the dongle passed in and the option `--bootloader-sonoff-usb`, which puts
   this dongle into flashing mode without opening its case. The tool erases, writes
   and verifies.
3. Start Zigbee2MQTT. It saw the wiped dongle and restored the network from
   `coordinator_backup.json`. All three devices stayed paired.

One snag: the tool would not install from a zip download until it was given a version
number through the `SETUPTOOLS_SCM_PRETEND_VERSION_FOR_CC2538_BSL` setting.

The firmware file and the pre-update backups are in `~/zigbee-fw/` on the server.

### State at the end of the day

| Device | Where | State |
|---|---|---|
| "1st Floor Repeater" | Ground floor, facing the stairs | Online, signal ~115 |
| "Xst Floor Repeater" | First floor | Online through the stairs repeater |
| "Family Room Controller" | Family room | Online through the stairs repeater |

The two repeater names no longer match where they are. The rename was started and
left half done: the one by the stairs should become something like "Ground Floor
Stairs Repeater", and "Xst Floor Repeater" should then become "1st Floor Repeater".
Rename in that order, because two devices cannot share a name, and tick the option
that updates the Home Assistant entity ID.

**Plan for the rest of the house**

- **One more USB repeater** at the stair opening on the top floor, plus a spare, and
  USB extension cables so each repeater can sit where the signal is good.
- **Zigbee smart plugs** (Zigbee 3.0, UK-type pins, listed as supported by
  Zigbee2MQTT) inside each floor. They relay like a repeater and are also useful.
  Wall switches relay only if they have a neutral wire.
- **Install from the dongle outward.** Battery devices go in last.
- **Put the chain on sockets nobody switches off.** Everything upstairs depends on
  the repeaters below it.
- **Fallback:** a network coordinator (for example an SLZB-06) that sits on a middle
  floor and connects by Ethernet or Wi-Fi, or one coordinator per floor.

**Things worth knowing**

- **Channel 20** was chosen because it sits between Wi-Fi channels 6 and 11. The
  server has no Wi-Fi card, so it could not check which channel your router uses.
  Changing the Zigbee channel can mean re-pairing devices.
- **The battery IR remote sleeps.** Commands sent to it fail unless it is awake;
  press a button on it, then send the command straight away.
- **The pairing page** is `http://192.168.100.49:8080`. It has no login, which is
  acceptable only because it is reachable from the LAN alone.
- **Mains-powered Zigbee devices also act as repeaters.** Battery devices do not.

---

## Chapter 9 — Remote access (discussed 2 Oct, not installed)

The plan is **Tailscale** installed on the laptop itself, advertising only the
laptop's own LAN address:

```
sudo tailscale up --advertise-routes=192.168.100.49/32
```

Your phone, with Tailscale on, then reaches `192.168.100.49` through an encrypted
tunnel from anywhere. Because `minjihome.duckdns.org` already points at that address,
the same link and certificate work at home and away, and nothing in Caddy, DuckDNS or
Home Assistant changes. No port is opened on the router.

Still to check when it is set up: whether mobile carriers in Oman pass the
connection directly, and whether intercom calls work from outside.

---

## Where things stand (2 Oct 2026)

**Working**

- Home Assistant across the house, on the tablets, phones and PC over HTTPS.
- The intercom between tablets and the PC.
- The glass tablet dashboard with the screensaver.
- Zigbee on the ground and first floors: the coordinator on current firmware, two
  repeaters chained up the stairwell, and one IR remote. The top floor has no
  coverage yet.

**Changed on disk but not committed**

- The deletion of `frontend/` and of `systemd/majlis-frontend-dev.service`.
- `homeassistant/configuration.yaml`, `homeassistant/themes/majlis.yaml` and the
  burst version of `majlis-call-wake.js`.
- `README.md` and three extra theme folders (new, never added).
- `docker-compose.yml` (the CasaOS rewrite, kept out on purpose) and its `.bak` copy.

**Not yet verified**

- Tablet 3 (extension 203).
- Calling a tablet that has been idle for 30 minutes or more.
- That Answer and Decline work on the first tap with the screensaver showing.
- That everything comes back by itself after a full reboot with the dongle attached.

**Open tasks**

1. Zigbee: finish renaming the two repeaters, add a repeater for the top floor, then
   plugs and sensors floor by floor (chapter 8).
2. Decide between the CasaOS compose file and the hand-written one, then make the
   committed file match what runs.
3. Install or retire the start-on-boot unit (and fix its folder name).
4. Tailscale for remote access.
5. Later: Frigate for cameras on a stronger machine; an outside phone line through
   Asterisk.

---

## Rules that keep it from breaking

- Never put `http:` in `configuration.yaml`; proxy trust is set in the HA screens.
- Never edit `homeassistant/.storage/` or the database by hand.
- Never edit `tablet.yaml`; edit `build_tablet.py` and regenerate.
- Never commit passwords, tokens or keys. Generated secrets stay in gitignored files.
- SIP passwords come only from `generate-secrets.sh`.
- Give every device an area. The dashboards show things by area.
- Refer to the dongle by its `/dev/serial/by-id/` path only.
- Docker commands on this server need `sudo`.

---

## Glossary

| Term | Meaning |
|---|---|
| **Entity** | One controllable or readable thing in Home Assistant, e.g. one switch or one temperature |
| **Area** | A room in Home Assistant. Devices are assigned to areas |
| **Integration** | The piece of Home Assistant that talks to one brand or protocol |
| **HACS** | Community store for extra integrations and dashboard cards |
| **Container / Compose** | A packaged, isolated program / the file listing all of them |
| **MQTT** | A lightweight message bus; Mosquitto is the broker that carries the messages |
| **Zigbee coordinator / router / end device** | The dongle that owns the network / a mains device that relays / a battery device that only talks |
| **LQI** | Link Quality Indicator, 0–255, for one hop of the Zigbee mesh |
| **Reverse proxy** | A server that receives requests and passes them to others behind it. Caddy here |
| **TLS certificate** | What makes `https://` trusted by browsers. Issued by Let's Encrypt |
| **DNS-01** | Proving you own a name by writing a record in its DNS, with no inbound connection |
| **SIP / PBX** | The standard protocol for calls / the exchange that connects them. Asterisk here |
| **WSS** | A secure WebSocket; how the tablet's browser stays connected to Asterisk |
| **WebRTC** | The browser's built-in audio/video calling, always encrypted |
| **STUN / TURN** | Outside helper servers for calls across the internet; not used here |
| **Kiosk mode** | Hiding Home Assistant's own header and sidebar on the tablets |
