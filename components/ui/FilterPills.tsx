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
}

export default function FilterPills({
  items,
  selectedId,
  onSelect,
  className = '',
}: FilterPillsProps) {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto py-1 ${className}`}>
      {items.map((item) => {
        const isSelected = item.id === selectedId;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-all duration-150 ${
              isSelected
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                : 'text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 border border-transparent'
            }`}
          >
            {item.dotColor && (
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: item.dotColor }}
              />
            )}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.2 font-mono text-[10.5px] tabular-nums ${
                  isSelected
                    ? 'bg-blue-500/30 text-blue-300'
                    : 'bg-white/[0.06] text-zinc-500'
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
