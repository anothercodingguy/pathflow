'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export function CustomSpanNode({ data, selected }: NodeProps) {
  const { span, isCritical, isBottleneck } = data as { span: any; isCritical?: boolean; isBottleneck?: boolean };
  const isFailed = span.status === 'FAILED';

  const durationStr = span.latencyMs < 1000 ? `${span.latencyMs}ms` : `${(span.latencyMs / 1000).toFixed(1)}s`;

  return (
    <div
      className={`min-w-[240px] rounded-lg border p-3 font-mono text-xs transition-all ${
        selected
          ? 'border-blue-500 bg-[#16161F] shadow-lg ring-1 ring-blue-500'
          : isFailed
          ? 'border-red-500/60 bg-red-950/20 text-red-200'
          : isBottleneck
          ? 'border-amber-500/60 bg-amber-950/20 text-amber-200'
          : isCritical
          ? 'border-blue-500/40 bg-[#14141B] text-zinc-100'
          : 'border-white/[0.08] bg-[#121217] text-zinc-200 hover:border-white/15'
      }`}
    >
      {/* React Flow Target Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-500 !w-2.5 !h-2.5 !border-2 !border-[#0C0C0F]"
      />

      {/* Header Row: Indicator dot, Type, Latency */}
      <div className="flex items-center justify-between text-[11px] mb-1">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-zinc-400">
          <span
            className={`h-2 w-2 rounded-full inline-block ${
              isFailed
                ? 'bg-red-500'
                : isBottleneck
                ? 'bg-amber-400'
                : isCritical
                ? 'bg-blue-400'
                : 'bg-emerald-400'
            }`}
          />
          <span>{span.type}</span>
        </div>

        <span className="text-zinc-400 font-telemetry">{durationStr}</span>
      </div>

      {/* Span Name (Sans proportional font for high readability) */}
      <div className="font-sans font-semibold text-xs text-white truncate my-1">
        {span.name}
      </div>

      {/* Footer Metrics Row */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-white/[0.06] font-telemetry">
        <span>{span.tokens > 0 ? `${span.tokens.toLocaleString()} tokens` : '0 tokens'}</span>
        {span.cost > 0 ? (
          <span className="text-emerald-400">${span.cost.toFixed(4)}</span>
        ) : (
          <span className="text-zinc-600">—</span>
        )}
      </div>

      {/* React Flow Source Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-500 !w-2.5 !h-2.5 !border-2 !border-[#0C0C0F]"
      />
    </div>
  );
}
