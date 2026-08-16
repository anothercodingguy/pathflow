'use client';

import React, { useEffect, useState } from 'react';

/* ─────────────────────────────────────────────────────────
 * LOADING STATE — pixel-grid loader for long-running work
 *
 * Variants:
 *   Drive  — square cells, chevron wavefront driving right
 *   Dots   — circular cells wavefront
 *   Orbit  — a comet lapping the grid perimeter
 * ───────────────────────────────────────────────────────── */

const chevron = Array.from({ length: 9 }, (_, i) => {
  const r = Math.floor(i / 3);
  const c = i % 3;
  return (c + Math.abs(r - 1)) * 90;
});

const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3];
const orbit = Array.from({ length: 9 }, (_, i) => {
  const k = ORBIT_ORDER.indexOf(i);
  return k === -1 ? null : k * 110;
});

const PATTERNS: Record<string, { delays: (number | null)[]; dur: number; round: boolean }> = {
  Drive: { delays: chevron, dur: 650, round: false },
  Dots: { delays: chevron, dur: 650, round: true },
  Orbit: { delays: orbit, dur: 950, round: false },
};

export function useElapsed() {
  const [ds, setDs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDs((d) => d + 1), 100);
    return () => clearInterval(t);
  }, []);
  const total = ds / 10;
  if (total < 60) return `${total.toFixed(1)}s`;
  return `${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`;
}

interface LoadingStateProps {
  label?: string;
  variant?: 'Drive' | 'Dots' | 'Orbit';
  showElapsed?: boolean;
  className?: string;
}

export default function LoadingState({
  label = 'Analyzing traces…',
  variant = 'Drive',
  showElapsed = true,
  className = '',
}: LoadingStateProps) {
  const elapsed = useElapsed();
  const { delays, dur, round } = PATTERNS[variant] ?? PATTERNS.Drive;

  return (
    <div className={`flex w-fit items-center gap-2.5 ${className}`}>
      <span aria-hidden className="grid grid-cols-[repeat(3,4px)] gap-[1.5px] shrink-0">
        {delays.map((d, i) => (
          <span
            key={i}
            className={`size-[4px] bg-blue-500 dark:bg-blue-400 ${round ? 'rounded-full' : 'rounded-[1px]'}`}
            style={{
              opacity: d === null ? 0.15 : 0.25,
              animation:
                d === null ? 'none' : `pixel-on ${dur}ms ease-in-out ${d}ms infinite`,
            }}
          />
        ))}
      </span>
      <span
        className="bg-clip-text text-[13px] font-medium text-transparent"
        style={{
          backgroundImage:
            'linear-gradient(90deg, #71717a 30%, #f4f4f5 50%, #71717a 70%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer-text 1.5s linear infinite',
        }}
      >
        {label}
      </span>
      {showElapsed && (
        <span className="font-mono text-[12px] text-zinc-400 tabular-nums">
          {elapsed}
        </span>
      )}
    </div>
  );
}
