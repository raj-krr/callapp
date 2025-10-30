import type { Server, Socket } from "socket.io";
import { Presence } from "../services/presence.service.js";
import { logger } from "../libs/logger.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SessionUser,
} from "../types/socket.js";

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
) {
  const req = socket.request as any;
  const user: SessionUser | undefined = req.session?.user;

  // Require auth via cookie session
  if (!user) {
    socket.emit("error:message", {
      code: "UNAUTHENTICATED",
      message: "Sign in required",
    });
    socket.disconnect(true);
    return;
  }

  socket.on("room:create", async ({ roomId }, cb) => {
    const id = roomId ?? crypto.randomUUID().slice(0, 8);
    await Presence.createRoom(id);
    cb({ ok: true, roomId: id });
  });

  socket.on("room:join", async ({ roomId }, cb) => {
    await Presence.addParticipant(roomId, socket.id, user.id, user.name);
    socket.join(roomId);

    // notify others
    socket
      .to(roomId)
      .emit("participant:joined", { socketId: socket.id, name: user.name });

    const participants = await Presence.participants(roomId);
    cb({
      ok: true,
      participants: participants
        .filter((p) => p.socketId !== socket.id)
        .map((p) => ({ socketId: p.socketId, name: p.name })),
    });

    socket.emit("room:joined", {
      roomId,
      participants: participants.map((p) => ({
        socketId: p.socketId,
        name: p.name,
      })),
    });
    io.to(roomId).emit("room:updated", {
      participants: (await Presence.participants(roomId)).map((p) => ({
        socketId: p.socketId,
        name: p.name,
      })),
    });
  });

  socket.on("room:leave", async ({ roomId }, cb) => {
    await Presence.removeParticipant(socket.id);
    socket.leave(roomId);
    socket.to(roomId).emit("participant:left", { socketId: socket.id });
    cb({ ok: true });
    io.to(roomId).emit("room:updated", {
      participants: (await Presence.participants(roomId)).map((p) => ({
        socketId: p.socketId,
        name: p.name,
      })),
    });
    await Presence.cleanupRoomIfEmpty(roomId);
  });

  socket.on("chat:send", async ({ roomId, text }) => {
    const payload = { from: socket.id, name: user.name, text, at: Date.now() };
    io.to(roomId).emit("chat:message", payload);
  });

  socket.on("disconnect", async () => {
    const roomId = await Presence.removeParticipant(socket.id);
    if (roomId) {
      socket.to(roomId).emit("participant:left", { socketId: socket.id });
      io.to(roomId).emit("room:updated", {
        participants: (await Presence.participants(roomId)).map((p) => ({
          socketId: p.socketId,
          name: p.name,
        })),
      });
      await Presence.cleanupRoomIfEmpty(roomId);
      logger.info({ socketId: socket.id, roomId }, "Socket disconnected");
    }
  });
}
