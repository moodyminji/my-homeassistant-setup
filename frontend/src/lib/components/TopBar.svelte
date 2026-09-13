<script lang="ts">
  import { onDestroy } from "svelte";

  export let title = "Home";
  export let statusText = "";
  export let weatherTemp: string | null = null;
  export let weatherPlace = "";
  export let weatherCondition = "";

  let greeting = "";
  let clock = "";

  function tick() {
    const d = new Date();
    const h = d.getHours();
    greeting =
      h < 5 ? "Late night" :
      h < 12 ? "Good morning" :
      h < 17 ? "Good afternoon" :
      h < 21 ? "Good evening" : "Good night";
    clock = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  tick();
  const timer = setInterval(tick, 10000);
  onDestroy(() => clearInterval(timer));
</script>

<div class="topbar">
  <div class="hello">
    <div class="k">{greeting}</div>
    <h1>{title}</h1>
    <div class="sub">
      {#if statusText}{statusText} · {/if}<span class="mono">{clock}</span>
    </div>
  </div>

  <div class="wx">
    <div class="wxcard">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--heat)" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      <div>
        <div class="big">{weatherTemp ?? "—"}</div>
        <div class="lil">{weatherPlace}<br />{weatherCondition}</div>
      </div>
    </div>
    <button class="icbtn" aria-label="Notifications">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
    </button>
  </div>
</div>

<style>
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }

  .hello .k {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--accent);
    font-weight: 600;
  }
  .hello h1 {
    font-size: clamp(24px, 3.4vw, 32px);
    font-weight: 800;
    margin-top: 3px;
  }
  .hello .sub { color: var(--muted); font-size: 14px; margin-top: 3px; }

  .wx { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }

  .wxcard {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    padding: 9px 14px;
    box-shadow: var(--sh);
  }
  .wxcard .big { font-family: var(--disp); font-weight: 700; font-size: 20px; }
  .wxcard .lil { font-size: 12px; color: var(--muted); line-height: 1.25; }

  .icbtn {
    width: 44px;
    height: 44px;
    border-radius: 11px;
    background: var(--panel);
    border: 1px solid var(--line);
    display: grid;
    place-items: center;
    color: var(--muted);
    box-shadow: var(--sh);
  }
  .icbtn:hover { color: var(--accent); border-color: var(--accent); }
</style>
