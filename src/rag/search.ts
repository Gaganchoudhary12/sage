export interface EmbeddedChunk {
  text: string;
  embedding: number[];
}

export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

export function findBestMatch(
  queryEmbedding: number[],
  chunks: EmbeddedChunk[],
): EmbeddedChunk | null {
  let best: EmbeddedChunk | null = null;
  let bestScore = -1;
  for (const c of chunks) {
    const score = cosineSimilarity(queryEmbedding, c.embedding);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}
