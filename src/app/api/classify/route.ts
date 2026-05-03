import { NextRequest, NextResponse } from "next/server";
import { classifyDocument } from "@/lib/llm";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { doc_id } = await req.json();
    if (!doc_id) return NextResponse.json({ error: "doc_id required" }, { status: 400 });
    const result = await classifyDocument(doc_id);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
