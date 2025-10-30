/// <reference types="vite/client" />

import { socketService } from "./services/socket.js";
import { mediaService } from "./services/media.js";
import { webrtcService } from "./services/webrtc.js";
import { el, videoTile } from "./ui/dom.js";

const serverUrl =
  (import.meta.env.VITE_SERVER_URL as string) || "http://localhost:5173";

const roomInput = document.getElementById("room-input") as HTMLInputElement;
const nameInput = document.getElementById("name-input") as HTMLInputElement;
const btnJoin = document.getElementById("btn-join") as HTMLButtonElement;
const btnCreate = document.getElementById("btn-create") as HTMLButtonElement;
const btnLogin = document.getElementById("btn-login") as HTMLButtonElement;
const grid = document.getElementById("video-grid")!;
const participantsList = document.getElementById("participants")!;
const chatLog = document.getElementById("chat-log")!;
const chatText = document.getElementById("chat-text") as HTMLInputElement;
const chatSend = document.getElementById("chat-send") as HTMLButtonElement;
const btnToggleAudio = document.getElementById(
  "toggle-audio"
) as HTMLButtonElement;
const btnToggleVideo = document.getElementById(
  "toggle-video"
) as HTMLButtonElement;
const btnShareScreen = document.getElementById(
  "share-screen"
) as HTMLButtonElement;
const btnLeave = document.getElementById("leave") as HTMLButtonElement;
const meDiv = document.getElementById("me")!;

let currentRoomId: string | null = null;

async function fetchMe() {
  const res = await fetch(serverUrl + "/api/me", { credentials: "include" });
  const data = await res.json();
  return data.user as { id: string; name: string } | null;
}

function setMe(user: { id: string; name: string } | null) {
  meDiv.textContent = user ? `${user.name}` : "Not signed in";
}

function addParticipant(id: string, name: string) {
  const item = el("li", {
    id: `p-${id}`,
    textContent: id === socketService.id() ? `${name} (You)` : name,
  });
  participantsList.append(item);
}

function removeParticipant(id: string) {
  document.getElementById(`p-${id}`)?.remove();
  document.getElementById(`tile-${id}`)?.remove();
}

function renderParticipants(list: { socketId: string; name: string }[]) {
  participantsList.innerHTML = "";
  list.forEach((p) => addParticipant(p.socketId, p.name));
}

function appendChat({
  name,
  text,
  at,
}: {
  name: string;
  text: string;
  at: number;
}) {
  const msg = el("div", { className: "chat-msg" });
  const meta = el("div", {
    className: "meta",
    textContent: `${name} • ${new Date(at).toLocaleTimeString()}`,
  });
  const body = el("div", { textContent: text });
  msg.append(meta, body);
  chatLog.append(msg);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function addVideo(id: string, label: string, stream: MediaStream) {
  const tile = videoTile(id, label, stream);
  grid.append(tile);
}

async function mountLocal(name: string) {
  const stream = await mediaService.init();
  addVideo(socketService.id(), name, stream);
}

async function joinRoom(roomId: string) {
  currentRoomId = roomId;
  webrtcService.setRoom(roomId);
  socketService.emit("room:join", { roomId }, async (resp) => {
    if (!resp.ok) return alert(resp.error);
    resp.participants?.forEach((p) => addParticipant(p.socketId, p.name));
    for (const p of resp.participants ?? []) {
      await webrtcService.callPeer(p.socketId);
    }
  });
}

function wireSocketEvents() {
  socketService.on("room:joined", async ({ participants }) =>
    renderParticipants(participants)
  );
  socketService.on("participant:joined", async ({ socketId, name }) => {
    addParticipant(socketId, name);
    await webrtcService.callPeer(socketId);
  });
  socketService.on("participant:left", ({ socketId }) =>
    removeParticipant(socketId)
  );
  socketService.on("room:updated", ({ participants }) =>
    renderParticipants(participants)
  );
  socketService.on("chat:message", ({ name, text, at }) =>
    appendChat({ name, text, at })
  );
  socketService.on(
    "webrtc:offer",
    async ({ from, sdp }) => await webrtcService.handleOffer(from, sdp)
  );
  socketService.on(
    "webrtc:answer",
    async ({ from, sdp }) => await webrtcService.handleAnswer(from, sdp)
  );
  socketService.on(
    "webrtc:ice-candidate",
    async ({ from, candidate }) =>
      await webrtcService.handleIceCandidate(from, candidate)
  );
}

function wireUI() {
  btnCreate.onclick = () => {
    socketService.emit("room:create", {}, (resp) => {
      if (resp.ok && resp.roomId) {
        roomInput.value = resp.roomId;
        window.location.hash = resp.roomId;
      }
    });
  };

  btnJoin.onclick = async () => {
    const rid = roomInput.value.trim();
    if (!rid) return alert("Enter Room ID");
    const me = await fetchMe();
    if (!me) return alert("Please sign in first");
    await mountLocal(me.name);
    await joinRoom(rid);
  };

  btnLogin.onclick = async () => {
    const name = nameInput.value.trim() || "Guest";
    const res = await fetch(serverUrl + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!data.ok) return alert("Login failed");
    setMe(data.user);
  };

  chatSend.onclick = () => {
    if (!currentRoomId) return;
    const text = chatText.value.trim();
    if (!text) return;
    socketService.emit("chat:send", { roomId: currentRoomId, text });
    chatText.value = "";
  };

  btnToggleAudio.onclick = () => {
    const enabled = mediaService.toggleAudio();
    btnToggleAudio.textContent = enabled ? "Mute" : "Unmute";
  };

  btnToggleVideo.onclick = () => {
    const enabled = mediaService.toggleVideo();
    btnToggleVideo.textContent = enabled ? "Video Off" : "Video On";
  };

  btnShareScreen.onclick = async () => {
    if (!mediaService.screenStream) {
      const stream = await mediaService.startScreenShare();
      if (!stream) return;
      await webrtcService.replaceVideoTrack(stream);
      const myTile = document.getElementById(`tile-${socketService.id()}`);
      (myTile?.querySelector("video") as HTMLVideoElement).srcObject =
        stream ?? null;
      btnShareScreen.textContent = "Stop Share";
      stream.getVideoTracks()[0].addEventListener("ended", async () => {
        mediaService.stopScreenShare();
        await webrtcService.replaceVideoTrack(mediaService.localStream!);
        (myTile?.querySelector("video") as HTMLVideoElement).srcObject =
          mediaService.localStream!;
        btnShareScreen.textContent = "Share Screen";
      });
    } else {
      mediaService.stopScreenShare();
      await webrtcService.replaceVideoTrack(mediaService.localStream!);
      const myTile = document.getElementById(`tile-${socketService.id()}`);
      (myTile?.querySelector("video") as HTMLVideoElement).srcObject =
        mediaService.localStream!;
      btnShareScreen.textContent = "Share Screen";
    }
  };

  btnLeave.onclick = async () => {
    if (!currentRoomId) return;
    await webrtcService.closeAll();
    socketService.emit("room:leave", { roomId: currentRoomId }, () => {});
    window.location.reload();
  };
}

async function boot() {
  socketService.connect(serverUrl);

  const rid = window.location.hash.replace("#", "");
  if (rid) roomInput.value = rid;

  setMe(await fetchMe());

  webrtcService["onRemoteTrack"] = (peerId: string, stream: MediaStream) => {
    const tile = videoTile(peerId, `Peer ${peerId.slice(0, 4)}`, stream);
    grid.append(tile);
  };

  wireSocketEvents();
  wireUI();
}

boot();
