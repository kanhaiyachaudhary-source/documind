import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function parseDocument(buffer: Buffer, filename: string): Promise<{ text: string; pageCount?: number }> {
  const ext = filename.toLowerCase().split(".").pop() || "";

  if (ext === "pdf") {
    const data = await pdfParse(buffer);
    return { text: data.text.trim(), pageCount: data.numpages };
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value.trim() };
  }

  if (ext === "txt") {
    return { text: buffer.toString("utf-8").trim() };
  }

  throw new Error(`Unsupported format: ${ext}`);
}

export function chunkText(text: string, chunkSize = 800, overlap = 150): string[] {
  // Smart chunking - splits on paragraphs/sentences when possible
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length > chunkSize) {
      if (current) chunks.push(current.trim());
      // If a single paragraph is too big, split by sentences
      if (para.length > chunkSize) {
        const sentences = para.split(/(?<=[.!?])\s+/);
        let sentChunk = "";
        for (const s of sentences) {
          if ((sentChunk + " " + s).length > chunkSize) {
            if (sentChunk) chunks.push(sentChunk.trim());
            sentChunk = s;
          } else {
            sentChunk += " " + s;
          }
        }
        if (sentChunk) current = sentChunk;
        else current = "";
      } else {
        current = para;
      }
    } else {
      current = current ? current + "\n\n" + para : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // Add overlap
  if (overlap > 0 && chunks.length > 1) {
    return chunks.map((c, i) => {
      if (i === 0) return c;
      const prevChunk = chunks[i - 1];
      const overlapText = prevChunk.slice(-overlap);
      return overlapText + "\n\n" + c;
    });
  }

  return chunks;
}
