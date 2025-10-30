import { createClient } from 'redis';
import { config } from '../config/index.js';
import { logger } from './logger.js';


export const redis = createClient({ url: config.redisUrl });


redis.on('error', (err) => logger.error({ err }, 'Redis error'));


export async function initRedis() {
if (!redis.isOpen) await redis.connect();
return redis;
}