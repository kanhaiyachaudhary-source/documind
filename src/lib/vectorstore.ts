/**
 * Vector store using Vercel KV (Upstash Redis under the hood)
 * Persistent across serverless function invocations.
 * Auto-expires documents after 24 hours to keep storage usage low.
 */
import { kv } from "@vercel/kv";

interface ChunkRecord {
  id: string;
  doc_id: string;
  chunk_index: number;
  text: string;
  embedding: number[];
  filename: string;
}

const TTL_SECONDS = 60 * 60 * 24; // 24 hours

export async function saveChunks(docId: string, chunks: ChunkRecord[]) {
  // Store all chunks under one key (KV supports values up to ~1MB which is plenty for ~30 chunks)
  await kv.set(`doc:${docId}`, chunks, { ex: TTL_SECONDS });
}

export async function getChunks(docId: string): Promise<ChunkRecord[]> {
  const data = await kv.get<ChunkRecord[]>(`doc:${docId}`);
  return data || [];
}

export async function deleteChunks(docId: string): Promise<boolean> {
  const result = await kv.del(`doc:${docId}`);
  return result > 0;
}

export async function getFullText(docId: string): Promise<string> {
  const chunks = await getChunks(docId);
  if (!chunks.length) return "";
  return [...chunks]
    .sort((a, b) => a.chunk_index - b.chunk_index)
    .map((c) => c.text)
    .join("\n\n");
}

// Cosine similarity for in-process retrieval
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

export async function retrieveTopK(docId: string, queryEmbedding: number[], k = 4) {
  const chunks = await getChunks(docId);
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
