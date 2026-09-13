import { writable } from "svelte/store";

export type PageId =
  | "home"
  | "rooms"
  | "devices"
  | "apps"
  | "autos"
  | "energy"
  | "security"
  | "intercom"
  | "settings";

export const PAGE_IDS: PageId[] = [
  "home",
  "rooms",
  "devices",
  "apps",
  "autos",
  "energy",
  "security",
  "intercom",
  "settings",
];

function isPageId(value: string): value is PageId {
  return (PAGE_IDS as string[]).includes(value);
}

function fromHash(): PageId {
  const raw = window.location.hash.replace(/^#\/?/, "");
  return isPageId(raw) ? raw : "home";
}

/** The reference has no URL routing at all, but a wall panel benefits from it:
 *  a reload keeps you on the same page, and a panel can be deep-linked to the
 *  page it should sit on. Behaviour is otherwise identical to the reference. */
export const route = writable<PageId>(fromHash());

export function navigate(id: PageId): void {
  window.location.hash = `/${id}`;
}

window.addEventListener("hashchange", () => route.set(fromHash()));
