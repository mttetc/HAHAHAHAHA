let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let source: AudioBufferSourceNode | null = null;
let gainNode: GainNode | null = null;
let filterNode: BiquadFilterNode | null = null;

export function primeAudioContext(): void {
  if (!ctx) ctx = new AudioContext();
  // iOS creates AudioContext in "suspended" even inside a user gesture — always try resume
  if (ctx.state === "suspended") ctx.resume();
}

export async function resumeContext(): Promise<void> {
  if (!ctx) return;
  if (ctx.state === "suspended") await ctx.resume();
}

export async function loadAudio(): Promise<void> {
  if (!ctx) ctx = new AudioContext();
  if (buffer) return; // AudioBuffer is reusable — decodeAudioData works regardless of ctx state
  const resp = await fetch("/tidus-laugh.mp3");
  const arrayBuf = await resp.arrayBuffer();
  buffer = await ctx.decodeAudioData(arrayBuf);
}

function teardownNodes(): void {
  if (gainNode) gainNode.gain.value = 0;
  try { source?.stop(); } catch {}
  try { source?.disconnect(); } catch {}
  try { filterNode?.disconnect(); } catch {}
  try { gainNode?.disconnect(); } catch {}
  source = null;
  filterNode = null;
  gainNode = null;
}

export function scheduleAudio(): number {
  if (!ctx || !buffer) throw new Error("Audio not loaded");
  // Clean up any lingering nodes — prevents overlap if called while audio is already playing
  teardownNodes();
  if (ctx.state === "suspended") ctx.resume();

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
  teardownNodes();
  // gainNode.disconnect() is the synchronous kill — disconnecting from destination
  // silences audio immediately at the graph level, no need to suspend the context.
}

export function getAudioElapsedMs(audioStartContextTime: number): number {
  if (!ctx) return 0;
  return Math.max(0, (ctx.currentTime - audioStartContextTime) * 1000);
}
