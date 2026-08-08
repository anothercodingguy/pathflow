'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Terminal,
  Search,
  Cpu,
  Database,
  CheckCircle2,
  Clock,
  Coins
} from 'lucide-react';

export function CustomSpanNode({ data, selected }: NodeProps) {
  const { span, isCritical, isBottleneck } = data as { span: any; isCritical?: boolean; isBottleneck?: boolean };

  const isFailed = span.status === 'FAILED';

  const getIcon = (type: string) => {
    switch (type) {
      case 'Prompt': return Terminal;
      case 'WebSearch': return Search;
      case 'VectorDB': return Database;
      case 'LLMCall': return Cpu;
      case 'CodeExec': return Terminal;
      case 'Output': return CheckCircle2;
      default: return Cpu;
    }
  };

  const Icon = getIcon(span.type);

  return (
    <div
      className={`min-w-[230px] rounded-xl border p-3.5 shadow-2xl transition-all ${
        selected
          ? 'border-blue-500 bg-zinc-900 ring-2 ring-blue-500/50 shadow-blue-500/20 scale-105'
          : isFailed
          ? 'border-red-500/80 bg-red-950/40 text-red-100 hover:border-red-400'
          : isCritical
          ? 'border-amber-500/70 bg-[#16140E] text-zinc-100 ring-1 ring-amber-500/30'
          : 'border-zinc-800 bg-[#111115] text-zinc-100 hover:border-zinc-700'
      }`}
    >
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-500 !w-3 !h-3 !border-2 !border-zinc-950"
      />

      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${isCritical ? 'bg-amber-500/20 text-amber-400' : isFailed ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/15 text-blue-400'}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
            {span.type}
          </span>
        </div>

        {/* Status Indicator */}
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
          isBottleneck
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            : isCritical
            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            : isFailed
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        }`}>
          {isBottleneck ? 'BOTTLENECK' : isCritical ? 'CRITICAL' : isFailed ? 'FAIL' : 'OK'}
        </span>
      </div>

      {/* Span Name */}
      <div className="font-semibold text-xs text-white truncate mb-2">
        {span.name}
      </div>

      {/* Metrics Row */}
      <div className="flex items-center justify-between gap-2 text-[11px] font-telemetry pt-1 border-t border-zinc-800/50">
        
        {/* Latency Badge */}
        <div className="flex items-center gap-1 text-zinc-400">
          <Clock className="h-3 w-3 text-zinc-500" />
          <span>{span.latencyMs < 1000 ? `${span.latencyMs}ms` : `${(span.latencyMs/1000).toFixed(1)}s`}</span>
        </div>

        {/* Cost & Tokens Badge */}
        <div className="flex items-center gap-1 text-blue-400 font-semibold">
          <Coins className="h-3 w-3" />
          <span>{span.cost > 0 ? `$${span.cost.toFixed(4)}` : span.tokens > 0 ? `${span.tokens} tok` : '—'}</span>
        </div>

      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-500 !w-3 !h-3 !border-2 !border-zinc-950"
      />
    </div>
  );
}
