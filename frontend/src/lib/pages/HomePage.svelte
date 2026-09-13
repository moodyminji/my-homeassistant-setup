<script lang="ts">
  import TopBar from "../components/TopBar.svelte";
  import { greeting, clockText } from "../clock";
</script>

<TopBar kicker={$greeting} title="Majlis Home">
  <svelte:fragment slot="sub">Everything's calm · <span class="mono">{$clockText}</span></svelte:fragment>
</TopBar>

<p class="stub">Favorites, Suggested, Power, Scenes and the Apps strip land in stage 2.</p>

<style>
  .stub { color: var(--muted); font-size: 14px; }
</style>
