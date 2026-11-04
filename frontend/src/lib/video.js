const YOUTUBE = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/;

export function videoSource(url) {
  if (!url) return null;
  const match = url.match(YOUTUBE);
  if (match) return { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${match[1]}` };
  return { kind: 'file', src: url };
}
