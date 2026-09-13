import { callService as haCallService, type HassServiceTarget } from "home-assistant-js-websocket";
import { getConnection } from "./connection";

export async function callService(
  domain: string,
  service: string,
  serviceData: Record<string, unknown> = {},
  target?: HassServiceTarget,
): Promise<unknown> {
  const conn = await getConnection();
  return haCallService(conn, domain, service, serviceData, target);
}
