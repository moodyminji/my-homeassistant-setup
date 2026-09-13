<script lang="ts">
  import { onMount } from "svelte";
  import NavRail from "./lib/components/NavRail.svelte";
  import TopBar from "./lib/components/TopBar.svelte";
  import RoomTabs from "./lib/components/RoomTabs.svelte";
  import ClimateTile from "./lib/components/ClimateTile.svelte";
  import { startHomeAssistant, connectionState, entities, areaGroups, config } from "./lib/ha/stores";
  import { callService } from "./lib/ha/service";
  import { findClimateEntity, toClimateView, hvacModeFor, type Mode } from "./lib/ha/climate";
  import { DEMO_ROOMS, DEMO_WEATHER, DEMO_STATUS } from "./lib/demo";

  const isDemo = new URLSearchParams(window.location.search).has("demo");

  let activeRoomId: string | null = null;

  onMount(() => {
    if (!isDemo) startHomeAssistant();
  });

  // --- rooms -------------------------------------------------------------
  $: rooms = isDemo
    ? DEMO_ROOMS.map((r) => ({ id: r.id, name: r.name, count: r.count }))
    : $areaGroups.map((g) => ({
        id: g.area.area_id,
        name: g.area.name,
        count: Object.keys(g.entities).length,
      }));

  $: if (activeRoomId === null && rooms.length > 0) activeRoomId = rooms[0].id;

  $: activeRoomName = rooms.find((r) => r.id === activeRoomId)?.name ?? "Home";

  // --- climate -----------------------------------------------------------
  // Demo interactions are local so the dial actually responds while reviewing.
  let demoState = Object.fromEntries(
    DEMO_ROOMS.map((r) => [r.id, { target: r.climate.target, mode: r.climate.mode, on: r.climate.on }]),
  );

  $: activeGroup = $areaGroups.find((g) => g.area.area_id === activeRoomId) ?? null;
  $: climateEntity = activeGroup ? findClimateEntity(activeGroup.entities) : null;
  $: liveClimate = climateEntity ? toClimateView(climateEntity) : null;

  $: demoRoom = DEMO_ROOMS.find((r) => r.id === activeRoomId) ?? null;
  $: demoClimate =
    demoRoom && activeRoomId
      ? {
          name: demoRoom.climate.name,
          target: demoState[activeRoomId].target,
          minTemp: 16,
          maxTemp: 30,
          current: demoRoom.climate.current,
          humidity: demoRoom.climate.humidity,
          mode: demoState[activeRoomId].mode,
          on: demoState[activeRoomId].on,
          availableModes: ["Cooling", "Fan", "Dry", "Auto"] as Mode[],
        }
      : null;

  $: climate = isDemo ? demoClimate : liveClimate;

  function setPower(next: boolean) {
    if (isDemo && activeRoomId) {
      demoState[activeRoomId].on = next;
      demoState = demoState;
      return;
    }
    if (!liveClimate) return;
    callService("climate", next ? "turn_on" : "turn_off", {}, { entity_id: liveClimate.entityId });
  }

  function setTarget(next: number) {
    if (isDemo && activeRoomId) {
      demoState[activeRoomId].target = next;
      demoState = demoState;
      return;
    }
    if (!liveClimate) return;
    callService("climate", "set_temperature", { temperature: next }, { entity_id: liveClimate.entityId });
  }

  function setMode(next: Mode) {
    if (isDemo && activeRoomId) {
      demoState[activeRoomId].mode = next;
      demoState = demoState;
      return;
    }
    if (!liveClimate) return;
    callService("climate", "set_hvac_mode", { hvac_mode: hvacModeFor(next) }, { entity_id: liveClimate.entityId });
  }

  // --- top bar -----------------------------------------------------------
  $: weatherEntity = Object.values($entities).find((e) => e.entity_id.startsWith("weather."));

  $: weather = isDemo
    ? DEMO_WEATHER
    : {
        temp:
          typeof weatherEntity?.attributes.temperature === "number"
            ? `${Math.round(weatherEntity.attributes.temperature)}°`
            : null,
        place: $config?.location_name ?? "",
        condition: weatherEntity?.state ?? "",
      };

  $: statusText = isDemo ? DEMO_STATUS : liveStatus($areaGroups, $entities);

  function liveStatus(
    groups: typeof $areaGroups,
    all: typeof $entities,
  ): string {
    const parts: string[] = [];

    const activeRooms = groups.filter((g) =>
      Object.values(g.entities).some((e) => e.state === "on"),
    ).length;
    if (activeRooms > 0) parts.push(`${activeRooms} room${activeRooms === 1 ? "" : "s"} active`);

    const locks = Object.values(all).filter((e) => e.entity_id.startsWith("lock."));
    if (locks.length > 0) {
      const unlocked = locks.filter((l) => l.state !== "locked").length;
      parts.push(unlocked === 0 ? "everything's locked up" : `${unlocked} unlocked`);
    }

    return parts.join(" · ");
  }
</script>

<div class="app">
  <NavRail />

  <main>
    <TopBar
      title={activeRoomName}
      {statusText}
      weatherTemp={weather.temp}
      weatherPlace={weather.place}
      weatherCondition={weather.condition}
    />

    {#if rooms.length === 0}
      <div class="tile notice">
        <div class="lbl">No areas yet</div>
        <p>
          {#if $connectionState === "error"}
            Can't reach Home Assistant — check <code>VITE_HA_URL</code> and
            <code>VITE_HA_TOKEN</code> in <code>frontend/.env.local</code>.
          {:else}
            Home Assistant has no areas configured. Create rooms as areas in HA
            and assign devices to them — they'll appear here automatically.
            To preview the design against the reference in the meantime, open
            <code>?demo=1</code>.
          {/if}
        </p>
      </div>
    {:else}
      <RoomTabs {rooms} bind:activeId={activeRoomId} />

      <div class="grid">
        {#if climate}
          <ClimateTile
            name={climate.name}
            target={climate.target}
            minTemp={climate.minTemp}
            maxTemp={climate.maxTemp}
            current={climate.current}
            humidity={climate.humidity}
            mode={climate.mode}
            on={climate.on}
            availableModes={climate.availableModes}
            on:power={(e) => setPower(e.detail)}
            on:target={(e) => setTarget(e.detail)}
            on:mode={(e) => setMode(e.detail)}
          />
        {:else}
          <div class="tile notice span2">
            <div class="lbl">Climate</div>
            <p>No climate entity assigned to {activeRoomName}.</p>
          </div>
        {/if}
      </div>
    {/if}
  </main>
</div>

<style>
  .app {
    max-width: 1240px;
    margin: 0 auto;
    height: 100dvh;
    display: grid;
    grid-template-columns: 76px 1fr;
    gap: 0;
    padding: 0;
  }

  main {
    padding: 22px 26px 34px;
    min-width: 0;
    /* Kiosk: the page never scrolls, overflow lives here (DESIGN.md §6). */
    overflow-y: auto;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    grid-auto-rows: minmax(10px, auto);
  }

  .tile {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--r);
    padding: 16px;
    box-shadow: var(--sh);
    position: relative;
    min-width: 0;
  }
  .lbl {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--faint);
  }

  .notice { grid-column: span 2; }
  .notice p { color: var(--muted); font-size: 14px; margin: 8px 0 0; }
  .notice code {
    font-family: var(--mono);
    font-size: 12px;
    background: var(--panel-2);
    padding: 1px 5px;
    border-radius: 6px;
  }
  .span2 { grid-column: span 2; }

  @media (max-width: 1023px) {
    .grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 640px) {
    .app { grid-template-columns: 1fr; }
    main { padding-bottom: 80px; }
    .grid { grid-template-columns: 1fr; }
    .notice, .span2 { grid-column: span 1; }
  }
</style>
