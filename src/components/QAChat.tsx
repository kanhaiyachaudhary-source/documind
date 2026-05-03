"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { aiApi } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: any[];
  confidence?: number;
}

export default function QAChat({ docId, filename }: { docId: string; filename: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Document **${filename}** is loaded and indexed. Ask me anything — I'll search the document and give you grounded answers with source citations.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));
      const res = await aiApi.ask(docId, q, history);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.answer, sources: res.sources, confidence: res.confidence },
      ]);
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${e.response?.data?.error || e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                m.role === "user" ? "bg-accent-2/15 text-accent-2" : "bg-accent/15 text-accent"
              }`}
            >
              {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] ${m.role === "user" ? "text-right" : ""}`}>
              <div
                className={`rounded-xl px-4 py-3 text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1 prose-strong:text-accent ${
                  m.role === "user" ? "bg-accent-2/10 border border-accent-2/20" : "bg-surface border border-white/10"
                }`}
              >
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
              {m.sources && m.sources.length > 0 && (
                <details className="mt-2 text-xs text-muted-2">
                  <summary className="cursor-pointer hover:text-accent">
                    📎 {m.sources.length} sources · {((m.confidence || 0) * 100).toFixed(0)}% confidence
                  </summary>
                  <div className="mt-2 space-y-2">
                    {m.sources.map((s, j) => (
                      <div key={j} className="bg-surface2/50 border border-white/5 rounded p-2 font-mono text-[0.7rem]">
                        <div className="text-accent mb-1">Chunk {s.chunk_index} · score {s.score.toFixed(2)}</div>
                        <div className="text-muted-2">{s.text}</div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-surface border border-white/10 rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Ask anything about this document..."
          className="flex-1 bg-surface border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-5 bg-accent text-bg rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Ask
        </button>
      </div>
    </div>
  );
}
