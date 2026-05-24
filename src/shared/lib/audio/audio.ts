let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let source: AudioBufferSourceNode | null = null;
let gainNode: GainNode | null = null;
let filterNode: BiquadFilterNode | null = null;

export function primeAudioContext(): void {
  if (!ctx) {
    ctx = new AudioContext();
  } else if (ctx.state === "suspended") {
    ctx.resume();
  }
}

export async function resumeContext(): Promise<void> {
  if (!ctx) return;
  if (ctx.state === "suspended") await ctx.resume();
}

export async function loadAudio(): Promise<void> {
  if (!ctx) ctx = new AudioContext(); // create (or recreate after close) before the buffer check
  await resumeContext();
  if (buffer) return; // AudioBuffer is reusable across contexts — no need to re-decode
  const resp = await fetch("/tidus-laugh.mp3");
  const arrayBuf = await resp.arrayBuffer();
  buffer = await ctx.decodeAudioData(arrayBuf);
}

export function scheduleAudio(): number {
  if (!ctx || !buffer) throw new Error("Audio not loaded");
  gainNode = ctx.createGain();
  gainNode.gain.value = 1;
  gainNode.connect(ctx.destination);

  filterNode = ctx.createBiquadFilter();
  filterNode.type = "lowpass";
  filterNode.frequency.value = 18000; // start clean (full health)
  filterNode.Q.value = 1.2;
  filterNode.connect(gainNode);

  source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(filterNode);

  const startContextTime = ctx.currentTime;
  source.start(startContextTime);
  return startContextTime;
}

export function setDistortion(health: number, maxHealth: number): void {
  if (!ctx || !filterNode) return;
  // 400Hz at 0 HP (very muffled) → ~18000Hz at full HP (clean)
  const freq = 400 * Math.pow(45, health / maxHealth);
  filterNode.frequency.setTargetAtTime(freq, ctx.currentTime, 0.08);
}

export function stopAudio(): void {
  if (gainNode) gainNode.gain.value = 0;
  try { source?.stop(); } catch { /* already stopped */ }
  try { source?.disconnect(); } catch {}
  try { filterNode?.disconnect(); } catch {}
  try { gainNode?.disconnect(); } catch {}
  source = null;
  filterNode = null;
  gainNode = null;
  // Close the context entirely — suspend() only pauses, so the source would
  // resume on the next game. close() kills all nodes permanently.
  if (ctx) {
    ctx.close().catch(() => {});
    ctx = null;
  }
}

export function getAudioElapsedMs(audioStartContextTime: number): number {
  if (!ctx) return 0;
  return Math.max(0, (ctx.currentTime - audioStartContextTime) * 1000);
}
