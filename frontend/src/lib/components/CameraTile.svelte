<script lang="ts">
  export let name = "Camera";
  export let statusText = "";
  /** Live snapshot URL (HA's entity_picture). Falls back to the reference's
   *  simulated feed when absent. */
  export let snapshot: string | null = null;
  export let live = true;
  export let badgeText = "LIVE";
  /** Detection overlay — only ever set from demo data; we never draw a box
   *  over a real feed that the camera didn't actually report. */
  export let detection: { left: string; top: string; width: string; height: string; label: string } | null = null;
</script>

<div class="tile cam">
  <div class="feed">
    {#if snapshot}
      <img src={snapshot} alt="{name} live view" />
    {/if}
    <div class="scene">
      {#if detection}
        <div
          class="detected"
          style="left:{detection.left};top:{detection.top};width:{detection.width};height:{detection.height}"
        >
          <span>{detection.label}</span>
        </div>
      {/if}
    </div>
  </div>

  {#if live}
    <div class="cbadge"><span class="dot"></span>{badgeText}</div>
  {/if}

  <div class="cfoot">
    <b>{name}</b>
    <span>{statusText}</span>
  </div>
</div>

<style>
  .cam {
    grid-column: span 2;
    padding: 0;
    overflow: hidden;
    position: relative;
    min-height: 190px;
    display: flex;
    align-items: flex-end;
  }

  .feed {
    position: absolute;
    inset: 0;
    /* Simulated feed from the reference, shown until a real snapshot loads. */
    background:
      radial-gradient(120% 90% at 70% 10%, #1b3a49, transparent 60%),
      linear-gradient(160deg, #0e2027, #152a24);
  }
  .feed::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255, 255, 255, .04) 1px, transparent 1px);
    background-size: 100% 3px;
    opacity: .5;
  }
  .feed img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .scene { position: absolute; inset: 0; }

  .cbadge {
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--mono);
    font-size: 11px;
    background: rgba(0, 0, 0, .5);
    color: #fff;
    padding: 4px 9px;
    border-radius: 99px;
    backdrop-filter: blur(6px);
  }
  .cbadge .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--alert);
    animation: pulse 2s infinite;
  }
  @keyframes pulse { 50% { opacity: .35; } }

  .cfoot {
    position: relative;
    z-index: 1;
    width: 100%;
    padding: 12px 14px;
    background: linear-gradient(0deg, rgba(0, 0, 0, .55), transparent);
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .cfoot b { font-family: var(--disp); font-size: 14px; }
  .cfoot span { font-size: 11px; opacity: .8; font-family: var(--mono); }

  /* Reference fills this box with --accent-2, which hides whatever was
     detected; DESIGN.md §7 describes an outline + label, so the fill lives on
     the label chip instead. */
  .detected {
    position: absolute;
    border: 1.5px solid var(--accent-2);
    border-radius: 4px;
    font-family: var(--mono);
    font-size: 9px;
  }
  .detected span {
    position: absolute;
    top: -14px;
    left: -1.5px;
    white-space: nowrap;
    background: var(--accent-2);
    color: #04211f;
    padding: 0 4px;
    border-radius: 3px;
  }

  @media (max-width: 640px) { .cam { grid-column: span 1; } }
</style>
