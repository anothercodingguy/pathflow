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
  ScanSearch,
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
  MessageSquare,
  Share2,
  ThumbsUp,
  ThumbsDown
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
import LoadingState from '@/components/ui/LoadingState';
import ThinkingState from '@/components/ui/ThinkingState';
import RecommendationCard from '@/components/ui/RecommendationCard';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DemoBadge, InlineError } from '@/components/ui/States';
import { useToast } from '@/components/ui/AnimatedToastStack';
import { isDemoRun } from '@/lib/demo';

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
  const [activeRightTab, setActiveRightTab] = useState<'span' | 'trace' | 'detections' | 'investigation' | 'evals'>('span');
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
  const [investigationError, setInvestigationError] = useState<string | null>(null);
  const { toast } = useToast();

  // Share Trace state
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Evals state
  const [evalData, setEvalData] = useState<{
    score: number;
    thumbs: 'UP' | 'DOWN' | null;
    hallucinationScore: number;
    faithfulnessScore: number;
    notes: string;
  }>({
    score: 85,
    thumbs: 'UP',
    hallucinationScore: 5,
    faithfulnessScore: 95,
    notes: '',
  });
  const [isSavingEval, setIsSavingEval] = useState(false);
  const [evalSavedMsg, setEvalSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadEval() {
      try {
        const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
        const res = await fetch(`${apiBase}/api/v1/evals?runId=${run.id}`);
        const data = await res.json();
        if (res.ok && data.success && data.evaluation) {
          setEvalData({
            score: data.evaluation.score ?? 85,
            thumbs: data.evaluation.thumbs ?? 'UP',
            hallucinationScore: data.evaluation.hallucinationScore ?? 5,
            faithfulnessScore: data.evaluation.faithfulnessScore ?? 95,
            notes: data.evaluation.notes ?? '',
          });
        }
      } catch (err) {
        // A saved evaluation is optional; the form simply starts from its defaults.
        console.warn('Could not load a saved evaluation for this run:', err);
      }
    }
    loadEval();
  }, [run.id]);

  const handleShareTrace = async () => {
    setIsSharing(true);
    try {
      const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
      const res = await fetch(`${apiBase}/api/paths/${run.id}/share`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success && data.shareUrl) {
        setShareUrl(data.shareUrl);
        navigator.clipboard.writeText(data.shareUrl);
        setCopiedShareLink(true);
        setTimeout(() => setCopiedShareLink(false), 3000);
        toast({ type: 'success', title: 'Share link copied', description: data.shareUrl });
      } else {
        toast({
          type: 'error',
          title: 'Could not create a share link',
          description: res.status === 401 ? 'Sign in with an account to share runs.' : data.error || `The server answered with HTTP ${res.status}.`,
        });
      }
    } catch {
      toast({ type: 'error', title: 'Could not create a share link', description: 'The request failed. Check your connection and try again.' });
    } finally {
      setIsSharing(false);
    }
  };

  const handleSaveEval = async () => {
    setIsSavingEval(true);
    try {
      const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
      const res = await fetch(`${apiBase}/api/v1/evals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: run.id,
          ...evalData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEvalSavedMsg('Evaluation saved.');
        setTimeout(() => setEvalSavedMsg(null), 3000);
      } else {
        toast({
          type: 'error',
          title: 'Evaluation was not saved',
          description: res.status === 401 ? 'Sign in with an account to save evaluations.' : data.error || `The server answered with HTTP ${res.status}.`,
        });
      }
    } catch {
      toast({ type: 'error', title: 'Evaluation was not saved', description: 'The request failed. Check your connection and try again.' });
    } finally {
      setIsSavingEval(false);
    }
  };

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
          style: { stroke: isCritical ? 'rgb(var(--accent))' : 'rgb(var(--line-strong))', strokeWidth: isCritical ? 2.5 : 1.5 },
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

  // Root-cause investigation. This is rule-based (see app/api/v1/investigations):
  // it applies fixed rules to the spans and detections. No LLM is called.
  const runInvestigation = useCallback(async () => {
    setIsInvestigating(true);
    setInvestigationError(null);
    setActiveRightTab('investigation');
    try {
      const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
      const res = await fetch(`${apiBase}/api/v1/investigations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: run.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setInvestigation(data.investigation);
      } else {
        setInvestigationError(
          res.status === 401
            ? 'Investigations need a signed-in account. The demo workspace cannot run one.'
            : `The investigation request failed (HTTP ${res.status}).`
        );
      }
    } catch (err) {
      console.error('Investigation failed:', err);
      setInvestigationError('The investigation request failed. Check your connection and try again.');
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
    // Below `lg` the two panes stack and the page scrolls normally. From `lg` up
    // it is a fixed-height workspace where each pane scrolls on its own.
    <div className="w-full min-h-[calc(100dvh-2.75rem)] lg:h-[calc(100dvh-2.75rem)] bg-canvas flex flex-col font-mono lg:overflow-hidden">
      
      {/* 1. Summary Hero Bar */}
      <div className="z-10 border-b border-line bg-canvas px-3 sm:px-4 py-2.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
            <ButtonLink href="/runs" size="sm" className="shrink-0">
              <ArrowLeft aria-hidden /> Runs
            </ButtonLink>
            <h1 className="min-w-0 max-w-full truncate text-sm font-semibold text-ink font-sans">{run.title}</h1>
            {isFailed ? (
              <Badge tone="bad"><XCircle className="size-3" aria-hidden /> FAILED</Badge>
            ) : (
              <Badge tone="ok"><CheckCircle2 className="size-3" aria-hidden /> SUCCESS</Badge>
            )}
            {isDemoRun(run) && <DemoBadge />}
            {run.version && (
              <span className="text-2xs text-ink-3 font-mono shrink-0">{run.version}</span>
            )}
          </div>

          {/* Actions wrap onto their own row on narrow screens instead of overlapping the title */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              onClick={runInvestigation}
              disabled={isInvestigating}
              className="border-warn/30 bg-warn/10 font-semibold text-warn hover:border-warn/40 hover:bg-warn/20 hover:text-warn"
            >
              {isInvestigating ? <Loader2 className="animate-spin" aria-hidden /> : <ScanSearch aria-hidden />}
              {isInvestigating ? 'Investigating…' : 'Investigate'}
            </Button>

            <Button
              size="sm"
              aria-pressed={debuggerMode}
              onClick={() => { setDebuggerMode(!debuggerMode); if (!debuggerMode) goToSpan(0); }}
              className={debuggerMode ? 'border-accent/40 bg-accent/10 text-accent-ink hover:bg-accent/15 hover:text-accent-ink' : ''}
            >
              <Bug aria-hidden />
              Debugger
            </Button>

            <Button size="sm" onClick={handleShareTrace} disabled={isSharing}>
              {copiedShareLink ? <Check className="text-ok" aria-hidden /> : <Share2 aria-hidden />}
              {copiedShareLink ? 'Link copied' : isSharing ? 'Sharing…' : 'Share'}
            </Button>

            <Button size="sm" onClick={exportTraceJson}>
              <Download aria-hidden /> Export
            </Button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-2xs font-mono">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-ink-3" />
            <span className="text-ink-2">Duration:</span>
            <strong className="text-ink">{(run.durationMs / 1000).toFixed(1)}s</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 text-ink-3" />
            <span className="text-ink-2">Cost:</span>
            <strong className="text-ok">{run.cost > 0 ? formatCurrency(run.cost, currency) : '—'}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-ink-3" />
            <span className="text-ink-2">Tokens:</span>
            <strong className="text-ink">{run.tokens.toLocaleString()}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="h-3 w-3 text-ink-3" />
            <span className="text-ink-2">Spans:</span>
            <strong className="text-ink">{run.spans.length}</strong>
            {failedSpanCount > 0 && <span className="text-bad">({failedSpanCount} failed)</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3 w-3 text-ink-3" />
            <span className="text-ink-2">Model:</span>
            <strong className="text-accent-ink">{run.modelFamily}</strong>
          </div>
          {run.qualityScore != null && (
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3 text-ink-3" />
              <span className="text-ink-2">Quality:</span>
              <strong className={run.qualityScore >= 80 ? 'text-ok' : run.qualityScore >= 60 ? 'text-warn' : 'text-bad'}>
                {run.qualityScore}
              </strong>
            </div>
          )}
          {detections.length > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-warn" />
              <span className="text-warn font-bold">{detections.length} detection{detections.length > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Time breakdown mini-bar */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-blue-500/80" />
              <span className="text-2xs text-ink-3">LLM {llmTime < 1000 ? `${llmTime}ms` : `${(llmTime / 1000).toFixed(1)}s`}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-amber-500/80" />
              <span className="text-2xs text-ink-3">Tools {toolTime < 1000 ? `${toolTime}ms` : `${(toolTime / 1000).toFixed(1)}s`}</span>
            </div>
          </div>
        </div>

        {/* Error bar */}
        {run.error && (
          <div role="alert" className="mt-2 px-3 py-1.5 rounded border border-red-500/30 bg-red-500/10 text-2xs text-bad font-mono flex items-start gap-2 break-words">
            <XCircle className="h-3.5 w-3.5 text-bad shrink-0 mt-0.5" />
            <div className="min-w-0">
              {run.errorType && <span className="text-bad font-bold mr-1">[{run.errorType}]</span>}
              {run.error}
            </div>
          </div>
        )}
      </div>

      {/* Debugger Controls Bar */}
      {debuggerMode && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-1.5 bg-blue-500/5 border-b border-blue-500/20 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <Bug className="h-3.5 w-3.5 text-accent-ink" />
            <span className="text-accent-ink font-bold font-mono uppercase text-2xs">Debugger</span>
            <span className="text-ink-2 font-mono text-2xs">
              Step {debuggerIndex + 1} of {run.spans.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => goToSpan(0)}
              disabled={debuggerIndex === 0}
              className="px-2 py-0.5 rounded border border-line bg-surface text-2xs text-ink-2 hover:text-ink disabled:opacity-40 transition-colors"
            >
              <span aria-hidden>⏮ </span>First
            </button>
            <button
              onClick={() => goToSpan(debuggerIndex - 1)}
              disabled={debuggerIndex === 0}
              className="px-2 py-0.5 rounded border border-line bg-surface text-2xs text-ink-2 hover:text-ink disabled:opacity-40 transition-colors flex items-center gap-0.5"
            >
              <ChevronLeft className="h-3 w-3" aria-hidden /> Prev
            </button>
            <button
              onClick={() => goToSpan(debuggerIndex + 1)}
              disabled={debuggerIndex >= run.spans.length - 1}
              className="px-2 py-0.5 rounded border border-line bg-surface text-2xs text-ink-2 hover:text-ink disabled:opacity-40 transition-colors flex items-center gap-0.5"
            >
              Next <ChevronRight className="h-3 w-3" aria-hidden />
            </button>
            <button
              onClick={() => goToSpan(run.spans.length - 1)}
              disabled={debuggerIndex >= run.spans.length - 1}
              className="px-2 py-0.5 rounded border border-line bg-surface text-2xs text-ink-2 hover:text-ink disabled:opacity-40 transition-colors"
            >
              Last<span aria-hidden> ⏭</span>
            </button>
            {/* Jump to first error */}
            {failedSpanCount > 0 && (
              <button
                onClick={() => { const idx = run.spans.findIndex(s => s.status === 'FAILED'); if (idx >= 0) goToSpan(idx); }}
                className="px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-2xs text-bad font-bold hover:bg-red-500/20 transition-colors"
              >
                Jump to Error
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Split-Screen Workspace */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 lg:divide-x divide-line lg:overflow-hidden">
        
        {/* LEFT PANE */}
        <div className="lg:col-span-5 flex flex-col min-w-0 lg:h-full lg:min-h-0 bg-canvas lg:overflow-hidden border-b border-line lg:border-b-0">
          <div className="flex items-center justify-between border-b border-line bg-surface px-3 py-1.5 shrink-0 text-xs font-mono">
            <div className="flex items-center gap-1" role="tablist" aria-label="Trace view">
              {(['timeline', 'graph', 'flame'] as const).map((view) => {
                const icons = { timeline: Clock, graph: GitBranch, flame: BarChart3 };
                const labels = { timeline: 'Timeline', graph: 'Graph', flame: 'Flame' };
                const Icon = icons[view];
                return (
                  <button
                    key={view}
                    type="button"
                    role="tab"
                    aria-selected={activeLeftView === view}
                    onClick={() => setActiveLeftView(view)}
                    className={`px-2 py-0.5 rounded text-2xs font-bold transition-all flex items-center gap-1 ${
                      activeLeftView === view ? 'bg-tint/[0.07] text-accent-ink border border-line' : 'text-ink-2 hover:text-ink'
                    }`}
                  >
                    <Icon className="h-3 w-3" aria-hidden /> {labels[view]}
                  </button>
                );
              })}
            </div>
            <span className="text-2xs text-ink-3">{run.spans.length} spans</span>
          </div>

          {/* Timeline Waterfall */}
          {activeLeftView === 'timeline' && (
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs font-mono max-h-[50dvh] lg:max-h-none">
              {run.spans.map((span, idx) => {
                const isSelected = selectedSpan?.spanId === span.spanId;
                const isDebugCurrent = debuggerMode && debuggerIndex === idx;
                const isCritical = criticalSpanIds.has(span.spanId);
                const indent = span.parentSpanId ? 'ml-4 w-[calc(100%-1rem)]' : 'ml-0 w-full';
                const pctOfTotal = Math.round((span.latencyMs / totalDuration) * 100);

                return (
                  <button
                    type="button"
                    key={span.id || idx}
                    aria-pressed={isSelected}
                    onClick={() => { setSelectedSpan(span); setActiveRightTab('span'); if (debuggerMode) setDebuggerIndex(idx); }}
                    className={`group block text-left py-1.5 px-2 rounded transition-colors ${indent} ${
                      isDebugCurrent ? 'bg-blue-500/10 border border-blue-500/30 ring-1 ring-blue-500/20' :
                      isSelected ? 'bg-tint/[0.04] border border-line' :
                      'hover:bg-tint/[0.02] border border-transparent'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        <span aria-hidden className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          span.status === 'FAILED' ? 'bg-red-400' : isCritical ? 'bg-blue-400' : 'bg-emerald-400'
                        }`} />
                        <span className={`px-1 py-0.5 rounded text-2xs uppercase font-bold shrink-0 ${
                          span.type === 'llm' || span.type === 'LLMCall' ? 'text-violet bg-violet-500/10' :
                          span.type === 'tool' || span.type === 'WebSearch' || span.type === 'Browser' ? 'text-warn bg-amber-500/10' :
                          span.type === 'retrieval' ? 'text-cyan-700 dark:text-cyan-400 bg-cyan-500/10' :
                          'text-ink-2 bg-tint/[0.06]'
                        }`}>
                          {span.type}
                        </span>
                        <span className={`truncate text-2xs ${isSelected || isDebugCurrent ? 'text-ink font-semibold' : 'text-ink-2'}`}>
                          {span.name}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0 text-2xs">
                        {span.status === 'FAILED' && <span className="text-bad font-bold">FAIL</span>}
                        {span.model && <span className="text-ink-3 hidden sm:inline">{span.model}</span>}
                        <span className="text-ink-2 font-mono w-14 text-right">
                          {span.latencyMs < 1000 ? `${span.latencyMs}ms` : `${(span.latencyMs / 1000).toFixed(1)}s`}
                        </span>
                      </span>
                    </span>
                    {/* Mini duration bar */}
                    <span aria-hidden className="mt-1 block h-1 w-full bg-tint/[0.06] rounded-full overflow-hidden">
                      <span
                        className={`block h-full rounded-full ${
                          span.status === 'FAILED' ? 'bg-red-500/70' :
                          isCritical ? 'bg-blue-500/70' : 'bg-tint/20'
                        }`}
                        style={{ width: `${Math.max(2, pctOfTotal)}%` }}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Execution Graph */}
          {activeLeftView === 'graph' && (
            <div className="h-[55dvh] lg:h-auto lg:flex-1 bg-canvas relative">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                className="bg-canvas"
                onNodeClick={(_, node) => {
                  const targetSpan = run.spans.find(s => s.spanId === node.id);
                  if (targetSpan) { setSelectedSpan(targetSpan); setActiveRightTab('span'); }
                }}
              >
                {/* Colours come from the design tokens in globals.css (.react-flow rules) */}
                <Background gap={16} />
                <Controls />
              </ReactFlow>
            </div>
          )}

          {/* Flame Graph */}
          {activeLeftView === 'flame' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs font-mono max-h-[50dvh] lg:max-h-none">
              <div className="text-2xs font-bold text-ink-3 uppercase border-b border-line pb-1.5 flex justify-between">
                <span>Execution Duration</span>
                <span>Total: {(totalDuration / 1000).toFixed(2)}s</span>
              </div>
              {run.spans.map((span, idx) => {
                const durationPct = Math.max(3, Math.min(100, (span.latencyMs / totalDuration) * 100));
                const isSelected = selectedSpan?.spanId === span.spanId;
                const isCritical = criticalSpanIds.has(span.spanId);
                return (
                  <button
                    type="button"
                    key={span.id || idx}
                    aria-pressed={isSelected}
                    onClick={() => { setSelectedSpan(span); setActiveRightTab('span'); }}
                    className={`group block w-full text-left p-2 rounded border transition-colors ${
                      isSelected ? 'border-accent/50 bg-tint/[0.04]' : 'border-line hover:border-line-strong'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2 text-2xs mb-1">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className={`font-bold ${
                          span.type === 'llm' || span.type === 'LLMCall' ? 'text-violet' : 'text-warn'
                        }`}>[{span.type}]</span>
                        <span className="text-ink truncate">{span.name}</span>
                      </span>
                      <span className="shrink-0 text-ink font-bold">{span.latencyMs < 1000 ? `${span.latencyMs}ms` : `${(span.latencyMs / 1000).toFixed(1)}s`}</span>
                    </span>
                    <span aria-hidden className="block w-full bg-tint/[0.06] rounded-full h-2 overflow-hidden">
                      <span
                        className={`block h-full rounded-full ${
                          span.status === 'FAILED' ? 'bg-red-500' : isCritical ? 'bg-blue-500' : 'bg-blue-500/40'
                        }`}
                        style={{ width: `${durationPct}%` }}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT PANE */}
        <div className="lg:col-span-7 flex flex-col min-w-0 lg:h-full lg:min-h-0 bg-surface lg:overflow-hidden relative">
          
          {/* Right pane tab bar */}
          <div role="tablist" aria-label="Run details" className="flex items-center gap-1 border-b border-line bg-inset px-3 py-1.5 shrink-0 overflow-x-auto">
            {(['span', 'trace', 'detections', 'investigation', 'evals'] as const).map((tab) => {
              const icons = { span: Layers, trace: FileText, detections: AlertTriangle, investigation: ScanSearch, evals: ThumbsUp };
              const labels = { span: 'Span Inspector', trace: 'Trace I/O', detections: `Detections (${detections.length})`, investigation: 'Investigation', evals: 'Evals & Feedback' };
              const Icon = icons[tab];
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeRightTab === tab}
                  onClick={() => setActiveRightTab(tab)}
                  className={`px-2.5 py-1 rounded text-2xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    activeRightTab === tab ? 'bg-tint/[0.07] text-ink border border-line' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  <Icon className={`h-3 w-3 ${tab === 'detections' && detections.length > 0 ? 'text-warn' : ''}`} />
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* TAB: Span Inspector */}
          {activeRightTab === 'span' && selectedSpan && (
            <div className="flex-1 flex flex-col min-h-0 lg:overflow-hidden">
              {/* Span header */}
              <div className="p-3 sm:p-4 bg-canvas space-y-3 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-2xs font-bold uppercase ${
                      selectedSpan.type === 'llm' || selectedSpan.type === 'LLMCall' ? 'text-violet bg-violet-500/10 border border-violet-500/20' :
                      selectedSpan.type === 'tool' || selectedSpan.type === 'WebSearch' ? 'text-warn bg-amber-500/10 border border-amber-500/20' :
                      'text-accent-ink bg-blue-500/10 border border-blue-500/20'
                    }`}>
                      {selectedSpan.type}
                    </span>
                    <h2 className="min-w-0 break-words text-sm font-semibold text-ink font-sans">{selectedSpan.name}</h2>
                  </div>
                  <span className={`text-2xs font-bold px-1.5 py-0.5 rounded border uppercase ${
                    selectedSpan.status === 'FAILED' ? 'bg-red-500/10 text-bad border-red-500/20' : 'bg-emerald-500/10 text-ok border-emerald-500/20'
                  }`}>
                    {selectedSpan.status}
                  </span>
                </div>

                {/* Span metrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs bg-surface p-2.5 rounded border border-line">
                  <div>
                    <span className="text-ink-3 text-2xs block uppercase font-bold">Duration</span>
                    <span className="text-ink font-bold">{selectedSpan.latencyMs < 1000 ? `${selectedSpan.latencyMs}ms` : `${(selectedSpan.latencyMs / 1000).toFixed(1)}s`}</span>
                  </div>
                  <div>
                    <span className="text-ink-3 text-2xs block uppercase font-bold">Cost</span>
                    <span className="text-ok font-bold">{formatCurrency(selectedSpan.cost, currency)}</span>
                  </div>
                  <div>
                    <span className="text-ink-3 text-2xs block uppercase font-bold">Tokens</span>
                    <span className="text-ink">{selectedSpan.tokens.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-ink-3 text-2xs block uppercase font-bold">Children</span>
                    <span className="text-accent-ink font-bold">{childSpans.length}</span>
                  </div>
                  {selectedSpan.model && (
                    <div>
                      <span className="text-ink-3 text-2xs block uppercase font-bold">Model</span>
                      <span className="text-violet">{selectedSpan.model}</span>
                    </div>
                  )}
                  {selectedSpan.provider && (
                    <div>
                      <span className="text-ink-3 text-2xs block uppercase font-bold">Provider</span>
                      <span className="text-ink-2">{selectedSpan.provider}</span>
                    </div>
                  )}
                  {(selectedSpan.inputTokens || 0) > 0 && (
                    <div>
                      <span className="text-ink-3 text-2xs block uppercase font-bold">Input Tok</span>
                      <span className="text-ink-2">{selectedSpan.inputTokens?.toLocaleString()}</span>
                    </div>
                  )}
                  {(selectedSpan.outputTokens || 0) > 0 && (
                    <div>
                      <span className="text-ink-3 text-2xs block uppercase font-bold">Output Tok</span>
                      <span className="text-ink-2">{selectedSpan.outputTokens?.toLocaleString()}</span>
                    </div>
                  )}
                  {(selectedSpan.retryCount || 0) > 0 && (
                    <div>
                      <span className="text-ink-3 text-2xs block uppercase font-bold">Retries</span>
                      <span className="text-warn font-bold">{selectedSpan.retryCount}</span>
                    </div>
                  )}
                </div>

                {/* Error info */}
                {selectedSpan.errorMessage && (
                  <div className="px-3 py-2 rounded border border-red-500/30 bg-red-500/5 text-2xs text-bad font-mono">
                    {selectedSpan.errorType && <span className="text-bad font-bold">[{selectedSpan.errorType}] </span>}
                    {selectedSpan.errorMessage}
                  </div>
                )}
                {selectedSpan.diagnosticSummary && !selectedSpan.errorMessage && (
                  <div className="px-3 py-2 rounded border border-amber-500/30 bg-amber-500/5 text-2xs text-warn font-mono">
                    {selectedSpan.diagnosticTag && <span className="text-warn font-bold">[{selectedSpan.diagnosticTag}] </span>}
                    {selectedSpan.diagnosticSummary}
                  </div>
                )}
              </div>

              {/* Span content tabs */}
              <div className="flex flex-wrap items-center justify-between gap-x-2 border-b border-line bg-canvas px-3 sm:px-4 pt-1.5 shrink-0">
                <div className="flex items-center gap-1">
                  {(['input', 'output', 'metadata', 'raw'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      aria-pressed={activeSpanTab === tab}
                      onClick={() => setActiveSpanTab(tab)}
                      className={`pb-1.5 px-2 font-bold uppercase tracking-wider border-b-2 text-2xs transition-all ${
                        activeSpanTab === tab ? 'border-blue-500 text-accent-ink' : 'border-transparent text-ink-3 hover:text-ink'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => copyText(activeSpanTab === 'input' ? selectedSpan.rawInput || '' : activeSpanTab === 'output' ? selectedSpan.rawOutput || '' : JSON.stringify(selectedSpan, null, 2))}
                  className="flex items-center gap-1 mb-1.5 text-2xs text-ink-2 hover:text-ink bg-surface border border-line px-2 py-0.5 rounded"
                >
                  {copiedPayload ? <Check className="h-3 w-3 text-ok" /> : <Copy className="h-3 w-3" />}
                  {copiedPayload ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-canvas">
                {activeSpanTab === 'input' && (
                  <pre className="rounded border border-line bg-surface p-4 text-xs text-ink-2 overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
                    {selectedSpan.rawInput || '// No input payload recorded'}
                  </pre>
                )}
                {activeSpanTab === 'output' && (
                  <pre className="rounded border border-line bg-surface p-4 text-xs text-ink-2 overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
                    {selectedSpan.rawOutput || '// No output recorded'}
                  </pre>
                )}
                {activeSpanTab === 'metadata' && (
                  <div className="border border-line rounded bg-surface divide-y divide-line">
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
                      <div key={key} className="p-2.5 flex justify-between gap-3 text-2xs">
                        <span className="text-ink-3">{key}</span>
                        <span className="min-w-0 break-all text-right text-ink font-bold">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeSpanTab === 'raw' && (
                  <pre className="rounded border border-line bg-surface p-4 text-xs text-ink-2 overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
                    {JSON.stringify(selectedSpan, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {activeRightTab === 'span' && !selectedSpan && (
            <div className="flex-1 flex items-center justify-center text-center text-xs text-ink-3">
              Select a span from the left pane to inspect.
            </div>
          )}

          {/* TAB: Trace I/O */}
          {activeRightTab === 'trace' && (
            <div className="flex-1 flex flex-col min-h-0 lg:overflow-hidden">
              <div className="flex items-center gap-1 border-b border-line bg-canvas px-4 pt-1.5 shrink-0">
                {(['input', 'output', 'error'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    aria-pressed={activeTraceTab === tab}
                    onClick={() => setActiveTraceTab(tab)}
                    className={`pb-1.5 px-2 font-bold uppercase tracking-wider border-b-2 text-2xs transition-all ${
                      activeTraceTab === tab ? 'border-blue-500 text-accent-ink' : 'border-transparent text-ink-3 hover:text-ink'
                    }`}
                  >
                    {tab === 'error' ? (run.error ? 'Error (1)' : 'Error') : `Trace ${tab}`}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-canvas">
                {activeTraceTab === 'input' && (
                  <pre className="rounded border border-line bg-surface p-4 text-xs text-ink-2 overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
                    {run.input || '// No trace-level input recorded'}
                  </pre>
                )}
                {activeTraceTab === 'output' && (
                  <pre className="rounded border border-line bg-surface p-4 text-xs text-ink-2 overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
                    {run.output || '// No trace-level output recorded'}
                  </pre>
                )}
                {activeTraceTab === 'error' && (
                  <div className="space-y-3">
                    {run.error ? (
                      <div className="rounded border border-red-500/30 bg-red-500/5 p-4 text-xs text-bad font-mono leading-relaxed">
                        {run.errorType && <div className="text-bad font-bold mb-1">[{run.errorType}]</div>}
                        {run.error}
                      </div>
                    ) : (
                      <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-ok text-center">
                        <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-ok" />
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
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-canvas space-y-2">
              {detections.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-6 w-6 text-ok mx-auto mb-2" />
                  <p className="text-xs text-ink-2">No issues detected in this trace.</p>
                </div>
              ) : (
                detections.map((d, i) => {
                  const severityColor = d.severity === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5' :
                    d.severity === 'HIGH' ? 'border-amber-500/30 bg-amber-500/5' :
                    d.severity === 'MEDIUM' ? 'border-yellow-500/30 bg-yellow-500/5' :
                    'border-line bg-tint/[0.03]';
                  const sevTextColor = d.severity === 'CRITICAL' ? 'text-bad' :
                    d.severity === 'HIGH' ? 'text-warn' :
                    d.severity === 'MEDIUM' ? 'text-warn' : 'text-ink-2';
                  return (
                    <div key={i} className={`rounded border p-3 space-y-2 ${severityColor}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-2xs font-bold px-1 py-0.5 rounded border uppercase ${sevTextColor}`}>{d.severity}</span>
                          <span className="text-2xs text-ink-3 font-mono uppercase">{d.type.replace(/_/g, ' ')}</span>
                        </div>
                        {d.spanName && (
                          <button
                            type="button"
                            onClick={() => { const s = run.spans.find(sp => sp.spanId === d.spanId); if (s) { setSelectedSpan(s); setActiveRightTab('span'); } }}
                            className="text-2xs text-accent-ink hover:underline flex items-center gap-0.5"
                          >
                            {d.spanName} <ArrowUpRight className="h-3 w-3" aria-hidden />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-ink font-semibold font-sans">{d.title}</p>
                      <p className="text-2xs text-ink-2 font-sans">{d.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div>
                          <span className="text-2xs text-ink-3 uppercase font-bold block">Impact</span>
                          <span className="text-2xs text-warn font-mono">{d.impact}</span>
                        </div>
                        <div>
                          <span className="text-2xs text-ink-3 uppercase font-bold block">Fix</span>
                          <span className="text-2xs text-ok font-mono">{d.recommendation}</span>
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
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-canvas space-y-4 font-sans">
              {isInvestigating ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <LoadingState
                    label="Running root-cause rules…"
                    variant="Drive"
                  />
                  <p className="text-xs text-ink-2 font-mono text-center">
                    Checking {run.spans.length} spans and {detections.length} detections
                  </p>
                </div>
              ) : investigationError ? (
                <InlineError onRetry={runInvestigation}>{investigationError}</InlineError>
              ) : investigation ? (
                <div className="space-y-4">
                  {/* Thinking Trace */}
                  <div className="rounded-lg border border-line bg-surface p-3.5">
                    <ThinkingState
                      activeTitle="Running root-cause rules"
                      completedTitle={`Checked ${run.spans.length} spans · likely root cause found`}
                      isWorking={false}
                      rows={[
                        { primary: `Checked ${run.spans.length} execution spans`, secondary: `${(run.durationMs / 1000).toFixed(2)}s trace`, status: 'completed' },
                        { primary: `Read ${detections.length} rule-based detections`, secondary: `${criticalDetections.length} critical`, status: 'completed' },
                        { primary: `Matched a root-cause rule`, secondary: `${investigation.confidence}% confidence`, status: 'completed' },
                        ...(investigation.evidence.slice(0, 3).map(e => ({ primary: e, mono: true, status: 'completed' as const }))),
                      ]}
                    />
                  </div>

                  {/* Recommendation Card */}
                  <RecommendationCard
                    title="Root cause (rule-based) and recommended action"
                    description={investigation.rootCause}
                    codeSnippet={investigation.recommendation}
                    confidence={investigation.confidence >= 80 ? 'high' : investigation.confidence >= 50 ? 'medium' : 'low'}
                    confidenceLabel={`${investigation.confidence}% confidence`}
                    alternatives={investigation.suggested.map((s, idx) => ({
                      title: s,
                      confidence: idx === 0 ? 'high' : 'medium',
                      badge: 'Mitigation'
                    }))}
                    acceptLabel="Copy recommendation"
                    acceptedLabel="Copied"
                    onAccept={() => {
                      // Nothing is applied to your agent. This only copies the text.
                      navigator.clipboard?.writeText(investigation.recommendation);
                      toast({ type: 'success', title: 'Recommendation copied', description: 'Nothing was changed in your agent. Apply the fix in your own code.' });
                    }}
                  />

                  {/* Evidence Breakdown */}
                  {investigation.evidence.length > 0 && (
                    <div className="rounded-lg border border-line bg-surface p-4">
                      <span className="text-2xs text-ink-2 uppercase font-mono font-semibold block mb-2">Observed Evidence</span>
                      <div className="space-y-1.5 font-mono text-xs text-ink-2">
                        {investigation.evidence.map((e, i) => (
                          <div key={i} className="flex items-start gap-2 bg-tint/[0.03] p-2 rounded-lg border border-line">
                            <span className="text-accent-ink mt-0.5">•</span>
                            <span className="leading-relaxed">{e}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-20 flex flex-col items-center justify-center">
                  <div className="size-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                    <ScanSearch className="size-5 text-warn" aria-hidden />
                  </div>
                  <h3 className="text-sm font-semibold text-ink">Root-cause investigation (rule-based)</h3>
                  <p className="text-xs text-ink-2 mt-1 max-w-sm text-center leading-relaxed">
                    Applies PathFlow&apos;s built-in rules to this run&apos;s spans and detections and reports the most likely cause with a suggested fix. No language model is involved.
                  </p>
                  <Button variant="primary" className="mt-4" onClick={runInvestigation}>
                    <ScanSearch aria-hidden />
                    Run investigation
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB: Evals & Feedback */}
          {activeRightTab === 'evals' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
                <div>
                  <h3 className="font-semibold text-ink text-xs font-sans">Human evaluation</h3>
                  <p className="text-2xs text-ink-2 font-sans mt-0.5">Your own rating of this run. The sliders start at default values until you save.</p>
                </div>
                {evalSavedMsg && (
                  <span role="status" className="text-2xs font-mono text-ok font-bold">{evalSavedMsg}</span>
                )}
              </div>

              {/* Thumbs Feedback */}
              <div className="p-3 bg-canvas border border-line rounded-lg space-y-2 font-mono">
                <span className="text-2xs text-ink-2 uppercase font-bold block">Execution Quality Assessment</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={evalData.thumbs === 'UP'}
                    onClick={() => setEvalData({ ...evalData, thumbs: 'UP' })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                      evalData.thumbs === 'UP' ? 'bg-emerald-500/20 text-ok border border-emerald-500/40' : 'bg-surface text-ink-2 border border-line hover:text-ink'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Thumbs Up (Accurate)</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={evalData.thumbs === 'DOWN'}
                    onClick={() => setEvalData({ ...evalData, thumbs: 'DOWN' })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                      evalData.thumbs === 'DOWN' ? 'bg-red-500/20 text-bad border border-red-500/40' : 'bg-surface text-ink-2 border border-line hover:text-ink'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Thumbs Down (Flawed)</span>
                  </button>
                </div>
              </div>

              {/* Metric Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-canvas border border-line rounded-lg space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-ink-2">Overall Score</span>
                    <span className="font-bold text-accent-ink">{evalData.score}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    aria-label="Overall score (percent)"
                    value={evalData.score}
                    onChange={(e) => setEvalData({ ...evalData, score: parseInt(e.target.value, 10) })}
                    className="w-full cursor-pointer accent-[rgb(var(--accent))]"
                  />
                </div>

                <div className="p-3 bg-canvas border border-line rounded-lg space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-ink-2">Faithfulness</span>
                    <span className="font-bold text-ok">{evalData.faithfulnessScore}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    aria-label="Faithfulness (percent)"
                    value={evalData.faithfulnessScore}
                    onChange={(e) => setEvalData({ ...evalData, faithfulnessScore: parseInt(e.target.value, 10) })}
                    className="w-full cursor-pointer accent-[rgb(var(--accent))]"
                  />
                </div>

                <div className="p-3 bg-canvas border border-line rounded-lg space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-ink-2">Hallucination Risk</span>
                    <span className={`font-bold ${evalData.hallucinationScore > 30 ? 'text-bad' : 'text-ink-2'}`}>
                      {evalData.hallucinationScore}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    aria-label="Hallucination risk (percent)"
                    value={evalData.hallucinationScore}
                    onChange={(e) => setEvalData({ ...evalData, hallucinationScore: parseInt(e.target.value, 10) })}
                    className="w-full cursor-pointer accent-[rgb(var(--accent))]"
                  />
                </div>
              </div>

              {/* Reviewer Annotation Notes */}
              <div className="space-y-1.5">
                <label htmlFor="eval-notes" className="text-2xs text-ink-3 uppercase font-mono font-bold block">Reviewer notes</label>
                <textarea
                  id="eval-notes"
                  rows={4}
                  placeholder="Record qualitative feedback, edge cases, prompt flaws, or fine-tuning notes..."
                  value={evalData.notes}
                  onChange={(e) => setEvalData({ ...evalData, notes: e.target.value })}
                  className="w-full rounded border border-line bg-canvas p-3 text-xs text-ink placeholder:text-ink-3 focus:border-blue-500 font-mono"
                />
              </div>

              <div className="text-right pt-2">
                <Button variant="primary" onClick={handleSaveEval} disabled={isSavingEval}>
                  {isSavingEval ? 'Saving…' : 'Save evaluation'}
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
