import React from 'react';
import { cn } from '@/lib/cn';

/**
 * Form controls: Input, Select, Textarea and Label.
 * Every control needs an accessible name: either wrap it with
 * <Field label="..."> / pair it with <Label htmlFor>, or pass aria-label.
 */
const control =
  'w-full rounded-md border border-line bg-inset text-ink placeholder:text-ink-3 ' +
  'transition-colors hover:border-line-strong focus:border-accent ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const controlSizes = {
  sm: 'h-7 px-2 text-2xs',
  md: 'h-8 px-2.5 text-xs',
  lg: 'h-10 px-3 text-sm',
} as const;

export type ControlSize = keyof typeof controlSizes;

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  controlSize?: ControlSize;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { controlSize = 'md', className, ...props },
  ref
) {
  return <input ref={ref} className={cn(control, controlSizes[controlSize], className)} {...props} />;
});

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  controlSize?: ControlSize;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { controlSize = 'md', className, children, ...props },
  ref
) {
  return (
    <select ref={ref} className={cn(control, controlSizes[controlSize], 'w-auto cursor-pointer pr-7', className)} {...props}>
      {children}
    </select>
  );
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(control, 'px-2.5 py-2 text-xs', className)} {...props} />;
  }
);

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('block text-2xs font-semibold uppercase tracking-wide text-ink-3 font-mono', className)} {...props} />;
}

/** Label + control + optional hint, wired together with htmlFor / aria-describedby. */
export function Field({
  label,
  hint,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p id={`${htmlFor}-hint`} className="text-2xs text-ink-3 font-sans">{hint}</p>}
    </div>
  );
}
