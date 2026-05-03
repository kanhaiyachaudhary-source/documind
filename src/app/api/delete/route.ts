import { NextRequest, NextResponse } from "next/server";
import { deleteChunks } from "@/lib/vectorstore";

export async function POST(req: NextRequest) {
  try {
    const { doc_id } = await req.json();
    if (!doc_id) return NextResponse.json({ error: "doc_id required" }, { status: 400 });
    deleteChunks(doc_id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
