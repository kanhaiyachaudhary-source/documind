"use client";
import { Download, Copy, AlertTriangle, Tag, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function ExtractResults({ data }: { data: any }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-bold text-accent uppercase tracking-wider">
          Extracted Fields ({data.fields?.length || 0})
        </h3>
        <span className="text-xs text-muted-2 font-mono">{data.document_type}</span>
      </div>
      <div className="bg-surface border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-3 text-xs font-mono text-muted-2 font-normal">FIELD</th>
              <th className="text-left p-3 text-xs font-mono text-muted-2 font-normal">VALUE</th>
              <th className="text-left p-3 text-xs font-mono text-muted-2 font-normal">CONF</th>
            </tr>
          </thead>
          <tbody>
            {(data.fields || []).map((f: any, i: number) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-3 text-accent-3 font-mono text-xs uppercase">{f.field?.replace(/_/g, " ")}</td>
                <td className="p-3 text-white">
                  {Array.isArray(f.value) ? f.value.join(", ") : typeof f.value === "object" ? JSON.stringify(f.value) : String(f.value)}
                </td>
                <td className="p-3 text-accent-2 text-xs font-mono">● {Math.round((f.confidence || 0.85) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ClassifyResults({ data }: { data: any }) {
  const conf = Math.round((data.confidence || 0.9) * 100);
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-white/10 rounded-xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center">
          <Tag className="w-7 h-7 text-accent" />
        </div>
        <div className="flex-1">
          <div className="font-display text-xl font-bold text-accent">{data.document_type}</div>
          <div className="text-sm text-muted-2 mt-1">
            {data.category} {data.subcategory && `· ${data.subcategory}`}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-muted-2">Confidence</span>
            <div className="flex-1 max-w-xs h-1 bg-surface3 rounded overflow-hidden">
              <div className="h-full bg-gradient-to-r from-accent to-accent-2" style={{ width: `${conf}%` }} />
            </div>
            <span className="text-xs text-accent-2 font-mono">{conf}%</span>
          </div>
        </div>
      </div>

      {data.tags?.length > 0 && (
        <div>
          <div className="text-xs font-mono text-muted-2 uppercase tracking-wider mb-2">Tags</div>
          <div className="flex flex-wrap gap-2">
            {data.tags.map((t: string) => (
              <span key={t} className="px-3 py-1 bg-surface2 border border-white/10 rounded text-xs text-accent-2 font-mono">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.summary && (
        <div>
          <div className="text-xs font-mono text-muted-2 uppercase tracking-wider mb-2">Summary</div>
          <p className="text-sm text-white/90 leading-relaxed bg-surface2/50 rounded-lg p-4 border border-white/5">
            {data.summary}
          </p>
        </div>
      )}
    </div>
  );
}

export function SummarizeResults({ data }: { data: any }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-display font-bold text-accent uppercase tracking-wider mb-2">Executive Summary</h3>
        <p className="bg-surface border border-white/10 rounded-xl p-5 text-white/90 leading-relaxed">
          {data.executive_summary}
        </p>
      </div>

      {data.key_points?.length > 0 && (
        <div>
          <h3 className="text-sm font-display font-bold text-accent uppercase tracking-wider mb-2">Key Points</h3>
          <div className="space-y-2">
            {data.key_points.map((p: string, i: number) => (
              <div key={i} className="flex gap-3 bg-surface/50 p-3 rounded-lg border border-white/5">
                <CheckCircle className="w-4 h-4 text-accent-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-white/90 leading-relaxed">{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.action_items?.length > 0 && (
        <div>
          <h3 className="text-sm font-display font-bold text-accent-3 uppercase tracking-wider mb-2">Action Items</h3>
          <div className="space-y-2">
            {data.action_items.map((a: string, i: number) => (
              <div key={i} className="flex gap-3 bg-accent-3/5 border border-accent-3/20 p-3 rounded-lg">
                <span className="text-accent-3 flex-shrink-0">→</span>
                <span className="text-sm">{a}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.risk_flags?.length > 0 && (
        <div>
          <h3 className="text-sm font-display font-bold text-danger uppercase tracking-wider mb-2">Risk Flags</h3>
          <div className="space-y-2">
            {data.risk_flags.map((r: string, i: number) => (
              <div key={i} className="flex gap-3 bg-danger/5 border border-danger/20 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                <span className="text-sm text-danger/90">{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ExportBar({ data }: { data: any }) {
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `documind_${Date.now()}.json`;
    a.click();
    toast.success("Exported");
  };
  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success("Copied");
  };
  return (
    <div className="flex gap-2 mt-4">
      <button onClick={downloadJSON} className="px-3 py-1.5 bg-surface2 border border-white/10 rounded text-xs hover:border-accent flex items-center gap-2">
        <Download className="w-3 h-3" /> JSON
      </button>
      <button onClick={copyJSON} className="px-3 py-1.5 bg-surface2 border border-white/10 rounded text-xs hover:border-accent flex items-center gap-2">
        <Copy className="w-3 h-3" /> Copy
      </button>
    </div>
  );
}
