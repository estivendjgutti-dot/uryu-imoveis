const video = document.querySelector("#bg-video");
const canvas = document.querySelector("#bg-canvas");
if (canvas) canvas.hidden = true;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let frame = 0,
  settled = 0,
  ready = false;
function progress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
}
function update() {
  frame = 0;
  if (!ready || document.hidden || reduced.matches) return;
  const wanted = progress();
  settled += (wanted - settled) * 0.24;
  if (Math.abs(wanted - settled) < 0.001) settled = wanted;
  const t = settled * Math.max(0, video.duration - 0.05);
  if (!video.seeking && Math.abs(video.currentTime - t) > 0.025)
    video.currentTime = t;
  const code = document.querySelector("#timecode");
  if (code)
    code.textContent = `00:${String(Math.floor(t)).padStart(2, "0")} / 00:${String(Math.floor(video.duration)).padStart(2, "0")}`;
  const dot = document.querySelector("#spine-dot");
  if (dot) dot.style.top = `${settled * 100}%`;
  if (Math.abs(wanted - settled) > 0.001 || video.seeking)
    frame = requestAnimationFrame(update);
}
function schedule() {
  if (!frame) frame = requestAnimationFrame(update);
}
video?.addEventListener("loadeddata", () => {
  ready = true;
  video.pause();
  schedule();
});
video?.addEventListener("seeked", schedule);
addEventListener("scroll", schedule, { passive: true });
addEventListener("resize", schedule, { passive: true });
document.addEventListener("visibilitychange", schedule);
reduced.addEventListener("change", () => {
  if (reduced.matches) {
    cancelAnimationFrame(frame);
    frame = 0;
    video.pause();
    video.currentTime = 0;
  } else schedule();
});
if (video?.readyState >= 2) {
  ready = true;
  schedule();
}
