import { derived, readable } from "svelte/store";

/** Ticks every 10s, matching the reference's setInterval. */
export const now = readable(new Date(), (set) => {
  const id = setInterval(() => set(new Date()), 10000);
  return () => clearInterval(id);
});

export const greeting = derived(now, ($now) => {
  const h = $now.getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
});

export const clockText = derived(now, ($now) =>
  $now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
);
