import { useEffect, useRef, useState } from "react";
import { createPartyClient } from "@/shared/api";
import type { RoomState, ServerMsg } from "@/shared/model";

type Props = {
  name: string;
  roomId: string;
  onStart: (startAt: number) => void;
};

export function Lobby({ name, roomId, onStart }: Props) {
  const [room, setRoom] = useState<RoomState>({ status: "waiting", players: {}, startAt: null });
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<ReturnType<typeof createPartyClient> | null>(null);

  useEffect(() => {
    const client = createPartyClient(
      roomId,
      (msg: ServerMsg) => {
        if (msg.type === "room") setRoom(msg.state);
        if (msg.type === "start") onStart(msg.startAt);
      },
      () => {
        setConnected(true);
        client.send({ type: "join", name });
      },
      () => setConnected(false)
    );
    clientRef.current = client;
    return () => client.close();
  }, [name, roomId, onStart]);

  const players = Object.values(room.players);

  function handleStart() {
    clientRef.current?.send({ type: "start" });
  }

  return (
    <div className="screen lobby-screen">
      <h2 className="lobby-title">Room: <span className="room-code">{roomId}</span></h2>
      <p className="lobby-hint">Share this code with a friend to battle</p>

      <div className="players-list">
        {players.length === 0 && (
          <p className="waiting-text">{connected ? "Waiting for players…" : "Connecting…"}</p>
        )}
        {players.map((p) => (
          <div key={p.name} className="player-row">
            <span className="player-dot">●</span>
            <span>{p.name}</span>
          </div>
        ))}
      </div>

      {connected && players.length > 0 && (
        <button className="btn-play" onClick={handleStart}>
          START LAUGHING
        </button>
      )}

      <p className="solo-hint">
        {players.length < 2 ? "You can start solo or wait for a friend" : `${players.length} players ready`}
      </p>
    </div>
  );
}
