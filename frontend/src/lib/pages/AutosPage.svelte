<script lang="ts">
  import TopBar from "../components/TopBar.svelte";
</script>

<TopBar kicker="Automations" title="Automation Center">
  <svelte:fragment slot="sub">Home Assistant runs these — this is where you watch and control them</svelte:fragment>
</TopBar>

<p class="stub">Automation rows come after Rooms.</p>

<style>
  .stub { color: var(--muted); font-size: 14px; }
</style>
