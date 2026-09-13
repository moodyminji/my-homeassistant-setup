import { writable } from "svelte/store";

export type Theme = "dark" | "light";

const STORAGE_KEY = "majlis-theme";

function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme:light)").matches ? "light" : "dark";
}

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "dark" || v === "light" ? v : null;
  } catch {
    return null;
  }
}

export const theme = writable<Theme>(stored() ?? systemTheme());

theme.subscribe((value) => {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", value);
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // private mode / blocked storage — the attribute above still applies
  }
});

export function toggleTheme(): void {
  theme.update((t) => (t === "dark" ? "light" : "dark"));
}
