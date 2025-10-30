import { socketService } from './socket.js';
import { mediaService } from './media.js';

export class WebRTCService {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private iceServers: RTCIceServer[] = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'] }
  ];

  constructor(private onRemoteTrack: (peerId: string, stream: MediaStream) => void) {}

  async addPeer(peerId: string) {
    if (this.peers.has(peerId)) return this.peers.get(peerId)!;

    const pc = new RTCPeerConnection({ iceServers: this.iceServers });

    // Forward ICE candidates to the signaling server
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketService.emit('webrtc:ice-candidate', {
          roomId: this.roomId!,
          to: peerId,
          candidate: e.candidate.toJSON(),
        });
      }
    };

    // Handle remote track events
    pc.ontrack = (e) => {
      this.remoteStreams.set(peerId, e.streams[0]);
      this.onRemoteTrack(peerId, e.streams[0]);
    };

    // Add local tracks
    mediaService.getLocalTracks().forEach((track) => {
      pc.addTrack(track, mediaService.localStream!);
    });

    this.peers.set(peerId, pc);
    return pc;
  }

  private roomId?: string;
  setRoom(roomId: string) {
    this.roomId = roomId;
  }

  async callPeer(peerId: string) {
    const pc = await this.addPeer(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketService.emit('webrtc:offer', {
      roomId: this.roomId!,
      to: peerId,
      sdp: offer,
    });
  }

  async handleOffer(from: string, sdp: RTCSessionDescriptionInit) {
    const pc = await this.addPeer(from);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketService.emit('webrtc:answer', {
      roomId: this.roomId!,
      to: from,
      sdp: answer,
    });
  }

  async handleAnswer(from: string, sdp: RTCSessionDescriptionInit) {
    const pc = this.peers.get(from);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  async handleIceCandidate(from: string, candidate: RTCIceCandidateInit) {
    const pc = this.peers.get(from);
    if (!pc) return;
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  async replaceVideoTrack(stream: MediaStream) {
    for (const pc of this.peers.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(stream.getVideoTracks()[0]);
    }
  }

  async closePeer(peerId: string) {
    const pc = this.peers.get(peerId);
    if (!pc) return;
    pc.getSenders().forEach((s) => s.track?.stop());
    pc.close();
    this.peers.delete(peerId);
    this.remoteStreams.delete(peerId);
  }

  async closeAll() {
    for (const id of Array.from(this.peers.keys())) await this.closePeer(id);
  }
}

export const webrtcService = new WebRTCService((_peerId, _stream) => {});
