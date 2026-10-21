import { apiRequest } from './teacherApi';

const CHUNK_CHARS = 2500; // the server accepts up to 3,000 characters per request

// Splits text into pieces below CHUNK_CHARS, keeping paragraph and sentence boundaries.
export function splitForTranslation(text, limit = CHUNK_CHARS) {
  const chunks = [];
  let current = '';

  const push = (piece) => {
    if (current && current.length + piece.length + 1 > limit) {
      chunks.push(current);
      current = piece;
    } else {
      current = current ? `${current}\n${piece}` : piece;
    }
  };

  for (const line of text.split('\n')) {
    if (line.length <= limit) {
      push(line);
      continue;
    }

    // A very long line: cut at sentence ends, then at spaces.
    let buffer = '';
    for (const part of line.split(/(?<=[.!?])\s+/)) {
      for (let rest = part; rest.length; ) {
        const room = limit - buffer.length - 1;
        if (rest.length <= room || (!buffer && rest.length <= limit)) {
          buffer = buffer ? `${buffer} ${rest}` : rest;
          rest = '';
        } else if (buffer) {
          push(buffer);
          buffer = '';
        } else {
          const cut = rest.lastIndexOf(' ', limit);
          const at = cut > 0 ? cut : limit;
          push(rest.slice(0, at));
          rest = rest.slice(at).trimStart();
        }
      }
    }
    if (buffer) push(buffer);
  }

  if (current) chunks.push(current);
  return chunks;
}

// Translates piece by piece so long documents show progress and one failure is easy to report.
export async function translateText(text, { source, target, token, onProgress, signal }) {
  const chunks = splitForTranslation(text);
  const out = [];

  for (let i = 0; i < chunks.length; i++) {
    onProgress?.({ done: i, total: chunks.length });

    const data = await apiRequest('/translate', token, {
      method: 'POST',
      body: { text: chunks[i], source, target },
      signal,
    });
    out.push(data.translation);
  }

  onProgress?.({ done: chunks.length, total: chunks.length });
  return out.join('\n');
}