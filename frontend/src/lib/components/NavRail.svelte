<script lang="ts">
  import { navigate, route, type PageId } from "../router";
  import { toggleTheme } from "../theme";

  const items: { id: PageId; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "rooms", label: "Rooms" },
    { id: "devices", label: "Devices" },
    { id: "apps", label: "Apps" },
    { id: "autos", label: "Autos" },
    { id: "energy", label: "Energy" },
    { id: "security", label: "Security" },
    { id: "intercom", label: "Intercom" },
  ];
</script>

<nav class="rail" aria-label="Sections">
  <div class="logo" title="Majlis">
    <svg viewBox="0 0 34 34" aria-hidden="true">
      <path d="M8 19.5 17 11l9 8.5" fill="none" stroke="#04211f" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="17" cy="22.5" r="2.4" fill="#04211f"/>
    </svg>
  </div>

  <div class="nav">
    {#each items as item (item.id)}
      <button
        class="navbtn"
        class:on={$route === item.id}
        aria-current={$route === item.id ? "page" : undefined}
        on:click={() => navigate(item.id)}
      >
        {#if item.id === "home"}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>
        {:else if item.id === "rooms"}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>
        {:else if item.id === "devices"}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>
        {:else if item.id === "apps"}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
        {:else if item.id === "autos"}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="3.2"/></svg>
        {:else if item.id === "energy"}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3 4 14h7l-1 7 9-11h-7z"/></svg>
        {:else if item.id === "security"}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/></svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H8l-4 4z"/><path d="M9 10h.01M13 10h.01M17 10h.01"/></svg>
        {/if}
        <span>{item.label}</span>
      </button>
    {/each}
  </div>

  <div class="railspace"></div>

  <div class="nav">
    <button class="navbtn" on:click={toggleTheme}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      <span>Theme</span>
    </button>
    <button
      class="navbtn"
      class:on={$route === "settings"}
      aria-current={$route === "settings" ? "page" : undefined}
      on:click={() => navigate("settings")}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.6 7.6 0 000-2l2-1.5-2-3.5-2.4 1a7 7 0 00-1.7-1L14.9 3H9.1l-.4 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.5L2.6 11a7.6 7.6 0 000 2l-2 1.5 2 3.5 2.4-1a7 7 0 001.7 1l.4 2.5h5.8l.4-2.5a7 7 0 001.7-1l2.4 1 2-3.5z"/></svg>
      <span>Settings</span>
    </button>
  </div>
</nav>

<style>
  .rail {
    background: var(--panel);
    border-right: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 0;
    gap: 4px;
    overflow-y: auto;
  }

  .logo {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(140deg, var(--accent), var(--accent-2));
    display: grid;
    place-items: center;
    margin-bottom: 14px;
    flex: none;
    box-shadow: var(--sh);
  }
  .logo svg { width: 26px; height: 26px; }

  .nav {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 100%;
    align-items: center;
  }

  .navbtn {
    width: 72px;
    padding: 9px 0 7px;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: var(--faint);
    position: relative;
    transition: .14s;
  }
  .navbtn svg { width: 23px; height: 23px; }
  .navbtn span { font-size: 10.5px; font-weight: 600; letter-spacing: .01em; }
  .navbtn:hover { color: var(--ink); background: var(--panel-2); }
  .navbtn.on { color: var(--accent); background: var(--accent-ghost); }
  .navbtn.on::before {
    content: "";
    position: absolute;
    left: -12px;
    top: 14px;
    bottom: 14px;
    width: 3px;
    border-radius: 3px;
    background: var(--accent);
  }

  .railspace { flex: 1; min-height: 8px; }

  /* ≤640px: rail becomes a bottom bar (DESIGN_1.md §6). */
  @media (max-width: 640px) {
    .rail {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      flex-direction: row;
      height: auto;
      width: 100%;
      border-right: none;
      border-top: 1px solid var(--line);
      padding: 6px 8px;
      z-index: 30;
      overflow-x: auto;
      gap: 2px;
    }
    .logo, .railspace { display: none; }
    .nav { flex-direction: row; width: auto; gap: 2px; }
    .navbtn { width: auto; min-width: 60px; flex: 1; }
    .navbtn.on::before { display: none; }
  }
</style>
