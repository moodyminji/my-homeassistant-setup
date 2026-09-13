<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Icon from "./Icon.svelte";

  export let name = "Light";
  /** 0–100. */
  export let brightness = 0;
  /** Right-hand half of the meta line, e.g. "warm white". */
  export let descriptor = "on";

  const dispatch = createEventDispatcher<{ brightness: number }>();

  $: on = brightness > 0;

  /** Restores to the last non-zero level, like the reference's bulb tap. */
  let lastOn = 60;
  $: if (brightness > 0) lastOn = brightness;

  function toggle() {
    dispatch("brightness", on ? 0 : lastOn);
  }

  function onInput(event: Event) {
    dispatch("brightness", Number((event.currentTarget as HTMLInputElement).value));
  }
</script>

<div class="tile light" class:active={on} style="--p:{brightness}%">
  <div class="hd">
    <div>
      <div class="lbl">Light</div>
      <div class="name">{name}</div>
      <div class="meta"><span class="pct">{brightness}</span>% · {on ? descriptor : "off"}</div>
    </div>
    <button class="bulb" aria-label="Toggle {name}" aria-pressed={on} on:click={toggle}>
      <Icon name="bulb" />
    </button>
  </div>
  <input
    class="slider"
    type="range"
    min="0"
    max="100"
    value={brightness}
    aria-label="{name} brightness"
    on:input={onInput}
  />
</div>

<style>
  .light {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
    min-height: 132px;
  }
  .light .hd {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }
  .light .name {
    font-family: var(--disp);
    font-weight: 700;
    font-size: 15px;
    margin-top: 8px;
  }
  .light .meta { font-size: 12px; color: var(--muted); margin-top: 1px; }

  .bulb {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    display: grid;
    place-items: center;
    background: var(--panel-2);
    color: var(--faint);
    flex: none;
    transition: .2s;
    padding: 0;
  }
  .bulb :global(svg) { width: 20px; height: 20px; }
  .light.active .bulb {
    background: var(--heat-ghost);
    color: var(--heat);
    box-shadow: 0 0 0 1px var(--heat) inset, 0 0 22px -6px var(--heat);
  }

  .slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 8px;
    border-radius: 99px;
    background: var(--panel-3);
    outline: none;
    margin: 0;
  }
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent);
    border: 3px solid var(--panel);
    box-shadow: var(--sh);
    cursor: pointer;
  }
  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent);
    border: 3px solid var(--panel);
    cursor: pointer;
  }
  .light.active .slider {
    background: linear-gradient(90deg, var(--heat) var(--p, 60%), var(--panel-3) var(--p, 60%));
  }
  .light.active .slider::-webkit-slider-thumb { background: var(--heat); }
  .light.active .slider::-moz-range-thumb { background: var(--heat); }

  /* DESIGN.md §6: thumb must be ≥28px for fingers. Pointer-precision only, so
     the reference's 20px is untouched on desktop. */
  @media (pointer: coarse) {
    .slider { height: 10px; }
    .slider::-webkit-slider-thumb { width: 28px; height: 28px; }
    .slider::-moz-range-thumb { width: 28px; height: 28px; }
  }
</style>
