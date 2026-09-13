<script lang="ts">
  /** Icon paths lifted from majlis-dashboard-reference.html. */
  export let name:
    | "bulb"
    | "lock"
    | "plug"
    | "vacuum"
    | "curtains"
    | "sun"
    | "moon"
    | "tv"
    | "pulse"
    | "air"
    | "water";
  export let strokeWidth = 1.8;
</script>

<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#if name === "bulb"}
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z" />
  {:else if name === "lock"}
    <rect x="7" y="9" width="10" height="12" rx="2" />
    <path d="M9 9V6a3 3 0 0 1 6 0v3" />
  {:else if name === "plug"}
    <path d="M8 3v4M16 3v4M6 7h12v4a6 6 0 0 1-12 0z" />
    <path d="M12 17v4" />
  {:else if name === "vacuum"}
    <path d="M3 7h13v10H3zM16 10h3l2 2v3h-5" />
    <circle cx="7" cy="17" r="1.6" />
    <circle cx="18" cy="17" r="1.6" />
  {:else if name === "curtains"}
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M4 10h16M9 4v6" />
  {:else if name === "sun"}
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  {:else if name === "moon"}
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  {:else if name === "tv"}
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M8 21h8" />
  {:else if name === "pulse"}
    <path d="M3 12h4l2-7 4 14 2-7h6" />
  {:else if name === "air"}
    <path d="M3 8h11a3 3 0 1 0-3-3" />
    <path d="M3 12h15a3 3 0 1 1-3 3" />
    <path d="M3 16h8" />
  {:else if name === "water"}
    <path d="M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3z" />
  {/if}
</svg>
