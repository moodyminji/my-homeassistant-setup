import {
  createConnection,
  createLongLivedTokenAuth,
  type Connection,
} from "home-assistant-js-websocket";

const HA_URL = import.meta.env.VITE_HA_URL as string | undefined;
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN as string | undefined;

/** Base URL for building absolute asset paths (camera snapshots, etc.). */
export const haBaseUrl = (HA_URL ?? "").replace(/\/$/, "");

let connectionPromise: Promise<Connection> | undefined;

// Long-lived token auth (not the OAuth redirect flow) — this is a private,
// single-tenant LAN app per Claude.md §6, not a public HA frontend.
export function getConnection(): Promise<Connection> {
  if (!connectionPromise) {
    if (!HA_URL || !HA_TOKEN) {
      throw new Error(
        "Missing VITE_HA_URL / VITE_HA_TOKEN. Copy .env.local.example to " +
          ".env.local and fill them in with a long-lived access token from " +
          "your Home Assistant profile.",
      );
    }
    connectionPromise = createConnection({
      auth: createLongLivedTokenAuth(HA_URL, HA_TOKEN),
    });
  }
  return connectionPromise;
}
