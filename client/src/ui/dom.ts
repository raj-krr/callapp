export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  children: (Node | string)[] = []
) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const child of children) node.append(child);
  return node;
}

export function videoTile(id: string, label: string, stream: MediaStream) {
  const container = el("div", { className: "video-tile", id: `tile-${id}` });
  const video = el("video", {
    autoplay: true,
    playsInline: true,
  }) as HTMLVideoElement;
  video.srcObject = stream;
  const name = el("div", { className: "label" }, [label]);
  container.append(video, name);
  return container;
}
