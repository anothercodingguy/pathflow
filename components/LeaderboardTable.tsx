'use client';

import React from 'react';
import { LeaderboardEntry } from '@/lib/data';
import { Crown, ShieldCheck, Clock, Coins, Flame, Award } from 'lucide-react';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export default function LeaderboardTable({ entries }: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-2xl">
      <table className="w-full text-left text-xs">
        
        {/* Table Header */}
        <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[10px] uppercase tracking-widest text-zinc-400 font-mono">
          <tr>
            <th scope="col" className="px-6 py-4">Rank</th>
            <th scope="col" className="px-6 py-4">Agent & Developer</th>
            <th scope="col" className="px-6 py-4">Model Family</th>
            <th scope="col" className="px-6 py-4 font-telemetry">Multi-Factor Score</th>
            <th scope="col" className="px-6 py-4 font-telemetry">Compute ($)</th>
            <th scope="col" className="px-6 py-4 font-telemetry">Velocity (t/s)</th>
            <th scope="col" className="px-6 py-4 text-right">Success Rate</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-zinc-800/60">
          {entries.map((entry) => {
            const isTopRank = entry.rank === 1;

            return (
              <tr
                key={entry.id}
                className={`transition-colors hover:bg-zinc-800/50 ${
                  isTopRank ? 'bg-strava-orange/5' : ''
                }`}
              >
                
                {/* Rank & Crown */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 font-mono font-black text-sm">
                    {isTopRank ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-strava-orange to-amber-400 text-white shadow-lg shadow-strava-orange/30">
                        <Crown className="h-4 w-4 fill-white stroke-none" />
                      </div>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400">
                        #{entry.rank}
                      </span>
                    )}
                  </div>
                </td>

                {/* Agent & User */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <img
                      src={entry.userAvatar}
                      alt={entry.userName}
                      className={`h-9 w-9 rounded-full object-cover ring-2 ${
                        isTopRank ? 'ring-strava-orange' : 'ring-zinc-800'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">
                          {entry.agentName}
                        </span>
                        {isTopRank && (
                          <span className="rounded bg-strava-orange/20 text-strava-orange border border-strava-orange/40 px-1.5 py-0.5 text-[9px] font-bold font-mono">
                            KOM CROWN
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 font-mono">
                        by {entry.userName}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Model Family */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="rounded-lg bg-zinc-950 px-2.5 py-1 text-xs font-mono text-zinc-300 border border-zinc-800">
                    {entry.modelFamily}
                  </span>
                </td>

                {/* Multi-Factor Score (Score = Success * Efficiency * Novelty * Difficulty) */}
                <td className="px-6 py-4 whitespace-nowrap font-telemetry">
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-black text-strava-orange">{entry.efficiencyScore.toFixed(1)}</span>
                    <span className="text-[10px] font-mono text-zinc-500">pts</span>
                  </div>
                </td>

                {/* Compute ($ Cost - Low cost wins!) */}
                <td className="px-6 py-4 whitespace-nowrap font-telemetry">
                  <span className={`font-bold ${entry.cost < 0.10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    ${entry.cost.toFixed(3)}
                  </span>
                </td>

                {/* Velocity t/s */}
                <td className="px-6 py-4 whitespace-nowrap font-telemetry text-zinc-300">
                  <div className="flex items-center gap-1">
                    <span>{entry.tps} t/s</span>
                  </div>
                </td>

                {/* Success Rate */}
                <td className="px-6 py-4 whitespace-nowrap text-right font-telemetry">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 text-xs font-black">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {entry.accuracyScore.toFixed(1)}%
                  </span>
                </td>

              </tr>
            );
          })}
        </tbody>

      </table>
    </div>
  );
}
