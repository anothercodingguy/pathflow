'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Share2, Code } from 'lucide-react';
import { PathData } from '@/lib/data';

interface ShareModalProps {
  path: PathData;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ path, isOpen, onClose }: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/paths/${path.id}` : `http://localhost:3000/paths/${path.id}`;

  const pythonSnippet = `from lib.sdk.pathflow import PathFlow

pf = PathFlow(api_key="pf_live_key_9942")

@pf.trace(run_title="${path.title}", segment_id="${path.skillSegment.toLowerCase().replace(/\s+/g, '-')}")
def execute_agent():
    # Forked completed path execution
    pass`;

  const copyToClipboard = (text: string, type: 'link' | 'snippet') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-strava-orange/10 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-strava-orange/20 text-strava-orange border border-strava-orange/30">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Share Completed Path</h3>
              <p className="text-xs text-zinc-400">Broadcast track record & fork execution path</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          
          {/* Path Preview */}
          <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-800 flex items-center gap-3">
            <img src={path.user.avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-strava-orange" />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-xs truncate">{path.title}</h4>
              <p className="text-[11px] font-mono text-strava-orange">{path.agent.name} • {path.tps} t/s • ${path.cost.toFixed(3)}</p>
            </div>
          </div>

          {/* Copyable Link */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Track Record URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-strava-orange"
              />
              <button
                onClick={() => copyToClipboard(shareUrl, 'link')}
                className="flex items-center gap-1.5 rounded-lg bg-strava-orange px-3.5 py-2 text-xs font-bold text-white hover:bg-strava-hover transition-colors shadow-md shadow-strava-orange/20"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Code Snippet for Forking */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="h-3.5 w-3.5 text-strava-orange" />
                Fork Python SDK Decorator
              </label>
              <button
                onClick={() => copyToClipboard(pythonSnippet, 'snippet')}
                className="text-[11px] font-mono text-strava-orange hover:underline flex items-center gap-1"
              >
                {copiedSnippet ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedSnippet ? 'Copied Snippet' : 'Copy Python Code'}
              </button>
            </div>
            <pre className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed">
              {pythonSnippet}
            </pre>
          </div>

        </div>

      </div>
    </div>
  );
}
