'use client';

import React from 'react';
import { FileText, ArrowUpRight, Database, Code, BookOpen } from 'lucide-react';

export interface ContextChunk {
  id: string;
  title: string;
  snippet: string;
  characterCount?: number;
  sourceName?: string;
  sourceType?: 'PDF' | 'CSV' | 'JSON' | 'DOC' | 'VECTOR' | 'CODE';
  sourceUrl?: string;
}

interface ContextCardsProps {
  chunks: ContextChunk[];
  title?: string;
  className?: string;
}

const fileTypeColors: Record<string, { bg: string; text: string }> = {
  PDF: { bg: 'bg-red-600', text: 'text-white' },
  CSV: { bg: 'bg-emerald-600', text: 'text-white' },
  JSON: { bg: 'bg-amber-600', text: 'text-white' },
  DOC: { bg: 'bg-blue-600', text: 'text-white' },
  VECTOR: { bg: 'bg-purple-600', text: 'text-white' },
  CODE: { bg: 'bg-cyan-500', text: 'text-ink' },
};

export default function ContextCards({
  chunks,
  title = 'Retrieved Knowledge & Context',
  className = '',
}: ContextCardsProps) {
  if (!chunks || chunks.length === 0) return null;

  return (
    <div className={`flex w-full flex-col gap-2.5 font-sans ${className}`}>
      {/* Title & Count */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[13px] font-semibold text-ink">{title}</span>
        <span className="inline-flex h-5 items-center rounded-md bg-tint/[0.06] px-1.5 text-2xs font-medium text-ink-2 font-mono">
          {chunks.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-2">
        {chunks.map((chunk) => {
          const charCount = chunk.characterCount || chunk.snippet.length;
          const typeStyle = fileTypeColors[chunk.sourceType || 'DOC'] || fileTypeColors.DOC;

          return (
            <div
              key={chunk.id}
              className="overflow-hidden rounded-xl border border-line bg-surface shadow-lg transition-all hover:border-line-strong"
            >
              {/* Card Header Bar */}
              <div className="flex items-center justify-between border-b border-line px-3.5 py-2">
                <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] font-medium text-ink">
                  <BookOpen className="h-3.5 w-3.5 text-ink-2 shrink-0" />
                  <span className="truncate">{chunk.title}</span>
                </span>
                <span className="shrink-0 font-mono text-2xs text-ink-3">
                  {charCount.toLocaleString()} chars
                </span>
              </div>

              {/* Card Content Snippet */}
              <p className="px-3.5 pt-2.5 pb-2 text-[12px] leading-relaxed text-ink-2 font-mono line-clamp-3">
                {chunk.snippet}
              </p>

              {/* Source Document Badge */}
              {chunk.sourceName && (
                <div className="px-3.5 pb-2.5">
                  <a
                    href={chunk.sourceUrl || '#'}
                    target={chunk.sourceUrl ? '_blank' : undefined}
                    rel="noreferrer"
                    className="inline-flex h-6 items-center gap-1.5 rounded-full border border-line bg-tint/[0.04] px-2.5 text-2xs font-medium text-ink-2 transition-colors hover:bg-tint/[0.08] hover:text-ink"
                  >
                    <span
                      className={`flex size-3.5 items-center justify-center rounded-[3px] text-2xs font-bold ${typeStyle.bg} ${typeStyle.text}`}
                    >
                      {chunk.sourceType || 'DOC'}
                    </span>
                    <span className="truncate max-w-[200px]">{chunk.sourceName}</span>
                    <ArrowUpRight className="h-3 w-3 text-ink-3" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
