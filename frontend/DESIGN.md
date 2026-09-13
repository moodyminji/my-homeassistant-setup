# Majlis Frontend — Design Spec & Build Rules

**This is the visual source of truth for the Majlis dashboard.** The companion
file `majlis-dashboard-reference.html` is the approved mockup. Your job when
building the frontend is to **reproduce that mockup faithfully** in the app
stack — not to design something new. When in doubt, open the reference and match
it pixel-for-pixel.

> **Golden rule:** PORT the reference, don't reinvent it. Lift its exact colors,
> fonts, spacing, radii, component structure, and interactions. If your output
> doesn't look like `majlis-dashboard-reference.html`, it's wrong.

---

## 0. How to use this file
1. Open `majlis-dashboard-reference.html` in a browser — that is the target.
2. Copy the **design tokens** below verbatim into the app (CSS custom
   properties, or a theme file / Tailwind config).
3. Build each component from §7 to match the reference's markup and states.
4. Meet the **tablet & kiosk requirements** in §6 — this is where the first
   attempt failed.
5. Keep it a single, coherent system: every color comes from a token, never a
   hard-coded hex in a component.

---

## 1. Design tokens — DARK (default theme)
```css
--bg:#0a1211;        /* app background */
--panel:#101d1c;     /* card / tile surface */
--panel-2:#152625;   /* insets, controls at rest */
--panel-3:#1c302e;   /* slider tracks, chips */
--ink:#eaf1ef;       /* primary text */
--ink-2:#c3d0cd;     /* secondary text */
--muted:#8b9a97;     /* tertiary / labels */
--faint:#63726f;     /* faintest / icons off */
--line:#22332f;      /* hairline borders */
--line-2:#2c403c;    /* stronger borders */
--accent:#25c6bb;    /* THE accent (teal) */
--accent-2:#39d9cd;  /* accent hover/bright */
--accent-ghost:#25c6bb1c; /* accent @ ~11% for fills */
--on:#3fd08a;        /* semantic: on / active / good */
--on-ghost:#3fd08a1c;
--heat:#f0a34b;      /* semantic: heat / lights-warm */
--heat-ghost:#f0a34b22;
--cool:#4aa8f0;      /* semantic: cooling */
--cool-ghost:#4aa8f022;
--alert:#ef6b81;     /* semantic: alert / recording dot */
```

## 2. Design tokens — LIGHT theme
```css
--bg:#e7ecea; --panel:#ffffff; --panel-2:#f1f5f3; --panel-3:#e6ece9;
--ink:#122120; --ink-2:#384744; --muted:#5d6d6a; --faint:#8a9794;
--line:#dce3e0; --line-2:#cfd8d5;
--accent:#0d7c7e; --accent-2:#0a6567; --accent-ghost:#0d7c7e14;
--on:#20a065; --on-ghost:#20a06516;
--heat:#d4842a; --heat-ghost:#d4842a18;
--cool:#2f86d4; --cool-ghost:#2f86d418;
--alert:#c94a60;
```
Theme is **dark by default**. Support a light theme and a theme toggle. Style
components through tokens only, so one variable swap flips the whole UI.

## 3. Typography
- **Display / headings:** Archivo (600–800). Tight tracking (`-0.02em`).
- **Body / labels:** IBM Plex Sans (400–700).
- **Readouts, numbers, entity ids, badges:** IBM Plex Mono. Always
  `font-variant-numeric: tabular-nums` for anything that updates (temps, %, kWh).
- Load from Google Fonts. Uppercase micro-labels get `letter-spacing:.08–.16em`.

## 4. Shape, spacing, elevation
- **Radii:** tiles `18px` (`--r`), controls/insets `12px` (`--r-sm`), pills `99px`.
- **Grid gap:** `14px`. **Tile padding:** `16px`.
- **Shadow (dark):** `0 2px 4px rgba(0,0,0,.3), 0 12px 30px rgba(0,0,0,.28)`.
  Use elevation sparingly — tiles sit on the bg with a hairline `--line` border;
  don't stamp a heavy shadow on everything (that flattens hierarchy).
- Not everything is a card: lead with the climate dial and camera; keep small
  stat tiles quiet.

## 5. Layout
- **Shell:** fixed **left nav rail (76px)** + fluid main. Max content width
  ~1240px, centered.
- **Main grid:** 4 columns, `14px` gap. Tile spans:
  - **Climate** = 2 cols × 2 rows (the hero control).
  - **Camera** = 2 cols. **Energy** = 2 cols. Lights/devices/stats = 1 col.
- **Top status bar:** greeting + room title (left), outdoor weather chip + clock
  + notifications (right).
- **Room/area tabs:** a horizontal, scrollable pill row under the status bar.
- **Scenes:** a 4-column row of scene buttons at the bottom.

## 6. Tablet & kiosk requirements  ← the part that failed before
Design **tablet-first landscape**, since the wall panels are the primary target.
- **Breakpoints:**
  - **≥1024px (landscape tablet / desktop):** full 4-col grid, rail visible.
  - **640–1023px (portrait tablet):** 2-col grid; climate/camera/energy span 2;
    rail still on the left.
  - **≤640px (phone):** single column; rail becomes a bottom bar.
  Reference these exact widths.
- **Touch targets ≥ 44×44px.** Bump interactive bits up for fingers: toggle
  ≥46×28, temp +/- buttons ≥46px circles, **slider thumb ≥28px** on touch,
  scene/room pills tall enough to tap. Never rely on hover for a function.
- **Kiosk polish:** full-viewport, no page scroll on the dashboard (content
  fits the tablet screen); `user-select:none` and
  `-webkit-tap-highlight-color:transparent` for a native app feel;
  `<meta name="viewport" content="width=device-width,initial-scale=1,
  viewport-fit=cover">`; large, legible type at arm's length.
- Test at **1280×800** and **800×1280** — the common tablet resolutions.

## 7. Components (match the reference exactly)
- **Nav rail:** icon buttons, active = accent + `--accent-ghost` pill + a 3px
  accent notch. Theme + settings pinned to the bottom.
- **Weather chip:** sun icon in `--heat`, big temp (Archivo), city + condition.
- **Room tabs:** pills; active pill = solid `--ink` bg with `--bg` text; each
  shows a device count in a mono sub-pill.
- **Climate tile (hero):** circular **dial** = SVG 270° arc, track `--panel-3`,
  progress in `--cool` (or `--heat`/`--accent` by mode), big center temperature
  (Archivo, `°C` superscript), mode label under it. `+/-` circle buttons, mode
  chips (Cool/Fan/Dry/Auto), a power toggle, and a "now / humidity" line.
- **Light tile:** header (LABEL, name, `%· state`) + bulb icon (fills `--heat`
  with a soft glow when on) + a full-width **brightness slider** whose fill goes
  `--heat` when active; tapping the bulb toggles on/off.
- **Device tile:** icon chip + name + state line + toggle; icon chip turns
  `--on-ghost`/`--on` when active. (Lock, plug, vacuum, curtains…)
- **Camera tile:** dark gradient "feed" with a subtle scanline texture, a
  **LIVE** badge (pulsing `--alert` dot) top-left, a **detection box**
  (`--accent-2` outline + label like "person 98%"), and a bottom gradient
  footer with the camera name + status.
- **Energy tile:** big kWh number (Archivo), a delta line in `--on`, and an
  area **sparkline** (accent stroke + faint gradient fill).
- **Stat tiles (air / water heater):** label + one big word + a small detail
  line. Quiet, no accent.
- **Scenes:** buttons with an icon chip, name, and sub-line; active scene =
  solid accent bg with dark text.

## 8. Interaction & behavior
- What's interactive **looks** interactive; state shows in **form** (fill, pill,
  stripe, glow) as well as text — readable at a glance across a room.
- Toggles flip; brightness slider updates the % and the glow live; temp `+/-`
  moves the dial arc; selecting a mode recolors the arc; switching rooms swaps
  the climate readout; selecting a scene highlights it.
- Respect `prefers-reduced-motion`. Transitions ~120–200ms, subtle.
- Bind real HA entities (see CLAUDE.md §6) — but the *look* is this spec.

## 9. Accessibility
- Maintain contrast in both themes (the tokens are tuned for it — don't dim text
  onto same-theme grounds).
- Visible keyboard focus ring (accent, 2px offset). Real `<button>`/`<input>`
  with labels; toggles use `role="switch"` + `aria-checked`.

## 10. Do / Don't
- **Do** copy tokens verbatim; **don't** invent new colors or a new palette.
- **Do** keep the teal accent singular; **don't** let semantic colors (on/heat/
  cool/alert) double as the accent.
- **Do** build tablet-first with real touch targets; **don't** ship a desktop-
  only layout that can't be tapped.
- **Don't** reach for the generic "AI dashboard" look (purple gradients, emoji
  section headers, everything centered, one shadow on every card). Match the
  reference instead.

---

## 11. Prompt to give Claude Code
Paste this in the repo with both files present:

> Read `frontend/DESIGN.md` and open `frontend/design-reference/majlis-dashboard-reference.html`.
> Build the dashboard in our Svelte + Vite PWA as a **faithful port** of that
> reference — same layout, tokens, components, and interactions. Copy the design
> tokens verbatim into a theme file and style everything through them (dark
> default + light theme + toggle). It must be **tablet-first**: 4-col grid at
> ≥1024px, 2-col at 640–1023px, single column ≤640px; all touch targets ≥44px;
> no page scroll in kiosk; slider thumbs ≥28px. Componentize (NavRail, TopBar,
> RoomTabs, ClimateTile, LightTile, DeviceTile, CameraTile, EnergyTile,
> SceneRow) but keep each visually identical to the reference. Wire real HA
> entities via home-assistant-js-websocket per CLAUDE.md §6, rendering by area.
> Do NOT redesign or "improve" the look — if it doesn't match the reference,
> it's wrong. Show me the ClimateTile and one room first for approval before
> building the rest.
