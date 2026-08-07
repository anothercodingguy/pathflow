'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PathData, fetchRunsFromApi } from '@/lib/data';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  AlertTriangle,
  Sparkles,
  Clock,
  Layers
} from 'lucide-react';
import Link from 'next/link';

interface TraceDiffProps {
  initialLeftId?: string;
  initialRightId?: string;
}

export default function TraceDiff({ initialLeftId, initialRightId }: TraceDiffProps) {
  const [runs, setRuns] = useState<PathData[]>([]);
  const [leftId, setLeftId] = useState<string>(initialLeftId || '');
  const [rightId, setRightId] = useState<string>(initialRightId || '');
  const [activeTab, setActiveTab] = useState<'metrics' | 'timeline' | 'spans'>('metrics');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await fetchRunsFromApi();
      setRuns(data);
      if (data.length > 0) {
        if (!leftId || !data.some(r => r.id === leftId)) setLeftId(data[0].id);
        if (!rightId || !data.some(r => r.id === rightId)) setRightId(data[1]?.id || data[0].id);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const leftTrace = useMemo(() => {
    return runs.find(t => t.id === leftId) || runs[0] || null;
  }, [runs, leftId]);

  const rightTrace = useMemo(() => {
    return runs.find(t => t.id === rightId) || runs[1] || runs[0] || null;
  }, [runs, rightId]);

  // Metric Delta Math
  const leftLatencySec = leftTrace ? leftTrace.durationMs / 1000 : 0;
  const rightLatencySec = rightTrace ? rightTrace.durationMs / 1000 : 0;
  const latencyPct = leftLatencySec > 0 ? ((rightLatencySec - leftLatencySec) / leftLatencySec) * 100 : 0;

  const costPct = leftTrace && leftTrace.cost > 0 && rightTrace ? ((rightTrace.cost - leftTrace.cost) / leftTrace.cost) * 100 : 0;
  const tokenPct = leftTrace && leftTrace.tokens > 0 && rightTrace ? ((rightTrace.tokens - leftTrace.tokens) / leftTrace.tokens) * 100 : 0;

  // Structural Execution Diff
  const structuralChanges = useMemo(() => {
    if (!leftTrace || !rightTrace) return { added: [], removed: [], isRetry: false, changedSpans: [] };

    const leftTypes = new Set((leftTrace.spans || []).map(s => s.type));
    const rightTypes = new Set((rightTrace.spans || []).map(s => s.type));

    const added: string[] = [];
    const removed: string[] = [];

    rightTypes.forEach(t => {
      if (!leftTypes.has(t)) added.push(t);
    });

    leftTypes.forEach(t => {
      if (!rightTypes.has(t)) removed.push(t);
    });

    const isRetry = (rightTrace.spans || []).some(s => s.name.toLowerCase().includes('retry') || s.status === 'FAILED');

    // Compare individual span latencies
    const changedSpans: { name: string; type: string; oldLatency: number; newLatency: number; diffPct: number }[] = [];
    rightTrace.spans.forEach(rSpan => {
      const lSpan = leftTrace.spans.find(s => s.name === rSpan.name || s.type === rSpan.type);
      if (lSpan) {
        const diffMs = rSpan.latencyMs - lSpan.latencyMs;
        const pct = ((rSpan.latencyMs - lSpan.latencyMs) / lSpan.latencyMs) * 100;
        if (Math.abs(pct) > 10) {
          changedSpans.push({
            name: rSpan.name,
            type: rSpan.type,
            oldLatency: lSpan.latencyMs,
            newLatency: rSpan.latencyMs,
            diffPct: Math.round(pct)
          });
        }
      }
    });

    return { added, removed, isRetry, changedSpans };
  }, [leftTrace, rightTrace]);

  // Automated Regression Root-Cause Analysis
  const regressionSummary = useMemo(() => {
    if (!leftTrace || !rightTrace) return null;
    const reasons: string[] = [];

    if (latencyPct > 15) {
      if (structuralChanges.added.includes('Browser') || structuralChanges.added.includes('Playwright')) {
        reasons.push('Browser DOM automation step introduced into execution pipeline');
      }
      if (structuralChanges.isRetry) {
        reasons.push('Retry loop triggered due to downstream span failure');
      }
      if (rightTrace.tokens > leftTrace.tokens * 1.3) {
        reasons.push(`Prompt context size expanded by +${Math.round(((rightTrace.tokens - leftTrace.tokens) / leftTrace.tokens) * 100)}%`);
      }
      if (reasons.length === 0) {
        reasons.push('LLM generation latency increased for complex prompt completion');
      }
    } else if (latencyPct < -15) {
      reasons.push(`Execution pipeline optimized: Total runtime decreased by ${Math.abs(Math.round(latencyPct))}%`);
    }

    return {
      hasRegression: latencyPct > 10 || costPct > 10,
      latencyPct: Math.round(latencyPct),
      costPct: Math.round(costPct),
      reasons: reasons.length > 0 ? reasons : ['No significant performance regression detected between execution runs.']
    };
  }, [leftTrace, rightTrace, latencyPct, costPct, structuralChanges]);

  return (
    <div className="w-full min-h-[calc(100vh-2.5rem)] bg-[#08080A] px-4 py-3 space-y-4 font-mono text-xs">
      
      {/* 1. Header Bar */}
      <div className="flex items-baseline justify-between border-b border-[#1E1E24] pb-2.5">
        <h1 className="text-dev-title text-white font-sans uppercase">Compare Runs</h1>
        <span className="text-xs text-zinc-500 font-mono">
          {isLoading ? 'Loading database traces...' : 'Trace Diff & Performance Regression Engine'}
        </span>
      </div>

      {runs.length > 0 && leftTrace && rightTrace ? (
        <>
          {/* 2. Run Selectors (Baseline vs Comparison) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-[#1E1E24] rounded bg-[#0F0F12] p-2.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                Baseline Execution (Run A)
              </label>
              <select
                value={leftId}
                onChange={(e) => setLeftId(e.target.value)}
                className="w-full rounded border border-[#1E1E24] bg-[#08080A] px-2.5 py-1 text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
              >
                {runs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({(t.durationMs / 1000).toFixed(1)}s • ${t.cost.toFixed(3)} • {t.modelFamily})
                  </option>
                ))}
              </select>
            </div>

            <div className="border border-[#1E1E24] rounded bg-[#0F0F12] p-2.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                Comparison Execution (Run B)
              </label>
              <select
                value={rightId}
                onChange={(e) => setRightId(e.target.value)}
                className="w-full rounded border border-[#1E1E24] bg-[#08080A] px-2.5 py-1 text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
              >
                {runs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({(t.durationMs / 1000).toFixed(1)}s • ${t.cost.toFixed(3)} • {t.modelFamily})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Automated Regression Root-Cause Analysis Banner */}
          {regressionSummary && (
            <div className={`p-3.5 rounded border font-sans text-xs ${
              regressionSummary.hasRegression
                ? 'border-amber-500/40 bg-amber-950/30 text-amber-200'
                : 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
            }`}>
              <div className="flex items-center justify-between mb-1.5 font-mono text-[11px]">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>AUTOMATED REGRESSION ANALYSIS</span>
                </div>
                <div className="flex items-center gap-2 font-telemetry">
                  <span>Latency: <strong className={regressionSummary.latencyPct > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                    {regressionSummary.latencyPct > 0 ? `+${regressionSummary.latencyPct}%` : `${regressionSummary.latencyPct}%`}
                  </strong></span>
                  <span>•</span>
                  <span>Cost: <strong className={regressionSummary.costPct > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                    {regressionSummary.costPct > 0 ? `+${regressionSummary.costPct}%` : `${regressionSummary.costPct}%`}
                  </strong></span>
                </div>
              </div>

              <div className="space-y-1 font-mono text-[11px] text-zinc-300">
                {regressionSummary.reasons.map((reason, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Metric Diff Table */}
          <div className="space-y-1.5">
            <h2 className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Metrics Comparison Table
            </h2>

            <div className="border border-[#1E1E24] rounded divide-y divide-[#1E1E24] bg-[#0F0F12]">
              
              <div className="flex items-center justify-between p-2.5">
                <span className="text-zinc-400 font-bold w-32">Latency</span>
                <div className="flex items-center gap-3 font-telemetry">
                  <span className="text-zinc-300">{leftLatencySec.toFixed(1)}s</span>
                  <span className="text-zinc-600">→</span>
                  <span className="text-white font-bold">{rightLatencySec.toFixed(1)}s</span>
                </div>
                <div className="flex items-center gap-1 font-telemetry w-28 justify-end">
                  <span className={`font-bold ${latencyPct <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {latencyPct > 0 ? `+${latencyPct.toFixed(0)}%` : `${latencyPct.toFixed(0)}%`}
                  </span>
                  {latencyPct > 0 ? <TrendingUp className="h-3.5 w-3.5 text-amber-400" /> : <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5">
                <span className="text-zinc-400 font-bold w-32">Cost</span>
                <div className="flex items-center gap-3 font-telemetry">
                  <span className="text-zinc-300">${leftTrace.cost.toFixed(3)}</span>
                  <span className="text-zinc-600">→</span>
                  <span className="text-white font-bold">${rightTrace.cost.toFixed(3)}</span>
                </div>
                <div className="flex items-center gap-1 font-telemetry w-28 justify-end">
                  <span className={`font-bold ${costPct <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {costPct > 0 ? `+${costPct.toFixed(0)}%` : `${costPct.toFixed(0)}%`}
                  </span>
                  {costPct > 0 ? <TrendingUp className="h-3.5 w-3.5 text-amber-400" /> : <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5">
                <span className="text-zinc-400 font-bold w-32">Total Tokens</span>
                <div className="flex items-center gap-3 font-telemetry">
                  <span className="text-zinc-300">{(leftTrace.tokens / 1000).toFixed(1)}k</span>
                  <span className="text-zinc-600">→</span>
                  <span className="text-white font-bold">{(rightTrace.tokens / 1000).toFixed(1)}k</span>
                </div>
                <div className="flex items-center gap-1 font-telemetry w-28 justify-end">
                  <span className={`font-bold ${tokenPct <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {tokenPct > 0 ? `+${tokenPct.toFixed(0)}%` : `${tokenPct.toFixed(0)}%`}
                  </span>
                  {tokenPct > 0 ? <TrendingUp className="h-3.5 w-3.5 text-amber-400" /> : <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5">
                <span className="text-zinc-400 font-bold w-32">Reasoning Depth</span>
                <div className="flex items-center gap-3 font-telemetry">
                  <span className="text-zinc-300">Depth {leftTrace.elevationDepth}</span>
                  <span className="text-zinc-600">→</span>
                  <span className="text-white font-bold">Depth {rightTrace.elevationDepth}</span>
                </div>
                <div className="w-28 text-right text-zinc-500 font-telemetry">
                  Δ {rightTrace.elevationDepth - leftTrace.elevationDepth} steps
                </div>
              </div>

            </div>
          </div>

          {/* 5. Structural Execution Changes */}
          <div className="space-y-1.5">
            <h2 className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Execution Structure & Span Diff
            </h2>

            <div className="border border-[#1E1E24] bg-[#0F0F12] p-3 rounded space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {structuralChanges.added.map((type) => (
                  <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold text-[11px]">
                    <Plus className="h-3 w-3" /> Added {type}
                  </span>
                ))}

                {structuralChanges.removed.map((type) => (
                  <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold text-[11px]">
                    <Minus className="h-3 w-3" /> Removed {type}
                  </span>
                ))}

                {structuralChanges.isRetry && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400 font-bold text-[11px]">
                    <AlertTriangle className="h-3 w-3" /> Step Failure Present
                  </span>
                )}
              </div>

              {/* Span Latency Shift Details */}
              {structuralChanges.changedSpans.length > 0 && (
                <div className="space-y-1 border-t border-[#1E1E24] pt-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Span Latency Shifts:</span>
                  {structuralChanges.changedSpans.map((sp, idx) => (
                    <div key={idx} className="flex items-center justify-between text-zinc-300 font-mono text-[11px]">
                      <span>• {sp.name} ({sp.type}):</span>
                      <span className="font-telemetry">
                        {sp.oldLatency}ms → <strong className="text-white">{sp.newLatency}ms</strong>
                        <span className={`ml-2 font-bold ${sp.diffPct > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          ({sp.diffPct > 0 ? `+${sp.diffPct}%` : `${sp.diffPct}%`})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 border border-[#1E1E24] rounded bg-[#0F0F12] text-center space-y-2">
          <p className="text-xs text-zinc-400">At least 2 database traces required to compute execution diffs.</p>
        </div>
      )}

    </div>
  );
}
