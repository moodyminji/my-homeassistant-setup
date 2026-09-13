<script lang="ts">
  type Room = { id: string; name: string; count: number };

  export let rooms: Room[] = [];
  export let activeId: string | null = null;
</script>

<div class="rooms" role="tablist">
  {#each rooms as room (room.id)}
    <button
      class="room"
      class:on={room.id === activeId}
      role="tab"
      aria-selected={room.id === activeId}
      on:click={() => (activeId = room.id)}
    >
      {room.name} <span class="cnt">{room.count}</span>
    </button>
  {/each}
</div>

<style>
  .rooms {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    margin-bottom: 20px;
    scrollbar-width: thin;
  }

  .room {
    flex: none;
    padding: 9px 16px;
    border-radius: 99px;
    background: var(--panel);
    border: 1px solid var(--line);
    color: var(--muted);
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    transition: .15s;
    /* DESIGN.md §6: room pills must be tappable */
    min-height: 44px;
  }
  .room .cnt {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--faint);
    background: var(--panel-3);
    padding: 1px 7px;
    border-radius: 99px;
  }
  .room:hover { color: var(--ink); border-color: var(--line-2); }
  .room.on { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .room.on .cnt { background: rgba(128, 128, 128, .25); color: inherit; }
</style>
