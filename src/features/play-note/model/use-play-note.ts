import { useEffect, useCallback, type MutableRefObject } from "react";
import { hitNote, type GameState } from "@/shared/model";
import { getAudioElapsedMs } from "@/shared/lib/audio";

export function usePlayNote(
  stateRef: MutableRefObject<GameState>,
  audioStartContextTimeRef: MutableRefObject<number>
) {
  const tap = useCallback(() => {
    const elapsed = getAudioElapsedMs(audioStartContextTimeRef.current);
    const { state } = hitNote(stateRef.current, elapsed);
    stateRef.current = state;
  }, [stateRef, audioStartContextTimeRef]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      e.preventDefault();
      tap();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tap]);

  return { tap };
}
