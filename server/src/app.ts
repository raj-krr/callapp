import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config/index.js';
import { logger } from './libs/logger.js';
import { healthRouter } from './routes/health.js';
import { authDevRouter } from './routes/auth.dev.js';
import { sessionMiddleware, wrapSessionForSocketIO } from './libs/session.js';
import { initRedis } from './libs/redis.js';
import type { ClientToServerEvents, ServerToClientEvents } from './types/socket.js';
import { registerSocketHandlers } from './handlers/socket.handler.js';
import { registerWebRTCHandlers } from './handlers/webrtc.handler.js';
import { buildRedisAdapter } from './adapters/socketio-redis.js';


export async function buildApp() {
await initRedis();


const app = express();
app.set('trust proxy', 1);


app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);


app.use('/api', healthRouter);
// Remove this in prod; use your real auth that sets req.session.user
app.use('/api', authDevRouter);


const httpServer = createServer(app);


const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
cors: { origin: config.corsOrigin, credentials: true },
});


// Share Express session with Socket.IO so cookies → session → user
wrapSessionForSocketIO(io);


// Scale Socket.IO across instances
io.adapter(await buildRedisAdapter());


io.on('connection', (socket) => {
registerSocketHandlers(io, socket);
registerWebRTCHandlers(io, socket);
console.log('New client connected:', socket.id);

// socket.on('disconnect', () => {
// logger.info('Client disconnected:', socket.id);
// });
});

return { app, httpServer };
}