'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PathData, formatCurrency, CurrencyMode, fetchRunsFromApi } from '@/lib/data';
import { Search, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Terminal, Filter } from 'lucide-react';
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
  const [modelFilter, setModelFilter] = useState<string>('ALL');
  const [frameworkFilter, setFrameworkFilter] = useState<string>('ALL');
  const [minCostFilter, setMinCostFilter] = useState<number>(0);
  const [minDurationFilter, setMinDurationFilter] = useState<number>(0);

  const [currency, setCurrency] = useState<CurrencyMode>('USD');
  const [isLoading, setIsLoading] = useState(true);

  const loadRuns = async () => {
    setIsLoading(true);
    const data = await fetchRunsFromApi('', statusFilter);
    setRuns(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRuns();
  }, [statusFilter]);

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

  // Advanced Search Syntax Parsing & Client Filtering
  const filteredRuns = useMemo(() => {
    return runs.filter(run => {
      const q = searchQuery.toLowerCase().trim();

      // Syntax Parsing: status:error / status:failed / status:ok
      if (q.includes('status:error') || q.includes('status:failed')) {
        if (run.status.toUpperCase() !== 'FAILED') return false;
      } else if (q.includes('status:ok') || q.includes('status:completed')) {
        if (run.status.toUpperCase() !== 'COMPLETED') return false;
      }

      // Syntax Parsing: model:claude / model:gpt-4o
      const modelMatch = q.match(/model:([a-z0-9.-]+)/);
      if (modelMatch && modelMatch[1]) {
        if (!run.modelFamily.toLowerCase().includes(modelMatch[1])) return false;
      }

      // Syntax Parsing: framework:langchain / framework:crewai
      const frameworkMatch = q.match(/framework:([a-z0-9.-]+)/);
      if (frameworkMatch && frameworkMatch[1]) {
        if (!(run.agent?.framework || 'custom').toLowerCase().includes(frameworkMatch[1])) return false;
      }

      // Syntax Parsing: duration>5000 / duration>1000
      const durationMatch = q.match(/duration>(\d+)/);
      if (durationMatch && durationMatch[1]) {
        const minMs = parseInt(durationMatch[1], 10);
        if (run.durationMs < minMs) return false;
      }

      // Syntax Parsing: cost>0.05
      const costMatch = q.match(/cost>([\d.]+)/);
      if (costMatch && costMatch[1]) {
        const minCost = parseFloat(costMatch[1]);
        if (run.cost < minCost) return false;
      }

      // Syntax Parsing: tokens>20000
      const tokensMatch = q.match(/tokens>(\d+)/);
      if (tokensMatch && tokensMatch[1]) {
        const minTok = parseInt(tokensMatch[1], 10);
        if (run.tokens < minTok) return false;
      }

      // General Text Match (excluding parsed tokens)
      const cleanSearch = q
        .replace(/status:[a-z]+/g, '')
        .replace(/model:[a-z0-9.-]+/g, '')
        .replace(/framework:[a-z0-9.-]+/g, '')
        .replace(/duration>\d+/g, '')
        .replace(/cost>[\d.]+/g, '')
        .replace(/tokens>\d+/g, '')
        .trim();

      if (cleanSearch) {
        const titleMatch = run.title.toLowerCase().includes(cleanSearch);
        const descMatch = (run.description || '').toLowerCase().includes(cleanSearch);
        const agentMatch = (run.agent?.name || '').toLowerCase().includes(cleanSearch);
        if (!titleMatch && !descMatch && !agentMatch) return false;
      }

      // Dropdown UI Filters
      if (modelFilter !== 'ALL' && run.modelFamily !== modelFilter) return false;
      if (frameworkFilter !== 'ALL' && (run.agent?.framework || 'Custom') !== frameworkFilter) return false;
      if (minCostFilter > 0 && run.cost < minCostFilter) return false;
      if (minDurationFilter > 0 && run.durationMs < minDurationFilter) return false;

      return true;
    });
  }, [runs, searchQuery, modelFilter, frameworkFilter, minCostFilter, minDurationFilter]);

  return (
    <div className="w-full min-h-[calc(100vh-2.5rem)] bg-[#08080A] px-4 py-3 space-y-3 font-mono">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E1E24] pb-2.5">
        <div className="flex items-center gap-3">
          <h1 className="text-dev-title text-white font-sans uppercase">Runs</h1>
          <span className="text-xs text-zinc-500 font-mono">
            {isLoading ? 'Loading execution traces...' : `${filteredRuns.length} of ${runs.length} runs matched`}
          </span>
        </div>

        {/* Search Input supporting Advanced Syntax */}
        <div className="flex items-center gap-2">
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
              placeholder="Search (e.g. status:error, model:gpt-4o, cost>0.05)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded border border-[#1E1E24] bg-[#0F0F12] pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none font-mono w-80"
            />
          </div>
        </div>
      </div>

      {/* 2. Filter Row Bar */}
      <div className="flex items-baseline justify-between border-b border-white/[0.07] pb-3">
        <div>
          <h1 className="text-xl font-bold text-white font-sans tracking-tight">Execution Traces</h1>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Real-time observability and profiler runs captured across agent pipelines.
          </p>
        </div>

        <button
          onClick={loadRuns}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#16161F] hover:bg-[#1C1C26] border border-white/[0.08] text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-blue-400' : 'text-zinc-400'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. DevTools Density Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-[#121217] border border-white/[0.07] rounded-lg p-2.5 font-mono text-xs">
        
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by run title, model, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0C0C0F] border border-white/[0.08] rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-[#0C0C0F] border border-white/[0.08] rounded-md p-1">
          {(['ALL', 'COMPLETED', 'FAILED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                statusFilter === st
                  ? 'bg-[#1C1C26] text-white font-semibold border border-white/10'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'All' : st}
            </button>
          ))}
        </div>

        {/* Model Filter */}
        <select
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
          className="bg-[#0C0C0F] border border-white/[0.08] text-zinc-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Models</option>
          <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
          <option value="GPT-4o">GPT-4o</option>
          <option value="Llama 3.3 70B">Llama 3.3 70B</option>
        </select>

        {/* Framework Filter */}
        <select
          value={frameworkFilter}
          onChange={(e) => setFrameworkFilter(e.target.value)}
          className="bg-[#0C0C0F] border border-white/[0.08] text-zinc-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Frameworks</option>
          <option value="Groq">Groq</option>
          <option value="Custom">Custom</option>
          <option value="LangChain">LangChain</option>
          <option value="CrewAI">CrewAI</option>
        </select>

        {/* Min Duration Filter */}
        <select
          value={minDurationFilter}
          onChange={(e) => setMinDurationFilter(parseInt(e.target.value, 10))}
          className="bg-[#0C0C0F] border border-white/[0.08] text-zinc-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="0">All Durations</option>
          <option value="1000">Duration &gt; 1s</option>
          <option value="5000">Duration &gt; 5s</option>
          <option value="15000">Duration &gt; 15s</option>
        </select>
      </div>

      {/* 3. DevTools High-Density Execution Table */}
      <div className="w-full border border-white/[0.07] rounded-lg overflow-hidden bg-[#121217]">
        {filteredRuns.length > 0 ? (
          <div className="w-full overflow-x-auto scrollbar-none">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-white/[0.07] bg-[#0C0C0F] text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">
                  <th className="py-2.5 px-4 w-16 text-center">Status</th>
                  <th className="py-2.5 px-4 min-w-[220px]">Trace Name</th>
                  <th className="py-2.5 px-4 w-36">Model</th>
                  <th className="py-2.5 px-4 w-28">Framework</th>
                  <th className="py-2.5 px-4 w-28 text-right">Duration</th>
                  <th className="py-2.5 px-4 w-28 text-right">Total Tokens</th>
                  <th className="py-2.5 px-4 w-28 text-right">Cost ({currency})</th>
                  <th className="py-2.5 px-4 w-28 text-right pr-5">Started</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.05] text-xs">
                {filteredRuns.map((run) => {
                  const isFailed = run.status.toUpperCase() === 'FAILED';

                  return (
                    <tr
                      key={run.id}
                      className="group hover:bg-[#16161F] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-center align-middle font-mono">
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                          isFailed
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {isFailed ? 'FAIL' : 'OK'}
                        </span>
                      </td>

                      <td className="py-3 px-4 align-middle">
                        <Link
                          href={`/runs/${run.id}`}
                          className="font-semibold text-white group-hover:text-blue-400 transition-colors text-xs font-sans block truncate max-w-md"
                        >
                          {run.title}
                        </Link>
                      </td>

                      <td className="py-2.5 px-3 align-middle text-zinc-300 truncate">
                        {run.modelFamily}
                      </td>

                      <td className="py-2.5 px-3 align-middle text-zinc-400">
                        {run.agent?.framework || 'Custom'}
                      </td>

                      <td className="py-2.5 px-3 align-middle text-right font-telemetry font-bold text-white">
                        {(run.durationMs / 1000).toFixed(1)}s
                      </td>

                      <td className="py-2.5 px-3 align-middle text-right font-telemetry text-zinc-300">
                        {run.tokens.toLocaleString()} tok
                      </td>

                      <td className="py-2.5 px-3 align-middle text-right font-telemetry font-bold text-emerald-400">
                        {run.cost > 0 ? formatCurrency(run.cost, currency) : <span className="text-zinc-500 font-normal">—</span>}
                      </td>

                      <td className="py-2.5 px-3 align-middle text-right text-zinc-500 pr-4">
                        {formatAge(run.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="p-8 text-center space-y-3 bg-[#0F0F12]">
            <Terminal className="h-6 w-6 text-zinc-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Matching Traces Found</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Run your AI agent script wrapped with <code className="text-blue-400 bg-[#08080A] px-1 py-0.5 rounded">@pf.trace()</code> to automatically capture execution telemetry.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
