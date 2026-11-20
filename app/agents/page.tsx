'use client';

import React from 'react';
import Link from 'next/link';
import { Users, ArrowUpRight, RefreshCw, Loader2 } from 'lucide-react';
import TiltCard from '@/components/ui/TiltCard';
import NumberAnimation from '@/components/ui/NumberAnimation';
import { PageShell, PageHeader } from '@/components/ui/Page';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DemoBadge, DemoNotice, EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { useApiData } from '@/lib/useApiData';
import { demoScope, isDemoAgentId } from '@/lib/demo';

interface AgentData {
  id: string;
  name: string;
  framework: string;
  modelFamily: string;
  description?: string;
  runs: number;
  successRate: number;
  avgLatency: number;
  avgCost: number;
  totalCost: number;
  avgTokens: number;
  avgQuality: number | null;
  recentRuns: Array<{ id: string; title: string; status: string; wallClockMs: number; totalCostUsd: number; createdAt: string }>;
}

/**
 * Health score: a weighted blend of success rate (40%), quality (30%),
 * cost (15%) and latency (15%), computed here in the browser.
 */
function getHealthScore(agent: AgentData): { score: number; label: string; color: string } {
  const successComponent = agent.successRate * 0.4;
  const qualityComponent = agent.avgQuality !== null ? agent.avgQuality * 0.3 : agent.successRate * 0.3;
  const costComponent = Math.max(0, 100 - (agent.avgCost * 500)) * 0.15;
  const latencyComponent = Math.max(0, 100 - (agent.avgLatency / 1000)) * 0.15;
  const score = Math.round(Math.min(100, Math.max(0, successComponent + qualityComponent + costComponent + latencyComponent)));

  if (score >= 85) return { score, label: 'Excellent', color: 'text-ok' };
  if (score >= 70) return { score, label: 'Good', color: 'text-accent-ink' };
  if (score >= 50) return { score, label: 'Fair', color: 'text-warn' };
  return { score, label: 'Needs attention', color: 'text-bad' };
}

function Stat({ label, children, className = 'text-ink' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="bg-inset px-3 py-2.5 text-center">
      <dt className="font-mono text-2xs font-semibold uppercase text-ink-3">{label}</dt>
      <dd className={`mt-0.5 font-mono text-sm font-bold tabular-nums ${className}`}>{children}</dd>
    </div>
  );
}

export default function AgentsPage() {
  const { data, loading, error, reload } = useApiData<AgentData[]>(
    '/api/v1/agents',
    (json) => (Array.isArray(json.agents) ? json.agents : [])
  );
  const agents = data ?? [];
  const demo = demoScope(agents, (a) => isDemoAgentId(a.id));

  return (
    <PageShell>
      <PageHeader
        title="Agents"
        badge={demo !== 'none' ? <DemoBadge scope={demo} /> : undefined}
        description="Health, reliability and cost for each agent, computed from its runs."
        actions={
          <>
            {!loading && !error && (
              <span className="font-mono text-2xs text-ink-2">
                {agents.length} {agents.length === 1 ? 'agent' : 'agents'}
              </span>
            )}
            <Button onClick={reload} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
              Refresh
            </Button>
          </>
        }
      />

      <DemoNotice scope={demo} what="agents" />

      {loading ? (
        <LoadingBlock label="Loading agents…" />
      ) : error ? (
        <ErrorState title="Could not load agents" message={error} onRetry={reload} />
      ) : agents.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No agents yet"
          action={<ButtonLink href="/settings" variant="primary">Set up the SDK</ButtonLink>}
        >
          An agent is registered automatically the first time it sends a run through the SDK.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {agents.map((agent) => {
            const health = getHealthScore(agent);
            return (
              <TiltCard key={agent.id} maxTilt={3}>
                <div className="border-b border-line px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10">
                        <Users className="size-4 text-accent-ink" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h2 className="flex flex-wrap items-center gap-2 font-sans text-sm font-semibold text-ink">
                          <span className="truncate">{agent.name}</span>
                          {demo === 'some' && isDemoAgentId(agent.id) && <Badge tone="warn">Demo</Badge>}
                        </h2>
                        <p className="truncate font-mono text-2xs uppercase text-ink-3">{agent.framework} · {agent.modelFamily}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right" title="Health score out of 100: success rate 40%, quality 30%, cost 15%, latency 15%">
                      <div className={`font-mono text-xl font-bold tabular-nums ${health.color}`}>
                        <NumberAnimation value={health.score} />
                        <span className="sr-only"> out of 100 health score</span>
                      </div>
                      <div className={`font-mono text-2xs font-semibold uppercase ${health.color}`}>{health.label}</div>
                    </div>
                  </div>
                  {agent.description && (
                    <p className="mt-2 font-sans text-xs leading-relaxed text-ink-2">{agent.description}</p>
                  )}
                </div>

                {/* gap-px over a line-coloured background draws the dividers in both 2- and 4-column layouts */}
                <dl className="grid grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-4">
                  <Stat label="Runs"><NumberAnimation value={agent.runs} /></Stat>
                  <Stat label="Success" className={agent.successRate >= 90 ? 'text-ok' : agent.successRate >= 70 ? 'text-warn' : 'text-bad'}>
                    <NumberAnimation value={agent.successRate} suffix="%" />
                  </Stat>
                  <Stat label="Avg latency"><NumberAnimation value={agent.avgLatency / 1000} decimals={1} suffix="s" /></Stat>
                  <Stat label="Avg cost"><NumberAnimation value={agent.avgCost} prefix="$" decimals={3} /></Stat>
                </dl>

                {agent.recentRuns.length > 0 && (
                  <ul className="divide-y divide-line">
                    {agent.recentRuns.slice(0, 3).map((run) => (
                      <li key={run.id}>
                        <Link href={`/runs/${run.id}`} className="group flex items-center justify-between gap-3 px-4 py-2 transition-colors hover:bg-tint/[0.03]">
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              aria-hidden
                              className={`inline-block size-1.5 shrink-0 rounded-full ${run.status === 'failed' ? 'bg-red-400' : run.status === 'running' ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'}`}
                            />
                            <span className="sr-only">{run.status}: </span>
                            <span className="truncate font-sans text-xs font-medium text-ink-2 group-hover:text-ink">{run.title}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2.5 font-mono text-2xs text-ink-3">
                            <span>{(run.wallClockMs / 1000).toFixed(1)}s</span>
                            <span className="font-semibold text-ink-2">${run.totalCostUsd.toFixed(3)}</span>
                            <ArrowUpRight className="size-3 text-accent-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </TiltCard>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
