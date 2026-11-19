'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PathData, formatCurrency, CurrencyMode, fetchRunsFromApi } from '@/lib/data';
import { Search, CheckCircle2, RefreshCw, Terminal, XCircle, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import FilterPills from '@/components/ui/FilterPills';
import { PageShell, PageHeader } from '@/components/ui/Page';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Card, TableWrap, th, theadRow } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DemoBadge, DemoNotice, EmptyState, ErrorState, InlineError } from '@/components/ui/States';
import { demoScope, isDemoRun } from '@/lib/demo';

function formatAge(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('ago')) return dateStr;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function SkeletonRow() {
  const bar = 'h-3.5 rounded bg-tint/10';
  return (
    <tr className="animate-pulse" aria-hidden>
      <td className="px-3 py-3"><div className={`${bar} w-5`} /></td>
      <td className="px-3 py-3"><div className={`${bar} w-48 max-w-full`} /></td>
      <td className="px-3 py-3"><div className={`${bar} w-20`} /></td>
      <td className="px-3 py-3"><div className={`${bar} w-24`} /></td>
      <td className="px-3 py-3"><div className={`${bar} ml-auto w-12`} /></td>
      <td className="px-3 py-3"><div className={`${bar} ml-auto w-12`} /></td>
      <td className="px-3 py-3"><div className={`${bar} ml-auto w-12`} /></td>
      <td className="px-3 py-3"><div className={`${bar} ml-auto w-8`} /></td>
      <td className="px-3 py-3"><div className={`${bar} ml-auto w-12`} /></td>
    </tr>
  );
}

type PollInterval = 'OFF' | '2s' | '5s' | '10s';
type StatusFilter = 'ALL' | 'completed' | 'failed';

export default function RunsPage() {
  const [runs, setRuns] = useState<PathData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [modelFilter, setModelFilter] = useState<string>('ALL');
  const [frameworkFilter, setFrameworkFilter] = useState<string>('ALL');
  const [minDurationFilter, setMinDurationFilter] = useState<number>(0);
  const [currency, setCurrency] = useState<CurrencyMode>('USD');
  const [isLoading, setIsLoading] = useState(true);
  // `error`: the first load failed, nothing to show. `refreshError`: a
  // background refresh failed, the rows on screen are from the last good load.
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const [pollInterval, setPollInterval] = useState<PollInterval>('5s');

  // Read URL query params (the global search sends ?q=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setSearchQuery(q);
  }, []);

  const loadRuns = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await fetchRunsFromApi('', statusFilter === 'ALL' ? '' : statusFilter);
      setRuns(data);
      setError(null);
      setRefreshError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'The request failed.';
      if (silent) {
        setRefreshError(message);
      } else {
        setRuns([]);
        setError(message);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  // Auto-refresh (polling)
  useEffect(() => {
    if (pollInterval === 'OFF' || error) return;
    const ms = pollInterval === '2s' ? 2000 : pollInterval === '5s' ? 5000 : 10000;
    const interval = setInterval(() => {
      loadRuns(true);
    }, ms);
    return () => clearInterval(interval);
  }, [pollInterval, loadRuns, error]);

  useEffect(() => {
    const updateCurrency = () => {
      const saved = localStorage.getItem('pathflow_currency') as CurrencyMode;
      if (saved === 'INR' || saved === 'USD') setCurrency(saved);
    };
    updateCurrency();
    window.addEventListener('storage', updateCurrency);
    return () => window.removeEventListener('storage', updateCurrency);
  }, []);

  // Client-side filtering
  const filteredRuns = useMemo(() => {
    return runs.filter(run => {
      const q = searchQuery.toLowerCase().trim();

      // Search syntax
      if (q.includes('status:error') || q.includes('status:failed')) {
        if (run.status.toUpperCase() !== 'FAILED') return false;
      } else if (q.includes('status:ok') || q.includes('status:completed')) {
        if (run.status.toUpperCase() !== 'COMPLETED') return false;
      }

      const modelMatch = q.match(/model:([a-z0-9.-]+)/);
      if (modelMatch?.[1] && !run.modelFamily.toLowerCase().includes(modelMatch[1])) return false;

      const durationMatch = q.match(/duration>(\d+)/);
      if (durationMatch?.[1] && run.durationMs < parseInt(durationMatch[1], 10)) return false;

      const costMatch = q.match(/cost>([\d.]+)/);
      if (costMatch?.[1] && run.cost < parseFloat(costMatch[1])) return false;

      // General text search
      const cleanSearch = q
        .replace(/status:[a-z]+/g, '')
        .replace(/model:[a-z0-9.-]+/g, '')
        .replace(/duration>\d+/g, '')
        .replace(/cost>[\d.]+/g, '')
        .trim();

      if (cleanSearch) {
        const combined = `${run.title} ${run.description} ${run.agent?.name} ${run.id} ${run.error || ''}`.toLowerCase();
        if (!combined.includes(cleanSearch)) return false;
      }

      if (modelFilter !== 'ALL' && run.modelFamily !== modelFilter) return false;
      if (frameworkFilter !== 'ALL' && (run.agent?.framework || 'Custom') !== frameworkFilter) return false;
      if (minDurationFilter > 0 && run.durationMs < minDurationFilter) return false;

      return true;
    });
  }, [runs, searchQuery, modelFilter, frameworkFilter, minDurationFilter]);

  // Summary stats
  const totalRuns = filteredRuns.length;
  const failedCount = filteredRuns.filter(r => r.status.toUpperCase() === 'FAILED').length;
  const successCount = filteredRuns.filter(r => r.status.toUpperCase() === 'COMPLETED').length;
  const totalCost = filteredRuns.reduce((a, r) => a + r.cost, 0);

  // Available models/frameworks for filters
  const availableModels = [...new Set(runs.map(r => r.modelFamily))];
  const availableFrameworks = [...new Set(runs.map(r => r.agent?.framework || 'Custom'))];

  // Is what we are showing the built-in sample data?
  const demo = demoScope(filteredRuns, isDemoRun);

  const hasFilters = !!searchQuery || modelFilter !== 'ALL' || frameworkFilter !== 'ALL' || minDurationFilter > 0 || statusFilter !== 'ALL';
  const clearFilters = () => {
    setSearchQuery('');
    setModelFilter('ALL');
    setFrameworkFilter('ALL');
    setMinDurationFilter(0);
    setStatusFilter('ALL');
  };

  return (
    <PageShell>
      <PageHeader
        title="Runs"
        badge={demo !== 'none' ? <DemoBadge scope={demo} /> : undefined}
        description={
          isLoading
            ? 'Loading runs…'
            : error
              ? 'Runs could not be loaded.'
              : `${totalRuns} runs · ${successCount} passed · ${failedCount} failed · ${totalCost > 0 ? formatCurrency(totalCost, currency) : '$0'} total cost`
        }
        actions={
          <>
            <label className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface pl-2.5 font-mono text-2xs text-ink-2">
              <span
                aria-hidden
                className={`size-1.5 rounded-full ${pollInterval !== 'OFF' && !refreshError ? 'bg-ok animate-pulse' : refreshError ? 'bg-bad' : 'bg-ink-3'}`}
              />
              <span>Auto-refresh</span>
              <select
                value={pollInterval}
                onChange={(e) => setPollInterval(e.target.value as PollInterval)}
                className="h-full cursor-pointer rounded-r-md bg-transparent pr-1 font-mono text-ink"
              >
                <option value="2s">2s</option>
                <option value="5s">5s</option>
                <option value="10s">10s</option>
                <option value="OFF">Paused</option>
              </select>
            </label>

            <Button onClick={() => loadRuns(false)} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
              Refresh
            </Button>
          </>
        }
      />

      <DemoNotice scope={demo} what="runs" />

      {refreshError && (
        <InlineError onRetry={() => loadRuns(true)}>
          Auto-refresh failed: {refreshError} The list below is from the last successful load.
        </InlineError>
      )}

      {/* Filters */}
      <Card className="flex flex-wrap items-center gap-2 p-2">
        <div className="relative min-w-0 flex-1 basis-56">
          <label htmlFor="runs-search" className="sr-only">Search runs</label>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input
            id="runs-search"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="Title, agent, error, ID… or status:failed  cost>0.05"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 font-mono"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-3 hover:text-ink"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>

        <FilterPills
          label="Filter by status"
          items={[
            { id: 'ALL', label: 'All', count: totalRuns },
            { id: 'completed', label: 'Passed', count: successCount, dotColor: '#10B981' },
            { id: 'failed', label: 'Failed', count: failedCount, dotColor: '#EF4444' },
          ]}
          selectedId={statusFilter}
          onSelect={(id) => setStatusFilter(id as StatusFilter)}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Select aria-label="Filter by model" value={modelFilter} onChange={(e) => setModelFilter(e.target.value)} className="max-w-[11rem] font-mono">
            <option value="ALL">All models</option>
            {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>

          <Select aria-label="Filter by framework" value={frameworkFilter} onChange={(e) => setFrameworkFilter(e.target.value)} className="max-w-[11rem] font-mono">
            <option value="ALL">All frameworks</option>
            {availableFrameworks.map(f => <option key={f} value={f}>{f}</option>)}
          </Select>

          <Select aria-label="Filter by minimum duration" value={minDurationFilter} onChange={(e) => setMinDurationFilter(parseInt(e.target.value, 10))} className="font-mono">
            <option value="0">Any duration</option>
            <option value="5000">&gt; 5s</option>
            <option value="15000">&gt; 15s</option>
            <option value="30000">&gt; 30s</option>
          </Select>
        </div>
      </Card>

      {/* Results */}
      {error ? (
        <ErrorState title="Could not load runs" message={error} onRetry={() => loadRuns(false)} />
      ) : !isLoading && runs.length === 0 && !hasFilters ? (
        <EmptyState
          icon={<Terminal />}
          title="No runs yet"
          action={<ButtonLink href="/settings" variant="primary">Set up the SDK</ButtonLink>}
        >
          Runs appear here as soon as an agent sends a trace with the PathFlow SDK.
        </EmptyState>
      ) : !isLoading && filteredRuns.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="No runs match these filters"
          action={<Button onClick={clearFilters}>Clear filters</Button>}
        >
          Try a broader search, or clear the filters to see every run.
        </EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <TableWrap label="Runs table">
            <table className="w-full min-w-[820px] border-collapse text-left" aria-busy={isLoading}>
              <thead>
                <tr className={theadRow}>
                  <th scope="col" className={`${th} w-12`}><span className="sr-only">Status</span></th>
                  <th scope="col" className={th}>Run</th>
                  <th scope="col" className={th}>Agent</th>
                  <th scope="col" className={th}>Model</th>
                  <th scope="col" className={`${th} text-right`}>Duration</th>
                  <th scope="col" className={`${th} text-right`}>Tokens</th>
                  <th scope="col" className={`${th} text-right`}>Cost</th>
                  <th scope="col" className={`${th} text-right`}>Quality</th>
                  <th scope="col" className={`${th} text-right`}>When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-xs">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : (
                  filteredRuns.map((run) => {
                    const isFailed = run.status.toUpperCase() === 'FAILED';
                    return (
                      // `relative` + the link's ::after overlay make the whole row clickable
                      // while keeping a single real link for keyboard and screen-reader users.
                      <tr key={run.id} className="group relative transition-colors hover:bg-tint/[0.03]">
                        <td className="px-3 py-2.5">
                          {isFailed ? (
                            <span className="inline-flex size-5 items-center justify-center rounded bg-bad/10">
                              <XCircle className="size-3 text-bad" aria-hidden />
                              <span className="sr-only">Failed</span>
                            </span>
                          ) : (
                            <span className="inline-flex size-5 items-center justify-center rounded bg-ok/10">
                              <CheckCircle2 className="size-3 text-ok" aria-hidden />
                              <span className="sr-only">Passed</span>
                            </span>
                          )}
                        </td>

                        <td className="max-w-[340px] px-3 py-2.5">
                          <Link href={`/runs/${run.id}`} className="block after:absolute after:inset-0 after:content-['']">
                            <span className="flex items-center gap-2">
                              <span className="truncate font-sans text-xs font-semibold text-ink transition-colors group-hover:text-accent-ink">
                                {run.title}
                              </span>
                              {demo === 'some' && isDemoRun(run) && <Badge tone="warn">Demo</Badge>}
                            </span>
                            {run.error && (
                              <span className="block truncate font-mono text-2xs text-bad">{run.error}</span>
                            )}
                          </Link>
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-2xs text-ink-2">
                          {run.agent?.name || '—'}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-2xs text-ink-2">
                          {run.modelFamily}
                        </td>

                        <td className="px-3 py-2.5 text-right font-mono text-2xs tabular-nums text-ink">
                          {run.durationMs < 1000 ? `${run.durationMs}ms` : `${(run.durationMs / 1000).toFixed(1)}s`}
                        </td>

                        <td className="px-3 py-2.5 text-right font-mono text-2xs tabular-nums text-ink-2">
                          {run.tokens >= 1000 ? `${(run.tokens / 1000).toFixed(0)}K` : run.tokens}
                        </td>

                        <td className="px-3 py-2.5 text-right font-mono text-2xs font-semibold tabular-nums text-ink">
                          {run.cost > 0 ? formatCurrency(run.cost, currency) : <span className="font-normal text-ink-3">—</span>}
                        </td>

                        <td className="px-3 py-2.5 text-right font-mono text-2xs tabular-nums">
                          {run.qualityScore != null ? (
                            <span className={run.qualityScore >= 80 ? 'text-ok' : run.qualityScore >= 60 ? 'text-warn' : 'text-bad'}>
                              {run.qualityScore}
                            </span>
                          ) : (
                            <span className="text-ink-3">—</span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-2xs text-ink-3">
                          {formatAge(run.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      )}
    </PageShell>
  );
}
