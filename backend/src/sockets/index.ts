import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyToken } from "../utils/jwt";
import { setIO } from "./emit";

function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  header.split(";").forEach((pair) => {
    const [key, ...rest] = pair.trim().split("=");
    if (!key) return;
    cookies[key] = decodeURIComponent(rest.join("="));
  });
  return cookies;
}

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  // Auth: read the same httpOnly cookie the REST API uses, verify the JWT.
  io.use((socket, next) => {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const token = cookies.token;

    if (!token) return next(new Error("Not authenticated"));

    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid or expired session"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("board:join", (boardId: string) => {
      socket.join(`board:${boardId}`);
    });

    socket.on("board:leave", (boardId: string) => {
      socket.leave(`board:${boardId}`);
    });
  });

  setIO(io);
  return io;
}