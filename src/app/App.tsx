import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Menu } from "@/pages/menu";
import { Loading } from "@/pages/loading";
import { Game } from "@/pages/game";
import { Results } from "@/pages/results";
import { GLOBAL_ROOM } from "@/shared/config";

type Screen = "menu" | "loading" | "game" | "results";

type AppState = {
  screen: Screen;
  name: string;
  startAt: number;
  result: { score: number; maxCombo: number; perfect: number; good: number; miss: number } | null;
};

function BgVideo() {
  return createPortal(
    <video className="bg-video" autoPlay muted loop playsInline>
      <source src="/tidus-video.mp4" type="video/mp4" />
    </video>,
    document.body
  );
}

export function App() {
  const [state, setState] = useState<AppState>({
    screen: "menu",
    name: "",
    startAt: 0,
    result: null,
  });

  const goToLoading = useCallback((name: string) => {
    setState((s) => ({ ...s, screen: "loading", name }));
  }, []);

  const goToGame = useCallback((startAt: number) => {
    setState((s) => ({ ...s, screen: "game", startAt }));
  }, []);

  const goToResults = useCallback(
    (score: number, maxCombo: number, perfect: number, good: number, miss: number) => {
      setState((s) => ({ ...s, screen: "results", result: { score, maxCombo, perfect, good, miss } }));
    },
    []
  );

  const replay = useCallback(() => {
    setState((s) => ({ ...s, screen: "loading", result: null }));
  }, []);

  return (
    <>
      <BgVideo />
{state.screen === "menu" && <Menu onPlay={goToLoading} />}
      {state.screen === "loading" && <Loading name={state.name} onStart={goToGame} />}
      {state.screen === "game" && (
        <Game
          name={state.name}
          roomId={GLOBAL_ROOM}
          startAt={state.startAt}
          onDone={goToResults}
        />
      )}
      {state.screen === "results" && (
        <Results
          name={state.name}
          roomId={GLOBAL_ROOM}
          score={state.result?.score ?? 0}
          maxCombo={state.result?.maxCombo ?? 0}
          perfect={state.result?.perfect ?? 0}
          good={state.result?.good ?? 0}
          miss={state.result?.miss ?? 0}
          onReplay={replay}
        />
      )}
      <footer className="disclaimer">
        Assets © Square Enix · Non-commercial fan project · Not affiliated with Square Enix
      </footer>
    </>
  );
}
