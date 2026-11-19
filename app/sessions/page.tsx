'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, ArrowRight, Clock, Zap, DollarSign, Bot, Search, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { MOCK_SESSIONS } from '@/lib/mockData';

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
  const [sessions, setSessions] = useState<SessionItem[]>(MOCK_SESSIONS as any);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSessions = async () => {
    try {
      const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
      const res = await fetch(`${apiBase}/api/v1/sessions`);
      const data = await res.json();
      if (data.success && data.sessions && data.sessions.length > 0) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.warn('Failed to load sessions, using mock fallback:', err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);


  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.sessionId.toLowerCase().includes(q) ||
      s.agentName.toLowerCase().includes(q) ||
      s.previewPrompt.toLowerCase().includes(q) ||
      s.modelFamily.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full min-h-[calc(100vh-2.75rem)] bg-canvas px-4 py-4 space-y-4 font-sans text-xs">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-3">
        <div>
          <h1 className="text-xl font-bold text-ink font-sans tracking-tight uppercase">Sessions</h1>
          <p className="text-xs text-ink-2 font-sans mt-0.5">Multi-turn agent dialogues, tool calls, and step-by-step chat replay.</p>
        </div>

        <button
          onClick={fetchSessions}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface text-ink-2 hover:text-ink font-mono text-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-accent-ink' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3" />
        <input
          type="text"
          placeholder="Search sessions by prompt, agent name, or session ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface border border-line rounded-lg pl-9 pr-4 py-2 text-xs text-ink placeholder:text-ink-3 focus:border-blue-500/50"
        />
      </div>

      {/* Sessions Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-ink-3 font-mono">Loading active sessions...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-12 bg-surface border border-line rounded-xl text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-ink-3 mx-auto" />
          <div className="text-sm font-semibold text-ink">No Sessions Found</div>
          <p className="text-ink-3 text-xs max-w-sm mx-auto">
            Trace multi-turn agent runs with a <code className="text-accent-ink">sessionId</code> tag in the SDK to inspect conversational threads.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSessions.map((session) => (
            <Link
              key={session.sessionId}
              href={`/sessions/${encodeURIComponent(session.sessionId)}`}
              className="bg-surface hover:bg-raised border border-line hover:border-blue-500/30 rounded-xl p-4 transition-all duration-150 space-y-3 group cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-tint/5 flex items-center justify-center text-ink-2">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-ink text-xs truncate max-w-[140px]">{session.agentName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {session.status === 'completed' ? (
                    <span className="flex items-center gap-1 text-2xs text-ok font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-2xs text-bad font-mono bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                      <XCircle className="w-2.5 h-2.5" /> Error
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-ink-2 line-clamp-2 bg-tint/[0.02] p-2 rounded-lg border border-line font-mono">
                &ldquo;{session.previewPrompt}&rdquo;
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-line text-2xs font-mono text-ink-2">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-ink-3" />
                  <span>{session.turnCount} turns</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-ink-3" />
                  <span>{session.totalTokens.toLocaleString()} tok</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <DollarSign className="w-3 h-3 text-ink-3" />
                  <span className="text-ink-2 font-semibold">${session.totalCostUsd.toFixed(4)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-2xs text-ink-3 font-mono">
                <span>{new Date(session.lastActiveAt).toLocaleDateString()}</span>
                <span className="text-accent-ink group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Replay Chat <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}
