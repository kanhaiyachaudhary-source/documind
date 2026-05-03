import { generateChat, generateJSON, embedText } from "./hf";
import { getFullText, retrieveTopK } from "./vectorstore";

// Helper: retry JSON generation with simpler prompt on failure
async function generateJSONWithRetry(systemPrompt: string, userPrompt: string, maxAttempts = 2): Promise<any> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await generateJSON(systemPrompt, userPrompt);
    } catch (e: any) {
      lastError = e;
      console.log(`[generateJSONWithRetry] Attempt ${attempt} failed:`, e.message);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
  }
  throw lastError;
}

// EXTRACT - more lenient prompting, returns minimal valid JSON shape if model struggles
export async function extractFields(docId: string) {
  const fullText = await getFullText(docId);
  const text = fullText.slice(0, 4000);
  if (!text) throw new Error("Document not found - it may have expired (24h TTL). Please re-upload.");

  try {
    const result = await generateJSONWithRetry(
      `You are a document data extractor. Extract key information.`,
      `Read this document and return a JSON object with exactly two keys: "document_type" (string describing the doc) and "fields" (an object of key-value pairs of facts found in the document, like names, dates, amounts, emails, phone, addresses, IDs).

Example format:
{"document_type": "Resume", "fields": {"name": "John Doe", "email": "john@example.com", "experience_years": "5"}}

Document:
${text}`
    );

    return {
      document_type: result.document_type || "Document",
      fields: Object.entries(result.fields || result).map(([k, v]) => ({
        field: k,
        value: typeof v === "object" ? JSON.stringify(v) : String(v ?? ""),
        confidence: 0.85,
      })).filter(f => f.field !== "document_type"),
      raw: result,
    };
  } catch (e: any) {
    // Fallback: do a simpler text-based extraction without JSON requirement
    console.log("[extractFields] JSON extraction failed, using fallback");
    const fallback = await generateChat(
      "You extract facts from documents. List 8-12 key facts as 'Field Name: Value' lines, one per line. No introduction, no markdown.",
      `Extract key facts from this document:\n\n${text.slice(0, 3000)}`,
      800
    );

    const fields = fallback
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.includes(":"))
      .map((line) => {
        const idx = line.indexOf(":");
        return {
          field: line.slice(0, idx).replace(/^[-*•\d.\s]+/, "").trim(),
          value: line.slice(idx + 1).trim(),
          confidence: 0.75,
        };
      })
      .filter((f) => f.field && f.value && f.field.length < 60);

    if (!fields.length) throw new Error("Could not extract structured fields. Try Summarize or Ask AI instead.");

    return {
      document_type: "Document",
      fields,
      raw: { fallback: true, fields },
    };
  }
}

// CLASSIFY
export async function classifyDocument(docId: string) {
  const fullText = await getFullText(docId);
  const text = fullText.slice(0, 3000);
  if (!text) throw new Error("Document not found - it may have expired (24h TTL). Please re-upload.");

  return generateJSONWithRetry(
    `You are a document classification expert.`,
    `Classify this document. Return JSON:
{
  "document_type": "specific type like Resume, Invoice, Legal Contract, Research Paper",
  "category": "broad category like Business, Legal, Personal, Academic",
  "subcategory": "more specific subcategory",
  "confidence": 0.92,
  "language": "English",
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "one-line summary"
}

Document:
${text}`
  );
}

// SUMMARIZE
export async function summarizeDocument(docId: string) {
  const fullText = await getFullText(docId);
  const text = fullText.slice(0, 6000);
  if (!text) throw new Error("Document not found - it may have expired (24h TTL). Please re-upload.");

  return generateJSONWithRetry(
    `You are an expert document analyst.`,
    `Analyze this document. Return JSON:
{
  "executive_summary": "2-3 sentence summary",
  "key_points": ["point 1", "point 2", "point 3"],
  "action_items": ["action 1"],
  "important_dates": ["date 1"],
  "entities": ["entity 1"],
  "risk_flags": []
}

Document:
${text}`
  );
}

// Q&A with RAG
export async function answerQuestion(
  docId: string,
  question: string,
  history: { role: string; content: string }[] = []
) {
  const queryEmbedding = await embedText(question);
  const retrieved = await retrieveTopK(docId, queryEmbedding, 4);
  if (!retrieved.length) {
    return {
      answer: "Document not found or expired (24h TTL). Please re-upload.",
      sources: [],
      confidence: 0,
    };
  }

  const context = retrieved
    .map((r, i) => `[Chunk ${r.chunkIndex} | similarity=${r.score.toFixed(2)}]\n${r.text}`)
    .join("\n\n---\n\n");

  const historyStr = history
    .slice(-6)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const systemPrompt = `You are a precise document Q&A assistant. Answer using ONLY the provided context.

Rules:
- Cite chunk numbers when relevant ("according to Chunk 2...")
- If the answer isn't in the context, say so clearly
- Be concise but thorough
- Use markdown formatting for clarity

Context from document:
${context}

${historyStr ? `Previous conversation:\n${historyStr}\n` : ""}`;

  const answer = await generateChat(systemPrompt, question, 800);
  const avgScore = retrieved.reduce((s, r) => s + r.score, 0) / retrieved.length;

  return {
    answer: answer || "I'm unable to generate a response right now. Please try again.",
    sources: retrieved.map((r) => ({
      chunk_index: r.chunkIndex,
      text: r.text.slice(0, 200) + "...",
      score: r.score,
    })),
    confidence: Math.min(Math.max(avgScore, 0), 1),
  };
}
