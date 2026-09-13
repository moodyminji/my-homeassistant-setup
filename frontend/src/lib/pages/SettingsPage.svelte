<script lang="ts">
  import TopBar from "../components/TopBar.svelte";
</script>

<TopBar kicker="Settings" title="System">
  <svelte:fragment slot="sub">This panel &amp; the Majlis host</svelte:fragment>
</TopBar>

<p class="stub">Host health and panel settings come after Rooms.</p>

<style>
  .stub { color: var(--muted); font-size: 14px; }
</style>
