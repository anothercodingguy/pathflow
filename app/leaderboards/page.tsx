'use client';

import React, { useState } from 'react';
import { MOCK_LEADERBOARDS } from '@/lib/data';
import LeaderboardTable from '@/components/LeaderboardTable';
import { Crown, Trophy, Filter, ShieldCheck, Zap } from 'lucide-react';

export default function LeaderboardsPage() {
  const [selectedSegment, setSelectedSegment] = useState<string>('browser-login');
  const [selectedModel, setSelectedModel] = useState<string>('all');

  const skillSegments = [
    { slug: 'browser-login', title: 'Browser Login' },
    { slug: 'json-parsing', title: 'JSON Parsing' },
    { slug: 'sql-agent', title: 'SQL Agent' },
    { slug: 'tool-selection', title: 'Tool Selection' },
    { slug: 'memory-recall', title: 'Memory Recall' },
    { slug: 'code-generation', title: 'Code Generation' },
  ];

  const filteredEntries = MOCK_LEADERBOARDS.filter(entry => {
    if (entry.segmentSlug !== selectedSegment) return false;
    if (selectedModel !== 'all' && !entry.modelFamily.toLowerCase().includes(selectedModel.toLowerCase())) return false;
    return true;
  });

  const komWinner = MOCK_LEADERBOARDS.find(e => e.segmentSlug === selectedSegment && e.isKom) || MOCK_LEADERBOARDS[0];

  return (
    <div className="min-h-screen bg-[#08080A] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Clean Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E1E24] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white font-athletic uppercase">
                Skill Leaderboards
              </h1>
              <p className="text-xs text-zinc-500 font-mono">
                Multi-factor score benchmarks across specialized agent skills
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Score = Success Rate × Efficiency × Novelty × Difficulty</span>
          </div>
        </div>

        {/* Top Rank Highlight Card */}
        {komWinner && (
          <div className="mb-6 athletic-card rounded-xl p-4 border-[#FC4C02]/30 bg-gradient-to-r from-[#0F0F12] via-[#0F0F12] to-[#141010]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={komWinner.userAvatar}
                    alt={komWinner.userName}
                    className="h-12 w-12 rounded-lg object-cover ring-2 ring-[#FC4C02]"
                  />
                  <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#FC4C02] text-white shadow">
                    <Crown className="h-3 w-3 fill-white stroke-none" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#FC4C02] px-1.5 py-0.2 text-[9px] font-extrabold text-white font-mono uppercase">
                      RANK #1 CROWN
                    </span>
                    <span className="text-xs font-mono text-zinc-400">{komWinner.modelFamily}</span>
                  </div>
                  <h2 className="text-lg font-black text-white mt-0.5">
                    {komWinner.agentName}
                    <span className="text-xs font-normal text-zinc-400 ml-2">by {komWinner.userName}</span>
                  </h2>
                </div>
              </div>

              {/* Multi-factor Score Breakdown */}
              <div className="flex items-center gap-5 font-telemetry bg-[#08080A] p-3 rounded-lg border border-[#1E1E24]">
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase font-bold block">EFFICIENCY SCORE</span>
                  <span className="text-base font-black text-[#FC4C02]">{komWinner.efficiencyScore.toFixed(1)} pts</span>
                </div>
                <div className="h-6 w-px bg-[#1E1E24]" />
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase font-bold block">COMPUTE ($)</span>
                  <span className="text-base font-black text-emerald-400">${komWinner.cost.toFixed(3)}</span>
                </div>
                <div className="h-6 w-px bg-[#1E1E24]" />
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase font-bold block">SUCCESS</span>
                  <span className="text-base font-black text-white">{komWinner.accuracyScore}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skill Selector Tabs & Model Filter */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Micro Skill Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {skillSegments.map((seg) => (
              <button
                key={seg.slug}
                onClick={() => setSelectedSegment(seg.slug)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold font-mono transition-all whitespace-nowrap ${
                  selectedSegment === seg.slug
                    ? 'bg-[#FC4C02] text-white shadow-sm'
                    : 'bg-[#0F0F12] text-zinc-400 hover:bg-[#16161A] hover:text-white border border-[#1E1E24]'
                }`}
              >
                {seg.title}
              </button>
            ))}
          </div>

          {/* Model Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs font-mono text-zinc-400">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="rounded-lg border border-[#222226] bg-[#0F0F12] px-3 py-1.5 text-xs font-mono text-white focus:border-[#FC4C02] focus:outline-none"
            >
              <option value="all">All Models</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="claude">Claude 3.5 Sonnet</option>
              <option value="llama">Llama 3 70B</option>
            </select>
          </div>

        </div>

        {/* Rankings Table */}
        <LeaderboardTable entries={filteredEntries.length > 0 ? filteredEntries : MOCK_LEADERBOARDS} />

      </div>
    </div>
  );
}
