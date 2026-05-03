"use client";
import { Search, Tag, FileText, MessageSquare } from "lucide-react";

export type Mode = "extract" | "classify" | "summarize" | "qa";

const MODES: { id: Mode; icon: any; name: string; desc: string }[] = [
  { id: "extract", icon: Search, name: "Extract", desc: "Structured fields" },
  { id: "classify", icon: Tag, name: "Classify", desc: "Type & category" },
  { id: "summarize", icon: FileText, name: "Summarize", desc: "Key insights" },
  { id: "qa", icon: MessageSquare, name: "Ask AI", desc: "Q&A on doc" },
];

export default function ModeSelector({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {MODES.map((m) => {
        const Icon = m.icon;
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`p-3 rounded-lg border transition-all text-left ${
              active ? "border-accent bg-accent/10" : "border-white/10 hover:border-white/20 bg-surface2"
            }`}
          >
            <Icon className={`w-4 h-4 mb-1.5 ${active ? "text-accent" : "text-muted-2"}`} />
            <div className="text-sm font-medium">{m.name}</div>
            <div className="text-[0.65rem] text-muted-2 mt-0.5">{m.desc}</div>
          </button>
        );
      })}
    </div>
  );
}
