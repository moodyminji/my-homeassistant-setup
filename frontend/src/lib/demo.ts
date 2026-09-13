import type { Mode } from "./ha/climate";
import type { DeviceIcon } from "./ha/entities";

/** Example data lifted from majlis-dashboard-reference.html, used only when
 *  the app is opened with ?demo=1 so the design can be reviewed before real
 *  areas and devices exist in Home Assistant. Never shown for live data. */

export type DemoRoom = {
  id: string;
  name: string;
  count: number;
  climate: {
    name: string;
    target: number;
    current: string;
    humidity: number;
    mode: Mode;
    on: boolean;
  };
  lights: { entityId: string; name: string; brightness: number; descriptor: string }[];
  devices: {
    entityId: string;
    name: string;
    /** Both texts, so toggling swaps them the way the reference's JS does. */
    onText: string;
    offText: string;
    active: boolean;
    icon: DeviceIcon;
  }[];
  camera: {
    name: string;
    statusText: string;
    detection: { left: string; top: string; width: string; height: string; label: string } | null;
  } | null;
};

const MAJLIS_DEVICES: DemoRoom["devices"] = [
  { entityId: "lock.front_door", name: "Front door", onText: "Locked", offText: "Unlocked", active: true, icon: "lock" },
  { entityId: "switch.tv_socket", name: "TV socket", onText: "On · 42 W", offText: "Off", active: true, icon: "plug" },
  { entityId: "vacuum.robot", name: "Robot vacuum", onText: "Cleaning", offText: "Docked · 100%", active: false, icon: "vacuum" },
  { entityId: "cover.curtains", name: "Curtains", onText: "Open", offText: "Closed", active: false, icon: "curtains" },
];

export const DEMO_ROOMS: DemoRoom[] = [
  {
    id: "majlis",
    name: "Majlis",
    count: 6,
    climate: { name: "Majlis AC", target: 22, current: "25.4°C", humidity: 48, mode: "Cooling", on: true },
    lights: [
      { entityId: "light.majlis_ceiling", name: "Ceiling", brightness: 72, descriptor: "warm white" },
      { entityId: "light.majlis_sconces", name: "Wall sconces", brightness: 0, descriptor: "warm white" },
    ],
    devices: MAJLIS_DEVICES,
    camera: {
      name: "Front Entrance",
      statusText: "person detected · 2s ago",
      detection: { left: "58%", top: "44%", width: "64px", height: "96px", label: "person 98%" },
    },
  },
  {
    id: "kitchen",
    name: "Kitchen",
    count: 4,
    climate: { name: "Kitchen AC", target: 24, current: "26.1°C", humidity: 48, mode: "Cooling", on: true },
    lights: [{ entityId: "light.kitchen_ceiling", name: "Ceiling", brightness: 100, descriptor: "cool white" }],
    devices: MAJLIS_DEVICES.slice(1, 3),
    camera: null,
  },
  {
    id: "living",
    name: "Living Room",
    count: 5,
    climate: { name: "Living Room AC", target: 21, current: "24.8°C", humidity: 48, mode: "Cooling", on: true },
    lights: [
      { entityId: "light.living_ceiling", name: "Ceiling", brightness: 45, descriptor: "warm white" },
      { entityId: "light.living_floor", name: "Floor lamp", brightness: 0, descriptor: "warm white" },
    ],
    devices: MAJLIS_DEVICES.slice(1, 4),
    camera: null,
  },
  {
    id: "master",
    name: "Master Bedroom",
    count: 4,
    climate: { name: "Master Bedroom AC", target: 20, current: "23.2°C", humidity: 48, mode: "Cooling", on: true },
    lights: [{ entityId: "light.master_ceiling", name: "Ceiling", brightness: 20, descriptor: "warm white" }],
    devices: MAJLIS_DEVICES.slice(3),
    camera: null,
  },
  {
    id: "outdoor",
    name: "Outdoor",
    count: 3,
    climate: { name: "Patio (no AC)", target: 22, current: "33.9°C", humidity: 48, mode: "Cooling", on: false },
    lights: [{ entityId: "light.patio", name: "Patio lights", brightness: 0, descriptor: "warm white" }],
    devices: [],
    camera: {
      name: "Driveway",
      statusText: "all clear · 1m ago",
      detection: null,
    },
  },
];

export const DEMO_WEATHER = { temp: "34°", place: "Muscat", condition: "clear" };

export const DEMO_STATUS = "4 rooms active · everything's locked up";

export const DEMO_ENERGY = {
  value: "14.8",
  unit: "kWh",
  delta: "▼ 12% vs. yesterday · 1.9 kW now",
  // Inverted from the reference polyline's y coordinates so the rendered
  // shape matches it exactly.
  points: [6, 10, 8, 20, 16, 28, 22, 32, 24, 18, 26, 20, 30],
};

export const DEMO_STATS = [
  { label: "Indoor air", value: "Good", detail: "CO₂ 610 ppm · PM2.5 8" },
  { label: "Water heater", value: "Ready", detail: "Boosts 06:00 · 58°C" },
];

export const DEMO_SCENES = [
  { id: "scene.good_morning", name: "Good Morning", detail: "Lights 40% · AC 23°", icon: "sun" as const },
  { id: "scene.evening", name: "Evening", detail: "Warm · sconces on", icon: "moon" as const },
  { id: "scene.movie", name: "Movie", detail: "Dim · TV on", icon: "tv" as const },
  { id: "scene.away", name: "Away", detail: "All off · armed", icon: "pulse" as const },
];

export const DEMO_ACTIVE_SCENE = "scene.evening";
