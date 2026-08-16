'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Mic, ArrowUp, ChevronDown, Sparkles, Command, Cpu, AtSign } from 'lucide-react';

interface PromptBarProps {
  onSend?: (query: string, model: string) => void;
  placeholder?: string;
  models?: string[];
  suggestions?: string[];
  className?: string;
}

export default function PromptBar({
  onSend,
  placeholder = 'Query traces with @run, /filter, or natural language…',
  models = ['Claude 3.7 Sonnet', 'GPT-4o', 'Gemini 2.5 Flash', 'DeepSeek R1'],
  suggestions = [
    'Find highest latency LLM calls',
    'Which tool calls had retries or failures?',
    'Explain root cause of run errors',
    'Compare cost across all agent models',
  ],
  className = '',
}: PromptBarProps) {
  const [query, setQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if (!query.trim()) return;
    onSend?.(query, selectedModel);
    setQuery('');
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (sug: string) => {
    setQuery(sug);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full max-w-2xl font-sans ${className}`}>
      {/* Suggestions Box */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full mb-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#111115]/95 p-1.5 shadow-2xl backdrop-blur-md">
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Suggested Tracing Queries
          </p>
          <div className="flex flex-col gap-0.5">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectSuggestion(sug)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span>{sug}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Bar Frame */}
      <div className="relative isolate flex items-center gap-1.5 rounded-2xl border border-white/15 bg-[#111115]/95 p-1.5 shadow-2xl backdrop-blur-xl transition-all focus-within:border-blue-500/50">
        {/* At-tagging / Context Button */}
        <button
          type="button"
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200"
          title="Show query suggestions"
        >
          <Plus className="h-4 w-4" />
        </button>

        {/* Input Field */}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-1.5 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-500"
        />

        {/* Model Picker */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex h-7 items-center gap-1 rounded-lg bg-white/[0.04] px-2 text-[11.5px] font-medium text-zinc-300 hover:bg-white/[0.08] transition-colors"
          >
            <Cpu className="h-3 w-3 text-blue-400" />
            <span className="max-w-[90px] truncate">{selectedModel}</span>
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          </button>

          {isModelDropdownOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#111115] p-1 shadow-2xl z-50">
              {models.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setSelectedModel(m);
                    setIsModelDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                    selectedModel === m
                      ? 'bg-blue-600/20 text-blue-400 font-semibold'
                      : 'text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  <span>{m}</span>
                  {selectedModel === m && <span className="text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Voice Dictation (Demo) */}
        <button
          type="button"
          onClick={() => setIsListening(!isListening)}
          className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isListening
              ? 'bg-red-500/20 text-red-400 animate-pulse'
              : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
          }`}
          title="Dictate with voice"
        >
          <Mic className="h-4 w-4" />
        </button>

        {/* Send Action Trigger */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!query.trim()}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-40 disabled:hover:bg-blue-600"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
