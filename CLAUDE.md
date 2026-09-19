# Majlis — Whole-Home Automation

Project memory for Claude Code. Read this first; it carries the decisions made
during planning so coding sessions start with full context. Keep it current as
decisions change.

---

## 1. What this is
A whole-home smart-home unification for a **new 3-floor house in Muscat, Oman**.
Goal: pull Tuya/Smart Life, other Wi-Fi gear, Zigbee/Z-Wave/BLE, cameras, locks,
and split-AC units out of separate vendor apps into one **local-first** system on
**Home Assistant**, fronted by a **custom UI I build myself**. The system must be
**scalable**: adding a device later should require zero UI code changes.

## 2. The one architectural rule (don't violate this)
Devices talk to Home Assistant; **the frontend talks ONLY to Home Assistant**,
never directly to a device. HA normalises everything into *entities*. This
decoupling is the entire point — replacing a cloud Tuya bulb with a local Zigbee
one later must not touch a line of UI code. Anything that reaches around HA to a
device API is a design smell.

## 3. Infrastructure
- **Host:** repurposed Lenovo IdeaPad 3 — i3 10th-gen, 6 GB RAM, 256 GB SSD.
  Headless **Ubuntu Server (LTS)**. Laptop battery = built-in UPS. Lid-close set to ignore
  so it runs closed. Reached at `majlis.local` (DHCP-reserved IP).
- **Runtime:** Docker + Docker Compose — deliberately NOT HAOS, so my UI and
  intercom are just more containers beside HA. One `docker-compose.yml` is the
  source of truth for the whole stack.
- **Repo:** `~/majlis`, Git-versioned — the house is treated as a codebase.
- **RAM ceiling (important):** 6 GB comfortably runs HA + Mosquitto +
  Zigbee2MQTT + the frontend + a tiny signaling server. **Frigate** (camera AI)
  is the memory hog and is deferred to Phase 3, when a mini PC (N100/i5, 16 GB)
  may join as the main brain or a dedicated Frigate box. Keep new services lean.

## 4. Repo layout (target)
```
~/majlis/
  docker-compose.yml        # single source of truth for the stack
  .env                      # non-secret env (TZ, puids); committed
  .gitignore
  homeassistant/            # HA config volume (NOT committed wholesale — see §9)
  mosquitto/
    config/mosquitto.conf
  zigbee2mqtt/
    configuration.yaml
  signaling/                # WebRTC signaling server (Node) — intercom
    server.js, package.json, Dockerfile
  frontend/                 # the custom PWA (Svelte or React + Vite)
    src/ ...
```

## 5. Stack (containers)
- **homeassistant** — `ghcr.io/home-assistant/home-assistant:stable`,
  `network_mode: host` (required for discovery/mDNS), `privileged: true`,
  volume `./homeassistant:/config`, `TZ=Asia/Muscat`.
- **mosquitto** — Eclipse Mosquitto 2, the common MQTT bus. Give it a real
  listener + authenticated user (no anonymous). Config in `./mosquitto/config`.
- **zigbee2mqtt** — `koenkk/zigbee2mqtt`. Prefer Z2M over ZHA for device
  coverage. Pass the coordinator by its **`/dev/serial/by-id/…`** path, never
  `ttyUSB0` (which renumbers on reboot). Talks to `mosquitto`.
- **signaling** — small Node WebSocket server brokering WebRTC intercom
  handshakes between panels (see §7). Featherweight; fine on 6 GB.
- **frontend** — the custom PWA (see §6). Added once HA has real entities.
- **Later:** `frigate` (cameras, Phase 3); `asterisk` ONLY if a SIP-only video
  door station is added (see §7).

## 6. Custom frontend
- **Stack:** Svelte (preferred — its reactivity maps cleanly onto a stream of
  entity states) or React, with Vite, built as an installable **PWA**. One
  codebase serves phone, desktop, and the three wall tablets.
- **HA connection:** use the official `home-assistant-js-websocket` library.
  WebSocket API for live state (subscribe once, get pushed every change); REST
  for one-offs. Auth with a **long-lived access token** from the HA profile,
  kept out of the repo. Shape of it:
  ```js
  import { createConnection, createLongLivedTokenAuth,
           subscribeEntities, callService } from "home-assistant-js-websocket";
  const auth = createLongLivedTokenAuth(HA_URL, TOKEN);
  const conn = await createConnection({ auth });
  subscribeEntities(conn, (entities) => store.set(entities)); // drives UI
  // command: callService(conn, "light", "turn_on", { brightness_pct: 60 },
  //                       { entity_id: "light.majlis_ceiling" });
  ```
- **Render by *area*, not by device.** Read HA areas/floors and group entities by
  area, so a new device assigned to a room in HA appears automatically — no code
  change. This is how §1's scalability rule shows up in the UI layer.
- **Division of labour:** HA owns automations, history, alerts, presence. The
  frontend is the *face* only — do not reimplement HA's engine in the app.
- **Offline/resilience:** handle socket reconnects gracefully (the library does
  most of it); cache last-known entity state so panels aren't blank on a blip.

## 7. Intercom — WebRTC (revised decision)
> **UNDER REVISION (2026-09-19):** moving to **SIP via Asterisk**, with the client
> (browser SIP Core vs a native SIP app on the tablets) chosen by the Phase 0 tests
> in §12. The WebRTC/signaling plan below is superseded once that is settled; a
> mic-over-HTTP test comes first because browsers only expose the microphone on
> secure origins, which applies to *any* browser-based intercom, this plan included.
- **Approach:** browser-native **WebRTC inside the PWA** for panel-to-panel
  voice/video and "page the whole house". Media flows peer-to-peer directly
  tablet-to-tablet on the LAN — lowest latency, no app to install, part of the
  frontend codebase.
- **Signaling:** WebRTC needs a small broker to introduce peers (exchange
  SDP + ICE). That's the `signaling` container — a lightweight Node WebSocket
  server. **No TURN server needed** on a single LAN (coturn is only for
  internet/NAT traversal).
- **Broadcast/announce** (one-way "dinner's ready"): TTS/audio pushed to all
  panels via HA — simpler, separate from calling.
- **go2rtc** (bundled with HA) already speaks WebRTC and is the standard for
  two-way audio with cameras/doorbells — lean on it for camera intercom.
- **SIP/Asterisk:** NOT used for tablet-to-tablet. Only add a small Asterisk if a
  physical **video door station** (Dahua/Hikvision) that speaks SIP-only is
  installed — and even then it just *bridges* the door station to WebRTC browser
  clients, so tablets stay app-free.

## 8. Wall panels
- 3 identical large **Android** tablets (real Android, Play Store), one per
  floor, running the PWA in **Fully Kiosk Browser**. Not Amazon Fire (locked
  FireOS, ads, weak camera for video intercom).
- Prefer **LCD not OLED** (static dashboards burn OLED in).
- Charge-limit each tablet to ~40–80% via a smart plug + HA automation to spare
  the battery from 24/7 full charge.

## 9. Conventions
- **Entity naming:** `domain.area_device` — e.g. `light.kitchen_ceiling`,
  `sensor.majlis_temp`, `climate.master_ac`. Assign every device an **area**;
  group areas into **floors**. Non-negotiable — the UI and automations depend on
  it.
- **Secrets:** never commit. HA `secrets.yaml`, the long-lived token, MQTT
  creds, `.env` secrets all stay out of Git. `.gitignore` should exclude
  `homeassistant/` runtime (`*.db*`, `.storage/`, `secrets.yaml`),
  `frontend/node_modules/`, and any token files. Commit *config structure*
  (compose file, dashboards, automations, z2m/mosquitto configs), not runtime.
- **Local-first:** for Tuya prefer `tuya-local` (HACS) or reflash to ESPHome
  over the cloud integration; prefer Zigbee/ESPHome gear for new purchases.

## 10. Design language (match the mockup) — OS-style, multi-page
**PORT, don't reinvent.** The frontend is an **OS shell with 9 pages**, not one
dashboard. Approved references (in `frontend/design-reference/`):
`majlis-os-reference.html` (primary — full shell + all pages) and
`majlis-dashboard-reference.html` (room-detail component close-up). Full spec,
exact tokens, and the page architecture are in `frontend/DESIGN.md` (see §11 for
the page map, §12 for the build prompt) — read it and reproduce the references
faithfully (tablet-first). If the output doesn't look like the reference, it's
wrong. Pages: Home (launcher), Rooms, Devices, Apps, Automations, Energy,
Security, Intercom, Settings. Also viewable as **"Majlis OS"**:
https://claude.ai/code/artifact/c983b391-2ffa-4ec7-86c2-198baf7dab41
Design feel, in brief:
- **Aesthetic:** dark control-panel by default, with a proper light theme too
  (theme-aware). Calm, glassy, information-dense but not cluttered.
- **Palette:** teal accent (`#25c6bb` on dark / `#0d7c7e` on light), deep
  blue-green neutrals; semantic colors kept separate from the accent — warm
  amber for climate/heat, blue for cooling, soft green for "on/active".
- **Type:** Archivo (display/headings), IBM Plex Sans (body), IBM Plex Mono
  (readouts, entity ids, numbers — use `tabular-nums`).
- **Key components:** left nav rail; top status bar (greeting, outdoor weather,
  clock); horizontal **room/area tabs**; a **climate dial** with +/- and mode
  chips; **light tiles** with a brightness slider that glows warm when on;
  small device tiles with toggles; a **camera tile** with a live badge and
  Frigate detection box; an **energy** tile with a sparkline; a **scenes** row.
- **Interaction:** what's interactive looks interactive; state shows in *form*
  (pill/among/stripe) as well as text; responsive down to phone width.

## 11. Current state
- **HA is fully deployed across the house and working well** (as of 2026-09-19):
  ~750 entities in 14 areas, and HA's own **TabletView** dashboards
  (`dashboard-tabletview`, `tabletview-test`) already serve the tablets. All
  devices are working. **The only piece left is the intercom.**
- All 3 wall tablets are in hand (Fully Kiosk).
- **Decided:** the UI is **HA dashboards** — the custom PWA (`frontend/`, on git
  history up to `cada20d`) is to be retired, after Phase 0. Intercom scope is the
  3 tablets only.
- **Later, not now:** SIP calling **out** to external numbers over the ISP's
  landline. Asterisk suits this (a PJSIP trunk), so choosing it now leaves the
  door open. Open questions for then: does the ISP give SIP credentials, or is
  the landline an analog port on its router (then an ATA/FXO gateway is needed)?

## 12. Immediate next tasks
Plan agreed 2026-09-19 (the intercom is all that's left):
- **Phase 0 — prove the call path on one tablet (no Docker):**
  - 0a. Serve a plain-HTTP mic test page on the LAN; try it in Fully Kiosk, and
    in Chrome with `chrome://flags/#unsafely-treat-insecure-origin-as-secure`.
  - 0b. Native SIP app (Linphone) between two tablets: rings while Fully Kiosk is
    in the foreground and with the screen off, two-way audio, still rings after
    30+ min idle.
- **Decided (owner): SIP Core + Asterisk**, in-dashboard calling. No HA add-ons
  here (no Supervisor), so Asterisk is a compose container running the same image
  as the add-on (`ghcr.io/tech7fox/asterisk-hass-addon`), and SIP Core comes via
  HACS. **Proven 2026-09-19:** a real call (tablet 201 <-> PC 900) was answered
  and bridged with two-way audio in **Chrome/Edge with the flag**
  `unsafely-treat-insecure-origin-as-secure` on plain http (the entry must match the
  HA page's exact origin incl. port). **The HA Companion app does NOT work over
  plain http**: it rings, but Answer does nothing — the mic is blocked on an
  insecure page, apps have no flag, and the app maintainers closed "mic over http"
  (#3512, #4468) as not planned. A Chrome tab also can't go fullscreen.
- **Decided (owner) 2026-09-19: real HTTPS certificate**, so every client (HA app,
  Fully Kiosk, Chrome, phones) just works with no per-device setup. A free
  DuckDNS name (`SITE_HOST` in `.env`) is pointed at the host's LAN IP; the
  `caddy` container gets a Let's Encrypt cert via the DNS-01 challenge (token in
  `.env.secrets`; only renewal needs internet) and serves `https://$SITE_HOST`,
  proxying `/` to HA (`:8123`, which stays open on http for everything else) and
  `/ws` to Asterisk (`:8088`). SIP Core's `custom_wss_url` becomes
  `wss://$SITE_HOST/ws`. HA must trust Caddy as a reverse proxy, but **in HA
  2026.9 the `http` settings are UI-managed** (Settings > System > Network) and
  the YAML `http:` block is migrated once then IGNORED (a Repair says so) — so do
  NOT put `http:` in `configuration.yaml`; enable the reverse-proxy option in the
  UI and trust `127.0.0.1` and `::1`. Without it every proxied request gets a 400
  ("not set-up for reverse proxies"). Tablets then use the **HA app** at
  `https://$SITE_HOST`.
  **PROVEN WORKING 2026-09-19** (owner: "works beautifully"): `minjihome.duckdns.org`
  resolves to the LAN IP (router does not filter it), Caddy holds a valid Let's
  Encrypt cert (first issued 2026-09-19, auto-renews; needs internet +
  `DUCKDNS_TOKEN`), `/ws` reaches Asterisk, and calls were answered and bridged in
  every combination: tab2 -> tab1 (202 -> 201), PC -> tab1, tab1 -> PC. SIP Core bug
  #190 did NOT bite. The Chrome flag / Linphone fallbacks were not needed (if ever
  needed: on https Chrome offers a real "Install app" = fullscreen PWA, no flag).
  Remaining risk: #231 — a tablet whose page is backgrounded/asleep loses its SIP
  registration, so it must stay awake on the dashboard to be reachable.
- **Phase 1 — built and working:** pinned `asterisk` service in
  `docker-compose.yml` (running), `asterisk/roster.csv` (201–203 tablets, 900
  guest), `asterisk/generate-secrets.sh` (all secrets gitignored; WebSocket at
  `wss://$SITE_HOST/ws` via Caddy), SIP Core installed via HACS with its options
  pasted (Settings > Devices & services > SIP Core > Configure; an existing
  install can change just `custom_wss_url` without rotating passwords).
  Extensions: 201 tab1, 202 tab2, 203 tab3, 900 = any other HA user. A user must
  be logged in (page open) to be reachable. **Still to do:** confirm tab3 (203),
  test a tablet left idle 30+ min, keep screens on (#231), and keep `asterisk/`
  hardening in mind (Asterisk's plain `:8088` ws and SIP `:5060` are open on the
  LAN; only Caddy needs to reach 8088).
- **Phase 2 — UI:** add an Intercom card to the existing TabletView dashboard,
  then remove `frontend/`, move `DESIGN_1.md` + `majlis-os-reference.html` to
  `design/`, and rewrite §1–2, §4–8, §10, §13 to match (HA dashboards + SIP).
- **Phase 4 (later):** SIP trunk to the ISP landline for outbound calls.

## 13. Guardrails for Claude Code
- Never commit secrets or tokens.
- Keep the whole stack in the single `docker-compose.yml`; comment any
  `devices:` / `network_mode` / `privileged` choice so it's understandable later.
- Don't hand-edit HA's database or `.storage/`; treat `homeassistant/` config as
  human-editable YAML only.
- Respect the `domain.area_device` naming in every automation, dashboard, query,
  and UI component.
- Frontend talks only to HA (§2). Intercom media is WebRTC P2P; only the
  handshake goes through the signaling server.

## 14. Reference artifacts (planning, on claude.ai)
- **Blueprint** (architecture, phases, shopping list, intercom, tablets):
  https://claude.ai/code/artifact/89c7cee4-7e92-485f-9b5e-11ede0102649
- **Majlis Control** (UI mockup / design target):
  https://claude.ai/code/artifact/c01f7c79-49bf-436f-8dce-6235c03a8314
- **Host Setup** (Debian + Docker runbook):
  https://claude.ai/code/artifact/cb9f605b-edcb-4886-a65c-06ee7cb9a9e1
