'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ArrowUp, Check } from 'lucide-react';

export interface ApprovalQuestion {
  id: string;
  question: string;
  options: string[];
  allowCustom?: boolean;
  customPlaceholder?: string;
}

interface ApprovalCardProps {
  questions: ApprovalQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  onDismiss?: () => void;
  className?: string;
}

export default function ApprovalCard({
  questions,
  onSubmit,
  onDismiss,
  className = '',
}: ApprovalCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentQ.id] || '';
  const currentCustom = customInputs[currentQ.id] || '';

  const handleSelectOption = (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: option }));
  };

  const handleCustomChange = (val: string) => {
    setCustomInputs((prev) => ({ ...prev, [currentQ.id]: val }));
    setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsSubmitted(true);
      onSubmit(answers);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111115] p-5 shadow-2xl ${className}`}>
        <div className="flex items-center gap-2.5 text-emerald-400">
          <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          </div>
          <span className="text-sm font-semibold text-zinc-100">Feedback submitted to agent</span>
        </div>
        <p className="mt-1.5 text-xs text-zinc-400">The agent will proceed with your selected parameters.</p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#111115] shadow-2xl transition-all ${className}`}>
      {/* Question Section */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[13px] font-semibold text-zinc-100 leading-snug">
            {currentQ.question}
          </span>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Options */}
        <div className="mt-3 flex flex-col gap-1">
          {currentQ.options.map((opt) => {
            const isSelected = currentAnswer === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors duration-150 hover:bg-white/[0.05]"
              >
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-zinc-600 bg-transparent'
                  }`}
                >
                  <span
                    className="size-1.5 rounded-full bg-white transition-transform duration-200"
                    style={{ transform: isSelected ? 'scale(1)' : 'scale(0)' }}
                  />
                </span>
                <span className={`text-[13px] transition-colors ${isSelected ? 'text-zinc-100 font-medium' : 'text-zinc-400'}`}>
                  {opt}
                </span>
              </button>
            );
          })}

          {currentQ.allowCustom !== false && (
            <label className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors focus-within:bg-white/[0.05] hover:bg-white/[0.05]">
              <span className="size-4 shrink-0" />
              <input
                placeholder={currentQ.customPlaceholder || 'Type custom instructions…'}
                value={currentCustom}
                onChange={(e) => handleCustomChange(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[13px] text-zinc-100 outline-none placeholder:text-zinc-500"
              />
            </label>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between border-t border-white/[0.08] bg-[#0c0c0f] px-4 py-2.5">
        <div className="flex items-center gap-2">
          {questions.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex size-6 items-center justify-center rounded text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {/* Dots Indicator */}
          {questions.length > 1 && (
            <div className="flex items-center gap-1.5">
              {questions.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? 'size-2 border-2 border-blue-400 bg-blue-400'
                      : 'size-1.5 bg-zinc-600'
                  }`}
                />
              ))}
            </div>
          )}

          {questions.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
              className="flex size-6 items-center justify-center rounded text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-400"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Submit / Next Arrow */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!currentAnswer && !currentCustom}
          className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg transition-transform duration-150 hover:bg-blue-500 active:scale-95 disabled:opacity-40 disabled:hover:bg-blue-600"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
