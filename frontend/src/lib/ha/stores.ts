import { derived, writable, type Readable } from "svelte/store";
import { subscribeEntities, type HassEntities } from "home-assistant-js-websocket";
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

    const [areas, devices, entityRegistry] = await Promise.all([
      fetchAreaRegistry(conn),
      fetchDeviceRegistry(conn),
      fetchEntityRegistry(conn),
    ]);
    registries.set({ areas, devices, entityRegistry });
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

// This is the scalability rule from Claude.md §2/§6 in code: entities are
// grouped by whatever area they're assigned in HA, so a newly added device
// shows up here with zero UI changes once it's assigned to the area.
export function entitiesForArea(areaName: string): Readable<HassEntities> {
  return derived([entities, registries], ([$entities, $registries]) => {
    if (!$registries) return {};
    const area = $registries.areas.find(
      (a) => a.name.toLowerCase() === areaName.toLowerCase(),
    );
    if (!area) return {};

    const result: HassEntities = {};
    for (const [entityId, state] of Object.entries($entities)) {
      if (areaIdForEntity(entityId, $registries) === area.area_id) {
        result[entityId] = state;
      }
    }
    return result;
  });
}
