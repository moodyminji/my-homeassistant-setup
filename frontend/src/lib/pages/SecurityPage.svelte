<script lang="ts">
  import TopBar from "../components/TopBar.svelte";
</script>

<TopBar kicker="Security" title="Cameras & Locks">
  <svelte:fragment slot="sub">Frigate feeds, doors and sensors</svelte:fragment>
</TopBar>

<p class="stub">Arm controls, the camera wall and sensor rows come after Rooms.</p>

<style>
  .stub { color: var(--muted); font-size: 14px; }
</style>
