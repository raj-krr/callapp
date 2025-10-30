import { Presence } from './presence.service.js';


class RoomService {
async createRoom(roomId: string) {
await Presence.createRoom(roomId);
return { id: roomId, createdAt: Date.now() };
}
}


export const roomService = new RoomService();