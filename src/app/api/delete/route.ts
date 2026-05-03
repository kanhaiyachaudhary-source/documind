import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { parseDocument, chunkText } from "@/lib/parser";
import { embedBatch } from "@/lib/hf";
import { saveChunks } from "@/lib/vectorstore";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const ext = file.name.toLowerCase().split(".").pop() || "";
    if (!["pdf", "docx", "txt"].includes(ext)) {
      return NextResponse.json({ error: `Unsupported format: ${ext}` }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Parse
    const { text, pageCount } = await parseDocument(buffer, file.name);
    if (!text) return NextResponse.json({ error: "No text extracted" }, { status: 400 });

    // 2. Chunk
    const chunks = chunkText(text, 800, 150);
    if (!chunks.length) return NextResponse.json({ error: "Could not chunk document" }, { status: 400 });

    // 3. Embed (limit to first 30 chunks to avoid free tier rate limits)
    const chunksToEmbed = chunks.slice(0, 30);
    const embeddings = await embedBatch(chunksToEmbed);

    // 4. Build records
    const docId = uuidv4();
    const records = chunksToEmbed.map((text, i) => ({
      id: `${docId}_${i}`,
      doc_id: docId,
      chunk_index: i,
      text,
      embedding: embeddings[i],
      filename: file.name,
    }));

    // 5. Store in Vercel KV (persistent)
    await saveChunks(docId, records);

    return NextResponse.json({
      success: true,
      doc_id: docId,
      metadata: {
        doc_id: docId,
        filename: file.name,
        file_size: file.size,
        file_type: ext,
        page_count: pageCount,
        chunk_count: records.length,
        uploaded_at: new Date().toISOString(),
        text_preview: text.slice(0, 500),
      },
      message: `Indexed ${records.length} chunks${chunks.length > 30 ? ` (truncated from ${chunks.length})` : ""}`,
    });
  } catch (e: any) {
    console.error("[upload] error:", e);
    return NextResponse.json({ error: e.message || "Upload failed. Hugging Face model may be loading - try again in 20s." }, { status: 500 });
  }
}
