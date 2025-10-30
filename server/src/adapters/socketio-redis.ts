import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { config } from '../config/index.js';


export async function buildRedisAdapter() {
const pubClient = createClient({ url: config.redisUrl });
const subClient = pubClient.duplicate();
await pubClient.connect();
await subClient.connect();
return createAdapter(pubClient, subClient);
}