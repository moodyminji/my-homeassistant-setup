<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import Toggle from "./Toggle.svelte";
  import type { Mode } from "../ha/climate";

  export let name = "AC";
  /** Target temperature. */
  export let target = 22;
  export let minTemp = 16;
  export let maxTemp = 30;
  /** Measured room temperature, already formatted (e.g. "25.4°C"). */
  export let current: string | null = null;
  export let humidity: number | null = null;
  export let mode: Mode = "Cooling";
  export let on = true;
  /** Modes the entity actually supports; all four when unknown. */
  export let availableModes: Mode[] = ["Cooling", "Fan", "Dry", "Auto"];

  const dispatch = createEventDispatcher<{
    power: boolean;
    target: number;
    mode: Mode;
  }>();

  type ModeChip = { mode: Mode; label: string };
  const CHIPS: ModeChip[] = [
    { mode: "Cooling", label: "Cool" },
    { mode: "Fan", label: "Fan" },
    { mode: "Dry", label: "Dry" },
    { mode: "Auto", label: "Auto" },
  ];

  // Dial geometry ported from the reference: r=86, 270° sweep, rotated -90°
  // so it starts at 12 o'clock.
  const R = 86;
  const CIRC = 2 * Math.PI * R;
  const VISIBLE = CIRC * 0.75;

  // Taps land faster than HA (or the parent) echoes the new target back, so
  // steps accumulate against an optimistic local value instead of the last
  // rendered one — otherwise two quick taps both produce the same result.
  let pending: number | null = null;
  let pendingTimer: ReturnType<typeof setTimeout> | undefined;

  $: if (pending !== null && target === pending) {
    pending = null;
    clearTimeout(pendingTimer);
  }

  $: shown = pending ?? target;
  $: frac = maxTemp > minTemp ? (shown - minTemp) / (maxTemp - minTemp) : 0;
  $: dashoffset = VISIBLE * (1 - Math.min(Math.max(frac, 0), 1));
  $: arcColor =
    mode === "Fan" ? "var(--accent)" : mode === "Dry" ? "var(--heat)" : "var(--cool)";
  $: chips = CHIPS.filter((c) => availableModes.includes(c.mode));

  onDestroy(() => clearTimeout(pendingTimer));

  function step(delta: number) {
    const next = (pending ?? target) + delta;
    if (next < minTemp || next > maxTemp) return;
    pending = next;
    clearTimeout(pendingTimer);
    // Never strand the dial out of sync if the command is never acknowledged.
    pendingTimer = setTimeout(() => (pending = null), 3000);
    dispatch("target", next);
  }
</script>

<div class="tile climate">
  <div class="top">
    <div>
      <div class="lbl">Climate</div>
      <h3>{name}</h3>
    </div>
    <Toggle checked={on} label="{name} power" on:change={(e) => dispatch("power", e.detail)} />
  </div>

  <div class="dial">
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r={R} fill="none" stroke="var(--panel-3)" stroke-width="14" />
      <circle
        cx="100"
        cy="100"
        r={R}
        fill="none"
        stroke={arcColor}
        stroke-width="14"
        stroke-linecap="round"
        stroke-dasharray="{VISIBLE} {CIRC}"
        stroke-dashoffset={dashoffset}
        style:opacity={on ? 1 : 0.25}
      />
    </svg>
    <div class="dialtxt">
      <div class="t">{shown}<sup>°C</sup></div>
      <div class="mode" style:color={arcColor}>{on ? mode : "Off"}</div>
    </div>
  </div>

  <div class="now">
    {#if current}Now <b class="mono">{current}</b>{/if}{#if current && humidity != null} · {/if}{#if humidity != null}humidity {humidity}%{/if}
  </div>

  <div class="tempctl">
    <button aria-label="Lower target temperature" on:click={() => step(-1)}>−</button>
    <div class="target-lbl">target</div>
    <button aria-label="Raise target temperature" on:click={() => step(1)}>+</button>
  </div>

  <div class="modes">
    {#each chips as chip (chip.mode)}
      <button class:on={mode === chip.mode} on:click={() => dispatch("mode", chip.mode)}>
        {chip.label}
      </button>
    {/each}
  </div>
</div>

<style>
  .tile {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--r);
    padding: 16px;
    box-shadow: var(--sh);
    position: relative;
    min-width: 0;
  }
  .lbl {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--faint);
  }

  .climate {
    grid-column: span 2;
    grid-row: span 2;
    display: flex;
    flex-direction: column;
  }
  .climate .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .climate .top h3 { font-size: 16px; margin-top: 6px; }

  .dial { margin: 6px auto 4px; position: relative; width: 200px; height: 200px; }
  /* Reference hard-codes a 200px SVG; sizing it to the box keeps it identical
     at 200px and stops it overflowing the 170px phone dial. */
  .dial svg { width: 100%; height: 100%; display: block; transform: rotate(-90deg); }

  .dialtxt {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .dialtxt .t {
    font-family: var(--disp);
    font-weight: 800;
    font-size: 46px;
    line-height: 1;
    letter-spacing: -.03em;
  }
  .dialtxt .t sup {
    font-size: 20px;
    vertical-align: super;
    color: var(--muted);
    font-weight: 600;
  }
  .dialtxt .mode {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: .1em;
    text-transform: uppercase;
    margin-top: 6px;
    font-weight: 600;
  }

  .climate .now {
    text-align: center;
    font-size: 13px;
    color: var(--muted);
    margin-top: 2px;
  }

  .tempctl {
    display: flex;
    gap: 10px;
    justify-content: center;
    align-items: center;
    margin-top: 12px;
  }
  .tempctl button {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: var(--panel-2);
    border: 1px solid var(--line);
    font-size: 22px;
    font-weight: 600;
    display: grid;
    place-items: center;
    color: var(--ink);
    transition: .12s;
  }
  .tempctl button:hover { border-color: var(--accent); color: var(--accent); }
  .tempctl button:active { transform: scale(.94); }
  .target-lbl {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--muted);
    width: 70px;
    text-align: center;
  }

  .modes { display: flex; gap: 6px; justify-content: center; margin-top: 14px; }
  .modes button {
    font-size: 12px;
    font-family: var(--mono);
    padding: 6px 12px;
    border-radius: 99px;
    background: var(--panel-2);
    color: var(--muted);
    border: 1px solid transparent;
    min-height: 44px; /* DESIGN.md §6 touch target */
  }
  .modes button.on {
    background: var(--cool-ghost);
    color: var(--cool);
    border-color: var(--cool);
  }

  @media (max-width: 640px) {
    .climate { grid-column: span 1; }
    .dial { width: 170px; height: 170px; }
  }
</style>
