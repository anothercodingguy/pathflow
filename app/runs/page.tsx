'use client';

import React, { useState, useEffect } from 'react';
import { PathData, formatCurrency, CurrencyMode, fetchRunsFromApi } from '@/lib/data';
import { Search, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Terminal } from 'lucide-react';
import Link from 'next/link';

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
    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function RunsPage() {
  const [runs, setRuns] = useState<PathData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'FAILED'>('ALL');
  const [currency, setCurrency] = useState<CurrencyMode>('USD');
  const [isLoading, setIsLoading] = useState(true);

  const loadRuns = async () => {
    setIsLoading(true);
    const data = await fetchRunsFromApi(searchQuery, statusFilter);
    setRuns(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRuns();
  }, [searchQuery, statusFilter]);

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

  return (
    <div className="w-full min-h-[calc(100vh-2.5rem)] bg-[#08080A] px-4 py-3 space-y-3 font-mono">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E1E24] pb-2.5">
        <div className="flex items-center gap-3">
          <h1 className="text-dev-title text-white font-sans uppercase">Runs</h1>
          <span className="text-xs text-zinc-500 font-mono">
            {isLoading ? 'Loading execution traces...' : `Last 24h • ${runs.length} runs recorded`}
          </span>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadRuns}
            className="p-1.5 rounded border border-[#1E1E24] bg-[#0F0F12] text-zinc-400 hover:text-white transition-colors"
            title="Refresh Execution Runs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search runs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded border border-[#1E1E24] bg-[#0F0F12] pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none font-mono w-64"
            />
          </div>

          <div className="flex items-center gap-1 border border-[#1E1E24] rounded bg-[#0F0F12] p-0.5 text-[11px]">
            {(['ALL', 'COMPLETED', 'FAILED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  statusFilter === st
                    ? 'bg-[#16161A] text-white font-bold border border-[#1E1E24]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. LangSmith / Linear Style Runs Table */}
      <div className="w-full border border-[#1E1E24] rounded overflow-hidden bg-[#08080A]">
        {runs.length > 0 ? (
          <div className="w-full overflow-x-auto scrollbar-none">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-[#1E1E24] bg-[#0F0F12] text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">Status</th>
                  <th className="py-2.5 px-3 min-w-[240px]">Run Title & Execution Route</th>
                  <th className="py-2.5 px-3 w-36">Model</th>
                  <th className="py-2.5 px-3 w-20 font-telemetry">Latency</th>
                  <th className="py-2.5 px-3 w-20 font-telemetry">Tokens</th>
                  <th className="py-2.5 px-3 w-24 font-telemetry">Cost ({currency})</th>
                  <th className="py-2.5 px-3 w-28 font-telemetry">Velocity</th>
                  <th className="py-2.5 px-3 w-20 font-telemetry text-right">Age</th>
                  <th className="py-2.5 px-3 w-36 text-right pr-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1E1E24] text-xs">
                {runs.map((run) => {
                  const isFailed = run.status.toUpperCase() === 'FAILED';

                  return (
                    <tr
                      key={run.id}
                      className="group hover:bg-[#121215] transition-colors"
                    >
                      <td className="py-3 px-3 align-top text-center">
                        <div className="flex justify-center pt-0.5">
                          {isFailed ? (
                            <span className="text-red-400" title="Execution Failed">
                              <AlertTriangle className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="text-emerald-400" title="Execution Success">
                              <CheckCircle2 className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 align-top">
                        <Link
                          href={`/runs/${run.id}`}
                          className="font-semibold text-white group-hover:text-blue-400 transition-colors text-sm font-sans block truncate max-w-md"
                        >
                          {run.title}
                        </Link>

                        <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-400 overflow-x-auto scrollbar-none">
                          <span className="text-zinc-600 font-mono">├─</span>
                          {run.spans && run.spans.length > 0 ? (
                            run.spans.map((span, idx) => (
                              <React.Fragment key={span.id || span.spanId}>
                                <span className={`px-1.5 py-0.2 rounded border text-[10px] font-mono whitespace-nowrap ${
                                  span.status === 'FAILED'
                                    ? 'border-red-500/40 bg-red-500/10 text-red-400 font-bold'
                                    : 'border-[#1E1E24] bg-[#08080A] text-zinc-300'
                                }`}>
                                  [{span.type}]
                                </span>
                                {idx < run.spans.length - 1 && (
                                  <span className="text-zinc-600 text-[10px] shrink-0">──</span>
                                )}
                              </React.Fragment>
                            ))
                          ) : (
                            <span className="text-zinc-600 text-[10px]">[LLMCall]</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 align-top font-mono text-zinc-300 whitespace-nowrap">
                        {run.modelFamily}
                      </td>

                      <td className="py-3 px-3 align-top font-telemetry font-bold text-white whitespace-nowrap">
                        {(run.durationMs / 1000).toFixed(1)} s
                      </td>

                      <td className="py-3 px-3 align-top font-telemetry text-zinc-300 whitespace-nowrap">
                        {(run.tokens / 1000).toFixed(1)}k
                      </td>

                      <td className="py-3 px-3 align-top font-telemetry font-bold text-emerald-400 whitespace-nowrap">
                        {formatCurrency(run.cost, currency)}
                      </td>

                      <td className="py-3 px-3 align-top font-telemetry text-blue-400 whitespace-nowrap">
                        {run.tps} tok/s
                      </td>

                      <td className="py-3 px-3 align-top font-telemetry text-zinc-500 text-right whitespace-nowrap">
                        {formatAge(run.createdAt)}
                      </td>

                      <td className="py-3 px-3 align-top text-right whitespace-nowrap pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/compare?left=${run.id}`}
                            className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                          >
                            Compare
                          </Link>
                          <Link
                            href={`/runs/${run.id}`}
                            className="linear-btn"
                          >
                            Inspect <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Automatic Tracing Empty State */
          <div className="p-8 text-center space-y-3 bg-[#0F0F12]">
            <Terminal className="h-6 w-6 text-zinc-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Traces Captured Yet</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Run your AI agent script wrapped with <code className="text-blue-400 bg-[#08080A] px-1 py-0.5 rounded">@pf.trace()</code> to automatically capture execution telemetry.
            </p>
            <div className="pt-2">
              <code className="inline-block rounded bg-[#08080A] border border-[#1E1E24] px-3 py-1.5 text-xs text-zinc-300 font-mono">
                python main.py
              </code>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
