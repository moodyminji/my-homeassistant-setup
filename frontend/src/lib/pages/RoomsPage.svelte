<script lang="ts">
  import TopBar from "../components/TopBar.svelte";
</script>

<TopBar kicker="Rooms" title="Rooms">
  <svelte:fragment slot="sub">Floor and room tabs, climate dial, lights and devices</svelte:fragment>
</TopBar>

<p class="stub">Floor tabs, room tabs and the room grid land in stage 3.</p>

<style>
  .stub { color: var(--muted); font-size: 14px; }
</style>
