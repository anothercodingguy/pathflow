'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Shield, XCircle, Clock, DollarSign, Zap,
  ChevronRight, Loader2, Filter, ArrowUpRight, Bug
} from 'lucide-react';

interface DetectionItem {
  runId: string;
  runTitle: string;
  runStatus: string;
  detection: {
    type: string;
    severity: string;
    title: string;
    description: string;
    spanId?: string;
    spanName?: string;
    evidence: string[];
    impact: string;
    recommendation: string;
  };
}

const severityColors: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  HIGH: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  MEDIUM: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  LOW: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  INFO: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' },
};

const typeIcons: Record<string, any> = {
  TOOL_LOOP: Bug,
  EXCESSIVE_RETRY: AlertTriangle,
  TIMEOUT: Clock,
  HIGH_LATENCY: Clock,
  HIGH_COST: DollarSign,
  TOKEN_EXPLOSION: Zap,
  ERROR_PROPAGATION: XCircle,
  EMPTY_TOOL_RESPONSE: Shield,
  REPEATED_LLM_DECISION: AlertTriangle,
};

export default function DetectionsPage() {
  const [detections, setDetections] = useState<DetectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadDetections() {
      try {
        const params = new URLSearchParams();
        if (selectedSeverity) params.append('severity', selectedSeverity);
        if (selectedType) params.append('type', selectedType);
        const res = await fetch(`/api/v1/detections?${params.toString()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setDetections(data.detections || []);
        }
      } catch (err) {
        console.error('Failed to load detections:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDetections();
  }, [selectedSeverity, selectedType]);

  const severityCounts: Record<string, number> = {};
  detections.forEach(d => {
    severityCounts[d.detection.severity] = (severityCounts[d.detection.severity] || 0) + 1;
  });

  const types = [...new Set(detections.map(d => d.detection.type))];

  return (
    <div className="w-full min-h-[calc(100vh-2.75rem)] bg-[#08080A] px-4 py-3 space-y-4 font-mono text-xs">
      
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-white/[0.07] pb-2.5">
        <div>
          <h1 className="text-xl font-bold text-white font-sans tracking-tight">Detections</h1>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">Automatically detected execution issues across all agent runs.</p>
        </div>
        <div className="flex items-center gap-2">
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => {
            const count = severityCounts[sev] || 0;
            const colors = severityColors[sev];
            return (
              <span key={sev} className={`px-2 py-0.5 rounded border text-[10px] font-bold ${colors.bg} ${colors.text} ${colors.border}`}>
                {count} {sev}
              </span>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3 w-3 text-zinc-500" />
          <span className="text-[10px] text-zinc-500 uppercase font-bold">Severity:</span>
        </div>
        <button
          onClick={() => setSelectedSeverity('')}
          className={`px-2 py-0.5 rounded border text-[10px] font-mono transition-colors ${
            !selectedSeverity ? 'bg-white/[0.07] text-white border-white/[0.15]' : 'bg-transparent text-zinc-400 border-white/[0.07] hover:text-white'
          }`}
        >
          All
        </button>
        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
          <button
            key={sev}
            onClick={() => setSelectedSeverity(sev === selectedSeverity ? '' : sev)}
            className={`px-2 py-0.5 rounded border text-[10px] font-mono transition-colors ${
              selectedSeverity === sev 
                ? `${severityColors[sev].bg} ${severityColors[sev].text} ${severityColors[sev].border}` 
                : 'bg-transparent text-zinc-400 border-white/[0.07] hover:text-white'
            }`}
          >
            {sev}
          </button>
        ))}

        <div className="w-px h-4 bg-white/[0.07]" />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-500 uppercase font-bold">Type:</span>
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-2 py-0.5 rounded border border-white/[0.07] bg-[#121217] text-[10px] text-zinc-300 font-mono focus:outline-none focus:border-blue-500"
        >
          <option value="">All Types</option>
          {types.map(t => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          <span className="ml-2 text-zinc-400 text-xs">Running detection engine...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && detections.length === 0 && (
        <div className="border border-white/[0.07] rounded-lg bg-[#121217] py-16 text-center">
          <Shield className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white font-sans">All Clear</h3>
          <p className="text-xs text-zinc-400 mt-1">No issues detected in recent runs.</p>
        </div>
      )}

      {/* Detection Cards */}
      {!isLoading && detections.length > 0 && (
        <div className="space-y-2">
          {detections.map((item, i) => {
            const colors = severityColors[item.detection.severity] || severityColors.INFO;
            const TypeIcon = typeIcons[item.detection.type] || AlertTriangle;
            const isExpanded = expandedIndex === i;

            return (
              <div
                key={`${item.runId}-${item.detection.type}-${i}`}
                className={`border rounded-lg bg-[#121217] overflow-hidden transition-all ${colors.border}`}
              >
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className={`p-1.5 rounded ${colors.bg}`}>
                    <TypeIcon className={`h-3.5 w-3.5 ${colors.text}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${colors.bg} ${colors.text} ${colors.border}`}>
                        {item.detection.severity}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        {item.detection.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-white font-semibold mt-0.5 truncate font-sans">{item.detection.title}</p>
                  </div>

                  <Link
                    href={`/runs/${item.runId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-blue-400 transition-colors shrink-0 font-mono"
                  >
                    <span className="truncate max-w-[120px]">{item.runTitle.replace('[Demo] ', '')}</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>

                  <ChevronRight className={`h-3.5 w-3.5 text-zinc-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-white/[0.05]">
                    <div className="pt-3 text-xs text-zinc-300 font-sans leading-relaxed">
                      {item.detection.description}
                    </div>
                    
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Evidence</span>
                      <div className="space-y-1">
                        {item.detection.evidence.map((ev, ei) => (
                          <div key={ei} className="flex items-start gap-1.5 text-[11px] text-zinc-400 font-mono">
                            <span className={`${colors.text} mt-0.5`}>•</span>
                            <span>{ev}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Impact</span>
                        <p className="text-[11px] text-amber-300/80 font-mono">{item.detection.impact}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Recommendation</span>
                        <p className="text-[11px] text-emerald-300/80 font-mono">{item.detection.recommendation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
