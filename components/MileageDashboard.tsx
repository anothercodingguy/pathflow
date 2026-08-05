'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import {
  TrendingUp,
  Zap,
  Coins,
  ShieldCheck,
  Eye,
  EyeOff,
  Key,
  Flame,
  Award,
  Users,
  Calendar,
  Sparkles,
  GitFork
} from 'lucide-react';

const WEEKLY_TELEMETRY_DATA = [
  { day: 'Mon', tps: 104, tokens: 28000, cost: 0.85 },
  { day: 'Tue', tps: 118, tokens: 34000, cost: 0.92 },
  { day: 'Wed', tps: 142, tokens: 42000, cost: 1.15 },
  { day: 'Thu', tps: 126, tokens: 31000, cost: 0.88 },
  { day: 'Fri', tps: 168, tokens: 45000, cost: 1.42 },
  { day: 'Sat', tps: 135, tokens: 18000, cost: 0.54 },
  { day: 'Sun', tps: 152, tokens: 22000, cost: 0.65 },
];

const INITIAL_FLEET = [
  { id: 'ag-1', name: 'Claude Sonnet 5', framework: 'LangChain', isPublic: true, apiKey: 'pf_live_9942a_suyash', totalPaths: 42, avgTps: 112 },
  { id: 'ag-2', name: 'DeepResearch Bot', framework: 'CrewAI', isPublic: true, apiKey: 'pf_live_3310b_deep', totalPaths: 66, avgTps: 168 },
  { id: 'ag-3', name: 'SchemaArchitect', framework: 'AutoGPT', isPublic: false, apiKey: 'pf_live_7718c_schema', totalPaths: 19, avgTps: 132 },
];

export default function MileageDashboard() {
  const [fleet, setFleet] = useState(INITIAL_FLEET);

  const togglePublic = (id: string) => {
    setFleet(prev => prev.map(ag => ag.id === id ? { ...ag, isPublic: !ag.isPublic } : ag));
  };

  return (
    <div className="space-y-8">
      
      {/* GitHub-Style Developer Resume Header */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Avatar & User Meta */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="Suyash"
                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-strava-orange shadow-xl"
              />
              <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-strava-orange text-white shadow">
                🔥
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-3xl font-black text-white">Suyash</h2>
                <span className="rounded-md bg-strava-orange/20 text-strava-orange border border-strava-orange/30 px-2 py-0.5 text-xs font-bold font-mono uppercase">
                  AI ENGINEER
                </span>
                <span className="rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold font-mono">
                  TOP 0.8% OVERALL
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                @suyash • San Francisco, CA • Building autonomous agents & trace identity layers
              </p>

              {/* Followers & Following */}
              <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono mt-3">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-strava-orange" />
                  <strong className="text-white font-bold">1,420</strong> Followers
                </span>
                <span>•</span>
                <span><strong className="text-white font-bold">380</strong> Following</span>
                <span>•</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 fill-amber-400 stroke-none" />
                  Current Streak: 28 Days
                </span>
              </div>
            </div>
          </div>

          {/* GitHub Resume Summary Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-telemetry">
            <div>
              <span className="text-[10px] text-zinc-500 font-extrabold uppercase block">COMPLETED PATHS</span>
              <span className="text-xl font-black text-white mt-0.5 block">127</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-extrabold uppercase block">SUCCESS RATE</span>
              <span className="text-xl font-black text-emerald-400 mt-0.5 block">87%</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-extrabold uppercase block">COMPUTE SAVED</span>
              <span className="text-xl font-black text-strava-orange mt-0.5 block">$42</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-extrabold uppercase block">BENCHMARKS</span>
              <span className="text-xl font-black text-white mt-0.5 block">12 Badges</span>
            </div>
          </div>

        </div>

        {/* Skill Percentile Badges for Developer Resume */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-wrap items-center gap-3">
          <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
            Verified Skill Ranks:
          </span>
          <span className="rounded-lg bg-gradient-to-r from-strava-orange/20 to-amber-500/20 border border-strava-orange/40 px-3 py-1 text-xs font-extrabold text-strava-orange font-mono flex items-center gap-1.5 shadow">
            <Award className="h-3.5 w-3.5" />
            Top 1% Browser Automation
          </span>
          <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-extrabold text-emerald-400 font-mono flex items-center gap-1.5 shadow">
            <Award className="h-3.5 w-3.5" />
            Top 100 SWE Bench
          </span>
          <span className="rounded-lg bg-purple-500/20 border border-purple-500/40 px-3 py-1 text-xs font-extrabold text-purple-300 font-mono flex items-center gap-1.5 shadow">
            <Award className="h-3.5 w-3.5" />
            Top 0.5% JSON Parsing
          </span>
        </div>
      </div>

      {/* Strava-Style Weekly Recap Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-strava-orange" />
            <h3 className="font-extrabold text-white text-lg">Weekly Track Record (Strava Recap)</h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">Current Week</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center font-telemetry">
          <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-extrabold uppercase block">COMPLETED PATHS</span>
            <span className="text-2xl font-black text-white mt-1 block">18 Paths</span>
          </div>
          <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-extrabold uppercase block">CONTEXT VOLUME</span>
            <span className="text-2xl font-black text-white mt-1 block">210k</span>
          </div>
          <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-extrabold uppercase block">COMPUTE BURN</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">$6.21</span>
          </div>
          <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-extrabold uppercase block">PATH OUTCOMES</span>
            <span className="text-xl font-bold text-white mt-1 block">14 OK / 4 FAIL</span>
          </div>
          <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800 col-span-2 md:col-span-1">
            <span className="text-[10px] text-zinc-500 font-extrabold uppercase block">LONGEST PATH</span>
            <span className="text-xs font-bold text-strava-orange mt-2 block font-mono">Deep Research (31 steps)</span>
          </div>
        </div>
      </div>

      {/* Pace & Effort Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Token Velocity Chart */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-strava-orange" />
              <h3 className="font-bold text-white text-base">Token Velocity Trend</h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">t/s velocity</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEEKLY_TELEMETRY_DATA}>
                <defs>
                  <linearGradient id="tpsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FC4C02" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FC4C02" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0A0A0C', borderColor: '#27272A', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="tps" stroke="#FC4C02" strokeWidth={3} fillOpacity={1} fill="url(#tpsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compute Cost Chart */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Daily Compute Dollar Burn</h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">USD $</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_TELEMETRY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0A0A0C', borderColor: '#27272A', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="cost" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Managed Agent Fleet List */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <div>
            <h3 className="font-bold text-white text-lg">Managed Agent Fleet</h3>
            <p className="text-xs text-zinc-400">Toggle keys for private vs. public feed broadcasting.</p>
          </div>
          <span className="text-xs font-mono text-strava-orange font-bold">{fleet.length} Managed Fleets</span>
        </div>

        <div className="space-y-4">
          {fleet.map((ag) => (
            <div
              key={ag.id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition-all hover:border-zinc-700"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-strava-orange/15 text-strava-orange border border-strava-orange/30">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-base">{ag.name}</span>
                    <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                      {ag.framework}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono mt-1">
                    <span>{ag.totalPaths} Completed Paths</span>
                    <span>•</span>
                    <span className="text-strava-orange font-bold">{ag.avgTps} t/s avg</span>
                  </div>
                </div>
              </div>

              {/* API Key & Privacy Toggle */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-mono text-zinc-400">
                  <Key className="h-3.5 w-3.5 text-zinc-500" />
                  <span>{ag.apiKey}</span>
                </div>

                <button
                  onClick={() => togglePublic(ag.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    ag.isPublic
                      ? 'bg-strava-orange/20 text-strava-orange border border-strava-orange/40'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {ag.isPublic ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {ag.isPublic ? 'Public Feed ON' : 'Private Mode'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
