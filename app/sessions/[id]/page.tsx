'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, ArrowLeft, Bot, User, Wrench, ChevronDown, ChevronRight, Zap, Clock, DollarSign, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { MOCK_RUNS } from '@/lib/mockData';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [turns, setTurns] = useState<any[]>(() => {
    const matching = MOCK_RUNS.filter(r => r.sessionId === sessionId || r.id === sessionId);
    return matching.length > 0 ? matching : MOCK_RUNS.slice(0, 3);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSpans, setExpandedSpans] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadSession() {
      try {
        const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
        const res = await fetch(`${apiBase}/api/v1/sessions?sessionId=${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (data.success && data.turns && data.turns.length > 0) {
          setTurns(data.turns);
        }
      } catch (err) {
        console.warn('Failed to load session details, using mock fallback:', err);
      }
    }
    if (sessionId) loadSession();
  }, [sessionId]);


  const toggleSpan = (spanId: string) => {
    setExpandedSpans((prev) => ({ ...prev, [spanId]: !prev[spanId] }));
  };

  const totalTokens = turns.reduce((acc, t) => acc + (t.totalTokens ?? t.tokens ?? 0), 0);
  const totalCost = turns.reduce((acc, t) => acc + (t.totalCostUsd ?? t.cost ?? 0), 0);


  return (
    <div className="w-full min-h-[calc(100vh-2.75rem)] bg-canvas px-4 py-4 space-y-4 font-sans text-xs">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/sessions')}
            className="p-1.5 rounded-lg border border-line bg-surface text-ink-2 hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-ink tracking-tight">Session Replay</h1>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-accent-ink font-mono text-2xs border border-blue-500/20">
                {sessionId}
              </span>
            </div>
            <p className="text-2xs text-ink-2 font-mono">
              {turns.length} message turns • {totalTokens.toLocaleString()} tokens • ${totalCost.toFixed(4)} total cost
            </p>
          </div>
        </div>
      </div>

      {/* Chat Timeline */}
      {isLoading ? (
        <div className="p-12 text-center text-ink-3 font-mono">Loading dialogue transcript...</div>
      ) : turns.length === 0 ? (
        <div className="p-12 text-center text-ink-3 font-mono">No dialogue turns recorded for this session ID.</div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
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
            } catch {}

            return (
              <div key={turn.id} className="space-y-4">
                
                {/* Turn Divider */}
                <div className="flex items-center gap-2 text-2xs font-mono text-ink-3 justify-center">
                  <span className="w-8 h-[1px] bg-tint/[0.07]" />
                  <span>Turn #{index + 1}</span>
                  <span className="w-8 h-[1px] bg-tint/[0.07]" />
                </div>

                {/* 1. User Prompt Bubble */}
                <div className="flex items-start gap-3 justify-end pl-12">
                  <div className="bg-[#E4E4E7] dark:bg-[#1C1C24] border border-[#D4D4D8] dark:border-white/10 rounded-2xl rounded-tr-sm p-4 max-w-2xl text-[#09090B] dark:text-zinc-200 text-xs shadow-md space-y-1">
                    <div className="flex items-center gap-1.5 text-2xs font-mono text-ink-3 dark:text-zinc-400">
                      <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold">User</span>
                    </div>
                    <div className="leading-relaxed whitespace-pre-wrap font-sans text-[13px] text-[#09090B] dark:text-zinc-100">{userPrompt}</div>
                  </div>
                </div>



                {/* 2. Intermediate Tool Executions / Reasoning Spans */}
                {turn.spans && turn.spans.length > 0 && (
                  <div className="px-12 space-y-2">
                    <div className="text-2xs font-mono text-ink-3 uppercase tracking-wider flex items-center gap-1">
                      <Wrench className="w-3 h-3" />
                      <span>Intermediate Agent Execution Spans ({turn.spans.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {turn.spans.map((span: any) => {
                        const isExpanded = expandedSpans[span.id || span.spanId];
                        return (
                          <div
                            key={span.id || span.spanId}
                            className="bg-surface border border-line rounded-lg overflow-hidden text-xs"
                          >
                            <button
                              onClick={() => toggleSpan(span.id || span.spanId)}
                              className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-tint/[0.02] transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-ink-3" /> : <ChevronRight className="w-3.5 h-3.5 text-ink-3" />}
                                <span className="font-mono text-accent-ink text-xs">{span.name}</span>
                                <span className="px-1.5 py-0.2 rounded text-2xs font-mono bg-tint/5 text-ink-2">
                                  {span.type}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 font-mono text-2xs text-ink-3">
                                <span>{span.latencyMs}ms</span>
                                <span>{span.tokens} tok</span>
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="p-3 bg-black/40 border-t border-line space-y-2 font-mono text-2xs">
                                {span.rawInput && (
                                  <div>
                                    <div className="text-ink-3 text-2xs">Input:</div>
                                    <pre className="text-ink-2 bg-tint/5 p-2 rounded overflow-x-auto mt-0.5">{span.rawInput}</pre>
                                  </div>
                                )}
                                {span.rawOutput && (
                                  <div>
                                    <div className="text-ink-3 text-2xs">Output:</div>
                                    <pre className="text-ok/80 bg-tint/5 p-2 rounded overflow-x-auto mt-0.5">{span.rawOutput}</pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Agent Response Bubble */}
                <div className="flex items-start gap-3 pr-12">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-accent-ink shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-surface border border-line rounded-2xl rounded-tl-sm p-4 max-w-2xl text-ink text-xs shadow-lg space-y-2">
                    <div className="flex items-center justify-between border-b border-line pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">{turn.agent?.name || 'PathFlow Agent'}</span>
                        <span className="text-2xs text-ink-3 font-mono">({turn.modelFamily})</span>
                      </div>
                      <Link
                        href={`/runs/${turn.id}`}
                        className="text-2xs text-accent-ink hover:text-accent-ink font-mono flex items-center gap-1"
                      >
                        <span>Inspect Trace</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>

                    <div className="leading-relaxed whitespace-pre-wrap font-sans text-[13px] text-zinc-900 dark:text-zinc-100">
                      {agentOutput}
                    </div>


                    <div className="flex items-center gap-4 pt-2 border-t border-line text-2xs font-mono text-ink-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-ink-3" />
                        <span>{(((turn.wallClockMs ?? turn.durationMs ?? 0) / 1000)).toFixed(2)}s</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-ink-3" />
                        <span>{(turn.totalTokens ?? turn.tokens ?? 0).toLocaleString()} tokens</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-ink-3" />
                        <span>${(turn.totalCostUsd ?? turn.cost ?? 0).toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                </div>


              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
