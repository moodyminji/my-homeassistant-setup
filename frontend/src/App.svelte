<script lang="ts">
  import { onMount } from "svelte";
  import NavRail from "./lib/components/NavRail.svelte";
  import TopBar from "./lib/components/TopBar.svelte";
  import RoomTabs from "./lib/components/RoomTabs.svelte";
  import ClimateTile from "./lib/components/ClimateTile.svelte";
  import LightTile from "./lib/components/LightTile.svelte";
  import DeviceTile from "./lib/components/DeviceTile.svelte";
  import CameraTile from "./lib/components/CameraTile.svelte";
  import EnergyTile from "./lib/components/EnergyTile.svelte";
  import StatTile from "./lib/components/StatTile.svelte";
  import SceneRow from "./lib/components/SceneRow.svelte";
  import { startHomeAssistant, connectionState, entities, areaGroups, config } from "./lib/ha/stores";
  import { callService } from "./lib/ha/service";
  import { haBaseUrl } from "./lib/ha/connection";
  import { findClimateEntity, toClimateView, hvacModeFor, type Mode } from "./lib/ha/climate";
  import {
    lightsIn,
    devicesIn,
    cameraIn,
    energyIn,
    airQualityIn,
    waterHeaterIn,
    scenesIn,
    deviceService,
  } from "./lib/ha/entities";
  import {
    DEMO_ROOMS,
    DEMO_WEATHER,
    DEMO_STATUS,
    DEMO_ENERGY,
    DEMO_STATS,
    DEMO_SCENES,
    DEMO_ACTIVE_SCENE,
  } from "./lib/demo";

  const isDemo = new URLSearchParams(window.location.search).has("demo");

  let activeRoomId: string | null = null;
  let activeSceneId: string | null = isDemo ? DEMO_ACTIVE_SCENE : null;

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

  $: activeGroup = $areaGroups.find((g) => g.area.area_id === activeRoomId) ?? null;
  $: roomEntities = activeGroup?.entities ?? {};
  $: demoRoom = DEMO_ROOMS.find((r) => r.id === activeRoomId) ?? null;

  // --- climate -----------------------------------------------------------
  // Demo interactions are local so controls actually respond while reviewing.
  let demoState = Object.fromEntries(
    DEMO_ROOMS.map((r) => [r.id, { target: r.climate.target, mode: r.climate.mode, on: r.climate.on }]),
  );
  let demoLights = Object.fromEntries(
    DEMO_ROOMS.flatMap((r) => r.lights.map((l) => [l.entityId, l.brightness])),
  );
  let demoDevices = Object.fromEntries(
    DEMO_ROOMS.flatMap((r) => r.devices.map((d) => [d.entityId, d.active])),
  );

  $: climateEntity = findClimateEntity(roomEntities);
  $: liveClimate = climateEntity ? toClimateView(climateEntity) : null;

  $: climate =
    isDemo && demoRoom && activeRoomId
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
      : liveClimate;

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

  // --- lights ------------------------------------------------------------
  $: lights =
    isDemo && demoRoom
      ? demoRoom.lights.map((l) => ({ ...l, brightness: demoLights[l.entityId] }))
      : lightsIn(roomEntities);

  function setBrightness(entityId: string, pct: number) {
    if (isDemo) {
      demoLights[entityId] = pct;
      demoLights = demoLights;
      return;
    }
    if (pct <= 0) {
      callService("light", "turn_off", {}, { entity_id: entityId });
    } else {
      callService("light", "turn_on", { brightness_pct: pct }, { entity_id: entityId });
    }
  }

  // --- devices -----------------------------------------------------------
  $: devices =
    isDemo && demoRoom
      ? demoRoom.devices.map((d) => {
          const active = demoDevices[d.entityId];
          return { ...d, active, stateText: active ? d.onText : d.offText };
        })
      : devicesIn(roomEntities);

  function toggleDevice(entityId: string, next: boolean) {
    if (isDemo) {
      demoDevices[entityId] = next;
      demoDevices = demoDevices;
      return;
    }
    const call = deviceService(entityId, next);
    if (call) callService(call.domain, call.service, {}, { entity_id: entityId });
  }

  // --- camera / energy / stats / scenes ----------------------------------
  $: camera =
    isDemo && demoRoom
      ? demoRoom.camera
        ? { ...demoRoom.camera, snapshot: null }
        : null
      : (() => {
          const c = cameraIn(roomEntities, haBaseUrl);
          return c ? { ...c, detection: null } : null;
        })();

  $: energy = isDemo ? DEMO_ENERGY : (() => {
    const e = energyIn($entities);
    return e ? { ...e, points: [] as number[] } : null;
  })();

  $: stats = isDemo
    ? DEMO_STATS
    : [airQualityIn(roomEntities), waterHeaterIn(roomEntities)].filter((s) => s !== null);

  $: scenes = isDemo ? DEMO_SCENES : scenesIn($entities);

  function activateScene(id: string) {
    activeSceneId = id;
    if (!isDemo) callService("scene", "turn_on", {}, { entity_id: id });
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

  function liveStatus(groups: typeof $areaGroups, all: typeof $entities): string {
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
        {/if}

        {#each lights as light (light.entityId)}
          <LightTile
            name={light.name}
            brightness={light.brightness}
            descriptor={light.descriptor}
            on:brightness={(e) => setBrightness(light.entityId, e.detail)}
          />
        {/each}

        {#if camera}
          <CameraTile
            name={camera.name}
            statusText={camera.statusText}
            snapshot={camera.snapshot}
            detection={camera.detection}
          />
        {/if}

        {#each devices as device (device.entityId)}
          <DeviceTile
            name={device.name}
            stateText={device.stateText}
            active={device.active}
            icon={device.icon}
            on:toggle={(e) => toggleDevice(device.entityId, e.detail)}
          />
        {/each}

        {#if energy}
          <EnergyTile
            value={energy.value}
            unit={energy.unit}
            delta={energy.delta}
            points={energy.points}
          />
        {/if}

        {#each stats as stat (stat.label)}
          <StatTile label={stat.label} value={stat.value} detail={stat.detail} />
        {/each}
      </div>

      {#if scenes.length > 0}
        <SceneRow {scenes} activeId={activeSceneId} on:activate={(e) => activateScene(e.detail)} />
      {/if}
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

  .notice { grid-column: span 2; }
  .notice p { color: var(--muted); font-size: 14px; margin: 8px 0 0; }
  .notice code {
    font-family: var(--mono);
    font-size: 12px;
    background: var(--panel-2);
    padding: 1px 5px;
    border-radius: 6px;
  }

  @media (max-width: 1023px) {
    .grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 640px) {
    .app { grid-template-columns: 1fr; }
    main { padding-bottom: 80px; }
    .grid { grid-template-columns: 1fr; }
    .notice { grid-column: span 1; }
  }
</style>
