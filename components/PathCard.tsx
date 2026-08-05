'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PathData } from '@/lib/data';
import { Flame, MessageSquare, ArrowRight } from 'lucide-react';

interface PathCardProps {
  path: PathData;
}

export default function PathCard({ path }: PathCardProps) {
  const [kudosCount, setKudosCount] = useState(path.reactions.efficient || 128);
  const [hasKudos, setHasKudos] = useState(false);

  const toggleKudos = () => {
    if (hasKudos) {
      setKudosCount(prev => prev - 1);
      setHasKudos(false);
    } else {
      setKudosCount(prev => prev + 1);
      setHasKudos(true);
    }
  };

  return (
    <div className="bg-[#111113] border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-5 transition-all">
      
      {/* Header: Author & Metadata */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            className="h-8 w-8 rounded-full border border-zinc-700 object-cover"
            src={path.user.avatar}
            alt={path.user.name}
          />
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-white">{path.user.name}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">{path.agent.name}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500 text-xs">{path.skillSegment}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
          <span>{path.createdAt}</span>
          <span>•</span>
          <span className="text-zinc-300">{(path.durationMs / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {/* Run Title & Summary */}
      <Link href={`/paths/${path.id}`} className="group block mb-1">
        <h3 className="text-lg font-semibold text-white group-hover:text-[#FC4C02] transition-colors tracking-tight">
          {path.title}
        </h3>
      </Link>
      <p className="text-sm text-zinc-400 mb-5 line-clamp-2 leading-relaxed">
        {path.description}
      </p>

      {/* Monochrome Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 bg-[#0A0A0C] border border-zinc-800/60 rounded-lg mb-5">
        <div>
          <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-0.5">Velocity</div>
          <div className="text-xl font-bold font-mono text-white">
            {path.tps} <span className="text-xs font-normal text-zinc-500">t/s</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-0.5">Compute</div>
          <div className="text-xl font-bold font-mono text-white">
            ${path.cost.toFixed(3)} <span className="text-xs font-normal text-zinc-500">USD</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-0.5">Context</div>
          <div className="text-xl font-bold font-mono text-white">
            {(path.tokens / 1000).toFixed(1)}k <span className="text-xs font-normal text-zinc-500">tok</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-0.5">Reasoning</div>
          <div className="text-xl font-bold font-mono text-white">
            {path.spans.length} <span className="text-xs font-normal text-zinc-500">Steps (L{path.elevationDepth})</span>
          </div>
        </div>
      </div>

      {/* Clean Telemetry Pipeline */}
      <div className="flex items-center gap-2 text-xs text-zinc-400 py-2 mb-4 border-b border-zinc-800/50 overflow-x-auto scrollbar-none">
        <span className="text-zinc-500 uppercase text-[10px] font-mono tracking-wider mr-2 shrink-0">Route</span>
        {path.spans.map((span, idx) => (
          <React.Fragment key={span.id}>
            <span className={`whitespace-nowrap ${idx === path.spans.length - 1 ? 'text-zinc-200 font-medium' : ''}`}>
              {span.type}
            </span>
            {idx < path.spans.length - 1 && (
              <span className="text-zinc-600 shrink-0">→</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleKudos}
            className={`flex items-center gap-1.5 transition-colors ${
              hasKudos ? 'text-[#FC4C02]' : 'hover:text-[#FC4C02]'
            }`}
          >
            <Flame className={`w-4 h-4 ${hasKudos ? 'text-[#FC4C02] fill-[#FC4C02]' : 'text-[#FC4C02]'}`}/>
            <span className="font-mono font-medium text-white">{kudosCount}</span> Kudos
          </button>
          <button className="flex items-center gap-1.5 hover:text-white transition-colors">
            <MessageSquare className="w-3.5 h-3.5 text-zinc-500"/>
            <span>12</span>
          </button>
        </div>
        <Link
          href={`/paths/${path.id}`}
          className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
        >
          Inspect DAG <ArrowRight className="w-3.5 h-3.5"/>
        </Link>
      </div>

    </div>
  );
}
