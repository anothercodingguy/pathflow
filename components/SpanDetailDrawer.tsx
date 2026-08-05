'use client';

import React, { useState } from 'react';
import { SpanData } from '@/lib/data';
import { X, Copy, Check, Terminal, Clock, Coins, Layers, CheckCircle2, AlertTriangle, Code2 } from 'lucide-react';

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
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-zinc-800 bg-zinc-950/95 backdrop-blur-xl shadow-2xl animate-in slide-in-from-right duration-300">
      
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 p-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${isFailed ? 'border-red-500/30 bg-red-950/40 text-red-400' : 'border-strava-orange/30 bg-strava-orange/10 text-strava-orange'}`}>
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base">{span.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
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
      <div className="grid grid-cols-3 gap-3 border-b border-zinc-800 p-4 bg-zinc-900/40 font-telemetry">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5">
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase block">LATENCY</span>
          <span className="text-sm font-bold text-white mt-0.5 block">{span.latencyMs} ms</span>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5">
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase block">TOKEN DISTANCE</span>
          <span className="text-sm font-bold text-white mt-0.5 block">{span.tokens.toLocaleString()} tok</span>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5">
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase block">SPAN EFFORT</span>
          <span className="text-sm font-bold text-emerald-400 mt-0.5 block">${span.cost.toFixed(4)}</span>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-5 pt-3">
        <button
          onClick={() => setActiveTab('input')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'input'
              ? 'border-strava-orange text-strava-orange'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Prompt / Input Payload
        </button>
        <button
          onClick={() => setActiveTab('output')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'output'
              ? 'border-strava-orange text-strava-orange'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Execution Output
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'raw'
              ? 'border-strava-orange text-strava-orange'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          OTel Metadata
        </button>
      </div>

      {/* Payload Display Box */}
      <div className="flex-1 overflow-y-auto p-5 relative">
        
        {/* Copy Button */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
            <Code2 className="h-3.5 w-3.5 text-strava-orange" />
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

        <pre className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
          {activeTab === 'input' && (span.rawInput || '// No raw input recorded for this span')}
          {activeTab === 'output' && (span.rawOutput || '// No output returned for this span')}
          {activeTab === 'raw' && JSON.stringify(span, null, 2)}
        </pre>

      </div>

      {/* Footer Info */}
      <div className="border-t border-zinc-800 p-4 text-center text-xs text-zinc-500 font-mono">
        PathFlow Span Trace • OTel JSON Standard v1.28
      </div>

    </div>
  );
}
