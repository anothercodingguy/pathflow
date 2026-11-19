import React from 'react';
import { cn } from '@/lib/cn';

/**
 * PageShell: the outer frame every screen shares (background, padding,
 * minimum height under the 44px nav bar). PageHeader: title, one-line
 * description and right-aligned actions that wrap under the title on phones.
 */
export function PageShell({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('w-full min-h-[calc(100dvh-2.75rem)] bg-canvas px-3 py-3 sm:px-4 sm:py-4 space-y-4 text-xs text-ink', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small element shown next to the title, e.g. <DemoBadge />. */
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-line pb-3', className)}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-ink font-sans">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-0.5 text-xs text-ink-2 font-sans">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
