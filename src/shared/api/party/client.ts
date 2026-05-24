import PartySocket from "partysocket";
import type { ClientMsg, ServerMsg } from "@/shared/model";

const HOST = import.meta.env.VITE_PARTYKIT_HOST ?? "localhost:1999";

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
