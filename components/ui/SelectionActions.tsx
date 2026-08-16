'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, HelpCircle, Zap, Bug, ArrowUp, X } from 'lucide-react';

interface SelectionActionsProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  onAction?: (action: string, selectedText: string, customPrompt?: string) => void;
}

export default function SelectionActions({
  containerRef,
  onAction,
}: SelectionActionsProps) {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [activeActionFeedback, setActiveActionFeedback] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseUp(e: MouseEvent) {
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 3) {
        setPosition(null);
        return;
      }

      // Check if inside containerRef if provided
      if (containerRef?.current) {
        const anchorNode = selection.anchorNode;
        if (anchorNode && !containerRef.current.contains(anchorNode)) {
          setPosition(null);
          return;
        }
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectedText(text);
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 46,
      });
    }

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [containerRef]);

  if (!position || !selectedText) return null;

  const handleTrigger = (actionName: string) => {
    setActiveActionFeedback(`Running ${actionName}…`);
    onAction?.(actionName, selectedText, customInput);
    setTimeout(() => {
      setActiveActionFeedback(null);
      setPosition(null);
      window.getSelection()?.removeAllRanges();
    }, 1500);
  };

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 -translate-x-1/2 select-none animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: `${position.x}px`,
        top: `${Math.max(10, position.y)}px`,
      }}
    >
      <div className="flex h-9 items-center gap-1 overflow-hidden rounded-full border border-white/15 bg-[#111115]/95 px-1.5 shadow-2xl backdrop-blur-md">
        {activeActionFeedback ? (
          <div className="flex items-center gap-2 px-3 text-xs font-medium text-blue-400">
            <Sparkles className="h-3.5 w-3.5 animate-spin" />
            <span>{activeActionFeedback}</span>
          </div>
        ) : (
          <>
            {/* Quick Action Buttons */}
            <button
              type="button"
              onClick={() => handleTrigger('Explain')}
              className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium text-zinc-200 transition-colors hover:bg-white/10"
            >
              <HelpCircle className="h-3.5 w-3.5 text-zinc-400" />
              Explain
            </button>

            <button
              type="button"
              onClick={() => handleTrigger('Diagnose')}
              className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium text-zinc-200 transition-colors hover:bg-white/10"
            >
              <Bug className="h-3.5 w-3.5 text-amber-400" />
              Diagnose
            </button>

            <button
              type="button"
              onClick={() => handleTrigger('Optimize')}
              className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium text-zinc-200 transition-colors hover:bg-white/10"
            >
              <Zap className="h-3.5 w-3.5 text-blue-400" />
              Optimize
            </button>

            <span className="mx-0.5 h-3.5 w-px bg-white/15" />

            {/* Custom Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customInput.trim()) {
                  handleTrigger('Custom');
                }
              }}
              className="flex items-center"
            >
              <input
                placeholder="Ask AI…"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="h-6 w-24 bg-transparent px-2 text-[12px] text-zinc-100 outline-none placeholder:text-zinc-500 focus:w-36 transition-all"
              />
              <button
                type="submit"
                disabled={!customInput.trim()}
                className="flex size-6 items-center justify-center rounded-full bg-blue-600 text-white transition-transform hover:bg-blue-500 disabled:opacity-30"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
            </form>

            <button
              type="button"
              onClick={() => setPosition(null)}
              className="ml-0.5 flex size-6 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
