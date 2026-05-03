/**
 * Hugging Face Inference API integration
 * Uses direct fetch with the new HF Router endpoints (Inference Providers)
 * Works around the broken @huggingface/inference SDK
 *
 * Embeddings: sentence-transformers/all-MiniLM-L6-v2 (384-dim)
 * Chat: meta-llama/Llama-3.2-3B-Instruct (free, fast, OpenAI-compatible)
 */

const HF_TOKEN = process.env.HF_TOKEN!;
const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const CHAT_MODEL = "meta-llama/Llama-3.2-3B-Instruct";

// ── EMBEDDINGS ──
export async function embedText(text: string): Promise<number[]> {
  const url = `https://router.huggingface.co/hf-inference/models/${EMBEDDING_MODEL}/pipeline/feature-extraction`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Embedding API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const result = await res.json();
  // Result is number[] (single vector) or number[][] (batched)
  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0] as number[];
  }
  return result as number[];
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  // Process sequentially to avoid rate limits on free tier
  const results: number[][] = [];
  for (const text of texts) {
    const emb = await embedText(text);
    results.push(emb);
    await new Promise((r) => setTimeout(r, 100));
  }
  return results;
}

// ── CHAT / GENERATION (OpenAI-compatible) ──
export async function generateChat(systemPrompt: string, userPrompt: string, maxTokens = 1024): Promise<string> {
  const url = `https://router.huggingface.co/v1/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.2,
      top_p: 0.95,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Chat API error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  return (data.choices?.[0]?.message?.content || "").trim();
}

// ── JSON Output Helper ──
export async function generateJSON(systemPrompt: string, userPrompt: string): Promise<any> {
  const fullSystem = `${systemPrompt}

CRITICAL: Respond with ONLY valid JSON. No markdown code fences, no explanation, no preamble. Start with { and end with }.`;

  const text = await generateChat(fullSystem, userPrompt, 1500);

  // Extract JSON robustly
  let jsonStr = text.trim();
  jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = jsonStr.indexOf("{");
  const end = jsonStr.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    jsonStr = jsonStr.slice(start, end + 1);
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("[generateJSON] Failed to parse:", jsonStr.slice(0, 500));
    throw new Error("Model returned invalid JSON. The free model can be inconsistent — try again.");
  }
}
