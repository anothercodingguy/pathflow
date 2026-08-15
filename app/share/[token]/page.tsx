import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatRunToPathData } from "@/lib/data";
import { runDetections } from "@/lib/detections";
import { ShieldCheck, Clock, Zap, DollarSign, Activity, AlertTriangle, ExternalLink, Bot, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

interface PublicSharePageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicSharePage({ params }: PublicSharePageProps) {
  const { token } = await params;

  const run = await prisma.run.findUnique({
    where: { shareToken: token },
    include: {
      agent: true,
      spans: { orderBy: { createdAt: "asc" } },
      detections: true,
      evaluation: true,
    },
  });

  if (!run) {
    notFound();
  }

  const pathData = formatRunToPathData(run);
  const detections = runDetections(pathData);

  return (
    <div className="min-h-screen bg-[#08080A] text-white p-4 sm:p-6 font-sans text-xs space-y-6">
      
      {/* Top Banner */}
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 bg-[#121217] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400">
            PF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">PathFlow Shared Trace</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/20">
                PUBLIC VIEW
              </span>
            </div>
            <p className="text-zinc-400 text-[11px]">Read-only execution audit snapshot</p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-lg shadow-blue-900/20"
        >
          <span>Open in PathFlow</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Trace Content */}
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* Trace Overview Card */}
        <div className="bg-[#121217] border border-white/10 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">{run.title}</h1>
                {run.status === "completed" ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> COMPLETED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-red-400 font-mono bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    <XCircle className="w-3 h-3" /> FAILED
                  </span>
                )}
              </div>
              <p className="text-zinc-400 text-xs">{run.description || "Production agent execution trace"}</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono bg-black/40 border border-white/5 px-4 py-2 rounded-lg">
              <div className="text-center">
                <div className="text-zinc-500 text-[10px]">WALL CLOCK</div>
                <div className="text-white font-bold font-sans">{(run.wallClockMs / 1000).toFixed(2)}s</div>
              </div>
              <div className="w-[1px] h-6 bg-white/10" />
              <div className="text-center">
                <div className="text-zinc-500 text-[10px]">TOKENS</div>
                <div className="text-white font-bold font-sans">{run.totalTokens.toLocaleString()}</div>
              </div>
              <div className="w-[1px] h-6 bg-white/10" />
              <div className="text-center">
                <div className="text-zinc-500 text-[10px]">COST</div>
                <div className="text-emerald-400 font-bold font-sans">${run.totalCostUsd.toFixed(4)}</div>
              </div>
            </div>
          </div>

          {/* Detections / Anomalies */}
          {detections.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Detected Anomalies ({detections.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {detections.map((d, i) => (
                  <div key={i} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-300 font-mono text-xs">{d.title}</span>
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">{d.severity}</span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">{d.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spans Waterfall */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
              Execution Spans ({run.spans.length})
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              {run.spans.map((s, idx) => (
                <div key={s.id} className="p-3 bg-black/30 border border-white/5 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-600 text-[10px]">#{idx + 1}</span>
                    <div>
                      <div className="font-semibold text-zinc-200">{s.name}</div>
                      <div className="text-[10px] text-zinc-500">{s.type} • {s.model || run.modelFamily}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-zinc-400">
                    <span>{s.latencyMs}ms</span>
                    <span>{s.tokens} tok</span>
                    <span className="text-zinc-300 font-semibold">${s.cost.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
