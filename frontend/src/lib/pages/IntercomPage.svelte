<script lang="ts">
  import TopBar from "../components/TopBar.svelte";
</script>

<TopBar kicker="Intercom" title="House Intercom">
  <svelte:fragment slot="sub">Call a panel, or page every floor at once · WebRTC, on your network</svelte:fragment>
</TopBar>

<p class="stub">Page-the-house and per-panel call buttons come after Rooms.</p>

<style>
  .stub { color: var(--muted); font-size: 14px; }
</style>
