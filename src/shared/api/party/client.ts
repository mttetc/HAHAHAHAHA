import PartySocket from "partysocket";
import type { ClientMsg, ServerMsg } from "@/shared/model";

// In dev, PartyKit runs at localhost:1999 (separate from Vite's port).
// In production (served from PartyKit), the WS host is the same as the page host.
// VITE_PARTYKIT_HOST overrides both when deploying to a non-PartyKit host.
const HOST =
  import.meta.env.VITE_PARTYKIT_HOST ??
  (window.location.hostname === "localhost" ? "localhost:1999" : window.location.host);

export function createPartyClient(
  roomId: string,
  onMessage: (msg: ServerMsg) => void,
  onOpen?: () => void,
  onClose?: () => void
): { send: (msg: ClientMsg) => void; close: () => void } {
  const ws = new PartySocket({ host: HOST, room: roomId });

  ws.addEventListener("open", () => onOpen?.());
  ws.addEventListener("close", () => onClose?.());
  ws.addEventListener("message", (e) => {
    try {
      const msg = JSON.parse(e.data as string) as ServerMsg;
      onMessage(msg);
    } catch {
      // ignore malformed messages
    }
  });

  return {
    send: (msg: ClientMsg) => ws.send(JSON.stringify(msg)),
    close: () => ws.close(),
  };
}

export function generateRoomId(): string {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}
