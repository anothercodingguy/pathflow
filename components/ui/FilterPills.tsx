'use client';

import React from 'react';

export interface FilterPillItem {
  id: string;
  label: string;
  count?: number;
  dotColor?: string; // e.g. '#10B981', '#EF4444', '#3B82F6'
}

interface FilterPillsProps {
  items: FilterPillItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
  /** Accessible name for the group, e.g. "Filter by status". */
  label?: string;
}

export default function FilterPills({
  items,
  selectedId,
  onSelect,
  className = '',
  label = 'Filter',
}: FilterPillsProps) {
  return (
    <div role="group" aria-label={label} className={`flex max-w-full items-center gap-1.5 overflow-x-auto py-1 ${className}`}>
      {items.map((item) => {
        const isSelected = item.id === selectedId;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            aria-pressed={isSelected}
            className={`flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-all duration-150 ${
              isSelected
                ? 'bg-accent/15 text-accent-ink border border-accent/40'
                : 'text-ink-2 hover:bg-tint/[0.06] hover:text-ink border border-transparent'
            }`}
          >
            {item.dotColor && (
              <span
                aria-hidden
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: item.dotColor }}
              />
            )}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-2xs tabular-nums ${
                  isSelected
                    ? 'bg-accent/20 text-accent-ink'
                    : 'bg-tint/[0.06] text-ink-2'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
