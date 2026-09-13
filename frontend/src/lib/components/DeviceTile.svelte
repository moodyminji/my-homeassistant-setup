<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Icon from "./Icon.svelte";
  import Toggle from "./Toggle.svelte";

  export let name = "Device";
  export let stateText = "";
  export let active = false;
  export let icon: "lock" | "plug" | "vacuum" | "curtains" = "plug";

  const dispatch = createEventDispatcher<{ toggle: boolean }>();
</script>

<!-- The whole tile is the switch (as in the reference), so the toggle inside
     is decoration rather than a nested control. -->
<button
  class="tile dtile"
  class:active
  role="switch"
  aria-checked={active}
  on:click={() => dispatch("toggle", !active)}
>
  <span class="di"><Icon name={icon} /></span>
  <span class="dn">
    <b>{name}</b>
    <span>{stateText}</span>
  </span>
  <Toggle checked={active} interactive={false} />
</button>

<style>
  .dtile {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 15px;
    text-align: left;
    width: 100%;
  }
  .di {
    width: 40px;
    height: 40px;
    border-radius: 11px;
    background: var(--panel-2);
    display: grid;
    place-items: center;
    color: var(--faint);
    flex: none;
    transition: .2s;
  }
  .di :global(svg) { width: 20px; height: 20px; }
  .dtile.active .di { background: var(--on-ghost); color: var(--on); }

  .dn { flex: 1; min-width: 0; }
  .dn b {
    font-family: var(--disp);
    font-weight: 600;
    font-size: 14px;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dn span { font-size: 12px; color: var(--muted); }
</style>
