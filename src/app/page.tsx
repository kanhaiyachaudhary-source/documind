"use client";
import { useState } from "react";
import { Brain, FileText, Sparkles, Trash2, Loader2, Info } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import ModeSelector, { Mode } from "@/components/ModeSelector";
import { ExtractResults, ClassifyResults, SummarizeResults, ExportBar } from "@/components/Results";
import QAChat from "@/components/QAChat";
import { documentApi, aiApi, DocumentMetadata } from "@/lib/api";
import { toast } from "sonner";

export default function Home() {
  const [doc, setDoc] = useState<DocumentMetadata | null>(null);
  const [mode, setMode] = useState<Mode>("extract");
  const [results, setResults] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const process = async () => {
    if (!doc) return toast.error("Upload a document first");
    setProcessing(true);
    setResults(null);
    try {
      let res;
      if (mode === "extract") res = await aiApi.extract(doc.doc_id);
      if (mode === "classify") res = await aiApi.classify(doc.doc_id);
      if (mode === "summarize") res = await aiApi.summarize(doc.doc_id);
      setResults(res);
      toast.success("Processing complete");
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Processing failed - HF model may need to load. Try again.");
    } finally {
      setProcessing(false);
    }
  };

  const remove = async () => {
    if (!doc) return;
    await documentApi.delete(doc.doc_id).catch(() => {});
    setDoc(null);
    setResults(null);
    toast.success("Document removed");
  };

  return (
    <main className="min-h-screen">
      <nav className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center">
            <Brain className="w-5 h-5 text-bg" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg">
              Docu<span className="gradient-text">Mind</span>
            </h1>
            <p className="text-[0.65rem] text-muted-2 font-mono">Intelligent Document Processing</p>
          </div>
        </div>
        <div className="hidden md:flex gap-2 text-xs font-mono">
          <span className="px-3 py-1 bg-surface2 border border-white/10 rounded text-muted-2">
            Next.js · Hugging Face · Mistral 7B
          </span>
        </div>
      </nav>

      {!doc ? (
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-xs font-mono text-accent mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-2 animate-pulse" />
            OPEN-SOURCE RAG · 100% FREE
          </div>
          <h2 className="font-display text-5xl font-extrabold mb-4 leading-tight">
            Process Documents with <span className="gradient-text">AI Precision</span>
          </h2>
          <p className="text-muted-2 max-w-xl mx-auto mb-6 leading-relaxed">
            Upload PDFs, contracts, invoices. DocuMind uses real RAG — sentence-transformer embeddings + Mistral 7B — to extract, classify, summarize, and answer questions.
          </p>
          <div className="flex items-start gap-2 max-w-xl mx-auto mb-8 px-4 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg text-left">
            <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/90 leading-relaxed">
              <strong>Free tier note:</strong> First request may take 15-20s if the model is "cold". Subsequent requests are fast. If you get an error, just try again.
            </p>
          </div>
          <div className="max-w-xl mx-auto">
            <UploadZone onUploaded={setDoc} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {[
              { name: "Extract", desc: "Structured fields" },
              { name: "Classify", desc: "Auto-categorize" },
              { name: "Summarize", desc: "Key insights" },
              { name: "Q&A", desc: "Cited answers" },
            ].map((f) => (
              <div key={f.name} className="bg-surface/50 border border-white/5 rounded-xl p-4">
                <div className="font-display font-bold text-accent text-sm mb-1">{f.name}</div>
                <div className="text-xs text-muted-2">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-6 grid lg:grid-cols-[320px_1fr] gap-6">
          <aside className="space-y-5">
            <div className="bg-surface border border-white/10 rounded-xl p-4">
              <div className="text-[0.65rem] font-mono text-muted-2 uppercase tracking-wider mb-2">Active Document</div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{doc.filename}</div>
                  <div className="text-xs text-muted-2 mt-1">
                    {(doc.file_size / 1024).toFixed(1)} KB · {doc.chunk_count} chunks
                    {doc.page_count && ` · ${doc.page_count} pages`}
                  </div>
                </div>
                <button onClick={remove} className="text-danger hover:bg-danger/10 p-1 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <div className="text-[0.65rem] font-mono text-muted-2 uppercase tracking-wider mb-2">Processing Mode</div>
              <ModeSelector mode={mode} onChange={setMode} />
            </div>

            {mode !== "qa" && (
              <button
                onClick={process}
                disabled={processing}
                className="w-full py-3 bg-accent text-bg rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {processing ? "Processing..." : "Process Document"}
              </button>
            )}

            <div className="bg-surface/50 border border-white/5 rounded-xl p-4 text-xs text-muted-2 leading-relaxed">
              <div className="font-display font-bold text-white text-sm mb-2">📦 RAG Pipeline</div>
              <ol className="space-y-1 list-decimal list-inside">
                <li>PDF parsed via pdf-parse</li>
                <li>Chunked (800 char/150 overlap)</li>
                <li>Embedded via MiniLM-L6-v2</li>
                <li>Cosine similarity retrieval</li>
                <li>Mistral 7B generation</li>
              </ol>
            </div>
          </aside>

          <div className="bg-surface/30 border border-white/5 rounded-2xl p-6 min-h-[600px]">
            {mode === "qa" ? (
              <QAChat docId={doc.doc_id} filename={doc.filename} />
            ) : processing ? (
              <div className="flex flex-col items-center justify-center h-96 gap-4">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
                <div className="font-display font-bold">Processing with Mistral 7B...</div>
                <div className="text-sm text-muted-2 text-center max-w-md">
                  First request can take 15-20s if model is cold. Retrieving context and generating structured output.
                </div>
              </div>
            ) : !results ? (
              <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
                <Sparkles className="w-12 h-12 text-accent/40" />
                <div>
                  <div className="font-display font-bold text-lg">Ready to Process</div>
                  <div className="text-sm text-muted-2 mt-1">
                    Selected: <span className="text-accent capitalize">{mode}</span>. Click Process Document to begin.
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                {mode === "extract" && <ExtractResults data={results} />}
                {mode === "classify" && <ClassifyResults data={results} />}
                {mode === "summarize" && <SummarizeResults data={results} />}
                <ExportBar data={results} />
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="text-center py-6 text-xs text-muted-2 font-mono">
        Built by{" "}
        <a href="https://linkedin.com/in/kanhaiya772" className="text-accent hover:underline">
          Kanhaiya Chaudhary
        </a>{" "}
        · GenAI Developer @ PwC
      </footer>
    </main>
  );
}
