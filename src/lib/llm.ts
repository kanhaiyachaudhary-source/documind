import { generateChat, generateJSON, embedText } from "./hf";
import { getFullText, retrieveTopK } from "./vectorstore";

// EXTRACT
export async function extractFields(docId: string) {
  const text = getFullText(docId).slice(0, 4000);
  if (!text) throw new Error("Document not found");

  const result = await generateJSON(
    `You are an enterprise document data extraction AI. Extract ALL key-value structured data from the document including names, dates, amounts, addresses, IDs, contact info, reference numbers.`,
    `Document content:\n\n${text}\n\nReturn JSON with this exact structure:
{
  "document_type": "type of document like Invoice, Contract, Resume, etc.",
  "fields": {
    "field_name_1": "value 1",
    "field_name_2": "value 2"
  }
}`
  );

  return {
    document_type: result.document_type || "Unknown",
    fields: Object.entries(result.fields || {}).map(([k, v]) => ({
      field: k,
      value: v,
      confidence: 0.85,
    })),
    raw: result,
  };
}

// CLASSIFY
export async function classifyDocument(docId: string) {
  const text = getFullText(docId).slice(0, 3000);
  if (!text) throw new Error("Document not found");

  return generateJSON(
    `You are a document classification expert. Analyze the document and classify it.`,
    `Document content:\n\n${text}\n\nReturn JSON:
{
  "document_type": "specific type like Resume, Invoice, Legal Contract, Research Paper, etc.",
  "category": "broad category like Business, Legal, Personal, Academic",
  "subcategory": "more specific subcategory",
  "confidence": 0.92,
  "language": "English",
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "one-line summary of what the document is about"
}`
  );
}

// SUMMARIZE
export async function summarizeDocument(docId: string) {
  const text = getFullText(docId).slice(0, 6000);
  if (!text) throw new Error("Document not found");

  return generateJSON(
    `You are an expert document analyst. Provide comprehensive analysis.`,
    `Document content:\n\n${text}\n\nReturn JSON:
{
  "executive_summary": "2-3 sentence summary",
  "key_points": ["point 1", "point 2", "point 3"],
  "action_items": ["action 1", "action 2"],
  "important_dates": ["date 1"],
  "entities": ["entity 1", "entity 2"],
  "risk_flags": ["risk 1 if any"]
}`
  );
}

// Q&A with RAG
export async function answerQuestion(
  docId: string,
  question: string,
  history: { role: string; content: string }[] = []
) {
  // 1. Embed the question
  const queryEmbedding = await embedText(question);

  // 2. Retrieve top-K relevant chunks
  const retrieved = retrieveTopK(docId, queryEmbedding, 4);
  if (!retrieved.length) {
    return {
      answer: "I couldn't find relevant information in the document. The document may have expired from memory — please re-upload it.",
      sources: [],
      confidence: 0,
    };
  }

  // 3. Build context
  const context = retrieved
    .map((r, i) => `[Chunk ${r.chunkIndex} | similarity=${r.score.toFixed(2)}]\n${r.text}`)
    .join("\n\n---\n\n");

  // 4. Build chat history
  const historyStr = history
    .slice(-6)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  // 5. Generate answer
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
