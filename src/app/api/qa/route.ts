import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/llm";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { doc_id, question, history = [] } = await req.json();
    if (!doc_id || !question) return NextResponse.json({ error: "doc_id + question required" }, { status: 400 });
    const result = await answerQuestion(doc_id, question, history);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
