import { useEffect, useRef, useState } from "react";
import { createPartyClient } from "@/shared/api";
import { loadAudio, resumeContext } from "@/shared/lib/audio";
import { GLOBAL_ROOM } from "@/shared/config";
import type { ServerMsg } from "@/shared/model";

type Props = {
  name: string;
  onStart: (startAt: number) => void;
};

function FFCrystal() {
  return (
    <svg className="ff-crystal" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g-tl" x1="8" y1="55" x2="50" y2="5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d8f4ff" />
          <stop offset="1" stopColor="#5090ff" />
        </linearGradient>
        <linearGradient id="g-tr" x1="92" y1="55" x2="50" y2="5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#90c0ff" />
          <stop offset="1" stopColor="#1844cc" />
        </linearGradient>
        <linearGradient id="g-bl" x1="8" y1="55" x2="50" y2="125" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a3e9a" />
          <stop offset="1" stopColor="#04083a" />
        </linearGradient>
        <linearGradient id="g-br" x1="92" y1="55" x2="50" y2="125" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2a55c8" />
          <stop offset="1" stopColor="#060c4a" />
        </linearGradient>
      </defs>
      {/* Four main facets */}
      <polygon points="50,5 8,55 50,55" fill="url(#g-tl)" />
      <polygon points="50,5 92,55 50,55" fill="url(#g-tr)" />
      <polygon points="8,55 50,125 50,55" fill="url(#g-bl)" />
      <polygon points="92,55 50,125 50,55" fill="url(#g-br)" />
      {/* Highlight sparkle near the top */}
      <polygon points="50,10 36,36 50,43 64,36" fill="white" opacity="0.28" />
      {/* Outer edge for definition */}
      <polygon points="50,5 8,55 50,125 92,55" fill="none" stroke="rgba(140,210,255,0.35)" strokeWidth="0.8" />
    </svg>
  );
}

export function Loading({ name, onStart }: Props) {
  const [msLeft, setMsLeft] = useState(3500);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [assetsReady, setAssetsReady] = useState(false);
  const clientRef = useRef<ReturnType<typeof createPartyClient> | null>(null);
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;

  useEffect(() => {
    async function setup() {
      await resumeContext();
      await loadAudio();
      setAssetsReady(true);
    }
    setup();
  }, []);

  useEffect(() => {
    const client = createPartyClient(
      GLOBAL_ROOM,
      (msg: ServerMsg) => {
        if (msg.type === "start") setStartAt(msg.startAt);
      },
      () => client.send({ type: "join", name })
    );
    clientRef.current = client;
    return () => client.close();
  }, [name]);

  useEffect(() => {
    if (!startAt) return;
    const tick = setInterval(() => {
      const remaining = startAt - Date.now();
      setMsLeft(Math.max(0, remaining));
      if (remaining <= 0) clearInterval(tick);
    }, 50);
    return () => clearInterval(tick);
  }, [startAt]);

  useEffect(() => {
    if (assetsReady && startAt && msLeft === 0) {
      onStartRef.current(startAt);
    }
  }, [assetsReady, startAt, msLeft]);

  const countdownNum = Math.ceil(msLeft / 1000);

  return (
    <div className="screen loading-screen">
      <FFCrystal />
      {!startAt && <div className="loading-connecting">···</div>}
      {startAt && msLeft > 0 && (
        <div className="countdown-num" key={countdownNum}>{countdownNum}</div>
      )}
      {startAt && msLeft === 0 && (
        <div className="countdown-go">LAUGH!</div>
      )}
    </div>
  );
}
