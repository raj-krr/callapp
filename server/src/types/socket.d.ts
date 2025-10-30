export type ServerToClientEvents = {
  "room:joined": (payload: {
    roomId: string;
    participants: { socketId: string; name: string }[];
  }) => void;
  "participant:joined": (payload: { socketId: string; name: string }) => void;
  "participant:left": (payload: { socketId: string }) => void;
  "room:updated": (payload: {
    participants: { socketId: string; name: string }[];
  }) => void;
  "chat:message": (payload: {
    from: string;
    name: string;
    text: string;
    at: number;
  }) => void;
  "webrtc:offer": (payload: {
    from: string;
    sdp: RTCSessionDescriptionInit;
  }) => void;
  "webrtc:answer": (payload: {
    from: string;
    sdp: RTCSessionDescriptionInit;
  }) => void;
  "webrtc:ice-candidate": (payload: {
    from: string;
    candidate: RTCIceCandidateInit;
  }) => void;
  "error:message": (payload: { code: string; message: string }) => void;
};

export type ClientToServerEvents = {
  "room:create": (
    payload: { roomId?: string },
    cb: (resp: { ok: boolean; roomId?: string; error?: string }) => void
  ) => void;
  "room:join": (
    payload: { roomId: string },
    cb: (resp: {
      ok: boolean;
      error?: string;
      participants?: { socketId: string; name: string }[];
    }) => void
  ) => void;
  "room:leave": (
    payload: { roomId: string },
    cb: (resp: { ok: boolean }) => void
  ) => void;
  "chat:send": (payload: { roomId: string; text: string }) => void;
  "webrtc:offer": (payload: {
    roomId: string;
    to: string;
    sdp: RTCSessionDescriptionInit;
  }) => void;
  "webrtc:answer": (payload: {
    roomId: string;
    to: string;
    sdp: RTCSessionDescriptionInit;
  }) => void;
  "webrtc:ice-candidate": (payload: {
    roomId: string;
    to: string;
    candidate: RTCIceCandidateInit;
  }) => void;
};

export type SessionUser = { id: string; name: string };
