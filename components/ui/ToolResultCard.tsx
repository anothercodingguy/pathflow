'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, CheckCircle2, XCircle, ChevronDown, Copy, Check, Terminal, Clock, DollarSign } from 'lucide-react';

interface ToolResultCardProps {
  toolName: string;
  status: 'success' | 'error' | 'running';
  durationMs?: number;
  cost?: number;
  inputPayload?: any;
  outputPayload?: any;
  error?: string;
  defaultExpanded?: boolean;
}

export default function ToolResultCard({
  toolName,
  status,
  durationMs,
  cost,
  inputPayload,
  outputPayload,
  error,
  defaultExpanded = false,
}: ToolResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState<'output' | 'input'>('output');
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = (data: any) => {
    navigator.clipboard.writeText(
      typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    );
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1800);
  };

  const statusConfig = {
    success: {
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/5',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
      label: 'Success',
    },
    error: {
      border: 'border-red-500/20',
      bg: 'bg-red-500/5',
      badge: 'bg-red-500/10 text-red-400 border-red-500/20',
      icon: <XCircle className="h-3.5 w-3.5 text-red-400" />,
      label: 'Failed',
    },
    running: {
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/5',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      icon: <div className="size-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />,
      label: 'Running',
    },
  }[status];

  return (
    <div className={`rounded-xl border ${statusConfig.border} bg-[#111115] overflow-hidden transition-all duration-200 shadow-lg`}>
      {/* Top Header Row */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3.5 py-2.5 bg-[#0D0D10] cursor-pointer hover:bg-white/[0.02] select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-6 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
            <Wrench className="h-3.5 w-3.5" />
          </div>
          <span className="font-mono text-xs font-semibold text-zinc-100 truncate">
            {toolName}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border flex items-center gap-1 ${statusConfig.badge}`}>
            {statusConfig.icon}
            {statusConfig.label}
          </span>
        </div>

        <div className="flex items-center gap-3 text-zinc-400 text-xs font-mono shrink-0">
          {durationMs !== undefined && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Clock className="h-3 w-3 text-zinc-500" />
              {durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(2)}s`}
            </span>
          )}
          {cost !== undefined && cost > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              ${cost.toFixed(4)}
            </span>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          </motion.div>
        </div>
      </div>

      {/* Expandable Body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="p-3 border-t border-white/[0.06] space-y-2.5">
              {/* Tab Selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-[#09090C] p-0.5 rounded-lg border border-white/[0.08]">
                  <button
                    onClick={() => setActiveTab('output')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all ${
                      activeTab === 'output' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Tool Output
                  </button>
                  {inputPayload && (
                    <button
                      onClick={() => setActiveTab('input')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all ${
                        activeTab === 'input' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Arguments
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleCopy(activeTab === 'output' ? (error || outputPayload) : inputPayload)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors border border-white/[0.06]"
                >
                  {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {isCopied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Payload View */}
              {activeTab === 'output' && (
                <div>
                  {error ? (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs font-mono text-red-300">
                      <p className="font-semibold text-red-400 mb-1">Execution Error:</p>
                      <pre className="whitespace-pre-wrap overflow-x-auto text-[11px]">{error}</pre>
                    </div>
                  ) : (
                    <pre className="p-2.5 rounded-lg bg-[#08080A] border border-white/[0.06] text-xs font-mono text-zinc-300 overflow-x-auto max-h-48 leading-relaxed">
                      {typeof outputPayload === 'string'
                        ? outputPayload
                        : JSON.stringify(outputPayload, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              {activeTab === 'input' && inputPayload && (
                <pre className="p-2.5 rounded-lg bg-[#08080A] border border-white/[0.06] text-xs font-mono text-zinc-300 overflow-x-auto max-h-48 leading-relaxed">
                  {typeof inputPayload === 'string'
                    ? inputPayload
                    : JSON.stringify(inputPayload, null, 2)}
                </pre>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
