<script lang="ts">
  import { onMount } from "svelte";
  import { startHomeAssistant, connectionState, entitiesForArea } from "./lib/ha/stores";
  import { callService } from "./lib/ha/service";

  const AREA_NAME = "Majlis";
  const areaEntities = entitiesForArea(AREA_NAME);

  onMount(() => {
    startHomeAssistant();
  });

  function toggle(entityId: string, currentState: string) {
    const domain = entityId.split(".")[0];
    const turnOn = currentState !== "on";
    callService(domain, turnOn ? "turn_on" : "turn_off", {}, { entity_id: entityId });
  }
</script>

<main>
  <header>
    <h1>Majlis Control</h1>
    <span class="status status-{$connectionState}">{$connectionState}</span>
  </header>

  <section class="area">
    <h2>{AREA_NAME}</h2>

    {#if Object.keys($areaEntities).length === 0}
      <p class="empty">
        No entities assigned to the "{AREA_NAME}" area yet — assign a device to
        it in Home Assistant and it will appear here automatically, no code
        change needed.
      </p>
    {:else}
      <div class="tiles">
        {#each Object.values($areaEntities) as entity (entity.entity_id)}
          <button class="tile" on:click={() => toggle(entity.entity_id, entity.state)}>
            <span class="name">{entity.attributes.friendly_name ?? entity.entity_id}</span>
            <span class="state">{entity.state}</span>
          </button>
        {/each}
      </div>
    {/if}
  </section>
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 24px 20px 48px;
  }

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }

  .status {
    font-family: var(--mono);
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid var(--border);
    color: var(--text);
  }
  .status-connected {
    color: var(--accent);
    border-color: var(--accent-border);
    background: var(--accent-bg);
  }
  .status-error {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.5);
    background: rgba(239, 68, 68, 0.1);
  }

  .area {
    margin-top: 32px;
    text-align: left;
  }

  .empty {
    color: var(--text);
    line-height: 150%;
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }

  .tile {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--code-bg);
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      border-color 0.2s,
      background 0.2s;
  }
  .tile:hover {
    border-color: var(--accent-border);
  }

  .name {
    font-weight: 500;
    color: var(--text-h);
  }

  .state {
    font-family: var(--mono);
    font-variant-numeric: tabular-nums;
    font-size: 13px;
    color: var(--accent);
  }
</style>
