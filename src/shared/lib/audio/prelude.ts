// Module-level singleton — the only reliable way to play audio from a user gesture
const audio = new Audio("/prelude.mp3");
audio.loop = true;
audio.volume = 0.32;

export function startPrelude() {
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function stopPrelude() {
  audio.pause();
  audio.currentTime = 0;
}
