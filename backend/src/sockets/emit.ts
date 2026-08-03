import type { Server } from "socket.io";

let ioInstance: Server | null = null;

export function setIO(io: Server) {
  ioInstance = io;
}

// originClientId lets the frontend recognize and ignore the echo of its own
// change coming back over the socket (it already applied it optimistically).
export function emitToBoard(
  boardId: string,
  event: string,
  payload: unknown,
  originClientId?: string,
) {
  if (!ioInstance) return;
  ioInstance.to(`board:${boardId}`).emit(event, { payload, originClientId });
}