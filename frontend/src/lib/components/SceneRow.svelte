<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Icon from "./Icon.svelte";

  type Scene = {
    id: string;
    name: string;
    detail: string;
    icon: "sun" | "moon" | "tv" | "pulse";
  };

  export let scenes: Scene[] = [];
  export let activeId: string | null = null;

  const dispatch = createEventDispatcher<{ activate: string }>();
</script>

<div class="scenehd">
  <h3>Scenes</h3>
  <div class="lbl">one tap</div>
</div>

<div class="scenes">
  {#each scenes as scene (scene.id)}
    <button
      class="scene-b"
      class:on={scene.id === activeId}
      on:click={() => dispatch("activate", scene.id)}
    >
      <span class="si"><Icon name={scene.icon} /></span>
      <b>{scene.name}</b>
      <span class="detail">{scene.detail}</span>
    </button>
  {/each}
</div>

<style>
  .scenehd {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 26px 0 12px;
  }
  .scenehd h3 { font-size: 16px; }
  .scenehd .lbl {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--faint);
  }

  .scenes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

  .scene-b {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--r);
    padding: 15px;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: .15s;
  }
  .scene-b:hover { border-color: var(--line-2); transform: translateY(-2px); }

  .si {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    display: grid;
    place-items: center;
    background: var(--panel-2);
    color: var(--accent);
  }
  .si :global(svg) { width: 20px; height: 20px; }

  .scene-b b { font-family: var(--disp); font-weight: 700; font-size: 14px; }
  .scene-b .detail { font-size: 12px; color: var(--muted); margin-top: -6px; }

  .scene-b.on { background: var(--accent); border-color: var(--accent); color: #04211f; }
  .scene-b.on .si { background: rgba(0, 0, 0, .14); color: #04211f; }
  .scene-b.on .detail { color: rgba(4, 33, 31, .75); }

  @media (max-width: 1023px) { .scenes { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) { .scenes { grid-template-columns: 1fr; } }
</style>
