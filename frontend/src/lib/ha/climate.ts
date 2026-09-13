import type { HassEntities, HassEntity } from "home-assistant-js-websocket";

/** The four modes the reference dashboard exposes. */
export type Mode = "Cooling" | "Fan" | "Dry" | "Auto";

const MODE_TO_HVAC: Record<Mode, string> = {
  Cooling: "cool",
  Fan: "fan_only",
  Dry: "dry",
  Auto: "auto",
};

const HVAC_TO_MODE: Record<string, Mode> = {
  cool: "Cooling",
  fan_only: "Fan",
  dry: "Dry",
  auto: "Auto",
  heat_cool: "Auto",
};

export function hvacModeFor(mode: Mode): string {
  return MODE_TO_HVAC[mode];
}

export type ClimateView = {
  entityId: string;
  name: string;
  target: number;
  minTemp: number;
  maxTemp: number;
  current: string | null;
  humidity: number | null;
  mode: Mode;
  on: boolean;
  availableModes: Mode[];
};

export function findClimateEntity(entities: HassEntities): HassEntity | null {
  const match = Object.values(entities).find((e) => e.entity_id.startsWith("climate."));
  return match ?? null;
}

export function toClimateView(entity: HassEntity): ClimateView {
  const a = entity.attributes;
  const on = entity.state !== "off" && entity.state !== "unavailable";

  const supported: Mode[] = Array.isArray(a.hvac_modes)
    ? [...new Set(
        (a.hvac_modes as string[])
          .map((m) => HVAC_TO_MODE[m])
          .filter((m): m is Mode => Boolean(m)),
      )]
    : ["Cooling", "Fan", "Dry", "Auto"];

  return {
    entityId: entity.entity_id,
    name: a.friendly_name ?? entity.entity_id,
    target: typeof a.temperature === "number" ? a.temperature : 22,
    minTemp: typeof a.min_temp === "number" ? a.min_temp : 16,
    maxTemp: typeof a.max_temp === "number" ? a.max_temp : 30,
    current:
      typeof a.current_temperature === "number"
        ? `${a.current_temperature}°C`
        : null,
    humidity: typeof a.current_humidity === "number" ? a.current_humidity : null,
    mode: HVAC_TO_MODE[entity.state] ?? "Cooling",
    on,
    availableModes: supported.length > 0 ? supported : ["Cooling", "Fan", "Dry", "Auto"],
  };
}
