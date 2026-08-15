'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PathData, formatCurrency, CurrencyMode, fetchRunsFromApi } from '@/lib/data';
import {
  Search, CheckCircle2, AlertTriangle, RefreshCw, Terminal,
  Loader2, BarChart3, ArrowUpRight, XCircle, Clock, DollarSign, Zap, X
} from 'lucide-react';
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
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="py-3 px-4"><div className="h-4 w-10 bg-zinc-800 rounded mx-auto" /></td>
      <td className="py-3 px-4"><div className="h-4 w-48 bg-zinc-800 rounded" /></td>
      <td className="py-3 px-4"><div className="h-4 w-20 bg-zinc-800 rounded" /></td>
      <td className="py-3 px-4"><div className="h-4 w-16 bg-zinc-800 rounded" /></td>
      <td className="py-3 px-4"><div className="h-4 w-12 bg-zinc-800 rounded ml-auto" /></td>
      <td className="py-3 px-4"><div className="h-4 w-14 bg-zinc-800 rounded ml-auto" /></td>
      <td className="py-3 px-4"><div className="h-4 w-12 bg-zinc-800 rounded ml-auto" /></td>
      <td className="py-3 px-4"><div className="h-4 w-10 bg-zinc-800 rounded ml-auto" /></td>
      <td className="py-3 px-4"><div className="h-4 w-14 bg-zinc-800 rounded ml-auto" /></td>
    </tr>
  );
}

export default function RunsPage() {
  const [runs, setRuns] = useState<PathData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'completed' | 'failed'>('ALL');
  const [modelFilter, setModelFilter] = useState<string>('ALL');
  const [frameworkFilter, setFrameworkFilter] = useState<string>('ALL');
  const [minDurationFilter, setMinDurationFilter] = useState<number>(0);
  const [currency, setCurrency] = useState<CurrencyMode>('USD');
  const [isLoading, setIsLoading] = useState(true);

  // Read URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setSearchQuery(q);
  }, []);

  const loadRuns = async () => {
    setIsLoading(true);
    const data = await fetchRunsFromApi('', statusFilter === 'ALL' ? '' : statusFilter);
    setRuns(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRuns();
  }, [statusFilter]);

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

  // Compute summary stats
  const totalRuns = filteredRuns.length;
  const failedCount = filteredRuns.filter(r => r.status.toUpperCase() === 'FAILED').length;
  const successCount = filteredRuns.filter(r => r.status.toUpperCase() === 'COMPLETED').length;
  const totalCost = filteredRuns.reduce((a, r) => a + r.cost, 0);

  // Available models/frameworks for filters
  const availableModels = [...new Set(runs.map(r => r.modelFamily))];
  const availableFrameworks = [...new Set(runs.map(r => r.agent?.framework || 'Custom'))];

  return (
    <div className="w-full min-h-[calc(100vh-2.75rem)] bg-[#08080A] px-4 py-3 space-y-3 font-mono">
      
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-white/[0.07] pb-2.5">
        <div>
          <h1 className="text-xl font-bold text-white font-sans tracking-tight">Runs</h1>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            {isLoading ? 'Loading execution traces...' : `${totalRuns} traces • ${successCount} passed • ${failedCount} failed • $${totalCost.toFixed(2)} total cost`}
          </p>
        </div>
        <button
          onClick={loadRuns}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/[0.07] bg-[#121217] text-zinc-400 text-[11px] font-mono hover:text-white transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-[#121217] border border-white/[0.07] rounded-lg p-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by title, agent, error, ID... (status:error, cost>0.05)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0C0C0F] border border-white/[0.07] rounded-md pl-8 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-0.5 bg-[#0C0C0F] border border-white/[0.07] rounded-md p-0.5">
          {[
            { value: 'ALL' as const, label: 'All' },
            { value: 'completed' as const, label: 'Passed' },
            { value: 'failed' as const, label: 'Failed' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                statusFilter === value ? 'bg-white/[0.07] text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Model */}
        <select
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
          className="bg-[#0C0C0F] border border-white/[0.07] text-zinc-300 rounded-md px-2 py-1.5 text-[10px] focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Models</option>
          {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        {/* Framework */}
        <select
          value={frameworkFilter}
          onChange={(e) => setFrameworkFilter(e.target.value)}
          className="bg-[#0C0C0F] border border-white/[0.07] text-zinc-300 rounded-md px-2 py-1.5 text-[10px] focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Frameworks</option>
          {availableFrameworks.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {/* Duration */}
        <select
          value={minDurationFilter}
          onChange={(e) => setMinDurationFilter(parseInt(e.target.value, 10))}
          className="bg-[#0C0C0F] border border-white/[0.07] text-zinc-300 rounded-md px-2 py-1.5 text-[10px] focus:outline-none focus:border-blue-500"
        >
          <option value="0">All Durations</option>
          <option value="5000">&gt; 5s</option>
          <option value="15000">&gt; 15s</option>
          <option value="30000">&gt; 30s</option>
        </select>
      </div>

      {/* Table */}
      <div className="w-full border border-white/[0.07] rounded-lg overflow-hidden bg-[#121217]">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/[0.07] bg-[#0C0C0F] text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono">
                <th className="py-2 px-4 w-14 text-center">Status</th>
                <th className="py-2 px-4 min-w-[240px]">Trace</th>
                <th className="py-2 px-4 w-28">Agent</th>
                <th className="py-2 px-4 w-32">Model</th>
                <th className="py-2 px-4 w-20 text-right">Duration</th>
                <th className="py-2 px-4 w-20 text-right">Tokens</th>
                <th className="py-2 px-4 w-20 text-right">Cost</th>
                <th className="py-2 px-4 w-16 text-right">Quality</th>
                <th className="py-2 px-4 w-20 text-right pr-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredRuns.length > 0 ? (
                filteredRuns.map((run) => {
                  const isFailed = run.status.toUpperCase() === 'FAILED';
                  return (
                    <tr key={run.id} className="group hover:bg-white/[0.02] cursor-pointer transition-colors">
                      <td className="py-2.5 px-4 text-center">
                        {isFailed ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-red-500/10">
                            <XCircle className="h-3 w-3 text-red-400" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-500/10">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-4">
                        <Link href={`/runs/${run.id}`} className="block group/link">
                          <span className="font-semibold text-white group-hover/link:text-blue-400 transition-colors text-[11px] font-sans truncate block max-w-[300px]">
                            {run.title}
                          </span>
                          {run.error && (
                            <span className="text-[10px] text-red-400/60 truncate block max-w-[300px]">{run.error.substring(0, 60)}...</span>
                          )}
                        </Link>
                      </td>

                      <td className="py-2.5 px-4 text-zinc-400 text-[11px]">
                        {run.agent?.name || '—'}
                      </td>

                      <td className="py-2.5 px-4 text-zinc-300 text-[11px]">
                        {run.modelFamily}
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono text-white text-[11px]">
                        {run.durationMs < 1000 ? `${run.durationMs}ms` : `${(run.durationMs / 1000).toFixed(1)}s`}
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono text-zinc-300 text-[11px]">
                        {run.tokens >= 1000 ? `${(run.tokens / 1000).toFixed(0)}K` : run.tokens}
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono text-emerald-400 font-bold text-[11px]">
                        {run.cost > 0 ? formatCurrency(run.cost, currency) : <span className="text-zinc-600 font-normal">—</span>}
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono text-[11px]">
                        {run.qualityScore != null ? (
                          <span className={
                            run.qualityScore >= 80 ? 'text-emerald-400' :
                            run.qualityScore >= 60 ? 'text-amber-400' :
                            'text-red-400'
                          }>
                            {run.qualityScore}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-right text-zinc-500 text-[10px] pr-4">
                        {formatAge(run.createdAt)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <Terminal className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
                    <h3 className="text-xs font-bold text-white font-sans">No Matching Traces</h3>
                    <p className="text-[11px] text-zinc-500 mt-1 max-w-sm mx-auto">
                      {searchQuery ? 'Try adjusting your search criteria.' : 'Ingest traces via the SDK to see them here.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
