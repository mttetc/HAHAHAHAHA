import { useEffect, useRef, useState } from "react";
import { ReplayButton } from "@/features/replay-game";
import { createPartyClient } from "@/shared/api";
import type { LeaderboardEntry, ServerMsg } from "@/shared/model";

type Props = {
  name: string;
  roomId: string;
  score: number;
  maxCombo: number;
  perfect: number;
  good: number;
  miss: number;
  onReplay: () => void;
};

export function Results({ name, roomId, score, maxCombo, perfect, good, miss, onReplay }: Props) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const clientRef = useRef<ReturnType<typeof createPartyClient> | null>(null);

  useEffect(() => {
    const client = createPartyClient(roomId, (msg: ServerMsg) => {
      if (msg.type === "leaderboard") setLeaderboard(msg.entries);
    });
    clientRef.current = client;
    return () => client.close();
  }, [roomId]);

  const played = perfect + good + miss;
  const accuracy = played > 0 ? Math.round(((perfect + good) / played) * 100) : 0;
  const rank = leaderboard.findIndex((e) => e.name === name && e.score === score) + 1;

  return (
    <div className="screen results-screen">

      {/* ── Header ── */}
      <div className="results-header">
        <h2 className="results-title">HAHAHAHAHA!</h2>
        <div className="score-block">
          <div className="final-score">{String(score).padStart(7, "0")}</div>
          {rank > 0 && <div className="rank">#{rank} on leaderboard</div>}
        </div>
      </div>

      {/* ── 2-col body ── */}
      <div className="results-body">

        {/* Left: stats + accuracy */}
        <div className="results-col">
          <div className="stats-grid">
            <div className="stat perfect">
              <span className="stat-label">PERFECT</span>
              <span className="stat-value">{perfect}</span>
            </div>
            <div className="stat good">
              <span className="stat-label">GOOD</span>
              <span className="stat-value">{good}</span>
            </div>
            <div className="stat miss">
              <span className="stat-label">MISS</span>
              <span className="stat-value">{miss}</span>
            </div>
            <div className="stat combo">
              <span className="stat-label">MAX COMBO</span>
              <span className="stat-value">{maxCombo}</span>
            </div>
          </div>

          <div className="accuracy-bar-wrap">
            <div className="accuracy-bar">
              <div className="bar-perfect" style={{ width: `${played > 0 ? (perfect / played) * 100 : 0}%` }} />
              <div className="bar-good" style={{ width: `${played > 0 ? (good / played) * 100 : 0}%` }} />
              <div className="bar-miss" style={{ width: `${played > 0 ? (miss / played) * 100 : 0}%` }} />
            </div>
            <span className="accuracy-pct">{accuracy}% accuracy</span>
          </div>
        </div>

        {/* Right: leaderboard */}
        <div className="results-col">
          {leaderboard.length > 0 && (
            <div className="leaderboard">
              <h3>Hall of Laughs</h3>
              <ol>
                {leaderboard.map((e, i) => (
                  <li key={i} className={e.name === name && e.score === score ? "me" : ""}>
                    <span className="lb-name">{e.name}</span>
                    <span className="lb-score">{String(e.score).padStart(7, "0")}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

      </div>

      <ReplayButton onReplay={onReplay} />

    </div>
  );
}
