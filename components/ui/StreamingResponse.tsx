'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Copy, Check, Zap, Clock, Cpu } from 'lucide-react';

interface StreamingResponseProps {
  content: string;
  model?: string;
  tokensCount?: number;
  durationMs?: number;
  isStreaming?: boolean;
  cost?: number;
}

export default function StreamingResponse({
  content,
  model = 'gpt-4o',
  tokensCount,
  durationMs,
  isStreaming = false,
  cost,
}: StreamingResponseProps) {
  const [copied, setCopied] = useState(false);
  const [displayedText, setDisplayedText] = useState(isStreaming ? '' : content);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(content);
      return;
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= content.length) {
        setDisplayedText(content.slice(0, currentIndex));
        currentIndex += 3;
      } else {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [content, isStreaming]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tokensPerSec =
    tokensCount && durationMs && durationMs > 0
      ? ((tokensCount / (durationMs / 1000))).toFixed(1)
      : null;

  return (
    <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-inset border-b border-line">
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded-md bg-purple-500/10 border border-purple-500/20 text-violet">
            <Sparkles className="h-3 w-3" />
          </div>
          <span className="text-xs font-semibold text-ink">{model}</span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-2xs font-mono text-warn bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              <span className="size-1.5 rounded-full bg-amber-400 animate-ping" />
              Streaming
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {tokensPerSec && (
            <span className="text-2xs font-mono text-ink-2 flex items-center gap-1 bg-tint/[0.04] px-2 py-0.5 rounded border border-line">
              <Zap className="h-3 w-3 text-warn" />
              {tokensPerSec} tok/s
            </span>
          )}
          {cost !== undefined && (
            <span className="text-2xs font-mono text-ok bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ${cost.toFixed(4)}
            </span>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-tint/[0.04] hover:bg-tint/[0.08] text-2xs font-mono text-ink-2 hover:text-ink transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-ok" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Response content */}
      <div className="p-4 font-sans text-xs text-ink leading-relaxed whitespace-pre-wrap selection:bg-blue-500/30">
        {displayedText}
        {isStreaming && (
          <span className="inline-block w-1.5 h-3.5 ml-1 bg-blue-400 animate-pulse align-middle rounded-sm" />
        )}
      </div>

      {/* Footer metadata */}
      {(tokensCount !== undefined || durationMs !== undefined) && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-canvas border-t border-line text-2xs font-mono text-ink-3">
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            {tokensCount} tokens generated
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {durationMs ? `${(durationMs / 1000).toFixed(2)}s latency` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
