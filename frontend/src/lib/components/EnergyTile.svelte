<script lang="ts">
  export let label = "Energy · today";
  export let value: string | null = null;
  export let unit = "kWh";
  export let delta: string | null = null;
  /** Sparkline samples, oldest first. Rendered across the reference's
   *  300×44 viewBox; omitted entirely when there's no history to show. */
  export let points: number[] = [];

  // Unique per instance so multiple sparklines don't share a gradient id.
  const gradientId = `spark-${Math.random().toString(36).slice(2, 9)}`;

  const W = 300;
  const H = 44;
  // Band the line sits in, matching the reference sparkline's 8–34 range.
  const TOP = 8;
  const BOTTOM = 34;

  $: path = buildPath(points);
  $: fillPath = path ? `${path} L${W} ${H} L0 ${H} Z` : "";

  function buildPath(values: number[]): string {
    if (values.length < 2) return "";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const stepX = W / (values.length - 1);
    return values
      .map((v, i) => {
        const x = Math.round(i * stepX);
        const y = Math.round(BOTTOM - ((v - min) / span) * (BOTTOM - TOP));
        return `${i === 0 ? "M" : "L"}${x} ${y}`;
      })
      .join(" ");
  }
</script>

<div class="tile energy span2">
  <div class="lbl">{label}</div>
  <div class="val">{value ?? "—"}<small> {unit}</small></div>
  {#if delta}<div class="dlt">{delta}</div>{/if}

  {#if path}
    <svg class="spark" viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--accent)" stop-opacity=".35" />
          <stop offset="1" stop-color="var(--accent)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#{gradientId})" />
      <path
        d={path}
        fill="none"
        stroke="var(--accent)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  {/if}
</div>

<style>
  .energy .val {
    font-family: var(--disp);
    font-weight: 800;
    font-size: 30px;
    margin-top: 6px;
    letter-spacing: -.02em;
  }
  .energy .val small { font-size: 14px; color: var(--muted); font-weight: 600; }

  .spark { margin-top: 10px; width: 100%; height: 44px; display: block; }

  .energy .dlt {
    font-size: 12px;
    color: var(--on);
    font-family: var(--mono);
    margin-top: 6px;
  }

  @media (max-width: 640px) { .energy { grid-column: span 1; } }
</style>
