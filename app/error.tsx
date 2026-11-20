'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { PageShell } from '@/components/ui/Page';

/**
 * Error boundary for every page. Next.js renders this instead of a blank
 * screen when a page throws while rendering or loading its data.
 * `reset` re-renders the page that failed.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <PageShell className="flex items-center justify-center">
      <div role="alert" className="max-w-md text-center font-sans">
        <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-md border border-bad/30 bg-bad/10 text-bad">
          <AlertTriangle className="size-5" aria-hidden />
        </div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Something went wrong on this page</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          The page failed to load. Your data has not been changed. Try again, and if it keeps failing, check that the database is reachable.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-2xs text-ink-3">Error reference: {error.digest}</p>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button variant="primary" onClick={reset}>
            <RefreshCw aria-hidden /> Try again
          </Button>
          <ButtonLink href="/runs">Go to runs</ButtonLink>
        </div>
      </div>
    </PageShell>
  );
}
