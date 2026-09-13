import { derived, writable, type Readable } from "svelte/store";
import {
  getConfig,
  subscribeEntities,
  type HassConfig,
  type HassEntities,
} from "home-assistant-js-websocket";
import { getConnection } from "./connection";
import {
  fetchAreaRegistry,
  fetchDeviceRegistry,
  fetchEntityRegistry,
  type AreaRegistryEntry,
  type DeviceRegistryEntry,
  type EntityRegistryEntry,
} from "./registry";

export type ConnectionState = "connecting" | "connected" | "error";

type Registries = {
  areas: AreaRegistryEntry[];
  devices: DeviceRegistryEntry[];
  entityRegistry: EntityRegistryEntry[];
};

export const connectionState = writable<ConnectionState>("connecting");
export const entities = writable<HassEntities>({});
export const registries = writable<Registries | null>(null);
export const config = writable<HassConfig | null>(null);

let started = false;

// Call once (e.g. from App.svelte's onMount) to open the connection and start
// streaming entity state + fetch the registries needed for area grouping.
export async function startHomeAssistant(): Promise<void> {
  if (started) return;
  started = true;

  try {
    const conn = await getConnection();
    connectionState.set("connected");
    conn.addEventListener("disconnected", () => connectionState.set("connecting"));
    conn.addEventListener("ready", () => connectionState.set("connected"));

    subscribeEntities(conn, (state) => entities.set(state));

    const [areas, devices, entityRegistry, haConfig] = await Promise.all([
      fetchAreaRegistry(conn),
      fetchDeviceRegistry(conn),
      fetchEntityRegistry(conn),
      getConfig(conn),
    ]);
    registries.set({ areas, devices, entityRegistry });
    config.set(haConfig);
  } catch (err) {
    console.error("Failed to connect to Home Assistant", err);
    connectionState.set("error");
  }
}

function areaIdForEntity(entityId: string, reg: Registries): string | null {
  const entry = reg.entityRegistry.find((e) => e.entity_id === entityId);
  if (!entry) return null;
  if (entry.area_id) return entry.area_id;
  if (entry.device_id) {
    return reg.devices.find((d) => d.id === entry.device_id)?.area_id ?? null;
  }
  return null;
}

export type AreaGroup = {
  area: AreaRegistryEntry;
  entities: HassEntities;
};

// This is the scalability rule from Claude.md §2/§6 in code: every area
// defined in HA gets a group here, entities land in whichever one they're
// assigned to, and a newly added device shows up with zero UI changes once
// it's assigned to an area — no area name is ever hardcoded.
export const areaGroups: Readable<AreaGroup[]> = derived(
  [entities, registries],
  ([$entities, $registries]) => {
    if (!$registries) return [];

    const byAreaId = new Map<string, HassEntities>();
    for (const area of $registries.areas) {
      byAreaId.set(area.area_id, {});
    }
    for (const [entityId, state] of Object.entries($entities)) {
      const areaId = areaIdForEntity(entityId, $registries);
      if (areaId && byAreaId.has(areaId)) {
        byAreaId.get(areaId)![entityId] = state;
      }
    }

    return $registries.areas
      .map((area) => ({ area, entities: byAreaId.get(area.area_id)! }))
      .sort((a, b) => a.area.name.localeCompare(b.area.name));
  },
);
