#!/usr/bin/env python3
"""Generate homeassistant/dashboards/tablet.yaml (the liquid-glass tablet dashboard).

Why a generator: every page shares the same header, left rail and right-hand
clock/weather column, and there is one page per room. Writing that by hand is long
and easy to break. Edit the constants below (rooms, colours, tablet names), then run:

    python3 homeassistant/dashboards/build_tablet.py

and refresh the tablet -- no HA restart is needed for dashboard changes. tablet.yaml
is generated: do not edit it by hand. Needs PyYAML (python3 -c "import yaml").

Live values (lights on, AC running, per-room status) are computed in the browser
from HA's own registries (hass.entities / hass.devices), so a new device in an
existing room shows up with no change here.
"""
import copy
import pathlib

import yaml

OUT = pathlib.Path(__file__).with_name("tablet.yaml")
BASE = "/tablet-glass"

# ---- palette: GRAPHITE. Rail/room icons are neutral 'mono'; colour is reserved for meaning:
#      amber = a light is on, blue = cooling, green = locked. (rgb triples: JS/CSS add alpha) ----
C = dict(amber="255,200,87", blue="77,163,255", violet="167,139,250", green="111,220,140",
         rose="255,123,156", teal="37,198,187", orange="255,154,60", mono="207,216,220")

# ---- rooms: (area_id from HA, area name, icon, colour). The first 9 show on Home. ------
ROOMS = [
    ("majlis", "Majlis", "mdi:sofa-outline", "mono"),
    ("family_room", "Family Room", "mdi:television", "mono"),
    ("living_room", "Living Room", "mdi:sofa", "mono"),
    ("kitchen", "Kitchen", "mdi:silverware-fork-knife", "mono"),
    ("bedroom", "Master Bedroom", "mdi:bed-king", "mono"),
    ("mohammed_s_bedroom", "Mohammed's Bedroom", "mdi:bed", "mono"),
    ("guest_room", "Guest Room", "mdi:bed-empty", "mono"),
    ("outdoor", "Outdoor", "mdi:outdoor-lamp", "mono"),
    ("garden", "Garden", "mdi:flower", "mono"),
    ("guest_bedroom_fl1", "Guest Bedroom FL1", "mdi:bed-empty", "mono"),
    ("housemade_room", "Housemade Room", "mdi:broom", "mono"),
    ("living_hall_fl1", "Living Hall FL1", "mdi:sofa", "mono"),
    ("living_hall_fl2", "Living Hall FL2", "mdi:sofa", "mono"),
    ("bbq_area_and_swimming_pool", "BBQ & Pool", "mdi:grill", "mono"),
]
HOME_ROOMS = 9

# WallPanel screensaver (HACS plugin lovelace-wallpanel v3.43). Seconds of no touch before it starts.
# The old TabletView used 10 s and WallPanel's default photo source (random pictures from the
# internet, picsum.photos). Here: no photos, just a clock + weather, fully local.
WALLPANEL_IDLE_S = 120

# ---- the left rail: (label, icon, view path, colour) -----------------------------------
RAIL = [
    ("Lighting", "mdi:lightbulb-group", "lighting", "mono"),
    ("Climate", "mdi:air-conditioner", "climate", "mono"),
    ("Media", "mdi:television-play", "media", "mono"),
    ("Garden", "mdi:sprinkler-variant", "garden", "mono"),
    ("Doors & locks", "mdi:door-closed-lock", "doors", "mono"),
]

# HA user name (lower-case) -> where that tablet lives; matches the SIP contacts card.
TABLETS = {"tab1": "Family Room", "tab2": "Kitchen", "tab3": "First Floor"}

FULL = {"columns": "full"}

# JS shared by the live cards. `hass` is the HA object button-card exposes to templates.
JS_HELPERS = """
const ent = Object.values(hass.entities || {});
const st = (id) => (hass.states[id] || {}).state;
const areaOf = (e) => e.area_id || ((hass.devices || {})[e.device_id] || {}).area_id;
const isLight = (e) => e.platform === 'tuya_local' && e.entity_id.startsWith('switch.') && e.entity_id !== 'switch.pump';
const acRunning = (e) => e.entity_id.startsWith('climate.') && !['off', 'unavailable', 'unknown'].includes(st(e.entity_id));
const verb = {cool: 'Cooling', heat: 'Heating', dry: 'Drying', fan_only: 'Fan', auto: 'Auto', heat_cool: 'Auto'};
"""


def js(body: str) -> str:
    return "[[[\n" + JS_HELPERS + body.strip() + "\n]]]"


GLASS_EDGE = "inset 0 1px 0 rgba(255,255,255,0.22), 0 8px 22px rgba(0,0,0,0.22)"
ACTIVE_BG = "linear-gradient(135deg, rgba(255,193,77,0.20), rgba(255,193,77,0.07))"
ACTIVE_EDGE = "rgba(255,193,77,0.40)"
ACCENT = "linear-gradient(135deg,#ffc94d,#ffab1a)"
GLASS_FILL = "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.025))"


def chip_css(size=44):
    """The coloured rounded-square behind each icon (soft glow, not loud)."""
    return [
        {"width": f"{size}px"}, {"height": f"{size}px"}, {"border-radius": "34%"},
        {"display": "grid"}, {"place-items": "center"},
        {"background": "[[[ return 'rgba(' + variables.c + ',0.18)'; ]]]"},
        {"box-shadow": "[[[ return 'inset 0 1px 0 rgba(255,255,255,.22), 0 0 14px rgba(' + variables.c + ',.16)'; ]]]"},
    ]


def templates():
    active = "location.pathname.endsWith('/' + variables.path)"
    return {
        # left-rail button; the page you are on lights up teal
        "glass_rail": {
            "variables": {"path": "home", "c": C["mono"]},
            "show_state": False, "show_label": False,
            "styles": {
                "grid": [{"grid-template-areas": '"i n"'}, {"grid-template-columns": "58px 1fr"}, {"align-items": "center"}],
                "card": [{"height": "74px"}, {"padding": "0 16px"}, {"border-radius": "24px"},
                         {"border": f"[[[ return {active} ? '1px solid {ACTIVE_EDGE}' : '1px solid rgba(255,255,255,0.09)'; ]]]"},
                         {"box-shadow": GLASS_EDGE},
                         {"background": f"[[[ return {active} ? '{ACTIVE_BG}' : '{GLASS_FILL}'; ]]]"}],
                "img_cell": chip_css(44),
                "icon": [{"width": "23px"}, {"color": "[[[ return 'rgb(' + variables.c + ')'; ]]]"}],
                "name": [{"justify-self": "start"}, {"font-size": "17px"}, {"font-weight": "600"}, {"color": "#eceff1"}],
            },
        },
        # segmented tab: every tab is a glass pill, the current one is teal
        "glass_tab": {
            "variables": {"path": "home"},
            "show_state": False, "show_label": False,
            "styles": {
                "grid": [{"grid-template-areas": '"i n"'}, {"grid-template-columns": "auto auto"},
                         {"justify-content": "center"}, {"column-gap": "9px"}, {"align-items": "center"}],
                "card": [{"height": "46px"}, {"padding": "0 20px"}, {"border-radius": "999px"},
                         {"border": f"[[[ return {active} ? '1px solid rgba(255,255,255,.30)' : '1px solid rgba(255,255,255,.09)'; ]]]"},
                         {"box-shadow": f"[[[ return {active} ? '0 4px 16px rgba(255,171,26,.35), inset 0 1px 0 rgba(255,255,255,.40)' : 'inset 0 1px 0 rgba(255,255,255,.18)'; ]]]"},
                         {"background": f"[[[ return {active} ? '{ACCENT}' : '{GLASS_FILL}'; ]]]"}],
                "icon": [{"width": "20px"}, {"color": f"[[[ return {active} ? '#241a00' : 'rgba(236,239,241,.75)'; ]]]"}],
                "name": [{"font-size": "16px"}, {"font-weight": "600"},
                         {"color": f"[[[ return {active} ? '#241a00' : 'rgba(236,239,241,.8)'; ]]]"}],
            },
        },
        # status card on Home (icon chip + number + caption)
        "glass_stat": {
            "variables": {"c": C["amber"]},
            "show_state": False, "show_label": True,
            "styles": {
                "grid": [{"grid-template-areas": '"i n" "i l"'}, {"grid-template-columns": "60px 1fr"},
                         {"grid-template-rows": "1fr 1fr"}, {"align-items": "center"}, {"column-gap": "4px"}],
                "card": [{"height": "104px"}, {"padding": "0 18px"}, {"border-radius": "24px"}],
                "img_cell": chip_css(46),
                "icon": [{"width": "24px"}, {"color": "[[[ return 'rgb(' + variables.c + ')'; ]]]"}],
                "name": [{"justify-self": "start"}, {"align-self": "end"}, {"font-size": "30px"}, {"font-weight": "600"},
                         {"line-height": "1.05"}, {"color": "#eceff1"}, {"white-space": "nowrap"}, {"overflow": "visible"}],
                "label": [{"justify-self": "start"}, {"align-self": "start"}, {"font-size": "13px"}, {"margin-top": "5px"},
                          {"color": "rgba(236,239,241,.66)"}, {"text-align": "left"}, {"white-space": "normal"},
                          {"line-height": "1.2"}],
            },
        },
        # room tile (icon chip, room name, live one-line summary)
        "glass_room": {
            "variables": {"c": C["mono"], "area": "majlis"},
            "show_state": False, "show_label": True,
            "styles": {
                "grid": [{"grid-template-areas": '"i n" "i l"'}, {"grid-template-columns": "52px 1fr"},
                         {"grid-template-rows": "1fr 1fr"}, {"align-items": "center"}],
                "card": [{"height": "82px"}, {"padding": "0 14px"}, {"border-radius": "22px"}],
                "img_cell": chip_css(40),
                "icon": [{"width": "21px"}, {"color": "[[[ return 'rgb(' + variables.c + ')'; ]]]"}],
                "name": [{"justify-self": "start"}, {"align-self": "end"}, {"font-size": "15px"}, {"font-weight": "600"},
                         {"color": "#eceff1"}, {"text-align": "left"}, {"line-height": "1.15"}, {"white-space": "normal"}],
                "label": [{"justify-self": "start"}, {"align-self": "start"}, {"font-size": "12.5px"}, {"margin-top": "3px"},
                          {"color": "rgba(236,239,241,.64)"}, {"text-align": "left"}, {"line-height": "1.15"},
                          {"white-space": "normal"}],
            },
        },
        # the clock: same card family as everything else so it looks consistent
        "glass_clock": {
            "show_icon": False, "show_state": False, "show_label": True,
            "triggers_update": "all",
            "styles": {
                "grid": [{"grid-template-areas": '"c" "n" "l"'}, {"justify-items": "center"}, {"row-gap": "0px"}],
                "card": [{"padding": "18px 8px 16px"}, {"border-radius": "24px"}],
                "custom_fields": {"city": [{"font-size": "11.5px"}, {"letter-spacing": "3px"}, {"font-weight": "600"},
                                           {"color": "#ffc94d"}, {"margin-bottom": "2px"}]},
                "name": [{"font-size": "70px"}, {"font-weight": "200"}, {"line-height": "1.05"}, {"letter-spacing": "-1px"},
                         {"color": "#eceff1"}],
                "label": [{"font-size": "15px"}, {"color": "rgba(236,239,241,.72)"}, {"margin-top": "2px"}],
            },
        },
    }


# ---------------------------------------------------------------------------- shared parts
def rail_cards():
    return [{"type": "custom:button-card", "template": "glass_rail", "name": n, "icon": i,
             "variables": {"path": p, "c": C[c]}, "grid_options": dict(FULL),
             "tap_action": {"action": "navigate", "navigation_path": f"{BASE}/{p}"}} for n, i, p, c in RAIL]


def header_section():
    tabs = [("Home", "mdi:home-variant", "home"), ("Intercom", "mdi:phone-in-talk", "intercom"),
            ("Rooms", "mdi:floor-plan", "rooms")]
    where = js("const w = %r; const n = ((hass.user || {}).name || '').toLowerCase(); return w[n] || (hass.user || {}).name || 'Tablet';" % TABLETS)
    plain = [{"background": "none"}, {"border": "none"}, {"box-shadow": "none"}, {"backdrop-filter": "none"},
             {"-webkit-backdrop-filter": "none"}]
    return {"type": "grid", "column_span": 4, "cards": [
        {"type": "custom:button-card", "grid_options": {"columns": 12}, "show_icon": False, "show_state": False,
         "show_label": True,
         "name": js("const h = new Date().getHours(); return h < 12 ? 'Good morning' : (h < 17 ? 'Good afternoon' : 'Good evening');"),
         "label": "Welcome home",
         "styles": {"card": plain + [{"padding": "4px 6px"}],
                    "grid": [{"grid-template-areas": '"n" "l"'}, {"justify-items": "start"}],
                    "name": [{"font-size": "27px"}, {"font-weight": "600"}, {"color": "#eceff1"}],
                    "label": [{"font-size": "14px"}, {"color": "rgba(236,239,241,.6)"}]}},
        {"type": "grid", "columns": 3, "square": False, "grid_options": {"columns": 24},
         "cards": [{"type": "custom:button-card", "template": "glass_tab", "name": n, "icon": i, "variables": {"path": p},
                    "tap_action": {"action": "navigate", "navigation_path": f"{BASE}/{p}"}} for n, i, p in tabs]},
        {"type": "custom:button-card", "grid_options": {"columns": 12}, "icon": "mdi:tablet", "name": where,
         "label": "This tablet", "show_state": False, "show_label": True,
         "styles": {"card": [{"height": "52px"}, {"border-radius": "999px"}, {"padding": "0 18px"}, {"width": "max-content"},
                             {"margin-left": "auto"}],
                    "grid": [{"grid-template-areas": '"i n" "i l"'}, {"grid-template-columns": "30px auto"}, {"align-items": "center"}],
                    "icon": [{"width": "20px"}, {"color": "#6fdc8c"}],
                    "name": [{"justify-self": "start"}, {"font-size": "14.5px"}, {"font-weight": "600"}, {"color": "#eceff1"}],
                    "label": [{"justify-self": "start"}, {"font-size": "11.5px"}, {"color": "rgba(236,239,241,.58)"}]}},
    ]}


def side_section():
    clock_time = js("""
const d = new Date();
const h = d.getHours() % 12 || 12;
return h + ':' + String(d.getMinutes()).padStart(2, '0') + '<span style="font-size:19px;font-weight:400;opacity:.7;margin-left:6px">' + (d.getHours() < 12 ? 'AM' : 'PM') + '</span>';
""")
    clock_date = js("return new Date().toLocaleDateString('en-GB', {weekday: 'long', day: 'numeric', month: 'long'});")
    return {"type": "grid", "column_span": 1, "cards": [
        {"type": "custom:button-card", "template": "glass_clock", "grid_options": dict(FULL),
         "custom_fields": {"city": "MUSCAT"}, "name": clock_time, "label": clock_date},
        {"type": "custom:weather-card", "entity": "weather.forecast_home", "grid_options": dict(FULL)},
        {"type": "tile", "entity": "lock.outdoor_station_lock", "name": "Outdoor station", "vertical": False,
         "features": [{"type": "lock-commands"}], "grid_options": dict(FULL)},
    ]}


def frame(view, center_cards, hidden=False):
    v = {"title": view["title"], "path": view["path"], "icon": view["icon"], "type": "sections",
         "max_columns": 4, "theme": "Majlis Glass"}
    if hidden:
        v["visible"] = False
    v["sections"] = [header_section(),
                     {"type": "grid", "column_span": 1, "cards": rail_cards()},
                     {"type": "grid", "column_span": 2, "cards": center_cards},
                     side_section()]
    return v


def heading(text, icon):
    return {"type": "heading", "heading": text, "icon": icon, "heading_style": "title", "grid_options": dict(FULL)}


def auto_tiles(include, columns=2, exclude=None, sort=None):
    card = {"type": "custom:auto-entities", "show_empty": False, "grid_options": dict(FULL),
            "card": {"type": "grid", "columns": columns, "square": False}, "card_param": "cards",
            "filter": {"include": include}}
    if exclude:
        card["filter"]["exclude"] = exclude
    if sort:
        card["sort"] = {"method": sort}
    return card


LIGHT_TILE = {"type": "tile", "icon": "mdi:lightbulb", "tap_action": {"action": "toggle"}}
AC_FEATURES = [{"type": "climate-hvac-modes", "hvac_modes": ["off", "cool", "dry", "fan_only", "heat", "auto", "heat_cool"]},
               {"type": "target-temperature"}]


def stat(name_js, label_js, icon, colour, tap):
    return {"type": "custom:button-card", "template": "glass_stat", "icon": icon, "variables": {"c": C[colour]},
            "name": name_js, "label": label_js, "tap_action": {"action": "navigate", "navigation_path": f"{BASE}/{tap}"}}


def room_tile(rid, name, icon, colour):
    label = js("""
const A = variables.area;
const mine = ent.filter((e) => areaOf(e) === A && !e.hidden && !e.entity_category);
const lights = mine.filter(isLight);
const on = lights.filter((e) => st(e.entity_id) === 'on').length;
const climates = mine.filter((e) => e.entity_id.startsWith('climate.'));
const running = climates.filter(acRunning);
const parts = [];
if (lights.length) parts.push(on ? on + (on === 1 ? ' light on' : ' lights on') : 'Lights off');
if (running.length) {
  const a = hass.states[running[0].entity_id];
  const t = a.attributes.current_temperature;
  parts.push((verb[a.state] || 'On') + (t ? ' · ' + Math.round(t) + '°' : ''));
} else if (climates.length) { parts.push('AC off'); }
const water = mine.filter((e) => e.entity_id.startsWith('switch.') && (e.platform === 'rainbird' || e.entity_id === 'switch.pump'));
const wet = water.filter((e) => st(e.entity_id) === 'on').length;
if (water.length) parts.push(wet ? wet + ' watering' : 'Irrigation idle');
return parts.length ? parts.join(' · ') : 'No devices';
""")
    return {"type": "custom:button-card", "template": "glass_room", "name": name, "icon": icon, "label": label,
            "variables": {"c": C[colour], "area": rid},
            "tap_action": {"action": "navigate", "navigation_path": f"{BASE}/room-{rid}"}}


# ---------------------------------------------------------------------------- pages
def home_view():
    lights_n = js("""
const on = ent.filter(isLight).filter((e) => st(e.entity_id) === 'on');
return on.length + '<span style="font-size:20px;font-weight:500;opacity:.65;margin-left:8px">on</span>';
""")
    lights_l = js("""
const on = ent.filter(isLight).filter((e) => st(e.entity_id) === 'on');
if (!on.length) return 'Every light is off';
return on.slice(0, 2).map((e) => (hass.states[e.entity_id].attributes.friendly_name || e.entity_id)).join(', ');
""")
    ac_n = js("""
const r = ent.filter(acRunning);
return r.length + '<span style="font-size:20px;font-weight:500;opacity:.65;margin-left:8px">running</span>';
""")
    ac_l = js("""
const r = ent.filter(acRunning);
if (!r.length) return 'All air conditioning is off';
return 'Cooling · ' + r.slice(0, 3).map((e) => { const t = hass.states[e.entity_id].attributes.current_temperature; return t ? Math.round(t) + '°' : '–'; }).join(' & ');
""")
    lock_n = js("const s = st('lock.outdoor_station_lock') || 'unknown'; return s.charAt(0).toUpperCase() + s.slice(1);")
    centre = [
        {"type": "grid", "columns": 3, "square": False, "grid_options": dict(FULL), "cards": [
            stat(lights_n, lights_l, "mdi:lightbulb-on", "amber", "lighting"),
            stat(ac_n, ac_l, "mdi:snowflake", "blue", "climate"),
            stat(lock_n, "Outdoor station", "mdi:lock", "green", "doors")]},
        heading("Rooms", "mdi:door-open"),
        {"type": "grid", "columns": 3, "square": False, "grid_options": dict(FULL),
         "cards": [room_tile(*r) for r in ROOMS[:HOME_ROOMS]]},
        heading("Air conditioning running", "mdi:snowflake"),
        auto_tiles([{"domain": "climate",
                     "options": {"type": "tile", "features_position": "bottom", "features": [{"type": "target-temperature"}]}}],
                   exclude=[{"state": "off"}, {"state": "unavailable"}, {"state": "unknown"}]),
    ]
    return frame({"title": "Home", "path": "home", "icon": "mdi:home-variant"}, centre)


def intercom_view():
    centre = [
        heading("Call a room", "mdi:phone-in-talk"),
        {"type": "custom:sip-contacts-card", "hide_me": True, "grid_options": dict(FULL), "extensions": {
            "201": {"name": "Family Room", "override_icon": "mdi:sofa"},
            "202": {"name": "Kitchen", "override_icon": "mdi:silverware-fork-knife"},
            "203": {"name": "First Floor", "override_icon": "mdi:stairs"},
            "900": {"name": "Guest", "override_icon": "mdi:account"}}},
        {"type": "markdown", "grid_options": dict(FULL),
         "content": "Tap a room to call it. Incoming calls pop up on every screen automatically; tap the green button to answer."},
    ]
    return frame({"title": "Intercom", "path": "intercom", "icon": "mdi:phone-in-talk"}, centre)


def rooms_view():
    search_tpl = (
        "{% set q = (states('input_text.tablet_search') or '') | lower | trim %}\n"
        "{% if not q %}[]{% else %}\n"
        "{% set pool = integration_entities('tuya_local') | select('match', 'switch\\\\.') | list\n"
        "   + integration_entities('rainbird') | select('match', 'switch\\\\.') | list\n"
        "   + states.climate | map(attribute='entity_id') | list\n"
        "   + states.media_player | map(attribute='entity_id') | list\n"
        "   + states.lock | map(attribute='entity_id') | list %}\n"
        "{% set ns = namespace(out=[]) %}\n"
        "{% for e in pool %}\n"
        "  {% set hay = ((state_attr(e, 'friendly_name') or '') ~ ' ' ~ (area_name(e) or '') ~ ' ' ~ (floor_name(e) or '')) | lower %}\n"
        "  {% if q in hay %}{% set ns.out = ns.out + [e] %}{% endif %}\n"
        "{% endfor %}\n"
        "{{ ns.out }}\n"
        "{% endif %}\n")
    centre = [
        {"type": "entities", "show_header_toggle": False, "grid_options": dict(FULL),
         "entities": [{"entity": "input_text.tablet_search", "name": "Search rooms & devices", "icon": "mdi:magnify"}]},
        auto_tiles([{"template": search_tpl}], columns=2, sort="friendly_name"),
        heading("All rooms", "mdi:floor-plan"),
        {"type": "grid", "columns": 3, "square": False, "grid_options": dict(FULL), "cards": [room_tile(*r) for r in ROOMS]},
    ]
    return frame({"title": "Rooms", "path": "rooms", "icon": "mdi:floor-plan"}, centre)


def room_view(rid, name, icon, colour):
    a = {"area": name}
    centre = [
        heading(name, icon),
        auto_tiles([{"domain": "switch", "integration": "tuya_local", **a, "options": copy.deepcopy(LIGHT_TILE)}]),
        auto_tiles([{"domain": "switch", "integration": "rainbird", **a,
                     "options": {"type": "tile", "icon": "mdi:sprinkler", "color": "blue", "tap_action": {"action": "toggle"}}}]),
        auto_tiles([{"domain": "light", **a, "options": {"type": "tile", "features": [{"type": "light-brightness"}]}}]),
        auto_tiles([{"domain": "climate", **a, "options": {"type": "tile", "features_position": "bottom", "features": copy.deepcopy(AC_FEATURES)}}]),
        auto_tiles([{"domain": "media_player", **a, "options": {"type": "media-control"}}], columns=1),
        auto_tiles([{"domain": "lock", **a, "options": {"type": "tile", "features": [{"type": "lock-commands"}]}}]),
    ]
    return frame({"title": name, "path": f"room-{rid}", "icon": icon}, centre, hidden=True)


def category_views():
    lighting = [heading("Lighting", "mdi:lightbulb-group")]
    for _rid, name, icon, _c in ROOMS:
        if name in ("Majlis", "Family Room", "BBQ & Pool", "Outdoor"):
            lighting += [heading(name, icon),
                         auto_tiles([{"domain": "switch", "integration": "tuya_local",
                                      "area": "BBQ Area and Swimming Pool" if name == "BBQ & Pool" else name,
                                      "options": copy.deepcopy(LIGHT_TILE)}])]
    lighting.append(auto_tiles([{"domain": "switch", "integration": "tuya_local", "options": copy.deepcopy(LIGHT_TILE)}],
                               exclude=[{"area": "Majlis"}, {"area": "Family Room"}, {"area": "BBQ Area and Swimming Pool"},
                                        {"area": "Outdoor"}, {"entity_id": "switch.pump"}]))
    return [
        frame({"title": "Lighting", "path": "lighting", "icon": "mdi:lightbulb-group"}, lighting, hidden=True),
        frame({"title": "Climate", "path": "climate", "icon": "mdi:air-conditioner"}, [
            heading("Air conditioning", "mdi:air-conditioner"),
            auto_tiles([{"domain": "climate", "options": {"type": "tile", "features_position": "bottom", "features": copy.deepcopy(AC_FEATURES)}}],
                       sort="friendly_name")], hidden=True),
        frame({"title": "Media", "path": "media", "icon": "mdi:television-play"}, [
            heading("Media", "mdi:television-play"),
            auto_tiles([{"domain": "media_player", "options": {"type": "media-control"}}], columns=1,
                       exclude=[{"state": "unavailable"}])], hidden=True),
        frame({"title": "Garden", "path": "garden", "icon": "mdi:sprinkler-variant"}, [
            heading("Irrigation", "mdi:sprinkler-variant"),
            auto_tiles([{"domain": "switch", "integration": "rainbird",
                         "options": {"type": "tile", "icon": "mdi:sprinkler", "color": "blue", "tap_action": {"action": "toggle"}}}],
                       sort="friendly_name"),
            heading("Pump", "mdi:pump"),
            {"type": "tile", "entity": "switch.pump", "name": "Pump", "icon": "mdi:pump", "color": "blue",
             "tap_action": {"action": "toggle"}, "grid_options": dict(FULL)}], hidden=True),
        frame({"title": "Doors & locks", "path": "doors", "icon": "mdi:door-closed-lock"}, [
            heading("Doors & locks", "mdi:door-closed-lock"),
            {"type": "tile", "entity": "lock.outdoor_station_lock", "name": "Outdoor station", "vertical": False,
             "features": [{"type": "lock-commands"}], "grid_options": dict(FULL)},
            heading("Entrance & car park lighting", "mdi:outdoor-lamp"),
            auto_tiles([{"domain": "switch", "integration": "tuya_local", "area": "Outdoor", "options": copy.deepcopy(LIGHT_TILE)}])],
              hidden=True),
    ]


def main():
    doc = {
        "kiosk_mode": {"hide_header": True, "hide_sidebar": True, "hide_overflow": True},
        "wallpanel": {
            "enabled": True, "hide_toolbar": True, "hide_sidebar": True, "fullscreen": False,
            "idle_time": WALLPANEL_IDLE_S,
            "show_images": False, "image_url": "",
            "screensaver_stop_navigation_path": f"{BASE}/home",
            "cards": [{"type": "clock", "clock_size": "large", "show_seconds": False, "time_format": "12"},
                      {"type": "weather-forecast", "entity": "weather.forecast_home", "show_current": True,
                       "show_forecast": False}],
        },
        "button_card_templates": templates(),
        "views": [home_view(), intercom_view(), rooms_view()] + category_views() + [room_view(*r) for r in ROOMS],
    }

    class Dumper(yaml.SafeDumper):
        def ignore_aliases(self, data):  # never emit &id001 anchors for repeated parts
            return True

    def str_rep(dumper, data):
        style = "|" if "\n" in data else None
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style=style)

    Dumper.add_representer(str, str_rep)
    header = ("# GENERATED by build_tablet.py -- do not edit by hand. Edit the generator and re-run it:\n"
              "#   python3 homeassistant/dashboards/build_tablet.py\n"
              "# Liquid-glass tablet dashboard, served at /tablet-glass (see configuration.yaml).\n\n")
    OUT.write_text(header + yaml.dump(doc, Dumper=Dumper, sort_keys=False, allow_unicode=True, width=10000))
    print(f"wrote {OUT.name}: {len(doc['views'])} views")


if __name__ == "__main__":
    main()
