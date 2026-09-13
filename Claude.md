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
- **Host:** repurposed Lenovo IdeaPad 3 — i3 10th-gen, headless
  **Ubuntu Server (LTS)** (actual RAM on the deployed box is ~3.3 GB, not
  6 GB — keep new services lean). Laptop battery = built-in UPS. Lid-close
  set to ignore so it runs closed. Hostname is `majlis`, but **reach it by its
  DHCP-reserved IP, `192.168.100.199`, not `majlis.local`** — the ISP-locked
  router (Huawei HG8245W5) doesn't forward mDNS multicast between its Wi-Fi
  and wired segments and exposes no IGMP proxy/multicast-forwarding setting
  to fix it, so `.local` resolution never reaches other devices on the LAN
  even though avahi is running correctly on the host itself.
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

## 10. Design language (match the mockup)
A high-fidelity interactive mockup already exists — **"Majlis Control"**:
https://claude.ai/code/artifact/c01f7c79-49bf-436f-8dce-6235c03a8314
Build the frontend to match its feel:
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
- Host is up: Ubuntu Server, Docker + Compose, hostname `majlis`. Repo is
  git-initialized at `~/majlis` with `homeassistant` + `mosquitto` running via
  `docker-compose.yml`. Reach HA at `http://192.168.100.199:8123` (see §3 for
  why `majlis.local` doesn't work). HA onboarding is complete (admin account
  created). Mosquitto has an authenticated listener (`allow_anonymous false`);
  credentials known only to the user, not stored in the repo.
- `zigbee2mqtt` is defined in `docker-compose.yml` but not started — no
  coordinator dongle plugged in yet. `ZIGBEE_DONGLE_PATH` in `.env` is a
  placeholder until then.
- `frontend/` is scaffolded: Vite + Svelte + TypeScript PWA, `home-assistant-js-websocket`
  wired up via long-lived token auth (`frontend/.env.local`, gitignored — copy
  from `.env.local.example`). Entities are grouped by HA area via
  `src/lib/ha/stores.ts` (`areaGroups`) — **every area defined in HA gets a
  tab, none hardcoded** (note: "Majlis" is this whole project's/house's name,
  not a literal HA area — don't filter to an area called that). `App.svelte`
  renders area tabs + tiles with toggle, live end-to-end. No areas are
  configured in HA yet, so it currently renders the "no areas" empty state.
- `signaling/` not started yet.

## 12. Immediate next tasks (dev)
1. ~~Extend `docker-compose.yml` with mosquitto + zigbee2mqtt.~~ Mosquitto
   done; zigbee2mqtt is waiting on the coordinator dongle.
2. ~~Scaffold `frontend/`~~ done — next: verify live entity flow once a real
   device/area exists in HA (`npm run dev` in `frontend/`, confirm a toggle
   round-trips through HA), then start building out the real UI per §10's
   design language (currently just minimal tiles, not the full mockup).
3. Build the `signaling` Node server + a minimal WebRTC call between two panels.
4. Onboard the first room fully as the reference pattern for the rest.

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