'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, ArrowRight, Zap, DollarSign, Bot, Search, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { DemoBadge, DemoNotice, EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { useApiData } from '@/lib/useApiData';
import { demoScope, isDemoSessionId } from '@/lib/demo';

interface SessionItem {
  sessionId: string;
  agentName: string;
  modelFamily: string;
  turnCount: number;
  totalTokens: number;
  totalCostUsd: number;
  totalDurationMs: number;
  status: string;
  lastActiveAt: string;
  previewPrompt: string;
}

export default function SessionsPage() {
  // No mock data as the initial state: until the request returns we show a
  // loading state, and if it fails we show an error with Retry.
  const { data, loading, error, reload } = useApiData<SessionItem[]>(
    '/api/v1/sessions',
    (json) => (Array.isArray(json.sessions) ? json.sessions : [])
  );
  const sessions = data ?? [];
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.sessionId.toLowerCase().includes(q) ||
      s.agentName.toLowerCase().includes(q) ||
      s.previewPrompt.toLowerCase().includes(q) ||
      s.modelFamily.toLowerCase().includes(q)
    );
  });

  const demo = demoScope(sessions, (s) => isDemoSessionId(s.sessionId));

  return (
    <PageShell>
      <PageHeader
        title="Sessions"
        badge={demo !== 'none' ? <DemoBadge scope={demo} /> : undefined}
        description="Multi-turn agent conversations, grouped by session ID, with step-by-step replay."
        actions={
          <Button onClick={reload} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
            Refresh
          </Button>
        }
      />

      <DemoNotice scope={demo} what="sessions" />

      {loading ? (
        <LoadingBlock label="Loading sessions…" />
      ) : error ? (
        <ErrorState title="Could not load sessions" message={error} onRetry={reload} />
      ) : sessions.length === 0 ? (
        <EmptyState icon={<MessageSquare />} title="No sessions yet">
          Tag runs with a <code className="font-mono text-accent-ink">sessionId</code> in the SDK and they are grouped here as a conversation.
        </EmptyState>
      ) : (
        <>
          <div className="relative max-w-md">
            <label htmlFor="sessions-search" className="sr-only">Search sessions</label>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" aria-hidden />
            <Input
              id="sessions-search"
              type="text"
              autoComplete="off"
              placeholder="Search by prompt, agent or session ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface pl-8"
            />
          </div>

          {filteredSessions.length === 0 ? (
            <EmptyState icon={<Search />} title="No sessions match this search" action={<Button onClick={() => setSearchQuery('')}>Clear search</Button>} />
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredSessions.map((session) => (
                <li key={session.sessionId}>
                  <Link
                    href={`/sessions/${encodeURIComponent(session.sessionId)}`}
                    className="group block h-full space-y-3 rounded-lg border border-line bg-surface p-3.5 transition-colors hover:border-accent/40 hover:bg-raised"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-tint/[0.06] text-ink-2">
                          <Bot className="size-3.5" aria-hidden />
                        </span>
                        <span className="truncate font-sans text-xs font-semibold text-ink">{session.agentName}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {demo === 'some' && isDemoSessionId(session.sessionId) && <Badge tone="warn">Demo</Badge>}
                        {session.status === 'completed' ? (
                          <Badge tone="ok"><CheckCircle2 className="size-3" aria-hidden /> Completed</Badge>
                        ) : session.status === 'running' ? (
                          <Badge tone="accent">Running</Badge>
                        ) : (
                          <Badge tone="bad"><XCircle className="size-3" aria-hidden /> Failed</Badge>
                        )}
                      </div>
                    </div>

                    <p className="line-clamp-2 rounded-md border border-line bg-inset p-2 font-mono text-xs text-ink-2">
                      &ldquo;{session.previewPrompt}&rdquo;
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-2 font-mono text-2xs text-ink-2">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="size-3 text-ink-3" aria-hidden />
                        {session.turnCount} {session.turnCount === 1 ? 'turn' : 'turns'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="size-3 text-ink-3" aria-hidden />
                        {session.totalTokens.toLocaleString()} tok
                      </span>
                      <span className="ml-auto flex items-center gap-0.5 font-semibold text-ink">
                        <DollarSign className="size-3 text-ink-3" aria-hidden />
                        {session.totalCostUsd.toFixed(4)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-mono text-2xs text-ink-3">
                      <span>{new Date(session.lastActiveAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 text-accent-ink">
                        Replay <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </PageShell>
  );
}
