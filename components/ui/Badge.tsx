import React from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'bad' | 'violet';

const tones: Record<BadgeTone, string> = {
  neutral: 'border-line bg-tint/[0.05] text-ink-2',
  accent: 'border-accent/30 bg-accent/10 text-accent-ink',
  ok: 'border-ok/30 bg-ok/10 text-ok',
  warn: 'border-warn/30 bg-warn/10 text-warn',
  bad: 'border-bad/30 bg-bad/10 text-bad',
  violet: 'border-violet/30 bg-violet/10 text-violet',
};

/** Small status label. `tone` picks the colour; text stays >= 11px. */
export function Badge({
  tone = 'neutral',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-2xs font-semibold font-mono leading-none whitespace-nowrap',
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export default Badge;
