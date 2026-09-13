import type { HassEntities, HassEntity } from "home-assistant-js-websocket";

const nameOf = (e: HassEntity): string => e.attributes.friendly_name ?? e.entity_id;

// --- lights ---------------------------------------------------------------

export type LightView = {
  entityId: string;
  name: string;
  /** 0–100. */
  brightness: number;
  descriptor: string;
};

function describeLight(e: HassEntity): string {
  const k = e.attributes.color_temp_kelvin;
  if (typeof k !== "number") return "on";
  if (k <= 3500) return "warm white";
  if (k <= 5000) return "neutral white";
  return "cool white";
}

export function lightsIn(entities: HassEntities): LightView[] {
  return Object.values(entities)
    .filter((e) => e.entity_id.startsWith("light."))
    .map((e) => {
      const on = e.state === "on";
      const raw = e.attributes.brightness;
      return {
        entityId: e.entity_id,
        name: nameOf(e),
        brightness: on ? (typeof raw === "number" ? Math.round((raw / 255) * 100) : 100) : 0,
        descriptor: describeLight(e),
      };
    });
}

// --- switchable devices ---------------------------------------------------

export type DeviceIcon = "lock" | "plug" | "vacuum" | "curtains";

export type DeviceView = {
  entityId: string;
  name: string;
  stateText: string;
  active: boolean;
  icon: DeviceIcon;
};

/** The service pair that flips each domain, keyed by domain. */
const DEVICE_SERVICES: Record<string, { domain: string; on: string; off: string }> = {
  lock: { domain: "lock", on: "lock", off: "unlock" },
  switch: { domain: "switch", on: "turn_on", off: "turn_off" },
  cover: { domain: "cover", on: "open_cover", off: "close_cover" },
  vacuum: { domain: "vacuum", on: "start", off: "return_to_base" },
};

export function deviceService(entityId: string, next: boolean) {
  const domain = entityId.split(".")[0];
  const spec = DEVICE_SERVICES[domain];
  if (!spec) return null;
  return { domain: spec.domain, service: next ? spec.on : spec.off };
}

export function devicesIn(entities: HassEntities): DeviceView[] {
  const views: DeviceView[] = [];

  for (const e of Object.values(entities)) {
    const domain = e.entity_id.split(".")[0];
    if (domain === "lock") {
      const locked = e.state === "locked";
      views.push({ entityId: e.entity_id, name: nameOf(e), stateText: locked ? "Locked" : "Unlocked", active: locked, icon: "lock" });
    } else if (domain === "switch") {
      const on = e.state === "on";
      views.push({ entityId: e.entity_id, name: nameOf(e), stateText: on ? "On" : "Off", active: on, icon: "plug" });
    } else if (domain === "cover") {
      const open = e.state === "open";
      views.push({ entityId: e.entity_id, name: nameOf(e), stateText: open ? "Open" : "Closed", active: open, icon: "curtains" });
    } else if (domain === "vacuum") {
      const cleaning = e.state === "cleaning";
      const battery = typeof e.attributes.battery_level === "number" ? ` · ${e.attributes.battery_level}%` : "";
      views.push({
        entityId: e.entity_id,
        name: nameOf(e),
        stateText: cleaning ? "Cleaning" : `Docked${battery}`,
        active: cleaning,
        icon: "vacuum",
      });
    }
  }

  return views;
}

// --- camera ---------------------------------------------------------------

export type CameraView = {
  entityId: string;
  name: string;
  snapshot: string | null;
  statusText: string;
};

export function cameraIn(entities: HassEntities, baseUrl: string): CameraView | null {
  const cam = Object.values(entities).find((e) => e.entity_id.startsWith("camera."));
  if (!cam) return null;
  const picture = cam.attributes.entity_picture;
  return {
    entityId: cam.entity_id,
    name: nameOf(cam),
    snapshot: typeof picture === "string" ? `${baseUrl}${picture}` : null,
    statusText: cam.state,
  };
}

// --- energy ---------------------------------------------------------------

export type EnergyView = { value: string; unit: string; delta: string | null };

export function energyIn(entities: HassEntities): EnergyView | null {
  const all = Object.values(entities);

  const energy = all.find(
    (e) =>
      e.entity_id.startsWith("sensor.") &&
      e.attributes.device_class === "energy" &&
      typeof e.attributes.unit_of_measurement === "string",
  );
  if (!energy) return null;

  const power = all.find(
    (e) => e.entity_id.startsWith("sensor.") && e.attributes.device_class === "power",
  );

  return {
    value: energy.state,
    unit: energy.attributes.unit_of_measurement ?? "kWh",
    delta: power ? `${power.state} ${power.attributes.unit_of_measurement ?? "W"} now` : null,
  };
}

// --- small stat tiles -----------------------------------------------------

export type StatView = { label: string; value: string; detail: string };

export function airQualityIn(entities: HassEntities): StatView | null {
  const all = Object.values(entities);
  const co2 = all.find((e) => e.attributes.device_class === "carbon_dioxide");
  const pm25 = all.find((e) => e.attributes.device_class === "pm25");
  if (!co2 && !pm25) return null;

  const ppm = co2 ? Number(co2.state) : NaN;
  const value = Number.isFinite(ppm) ? (ppm <= 800 ? "Good" : ppm <= 1200 ? "Fair" : "Poor") : "—";

  const detail = [
    co2 ? `CO₂ ${co2.state} ppm` : null,
    pm25 ? `PM2.5 ${pm25.state}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return { label: "Indoor air", value, detail };
}

export function waterHeaterIn(entities: HassEntities): StatView | null {
  const wh = Object.values(entities).find((e) => e.entity_id.startsWith("water_heater."));
  if (!wh) return null;
  const temp = wh.attributes.current_temperature;
  return {
    label: "Water heater",
    value: wh.state.charAt(0).toUpperCase() + wh.state.slice(1),
    detail: typeof temp === "number" ? `${temp}°C` : "",
  };
}

// --- scenes ---------------------------------------------------------------

export type SceneView = {
  id: string;
  name: string;
  detail: string;
  icon: "sun" | "moon" | "tv" | "pulse";
};

function sceneIcon(name: string): SceneView["icon"] {
  const n = name.toLowerCase();
  if (n.includes("morning") || n.includes("day")) return "sun";
  if (n.includes("evening") || n.includes("night") || n.includes("sleep")) return "moon";
  if (n.includes("movie") || n.includes("cinema") || n.includes("tv")) return "tv";
  return "pulse";
}

export function scenesIn(entities: HassEntities): SceneView[] {
  return Object.values(entities)
    .filter((e) => e.entity_id.startsWith("scene."))
    .map((e) => ({
      id: e.entity_id,
      name: nameOf(e),
      // HA scenes carry no description; the reference's sub-line has no live
      // equivalent, so it stays empty rather than inventing one.
      detail: "",
      icon: sceneIcon(nameOf(e)),
    }));
}
