<script lang="ts">
  import TopBar from "../components/TopBar.svelte";
</script>

<TopBar kicker="Energy" title="Power Statistics">
  <svelte:fragment slot="sub">Live draw, daily use and where it's going</svelte:fragment>
</TopBar>

<p class="stub">Stat row, 7-day bars and the by-area breakdown come after Rooms.</p>

<style>
  .stub { color: var(--muted); font-size: 14px; }
</style>
