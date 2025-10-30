export class MediaService {
localStream?: MediaStream;
screenStream?: MediaStream;


async init(constraints: MediaStreamConstraints = { audio: true, video: { width: { ideal: 1280 }, height: { ideal: 720 } } }) {
this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
return this.localStream;
}


getLocalTracks() {
return this.localStream?.getTracks() ?? [];
}


toggleAudio() {
const track = this.localStream?.getAudioTracks()[0];
if (track) track.enabled = !track.enabled;
return track?.enabled ?? false;
}


toggleVideo() {
const track = this.localStream?.getVideoTracks()[0];
if (track) track.enabled = !track.enabled;
return track?.enabled ?? false;
}


async startScreenShare() {
this.screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
return this.screenStream;
}


stopScreenShare() {
this.screenStream?.getTracks().forEach(t => t.stop());
this.screenStream = undefined;
}
}


export const mediaService = new MediaService();