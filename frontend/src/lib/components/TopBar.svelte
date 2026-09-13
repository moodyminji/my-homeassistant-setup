<script lang="ts">
  /** The `.bar` header every page carries: kicker, title, sub-line, and an
   *  optional right-hand aside supplied by the page via the `aside` slot. */
  export let kicker = "";
  export let title = "";
</script>

<div class="bar">
  <div>
    <div class="k">{kicker}</div>
    <h1>{title}</h1>
    <div class="sub"><slot name="sub" /></div>
  </div>
  {#if $$slots.aside}
    <div class="baraside"><slot name="aside" /></div>
  {/if}
</div>

<style>
  .bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }
  .k {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--accent);
    font-weight: 600;
  }
  h1 { font-size: clamp(24px, 3.2vw, 32px); font-weight: 800; margin-top: 3px; }
  .sub { color: var(--muted); font-size: 14px; margin-top: 3px; }
  .baraside { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
</style>
