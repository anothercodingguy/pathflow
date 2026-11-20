'use client';

import React from 'react';
import {
  BarChart3, DollarSign, Clock, Zap, CheckCircle2, XCircle, Loader2, Activity, Cpu, Wrench,
  ArrowUpRight, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

import NumberAnimation from '@/components/ui/NumberAnimation';
import { PageShell, PageHeader } from '@/components/ui/Page';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, CardHeader, TableWrap, th, theadRow } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DemoBadge, DemoNotice, EmptyState, ErrorState } from '@/components/ui/States';
import { useApiData } from '@/lib/useApiData';
import { DemoScope, isDemoAgentId, isDemoRunId, isDemoWorkspace } from '@/lib/demo';

interface Analytics {
  kpis: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    runningRuns: number;
    successRate: number;
    failureRate: number;
    avgLatency: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    totalTokens: number;
    avgTokens: number;
    totalCost: number;
    avgCost: number;
    avgQuality: number | null;
  };
  modelUsage: Array<{ model: string; runs: number; tokens: number; cost: number; avgLatency: number }>;
  toolUsage: Array<{ tool: string; calls: number; successRate: number; failureRate: number; avgLatency: number; totalCost: number; retries: number }>;
  agentStats: Array<{ id: string; name: string; runs: number; successRate: number; avgLatency: number; avgCost: number; totalCost: number; avgQuality: number | null }>;
  expensiveRuns: Array<{ id: string; title: string; cost: number; tokens: number; duration: number; status: string }>;
  slowestRuns: Array<{ id: string; title: string; duration: number; cost: number; status: string }>;
  runVolume: Array<{ date: string; total: number; success: number; failed: number }>;
}

function KpiCard({
  label,
  value,
  numValue,
  prefix = '',
  suffix = '',
  decimals = 0,
  subValue,
  icon: Icon,
  color = 'text-ink',
}: {
  label: string;
  value?: string;
  numValue?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  subValue?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}) {
  return (
    <Card className="flex min-h-[104px] flex-col justify-between p-3.5">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <dt className="font-mono text-2xs font-semibold uppercase tracking-wide text-ink-2">{label}</dt>
          <Icon className="size-3.5 shrink-0 text-ink-3" aria-hidden />
        </div>
        <dd className={`font-mono text-xl font-bold tabular-nums ${color}`}>
          {numValue !== undefined ? (
            <NumberAnimation value={numValue} prefix={prefix} suffix={suffix} decimals={decimals} />
          ) : (
            value
          )}
        </dd>
      </div>
      <dd className="mt-2 min-h-[16px] font-mono text-2xs leading-tight text-ink-3">{subValue}</dd>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="flex min-h-[104px] animate-pulse flex-col justify-between p-3.5" aria-hidden>
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-tint/10" />
        <div className="h-6 w-16 rounded bg-tint/10" />
      </div>
      <div className="mt-2 h-3 w-24 rounded bg-tint/10" />
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  return status === 'failed' ? <Badge tone="bad">FAIL</Badge> : <Badge tone="ok">OK</Badge>;
}

const td = 'px-3 py-2.5';
const tdNum = 'px-3 py-2.5 text-right font-mono tabular-nums text-ink-2 whitespace-nowrap';

export default function AnalyticsPage() {
  const { data: analytics, loading: isLoading, error, reload } = useApiData<Analytics | null>(
    '/api/v1/analytics',
    (json) => json.analytics ?? null
  );

  const kpis = analytics?.kpis;

  // The analytics API aggregates the built-in sample runs together with your
  // own, so check the run and agent ids it returns to know what is on screen.
  let demo: DemoScope = 'none';
  if (analytics) {
    const flags = [
      ...analytics.expensiveRuns.map((r) => isDemoRunId(r.id)),
      ...analytics.slowestRuns.map((r) => isDemoRunId(r.id)),
      ...analytics.agentStats.map((a) => isDemoAgentId(a.id)),
    ];
    if (isDemoWorkspace() || (flags.length > 0 && flags.every(Boolean))) demo = 'all';
    else if (flags.some(Boolean)) demo = 'some';
  }

  const isEmpty = !!kpis && kpis.totalRuns === 0;

  return (
    <PageShell>
      <PageHeader
        title="Analytics"
        badge={demo !== 'none' ? <DemoBadge scope={demo} /> : undefined}
        description="Reliability, latency, token and cost totals across runs."
        actions={
          <Button onClick={reload} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
            Refresh
          </Button>
        }
      />

      <DemoNotice scope={demo} what="figures" />

      {error ? (
        <ErrorState title="Could not load analytics" message={error} onRetry={reload} />
      ) : !isLoading && (!analytics || isEmpty) ? (
        <EmptyState
          icon={<BarChart3 />}
          title="No runs to analyse yet"
          action={<ButtonLink href="/settings" variant="primary">Set up the SDK</ButtonLink>}
        >
          Analytics are computed from your runs. They appear after the first trace arrives.
        </EmptyState>
      ) : (
        <>
      {/* KPI Cards */}
      <dl className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-busy={isLoading}>
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
        ) : kpis ? (
          <>
            <KpiCard
              label="Total Runs"
              numValue={kpis.totalRuns}
              subValue={kpis.runningRuns > 0 ? `${kpis.runningRuns} running` : 'All statuses'}
              icon={Activity}
            />
            <KpiCard
              label="Success Rate"
              numValue={kpis.successRate}
              suffix="%"
              subValue={`${kpis.successfulRuns} successful`}
              icon={CheckCircle2}
              color={kpis.successRate >= 90 ? 'text-ok' : kpis.successRate >= 70 ? 'text-warn' : 'text-bad'}
            />
            <KpiCard
              label="Failure Rate"
              numValue={kpis.failureRate}
              suffix="%"
              subValue={`${kpis.failedRuns} failed`}
              icon={XCircle}
              color={kpis.failureRate <= 10 ? 'text-ok' : kpis.failureRate <= 25 ? 'text-warn' : 'text-bad'}
            />
            <KpiCard
              label="Avg Latency"
              numValue={kpis.avgLatency / 1000}
              decimals={1}
              suffix="s"
              subValue={`p95 ${(kpis.p95Latency / 1000).toFixed(1)}s`}
              icon={Clock}
            />
            <KpiCard
              label="P99 Latency"
              numValue={kpis.p99Latency / 1000}
              decimals={1}
              suffix="s"
              subValue={`p50 ${(kpis.p50Latency / 1000).toFixed(1)}s`}
              icon={Clock}
              color="text-ink-2"
            />
            <KpiCard
              label="Total Tokens"
              value={kpis.totalTokens >= 1000000 ? `${(kpis.totalTokens / 1000000).toFixed(1)}M` : `${(kpis.totalTokens / 1000).toFixed(0)}K`}
              subValue={`Avg: ${kpis.avgTokens.toLocaleString()}/run`}
              icon={Zap}
            />
            <KpiCard
              label="Avg Tokens"
              numValue={kpis.avgTokens}
              subValue="Per run"
              icon={Zap}
              color="text-ink-2"
            />
            <KpiCard
              label="Total Cost"
              numValue={kpis.totalCost}
              prefix="$"
              decimals={2}
              subValue={`Avg: $${kpis.avgCost.toFixed(4)}/run`}
              icon={DollarSign}
            />
            <KpiCard
              label="Avg Cost"
              numValue={kpis.avgCost}
              prefix="$"
              decimals={4}
              subValue="Per run"
              icon={DollarSign}
            />
            {kpis.avgQuality !== null && (
              <KpiCard
                label="Avg Quality"
                numValue={kpis.avgQuality}
                subValue="Mean quality score"
                icon={BarChart3}
                color={kpis.avgQuality >= 80 ? 'text-ok' : kpis.avgQuality >= 60 ? 'text-warn' : 'text-bad'}
              />
            )}
          </>
        ) : null}
      </dl>

      {/* Model Usage & Tool Performance */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Model Usage */}
          <Card className="overflow-hidden">
            <CardHeader title="Model usage" icon={<Cpu className="size-3.5 text-ink-3" aria-hidden />} />
            {analytics.modelUsage.length > 0 ? (
              <TableWrap label="Model usage table">
              <table className="w-full min-w-[460px] text-xs">
                <thead>
                  <tr className={theadRow}>
                    <th scope="col" className={th}>Model</th>
                    <th scope="col" className={`${th} text-right`}>Runs</th>
                    <th scope="col" className={`${th} text-right`}>Tokens</th>
                    <th scope="col" className={`${th} text-right`}>Cost</th>
                    <th scope="col" className={`${th} text-right`}>Avg Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {analytics.modelUsage.map((m) => (
                    <tr key={m.model} className="hover:bg-tint/[0.03]">
                      <td className={`${td} font-sans font-medium text-ink whitespace-nowrap`}>{m.model}</td>
                      <td className={tdNum}>{m.runs}</td>
                      <td className={tdNum}>{m.tokens.toLocaleString()}</td>
                      <td className={`${tdNum} font-semibold text-ink`}>${m.cost.toFixed(3)}</td>
                      <td className={tdNum}>{(m.avgLatency / 1000).toFixed(1)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </TableWrap>
            ) : (
              <p className="px-4 py-8 text-center font-sans text-xs text-ink-3">No model usage recorded yet.</p>
            )}
          </Card>

          {/* Tool Performance */}
          <Card className="overflow-hidden">
            <CardHeader title="Tool performance" icon={<Wrench className="size-3.5 text-ink-3" aria-hidden />} />
            {analytics.toolUsage.length > 0 ? (
              <TableWrap label="Tool performance table">
              <table className="w-full min-w-[460px] text-xs">
                <thead>
                  <tr className={theadRow}>
                    <th scope="col" className={th}>Tool</th>
                    <th scope="col" className={`${th} text-right`}>Calls</th>
                    <th scope="col" className={`${th} text-right`}>Success</th>
                    <th scope="col" className={`${th} text-right`}>Avg Latency</th>
                    <th scope="col" className={`${th} text-right`}>Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {analytics.toolUsage.map((t) => (
                    <tr key={t.tool} className="hover:bg-tint/[0.02]">
                      <td className={`${td} max-w-[220px] truncate font-sans font-medium text-ink`}>{t.tool}</td>
                      <td className={tdNum}>{t.calls}</td>
                      <td className={tdNum}>
                        <span className={t.successRate >= 90 ? 'text-ok' : t.successRate >= 70 ? 'text-warn' : 'text-bad'}>
                          {t.successRate}%
                        </span>
                      </td>
                      <td className={tdNum}>{t.avgLatency < 1000 ? `${t.avgLatency}ms` : `${(t.avgLatency / 1000).toFixed(1)}s`}</td>
                      <td className={tdNum}>${t.totalCost.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </TableWrap>
            ) : (
              <p className="px-4 py-8 text-center font-sans text-xs text-ink-3">No tool calls recorded yet.</p>
            )}
          </Card>
        </div>
      )}

      {/* Most Expensive & Slowest Runs */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Most Expensive */}
          <Card className="overflow-hidden">
            <CardHeader title="Most expensive runs" icon={<DollarSign className="size-3.5 text-ink-3" aria-hidden />} />
            <ul className="divide-y divide-line">
              {analytics.expensiveRuns.slice(0, 5).map((r) => (
                <li key={r.id}>
                <Link href={`/runs/${r.id}`} className="group flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-tint/[0.03]">
                  <span className="flex min-w-0 items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span className="truncate font-sans text-xs text-ink-2 transition-colors group-hover:text-ink">{r.title}</span>
                    {demo === 'some' && isDemoRunId(r.id) && <Badge tone="warn">Demo</Badge>}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 font-mono tabular-nums">
                    <span className="text-ink font-bold">${r.cost.toFixed(3)}</span>
                    <ArrowUpRight className="size-3 text-ink-3 group-hover:text-accent-ink" aria-hidden />
                  </span>
                </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* Slowest Runs */}
          <Card className="overflow-hidden">
            <CardHeader title="Slowest runs" icon={<Clock className="size-3.5 text-ink-3" aria-hidden />} />
            <ul className="divide-y divide-line">
              {analytics.slowestRuns.slice(0, 5).map((r) => (
                <li key={r.id}>
                <Link href={`/runs/${r.id}`} className="group flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-tint/[0.03]">
                  <span className="flex min-w-0 items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span className="truncate font-sans text-xs text-ink-2 transition-colors group-hover:text-ink">{r.title}</span>
                    {demo === 'some' && isDemoRunId(r.id) && <Badge tone="warn">Demo</Badge>}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 font-mono tabular-nums">
                    <span className="text-ink font-bold">{(r.duration / 1000).toFixed(1)}s</span>
                    <ArrowUpRight className="size-3 text-ink-3 group-hover:text-accent-ink" aria-hidden />
                  </span>
                </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Agent Stats */}
      {analytics && analytics.agentStats.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader title="Agent performance" icon={<Activity className="size-3.5 text-ink-3" aria-hidden />} />
          <TableWrap label="Agent performance table">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className={theadRow}>
                <th scope="col" className={th}>Agent</th>
                <th scope="col" className={`${th} text-right`}>Runs</th>
                <th scope="col" className={`${th} text-right`}>Success Rate</th>
                <th scope="col" className={`${th} text-right`}>Avg Latency</th>
                <th scope="col" className={`${th} text-right`}>Avg Cost</th>
                <th scope="col" className={`${th} text-right`}>Total Cost</th>
                <th scope="col" className={`${th} text-right`}>Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {analytics.agentStats.map((a) => (
                <tr key={a.id} className="hover:bg-tint/[0.02]">
                  <td className={`${td} font-sans font-medium text-ink whitespace-nowrap`}>
                    {a.name}
                    {demo === 'some' && isDemoAgentId(a.id) && <Badge tone="warn" className="ml-2">Demo</Badge>}
                  </td>
                  <td className={tdNum}>{a.runs}</td>
                  <td className={tdNum}>
                    <span className={a.successRate >= 90 ? 'text-ok' : a.successRate >= 70 ? 'text-warn' : 'text-bad'}>
                      {a.successRate}%
                    </span>
                  </td>
                  <td className={tdNum}>{(a.avgLatency / 1000).toFixed(1)}s</td>
                  <td className={tdNum}>${a.avgCost.toFixed(3)}</td>
                  <td className={tdNum}>${a.totalCost.toFixed(3)}</td>
                  <td className={tdNum}>
                    {a.avgQuality !== null ? (
                      <span className={a.avgQuality >= 80 ? 'text-ok' : a.avgQuality >= 60 ? 'text-warn' : 'text-bad'}>
                        {a.avgQuality}
                      </span>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </TableWrap>
        </Card>
      )}
        </>
      )}
    </PageShell>
  );
}
