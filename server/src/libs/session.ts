import session from 'express-session';
import RedisStore from 'connect-redis';
import { redis } from './redis.js';
import { config } from '../config/index.js';

// Create Redis store instance (v7+ syntax)
const store = new RedisStore({
  client: redis as any,
  prefix: 'sess:',
});

export const sessionMiddleware = session({
  name: config.session.cookieName,
  store,
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.session.secure,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
});

// Helper to share Express sessions with Socket.IO
export function wrapSessionForSocketIO(io: import('socket.io').Server) {
  io.use((socket, next) => {
    // @ts-ignore
    sessionMiddleware(socket.request as any, {} as any, next);
  });
}
