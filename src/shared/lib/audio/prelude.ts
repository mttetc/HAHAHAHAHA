let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let source: AudioBufferSourceNode | null = null;
let gain: GainNode | null = null;

export async function startPrelude(): Promise<void> {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  if (!buffer) {
    const resp = await fetch("/prelude.mp3");
    const ab = await resp.arrayBuffer();
    buffer = await ctx.decodeAudioData(ab);
  }
  // Stop any existing source before starting a new one
  try { source?.stop(); } catch {}
  try { source?.disconnect(); } catch {}
  try { gain?.disconnect(); } catch {}

  gain = ctx.createGain();
  gain.gain.value = 0.32;
  gain.connect(ctx.destination);

  source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(gain);
  source.start();
}

export function stopPrelude(): void {
  try { source?.stop(); } catch {}
  try { source?.disconnect(); } catch {}
  try { gain?.disconnect(); } catch {}
  source = null;
  gain = null;
}
