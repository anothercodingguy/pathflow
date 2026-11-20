'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Shield, XCircle, Clock, DollarSign, Zap,
  ChevronRight, ArrowUpRight, Bug, RefreshCw, Loader2,
} from 'lucide-react';
import FilterPills from '@/components/ui/FilterPills';
import { PageShell, PageHeader } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { Badge, BadgeTone } from '@/components/ui/Badge';
import { DemoBadge, DemoNotice, EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { useApiData } from '@/lib/useApiData';
import { demoScope, isDemoRunId } from '@/lib/demo';

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

const severityTone: Record<string, BadgeTone> = {
  CRITICAL: 'bad',
  HIGH: 'warn',
  MEDIUM: 'warn',
  LOW: 'accent',
  INFO: 'neutral',
};

const severityBorder: Record<string, string> = {
  CRITICAL: 'border-bad/40',
  HIGH: 'border-warn/40',
  MEDIUM: 'border-warn/25',
  LOW: 'border-accent/30',
  INFO: 'border-line',
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
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
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Detections are produced by fixed rules in lib/detections.ts (loops, retries,
  // timeouts, cost and token thresholds). The filters are applied by the API.
  const params = new URLSearchParams();
  if (selectedSeverity) params.append('severity', selectedSeverity);
  if (selectedType) params.append('type', selectedType);
  const query = params.toString();

  const { data, loading, error, reload } = useApiData<DetectionItem[]>(
    `/api/v1/detections${query ? `?${query}` : ''}`,
    (json) => (Array.isArray(json.detections) ? json.detections : [])
  );
  // Most severe first. (The API's own sort treats CRITICAL's rank of 0 as
  // "missing" and puts critical items last, so the order is fixed here.)
  const severityRank: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
  const detections = [...(data ?? [])].sort(
    (x, y) => (severityRank[x.detection.severity] ?? 5) - (severityRank[y.detection.severity] ?? 5)
  );

  const severityCounts: Record<string, number> = {};
  detections.forEach(d => {
    severityCounts[d.detection.severity] = (severityCounts[d.detection.severity] || 0) + 1;
  });

  const types = [...new Set([...detections.map(d => d.detection.type), ...(selectedType ? [selectedType] : [])])];
  const demo = demoScope(detections, (d) => isDemoRunId(d.runId));
  const hasFilters = !!selectedSeverity || !!selectedType;

  return (
    <PageShell>
      <PageHeader
        title="Detections"
        badge={demo !== 'none' ? <DemoBadge scope={demo} /> : undefined}
        description="Issues found by PathFlow's detection rules across recent runs: loops, retries, timeouts, cost and token spikes."
        actions={
          <Button onClick={reload} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
            Refresh
          </Button>
        }
      />

      <DemoNotice scope={demo} what="detections" />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <FilterPills
          label="Filter by severity"
          items={[
            { id: '', label: 'All', count: selectedSeverity ? undefined : detections.length },
            { id: 'CRITICAL', label: 'Critical', count: selectedSeverity && selectedSeverity !== 'CRITICAL' ? undefined : severityCounts.CRITICAL || 0, dotColor: '#EF4444' },
            { id: 'HIGH', label: 'High', count: selectedSeverity && selectedSeverity !== 'HIGH' ? undefined : severityCounts.HIGH || 0, dotColor: '#F59E0B' },
            { id: 'MEDIUM', label: 'Medium', count: selectedSeverity && selectedSeverity !== 'MEDIUM' ? undefined : severityCounts.MEDIUM || 0, dotColor: '#EAB308' },
            { id: 'LOW', label: 'Low', count: selectedSeverity && selectedSeverity !== 'LOW' ? undefined : severityCounts.LOW || 0, dotColor: '#3B82F6' },
          ]}
          selectedId={selectedSeverity}
          onSelect={(id) => setSelectedSeverity(id)}
        />

        <label className="flex items-center gap-2 font-mono text-2xs font-semibold uppercase text-ink-3">
          Type
          <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="max-w-[14rem] font-mono normal-case text-ink">
            <option value="">All types</option>
            {types.map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </Select>
        </label>
      </div>

      {loading ? (
        <LoadingBlock label="Running detection rules…" />
      ) : error ? (
        <ErrorState title="Could not load detections" message={error} onRetry={reload} />
      ) : detections.length === 0 ? (
        <EmptyState
          icon={<Shield />}
          title={hasFilters ? 'No detections match these filters' : 'No issues detected'}
          action={hasFilters ? <Button onClick={() => { setSelectedSeverity(''); setSelectedType(''); }}>Clear filters</Button> : undefined}
        >
          {hasFilters ? 'Try another severity or type.' : 'None of the detection rules fired on your recent runs.'}
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {detections.map((item, i) => {
            const sev = item.detection.severity;
            const TypeIcon = typeIcons[item.detection.type] || AlertTriangle;
            const key = `${item.runId}-${item.detection.type}-${i}`;
            const isExpanded = expandedKey === key;
            const panelId = `detection-${i}`;

            return (
              <li key={key} className={`overflow-hidden rounded-lg border bg-surface ${severityBorder[sev] || severityBorder.INFO}`}>
                {/* The expand button and the run link are siblings: a link inside a button is invalid HTML. */}
                <div className="flex flex-wrap items-stretch">
                  <button
                    type="button"
                    onClick={() => setExpandedKey(isExpanded ? null : key)}
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    className="flex min-w-0 flex-1 basis-64 items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-tint/[0.03] sm:px-4"
                  >
                    <ChevronRight className={`size-3.5 shrink-0 text-ink-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} aria-hidden />
                    <span className="flex size-7 shrink-0 items-center justify-center rounded bg-tint/[0.05] text-ink-2">
                      <TypeIcon className="size-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge tone={severityTone[sev] || 'neutral'}>{sev}</Badge>
                        <span className="font-mono text-2xs uppercase text-ink-3">{item.detection.type.replace(/_/g, ' ')}</span>
                        {demo === 'some' && isDemoRunId(item.runId) && <Badge tone="warn">Demo</Badge>}
                      </span>
                      <span className="mt-1 block font-sans text-xs font-semibold text-ink">{item.detection.title}</span>
                    </span>
                  </button>

                  <Link
                    href={`/runs/${item.runId}`}
                    className="flex min-w-0 items-center gap-1 border-t border-line px-3 py-2 font-mono text-2xs text-ink-2 transition-colors hover:text-accent-ink sm:border-l sm:border-t-0 sm:px-4 max-sm:basis-full"
                  >
                    <span className="sr-only">Open run: </span>
                    <span className="truncate sm:max-w-[14rem]">{item.runTitle}</span>
                    <ArrowUpRight className="size-3 shrink-0" aria-hidden />
                  </Link>
                </div>

                {isExpanded && (
                  <div id={panelId} className="space-y-3 border-t border-line px-3 pb-4 sm:px-4">
                    <p className="pt-3 font-sans text-xs leading-relaxed text-ink-2">{item.detection.description}</p>

                    <div>
                      <h3 className="mb-1 font-mono text-2xs font-semibold uppercase text-ink-3">Evidence</h3>
                      <ul className="space-y-1">
                        {item.detection.evidence.map((ev, ei) => (
                          <li key={ei} className="flex items-start gap-1.5 font-mono text-2xs text-ink-2">
                            <span aria-hidden className="mt-0.5 text-ink-3">•</span>
                            <span className="min-w-0 break-words">{ev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <h3 className="mb-1 font-mono text-2xs font-semibold uppercase text-ink-3">Impact</h3>
                        <p className="font-mono text-2xs text-warn">{item.detection.impact}</p>
                      </div>
                      <div>
                        <h3 className="mb-1 font-mono text-2xs font-semibold uppercase text-ink-3">Recommendation</h3>
                        <p className="font-mono text-2xs text-ok">{item.detection.recommendation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
