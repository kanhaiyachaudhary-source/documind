// In-memory vector store
// Uses globalThis to persist across hot reloads in dev
// In production on Vercel, this resets when the serverless function goes cold

interface ChunkRecord {
  id: string;
  doc_id: string;
  chunk_index: number;
  text: string;
  embedding: number[];
  filename: string;
}

const globalStore = globalThis as any;
if (!globalStore.__documindStore) {
  globalStore.__documindStore = new Map<string, ChunkRecord[]>(); // doc_id -> chunks
}

const store: Map<string, ChunkRecord[]> = globalStore.__documindStore;

export function saveChunks(docId: string, chunks: ChunkRecord[]) {
  store.set(docId, chunks);
}

export function getChunks(docId: string): ChunkRecord[] {
  return store.get(docId) || [];
}

export function deleteChunks(docId: string): boolean {
  return store.delete(docId);
}

export function getFullText(docId: string): string {
  const chunks = getChunks(docId);
  if (!chunks.length) return "";
  // Sort by chunk_index and concatenate
  return [...chunks]
    .sort((a, b) => a.chunk_index - b.chunk_index)
    .map((c) => c.text)
    .join("\n\n");
}

// Cosine similarity
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function retrieveTopK(docId: string, queryEmbedding: number[], k = 4) {
  const chunks = getChunks(docId);
  if (!chunks.length) return [];

  const scored = chunks.map((c) => ({
    chunk: c,
    score: cosineSimilarity(queryEmbedding, c.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, k).map((s) => ({
    text: s.chunk.text,
    chunkIndex: s.chunk.chunk_index,
    score: s.score,
  }));
}
