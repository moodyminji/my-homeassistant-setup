<script lang="ts">
  import TopBar from "../components/TopBar.svelte";
</script>

<TopBar kicker="Devices" title="All Devices">
  <svelte:fragment slot="sub">By device, not by room — multi-function devices keep their controls together</svelte:fragment>
</TopBar>

<p class="stub">Search, type filters and grouped device rows come after Rooms.</p>

<style>
  .stub { color: var(--muted); font-size: 14px; }
</style>
