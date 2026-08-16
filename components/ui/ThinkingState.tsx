'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { Sparkles, ChevronDown, Check, Loader2, Search, Code2, Globe, FileCode } from 'lucide-react';

export type ThinkingRow = {
  primary: string;
  secondary?: string;
  mono?: boolean;
  add?: number;
  del?: number;
  href?: string;
  status?: 'running' | 'completed' | 'failed';
};

interface ThinkingStateProps {
  activeTitle?: string;
  completedTitle?: string;
  isWorking?: boolean;
  rows: ThinkingRow[];
  query?: string;
  variant?: 'Steps' | 'Reasoning' | 'Search' | 'Coding';
  defaultExpanded?: boolean;
  className?: string;
}

export default function ThinkingState({
  activeTitle = 'Thinking',
  completedTitle = 'Reasoning complete',
  isWorking = false,
  rows = [],
  query,
  variant = 'Steps',
  defaultExpanded = true,
  className = '',
}: ThinkingStateProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const traceRef = useRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = useState(0);

  useLayoutEffect(() => {
    if (traceRef.current) {
      setLineHeight(traceRef.current.offsetHeight);
    }
  }, [rows, expanded, variant, isWorking]);

  return (
    <div className={`flex w-full flex-col font-sans ${className}`}>
      {/* Header Button */}
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        className="flex w-fit items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors duration-150 hover:bg-white/[0.06] text-zinc-300"
      >
        <Sparkles
          className={`h-4 w-4 shrink-0 transition-colors ${
            isWorking ? 'text-blue-400 animate-pulse' : 'text-zinc-400'
          }`}
        />
        {isWorking ? (
          <span
            className="bg-clip-text text-[13px] font-medium text-transparent whitespace-nowrap"
            style={{
              backgroundImage:
                'linear-gradient(90deg, #71717a 30%, #f4f4f5 50%, #71717a 70%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer-text 1.4s linear infinite',
            }}
          >
            {activeTitle}
          </span>
        ) : (
          <span className="text-[13px] font-medium text-zinc-200 whitespace-nowrap">
            {completedTitle}
          </span>
        )}
        <ChevronDown
          className="h-3.5 w-3.5 text-zinc-500 transition-transform duration-300"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}
        />
      </button>

      {/* Expandable Trace Timeline */}
      <div
        className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
        style={{
          gridTemplateRows: expanded ? '1fr' : '0fr',
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div className="relative mt-1.5 ml-2.5 pl-4">
            {/* Timeline Vertical Line */}
            <span
              aria-hidden
              className="absolute left-[3px] w-px bg-white/10"
              style={{
                top: 0,
                height: lineHeight ? `${lineHeight}px` : '0px',
                transition: 'height 300ms ease',
              }}
            />

            <div ref={traceRef} className="flex flex-col gap-1.5 py-1">
              {query && (
                <div className="flex h-6 items-center gap-2 px-1.5 text-xs text-zinc-400">
                  <Search className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  <span>{query}</span>
                </div>
              )}

              {rows.map((row, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md px-1.5 py-0.5 text-xs text-zinc-300 hover:bg-white/[0.04] transition-colors"
                >
                  {/* Icon / status */}
                  {row.status === 'running' || (isWorking && i === rows.length - 1) ? (
                    <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin shrink-0" />
                  ) : (
                    <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}

                  <span className={`min-w-0 ${row.mono ? 'font-mono text-[11.5px]' : 'text-xs'}`}>
                    {row.primary}
                  </span>

                  {row.secondary && (
                    <span className="ml-auto font-mono text-[11px] text-zinc-500 truncate max-w-[140px]">
                      {row.secondary}
                    </span>
                  )}

                  {/* Code Line Diffs (+74 / -41) */}
                  {(row.add !== undefined || row.del !== undefined) && (
                    <span className="ml-auto flex items-center gap-1 font-mono text-[11px]">
                      {row.add !== undefined && (
                        <span className="text-emerald-400 font-semibold">+{row.add}</span>
                      )}
                      {row.del !== undefined && (
                        <span className="text-red-400 font-semibold">-{row.del}</span>
                      )}
                    </span>
                  )}

                  {row.href && (
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto text-blue-400 hover:underline font-mono text-[11px]"
                    >
                      source ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
