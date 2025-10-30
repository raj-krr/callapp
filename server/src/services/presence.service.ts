import { redis } from '../libs/redis.js';


// Keys
// room:{roomId}:participants -> SET of socketIds
// socket:{socketId}:room -> STRING roomId
// socket:{socketId}:user -> HASH { userId, name }
// room:{roomId}:meta -> HASH { createdAt }


export const Presence = {
async createRoom(roomId: string) {
const now = Date.now();
await redis.hSetNX(`room:${roomId}:meta`, 'createdAt', String(now));
},


async addParticipant(roomId: string, socketId: string, userId: string, name: string) {
await this.createRoom(roomId);
await redis.sAdd(`room:${roomId}:participants`, socketId);
await redis.set(`socket:${socketId}:room`, roomId);
await redis.hSet(`socket:${socketId}:user`, { userId, name });
},


async removeParticipant(socketId: string) {
const roomId = await redis.get(`socket:${socketId}:room`);
if (roomId) {
await redis.sRem(`room:${roomId}:participants`, socketId);
}
await redis.del(`socket:${socketId}:room`);
await redis.del(`socket:${socketId}:user`);
return roomId;
},


async participants(roomId: string) {
const sockets = await redis.sMembers(`room:${roomId}:participants`);
const list = [] as { socketId: string; name: string; userId: string }[];
for (const sid of sockets) {
const user = await redis.hGetAll(`socket:${sid}:user`);
if (user && user.userId) {
list.push({ socketId: sid, name: user.name, userId: user.userId });
}
}
return list;
},


async isRoomEmpty(roomId: string) {
return (await redis.sCard(`room:${roomId}:participants`)) === 0;
},


async cleanupRoomIfEmpty(roomId: string) {
if (await this.isRoomEmpty(roomId)) {
await redis.del(`room:${roomId}:participants`);
await redis.del(`room:${roomId}:meta`);
return true;
}
return false;
}
};