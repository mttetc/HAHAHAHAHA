export {
  HA_TIMINGS_MS,
  AUDIO_DURATION_MS,
  DROP_DURATION_MS,
  HIT_ZONE_RATIO,
  PERFECT_WINDOW_MS,
  GOOD_WINDOW_MS,
  MAX_LOOPS,
  MAX_HEALTH,
  MULTIPLIER_THRESHOLDS,
  getMultiplier,
  createGameState,
  tickGame,
  hitNote,
} from "./notes";
export type { NoteStatus, Note, HitResult, GameState } from "./notes";

export type {
  PlayerState,
  RoomStatus,
  RoomState,
  LeaderboardEntry,
  ClientMsg,
  ServerMsg,
} from "./protocol";
