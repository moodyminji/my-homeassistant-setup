<script lang="ts">
  import { onMount } from "svelte";
  import NavRail from "./lib/components/NavRail.svelte";
  import { route, PAGE_IDS, type PageId } from "./lib/router";
  import { startHomeAssistant } from "./lib/ha/stores";

  import HomePage from "./lib/pages/HomePage.svelte";
  import RoomsPage from "./lib/pages/RoomsPage.svelte";
  import DevicesPage from "./lib/pages/DevicesPage.svelte";
  import AppsPage from "./lib/pages/AppsPage.svelte";
  import AutosPage from "./lib/pages/AutosPage.svelte";
  import EnergyPage from "./lib/pages/EnergyPage.svelte";
  import SecurityPage from "./lib/pages/SecurityPage.svelte";
  import IntercomPage from "./lib/pages/IntercomPage.svelte";
  import SettingsPage from "./lib/pages/SettingsPage.svelte";

  const isDemo = new URLSearchParams(window.location.search).has("demo");

  const pages: Record<PageId, typeof HomePage> = {
    home: HomePage,
    rooms: RoomsPage,
    devices: DevicesPage,
    apps: AppsPage,
    autos: AutosPage,
    energy: EnergyPage,
    security: SecurityPage,
    intercom: IntercomPage,
    settings: SettingsPage,
  };

  let view: HTMLDivElement;

  onMount(() => {
    if (!isDemo) startHomeAssistant();
  });

  // Every page stays mounted and is toggled with [hidden], like the reference —
  // that keeps each page's state (selected room, filters) across navigation and
  // lets the fade animation replay when it comes back into display.
  $: if (view && $route) view.scrollTop = 0;
</script>

<div class="os">
  <NavRail />

  <div class="view" bind:this={view}>
    {#each PAGE_IDS as id (id)}
      <section class="page" hidden={$route !== id}>
        <svelte:component this={pages[id]} />
      </section>
    {/each}
  </div>
</div>

<style>
  .os {
    display: grid;
    grid-template-columns: 96px 1fr;
    height: 100dvh;
    min-height: 560px;
  }

  .view {
    overflow-y: auto;
    padding: 22px 26px 40px;
    position: relative;
  }

  .page { animation: fade .22s ease; }
  .page[hidden] { display: none !important; }

  @keyframes fade {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .page { animation: none; }
  }

  @media (max-width: 640px) {
    .os { grid-template-columns: 1fr; }
    .view { padding-bottom: 80px; }
  }
</style>
