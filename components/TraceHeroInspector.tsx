'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PathData, SpanData, formatCurrency, CurrencyMode } from '@/lib/data';
import { runDetections, Detection } from '@/lib/detections';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  Clock,
  GitBranch,
  BarChart3,
  Cpu,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Loader2,
  Bug,
  Zap,
  DollarSign,
  Layers,
  ArrowUpRight,
  FileText,
  Search,
  Shield,
  MessageSquare
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

interface InvestigationResult {
  id: string;
  rootCause: string;
  evidence: string[];
  impact: string;
  recommendation: string;
  confidence: number;
  observed: string[];
  inferred: string[];
  suggested: string[];
  detections: Array<{ type: string; severity: string; title: string; description: string; impact: string; recommendation: string }>;
  status: string;
}

export default function TraceHeroInspector({ run }: TraceHeroInspectorProps) {
  const [activeLeftView, setActiveLeftView] = useState<'timeline' | 'graph' | 'flame'>('timeline');
  const [activeRightTab, setActiveRightTab] = useState<'span' | 'trace' | 'detections' | 'investigation'>('span');
  const [activeSpanTab, setActiveSpanTab] = useState<'input' | 'output' | 'metadata' | 'raw'>('input');
  const [activeTraceTab, setActiveTraceTab] = useState<'input' | 'output' | 'error'>('input');
  const [currency, setCurrency] = useState<CurrencyMode>('USD');
  const [copiedPayload, setCopiedPayload] = useState(false);
  
  // Debugger state
  const [debuggerMode, setDebuggerMode] = useState(false);
  const [debuggerIndex, setDebuggerIndex] = useState(0);

  // Investigation state
  const [investigation, setInvestigation] = useState<InvestigationResult | null>(null);
  const [isInvestigating, setIsInvestigating] = useState(false);

  useEffect(() => {
    const updateCurrency = () => {
      const saved = localStorage.getItem('pathflow_currency') as CurrencyMode;
      if (saved === 'INR' || saved === 'USD') setCurrency(saved);
    };
    updateCurrency();
    window.addEventListener('storage', updateCurrency);
    return () => window.removeEventListener('storage', updateCurrency);
  }, []);

  const defaultSpan = useMemo(() => {
    return run.spans.find(s => s.status === 'FAILED') || run.spans[0] || null;
  }, [run.spans]);

  const [selectedSpan, setSelectedSpan] = useState<SpanData | null>(defaultSpan);

  const totalDuration = useMemo(() => {
    return run.spans.reduce((acc, s) => acc + s.latencyMs, 0) || run.durationMs || 1;
  }, [run]);

  // Analytics
  const slowestSpan = useMemo(() => {
    if (!run.spans || run.spans.length === 0) return null;
    return [...run.spans].sort((a, b) => b.latencyMs - a.latencyMs)[0];
  }, [run.spans]);

  const criticalSpanIds = useMemo(() => computeCriticalPath(run.spans), [run.spans]);
  const autoInsights = useMemo(() => generateAutomaticInsights(run), [run]);
  const suggestions = useMemo(() => generateOptimizationSuggestions(run), [run]);

  // Detections
  const detections = useMemo(() => runDetections(run), [run]);
  const criticalDetections = detections.filter(d => d.severity === 'CRITICAL' || d.severity === 'HIGH');

  // Child spans
  const childSpans = useMemo(() => {
    if (!selectedSpan) return [];
    return run.spans.filter(s => s.parentSpanId === selectedSpan.spanId);
  }, [run.spans, selectedSpan]);

  // LLM vs Tool time
  const llmTime = useMemo(() => run.spans.filter(s => s.type === 'llm' || s.type === 'LLMCall').reduce((a, b) => a + b.latencyMs, 0), [run.spans]);
  const toolTime = useMemo(() => run.spans.filter(s => s.type === 'tool' || s.type === 'WebSearch' || s.type === 'Browser' || s.type === 'CodeExec' || s.type === 'retrieval').reduce((a, b) => a + b.latencyMs, 0), [run.spans]);
  const failedSpanCount = useMemo(() => run.spans.filter(s => s.status === 'FAILED').length, [run.spans]);

  // React Flow graph
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
      const isBottleneck = slowestSpan?.spanId === span.spanId && (slowestSpan.latencyMs / totalDuration) >= 0.35;
      nodesList.push({
        id: span.spanId,
        type: 'customSpan',
        position: { x: count * 280, y: level * 140 },
        data: { span, isCritical, isBottleneck },
      });
      if (span.parentSpanId) {
        edgesList.push({
          id: `e-${span.parentSpanId}-${span.spanId}`,
          source: span.parentSpanId,
          target: span.spanId,
          animated: isCritical,
          style: { stroke: isCritical ? '#3B82F6' : '#27272A', strokeWidth: isCritical ? 2.5 : 1.5 },
        });
      }
    });
    return { nodes: nodesList, edges: edgesList };
  }, [run.spans, criticalSpanIds, slowestSpan, totalDuration]);

  // Debugger navigation
  const goToSpan = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(run.spans.length - 1, index));
    setDebuggerIndex(clamped);
    setSelectedSpan(run.spans[clamped]);
  }, [run.spans]);

  // AI Investigation
  const runInvestigation = useCallback(async () => {
    setIsInvestigating(true);
    setActiveRightTab('investigation');
    try {
      const res = await fetch('/api/v1/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: run.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setInvestigation(data.investigation);
      }
    } catch (err) {
      console.error('Investigation failed:', err);
    } finally {
      setIsInvestigating(false);
    }
  }, [run.id]);

  const exportTraceJson = () => {
    const tracePayload = {
      traceId: `pf_trace_${run.id}`,
      agent: run.agent,
      metrics: { latencySec: (run.durationMs / 1000).toFixed(2), costUsd: run.cost, tokens: run.tokens },
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
    <div className="w-full h-[calc(100vh-2.75rem)] bg-[#08080A] flex flex-col font-mono overflow-hidden">
      
      {/* 1. Summary Hero Bar */}
      <div className="z-10 border-b border-white/[0.07] bg-[#08080A] px-4 py-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/runs" className="flex items-center gap-1 rounded border border-white/[0.07] bg-[#121217] px-2 py-0.5 text-xs text-zinc-400 hover:text-white transition-colors shrink-0">
              <ArrowLeft className="h-3 w-3" /> Runs
            </Link>
            <span className="text-zinc-700 shrink-0">/</span>
            <h1 className="text-sm font-bold text-white font-sans truncate">{run.title}</h1>
            {isFailed ? (
              <span className="inline-flex items-center gap-1 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/10 shrink-0">
                <XCircle className="h-3 w-3" /> FAILED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 shrink-0">
                <CheckCircle2 className="h-3 w-3" /> SUCCESS
              </span>
            )}
            {run.version && (
              <span className="text-[10px] text-zinc-500 font-mono shrink-0">{run.version}</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* AI Investigate button */}
            <button
              onClick={runInvestigation}
              disabled={isInvestigating}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[11px] font-bold hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              {isInvestigating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {isInvestigating ? 'Analyzing...' : 'Investigate'}
            </button>

            {/* Debugger toggle */}
            <button
              onClick={() => { setDebuggerMode(!debuggerMode); if (!debuggerMode) goToSpan(0); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-bold transition-colors ${
                debuggerMode ? 'border-blue-500/40 bg-blue-500/10 text-blue-400' : 'border-white/[0.07] bg-[#121217] text-zinc-400 hover:text-white'
              }`}
            >
              <Bug className="h-3 w-3" />
              Debugger
            </button>

            <button onClick={exportTraceJson} className="flex items-center gap-1 px-2 py-1 rounded border border-white/[0.07] bg-[#121217] text-zinc-400 text-[11px] hover:text-white transition-colors">
              <Download className="h-3 w-3" /> Export
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="flex items-center gap-4 mt-2 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-zinc-500" />
            <span className="text-zinc-400">Duration:</span>
            <strong className="text-white">{(run.durationMs / 1000).toFixed(1)}s</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 text-zinc-500" />
            <span className="text-zinc-400">Cost:</span>
            <strong className="text-emerald-400">{run.cost > 0 ? formatCurrency(run.cost, currency) : '—'}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-zinc-500" />
            <span className="text-zinc-400">Tokens:</span>
            <strong className="text-white">{run.tokens.toLocaleString()}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="h-3 w-3 text-zinc-500" />
            <span className="text-zinc-400">Spans:</span>
            <strong className="text-white">{run.spans.length}</strong>
            {failedSpanCount > 0 && <span className="text-red-400">({failedSpanCount} failed)</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3 w-3 text-zinc-500" />
            <span className="text-zinc-400">Model:</span>
            <strong className="text-blue-400">{run.modelFamily}</strong>
          </div>
          {run.qualityScore != null && (
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3 text-zinc-500" />
              <span className="text-zinc-400">Quality:</span>
              <strong className={run.qualityScore >= 80 ? 'text-emerald-400' : run.qualityScore >= 60 ? 'text-amber-400' : 'text-red-400'}>
                {run.qualityScore}
              </strong>
            </div>
          )}
          {detections.length > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-amber-400" />
              <span className="text-amber-400 font-bold">{detections.length} detection{detections.length > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Time breakdown mini-bar */}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-blue-500/80" />
              <span className="text-[10px] text-zinc-500">LLM {llmTime < 1000 ? `${llmTime}ms` : `${(llmTime / 1000).toFixed(1)}s`}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-amber-500/80" />
              <span className="text-[10px] text-zinc-500">Tools {toolTime < 1000 ? `${toolTime}ms` : `${(toolTime / 1000).toFixed(1)}s`}</span>
            </div>
          </div>
        </div>

        {/* Error bar */}
        {run.error && (
          <div className="mt-2 px-3 py-1.5 rounded border border-red-500/30 bg-red-500/10 text-[11px] text-red-300 font-mono flex items-start gap-2">
            <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
            <div>
              {run.errorType && <span className="text-red-400 font-bold mr-1">[{run.errorType}]</span>}
              {run.error}
            </div>
          </div>
        )}
      </div>

      {/* Debugger Controls Bar */}
      {debuggerMode && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-blue-500/5 border-b border-blue-500/20 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <Bug className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-blue-400 font-bold font-mono uppercase text-[11px]">Debugger</span>
            <span className="text-zinc-400 font-mono text-[11px]">
              Step {debuggerIndex + 1} of {run.spans.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => goToSpan(0)}
              disabled={debuggerIndex === 0}
              className="px-2 py-0.5 rounded border border-white/[0.07] bg-[#121217] text-[10px] text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              ⏮ First
            </button>
            <button
              onClick={() => goToSpan(debuggerIndex - 1)}
              disabled={debuggerIndex === 0}
              className="px-2 py-0.5 rounded border border-white/[0.07] bg-[#121217] text-[10px] text-zinc-400 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-0.5"
            >
              <ChevronLeft className="h-3 w-3" /> Prev
            </button>
            <button
              onClick={() => goToSpan(debuggerIndex + 1)}
              disabled={debuggerIndex >= run.spans.length - 1}
              className="px-2 py-0.5 rounded border border-white/[0.07] bg-[#121217] text-[10px] text-zinc-400 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-0.5"
            >
              Next <ChevronRight className="h-3 w-3" />
            </button>
            <button
              onClick={() => goToSpan(run.spans.length - 1)}
              disabled={debuggerIndex >= run.spans.length - 1}
              className="px-2 py-0.5 rounded border border-white/[0.07] bg-[#121217] text-[10px] text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              Last ⏭
            </button>
            {/* Jump to first error */}
            {failedSpanCount > 0 && (
              <button
                onClick={() => { const idx = run.spans.findIndex(s => s.status === 'FAILED'); if (idx >= 0) goToSpan(idx); }}
                className="px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-[10px] text-red-400 font-bold hover:bg-red-500/20 transition-colors"
              >
                ⚡ Jump to Error
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Split-Screen Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 divide-x divide-white/[0.05] overflow-hidden">
        
        {/* LEFT PANE */}
        <div className="lg:col-span-5 flex flex-col h-full bg-[#08080A] overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#0F0F12] px-3 py-1.5 shrink-0 text-xs font-mono">
            <div className="flex items-center gap-1">
              {(['timeline', 'graph', 'flame'] as const).map((view) => {
                const icons = { timeline: Clock, graph: GitBranch, flame: BarChart3 };
                const labels = { timeline: 'Timeline', graph: 'Graph', flame: 'Flame' };
                const Icon = icons[view];
                return (
                  <button
                    key={view}
                    onClick={() => setActiveLeftView(view)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${
                      activeLeftView === view ? 'bg-white/[0.07] text-blue-400 border border-white/[0.1]' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Icon className="h-3 w-3" /> {labels[view]}
                  </button>
                );
              })}
            </div>
            <span className="text-[10px] text-zinc-500">{run.spans.length} spans</span>
          </div>

          {/* Timeline Waterfall */}
          {activeLeftView === 'timeline' && (
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs font-mono">
              {run.spans.map((span, idx) => {
                const isSelected = selectedSpan?.spanId === span.spanId;
                const isDebugCurrent = debuggerMode && debuggerIndex === idx;
                const isCritical = criticalSpanIds.has(span.spanId);
                const indent = span.parentSpanId ? 'ml-4' : 'ml-0';
                const pctOfTotal = Math.round((span.latencyMs / totalDuration) * 100);

                return (
                  <div
                    key={span.id || idx}
                    onClick={() => { setSelectedSpan(span); setActiveRightTab('span'); if (debuggerMode) setDebuggerIndex(idx); }}
                    className={`group cursor-pointer py-1.5 px-2 rounded transition-colors ${indent} ${
                      isDebugCurrent ? 'bg-blue-500/10 border border-blue-500/30 ring-1 ring-blue-500/20' :
                      isSelected ? 'bg-white/[0.04] border border-white/[0.1]' :
                      'hover:bg-white/[0.02] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          span.status === 'FAILED' ? 'bg-red-400' : isCritical ? 'bg-blue-400' : 'bg-emerald-400'
                        }`} />
                        <span className={`px-1 py-0.5 rounded text-[9px] uppercase font-bold shrink-0 ${
                          span.type === 'llm' || span.type === 'LLMCall' ? 'text-violet-400 bg-violet-500/10' :
                          span.type === 'tool' || span.type === 'WebSearch' || span.type === 'Browser' ? 'text-amber-400 bg-amber-500/10' :
                          span.type === 'retrieval' ? 'text-cyan-400 bg-cyan-500/10' :
                          'text-zinc-400 bg-zinc-500/10'
                        }`}>
                          {span.type}
                        </span>
                        <span className={`truncate text-[11px] ${isSelected || isDebugCurrent ? 'text-white font-semibold' : 'text-zinc-300'}`}>
                          {span.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-[10px]">
                        {span.status === 'FAILED' && <span className="text-red-400 font-bold">FAIL</span>}
                        {span.model && <span className="text-zinc-600 hidden sm:inline">{span.model}</span>}
                        <span className="text-zinc-400 font-mono w-14 text-right">
                          {span.latencyMs < 1000 ? `${span.latencyMs}ms` : `${(span.latencyMs / 1000).toFixed(1)}s`}
                        </span>
                      </div>
                    </div>
                    {/* Mini duration bar */}
                    <div className="mt-1 h-1 w-full bg-white/[0.03] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          span.status === 'FAILED' ? 'bg-red-500/60' :
                          isCritical ? 'bg-blue-500/60' : 'bg-white/[0.12]'
                        }`}
                        style={{ width: `${Math.max(2, pctOfTotal)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Execution Graph */}
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
                  if (targetSpan) { setSelectedSpan(targetSpan); setActiveRightTab('span'); }
                }}
              >
                <Background color="#1E1E24" gap={16} />
                <Controls className="!bg-[#0F0F12] !border-[#1E1E24] !text-white" />
              </ReactFlow>
            </div>
          )}

          {/* Flame Graph */}
          {activeLeftView === 'flame' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs font-mono">
              <div className="text-[10px] font-bold text-zinc-500 uppercase border-b border-white/[0.07] pb-1.5 flex justify-between">
                <span>Execution Duration</span>
                <span>Total: {(totalDuration / 1000).toFixed(2)}s</span>
              </div>
              {run.spans.map((span, idx) => {
                const durationPct = Math.max(3, Math.min(100, (span.latencyMs / totalDuration) * 100));
                const isSelected = selectedSpan?.spanId === span.spanId;
                const isCritical = criticalSpanIds.has(span.spanId);
                return (
                  <div
                    key={span.id || idx}
                    onClick={() => { setSelectedSpan(span); setActiveRightTab('span'); }}
                    className={`group cursor-pointer p-2 rounded border transition-colors ${
                      isSelected ? 'border-blue-500/40 bg-white/[0.04]' : 'border-white/[0.05] hover:border-white/[0.1]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${
                          span.type === 'llm' || span.type === 'LLMCall' ? 'text-violet-400' : 'text-amber-400'
                        }`}>[{span.type}]</span>
                        <span className="text-white truncate max-w-[160px]">{span.name}</span>
                      </div>
                      <span className="text-white font-bold">{span.latencyMs < 1000 ? `${span.latencyMs}ms` : `${(span.latencyMs / 1000).toFixed(1)}s`}</span>
                    </div>
                    <div className="w-full bg-white/[0.03] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          span.status === 'FAILED' ? 'bg-red-500' : isCritical ? 'bg-blue-500' : 'bg-blue-500/40'
                        }`}
                        style={{ width: `${durationPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT PANE */}
        <div className="lg:col-span-7 flex flex-col h-full bg-[#0F0F12] overflow-hidden">
          
          {/* Right pane tab bar */}
          <div className="flex items-center gap-1 border-b border-white/[0.07] bg-[#0C0C0F] px-3 py-1.5 shrink-0">
            {(['span', 'trace', 'detections', 'investigation'] as const).map((tab) => {
              const icons = { span: Layers, trace: FileText, detections: AlertTriangle, investigation: Sparkles };
              const labels = { span: 'Span Inspector', trace: 'Trace I/O', detections: `Detections (${detections.length})`, investigation: 'Investigation' };
              const Icon = icons[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveRightTab(tab)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                    activeRightTab === tab ? 'bg-white/[0.07] text-white border border-white/[0.1]' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icon className={`h-3 w-3 ${tab === 'detections' && detections.length > 0 ? 'text-amber-400' : ''}`} />
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* TAB: Span Inspector */}
          {activeRightTab === 'span' && selectedSpan && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Span header */}
              <div className="p-4 bg-[#09090C] space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedSpan.type === 'llm' || selectedSpan.type === 'LLMCall' ? 'text-violet-400 bg-violet-500/10 border border-violet-500/20' :
                      selectedSpan.type === 'tool' || selectedSpan.type === 'WebSearch' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' :
                      'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                    }`}>
                      {selectedSpan.type}
                    </span>
                    <h2 className="text-sm font-bold text-white font-sans">{selectedSpan.name}</h2>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                    selectedSpan.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {selectedSpan.status}
                  </span>
                </div>

                {/* Span metrics grid */}
                <div className="grid grid-cols-4 gap-2 text-[11px] bg-[#0F0F12] p-2.5 rounded border border-white/[0.07]">
                  <div>
                    <span className="text-zinc-500 text-[9px] block uppercase font-bold">Duration</span>
                    <span className="text-white font-bold">{selectedSpan.latencyMs < 1000 ? `${selectedSpan.latencyMs}ms` : `${(selectedSpan.latencyMs / 1000).toFixed(1)}s`}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[9px] block uppercase font-bold">Cost</span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(selectedSpan.cost, currency)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[9px] block uppercase font-bold">Tokens</span>
                    <span className="text-white">{selectedSpan.tokens.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[9px] block uppercase font-bold">Children</span>
                    <span className="text-blue-400 font-bold">{childSpans.length}</span>
                  </div>
                  {selectedSpan.model && (
                    <div>
                      <span className="text-zinc-500 text-[9px] block uppercase font-bold">Model</span>
                      <span className="text-violet-400">{selectedSpan.model}</span>
                    </div>
                  )}
                  {selectedSpan.provider && (
                    <div>
                      <span className="text-zinc-500 text-[9px] block uppercase font-bold">Provider</span>
                      <span className="text-zinc-300">{selectedSpan.provider}</span>
                    </div>
                  )}
                  {(selectedSpan.inputTokens || 0) > 0 && (
                    <div>
                      <span className="text-zinc-500 text-[9px] block uppercase font-bold">Input Tok</span>
                      <span className="text-zinc-300">{selectedSpan.inputTokens?.toLocaleString()}</span>
                    </div>
                  )}
                  {(selectedSpan.outputTokens || 0) > 0 && (
                    <div>
                      <span className="text-zinc-500 text-[9px] block uppercase font-bold">Output Tok</span>
                      <span className="text-zinc-300">{selectedSpan.outputTokens?.toLocaleString()}</span>
                    </div>
                  )}
                  {(selectedSpan.retryCount || 0) > 0 && (
                    <div>
                      <span className="text-zinc-500 text-[9px] block uppercase font-bold">Retries</span>
                      <span className="text-amber-400 font-bold">{selectedSpan.retryCount}</span>
                    </div>
                  )}
                </div>

                {/* Error info */}
                {selectedSpan.errorMessage && (
                  <div className="px-3 py-2 rounded border border-red-500/30 bg-red-500/5 text-[11px] text-red-300 font-mono">
                    {selectedSpan.errorType && <span className="text-red-400 font-bold">[{selectedSpan.errorType}] </span>}
                    {selectedSpan.errorMessage}
                  </div>
                )}
                {selectedSpan.diagnosticSummary && !selectedSpan.errorMessage && (
                  <div className="px-3 py-2 rounded border border-amber-500/30 bg-amber-500/5 text-[11px] text-amber-300 font-mono">
                    {selectedSpan.diagnosticTag && <span className="text-amber-400 font-bold">[{selectedSpan.diagnosticTag}] </span>}
                    {selectedSpan.diagnosticSummary}
                  </div>
                )}
              </div>

              {/* Span content tabs */}
              <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#08080A] px-4 pt-1.5 shrink-0">
                <div className="flex items-center gap-1">
                  {(['input', 'output', 'metadata', 'raw'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveSpanTab(tab)}
                      className={`pb-1.5 px-2 font-bold uppercase tracking-wider border-b-2 text-[10px] transition-all ${
                        activeSpanTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-500 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => copyText(activeSpanTab === 'input' ? selectedSpan.rawInput || '' : activeSpanTab === 'output' ? selectedSpan.rawOutput || '' : JSON.stringify(selectedSpan, null, 2))}
                  className="flex items-center gap-1 mb-1.5 text-[10px] text-zinc-400 hover:text-white bg-[#0F0F12] border border-white/[0.07] px-2 py-0.5 rounded"
                >
                  {copiedPayload ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copiedPayload ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-[#08080A]">
                {activeSpanTab === 'input' && (
                  <pre className="rounded border border-white/[0.07] bg-[#0F0F12] p-4 text-xs text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {selectedSpan.rawInput || '// No input payload recorded'}
                  </pre>
                )}
                {activeSpanTab === 'output' && (
                  <pre className="rounded border border-white/[0.07] bg-[#0F0F12] p-4 text-xs text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {selectedSpan.rawOutput || '// No output recorded'}
                  </pre>
                )}
                {activeSpanTab === 'metadata' && (
                  <div className="border border-white/[0.07] rounded bg-[#0F0F12] divide-y divide-white/[0.05]">
                    {[
                      ['span_id', selectedSpan.spanId],
                      ['parent_span_id', selectedSpan.parentSpanId || 'ROOT'],
                      ['type', selectedSpan.type],
                      ['status', selectedSpan.status],
                      ['model', selectedSpan.model || '—'],
                      ['provider', selectedSpan.provider || '—'],
                      ['latency_ms', `${selectedSpan.latencyMs}`],
                      ['tokens', `${selectedSpan.tokens}`],
                      ['input_tokens', `${selectedSpan.inputTokens || 0}`],
                      ['output_tokens', `${selectedSpan.outputTokens || 0}`],
                      ['cost_usd', `${selectedSpan.cost}`],
                      ['retry_count', `${selectedSpan.retryCount || 0}`],
                    ].map(([key, val]) => (
                      <div key={key} className="p-2.5 flex justify-between text-[11px]">
                        <span className="text-zinc-500">{key}</span>
                        <span className="text-white font-bold">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeSpanTab === 'raw' && (
                  <pre className="rounded border border-white/[0.07] bg-[#0F0F12] p-4 text-xs text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(selectedSpan, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {activeRightTab === 'span' && !selectedSpan && (
            <div className="flex-1 flex items-center justify-center text-center text-xs text-zinc-500">
              Select a span from the left pane to inspect.
            </div>
          )}

          {/* TAB: Trace I/O */}
          {activeRightTab === 'trace' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-1 border-b border-white/[0.07] bg-[#08080A] px-4 pt-1.5 shrink-0">
                {(['input', 'output', 'error'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTraceTab(tab)}
                    className={`pb-1.5 px-2 font-bold uppercase tracking-wider border-b-2 text-[10px] transition-all ${
                      activeTraceTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-500 hover:text-white'
                    }`}
                  >
                    {tab === 'error' ? `Error ${run.error ? '⚠' : ''}` : `Trace ${tab}`}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-[#08080A]">
                {activeTraceTab === 'input' && (
                  <pre className="rounded border border-white/[0.07] bg-[#0F0F12] p-4 text-xs text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {run.input || '// No trace-level input recorded'}
                  </pre>
                )}
                {activeTraceTab === 'output' && (
                  <pre className="rounded border border-white/[0.07] bg-[#0F0F12] p-4 text-xs text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {run.output || '// No trace-level output recorded'}
                  </pre>
                )}
                {activeTraceTab === 'error' && (
                  <div className="space-y-3">
                    {run.error ? (
                      <div className="rounded border border-red-500/30 bg-red-500/5 p-4 text-xs text-red-300 font-mono leading-relaxed">
                        {run.errorType && <div className="text-red-400 font-bold mb-1">[{run.errorType}]</div>}
                        {run.error}
                      </div>
                    ) : (
                      <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-300 text-center">
                        <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-emerald-400" />
                        No errors — run completed successfully.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Detections */}
          {activeRightTab === 'detections' && (
            <div className="flex-1 overflow-y-auto p-4 bg-[#08080A] space-y-2">
              {detections.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">No issues detected in this trace.</p>
                </div>
              ) : (
                detections.map((d, i) => {
                  const severityColor = d.severity === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5' :
                    d.severity === 'HIGH' ? 'border-amber-500/30 bg-amber-500/5' :
                    d.severity === 'MEDIUM' ? 'border-yellow-500/30 bg-yellow-500/5' :
                    'border-zinc-500/20 bg-zinc-500/5';
                  const sevTextColor = d.severity === 'CRITICAL' ? 'text-red-400' :
                    d.severity === 'HIGH' ? 'text-amber-400' :
                    d.severity === 'MEDIUM' ? 'text-yellow-400' : 'text-zinc-400';
                  return (
                    <div key={i} className={`rounded border p-3 space-y-2 ${severityColor}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded border uppercase ${sevTextColor}`}>{d.severity}</span>
                          <span className="text-[10px] text-zinc-500 font-mono uppercase">{d.type.replace(/_/g, ' ')}</span>
                        </div>
                        {d.spanName && (
                          <button
                            onClick={() => { const s = run.spans.find(sp => sp.spanId === d.spanId); if (s) { setSelectedSpan(s); setActiveRightTab('span'); } }}
                            className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                          >
                            {d.spanName} <ArrowUpRight className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-white font-semibold font-sans">{d.title}</p>
                      <p className="text-[11px] text-zinc-400 font-sans">{d.description}</p>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase font-bold block">Impact</span>
                          <span className="text-[11px] text-amber-300/80 font-mono">{d.impact}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase font-bold block">Fix</span>
                          <span className="text-[11px] text-emerald-300/80 font-mono">{d.recommendation}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB: Investigation */}
          {activeRightTab === 'investigation' && (
            <div className="flex-1 overflow-y-auto p-4 bg-[#08080A] space-y-3">
              {isInvestigating ? (
                <div className="text-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-400 mx-auto mb-3" />
                  <p className="text-xs text-zinc-400">Running trace analysis...</p>
                  <p className="text-[10px] text-zinc-600 mt-1">Analyzing {run.spans.length} spans, {detections.length} detections</p>
                </div>
              ) : investigation ? (
                <>
                  {/* Confidence */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <h3 className="text-xs font-bold text-white font-sans uppercase">Root Cause Analysis</h3>
                    </div>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                      investigation.confidence >= 80 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                      investigation.confidence >= 60 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                      'text-zinc-400 border-zinc-500/30 bg-zinc-500/10'
                    }`}>
                      {investigation.confidence}% confidence
                    </span>
                  </div>

                  {/* Root Cause */}
                  <div className="rounded border border-white/[0.07] bg-[#121217] p-3">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Root Cause</span>
                    <p className="text-xs text-white font-sans leading-relaxed">{investigation.rootCause}</p>
                  </div>

                  {/* Evidence */}
                  {investigation.evidence.length > 0 && (
                    <div className="rounded border border-white/[0.07] bg-[#121217] p-3">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold block mb-1.5">Evidence</span>
                      <div className="space-y-1">
                        {investigation.evidence.map((e, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-300 font-mono">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>{e}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observed / Inferred / Suggested */}
                  <div className="grid grid-cols-1 gap-2">
                    {investigation.inferred.length > 0 && (
                      <div className="rounded border border-amber-500/20 bg-amber-500/5 p-3">
                        <span className="text-[9px] text-amber-400 uppercase font-bold block mb-1">Inferred</span>
                        {investigation.inferred.map((item, i) => (
                          <p key={i} className="text-[11px] text-amber-200/80 font-mono">{item}</p>
                        ))}
                      </div>
                    )}
                    {investigation.suggested.length > 0 && (
                      <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <span className="text-[9px] text-emerald-400 uppercase font-bold block mb-1">Suggested Actions</span>
                        {investigation.suggested.map((item, i) => (
                          <p key={i} className="text-[11px] text-emerald-200/80 font-mono">{item}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Impact + Recommendation */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded border border-white/[0.07] bg-[#121217] p-3">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Impact</span>
                      <p className="text-[11px] text-zinc-300 font-mono">{investigation.impact}</p>
                    </div>
                    <div className="rounded border border-white/[0.07] bg-[#121217] p-3">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Recommendation</span>
                      <p className="text-[11px] text-zinc-300 font-mono">{investigation.recommendation}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <Sparkles className="h-6 w-6 text-zinc-600 mx-auto mb-3" />
                  <p className="text-xs text-zinc-400 font-sans">Click <strong>"Investigate"</strong> to run AI root cause analysis.</p>
                  <p className="text-[10px] text-zinc-600 mt-1">Analyzes spans, detections, errors, and execution patterns.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
