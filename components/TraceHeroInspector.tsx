'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PathData, SpanData, formatCurrency, CurrencyMode } from '@/lib/data';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Terminal,
  Sparkles,
  Lightbulb,
  Clock,
  Layers,
  GitBranch,
  BarChart3,
  Cpu
} from 'lucide-react';
import Link from 'next/link';
import { ReactFlow, Controls, Background, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomSpanNode } from './CustomNodes';

import {
  generateAutomaticInsights,
  generateOptimizationSuggestions,
  computeCostAttribution,
  computeCriticalPath
} from '@/lib/analytics';

const nodeTypes = {
  customSpan: CustomSpanNode,
};

interface TraceHeroInspectorProps {
  run: PathData;
}

export default function TraceHeroInspector({ run }: TraceHeroInspectorProps) {
  const [activeLeftView, setActiveLeftView] = useState<'graph' | 'timeline' | 'flame'>('timeline');
  const [activeRightTab, setActiveRightTab] = useState<'input' | 'output' | 'metadata' | 'raw'>('input');
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
  const [copiedPayload, setCopiedPayload] = useState(false);

  const totalDuration = useMemo(() => {
    return run.spans.reduce((acc, s) => acc + s.latencyMs, 0) || run.durationMs || 1;
  }, [run]);

  // Analytics Computation
  const slowestSpan = useMemo(() => {
    if (!run.spans || run.spans.length === 0) return null;
    return [...run.spans].sort((a, b) => b.latencyMs - a.latencyMs)[0];
  }, [run.spans]);

  const highestCostSpan = useMemo(() => {
    if (!run.spans || run.spans.length === 0) return null;
    return [...run.spans].sort((a, b) => b.cost - a.cost)[0];
  }, [run.spans]);

  const criticalSpanIds = useMemo(() => computeCriticalPath(run.spans), [run.spans]);
  const autoInsights = useMemo(() => generateAutomaticInsights(run), [run]);
  const costAttribution = useMemo(() => computeCostAttribution(run.spans, run.cost), [run]);
  const suggestions = useMemo(() => generateOptimizationSuggestions(run), [run]);

  // Compute child spans of selected span
  const childSpans = useMemo(() => {
    if (!selectedSpan) return [];
    return run.spans.filter(s => s.parentSpanId === selectedSpan.spanId);
  }, [run.spans, selectedSpan]);

  // Compute React Flow Nodes & Edges for Execution Graph
  const { nodes, edges } = useMemo(() => {
    if (!run.spans || run.spans.length === 0) return { nodes: [], edges: [] };

    const nodesList: Node[] = [];
    const edgesList: Edge[] = [];

    const depthMap: Record<string, number> = {};
    run.spans.forEach((span) => {
      depthMap[span.spanId] = span.parentSpanId ? (depthMap[span.parentSpanId] || 0) + 1 : 0;
    });

    const levelCounts: Record<number, number> = {};
    run.spans.forEach((span) => {
      const level = depthMap[span.spanId] || 0;
      const count = levelCounts[level] || 0;
      levelCounts[level] = count + 1;

      const isCritical = criticalSpanIds.has(span.spanId);

      nodesList.push({
        id: span.spanId,
        type: 'customSpan',
        position: { x: count * 280, y: level * 140 },
        data: { span, isCritical },
      });

      if (span.parentSpanId) {
        edgesList.push({
          id: `e-${span.parentSpanId}-${span.spanId}`,
          source: span.parentSpanId,
          target: span.spanId,
          animated: isCritical,
          style: {
            stroke: isCritical ? '#3B82F6' : '#27272A',
            strokeWidth: isCritical ? 2.5 : 1.5,
          },
        });
      }
    });

    return { nodes: nodesList, edges: edgesList };
  }, [run.spans, criticalSpanIds]);

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

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const isFailed = run.status.toUpperCase() === 'FAILED';

  return (
    <div className="w-full h-[calc(100vh-2.5rem)] bg-[#08080A] flex flex-col font-mono overflow-hidden">
      
      {/* 1. DevTools Run Summary Top Header Bar */}
      <div className="z-10 flex flex-wrap items-center justify-between border-b border-[#1E1E24] bg-[#08080A] px-4 py-2 text-xs shrink-0 font-mono">
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
            <span className="px-2 py-0.2 rounded border border-blue-500/40 bg-blue-500/10 text-blue-400 text-[10px] font-mono">
              {run.project || 'default'} • {run.env || 'production'}
            </span>
            {isFailed ? (
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

        {/* Telemetry Summary Metrics Header */}
        <div className="flex items-center gap-4 text-xs font-telemetry">
          <span>Duration: <strong className="text-white">{(run.durationMs / 1000).toFixed(1)}s</strong></span>
          <span className="text-zinc-700">•</span>
          <span>Cost: {run.cost > 0 ? (
            <strong className="text-emerald-400">{formatCurrency(run.cost, currency)}</strong>
          ) : (
            <span className="text-zinc-400 font-mono">— <span className="text-[10px] text-zinc-500 font-sans">(Pricing unavailable)</span></span>
          )}</span>
          <span className="text-zinc-700">•</span>
          <span>Total Tokens: <strong className="text-white">{run.tokens.toLocaleString()}</strong></span>
          <span className="text-zinc-700">•</span>
          <span>Model: <strong className="text-blue-400">{run.modelFamily}</strong></span>
          <span className="text-zinc-700">•</span>
          <span>Framework: <strong className="text-zinc-300">{run.agent?.framework || 'Custom'}</strong></span>

          <button onClick={exportTraceJson} className="linear-btn ml-2">
            <Download className="h-3 w-3" />
            Export Trace
          </button>
        </div>
      </div>

      {/* 2. Automatic Execution Insights & Diagnosis Panel */}
      <div className="bg-[#0D0D11] border-b border-[#1E1E24] px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shrink-0 font-sans">
        
        {/* Insights Alert List */}
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-2 font-mono font-bold text-[11px] uppercase tracking-wider text-amber-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>EXECUTION DIAGNOSIS & BOTTLENECK ANALYSIS</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {slowestSpan && (slowestSpan.latencyMs / (totalDuration || 1)) >= 0.35 ? (
              <div className="px-3 py-1 rounded border border-amber-500/50 bg-amber-950/40 text-amber-300 font-mono text-[11px] flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                <span>
                  <strong>⚠ Bottleneck detected:</strong> {slowestSpan.name} consumed {Math.round((slowestSpan.latencyMs / totalDuration) * 100)}% of total execution time ({slowestSpan.latencyMs < 1000 ? `${slowestSpan.latencyMs}ms` : `${(slowestSpan.latencyMs/1000).toFixed(1)}s`}).
                </span>
              </div>
            ) : (
              <div className="px-3 py-1 rounded border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 font-mono text-[11px] flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>
                  <strong>✓ No significant bottlenecks detected:</strong> Execution is evenly distributed across {run.spans.length} spans.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Performance Breakdown Table */}
        <div className="flex items-center gap-4 bg-[#14141A] border border-zinc-800 px-3.5 py-1.5 rounded font-mono text-[11px] shrink-0">
          <div>
            <span className="text-zinc-500 text-[10px] block">TOTAL TIME</span>
            <strong className="text-white">{(run.durationMs / 1000).toFixed(1)}s</strong>
          </div>
          <div className="border-l border-zinc-800 pl-3">
            <span className="text-zinc-500 text-[10px] block">LLM TIME</span>
            <strong className="text-blue-400">
              {run.spans ? (run.spans.filter(s => s.type === 'LLMCall').reduce((a, b) => a + b.latencyMs, 0) < 1000 ? `${run.spans.filter(s => s.type === 'LLMCall').reduce((a, b) => a + b.latencyMs, 0)}ms` : `${(run.spans.filter(s => s.type === 'LLMCall').reduce((a, b) => a + b.latencyMs, 0)/1000).toFixed(1)}s`) : '0s'}
            </strong>
          </div>
          <div className="border-l border-zinc-800 pl-3">
            <span className="text-zinc-500 text-[10px] block">TOOLS TIME</span>
            <strong className="text-amber-400">
              {run.spans ? (run.spans.filter(s => s.type !== 'LLMCall').reduce((a, b) => a + b.latencyMs, 0) < 1000 ? `${run.spans.filter(s => s.type !== 'LLMCall').reduce((a, b) => a + b.latencyMs, 0)}ms` : `${(run.spans.filter(s => s.type !== 'LLMCall').reduce((a, b) => a + b.latencyMs, 0)/1000).toFixed(1)}s`) : '0s'}
            </strong>
          </div>
          <div className="border-l border-zinc-800 pl-3">
            <span className="text-zinc-500 text-[10px] block">TOKENS</span>
            <strong className="text-emerald-400">{run.tokens.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* 3. DevTools Split-Screen Workspace (40% Left Pane / 60% Right Pane) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 divide-x divide-[#1E1E24] overflow-hidden">
        
        {/* LEFT PANE (40%) */}
        <div className="lg:col-span-5 flex flex-col h-full bg-[#08080A] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#1E1E24] bg-[#0F0F12] px-3 py-1.5 shrink-0 text-xs font-mono">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveLeftView('timeline')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                  activeLeftView === 'timeline'
                    ? 'bg-[#16161A] text-blue-400 border border-[#1E1E24]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Clock className="h-3 w-3 inline mr-1" />
                Timeline Waterfall
              </button>

              <button
                onClick={() => setActiveLeftView('graph')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                  activeLeftView === 'graph'
                    ? 'bg-[#16161A] text-blue-400 border border-[#1E1E24]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <GitBranch className="h-3 w-3 inline mr-1" />
                Execution Graph
              </button>

              <button
                onClick={() => setActiveLeftView('flame')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                  activeLeftView === 'flame'
                    ? 'bg-[#16161A] text-blue-400 border border-[#1E1E24]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <BarChart3 className="h-3 w-3 inline mr-1" />
                Flame Graph
              </button>
            </div>

            <span className="text-[10px] text-zinc-500">{run.spans.length} Spans</span>
          </div>

          {/* VIEW 1: Timeline Waterfall */}
          {activeLeftView === 'timeline' && (
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#1E1E24]/40 text-xs font-mono">
              {run.spans.map((span, idx) => {
                const isSelected = selectedSpan?.spanId === span.spanId;
                const isCritical = criticalSpanIds.has(span.spanId);
                const indent = span.parentSpanId ? 'ml-4' : 'ml-0';

                let cumulativeOffset = 0;
                for (let i = 0; i < idx; i++) {
                  cumulativeOffset += run.spans[i].latencyMs;
                }

                return (
                  <div
                    key={span.id}
                    onClick={() => setSelectedSpan(span)}
                    className={`group cursor-pointer py-2 px-2 rounded transition-colors flex items-center justify-between ${indent} ${
                      isSelected ? 'bg-[#121215] border border-blue-500/40 text-white font-bold' : 'hover:bg-[#0F0F12] text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-zinc-500 text-[10px] w-12 font-telemetry shrink-0">
                        {cumulativeOffset}ms
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
                          ⚡ BOTTLENECK
                        </span>
                      )}
                      <span className="font-bold text-white">{span.latencyMs}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: Interactive Execution Graph (DAG) */}
          {activeLeftView === 'graph' && (
            <div className="flex-1 bg-[#09090B] relative">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                className="bg-[#09090B]"
                onNodeClick={(_, node) => {
                  const targetSpan = run.spans.find(s => s.spanId === node.id);
                  if (targetSpan) setSelectedSpan(targetSpan);
                }}
              >
                <Background color="#1E1E24" gap={16} />
                <Controls className="!bg-[#0F0F12] !border-[#1E1E24] !text-white" />
              </ReactFlow>
            </div>
          )}

          {/* VIEW 3: Perfetto Visual Flame Graph */}
          {activeLeftView === 'flame' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs font-mono">
              <div className="text-[11px] font-bold text-zinc-500 uppercase border-b border-[#1E1E24] pb-1.5 flex justify-between">
                <span>Execution Duration Bars</span>
                <span>Total: {(totalDuration / 1000).toFixed(2)}s</span>
              </div>

              <div className="space-y-2">
                {run.spans.map((span, idx) => {
                  const durationPct = Math.max(5, Math.min(100, (span.latencyMs / totalDuration) * 100));
                  let cumulativeOffset = 0;
                  for (let i = 0; i < idx; i++) {
                    cumulativeOffset += run.spans[i].latencyMs;
                  }
                  const startPct = (cumulativeOffset / totalDuration) * 100;
                  const isSelected = selectedSpan?.spanId === span.spanId;
                  const isCritical = criticalSpanIds.has(span.spanId);

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
                              : isCritical
                              ? 'bg-blue-500'
                              : 'bg-blue-500/50'
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

        {/* RIGHT PANE (60%): SPAN INSPECTOR METADATA & PAYLOADS */}
        <div className="lg:col-span-7 flex flex-col h-full bg-[#0F0F12] overflow-hidden">
          
          {selectedSpan ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden divide-y divide-[#1E1E24]">
              
              {/* Detailed Span Header */}
              <div className="p-4 bg-[#09090C] space-y-3 shrink-0 font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                      {selectedSpan.type}
                    </span>
                    <h2 className="text-sm font-bold text-white font-sans">{selectedSpan.name}</h2>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${
                    selectedSpan.status === 'FAILED' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {selectedSpan.status}
                  </span>
                </div>

                {/* Granular Span Attributes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-[#0F0F12] p-2.5 rounded border border-[#1E1E24]">
                  <div>
                    <span className="text-zinc-500 text-[10px] block uppercase font-bold">SPAN ID</span>
                    <span className="text-white truncate block">{selectedSpan.spanId}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block uppercase font-bold">PARENT SPAN</span>
                    <span className="text-white truncate block">{selectedSpan.parentSpanId || 'ROOT'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block uppercase font-bold">DURATION</span>
                    <span className="text-white font-bold block">{selectedSpan.latencyMs} ms</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block uppercase font-bold">COST</span>
                    <span className="text-emerald-400 font-bold block">{formatCurrency(selectedSpan.cost, currency)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block uppercase font-bold">INPUT TOKENS</span>
                    <span className="text-zinc-300 block">{Math.round(selectedSpan.tokens * 0.35).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block uppercase font-bold">OUTPUT TOKENS</span>
                    <span className="text-zinc-300 block">{Math.round(selectedSpan.tokens * 0.65).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block uppercase font-bold">TOTAL TOKENS</span>
                    <span className="text-zinc-300 block">{selectedSpan.tokens.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block uppercase font-bold">CHILD SPANS</span>
                    <span className="text-blue-400 font-bold block">{childSpans.length} children</span>
                  </div>
                </div>

              </div>

              {/* Inspector Content Tabs (Input, Output, Metadata, Raw JSON) */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#1E1E24] bg-[#08080A] px-4 pt-2 shrink-0 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveRightTab('input')}
                      className={`pb-2 px-2 font-bold uppercase tracking-wider border-b-2 text-[11px] transition-all ${
                        activeRightTab === 'input' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      Input Payload
                    </button>
                    <button
                      onClick={() => setActiveRightTab('output')}
                      className={`pb-2 px-2 font-bold uppercase tracking-wider border-b-2 text-[11px] transition-all ${
                        activeRightTab === 'output' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      Execution Output
                    </button>
                    <button
                      onClick={() => setActiveRightTab('metadata')}
                      className={`pb-2 px-2 font-bold uppercase tracking-wider border-b-2 text-[11px] transition-all ${
                        activeRightTab === 'metadata' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      Metadata
                    </button>
                    <button
                      onClick={() => setActiveRightTab('raw')}
                      className={`pb-2 px-2 font-bold uppercase tracking-wider border-b-2 text-[11px] transition-all ${
                        activeRightTab === 'raw' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      Raw JSON
                    </button>
                  </div>

                  {/* 1-Click Copy Payload Button */}
                  <button
                    onClick={() => copyText(
                      activeRightTab === 'input'
                        ? selectedSpan.rawInput || ''
                        : activeRightTab === 'output'
                        ? selectedSpan.rawOutput || ''
                        : JSON.stringify(selectedSpan, null, 2)
                    )}
                    className="flex items-center gap-1 mb-2 text-[11px] text-zinc-400 hover:text-white bg-[#0F0F12] border border-[#1E1E24] px-2.5 py-0.5 rounded"
                  >
                    {copiedPayload ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedPayload ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {/* Payload Viewport */}
                <div className="flex-1 overflow-y-auto p-4 bg-[#08080A] font-mono text-xs text-zinc-300">
                  {activeRightTab === 'input' && (
                    <pre className="rounded border border-[#1E1E24] bg-[#0F0F12] p-4 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                      {selectedSpan.rawInput || '// No raw input payload recorded for this span'}
                    </pre>
                  )}

                  {activeRightTab === 'output' && (
                    <pre className="rounded border border-[#1E1E24] bg-[#0F0F12] p-4 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                      {selectedSpan.rawOutput || '// No execution output recorded for this span'}
                    </pre>
                  )}

                  {activeRightTab === 'metadata' && (
                    <div className="space-y-2">
                      <div className="border border-[#1E1E24] rounded bg-[#0F0F12] divide-y divide-[#1E1E24]">
                        <div className="p-2.5 flex justify-between">
                          <span className="text-zinc-500">span_type</span>
                          <span className="text-white font-bold">{selectedSpan.type}</span>
                        </div>
                        <div className="p-2.5 flex justify-between">
                          <span className="text-zinc-500">model_family</span>
                          <span className="text-white font-bold">{run.modelFamily}</span>
                        </div>
                        <div className="p-2.5 flex justify-between">
                          <span className="text-zinc-500">provider</span>
                          <span className="text-white font-bold">Anthropic / OpenAI</span>
                        </div>
                        <div className="p-2.5 flex justify-between">
                          <span className="text-zinc-500">otel_standard</span>
                          <span className="text-white font-bold">v1.28.0</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeRightTab === 'raw' && (
                    <pre className="rounded border border-[#1E1E24] bg-[#0F0F12] p-4 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                      {JSON.stringify(selectedSpan, null, 2)}
                    </pre>
                  )}
                </div>

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
  );
}
