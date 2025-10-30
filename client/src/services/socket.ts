import { io, Socket } from 'socket.io-client';


type ServerToClientEvents = {
'room:joined': (payload: { roomId: string; participants: { socketId: string; name: string }[] }) => void;
'participant:joined': (payload: { socketId: string; name: string }) => void;
'participant:left': (payload: { socketId: string }) => void;
'room:updated': (payload: { participants: { socketId: string; name: string }[] }) => void;
'chat:message': (payload: { from: string; name: string; text: string; at: number }) => void;
'webrtc:offer': (payload: { from: string; sdp: RTCSessionDescriptionInit }) => void;
'webrtc:answer': (payload: { from: string; sdp: RTCSessionDescriptionInit }) => void;
'webrtc:ice-candidate': (payload: { from: string; candidate: RTCIceCandidateInit }) => void;
'error:message': (payload: { code: string; message: string }) => void;
};


type ClientToServerEvents = {
'room:create': (payload: { roomId?: string }, cb: (resp: { ok: boolean; roomId?: string; error?: string }) => void) => void;
'room:join': (payload: { roomId: string }, cb: (resp: { ok: boolean; error?: string; participants?: { socketId: string; name: string }[] }) => void) => void;
'room:leave': (payload: { roomId: string }, cb: (resp: { ok: boolean }) => void) => void;
'chat:send': (payload: { roomId: string; text: string }) => void;
'webrtc:offer': (payload: { roomId: string; to: string; sdp: RTCSessionDescriptionInit }) => void;
'webrtc:answer': (payload: { roomId: string; to: string; sdp: RTCSessionDescriptionInit }) => void;
'webrtc:ice-candidate': (payload: { roomId: string; to: string; candidate: RTCIceCandidateInit }) => void;
};


export class SocketService {
private socket!: Socket<ServerToClientEvents, ClientToServerEvents>;


connect(serverUrl: string) {
this.socket = io(serverUrl, { transports: ['websocket'], withCredentials: true });
}


on = <K extends keyof ServerToClientEvents>(event: K, cb: ServerToClientEvents[K]) => {
this.socket.on(event, cb as any);
};


off = <K extends keyof ServerToClientEvents>(event: K, cb: ServerToClientEvents[K]) => {
this.socket.off(event, cb as any);
};


emit = <K extends keyof ClientToServerEvents>(event: K, ...args: Parameters<ClientToServerEvents[K]>) => {
(this.socket.emit as any)(event, ...args);
};


id() { return this.socket.id!; }
}


export const socketService = new SocketService();