/** True on touch-first devices (phones, tablets) where there is no spacebar to press. */
export function isTouchDevice(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}
