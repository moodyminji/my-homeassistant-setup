<script lang="ts">
  import TopBar from "../components/TopBar.svelte";
</script>

<TopBar kicker="Apps" title="App Launcher">
  <svelte:fragment slot="sub">Shortcuts to things Home Assistant doesn't control — open on the tablet or in a browser</svelte:fragment>
</TopBar>

<p class="stub">The launcher grid comes after Rooms.</p>

<style>
  .stub { color: var(--muted); font-size: 14px; }
</style>
