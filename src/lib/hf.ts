/**
 * Hugging Face Inference API integration
 * - Embeddings: sentence-transformers/all-MiniLM-L6-v2 (384-dim, fast, free)
 * - LLM: mistralai/Mistral-7B-Instruct-v0.3 (good free chat model)
 */
import { HfInference } from "@huggingface/inference";

const HF_TOKEN = process.env.HF_TOKEN!;
const hf = new HfInference(HF_TOKEN);

const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const CHAT_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";

// ── EMBEDDINGS ──
export async function embedText(text: string): Promise<number[]> {
  const result = await hf.featureExtraction({
    model: EMBEDDING_MODEL,
    inputs: text,
  });
  // Result can be number[] or number[][] depending on model
  return Array.isArray(result[0]) ? (result[0] as number[]) : (result as number[]);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  // HF doesn't always support batch — call one at a time but in parallel
  const results = await Promise.all(texts.map((t) => embedText(t)));
  return results;
}

// ── CHAT / GENERATION ──
export async function generateChat(systemPrompt: string, userPrompt: string, maxTokens = 1024): Promise<string> {
  // Mistral instruction format: [INST] ... [/INST]
  const fullPrompt = `<s>[INST] ${systemPrompt}\n\n${userPrompt} [/INST]`;

  const result = await hf.textGeneration({
    model: CHAT_MODEL,
    inputs: fullPrompt,
    parameters: {
      max_new_tokens: maxTokens,
      temperature: 0.2,
      return_full_text: false,
      top_p: 0.95,
    },
  });

  return (result.generated_text || "").trim();
}

// ── JSON Output Helper ──
export async function generateJSON(systemPrompt: string, userPrompt: string): Promise<any> {
  const fullSystem = `${systemPrompt}

CRITICAL: Respond with ONLY valid JSON. No markdown, no code fences, no explanation. Just the JSON object starting with { and ending with }.`;

  const text = await generateChat(fullSystem, userPrompt, 1500);

  // Extract JSON from response (handles cases where model still adds extra text)
  let jsonStr = text.trim();
  // Remove markdown code fences if present
  jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  // Find first { and last }
  const start = jsonStr.indexOf("{");
  const end = jsonStr.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    jsonStr = jsonStr.slice(start, end + 1);
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("[generateJSON] Failed to parse:", jsonStr.slice(0, 500));
    throw new Error("Model returned invalid JSON. Try again.");
  }
}
