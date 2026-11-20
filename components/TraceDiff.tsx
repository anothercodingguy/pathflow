'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PathData, fetchRunsFromApi } from '@/lib/data';
import { PageShell, PageHeader } from '@/components/ui/Page';
import { DemoBadge, DemoNotice, EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { ButtonLink } from '@/components/ui/Button';
import { demoScope, isDemoRun } from '@/lib/demo';
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
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRunsFromApi();
      setRuns(data);
      if (data.length > 0) {
        setLeftId((current) => (current && data.some(r => r.id === current) ? current : data[0].id));
        setRightId((current) => (current && data.some(r => r.id === current) ? current : data[1]?.id || data[0].id));
      }
    } catch (err) {
      setRuns([]);
      setError(err instanceof Error ? err.message : 'The request failed.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const demo = demoScope(runs, isDemoRun);

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
        const pct = lSpan.latencyMs > 0 ? ((rSpan.latencyMs - lSpan.latencyMs) / lSpan.latencyMs) * 100 : 0;
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
    <PageShell className="font-mono">
      <PageHeader
        title="Compare runs"
        badge={demo !== 'none' ? <DemoBadge scope={demo} /> : undefined}
        description="Diff two runs side by side: duration, cost, tokens and span structure."
      />

      <DemoNotice scope={demo} what="runs" />

      {isLoading ? (
        <LoadingBlock label="Loading runs…" />
      ) : error ? (
        <ErrorState title="Could not load runs" message={error} onRetry={loadData} />
      ) : runs.length > 0 && leftTrace && rightTrace ? (
        <>
          {/* 2. Run Selectors (Baseline vs Comparison) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-line rounded bg-surface p-2.5">
              <label htmlFor="compare-run-a" className="text-2xs font-mono text-ink-3 uppercase tracking-wider block mb-1">
                Baseline (run A)
              </label>
              <select
                id="compare-run-a"
                value={leftId}
                onChange={(e) => setLeftId(e.target.value)}
                className="w-full rounded border border-line bg-canvas px-2.5 py-1 text-xs font-mono text-ink focus:border-blue-500"
              >
                {runs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({(t.durationMs / 1000).toFixed(1)}s • ${t.cost.toFixed(3)} • {t.modelFamily})
                  </option>
                ))}
              </select>
            </div>

            <div className="border border-line rounded bg-surface p-2.5">
              <label htmlFor="compare-run-b" className="text-2xs font-mono text-ink-3 uppercase tracking-wider block mb-1">
                Comparison (run B)
              </label>
              <select
                id="compare-run-b"
                value={rightId}
                onChange={(e) => setRightId(e.target.value)}
                className="w-full rounded border border-line bg-canvas px-2.5 py-1 text-xs font-mono text-ink focus:border-blue-500"
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
                ? 'border-amber-500/40 bg-amber-500/10 text-ink'
                : 'border-emerald-500/40 bg-emerald-500/10 text-ink'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-1.5 font-mono text-2xs">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                  <Sparkles className="h-4 w-4 text-warn" />
                  <span>Regression summary (computed from the two runs)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 font-telemetry">
                  <span>Latency: <strong className={regressionSummary.latencyPct > 0 ? 'text-warn' : 'text-ok'}>
                    {regressionSummary.latencyPct > 0 ? `+${regressionSummary.latencyPct}%` : `${regressionSummary.latencyPct}%`}
                  </strong></span>
                  <span>•</span>
                  <span>Cost: <strong className={regressionSummary.costPct > 0 ? 'text-warn' : 'text-ok'}>
                    {regressionSummary.costPct > 0 ? `+${regressionSummary.costPct}%` : `${regressionSummary.costPct}%`}
                  </strong></span>
                </div>
              </div>

              <div className="space-y-1 font-mono text-2xs text-ink-2">
                {regressionSummary.reasons.map((reason, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-warn">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. BEFORE vs AFTER Metrics Comparison Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xs font-mono font-bold text-ink-2 uppercase tracking-wider">
                Performance Comparison (Before vs After)
              </h2>
              <span className={`px-2.5 py-0.5 rounded text-2xs font-mono font-bold border ${
                latencyPct <= 0
                  ? 'bg-emerald-500/10 text-ok border-emerald-500/40'
                  : 'bg-amber-500/10 text-warn border-amber-500/40'
              }`}>
                {latencyPct <= 0 ? 'Performance Improved' : 'Performance Regression'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Latency Card */}
              <div className="border border-line rounded bg-surface p-3 space-y-1">
                <span className="text-2xs text-ink-3 font-mono uppercase block">Latency</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-ink-2 font-mono text-xs">{(leftTrace.durationMs / 1000).toFixed(1)}s</span>
                  <span className="text-ink-3 font-mono">→</span>
                  <span className="text-ink font-bold font-mono text-sm">{(rightTrace.durationMs / 1000).toFixed(1)}s</span>
                </div>
                <div className={`text-2xs font-mono font-bold flex items-center justify-end gap-1 ${latencyPct <= 0 ? 'text-ok' : 'text-warn'}`}>
                  {latencyPct <= 0 ? `↓ ${Math.abs(Math.round(latencyPct))}%` : `↑ ${Math.round(latencyPct)}%`}
                </div>
              </div>

              {/* Tokens Card */}
              <div className="border border-line rounded bg-surface p-3 space-y-1">
                <span className="text-2xs text-ink-3 font-mono uppercase block">Tokens</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-ink-2 font-mono text-xs">{leftTrace.tokens.toLocaleString()}</span>
                  <span className="text-ink-3 font-mono">→</span>
                  <span className="text-ink font-bold font-mono text-sm">{rightTrace.tokens.toLocaleString()}</span>
                </div>
                <div className={`text-2xs font-mono font-bold flex items-center justify-end gap-1 ${tokenPct <= 0 ? 'text-ok' : 'text-warn'}`}>
                  {tokenPct <= 0 ? `↓ ${Math.abs(Math.round(tokenPct))}%` : `↑ ${Math.round(tokenPct)}%`}
                </div>
              </div>

              {/* Cost Card */}
              <div className="border border-line rounded bg-surface p-3 space-y-1">
                <span className="text-2xs text-ink-3 font-mono uppercase block">Cost</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-ink-2 font-mono text-xs">{leftTrace.cost > 0 ? `$${leftTrace.cost.toFixed(3)}` : '—'}</span>
                  <span className="text-ink-3 font-mono">→</span>
                  <span className="text-ink font-bold font-mono text-sm">{rightTrace.cost > 0 ? `$${rightTrace.cost.toFixed(3)}` : '—'}</span>
                </div>
                <div className="text-2xs font-mono text-ink-3 text-right">
                  {leftTrace.cost > 0 && rightTrace.cost > 0 ? (
                    <span className={costPct <= 0 ? 'text-ok font-bold' : 'text-warn font-bold'}>
                      {costPct <= 0 ? `↓ ${Math.abs(Math.round(costPct))}%` : `↑ ${Math.round(costPct)}%`}
                    </span>
                  ) : (
                    'Pricing unavailable'
                  )}
                </div>
              </div>

              {/* Tool Calls Card */}
              <div className="border border-line rounded bg-surface p-3 space-y-1">
                <span className="text-2xs text-ink-3 font-mono uppercase block">Tool Calls / Spans</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-ink-2 font-mono text-xs">{leftTrace.spans.length}</span>
                  <span className="text-ink-3 font-mono">→</span>
                  <span className="text-ink font-bold font-mono text-sm">{rightTrace.spans.length}</span>
                </div>
                <div className={`text-2xs font-mono font-bold flex items-center justify-end gap-1 ${
                  rightTrace.spans.length <= leftTrace.spans.length ? 'text-ok' : 'text-warn'
                }`}>
                  {rightTrace.spans.length <= leftTrace.spans.length ? `↓ ${leftTrace.spans.length - rightTrace.spans.length} spans` : `↑ ${rightTrace.spans.length - leftTrace.spans.length} spans`}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Structural Execution Changes */}
          <div className="space-y-1.5">
            <h2 className="text-2xs font-mono font-bold text-ink-2 uppercase tracking-wider">
              Execution Structure & Span Diff
            </h2>

            <div className="border border-line bg-surface p-3 rounded space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {structuralChanges.added.map((type) => (
                  <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-ok font-bold text-2xs">
                    <Plus className="h-3 w-3" /> Added {type}
                  </span>
                ))}

                {structuralChanges.removed.map((type) => (
                  <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-warn font-bold text-2xs">
                    <Minus className="h-3 w-3" /> Removed {type}
                  </span>
                ))}

                {structuralChanges.isRetry && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-bad font-bold text-2xs">
                    <AlertTriangle className="h-3 w-3" /> Step Failure Present
                  </span>
                )}
              </div>

              {/* Span Latency Shift Details */}
              {structuralChanges.changedSpans.length > 0 && (
                <div className="space-y-1 border-t border-line pt-2">
                  <span className="text-2xs text-ink-3 uppercase font-bold block">Span Latency Shifts:</span>
                  {structuralChanges.changedSpans.map((sp, idx) => (
                    <div key={idx} className="flex items-center justify-between text-ink-2 font-mono text-2xs">
                      <span>• {sp.name} ({sp.type}):</span>
                      <span className="font-telemetry">
                        {sp.oldLatency}ms → <strong className="text-ink">{sp.newLatency}ms</strong>
                        <span className={`ml-2 font-bold ${sp.diffPct > 0 ? 'text-warn' : 'text-ok'}`}>
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
        <EmptyState title="Nothing to compare yet" action={<ButtonLink href="/runs">Go to runs</ButtonLink>}>
          Comparing needs at least two runs. Send traces with the SDK and come back.
        </EmptyState>
      )}

    </PageShell>
  );
}
