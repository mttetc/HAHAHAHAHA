import { useEffect, useRef, useCallback } from "react";
import { usePlayNote } from "@/features/play-note";
import { render, getCanvasSize } from "@/shared/lib/renderer";
import { createGameState, tickGame, type GameState, MAX_HEALTH } from "@/shared/model";
import {
  loadAudio, scheduleAudio, stopAudio, getAudioElapsedMs, setDistortion,
} from "@/shared/lib/audio";
import { createPartyClient } from "@/shared/api";
import type { PlayerState, ServerMsg } from "@/shared/model";

type Props = {
  name: string;
  roomId: string;
  startAt: number;
  onDone: (score: number, maxCombo: number, perfect: number, good: number, miss: number) => void;
};

export function Game({ name, roomId, startAt, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createGameState());
  const opponentRef = useRef<PlayerState | null>(null);
  const audioStartContextTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientRef = useRef<ReturnType<typeof createPartyClient> | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const doneRef = useRef(false);

  const { tap } = usePlayNote(stateRef, audioStartContextTimeRef);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const elapsed = getAudioElapsedMs(audioStartContextTimeRef.current);
    stateRef.current = tickGame(stateRef.current, elapsed);
    setDistortion(stateRef.current.health, MAX_HEALTH);
    render(ctx, stateRef.current, opponentRef.current, elapsed);

    const now = performance.now();
    if (now - lastUpdateRef.current > 200) {
      lastUpdateRef.current = now;
      clientRef.current?.send({ type: "update", score: stateRef.current.score, combo: stateRef.current.combo });
    }

    if (stateRef.current.done) {
      if (!doneRef.current) {
        doneRef.current = true;
        const s = stateRef.current;
        if (s.failed) stopAudio(); // stop laughing sound immediately on death
        clientRef.current?.send({ type: "done", score: s.score });
        setTimeout(() => onDone(s.score, s.maxCombo, s.perfect, s.good, s.miss), s.failed ? 1800 : 0);
      }
      // Keep rendering the GAME OVER screen during the delay
      if (stateRef.current.failed) {
        rafRef.current = requestAnimationFrame(gameLoop);
      }
      return;
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [onDone]);

  useEffect(() => {
    const client = createPartyClient(
      roomId,
      (msg: ServerMsg) => {
        if (msg.type === "room") {
          const others = Object.entries(msg.state.players).filter(([, p]) => p.name !== name);
          if (others.length > 0) opponentRef.current = others[0][1];
        }
      },
      () => client.send({ type: "join", name })
    );
    clientRef.current = client;

    async function init() {
      await loadAudio();
      const delayMs = Math.max(0, startAt - Date.now());
      timeoutRef.current = setTimeout(() => {
        audioStartContextTimeRef.current = scheduleAudio();
        rafRef.current = requestAnimationFrame(gameLoop);
      }, delayMs);
    }

    init();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      cancelAnimationFrame(rafRef.current);
      stopAudio();
      client.close();
    };
  }, [name, roomId, startAt, gameLoop]);

  const { width, height } = getCanvasSize();

  return (
    <div className="game-screen">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="game-canvas"
        onTouchStart={(e) => {
          e.preventDefault();
          tap();
        }}
      />
    </div>
  );
}
