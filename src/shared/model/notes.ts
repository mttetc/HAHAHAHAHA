export const HA_TIMINGS_MS = [
  1150, 1630, 1970, 2330, 2690, 3040, 3400,
  5550, 6100, 6440, 6820, 7180, 7550, 7960, 8390,
];

export const AUDIO_DURATION_MS = 8960;
export const DROP_DURATION_MS = 1500;
export const HIT_ZONE_RATIO = 0.82;
export const PERFECT_WINDOW_MS = 50;
export const GOOD_WINDOW_MS = 120;
export const MAX_LOOPS = 5;
export const MAX_HEALTH = 100;
export const MULTIPLIER_THRESHOLDS = [5, 10, 15]; // combo needed for x2, x3, x4

export function getMultiplier(combo: number): number {
  if (combo >= MULTIPLIER_THRESHOLDS[2]) return 4;
  if (combo >= MULTIPLIER_THRESHOLDS[1]) return 3;
  if (combo >= MULTIPLIER_THRESHOLDS[0]) return 2;
  return 1;
}

export type NoteStatus = "pending" | "hit-perfect" | "hit-good" | "missed";

export type Note = {
  timingMs: number;
  status: NoteStatus;
};

export type HitResult = "perfect" | "good" | null;

export type GameState = {
  notes: Note[];
  score: number;
  combo: number;
  maxCombo: number;
  perfect: number;
  good: number;
  miss: number;
  health: number;
  loopCount: number;
  multiplier: number;
  lastMultiplierMs: number;
  lastHit: HitResult;
  lastHitMs: number;
  lastMissMs: number;
  lastScoreDelta: number;
  lastScoreDeltaMs: number;
  done: boolean;
  failed: boolean;
};

export function createGameState(): GameState {
  return {
    notes: HA_TIMINGS_MS.map((t) => ({ timingMs: t, status: "pending" })),
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfect: 0,
    good: 0,
    miss: 0,
    health: MAX_HEALTH,
    loopCount: 0,
    multiplier: 1,
    lastMultiplierMs: 0,
    lastHit: null,
    lastHitMs: 0,
    lastMissMs: 0,
    lastScoreDelta: 0,
    lastScoreDeltaMs: 0,
    done: false,
    failed: false,
  };
}

export function tickGame(state: GameState, elapsedMs: number): GameState {
  if (state.done) return state;

  let { score, combo, miss, maxCombo, health, loopCount, lastMissMs } = state;
  let scoreDelta = state.lastScoreDelta;
  let scoreDeltaMs = state.lastScoreDeltaMs;
  let notes = [...state.notes];

  // Queue notes for the upcoming loop before they need to appear on screen
  const nextLoopStart = (loopCount + 1) * AUDIO_DURATION_MS;
  if (elapsedMs > nextLoopStart - DROP_DURATION_MS - 200 && loopCount < MAX_LOOPS - 1) {
    const hasNextLoop = notes.some((n) => n.timingMs >= nextLoopStart);
    if (!hasNextLoop) {
      const nextNotes = HA_TIMINGS_MS.map((t) => ({
        timingMs: t + nextLoopStart,
        status: "pending" as NoteStatus,
      }));
      notes = [...notes, ...nextNotes];
      loopCount = loopCount + 1;
    }
  }

  // Mark missed notes
  notes = notes.map((note) => {
    if (note.status === "pending" && elapsedMs > note.timingMs + GOOD_WINDOW_MS) {
      combo = 0;
      miss++;
      health = Math.max(0, health - 15);
      lastMissMs = elapsedMs;
      scoreDeltaMs = elapsedMs;
      scoreDelta = -15;
      return { ...note, status: "missed" as NoteStatus };
    }
    return note;
  });

  const failed = health <= 0;
  const beaten = loopCount >= MAX_LOOPS - 1 && elapsedMs >= MAX_LOOPS * AUDIO_DURATION_MS;
  const newMultiplier = getMultiplier(combo);
  const lastMultiplierMs = newMultiplier !== state.multiplier ? elapsedMs : state.lastMultiplierMs;

  return {
    ...state,
    notes,
    score,
    combo,
    miss,
    maxCombo: Math.max(maxCombo, combo),
    health,
    loopCount,
    multiplier: newMultiplier,
    lastMultiplierMs,
    lastMissMs,
    lastScoreDelta: scoreDelta,
    lastScoreDeltaMs: scoreDeltaMs,
    done: failed || beaten,
    failed,
  };
}

export function hitNote(state: GameState, elapsedMs: number): { state: GameState; result: HitResult } {
  let best: { idx: number; accuracy: number } | null = null;

  state.notes.forEach((note, idx) => {
    if (note.status !== "pending") return;
    const accuracy = Math.abs(elapsedMs - note.timingMs);
    if (accuracy <= GOOD_WINDOW_MS && (!best || accuracy < best.accuracy)) {
      best = { idx, accuracy };
    }
  });

  if (!best) {
    return {
      state: {
        ...state,
        health: Math.max(0, state.health - 8),
        combo: 0,
        multiplier: 1,
        lastMissMs: elapsedMs,
        lastScoreDelta: -8,
        lastScoreDeltaMs: elapsedMs,
      },
      result: null,
    };
  }

  const { idx, accuracy } = best;
  const isPerfect = accuracy <= PERFECT_WINDOW_MS;
  const result: HitResult = isPerfect ? "perfect" : "good";
  const newCombo = state.combo + 1;
  const newMultiplier = getMultiplier(newCombo);
  const points = (isPerfect ? 300 : 100) * newMultiplier;

  const notes = state.notes.map((n, i) =>
    i === idx ? { ...n, status: (isPerfect ? "hit-perfect" : "hit-good") as NoteStatus } : n
  );

  return {
    state: {
      ...state,
      notes,
      score: state.score + points,
      combo: newCombo,
      maxCombo: Math.max(state.maxCombo, newCombo),
      perfect: state.perfect + (isPerfect ? 1 : 0),
      good: state.good + (isPerfect ? 0 : 1),
      health: Math.min(MAX_HEALTH, state.health + (isPerfect ? 5 : 2)),
      multiplier: newMultiplier,
      lastMultiplierMs: newMultiplier > state.multiplier ? elapsedMs : state.lastMultiplierMs,
      lastHit: result,
      lastHitMs: elapsedMs,
      lastScoreDelta: points,
      lastScoreDeltaMs: elapsedMs,
    },
    result,
  };
}
