<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let checked = false;
  export let label = "Toggle";

  const dispatch = createEventDispatcher<{ change: boolean }>();

  function fire(event: Event) {
    event.stopPropagation();
    dispatch("change", !checked);
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      fire(event);
    }
  }
</script>

<span
  class="tog"
  class:active={checked}
  role="switch"
  aria-checked={checked}
  aria-label={label}
  tabindex="0"
  on:click={fire}
  on:keydown={onKey}
></span>

<style>
  /* Reference sizes it 46×27 with a 21px knob; DESIGN.md §6 requires ≥46×28
     for touch, so the knob is 22px and travels 18px. */
  .tog {
    width: 46px;
    height: 28px;
    border-radius: 99px;
    background: var(--panel-3);
    position: relative;
    transition: .18s;
    flex: none;
    border: 1px solid var(--line);
    display: block;
  }
  .tog::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--muted);
    transition: .18s;
  }

  /* The reference only styles `.tile.active .tog`, which leaves the climate
     tile's own power toggle permanently grey — a mockup bug. Styling the
     toggle off its own state fixes that and keeps device tiles identical. */
  .tog.active { background: var(--on); }
  .tog.active::after { transform: translateX(18px); background: #fff; }
</style>
