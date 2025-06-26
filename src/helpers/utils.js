export function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64.split(',')[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function detectFPS(clip) {
  const t = clip.tracks.find((tr) => tr.times.length > 1);
  if (!t) return 30; // safe fallback
  const dt = t.times[1] - t.times[0];
  return Math.round(1 / dt); // → fps
}
