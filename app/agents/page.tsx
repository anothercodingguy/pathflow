'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Activity, CheckCircle2, Clock, DollarSign, Zap,
  Loader2, AlertTriangle, ArrowUpRight, ChevronRight, BarChart3, ShieldCheck
} from 'lucide-react';
import TiltCard from '@/components/ui/TiltCard';
import NumberAnimation from '@/components/ui/NumberAnimation';
import LoadingState from '@/components/ui/LoadingState';
import { MOCK_AGENTS } from '@/lib/mockData';

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

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentData[]>(MOCK_AGENTS as any);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadAgents() {
      try {
        const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
        const res = await fetch(`${apiBase}/api/v1/agents`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.agents && data.agents.length > 0) {
            setAgents(data.agents);
          }
        }
      } catch (err) {
        console.warn('Failed to load agents, using mock data fallback:', err);
      }
    }
    loadAgents();
  }, []);


  function getHealthScore(agent: AgentData): { score: number; label: string; color: string } {
    const successComponent = agent.successRate * 0.4;
    const qualityComponent = agent.avgQuality !== null ? agent.avgQuality * 0.3 : agent.successRate * 0.3;
    const costComponent = Math.max(0, 100 - (agent.avgCost * 500)) * 0.15;
    const latencyComponent = Math.max(0, 100 - (agent.avgLatency / 1000)) * 0.15;
    const score = Math.round(Math.min(100, Math.max(0, successComponent + qualityComponent + costComponent + latencyComponent)));
    
    if (score >= 85) return { score, label: 'Excellent', color: 'text-emerald-400' };
    if (score >= 70) return { score, label: 'Good', color: 'text-blue-400' };
    if (score >= 50) return { score, label: 'Fair', color: 'text-amber-400' };
    return { score, label: 'Needs Attention', color: 'text-red-400' };
  }

  return (
    <div className="w-full min-h-[calc(100vh-2.75rem)] bg-[#08080A] px-4 py-4 space-y-4 font-mono text-xs">
      
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-white/[0.07] pb-3">
        <div>
          <h1 className="text-xl font-bold text-white font-sans tracking-tight uppercase">Agents</h1>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">Agent health, runtime reliability, and live execution metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <NumberAnimation value={agents.length} /> registered agents
          </span>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <LoadingState label="Computing agent health indices & execution matrices…" variant="Drive" />
          <span className="text-zinc-500 text-xs font-mono">Aggregating telemetry across all agent frameworks</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && agents.length === 0 && (
        <div className="border border-white/[0.07] rounded-2xl bg-[#111115] py-20 text-center">
          <Users className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white font-sans">No agents yet</h3>
          <p className="text-xs text-zinc-400 mt-1">Agents are automatically registered when runs are ingested via the SDK.</p>
        </div>
      )}

      {/* Agent Cards */}
      {!isLoading && agents.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {agents.map((agent) => {
            const health = getHealthScore(agent);
            return (
              <TiltCard key={agent.id} maxTilt={6} className="bg-[#111115] border-white/10">
                {/* Agent Header */}
                <div className="px-4 py-3.5 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Users className="h-4.5 w-4.5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white font-sans">{agent.name}</h3>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase">{agent.framework} • {agent.modelFamily}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold font-mono ${health.color}`}>
                        <NumberAnimation value={health.score} />
                      </div>
                      <div className={`text-[10px] font-mono uppercase font-semibold ${health.color}`}>{health.label}</div>
                    </div>
                  </div>
                  {agent.description && (
                    <p className="text-xs text-zinc-400 font-sans mt-2 leading-relaxed">{agent.description}</p>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 divide-x divide-white/[0.05] border-b border-white/[0.06] bg-[#0C0C0F]/60">
                  <div className="px-3 py-2.5 text-center">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Runs</div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">
                      <NumberAnimation value={agent.runs} />
                    </div>
                  </div>
                  <div className="px-3 py-2.5 text-center">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Success</div>
                    <div className={`text-sm font-bold font-mono mt-0.5 ${agent.successRate >= 90 ? 'text-emerald-400' : agent.successRate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                      <NumberAnimation value={agent.successRate} suffix="%" />
                    </div>
                  </div>
                  <div className="px-3 py-2.5 text-center">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Avg Latency</div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">
                      <NumberAnimation value={agent.avgLatency / 1000} decimals={1} suffix="s" />
                    </div>
                  </div>
                  <div className="px-3 py-2.5 text-center">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Avg Cost</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                      <NumberAnimation value={agent.avgCost} prefix="$" decimals={3} />
                    </div>
                  </div>
                </div>

                {/* Recent Runs */}
                {agent.recentRuns.length > 0 && (
                  <div className="divide-y divide-white/[0.04] bg-[#09090C]/40">
                    {agent.recentRuns.slice(0, 3).map((run) => (
                      <Link key={run.id} href={`/runs/${run.id}`} className="flex items-center justify-between px-4 py-2 hover:bg-white/[0.03] transition-colors group">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${run.status === 'failed' ? 'bg-red-400' : run.status === 'running' ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'}`} />
                          <span className="text-[11px] text-zinc-300 truncate group-hover:text-white font-sans font-medium">{run.title.replace('', '')}</span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0 text-[10px] text-zinc-500 font-mono">
                          <span>{(run.wallClockMs / 1000).toFixed(1)}s</span>
                          <span className="text-emerald-400 font-semibold">${run.totalCostUsd.toFixed(3)}</span>
                          <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </TiltCard>
            );
          })}
        </div>
      )}

    </div>
  );
}

