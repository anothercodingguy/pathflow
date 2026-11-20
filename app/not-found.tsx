import { Compass } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { PageShell } from '@/components/ui/Page';

/**
 * Shown for any URL that does not match a page, and when a page calls
 * notFound() (for example /runs/<id> for a run that does not exist).
 */
export default function NotFound() {
  return (
    <PageShell className="flex items-center justify-center">
      <div className="max-w-md text-center font-sans">
        <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-md border border-line bg-surface text-ink-3">
          <Compass className="size-5" aria-hidden />
        </div>
        <p className="font-mono text-2xs font-semibold uppercase tracking-wide text-ink-3">404</p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink">This page does not exist</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          The link may be old, or the run may have been deleted or belong to another workspace.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/runs" variant="primary">Go to runs</ButtonLink>
          <ButtonLink href="/settings">Settings</ButtonLink>
        </div>
      </div>
    </PageShell>
  );
}
