import type * as Party from "partykit/server";
import type { ClientMsg, ServerMsg, RoomState, LeaderboardEntry, PlayerState } from "../src/shared/model";

const LEADERBOARD_KEY = "leaderboard";
const MAX_LEADERBOARD = 10;
const COUNTDOWN_MS = 3500;

export default class GameServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async getState(): Promise<RoomState> {
    return (
      (await this.room.storage.get<RoomState>("state")) ?? {
        status: "waiting",
        players: {},
        startAt: null,
      }
    );
  }

  async saveState(state: RoomState): Promise<void> {
    await this.room.storage.put("state", state);
  }

  broadcast(msg: ServerMsg, exclude?: string[]) {
    this.room.broadcast(JSON.stringify(msg), exclude);
  }

  sendTo(conn: Party.Connection, msg: ServerMsg) {
    conn.send(JSON.stringify(msg));
  }

  async onConnect(conn: Party.Connection) {
    const state = await this.getState();
    this.sendTo(conn, { type: "room", state });
    const lb = (await this.room.storage.get<LeaderboardEntry[]>(LEADERBOARD_KEY)) ?? [];
    this.sendTo(conn, { type: "leaderboard", entries: lb });
  }

  async onMessage(raw: string, sender: Party.Connection) {
    const msg = JSON.parse(raw) as ClientMsg;
    const state = await this.getState();

    switch (msg.type) {
      case "join": {
        const player: PlayerState = { name: msg.name, score: 0, combo: 0, done: false };
        state.players[sender.id] = player;

        if (state.status === "waiting") {
          // Auto-start: give everyone COUNTDOWN_MS to connect
          state.startAt = Date.now() + COUNTDOWN_MS;
          state.status = "playing";
          await this.saveState(state);
          this.broadcast({ type: "room", state });
          this.broadcast({ type: "start", startAt: state.startAt });
        } else if (state.status === "playing" && state.startAt) {
          // Late joiner — sync to existing startAt
          await this.saveState(state);
          this.broadcast({ type: "room", state });
          this.sendTo(sender, { type: "start", startAt: state.startAt });
        } else {
          await this.saveState(state);
          this.broadcast({ type: "room", state });
        }
        break;
      }

      case "update": {
        if (!state.players[sender.id]) break;
        state.players[sender.id].score = msg.score;
        state.players[sender.id].combo = msg.combo;
        await this.saveState(state);
        this.broadcast({ type: "room", state }, [sender.id]);
        break;
      }

      case "done": {
        if (!state.players[sender.id]) break;
        state.players[sender.id].score = msg.score;
        state.players[sender.id].done = true;

        const lb = (await this.room.storage.get<LeaderboardEntry[]>(LEADERBOARD_KEY)) ?? [];
        lb.push({ name: state.players[sender.id].name, score: msg.score, ts: Date.now() });
        lb.sort((a, b) => b.score - a.score);
        const trimmed = lb.slice(0, MAX_LEADERBOARD);
        await this.room.storage.put(LEADERBOARD_KEY, trimmed);
        this.broadcast({ type: "leaderboard", entries: trimmed });

        const allDone = Object.values(state.players).every((p) => p.done);
        if (allDone) {
          // Reset room for the next game so new players auto-start fresh
          state.status = "waiting";
          state.startAt = null;
          state.players = {};
        }
        await this.saveState(state);
        this.broadcast({ type: "room", state });
        break;
      }
    }
  }

  async onClose(conn: Party.Connection) {
    const state = await this.getState();
    delete state.players[conn.id];
    if (Object.keys(state.players).length === 0) {
      state.status = "waiting";
      state.startAt = null;
    }
    await this.saveState(state);
    this.broadcast({ type: "room", state });
  }
}
