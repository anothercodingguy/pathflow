import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * The one button for the app.
 *
 *   <Button variant="primary" size="md" onClick={...}>Save</Button>
 *   <Button variant="ghost" size="icon" aria-label="Close"><X /></Button>
 *   <ButtonLink href="/runs" variant="secondary">Back to runs</ButtonLink>
 *
 * variant: primary (the main action, blue), secondary (bordered, default),
 *          ghost (no border, for toolbars), danger (destructive).
 * size:    sm (dense toolbars), md (default), lg (full-width form actions),
 *          icon (square, icon only: always pass aria-label).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const base =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-sans font-medium ' +
  'transition-colors duration-150 select-none ' +
  'disabled:opacity-50 disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:cursor-not-allowed ' +
  '[&_svg]:shrink-0';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent-strong text-white hover:bg-accent enabled:active:bg-accent-strong shadow-sm',
  secondary: 'border border-line bg-surface text-ink-2 hover:text-ink hover:border-line-strong hover:bg-raised',
  ghost: 'text-ink-2 hover:text-ink hover:bg-tint/[0.06]',
  danger: 'border border-bad/30 bg-bad/10 text-bad hover:bg-bad/20',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-2xs [&_svg]:size-3',
  md: 'h-8 px-3 text-xs [&_svg]:size-3.5',
  lg: 'h-10 px-4 text-sm [&_svg]:size-4',
  icon: 'size-8 [&_svg]:size-3.5',
};

export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className, type = 'button', ...props },
  ref
) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...props} />;
});

export interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Use a plain <a> (full page load / other site) instead of next/link. */
  external?: boolean;
}

export function ButtonLink({ href, variant = 'secondary', size = 'md', className, external, ...props }: ButtonLinkProps) {
  const cls = buttonClass(variant, size, className);
  if (external) return <a href={href} className={cls} {...props} />;
  return <Link href={href} className={cls} {...props} />;
}

export default Button;
