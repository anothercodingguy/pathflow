'use client';

import React, { useState } from 'react';
import { SpanData } from '@/lib/data';
import { X, Copy, Check, Layers, Code2 } from 'lucide-react';

interface SpanDetailDrawerProps {
  span: SpanData | null;
  onClose: () => void;
}

export default function SpanDetailDrawer({ span, onClose }: SpanDetailDrawerProps) {
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
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-zinc-800 bg-[#09090B]/95 backdrop-blur-xl shadow-2xl animate-in slide-in-from-right duration-300">
      
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 p-5">
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
            <p className="text-xs font-mono text-zinc-400">Span ID: {span.spanId} • Parent: {span.parentSpanId || 'ROOT'}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Metric Highlights Pill Row */}
      <div className="grid grid-cols-3 gap-3 border-b border-zinc-800 p-4 bg-[#111115] font-telemetry">
        <div className="rounded-xl border border-zinc-800 bg-[#09090B] p-2.5">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase block">LATENCY</span>
          <span className="text-sm font-bold text-white mt-0.5 block">{span.latencyMs} ms</span>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#09090B] p-2.5">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase block">CONTEXT TOKENS</span>
          <span className="text-sm font-bold text-white mt-0.5 block">{span.tokens.toLocaleString()} tok</span>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#09090B] p-2.5">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase block">SPAN COST</span>
          <span className="text-sm font-bold text-emerald-400 mt-0.5 block">${span.cost.toFixed(4)}</span>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-5 pt-3">
        <button
          onClick={() => setActiveTab('input')}
          className={`pb-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'input'
              ? 'border-blue-500 text-blue-400 font-bold'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Input Payload
        </button>
        <button
          onClick={() => setActiveTab('output')}
          className={`pb-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'output'
              ? 'border-blue-500 text-blue-400 font-bold'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Execution Output
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={`pb-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'raw'
              ? 'border-blue-500 text-blue-400 font-bold'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          OTel Metadata
        </button>
      </div>

      {/* Pain-Specific Diagnostic Highlight Box */}
      {(span.diagnosticTag || span.diagnosticSummary) && (
        <div className="m-4 p-4 rounded-xl border font-sans text-xs bg-red-950/40 border-red-500/50 text-red-200">
          <div className="flex items-center gap-2 font-bold mb-1 font-mono uppercase tracking-wider text-[11px]">
            <span className="px-2 py-0.5 rounded font-mono bg-red-500/30 text-red-300">
              {span.diagnosticTag || 'ROOT_CAUSE_DIAGNOSTIC'}
            </span>
            <span>Automated Failure Analysis</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-300 font-mono">
            {span.diagnosticSummary || 'Span execution failed. Review input schema and payload definitions below.'}
          </p>
        </div>
      )}

      {/* Payload Display Box */}
      <div className="flex-1 overflow-y-auto p-5 relative">
        
        {/* Copy Button */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
            <Code2 className="h-3.5 w-3.5 text-blue-400" />
            JSON Payload View
          </span>
          <button
            onClick={() => copyPayload(activeTab === 'input' ? span.rawInput : activeTab === 'output' ? span.rawOutput : JSON.stringify(span, null, 2))}
            className="flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-1 text-[11px] font-mono text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy Payload'}
          </button>
        </div>

        <pre className="rounded-xl border border-zinc-800 bg-[#09090B] p-4 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
          {activeTab === 'input' && (span.rawInput || '// No raw input recorded for this span')}
          {activeTab === 'output' && (span.rawOutput || '// No output returned for this span')}
          {activeTab === 'raw' && JSON.stringify(span, null, 2)}
        </pre>

      </div>

      {/* Footer Info */}
      <div className="border-t border-zinc-800 p-4 text-center text-xs text-zinc-500 font-mono">
        PathFlow Trace Inspector • OTel JSON Standard v1.28
      </div>

    </div>
  );
}
