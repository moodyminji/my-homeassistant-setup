<script lang="ts">
  import { toggleTheme } from "../theme";

  export let active: string = "home";

  const sections = [
    { id: "home", label: "Home" },
    { id: "lighting", label: "Lighting" },
    { id: "climate", label: "Climate" },
    { id: "cameras", label: "Cameras" },
    { id: "energy", label: "Energy" },
  ];
</script>

<nav class="rail" aria-label="Sections">
  <div class="railtop" title="Majlis">
    <svg viewBox="0 0 34 34" aria-hidden="true">
      <path d="M8 19.5 17 11l9 8.5" fill="none" stroke="#04211f" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="17" cy="22.5" r="2.4" fill="#04211f"/>
      <path d="M12 22.5a5 5 0 0 1 10 0" fill="none" stroke="#04211f" stroke-width="1.7" stroke-linecap="round" opacity=".6"/>
    </svg>
  </div>

  {#each sections as section (section.id)}
    <button
      class="navbtn"
      class:on={active === section.id}
      title={section.label}
      aria-label={section.label}
      on:click={() => (active = section.id)}
    >
      {#if section.id === "home"}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>
      {:else if section.id === "lighting"}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z"/></svg>
      {:else if section.id === "climate"}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v9"/><circle cx="12" cy="16.5" r="3.5"/><path d="M9 4h6"/></svg>
      {:else if section.id === "cameras"}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="14" height="12" rx="2"/><path d="M17 10l4-2v8l-4-2"/></svg>
      {:else}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3 4 14h7l-1 7 9-11h-7z"/></svg>
      {/if}
    </button>
  {/each}

  <div class="railspace"></div>

  <button class="navbtn" title="Theme" aria-label="Toggle theme" on:click={toggleTheme}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
  </button>
  <button class="navbtn" title="Settings" aria-label="Settings">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.3 1a7 7 0 0 0-1.7-1L14.5 2h-5l-.4 2.5a7 7 0 0 0-1.7 1l-2.3-1-2 3.5L2.6 11a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.3-1a7 7 0 0 0 1.7 1l.4 2.5h5l.4-2.5a7 7 0 0 0 1.7-1l2.3 1 2-3.5-2-1.5a7 7 0 0 0 .1-1z"/></svg>
  </button>
</nav>

<style>
  .rail {
    background: var(--panel);
    border-right: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 18px 0;
    gap: 6px;
    position: sticky;
    top: 0;
    height: 100vh;
  }

  .railtop {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 11px;
    background: linear-gradient(140deg, var(--accent), var(--accent-2));
    margin-bottom: 16px;
    box-shadow: var(--sh);
  }
  .railtop svg { width: 24px; height: 24px; }

  .navbtn {
    width: 48px;
    height: 48px;
    border-radius: 13px;
    display: grid;
    place-items: center;
    color: var(--faint);
    position: relative;
    transition: .15s;
  }
  .navbtn svg { width: 22px; height: 22px; }
  .navbtn:hover { color: var(--ink); background: var(--panel-2); }
  .navbtn.on { color: var(--accent); background: var(--accent-ghost); }
  .navbtn.on::before {
    content: "";
    position: absolute;
    left: -18px;
    top: 12px;
    bottom: 12px;
    width: 3px;
    border-radius: 3px;
    background: var(--accent);
  }

  .railspace { flex: 1; }

  @media (max-width: 640px) {
    .rail {
      position: fixed;
      bottom: 0;
      top: auto;
      height: auto;
      width: 100%;
      flex-direction: row;
      border-right: none;
      border-top: 1px solid var(--line);
      padding: 8px 10px;
      z-index: 20;
      justify-content: space-around;
    }
    .railtop, .railspace { display: none; }
  }
</style>
