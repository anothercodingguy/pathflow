'use client';

import React, { useState } from 'react';
import { MOCK_PATHS } from '@/lib/data';
import PathCard from '@/components/PathCard';
import { Search, Trophy, User, Activity, TrendingUp, Filter } from 'lucide-react';
import Link from 'next/link';

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'high_velocity' | 'popular' | 'my_paths'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPaths = MOCK_PATHS.filter(path => {
    const matchesSearch =
      path.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      path.agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      path.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      path.skillSegment.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'high_velocity') return path.tps >= 120;
    if (activeTab === 'popular') return (path.reactions.useful + path.reactions.efficient) > 200;
    if (activeTab === 'my_paths') return path.user.username === 'suyash';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0C] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Header Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-white">
              <Activity className="h-4 w-4 text-[#FC4C02]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Activity Feed
              </h1>
              <p className="text-xs text-zinc-500 font-mono">
                Live agent executions & performance telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/leaderboards"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#111113] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              Leaderboards
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg bg-[#FC4C02] hover:bg-[#E04300] px-3 py-1.5 text-xs font-medium text-white transition-colors shadow-sm"
            >
              <User className="h-3.5 w-3.5" />
              Profile
            </Link>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Activity Feed Stream */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Flat Borderless Tab Filter Row (GitHub / Linear style) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3">
              
              {/* Flat Tabs */}
              <div className="flex items-center gap-1">
                {[
                  { id: 'all', label: 'All Paths' },
                  { id: 'high_velocity', label: 'High Velocity' },
                  { id: 'popular', label: 'Popular' },
                  { id: 'my_paths', label: 'My Paths' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 text-sm transition-all ${
                      activeTab === tab.id
                        ? 'text-white font-medium bg-zinc-800/60 rounded-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Minimal Search Input */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter paths..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-[#111113] pl-9 pr-3 py-1 text-xs text-white placeholder-zinc-500 focus:border-zinc-700 focus:outline-none font-mono"
                />
              </div>

            </div>

            {/* Path Cards */}
            {filteredPaths.length > 0 ? (
              <div className="space-y-4">
                {filteredPaths.map((path) => (
                  <PathCard key={path.id} path={path} />
                ))}
              </div>
            ) : (
              <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-12 text-center">
                <Filter className="mx-auto h-8 w-8 text-zinc-600 mb-3" />
                <h3 className="text-base font-medium text-white">No paths match your filter</h3>
                <p className="text-xs text-zinc-500 mt-1">Try clearing your search terms.</p>
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Weekly Recap Card */}
            <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 mb-3">
                <h3 className="font-semibold text-white text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[#FC4C02]" />
                  Weekly Recap
                </h3>
                <span className="text-[10px] font-mono text-zinc-500">7-Day</span>
              </div>

              <div className="space-y-3 font-mono">
                <div>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block">Volume</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-bold text-white">18 Paths</span>
                    <span className="text-xs text-emerald-400 font-normal">14 OK / 4 FAIL</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-zinc-800/60">
                  <div>
                    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block">Context</span>
                    <p className="text-sm font-bold text-white mt-0.5">210k <span className="text-xs font-normal text-zinc-500">tok</span></p>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block">Compute</span>
                    <p className="text-sm font-bold text-white mt-0.5">$6.21 <span className="text-xs font-normal text-zinc-500">USD</span></p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-zinc-800/60">
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block">Longest Path</span>
                  <p className="text-xs font-medium text-[#FC4C02] mt-0.5">Deep Research (31 steps)</p>
                </div>
              </div>
            </div>

            {/* Active Fleet List */}
            <div className="bg-[#111113] border border-zinc-800/80 rounded-xl p-4">
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider font-mono mb-3 border-b border-zinc-800/80 pb-2">
                Active Agents
              </h3>
              <div className="space-y-2.5 text-xs font-mono">
                {[
                  { name: 'Claude Sonnet 5', tps: '112.4 t/s' },
                  { name: 'DeepResearch Bot', tps: '168.0 t/s' },
                  { name: 'SchemaArchitect', tps: '132.0 t/s' },
                ].map((ag, i) => (
                  <div key={i} className="flex items-center justify-between text-zinc-300">
                    <span className="font-medium text-white">{ag.name}</span>
                    <span className="text-zinc-400 font-mono">{ag.tps}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
