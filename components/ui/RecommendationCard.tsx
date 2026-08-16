'use client';

import React, { useState } from 'react';
import { Sparkles, Check, ChevronDown, ArrowRight } from 'lucide-react';

export interface AlternativeOption {
  title: string;
  badge?: string;
  confidence?: 'high' | 'medium' | 'low';
}

interface RecommendationCardProps {
  title: string;
  description: string;
  codeSnippet?: string;
  confidence?: 'high' | 'medium' | 'low';
  confidenceLabel?: string;
  alternatives?: AlternativeOption[];
  onAccept?: () => void;
  onSelectAlternative?: (alt: AlternativeOption) => void;
  className?: string;
}

export default function RecommendationCard({
  title,
  description,
  codeSnippet,
  confidence = 'high',
  confidenceLabel,
  alternatives = [],
  onAccept,
  onSelectAlternative,
  className = '',
}: RecommendationCardProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  const confidenceColors = {
    high: { bar: 'bg-emerald-500', label: confidenceLabel || 'High confidence' },
    medium: { bar: 'bg-amber-500', label: confidenceLabel || 'Needs review' },
    low: { bar: 'bg-zinc-600', label: confidenceLabel || 'Low confidence' },
  };

  const currentConf = confidenceColors[confidence];

  const handleAccept = () => {
    setIsAccepted(true);
    if (onAccept) onAccept();
  };

  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111115] shadow-2xl transition-all ${className}`}>
      {/* Content Area */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
          <span className="text-[13px] font-semibold text-zinc-100">{title}</span>
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-zinc-300">
          {description}
          {codeSnippet && (
            <>
              {' '}
              <code className="rounded bg-blue-500/10 px-1.5 py-0.5 font-mono text-[12px] text-blue-300 border border-blue-500/20">
                {codeSnippet}
              </code>
            </>
          )}
        </p>
      </div>

      {/* Expandable Alternatives Drawer */}
      <div
        className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
        style={{
          gridTemplateRows: showAlternatives ? '1fr' : '0fr',
          opacity: showAlternatives ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/10 bg-[#0c0c0f] px-3 py-2">
            <p className="px-1 pb-1 text-[11px] font-medium text-zinc-400">Other suggested options</p>
            <div className="flex flex-col gap-1">
              {alternatives.map((alt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectAlternative?.(alt)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 hover:bg-white/[0.06]"
                >
                  <span className="flex items-end gap-0.5">
                    <span className={`w-1 rounded-full ${alt.confidence === 'high' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ height: '10px' }} />
                    <span className={`w-1 rounded-full ${alt.confidence === 'high' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ height: '10px' }} />
                    <span className="w-1 rounded-full bg-zinc-700" style={{ height: '10px' }} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-zinc-200">{alt.title}</span>
                  {alt.badge && (
                    <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 text-[10.5px] text-zinc-400 font-mono">
                      {alt.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Confidence Meter */}
      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-[#0c0c0f] px-4 py-2.5">
        {/* 3-Bar Confidence Indicator */}
        <div className="flex items-center gap-2">
          <span className="flex items-end gap-0.5">
            <span
              className={`w-1 rounded-full transition-colors ${
                confidence === 'high' || confidence === 'medium' || confidence === 'low'
                  ? currentConf.bar
                  : 'bg-zinc-700'
              }`}
              style={{ height: '10px' }}
            />
            <span
              className={`w-1 rounded-full transition-colors ${
                confidence === 'high' || confidence === 'medium'
                  ? currentConf.bar
                  : 'bg-zinc-700'
              }`}
              style={{ height: '10px' }}
            />
            <span
              className={`w-1 rounded-full transition-colors ${
                confidence === 'high' ? currentConf.bar : 'bg-zinc-700'
              }`}
              style={{ height: '10px' }}
            />
          </span>
          <span className="text-[12px] font-medium text-zinc-300">{currentConf.label}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {alternatives.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="h-7 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-[12px] font-medium text-zinc-300 hover:bg-white/[0.08] active:scale-95 transition-all"
            >
              Alternatives
            </button>
          )}

          <button
            type="button"
            onClick={handleAccept}
            disabled={isAccepted}
            className={`h-7 rounded-lg px-3 text-[12px] font-medium text-white shadow transition-all active:scale-95 flex items-center gap-1.5 ${
              isAccepted
                ? 'bg-emerald-600'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {isAccepted ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                Applied
              </>
            ) : (
              'Accept'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
