'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, ArrowLeft, Bot, User, Wrench, ChevronRight, Zap, Clock, DollarSign, ArrowUpRight } from 'lucide-react';
import { PageShell } from '@/components/ui/Page';
import { ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DemoBadge, DemoNotice, EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { apiBase, demoScope, isDemoRun } from '@/lib/demo';

type Turn = any;

/**
 * Load the runs ("turns") of one session.
 *
 * The API answers with unrelated sample runs when it finds nothing for the
 * id, so we keep only the turns that really belong to this session and show
 * an empty state otherwise. The sessions list builds ids of the form
 * "session_<run id prefix>" for runs without a sessionId; for those we retry
 * with the run id itself.
 */
async function fetchTurns(sessionId: string): Promise<Turn[]> {
  const get = async (id: string): Promise<Turn[]> => {
    const res = await fetch(`${apiBase()}/api/v1/sessions?sessionId=${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`The server answered with HTTP ${res.status}.`);
    const data = await res.json();
    return Array.isArray(data.turns) ? data.turns : [];
  };

  const direct = (await get(sessionId)).filter((t) => t.sessionId === sessionId || t.id === sessionId);
  if (direct.length > 0) return direct;

  if (sessionId.startsWith('session_')) {
    const runId = sessionId.slice('session_'.length);
    return (await get(runId)).filter((t) => t.id === runId);
  }
  return [];
}

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = decodeURIComponent(params.id as string);

  const [turns, setTurns] = useState<Turn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSpans, setExpandedSpans] = useState<Record<string, boolean>>({});

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setTurns(await fetchTurns(sessionId));
    } catch (err) {
      setTurns([]);
      setError(err instanceof Error ? err.message : 'The request failed.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) loadSession();
  }, [sessionId, loadSession]);

  const toggleSpan = (spanId: string) => {
    setExpandedSpans((prev) => ({ ...prev, [spanId]: !prev[spanId] }));
  };

  const totalTokens = turns.reduce((acc, t) => acc + (t.totalTokens ?? t.tokens ?? 0), 0);
  const totalCost = turns.reduce((acc, t) => acc + (t.totalCostUsd ?? t.cost ?? 0), 0);
  const demo = demoScope(turns, isDemoRun);

  return (
    <PageShell>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line pb-3">
        <ButtonLink href="/sessions" size="sm">
          <ArrowLeft aria-hidden /> Sessions
        </ButtonLink>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-sans text-lg font-semibold tracking-tight text-ink">Session replay</h1>
            <Badge tone="accent" className="max-w-full truncate">{sessionId}</Badge>
            {demo !== 'none' && <DemoBadge scope={demo} />}
          </div>
          {!isLoading && !error && turns.length > 0 && (
            <p className="mt-0.5 font-mono text-2xs text-ink-2">
              {turns.length} {turns.length === 1 ? 'turn' : 'turns'} · {totalTokens.toLocaleString()} tokens · ${totalCost.toFixed(4)} total cost
            </p>
          )}
        </div>
      </header>

      <DemoNotice scope={demo} what="turns" />

      {isLoading ? (
        <LoadingBlock label="Loading session…" />
      ) : error ? (
        <ErrorState title="Could not load this session" message={error} onRetry={loadSession} />
      ) : turns.length === 0 ? (
        <EmptyState
          icon={<MessageSquare />}
          title="No runs found for this session"
          action={<ButtonLink href="/sessions">Back to sessions</ButtonLink>}
        >
          No run is recorded with the session ID <code className="font-mono text-ink">{sessionId}</code>.
        </EmptyState>
      ) : (
        <ol className="mx-auto max-w-4xl space-y-6 pb-12">
          {turns.map((turn, index) => {
            let userPrompt = turn.title;
            let agentOutput = turn.output || turn.description;
            try {
              if (turn.input) {
                const parsed = JSON.parse(turn.input);
                userPrompt = parsed.query || parsed.prompt || parsed.input || userPrompt;
              }
              if (turn.output) {
                const parsedOut = JSON.parse(turn.output);
                agentOutput = parsedOut.result || parsedOut.response || parsedOut.output || agentOutput;
              }
            } catch {
              // input/output are not JSON: show them as plain text
            }
            if (typeof userPrompt !== 'string') userPrompt = JSON.stringify(userPrompt, null, 2);
            if (typeof agentOutput !== 'string') agentOutput = JSON.stringify(agentOutput, null, 2);

            return (
              <li key={turn.id} className="space-y-4">
                <div className="flex items-center justify-center gap-2 font-mono text-2xs text-ink-3">
                  <span aria-hidden className="h-px w-8 bg-line" />
                  <span>Turn {index + 1}</span>
                  <span aria-hidden className="h-px w-8 bg-line" />
                </div>

                {/* 1. User prompt */}
                <div className="flex justify-end pl-6 sm:pl-12">
                  <div className="min-w-0 max-w-2xl space-y-1 rounded-xl rounded-tr-sm border border-line-strong bg-raised p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 font-mono text-2xs font-semibold text-ink-2">
                      <User className="size-3 text-accent-ink" aria-hidden />
                      User
                    </div>
                    <div className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-ink">{userPrompt}</div>
                  </div>
                </div>

                {/* 2. Spans executed for this turn */}
                {turn.spans && turn.spans.length > 0 && (
                  <div className="space-y-2 sm:px-12">
                    <div className="flex items-center gap-1 font-mono text-2xs uppercase tracking-wide text-ink-3">
                      <Wrench className="size-3" aria-hidden />
                      <span>Spans ({turn.spans.length})</span>
                    </div>
                    <ul className="space-y-1.5">
                      {turn.spans.map((span: any) => {
                        const spanKey = span.id || span.spanId;
                        const isExpanded = !!expandedSpans[spanKey];
                        const hasPayload = !!(span.rawInput || span.rawOutput);
                        return (
                          <li key={spanKey} className="overflow-hidden rounded-md border border-line bg-surface text-xs">
                            <button
                              type="button"
                              onClick={() => toggleSpan(spanKey)}
                              aria-expanded={isExpanded}
                              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-tint/[0.03]"
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <ChevronRight className={`size-3.5 shrink-0 text-ink-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} aria-hidden />
                                <span className="truncate font-mono text-xs text-ink">{span.name}</span>
                                <span className="shrink-0 rounded bg-tint/[0.06] px-1.5 py-0.5 font-mono text-2xs text-ink-2">{span.type}</span>
                              </span>
                              <span className="flex shrink-0 items-center gap-3 font-mono text-2xs text-ink-3">
                                <span>{span.latencyMs}ms</span>
                                <span className="hidden sm:inline">{span.tokens} tok</span>
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="space-y-2 border-t border-line bg-inset p-3 font-mono text-2xs">
                                {span.rawInput && (
                                  <div>
                                    <div className="text-ink-3">Input</div>
                                    <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-words rounded bg-tint/[0.05] p-2 text-ink-2">{span.rawInput}</pre>
                                  </div>
                                )}
                                {span.rawOutput && (
                                  <div>
                                    <div className="text-ink-3">Output</div>
                                    <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-words rounded bg-tint/[0.05] p-2 text-ink-2">{span.rawOutput}</pre>
                                  </div>
                                )}
                                {!hasPayload && <p className="text-ink-3">No input or output was recorded for this span.</p>}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* 3. Agent response */}
                <div className="flex items-start gap-2 pr-6 sm:gap-3 sm:pr-12">
                  <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-accent-ink">
                    <Bot className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 max-w-2xl flex-1 space-y-2 rounded-xl rounded-tl-sm border border-line bg-surface p-3 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line pb-1.5">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2">
                        <span className="font-sans text-xs font-semibold text-ink">{turn.agent?.name || 'Agent'}</span>
                        <span className="font-mono text-2xs text-ink-3">{turn.modelFamily}</span>
                      </div>
                      <Link href={`/runs/${turn.id}`} className="flex items-center gap-1 font-mono text-2xs text-accent-ink hover:underline">
                        Open run <ArrowUpRight className="size-3" aria-hidden />
                      </Link>
                    </div>

                    <div className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-ink">
                      {agentOutput || <span className="text-ink-3">No output was recorded for this run.</span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-2 font-mono text-2xs text-ink-2">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-ink-3" aria-hidden />
                        {(((turn.wallClockMs ?? turn.durationMs ?? 0) / 1000)).toFixed(2)}s
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="size-3 text-ink-3" aria-hidden />
                        {(turn.totalTokens ?? turn.tokens ?? 0).toLocaleString()} tokens
                      </span>
                      <span className="flex items-center gap-0.5">
                        <DollarSign className="size-3 text-ink-3" aria-hidden />
                        {(turn.totalCostUsd ?? turn.cost ?? 0).toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </PageShell>
  );
}
