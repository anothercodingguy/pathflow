'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * An accessible modal dialog.
 *
 * What it does for you:
 *  - role="dialog" + aria-modal + a title wired up with aria-labelledby
 *  - Esc and a click on the dark backdrop both close it
 *  - focus moves into the dialog when it opens, Tab cycles inside it
 *    (a "focus trap"), and focus returns to the button that opened it on close
 *  - the page behind does not scroll while it is open
 */
export function Modal({
  open,
  onClose,
  title,
  icon,
  children,
  initialFocusRef,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** Element to focus on open. Defaults to the first focusable element. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    const first = initialFocusRef?.current || panel?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === firstEl || !panel.contains(active))) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && (active === lastEl || !panel.contains(active))) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose, initialFocusRef]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-3 pt-[10vh] backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn('w-full max-w-xl rounded-xl border border-line-strong bg-surface p-3 font-sans shadow-2xl', className)}
      >
        <div className="flex items-center justify-between border-b border-line px-1 pb-2">
          <h2 id={titleId} className="flex items-center gap-1.5 text-xs font-semibold text-ink">
            {icon}
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-ink-3 hover:bg-tint/[0.06] hover:text-ink"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
