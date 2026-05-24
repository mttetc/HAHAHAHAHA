export type PlayerState = {
  name: string;
  score: number;
  combo: number;
  done: boolean;
};

export type RoomStatus = "waiting" | "playing" | "done";

export type RoomState = {
  status: RoomStatus;
  players: Record<string, PlayerState>;
  startAt: number | null;
};

export type LeaderboardEntry = {
  name: string;
  score: number;
  ts: number;
};

export type ClientMsg =
  | { type: "join"; name: string }
  | { type: "start" }
  | { type: "update"; score: number; combo: number }
  | { type: "done"; score: number };

export type ServerMsg =
  | { type: "room"; state: RoomState }
  | { type: "start"; startAt: number }
  | { type: "leaderboard"; entries: LeaderboardEntry[] };
