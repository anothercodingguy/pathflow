import { PageShell } from '@/components/ui/Page';
import { LoadingBlock } from '@/components/ui/States';

/** Shown while the server loads the run and its spans from the database. */
export default function LoadingRun() {
  return (
    <PageShell>
      <LoadingBlock label="Loading run…" className="py-32" />
    </PageShell>
  );
}
