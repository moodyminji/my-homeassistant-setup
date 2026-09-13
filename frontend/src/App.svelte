<script lang="ts">
  import { onMount } from "svelte";
  import { startHomeAssistant, connectionState, areaGroups } from "./lib/ha/stores";
  import { callService } from "./lib/ha/service";

  let activeAreaId: string | null = null;

  onMount(() => {
    startHomeAssistant();
  });

  $: if (activeAreaId === null && $areaGroups.length > 0) {
    activeAreaId = $areaGroups[0].area.area_id;
  }

  $: activeGroup = $areaGroups.find((g) => g.area.area_id === activeAreaId) ?? null;

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

  {#if $areaGroups.length === 0}
    <p class="empty">
      No areas configured in Home Assistant yet. Create rooms/floors as
      "areas" in HA and assign devices to them — they'll appear here
      automatically, no code change needed.
    </p>
  {:else}
    <nav class="area-tabs">
      {#each $areaGroups as group (group.area.area_id)}
        <button
          class="tab"
          class:active={group.area.area_id === activeAreaId}
          on:click={() => (activeAreaId = group.area.area_id)}
        >
          {group.area.name}
        </button>
      {/each}
    </nav>

    {#if activeGroup}
      <section class="area">
        {#if Object.keys(activeGroup.entities).length === 0}
          <p class="empty">
            No entities assigned to "{activeGroup.area.name}" yet.
          </p>
        {:else}
          <div class="tiles">
            {#each Object.values(activeGroup.entities) as entity (entity.entity_id)}
              <button class="tile" on:click={() => toggle(entity.entity_id, entity.state)}>
                <span class="name">{entity.attributes.friendly_name ?? entity.entity_id}</span>
                <span class="state">{entity.state}</span>
              </button>
            {/each}
          </div>
        {/if}
      </section>
    {/if}
  {/if}
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

  .empty {
    margin-top: 24px;
    color: var(--text);
    line-height: 150%;
  }

  .area-tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    margin-top: 24px;
    padding-bottom: 4px;
  }

  .tab {
    flex: none;
    font: inherit;
    color: var(--text);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 6px 16px;
    cursor: pointer;
    white-space: nowrap;
    transition:
      border-color 0.2s,
      color 0.2s,
      background 0.2s;
  }
  .tab:hover {
    border-color: var(--accent-border);
  }
  .tab.active {
    color: var(--accent);
    border-color: var(--accent-border);
    background: var(--accent-bg);
  }

  .area {
    margin-top: 20px;
    text-align: left;
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
