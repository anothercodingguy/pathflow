'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PathData, SpanData, formatCurrency, CurrencyMode } from '@/lib/data';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Copy,
  Check,
  Terminal,
  Sparkles,
  Lightbulb
} from 'lucide-react';
import Link from 'next/link';

interface TraceHeroInspectorProps {
  run: PathData;
}

export default function TraceHeroInspector({ run }: TraceHeroInspectorProps) {
  const [activeLeftView, setActiveLeftView] = useState<'tree' | 'flame'>('tree');
  const [currency, setCurrency] = useState<CurrencyMode>('USD');

  useEffect(() => {
    const updateCurrency = () => {
      const saved = localStorage.getItem('pathflow_currency') as CurrencyMode;
      if (saved === 'INR' || saved === 'USD') {
        setCurrency(saved);
      }
    };
    updateCurrency();
    window.addEventListener('storage', updateCurrency);
    return () => window.removeEventListener('storage', updateCurrency);
  }, []);

  const defaultSpan = useMemo(() => {
    return run.spans.find(s => s.status === 'FAILED') || run.spans[0] || null;
  }, [run.spans]);

  const [selectedSpan, setSelectedSpan] = useState<SpanData | null>(defaultSpan);
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);

  const totalDuration = useMemo(() => {
    return run.spans.reduce((acc, s) => acc + s.latencyMs, 0) || run.durationMs || 1;
  }, [run]);

  // Analytics Computation for Execution Intelligence
  const slowestSpan = useMemo(() => {
    if (!run.spans || run.spans.length === 0) return null;
    return [...run.spans].sort((a, b) => b.latencyMs - a.latencyMs)[0];
  }, [run.spans]);

  const highestCostSpan = useMemo(() => {
    if (!run.spans || run.spans.length === 0) return null;
    return [...run.spans].sort((a, b) => b.cost - a.cost)[0];
  }, [run.spans]);

  const criticalSpanIds = useMemo(() => {
    if (!run.spans || run.spans.length === 0) return new Set<string>();

    const criticalSet = new Set<string>();
    let maxSpan = run.spans[0];
    run.spans.forEach(s => {
      if (s.latencyMs > maxSpan.latencyMs) {
        maxSpan = s;
      }
    });

    let currentId: string | null = maxSpan.spanId;
    while (currentId) {
      criticalSet.add(currentId);
      const spanObj = run.spans.find(s => s.spanId === currentId);
      currentId = (spanObj?.parentSpanId) || null;
    }

    return criticalSet;
  }, [run.spans]);

  const recommendations = useMemo(() => {
    const recs: string[] = [];
    if (slowestSpan && run.durationMs > 0) {
      const pct = Math.round((slowestSpan.latencyMs / totalDuration) * 100);
      recs.push(`• ${slowestSpan.name} (${slowestSpan.type}) dominated ${pct}% of total execution time.`);
    }
    if (highestCostSpan && highestCostSpan.cost > 0) {
      recs.push(`• ${highestCostSpan.name} step accounted for highest cost (${formatCurrency(highestCostSpan.cost, currency)}).`);
    }
    if (run.spans.some(s => s.status === 'FAILED' || s.name.toLowerCase().includes('retry'))) {
      recs.push(`• Step retry / failure detected during execution pipeline.`);
    } else {
      recs.push(`• Clean execution pipeline with zero step retries.`);
    }
    return recs;
  }, [run, slowestSpan, highestCostSpan, totalDuration, currency]);

  const exportTraceJson = () => {
    const tracePayload = {
      traceId: `pf_trace_${run.id}`,
      agent: run.agent,
      metrics: {
        latencySec: (run.durationMs / 1000).toFixed(2),
        velocityTps: run.tps,
        costUsd: run.cost,
        tokens: run.tokens,
      },
      spans: run.spans
    };

    const blob = new Blob([JSON.stringify(tracePayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pathflow-trace-${run.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyPayload = (text: string, target: 'input' | 'output') => {
    navigator.clipboard.writeText(text);
    if (target === 'input') {
      setCopiedInput(true);
      setTimeout(() => setCopiedInput(false), 2000);
    } else {
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    }
  };

  const isBreakerTripped = Boolean(run.breakerTriggered || run.status.toUpperCase() === 'BREAKER_TRIPPED');
  const isFailed = run.status.toUpperCase() === 'FAILED';

  return (
    <div className="w-full h-[calc(100vh-2.5rem)] bg-[#08080A] flex flex-col font-mono overflow-hidden">
      
      {/* 1. Header Bar */}
      <div className="z-10 flex flex-wrap items-center justify-between border-b border-[#1E1E24] bg-[#08080A] px-4 py-2 text-xs shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/runs"
            className="flex items-center gap-1 rounded border border-[#1E1E24] bg-[#0F0F12] px-2 py-0.5 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Runs
          </Link>

          <span className="text-zinc-700">/</span>

          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white font-sans">{run.title}</h1>
            {isBreakerTripped ? (
              <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded text-[11px] font-bold animate-pulse">
                <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> BREAKER TRIPPED
              </span>
            ) : isFailed ? (
              <span className="inline-flex items-center gap-1 text-red-400 text-[11px] font-bold">
                <AlertTriangle className="h-3.5 w-3.5" /> FAILED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" /> SUCCESS
              </span>
            )}
          </div>
        </div>

        {/* Telemetry Header */}
        <div className="flex items-center gap-4 text-xs font-telemetry">
          <span>Latency: <strong className="text-white">{(run.durationMs / 1000).toFixed(1)}s</strong></span>
          <span className="text-zinc-700">•</span>
          <span>Tokens: <strong className="text-white">{(run.tokens / 1000).toFixed(1)}k</strong></span>
          <span className="text-zinc-700">•</span>
          <span>Cost: <strong className="text-emerald-400">{formatCurrency(run.cost, currency)}</strong></span>
          <span className="text-zinc-700">•</span>
          <span>Velocity: <strong className="text-blue-400">{run.tps} tok/s</strong></span>

          <button onClick={exportTraceJson} className="linear-btn ml-2">
            <Download className="h-3 w-3" />
            Export Trace JSON
          </button>
        </div>
      </div>

      {/* Real-Time Circuit Breaker Active Interruption Banner */}
      {isBreakerTripped && (
        <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/40 to-amber-950/80 border-b border-amber-500/40 px-6 py-2.5 flex items-center justify-between text-xs shrink-0 font-sans">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 animate-bounce">
              <Zap className="h-4 w-4 fill-amber-300" />
            </div>
            <div>
              <div className="font-bold text-amber-200 text-xs flex items-center gap-2">
                <span>PATHFLOW REAL-TIME CIRCUIT BREAKER INTERRUPTED THIS RUN</span>
                <span className="bg-amber-400 text-black px-1.5 py-0.2 rounded font-mono font-extrabold text-[10px]">ACTIVE SHIELD</span>
              </div>
              <p className="text-[#D4D4D8] text-[11px] font-mono mt-0.5">
                {run.breakerReason || 'Hard per-task dollar cap enforced. Execution terminated in real-time before additional token spend.'}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 font-mono text-[11px] bg-black/40 px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-200">
            <div>Max Budget Cap: <strong className="text-white">${(run.maxBudgetUsd || 2.00).toFixed(2)} USD</strong></div>
            <div className="text-amber-500">•</div>
            <div>Estimated Savings: <strong className="text-emerald-400">+$198.00 USD</strong></div>
          </div>
        </div>
      )}

      {/* 2. Split Screen Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 divide-x divide-[#1E1E24] overflow-hidden">
        
        {/* LEFT PANE (40%) */}
        <div className="lg:col-span-5 flex flex-col h-full bg-[#08080A] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#1E1E24] bg-[#0F0F12] px-3 py-1.5 shrink-0 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveLeftView('tree')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                  activeLeftView === 'tree'
                    ? 'bg-[#16161A] text-blue-400 border border-[#1E1E24]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Execution Tree
              </button>
              <button
                onClick={() => setActiveLeftView('flame')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                  activeLeftView === 'flame'
                    ? 'bg-[#16161A] text-blue-400 border border-[#1E1E24]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Timeline Flame Graph
              </button>
            </div>

            <span className="text-[10px] text-zinc-500">{run.spans.length} Spans</span>
          </div>

          {activeLeftView === 'tree' && (
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#1E1E24]/40 text-xs">
              {run.spans.map((span) => {
                const isSelected = selectedSpan?.spanId === span.spanId;
                const isCritical = criticalSpanIds.has(span.spanId);
                const indent = span.parentSpanId ? 'ml-4' : 'ml-0';

                return (
                  <div
                    key={span.id}
                    onClick={() => setSelectedSpan(span)}
                    className={`group cursor-pointer py-2 px-2 rounded transition-colors flex items-center justify-between font-mono ${indent} ${
                      isSelected ? 'bg-[#121215] border border-blue-500/40 text-white font-bold' : 'hover:bg-[#0F0F12] text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-zinc-600 text-[10px] shrink-0 font-mono">
                        {span.parentSpanId ? '├─' : 'v'}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded border text-[10px] uppercase shrink-0 ${
                        span.status === 'FAILED'
                          ? 'border-red-500/40 text-red-400 bg-red-500/10'
                          : 'border-[#1E1E24] text-blue-400 bg-[#0F0F12]'
                      }`}>
                        {span.type}
                      </span>
                      <span className="truncate">{span.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-telemetry text-zinc-400 text-[11px]">
                      {isCritical && (
                        <span className="text-blue-400 text-[10px]" title="Critical Path Step">
                          <Zap className="h-3 w-3 inline" />
                        </span>
                      )}
                      <span>{span.latencyMs}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeLeftView === 'flame' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs font-mono">
              <div className="text-[11px] font-bold text-zinc-500 uppercase border-b border-[#1E1E24] pb-1.5 flex justify-between">
                <span>Execution Timeline</span>
                <span>Total: {(totalDuration / 1000).toFixed(2)}s</span>
              </div>

              <div className="space-y-2">
                {run.spans.map((span, idx) => {
                  const durationPct = Math.max(4, Math.min(100, (span.latencyMs / totalDuration) * 100));
                  let cumulativeOffset = 0;
                  for (let i = 0; i < idx; i++) {
                    cumulativeOffset += run.spans[i].latencyMs;
                  }
                  const startPct = (cumulativeOffset / totalDuration) * 100;
                  const isSelected = selectedSpan?.spanId === span.spanId;

                  return (
                    <div
                      key={span.id}
                      onClick={() => setSelectedSpan(span)}
                      className={`group cursor-pointer p-2 rounded border transition-colors ${
                        isSelected ? 'border-blue-500 bg-[#121215]' : 'border-[#1E1E24] bg-[#09090B] hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">{cumulativeOffset}ms</span>
                          <span className="text-blue-400 font-bold">[{span.type}]</span>
                          <span className="text-white truncate max-w-[140px]">{span.name}</span>
                        </div>
                        <span className="text-white font-bold">{span.latencyMs}ms</span>
                      </div>

                      <div className="w-full bg-zinc-900 rounded-full h-2 relative overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            span.status === 'FAILED'
                              ? 'bg-red-500'
                              : criticalSpanIds.has(span.spanId)
                              ? 'bg-blue-500'
                              : 'bg-blue-500/60'
                          }`}
                          style={{
                            marginLeft: `${startPct}%`,
                            width: `${durationPct}%`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANE (60%): Execution Intelligence & Node Inspector */}
        <div className="lg:col-span-7 flex flex-col h-full bg-[#0F0F12] overflow-hidden divide-y divide-[#1E1E24]">
          
          {/* Top Section: Alerts & Execution Intelligence */}
          <div className="p-4 space-y-3 bg-[#09090C] shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <h2 className="font-bold text-white uppercase tracking-wider text-xs font-sans">
                  Execution Intelligence Summary
                </h2>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Automated Analysis</span>
            </div>

            {/* Core Insight Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="border border-[#1E1E24] bg-[#0F0F12] p-2 rounded">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">SLOWEST SPAN</span>
                <span className="text-white font-bold truncate block mt-0.5">
                  {slowestSpan ? `${slowestSpan.name} (${(slowestSpan.latencyMs / 1000).toFixed(1)}s)` : 'None'}
                </span>
              </div>

              <div className="border border-[#1E1E24] bg-[#0F0F12] p-2 rounded">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">HIGHEST COST</span>
                <span className="text-emerald-400 font-bold truncate block mt-0.5">
                  {highestCostSpan ? `${highestCostSpan.name} (${formatCurrency(highestCostSpan.cost, currency)})` : '$0.00'}
                </span>
              </div>

              <div className="border border-[#1E1E24] bg-[#0F0F12] p-2 rounded">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">CRITICAL PATH</span>
                <span className="text-blue-400 font-bold truncate block mt-0.5">
                  {slowestSpan ? `Prompt → ${slowestSpan.type}` : 'Direct'}
                </span>
              </div>
            </div>

            {/* Recommendations List */}
            <div className="border border-[#1E1E24] bg-[#08080A] p-2.5 rounded text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-400 font-bold text-[10px] uppercase mb-1">
                <Lightbulb className="h-3 w-3 text-amber-400" /> Recommendations & Optimization Insights
              </div>
              {recommendations.map((rec, i) => (
                <div key={i} className="text-zinc-300 leading-relaxed font-mono">
                  {rec}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section: Node Inspector & Payloads */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1E1E24] bg-[#08080A] px-4 py-2 shrink-0 text-xs">
              <div className="flex items-center gap-2 font-mono">
                <Terminal className="h-3.5 w-3.5 text-blue-400" />
                <h2 className="font-bold text-white uppercase tracking-wider">Node Inspector</h2>
              </div>

              {selectedSpan && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase font-mono ${
                  selectedSpan.status === 'FAILED' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {selectedSpan.status}
                </span>
              )}
            </div>

            {selectedSpan ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
                <div className="border-b border-[#1E1E24] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                      {selectedSpan.type}
                    </span>
                    <h3 className="text-sm font-bold text-white font-sans">{selectedSpan.name}</h3>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Span ID: <span className="text-zinc-300">{selectedSpan.spanId}</span> • Parent: <span className="text-zinc-300">{selectedSpan.parentSpanId || 'ROOT'}</span>
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 border border-[#1E1E24] bg-[#08080A] p-2.5 rounded text-center">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-bold">LATENCY</span>
                    <span className="font-bold text-white mt-0.5 block">{selectedSpan.latencyMs} ms</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-bold">TOKENS</span>
                    <span className="font-bold text-white mt-0.5 block">{selectedSpan.tokens.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-bold">COST</span>
                    <span className="font-bold text-emerald-400 mt-0.5 block">{formatCurrency(selectedSpan.cost, currency)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between border-b border-[#1E1E24] pb-1">
                    <span className="text-[11px] text-zinc-400 font-bold uppercase">Raw Input Payload</span>
                    <button
                      onClick={() => copyPayload(selectedSpan.rawInput || '', 'input')}
                      className="flex items-center gap-1 text-[10px] text-blue-400 hover:underline"
                    >
                      {copiedInput ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedInput ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="rounded border border-[#1E1E24] bg-[#08080A] p-3 text-[11px] text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre-wrap max-h-40">
                    {selectedSpan.rawInput || '// No raw input recorded'}
                  </pre>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between border-b border-[#1E1E24] pb-1">
                    <span className="text-[11px] text-zinc-400 font-bold uppercase">Raw Output Payload</span>
                    <button
                      onClick={() => copyPayload(selectedSpan.rawOutput || '', 'output')}
                      className="flex items-center gap-1 text-[10px] text-blue-400 hover:underline"
                    >
                      {copiedOutput ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedOutput ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="rounded border border-[#1E1E24] bg-[#08080A] p-3 text-[11px] text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre-wrap max-h-40">
                    {selectedSpan.rawOutput || '// No raw output recorded'}
                  </pre>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-zinc-500 font-mono">
                Select any span from the left pane to inspect telemetry attributes and raw JSON payloads.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
