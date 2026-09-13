import type { Mode } from "./ha/climate";

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
};

export const DEMO_ROOMS: DemoRoom[] = [
  { id: "majlis", name: "Majlis", count: 6, climate: { name: "Majlis AC", target: 22, current: "25.4°C", humidity: 48, mode: "Cooling", on: true } },
  { id: "kitchen", name: "Kitchen", count: 4, climate: { name: "Kitchen AC", target: 24, current: "26.1°C", humidity: 48, mode: "Cooling", on: true } },
  { id: "living", name: "Living Room", count: 5, climate: { name: "Living Room AC", target: 21, current: "24.8°C", humidity: 48, mode: "Cooling", on: true } },
  { id: "master", name: "Master Bedroom", count: 4, climate: { name: "Master Bedroom AC", target: 20, current: "23.2°C", humidity: 48, mode: "Cooling", on: true } },
  { id: "outdoor", name: "Outdoor", count: 3, climate: { name: "Patio (no AC)", target: 22, current: "33.9°C", humidity: 48, mode: "Cooling", on: false } },
];

export const DEMO_WEATHER = {
  temp: "34°",
  place: "Muscat",
  condition: "clear",
};

export const DEMO_STATUS = "4 rooms active · everything's locked up";
