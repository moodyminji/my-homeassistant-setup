# Majlis — Whole-Home Automation

Project memory for Claude Code. Read this first; it carries the decisions made
during planning so coding sessions start with full context. Keep it current as
decisions change.

---

## 1. What this is
A whole-home smart-home unification for a **new 3-floor house in Muscat, Oman**.
Goal: pull Tuya/Smart Life, other Wi-Fi gear, Zigbee/Z-Wave/BLE, cameras, locks,
and split-AC units out of separate vendor apps into one **local-first** system on
**Home Assistant**. **The UI is Home Assistant itself** — its dashboards, built from
HACS cards, shown on the wall tablets, phones and PCs — plus an in-house **SIP
intercom** (§7). There is no custom app. The system must be **scalable**: adding a
device later should require zero dashboard edits.

> **Decision (2026-09-19):** the custom Svelte PWA and the WebRTC signaling server
> were **removed** in favour of HA dashboards + SIP Core/Asterisk: one system to
> maintain, and SIP Core already provides the call UI, ringing, incoming-call
> popups, contacts and DTMF/door buttons. The old app is in git history
> (`git show cada20d`).

## 2. The one architectural rule (don't violate this)
Devices talk to Home Assistant; **everything a person touches talks to Home
Assistant**. HA normalises devices into *entities*. Dashboards, automations and
the intercom UI all sit on entities and areas, never on a vendor device API. So
replacing a cloud Tuya bulb with a local Zigbee one later must not touch a
dashboard. Anything that reaches around HA to a device API is a design smell.
Asterisk and Caddy are infrastructure beside HA (like Mosquitto); **SIP Core is the
HA integration that fronts Asterisk** — dashboards use SIP Core's cards, never
Asterisk directly.

## 3. Infrastructure
- **Host:** repurposed Lenovo IdeaPad 3 — i3 10th-gen, 6 GB RAM, 256 GB SSD.
  Headless **Ubuntu Server (LTS)**. Laptop battery = built-in UPS. Lid-close set to ignore
  so it runs closed. LAN IP is DHCP-reserved (`192.168.100.49`); also `majlis.local`.
- **Runtime:** Docker + Docker Compose — deliberately NOT HAOS (so **no HA
  add-ons / Supervisor**; extras are compose containers beside HA). One
  `docker-compose.yml` is the source of truth for the whole stack. The dev user is
  not in the `docker` group, so containers are managed with `sudo docker`.
- **Repo:** `~/majlis`, Git-versioned — the house is treated as a codebase.
- **RAM ceiling (important):** 6 GB comfortably runs HA + Mosquitto +
  Zigbee2MQTT + Asterisk + Caddy. **Frigate** (camera AI) is the memory hog and is
  deferred to Phase 3, when a mini PC (N100/i5, 16 GB) may join as the main brain
  or a dedicated Frigate box. Keep new services lean.

## 4. Repo layout
```
~/majlis/
  docker-compose.yml        # single source of truth for the stack
  .env                      # non-secret env (TZ, PUID, SITE_HOST); committed
  .env.secrets              # DUCKDNS_TOKEN — gitignored (.env.secrets.example = template)
  homeassistant/            # HA config volume (NOT committed wholesale — see §9)
  mosquitto/config/mosquitto.conf
  zigbee2mqtt/data/configuration.yaml
  asterisk/                 # SIP PBX for the intercom (see §7)
    roster.csv              #   extension <-> HA user map (committed)
    generate-secrets.sh     #   writes passwords to Asterisk + SIP Core options
    config/asterisk/custom/rtp.conf   # the only tracked file under config/
  caddy/                    # HTTPS front door: Dockerfile + Caddyfile (certs gitignored)
  design/                   # design language: DESIGN.md + majlis-os-reference.html
  systemd/majlis-compose.service
```

## 5. Stack (containers)
- **homeassistant** — `ghcr.io/home-assistant/home-assistant:stable`,
  `network_mode: host` (required for discovery/mDNS), `privileged: true`,
  volume `./homeassistant:/config`, `TZ=Asia/Muscat`.
- **mosquitto** — Eclipse Mosquitto 2, the common MQTT bus. Give it a real
  listener + authenticated user (no anonymous). Config in `./mosquitto/config`.
- **zigbee2mqtt** — `koenkk/zigbee2mqtt`. Prefer Z2M over ZHA for device
  coverage. Pass the coordinator by its **`/dev/serial/by-id/…`** path, never
  `ttyUSB0` (which renumbers on reboot). Talks to `mosquitto`. (Its dongle path is
  still the `CHANGEME` placeholder.)
- **asterisk** — `ghcr.io/tech7fox/asterisk-hass-addon`, **pinned**, host network.
  The SIP PBX behind the intercom. Version bumps are deliberate (the project has
  had breaking releases).
- **caddy** — custom build with the DuckDNS DNS module. Serves
  `https://$SITE_HOST` on 443 with a Let's Encrypt cert obtained via the DNS-01
  challenge (only renewal needs internet), proxying `/` to HA (`:8123`) and `/ws`
  to Asterisk (`:8088`). Port 80 is owned by CasaOS, so Caddy's redirect listener
  is disabled.
- **Later:** `frigate` (cameras, Phase 3).
- **HACS** (already installed) — integrations: `sip_core` (intercom UI), tuya-local,
  localtuya, xtend_tuya, hikconnect, hikvision_next, google_home, TCL and others;
  cards: Bubble Card, button-card, decluttering-card, card-mod, auto-entities,
  mushroom, navbar-card, mini-graph-card, swipe-card, weather-card, kiosk-mode,
  wallpanel.

## 6. UI — Home Assistant dashboards
- **Where it lives:** the wall-tablet UI is a **YAML-mode dashboard in this repo**,
  registered in `configuration.yaml` as `/tablet-glass` ("Tablet"). `tablet.yaml` is
  **GENERATED** by `homeassistant/dashboards/build_tablet.py` (shared header/rail/side
  + one page per room) — edit the generator (rooms, colours, tablet names), run
  `python3 homeassistant/dashboards/build_tablet.py`, refresh the tablet. No HA
  restart for dashboard changes (registering it or changing `configuration.yaml`/
  helpers needs one). Older
  storage-mode dashboards still exist and are untouched: `TabletView`,
  `TabletView Test`, `Map`. Look = the **"Majlis Glass"** theme
  (`homeassistant/themes/majlis.yaml`, liquid-glass: blur + gradient fill + highlight
  in the neutral **Graphite** palette with an amber accent), selected per device in Profile → Theme.
  **WallPanel** (HACS `lovelace-wallpanel` 3.43) is the idle screensaver: `wallpanel:` block in the
  generated dashboard, `WALLPANEL_IDLE_S` = 120 s (the old TabletView used 10 s and WallPanel's
  default *internet* photo source, picsum.photos). Now: no photos, a clock + weather only, fully
  local; it returns to `/tablet-glass/home` on wake.
  **WallPanel vs the intercom (confirmed 2026-09-21):** the screensaver (z-index 1000) sits above SIP
  Core's popup and swallows the waking tap plus all clicks for 1 s, so a call to an idle tablet rang
  but Answer/Decline did nothing until a reload. Fix: `dashboards/majlis-call-wake.js` (loaded via
  `frontend: extra_module_url`, copied to root-owned `www/` with `sudo install`) sends WallPanel a
  centre-screen `mousemove` on SIP Core's `sipcore-call-started`, and every 30 s until
  `sipcore-call-ended`. Don't use (0,0): WallPanel reads it as a touch zone and ignores it.
- **Tablet layout (v2, redesigned 2026-09-20 after the owner's feedback "foundation is
  great but not friendly/pretty"):** every page is a header (greeting | glass tab pill
  Home / Intercom / Rooms | "This tablet: <room>" from the HA user tab1-3) over
  `[left rail | content | clock+weather+lock]`. HA's own header/sidebar are hidden by
  kiosk-mode, so the tab pill is the only navigation. The rail (Lighting, Climate,
  Media, Garden, Doors & locks) and the room tiles open hidden pages
  (`visible: false`): 5 category pages + one page per room (`room-<area_id>`).
  **Home** = 3 big status cards, 9 room tiles with live one-line status, ACs
  running. **Rooms** = search box (helper `input_text.tablet_search`, **shared by all
  tablets**, results appear only while typing) + all 14 room tiles. Live values are
  computed in the browser from `hass.entities/devices/states` (button-card JS), not
  hard-coded. Design target images: `UI Photos(No Commit)/` (owner's screenshots +
  `MOCK-v2-home.png`); that folder is intentionally NOT committed.
- **How it scales:** lights = Tuya wall switches (integration `tuya_local`) shown
  per area; ACs = every `climate.*`; sprinklers = `rainbird`. New device in an
  existing area appears by itself; a brand-new *area* needs one heading+card pair
  in the Lighting view (Rooms search finds everything regardless). This house's
  entities do NOT follow `domain.area_device` naming and there's only one `light.*`,
  so filters use integration + area, not domain=light.
- **Render by *area*, not by device.** Use auto-entities / area-based cards so a
  new device assigned to a room in HA appears automatically — no dashboard edit.
  This is how §1's scalability rule shows up in the UI layer. (HA has 14 areas.)
- **Division of labour:** HA owns automations, history, alerts, presence *and*
  the UI. Don't build a second engine beside it.
- **Look:** see §10. `homeassistant/dashboards/` and `homeassistant/themes/` are
  un-ignored in `.gitignore` and committed. Fonts: system fonts for now (Archivo /
  IBM Plex would need self-hosting under `www/` to stay local-first).
- **HA quirks learned:** no `http:` in YAML (§7); button-card JS templates are
  avoided inside `service_data` (older versions ignore them) — use static actions.

## 7. Intercom — SIP (Asterisk + SIP Core), built and proven 2026-09-19
- **How it works:** **Asterisk** (container) is the PBX. **SIP Core** (HACS
  integration, JsSIP) puts a softphone *inside HA dashboards/app* and registers the
  browser to Asterisk over **WSS**. Cards: `custom:sip-contacts-card`,
  `sip-call-card`, `sip-call-button`, plus an auto-opening incoming-call popup.
  Media is WebRTC (DTLS-SRTP), LAN only: **no STUN/TURN** (ICE servers empty; the
  Google STUN default is removed from `rtp.conf`).
- **Extensions** (`asterisk/roster.csv`): **tablets only** — 201–203 = tab1–3 (each
  its own HA user), 900 = shared guest (SIP Core's `backup_user`, used by any other
  HA user, e.g. the PC). Each HA user maps to one extension by HA **user id**. A
  device is reachable only while its HA page/app is open and awake.
- **Secrets & config flow:** run `asterisk/generate-secrets.sh` (needs `SITE_HOST`
  in `.env`; writes `pjsip_custom.conf`, `config.json`, `sip-core-options.yaml`,
  all gitignored). Asterisk reads them from its container mount; the SIP Core
  options go in through **Settings → Devices & services → SIP Core → Configure**
  (never edit `.storage`). Adding a device: add a `roster.csv` line, re-run with
  `FORCE=1` (rotates every password), restart Asterisk, re-paste. To change only
  the address, edit just `custom_wss_url` in the form — no rotation needed.
- **Why HTTPS:** browsers and the HA Companion app expose the microphone only on
  secure origins. The app's maintainers closed "mic over http" as not planned
  (android#3512, #4468), so plain-http calls ring but **Answer does nothing**. A
  real cert (DuckDNS + Caddy, §5) makes every client work with no per-device setup.
  `custom_wss_url` is `wss://$SITE_HOST/ws`. (Rejected: DNS-hosting `nextlinet.com`
  at Cloudflare, a self-made CA installed on tablets, per-device browser flags.)
- **HA 2026.9 gotcha — reverse-proxy trust is UI-managed.** HA now migrates `http:`
  from `configuration.yaml` once and then **ignores** it (a Repair says so). So do
  **not** put `http:` in `configuration.yaml`; in **Settings → System → Network**
  enable the reverse-proxy option and trust `127.0.0.1` and `::1`. Without it every
  proxied request gets a 400 ("not set-up for reverse proxies").
- **Proven:** calls answered and bridged tab2 → tab1, PC → tab1, tab1 → PC, in the
  HA app over HTTPS (owner: "works beautifully"). SIP Core bug #190 (WebRTC in the
  app) did not bite. **Known risk: #231** — a tablet whose page is
  backgrounded/asleep loses its SIP registration; keep tablets awake on the dashboard.
- **Broadcast/announce** (one-way "dinner's ready"): TTS/audio pushed to all
  panels via HA — separate from calling.
- **Doors/cameras:** **go2rtc** (bundled with HA) for camera two-way audio. A SIP
  video door station (Dahua/Hikvision) can register straight to Asterisk as an
  endpoint and appear in the contacts card; SIP Core's DTMF/service-call buttons can
  open the door.
- **Later, not now:** calling **out** to real numbers over the ISP's landline via
  an Asterisk PJSIP trunk. Open question: does the ISP give SIP credentials, or is
  the line an analog port on its router (then an ATA/FXO gateway is needed)?

## 8. Wall panels
- 3 identical large **Android** tablets (real Android, Play Store), one per
  floor, each running the **HA Companion app** at `https://$SITE_HOST`, logged in as
  its own HA user (`tab1`–`tab3`), which is what maps it to extension 201–203. Not
  Amazon Fire (locked FireOS, ads, weak camera for video intercom).
- Calls need HTTPS + microphone permission for the app (§7). Keep the screen on and
  the dashboard in the foreground so the SIP registration stays alive.
- Prefer **LCD not OLED** (static dashboards burn OLED in).
- Charge-limit each tablet to ~40–80% via a smart plug + HA automation to spare
  the battery from 24/7 full charge.

## 9. Conventions
- **Entity naming:** `domain.area_device` — e.g. `light.kitchen_ceiling`,
  `sensor.majlis_temp`, `climate.master_ac`. Assign every device an **area**;
  group areas into **floors**. Non-negotiable — dashboards and automations depend on
  it.
- **Secrets:** never commit. HA `secrets.yaml`, long-lived tokens, MQTT creds,
  `.env.secrets` (DuckDNS token), and everything under `asterisk/` that the
  generator or container writes (SIP/AMI passwords, TLS keys) stay out of Git.
  `.gitignore` excludes `homeassistant/` runtime (`*.db*`, `.storage/`,
  `secrets.yaml`), `caddy/data`, and `asterisk/config/*` except `custom/rtp.conf`.
  Commit *config structure* (compose file, dashboards/themes if YAML, automations,
  z2m/mosquitto configs, `asterisk/roster.csv`, the Caddyfile), not runtime.
- **Local-first:** for Tuya prefer `tuya-local` (HACS) or reflash to ESPHome
  over the cloud integration; prefer Zigbee/ESPHome gear for new purchases. No
  cloud STUN/TURN for the intercom; the internet is needed only to renew the cert.

## 10. Design language (match the mockup)
Apply it through **HA theme + card-mod/button-card + dashboard layout**, not a
custom app. References live in `design/`: `majlis-os-reference.html` (the mockup —
full shell + all pages) and `DESIGN.md` (exact tokens, components, page map; its
Svelte/PWA build rules are retired — see its status banner). Also viewable as
**"Majlis OS"**: https://claude.ai/code/artifact/c983b391-2ffa-4ec7-86c2-198baf7dab41
Design feel, in brief:
- **Aesthetic:** dark control-panel by default, with a proper light theme too
  (theme-aware). Calm, glassy, information-dense but not cluttered.
- **Palette (decided 2026-09-20): GRAPHITE.** Near-black (`#0c0d0f`→`#131518`) with neutral glass
  cards and ONE warm amber accent (`#ffb81a`, active tab/toggles). Icons are neutral gray; colour is
  reserved for meaning — amber = on, blue = cooling, green = locked. Chosen over teal, midnight blue
  and warm charcoal after the owner found the earlier teal + multicolour icons "exaggerated".
  (The older teal tokens in `design/DESIGN.md` are superseded.)
- **Type:** Archivo (display/headings), IBM Plex Sans (body), IBM Plex Mono
  (readouts, entity ids, numbers — use `tabular-nums`).
- **Key components:** navigation rail/bar; top status bar (greeting, outdoor
  weather, clock); **room/area tabs**; a **climate dial** with +/- and mode
  chips; **light tiles** with a brightness slider that glows warm when on;
  small device tiles with toggles; a **camera tile** with a live badge and
  Frigate detection box; an **energy** tile with a sparkline; a **scenes** row.
- **Interaction:** what's interactive looks interactive; state shows in *form*
  (pill/stripe) as well as text; usable at phone width and on the tablets.
- HA's stock cards can't match all of this; expect card-mod/button-card work for
  the dial, glow and tiles. Where HA can't do it, close enough beats a custom app.

## 11. Current state (2026-09-19)
- **HA is fully deployed across the house and working well:** ~750 entities in 14
  areas, all devices working, `TabletView` dashboards serving the tablets.
- **The intercom is done and proven** (§7): Asterisk + SIP Core + Caddy HTTPS, calls
  working between tablets and PC. Committed on branch `feat/intercom-sip`.
- **The old PWA is removed** (this change); design refs are in `design/`.
- Not yet verified: tab3 (203), and a tablet left idle 30+ minutes (bug #231).
- The working tree still holds the owner's uncommitted CasaOS rewrite of
  `docker-compose.yml` (absolute paths, `TZ: Etc/UTC`), deliberately NOT committed;
  the committed compose is HEAD plus the `asterisk`/`caddy` services.

## 12. Next tasks
0. **Tablet dashboard v3 (Graphite + fuller weather + WallPanel; owner has seen v2, not v3):** VERIFY the
   call-wake shim (§6): call an idle tablet with the screensaver showing; Answer/Decline must work
   first tap. Also set the HA app to keep the screen on. Original v1 notes:  restart HA once
   (registers `/tablet-glass`, the `input_text` helper and the theme), open
   `https://$SITE_HOST/tablet-glass/home`, set Profile → Theme → "Majlis Glass" on
   each tablet, then iterate the look with the owner (blur strength, sizes, column
   widths for the real tablet screen, fonts). Check the clock timezone (HA setting
   must be Asia/Muscat). Not built on purpose: an "all lights off" button — several
   Tuya "Switch 1/2/3" (e.g. home theater) may not be lights; label real lights
   first, then add it.
1. Set up/confirm tab3 (203); leave a tablet idle 30+ min and call it (#231). If it
   fails, keep screens awake / lengthen the timeout.
2. Optional hardening: bind Asterisk's plain `:8088` ws to localhost (only Caddy
   needs it) via a `custom/http.conf`; consider restricting `:5060` if unused.
3. Optional polish: an HA theme from the `design/DESIGN.md` tokens; place the SIP
   contacts card on `TabletView` if not already there.
4. Decide whether to keep the CasaOS-style compose or return to the hand-written
   one, then reconcile it with the committed file.
5. **Later:** SIP trunk to the ISP landline for outbound calls (§7).

## 13. Guardrails for Claude Code
- Never commit secrets or tokens (HA tokens, DuckDNS token, SIP/AMI passwords, TLS keys).
- Keep the whole stack in the single `docker-compose.yml`; comment any
  `devices:` / `network_mode` / `privileged` choice so it's understandable later.
- Don't hand-edit HA's database or `.storage/`; treat `homeassistant/` config as
  human-editable YAML only. SIP Core options go in through the UI form; HA's HTTP
  and reverse-proxy settings are UI-managed (§7) — never add `http:` to YAML.
- Respect the `domain.area_device` naming in every automation, dashboard and query.
- Everything user-facing goes through HA. No custom frontend app, no direct
  browser-to-device APIs. Intercom = SIP Core + Asterisk only.
- Asterisk passwords come from `asterisk/generate-secrets.sh`; don't hand-write
  them into config. Don't commit the CasaOS compose rewrite unless asked.

## 14. Reference artifacts (planning, on claude.ai)
These predate the 2026-09-19 decisions: where they describe the custom PWA or a
WebRTC/signaling intercom, **this file wins.**
- **Blueprint** (architecture, phases, shopping list, intercom, tablets):
  https://claude.ai/code/artifact/89c7cee4-7e92-485f-9b5e-11ede0102649
- **Majlis Control** (UI mockup / design target):
  https://claude.ai/code/artifact/c01f7c79-49bf-436f-8dce-6235c03a8314
- **Host Setup** (Debian + Docker runbook):
  https://claude.ai/code/artifact/cb9f605b-edcb-4886-a65c-06ee7cb9a9e1
