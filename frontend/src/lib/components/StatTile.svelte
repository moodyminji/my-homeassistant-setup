<script lang="ts">
  export let label = "";
  export let value = "";
  export let detail = "";
</script>

<div class="tile stat">
  <div class="lbl">{label}</div>
  <div class="big">{value}</div>
  <div class="detail">{detail}</div>
</div>

<style>
  .stat { display: flex; flex-direction: column; justify-content: center; }
  .big {
    font-family: var(--disp);
    font-weight: 800;
    font-size: 26px;
    margin-top: 6px;
  }
  .detail { font-size: 12px; color: var(--muted); margin-top: 2px; }
</style>
