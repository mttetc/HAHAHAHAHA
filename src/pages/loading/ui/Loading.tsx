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
        {/* Top-left face — main lit face */}
        <linearGradient id="cf-1" x1="50" y1="4" x2="14" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f0fbff" />
          <stop offset="0.5" stopColor="#88ccff" />
          <stop offset="1" stopColor="#2255cc" />
        </linearGradient>
        {/* Top-right face — partially lit */}
        <linearGradient id="cf-2" x1="50" y1="4" x2="86" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c8e8ff" />
          <stop offset="1" stopColor="#1340aa" />
        </linearGradient>
        {/* Mid-left face — shadow */}
        <linearGradient id="cf-3" x1="14" y1="70" x2="30" y2="108" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2255aa" />
          <stop offset="1" stopColor="#030d28" />
        </linearGradient>
        {/* Mid-right face — deep shadow */}
        <linearGradient id="cf-4" x1="86" y1="70" x2="70" y2="108" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0e2a7a" />
          <stop offset="1" stopColor="#010716" />
        </linearGradient>
        {/* Bottom faces */}
        <linearGradient id="cf-5" x1="50" y1="108" x2="50" y2="126" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#061438" />
          <stop offset="1" stopColor="#010310" />
        </linearGradient>
        {/* Inner core glow */}
        <radialGradient id="cf-core" cx="44%" cy="44%" r="52%">
          <stop offset="0"    stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="0.3"  stopColor="#cceeff" stopOpacity="0.65" />
          <stop offset="0.65" stopColor="#4488ff" stopOpacity="0.25" />
          <stop offset="1"    stopColor="#001166" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── 6 facets (octagonal body, two interior hubs) ── */}
      <polygon points="50,4  22,36 14,70 50,60" fill="url(#cf-1)" />
      <polygon points="50,4  78,36 86,70 50,60" fill="url(#cf-2)" />
      <polygon points="14,70 30,108 50,98 50,60" fill="url(#cf-3)" />
      <polygon points="86,70 70,108 50,98 50,60" fill="url(#cf-4)" />
      <polygon points="30,108 50,126 50,98"      fill="url(#cf-5)" />
      <polygon points="70,108 50,126 50,98"      fill="#010412" />

      {/* ── Inner glow ── */}
      <ellipse cx="46" cy="57" rx="25" ry="31" fill="url(#cf-core)" />

      {/* ── Facet edge lines ── */}
      <line x1="50" y1="4"  x2="50" y2="60"  stroke="rgba(210,240,255,0.55)" strokeWidth="0.6" />
      <line x1="50" y1="60" x2="50" y2="98"  stroke="rgba(130,180,240,0.3)"  strokeWidth="0.5" />
      <line x1="14" y1="70" x2="50" y2="60"  stroke="rgba(160,210,255,0.25)" strokeWidth="0.5" />
      <line x1="86" y1="70" x2="50" y2="60"  stroke="rgba(100,160,220,0.2)"  strokeWidth="0.5" />

      {/* ── Outer silhouette ── */}
      <polygon
        points="50,4 78,36 86,70 70,108 50,126 30,108 14,70 22,36"
        fill="none"
        stroke="rgba(180,225,255,0.5)"
        strokeWidth="0.9"
      />

      {/* ── Top highlight cap (multi-face tip) ── */}
      <polygon points="50,7  37,31 50,27 63,31" fill="white" opacity="0.42" />
      <polygon points="50,10 43,24 50,21"       fill="white" opacity="0.28" />

      {/* ── Left-face reflection streak ── */}
      <polygon points="29,23 21,46 31,41 38,21" fill="white" opacity="0.11" />
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
