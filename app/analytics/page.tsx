'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Clock, Zap,
  CheckCircle2, XCircle, Loader2, Activity, Cpu, Wrench, AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

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

function KpiCard({ label, value, subValue, icon: Icon, color = 'text-white' }: { label: string; value: string; subValue?: string; icon: any; color?: string }) {
  return (
    <div className="border border-white/[0.07] rounded-lg bg-[#121217] p-4 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider font-mono">{label}</span>
        <Icon className="h-3.5 w-3.5 text-zinc-600" />
      </div>
      <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
      {subValue && <div className="text-[11px] text-zinc-500 font-mono">{subValue}</div>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="border border-white/[0.07] rounded-lg bg-[#121217] p-4 space-y-2 animate-pulse">
      <div className="h-3 w-20 bg-zinc-800 rounded" />
      <div className="h-6 w-16 bg-zinc-800 rounded" />
      <div className="h-3 w-24 bg-zinc-800 rounded" />
    </div>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
        const res = await fetch(`${apiBase}/api/v1/analytics`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load analytics');
        const data = await res.json();
        setAnalytics(data.analytics);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (error) {
    return (
      <div className="w-full min-h-[calc(100vh-2.75rem)] bg-[#08080A] flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
          <h2 className="text-sm font-bold text-white">Unable to load analytics</h2>
          <p className="text-xs text-zinc-400">{error}</p>
          <button onClick={() => window.location.reload()} className="linear-btn">Retry</button>
        </div>
      </div>
    );
  }

  const kpis = analytics?.kpis;

  return (
    <div className="w-full min-h-[calc(100vh-2.75rem)] bg-[#08080A] px-4 py-3 space-y-4 font-mono text-xs">
      
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-white/[0.07] pb-2.5">
        <div>
          <h1 className="text-xl font-bold text-white font-sans tracking-tight uppercase">Analytics</h1>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">Performance metrics and operational insights across all agent executions.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
        ) : kpis ? (
          <>
            <KpiCard label="Total Runs" value={kpis.totalRuns.toLocaleString()} icon={Activity} />
            <KpiCard
              label="Success Rate"
              value={`${kpis.successRate}%`}
              subValue={`${kpis.successfulRuns} successful`}
              icon={CheckCircle2}
              color={kpis.successRate >= 90 ? 'text-emerald-400' : kpis.successRate >= 70 ? 'text-amber-400' : 'text-red-400'}
            />
            <KpiCard
              label="Failure Rate"
              value={`${kpis.failureRate}%`}
              subValue={`${kpis.failedRuns} failed`}
              icon={XCircle}
              color={kpis.failureRate <= 10 ? 'text-emerald-400' : kpis.failureRate <= 25 ? 'text-amber-400' : 'text-red-400'}
            />
            <KpiCard
              label="Avg Latency"
              value={`${(kpis.avgLatency / 1000).toFixed(1)}s`}
              subValue={`P95: ${(kpis.p95Latency / 1000).toFixed(1)}s`}
              icon={Clock}
            />
            <KpiCard
              label="P99 Latency"
              value={`${(kpis.p99Latency / 1000).toFixed(1)}s`}
              icon={Clock}
              color="text-zinc-300"
            />
            <KpiCard
              label="Total Tokens"
              value={kpis.totalTokens >= 1000000 ? `${(kpis.totalTokens / 1000000).toFixed(1)}M` : `${(kpis.totalTokens / 1000).toFixed(0)}K`}
              subValue={`Avg: ${kpis.avgTokens.toLocaleString()}/run`}
              icon={Zap}
            />
            <KpiCard
              label="Avg Tokens"
              value={kpis.avgTokens.toLocaleString()}
              icon={Zap}
              color="text-zinc-300"
            />
            <KpiCard
              label="Total Cost"
              value={`$${kpis.totalCost.toFixed(2)}`}
              subValue={`Avg: $${kpis.avgCost.toFixed(4)}/run`}
              icon={DollarSign}
              color="text-emerald-400"
            />
            <KpiCard
              label="Avg Cost"
              value={`$${kpis.avgCost.toFixed(4)}`}
              icon={DollarSign}
              color="text-emerald-400"
            />
            {kpis.avgQuality !== null && (
              <KpiCard
                label="Avg Quality"
                value={`${kpis.avgQuality}`}
                subValue="PathFlow composite score"
                icon={BarChart3}
                color={kpis.avgQuality >= 80 ? 'text-emerald-400' : kpis.avgQuality >= 60 ? 'text-amber-400' : 'text-red-400'}
              />
            )}
          </>
        ) : null}
      </div>

      {/* Model Usage & Tool Performance */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Model Usage */}
          <div className="border border-white/[0.07] rounded-lg bg-[#121217] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.07] flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-blue-400" />
              <h3 className="text-xs font-bold text-white font-sans uppercase">Model Usage</h3>
            </div>
            {analytics.modelUsage.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.07] text-[10px] text-zinc-500 uppercase font-bold">
                    <th className="text-left px-4 py-2">Model</th>
                    <th className="text-right px-4 py-2">Runs</th>
                    <th className="text-right px-4 py-2">Tokens</th>
                    <th className="text-right px-4 py-2">Cost</th>
                    <th className="text-right px-4 py-2">Avg Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {analytics.modelUsage.map((m) => (
                    <tr key={m.model} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-white font-semibold">{m.model}</td>
                      <td className="px-4 py-2.5 text-right text-zinc-300 font-mono">{m.runs}</td>
                      <td className="px-4 py-2.5 text-right text-zinc-300 font-mono">{m.tokens.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-400 font-mono font-bold">${m.cost.toFixed(3)}</td>
                      <td className="px-4 py-2.5 text-right text-zinc-300 font-mono">{(m.avgLatency / 1000).toFixed(1)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-8 text-center text-zinc-500 text-xs">No model data available yet.</div>
            )}
          </div>

          {/* Tool Performance */}
          <div className="border border-white/[0.07] rounded-lg bg-[#121217] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.07] flex items-center gap-2">
              <Wrench className="h-3.5 w-3.5 text-amber-400" />
              <h3 className="text-xs font-bold text-white font-sans uppercase">Tool Performance</h3>
            </div>
            {analytics.toolUsage.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.07] text-[10px] text-zinc-500 uppercase font-bold">
                    <th className="text-left px-4 py-2">Tool</th>
                    <th className="text-right px-4 py-2">Calls</th>
                    <th className="text-right px-4 py-2">Success</th>
                    <th className="text-right px-4 py-2">Avg Latency</th>
                    <th className="text-right px-4 py-2">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {analytics.toolUsage.map((t) => (
                    <tr key={t.tool} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-white font-semibold truncate max-w-[200px]">{t.tool}</td>
                      <td className="px-4 py-2.5 text-right text-zinc-300 font-mono">{t.calls}</td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        <span className={t.successRate >= 90 ? 'text-emerald-400' : t.successRate >= 70 ? 'text-amber-400' : 'text-red-400'}>
                          {t.successRate}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-zinc-300 font-mono">{t.avgLatency < 1000 ? `${t.avgLatency}ms` : `${(t.avgLatency / 1000).toFixed(1)}s`}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-400 font-mono">${t.totalCost.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-8 text-center text-zinc-500 text-xs">No tool data available yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Most Expensive & Slowest Runs */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Most Expensive */}
          <div className="border border-white/[0.07] rounded-lg bg-[#121217] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.07] flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              <h3 className="text-xs font-bold text-white font-sans uppercase">Most Expensive Runs</h3>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {analytics.expensiveRuns.slice(0, 5).map((r) => (
                <Link key={r.id} href={`/runs/${r.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`inline-block text-[9px] font-bold px-1 py-0.5 rounded border uppercase ${r.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {r.status === 'failed' ? 'FAIL' : 'OK'}
                    </span>
                    <span className="text-zinc-300 text-xs truncate group-hover:text-white transition-colors">{r.title}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 font-mono">
                    <span className="text-emerald-400 font-bold">${r.cost.toFixed(3)}</span>
                    <ArrowUpRight className="h-3 w-3 text-zinc-600 group-hover:text-blue-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Slowest Runs */}
          <div className="border border-white/[0.07] rounded-lg bg-[#121217] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.07] flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <h3 className="text-xs font-bold text-white font-sans uppercase">Slowest Runs</h3>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {analytics.slowestRuns.slice(0, 5).map((r) => (
                <Link key={r.id} href={`/runs/${r.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`inline-block text-[9px] font-bold px-1 py-0.5 rounded border uppercase ${r.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {r.status === 'failed' ? 'FAIL' : 'OK'}
                    </span>
                    <span className="text-zinc-300 text-xs truncate group-hover:text-white transition-colors">{r.title}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 font-mono">
                    <span className="text-white font-bold">{(r.duration / 1000).toFixed(1)}s</span>
                    <ArrowUpRight className="h-3 w-3 text-zinc-600 group-hover:text-blue-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Agent Stats */}
      {analytics && analytics.agentStats.length > 0 && (
        <div className="border border-white/[0.07] rounded-lg bg-[#121217] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.07] flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-blue-400" />
            <h3 className="text-xs font-bold text-white font-sans uppercase">Agent Performance</h3>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.07] text-[10px] text-zinc-500 uppercase font-bold">
                <th className="text-left px-4 py-2">Agent</th>
                <th className="text-right px-4 py-2">Runs</th>
                <th className="text-right px-4 py-2">Success Rate</th>
                <th className="text-right px-4 py-2">Avg Latency</th>
                <th className="text-right px-4 py-2">Avg Cost</th>
                <th className="text-right px-4 py-2">Total Cost</th>
                <th className="text-right px-4 py-2">Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {analytics.agentStats.map((a) => (
                <tr key={a.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-white font-semibold">{a.name}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-300 font-mono">{a.runs}</td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    <span className={a.successRate >= 90 ? 'text-emerald-400' : a.successRate >= 70 ? 'text-amber-400' : 'text-red-400'}>
                      {a.successRate}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-zinc-300 font-mono">{(a.avgLatency / 1000).toFixed(1)}s</td>
                  <td className="px-4 py-2.5 text-right text-emerald-400 font-mono">${a.avgCost.toFixed(3)}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-300 font-mono">${a.totalCost.toFixed(3)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {a.avgQuality !== null ? (
                      <span className={a.avgQuality >= 80 ? 'text-emerald-400' : a.avgQuality >= 60 ? 'text-amber-400' : 'text-red-400'}>
                        {a.avgQuality}
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
