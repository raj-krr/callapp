import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket.js';


export function registerWebRTCHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>, socket: Socket<ClientToServerEvents, ServerToClientEvents>) {
socket.on('webrtc:offer', ({ to, sdp }) => {
io.to(to).emit('webrtc:offer', { from: socket.id, sdp });
});


socket.on('webrtc:answer', ({ to, sdp }) => {
io.to(to).emit('webrtc:answer', { from: socket.id, sdp });
});


socket.on('webrtc:ice-candidate', ({ to, candidate }) => {
io.to(to).emit('webrtc:ice-candidate', { from: socket.id, candidate });
});
}