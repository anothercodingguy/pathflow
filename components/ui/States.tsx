import React from 'react';
import { AlertTriangle, FlaskConical, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import type { DemoScope } from '@/lib/demo';

/**
 * The honest states every data screen needs:
 *   LoadingBlock  while a request is in flight
 *   EmptyState    the request worked and there is nothing to show
 *   ErrorState    the request failed (with a Retry button)
 *   DemoBadge / DemoNotice  what is on screen is built-in sample data
 */

export function LoadingBlock({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn('flex items-center justify-center gap-2 py-16 text-xs text-ink-2 font-sans', className)}>
      <Loader2 className="size-4 animate-spin text-accent-ink" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-dashed border-line-strong bg-surface px-4 py-12 text-center font-sans', className)}>
      {icon && <div className="mx-auto mb-3 flex size-9 items-center justify-center rounded-md bg-tint/[0.05] text-ink-3 [&_svg]:size-4">{icon}</div>}
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {children && <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-2">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Could not load this data',
  message,
  onRetry,
  className,
}: {
  title?: string;
  /** What went wrong, in plain words. Shown under the title. */
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={cn('rounded-lg border border-bad/30 bg-bad/[0.06] px-4 py-10 text-center font-sans', className)}>
      <div className="mx-auto mb-3 flex size-9 items-center justify-center rounded-md bg-bad/10 text-bad">
        <AlertTriangle className="size-4" aria-hidden />
      </div>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-2">
        {message || 'The request failed. Nothing is shown rather than showing stale or sample data.'}
      </p>
      {onRetry && (
        <div className="mt-4 flex justify-center">
          <Button onClick={onRetry}>
            <RefreshCw aria-hidden /> Retry
          </Button>
        </div>
      )}
    </div>
  );
}

/** An inline error line for a section of a page (settings panels, forms). */
export function InlineError({ children, onRetry, className }: { children: React.ReactNode; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn('flex flex-wrap items-center gap-2 rounded-md border border-bad/30 bg-bad/[0.06] px-3 py-2 text-xs text-bad font-sans', className)}>
      <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">{children}</span>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

/** The single, consistent marker for built-in sample data. */
export function DemoBadge({ scope = 'all', className }: { scope?: Exclude<DemoScope, 'none'>; className?: string }) {
  return (
    <span
      title={
        scope === 'all'
          ? 'Built-in sample data that ships with PathFlow. It is not telemetry from your agents.'
          : 'Some of what is shown is built-in sample data, not telemetry from your agents.'
      }
      className={cn(
        'inline-flex items-center gap-1 rounded border border-warn/40 bg-warn/10 px-1.5 py-0.5 text-2xs font-semibold font-mono leading-none text-warn whitespace-nowrap',
        className
      )}
    >
      <FlaskConical className="size-3" aria-hidden />
      {scope === 'all' ? 'Demo data' : 'Includes demo data'}
    </span>
  );
}

/** A one-line explanation shown under the page header when demo data is on screen. */
export function DemoNotice({ scope, what, className }: { scope: DemoScope; what: string; className?: string }) {
  if (scope === 'none') return null;
  return (
    <p
      role="note"
      className={cn('flex flex-wrap items-center gap-2 rounded-md border border-warn/30 bg-warn/[0.06] px-3 py-2 text-xs text-ink-2 font-sans', className)}
    >
      <FlaskConical className="size-3.5 shrink-0 text-warn" aria-hidden />
      <span className="min-w-0">
        {scope === 'all'
          ? `Demo data: these ${what} are built-in samples, not telemetry from your agents. Send a trace with the SDK to see your own.`
          : `Includes demo data: some of these ${what} are built-in samples, not telemetry from your agents.`}
      </span>
    </p>
  );
}
