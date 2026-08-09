'use client';

import React, { useState } from 'react';
import { SpanData, formatCurrency, CurrencyMode } from '@/lib/data';
import { X, Copy, Check, Layers, Code2, AlertTriangle, Bug, Cpu } from 'lucide-react';

interface SpanDetailDrawerProps {
  span: SpanData | null;
  onClose: () => void;
  currency?: CurrencyMode;
}

export default function SpanDetailDrawer({ span, onClose, currency = 'USD' }: SpanDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'input' | 'output' | 'raw'>('input');
  const [copied, setCopied] = useState(false);

  if (!span) return null;

  const copyPayload = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFailed = span.status === 'FAILED';

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-white/[0.07] bg-[#09090B]/95 backdrop-blur-xl shadow-2xl animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${isFailed ? 'border-red-500/30 bg-red-950/40 text-red-400' : 'border-blue-500/30 bg-blue-500/10 text-blue-400'}`}>
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">{span.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${
                isFailed ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                {span.status}
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-400">
              {span.spanId} • Parent: {span.parentSpanId || 'ROOT'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 border-b border-white/[0.07] p-4 bg-[#111115] font-mono">
        <div className="rounded-xl border border-white/[0.07] bg-[#09090B] p-2.5">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Latency</span>
          <span className="text-sm font-bold text-white mt-0.5 block">
            {span.latencyMs < 1000 ? `${span.latencyMs}ms` : `${(span.latencyMs / 1000).toFixed(1)}s`}
          </span>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-[#09090B] p-2.5">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Tokens</span>
          <span className="text-sm font-bold text-white mt-0.5 block">{span.tokens.toLocaleString()}</span>
          {((span.inputTokens || 0) > 0 || (span.outputTokens || 0) > 0) && (
            <span className="text-[9px] text-zinc-500 block">{span.inputTokens || 0} in / {span.outputTokens || 0} out</span>
          )}
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-[#09090B] p-2.5">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Cost</span>
          <span className="text-sm font-bold text-emerald-400 mt-0.5 block">{formatCurrency(span.cost, currency)}</span>
        </div>
      </div>

      {/* Extended metadata strip */}
      {(span.model || span.provider || (span.retryCount || 0) > 0) && (
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-2 bg-[#0D0D11] text-[10px] font-mono">
          {span.model && (
            <div className="flex items-center gap-1">
              <Cpu className="h-3 w-3 text-violet-400" />
              <span className="text-zinc-400">Model:</span>
              <span className="text-violet-400 font-bold">{span.model}</span>
            </div>
          )}
          {span.provider && (
            <div className="flex items-center gap-1">
              <span className="text-zinc-400">Provider:</span>
              <span className="text-zinc-300">{span.provider}</span>
            </div>
          )}
          {(span.retryCount || 0) > 0 && (
            <div className="flex items-center gap-1">
              <Bug className="h-3 w-3 text-amber-400" />
              <span className="text-amber-400 font-bold">{span.retryCount} retries</span>
            </div>
          )}
        </div>
      )}

      {/* Content Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-5 pt-3">
        {(['input', 'output', 'raw'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {tab === 'input' ? 'Input Payload' : tab === 'output' ? 'Execution Output' : 'Raw JSON'}
          </button>
        ))}
      </div>

      {/* Error diagnostic */}
      {(span.errorMessage || span.diagnosticSummary) && (
        <div className="m-4 p-4 rounded-xl border font-sans text-xs bg-red-950/40 border-red-500/50 text-red-200">
          <div className="flex items-center gap-2 font-bold mb-1 font-mono uppercase tracking-wider text-[11px]">
            <span className="px-2 py-0.5 rounded font-mono bg-red-500/30 text-red-300">
              {span.errorType || span.diagnosticTag || 'ERROR'}
            </span>
            <span>Failure Analysis</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-300 font-mono">
            {span.errorMessage || span.diagnosticSummary}
          </p>
        </div>
      )}

      {/* Payload */}
      <div className="flex-1 overflow-y-auto p-5 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
            <Code2 className="h-3.5 w-3.5 text-blue-400" />
            JSON Payload
          </span>
          <button
            onClick={() => copyPayload(activeTab === 'input' ? span.rawInput : activeTab === 'output' ? span.rawOutput : JSON.stringify(span, null, 2))}
            className="flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-1 text-[11px] font-mono text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="rounded-xl border border-white/[0.07] bg-[#09090B] p-4 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
          {activeTab === 'input' && (span.rawInput || '// No input payload recorded')}
          {activeTab === 'output' && (span.rawOutput || '// No output recorded')}
          {activeTab === 'raw' && JSON.stringify(span, null, 2)}
        </pre>
      </div>

      <div className="border-t border-white/[0.07] p-4 text-center text-xs text-zinc-500 font-mono">
        PathFlow Trace Inspector
      </div>
    </div>
  );
}
