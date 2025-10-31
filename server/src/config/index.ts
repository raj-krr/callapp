import dotenv from 'dotenv';
dotenv.config();


export const config = {
port: Number(process.env.PORT ?? 5173),
corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5175',
logLevel: (process.env.LOG_LEVEL ?? 'info') as 'fatal'|'error'|'warn'|'info'|'debug'|'trace'|'silent',
roomEmptyTtlSeconds: Number(process.env.ROOM_EMPTY_TTL_SECONDS ?? 60),
session: {
secret: process.env.SESSION_SECRET ?? 'change_me',
cookieName: process.env.SESSION_COOKIE_NAME ?? 'sid',
secure: (process.env.SESSION_SECURE ?? 'false') === 'true',
},
redisUrl: process.env.REDIS_URL ?? 'redis://redis:6379',
};