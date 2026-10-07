// Keep the WallPanel screensaver from hiding / eating taps on an intercom call.
//
// Problem: WallPanel's screensaver is a full-screen layer (z-index 1000) above SIP Core's call
// popup, and it swallows the tap that wakes it plus every click for the next second. So a call
// that arrives while a tablet is idle rings, but Answer/Decline do nothing until you reload.
// WallPanel has no idea a call is ringing (it only knows about browser-mod popups).
//
// Fix: when SIP Core says a call started, send WallPanel a synthetic mouse-move, which it treats
// as "user is here" and dismisses the screensaver (and restarts its idle timer). Repeat every
// 30 s until the call ends, so a long call isn't covered by the screensaver either.
//
// The event needs real coordinates: at (0,0) WallPanel reads it as the "next image" touch zone
// and ignores it. Screen centre is outside every touch zone.
//
// Confirmed intermittent (2026-09-22): WallPanel measures the nudge's position as a fraction of
// its screensaver container's live layout box, so a nudge that lands while that box is still
// mid-transition (e.g. right as the screensaver is spinning up when the call arrives) gets
// silently dropped instead of dismissing the overlay. One nudge is a coin flip; fire a short
// burst so a later one lands once layout has settled, on top of the 30 s heartbeat for long calls.
//
// Source of truth is this file; HA serves the copy in homeassistant/www/ (root-owned):
//   sudo install -m 644 homeassistant/dashboards/majlis-call-wake.js homeassistant/www/
// Loaded on every frontend page via `frontend: extra_module_url:` in configuration.yaml.

const BURST_DELAYS_MS = [0, 250, 600, 1200, 2000];
const NUDGE_EVERY_MS = 30000;
let timer = null;
let burstTimers = [];

function nudge() {
  window.dispatchEvent(
    new MouseEvent("mousemove", {
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 2,
    })
  );
}

window.addEventListener("sipcore-call-started", () => {
  burstTimers.forEach(clearTimeout);
  burstTimers = BURST_DELAYS_MS.map((delay) => setTimeout(nudge, delay));
  if (timer === null) timer = setInterval(nudge, NUDGE_EVERY_MS);
});

window.addEventListener("sipcore-call-ended", () => {
  burstTimers.forEach(clearTimeout);
  burstTimers = [];
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
});
