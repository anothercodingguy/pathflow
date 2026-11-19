'use client';

import React, { useState } from 'react';
import { Check, AlertCircle, ChevronDown, Clock, Loader2 } from 'lucide-react';

export interface TaskMetric {
  label: string;
  value: string | number;
}

export interface TaskRowItem {
  id: string;
  stepNumber?: number;
  title: string;
  subtitle?: string;
  status: 'COMPLETED' | 'RUNNING' | 'FAILED' | 'PENDING';
  metrics?: TaskMetric[];
  href?: string;
}

interface TaskRowsProps {
  tasks: TaskRowItem[];
  onSelectTask?: (task: TaskRowItem) => void;
  className?: string;
}

export default function TaskRows({
  tasks,
  onSelectTask,
  className = '',
}: TaskRowsProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={`flex w-full flex-col gap-2 font-sans ${className}`}>
      {tasks.map((task, idx) => {
        const isExpanded = !!expandedIds[task.id];
        const isCompleted = task.status === 'COMPLETED';
        const isRunning = task.status === 'RUNNING';
        const isFailed = task.status === 'FAILED';

        return (
          <div
            key={task.id}
            className="self-stretch overflow-hidden rounded-2xl border border-line bg-surface shadow-lg transition-all"
          >
            {/* Header Row */}
            <button
              type="button"
              onClick={() => {
                if (task.metrics && task.metrics.length > 0) {
                  toggleExpand(task.id);
                }
                onSelectTask?.(task);
              }}
              className="flex h-12 w-full items-center gap-3 px-3.5 text-left transition-colors duration-150 hover:bg-tint/[0.04]"
            >
              {/* Step indicator */}
              <span className="flex size-6 shrink-0 items-center justify-center">
                {isCompleted && (
                  <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                )}
                {isRunning && (
                  <span className="relative inline-flex shrink-0 items-center justify-center size-6">
                    <svg width="24" height="24" className="absolute inset-0 animate-spin text-blue-500">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray="16 40"
                      />
                    </svg>
                    <span className="relative text-2xs font-semibold font-mono text-ink">
                      {task.stepNumber || idx + 1}
                    </span>
                  </span>
                )}
                {isFailed && (
                  <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow">
                    <AlertCircle className="h-3.5 w-3.5 stroke-[2.5]" />
                  </span>
                )}
                {!isCompleted && !isRunning && !isFailed && (
                  <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink-2 font-mono text-2xs">
                    {task.stepNumber || idx + 1}
                  </span>
                )}
              </span>

              {/* Title & Subtitle */}
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                {task.title}
              </span>

              {task.subtitle && (
                <span className="text-[12px] font-mono text-ink-2 truncate max-w-[120px]">
                  {task.subtitle}
                </span>
              )}

              {/* Status Badge */}
              <span
                className={`inline-flex h-5 items-center rounded-full px-2 text-2xs font-semibold font-mono uppercase tracking-wider ${
                  isCompleted
                    ? 'bg-emerald-500/10 text-ok border border-emerald-500/20'
                    : isRunning
                    ? 'bg-blue-500/10 text-accent-ink border border-blue-500/20 animate-pulse'
                    : isFailed
                    ? 'bg-red-500/10 text-bad border border-red-500/20'
                    : 'bg-tint/10 text-ink-2'
                }`}
              >
                {task.status}
              </span>

              {/* Expand Chevron if metrics present */}
              {task.metrics && task.metrics.length > 0 && (
                <span className="flex size-5 shrink-0 items-center justify-center text-ink-3">
                  <ChevronDown
                    className="h-4 w-4 transition-transform duration-300"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}
                  />
                </span>
              )}
            </button>

            {/* Sub-Metrics Drawer */}
            {task.metrics && task.metrics.length > 0 && (
              <div
                className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
                style={{
                  gridTemplateRows: isExpanded ? '1fr' : '0fr',
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                <div className="overflow-hidden">
                  <div className="mb-2.5 grid grid-cols-[24px_1fr] gap-2.5 px-3.5 pt-1">
                    <span aria-hidden className="mx-auto h-full w-px bg-tint/10" />
                    <div className="flex flex-col gap-1.5">
                      {task.metrics.map((m, mIdx) => (
                        <div key={mIdx} className="flex items-center justify-between text-xs">
                          <span className="text-ink-2">{m.label}</span>
                          <span className="font-mono text-2xs text-ink tabular-nums">
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
