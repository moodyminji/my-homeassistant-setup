import type { Connection } from "home-assistant-js-websocket";

// home-assistant-js-websocket doesn't ship registry helpers (those live only
// in HA's own frontend), so these hit the documented websocket commands
// directly. Registries are fetched once per connection, not subscribed live —
// a new area assignment shows up on the next page load, which is an
// acceptable trade-off for how rarely that changes.

export type AreaRegistryEntry = {
  area_id: string;
  name: string;
  floor_id: string | null;
};

export type DeviceRegistryEntry = {
  id: string;
  area_id: string | null;
};

export type EntityRegistryEntry = {
  entity_id: string;
  area_id: string | null;
  device_id: string | null;
};

export function fetchAreaRegistry(conn: Connection) {
  return conn.sendMessagePromise<AreaRegistryEntry[]>({
    type: "config/area_registry/list",
  });
}

export function fetchDeviceRegistry(conn: Connection) {
  return conn.sendMessagePromise<DeviceRegistryEntry[]>({
    type: "config/device_registry/list",
  });
}

export function fetchEntityRegistry(conn: Connection) {
  return conn.sendMessagePromise<EntityRegistryEntry[]>({
    type: "config/entity_registry/list",
  });
}
