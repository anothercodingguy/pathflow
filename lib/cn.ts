import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Join class names. Later classes win over earlier ones that set the same
 * property (`cn('px-2', 'px-4')` gives `px-4`), which lets a caller override
 * a primitive's defaults through its `className` prop.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
