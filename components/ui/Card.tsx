import React from 'react';
import { cn } from '@/lib/cn';

/** A bordered panel. Use CardHeader for the small title strip at the top. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-line bg-surface', className)} {...props} />;
}

export function CardHeader({
  title,
  icon,
  actions,
  className,
}: {
  title: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2', className)}>
      <h2 className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-2 font-mono">
        {icon}
        {title}
      </h2>
      {actions}
    </div>
  );
}

/**
 * Wrap every <table> in this. On narrow screens the table scrolls sideways
 * inside its own box instead of making the whole page scroll.
 */
export function TableWrap({ className, children, label }: { className?: string; children: React.ReactNode; label?: string }) {
  return (
    <div
      className={cn('w-full overflow-x-auto', className)}
      role="region"
      aria-label={label}
      tabIndex={label ? 0 : undefined}
    >
      {children}
    </div>
  );
}

/** Shared table cell classes so every table has the same header style. */
export const th = 'px-3 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-3 font-mono whitespace-nowrap';
export const theadRow = 'border-b border-line bg-inset text-left';
