import { cn } from '@/lib/cn';

/** Shared look for text inputs, selects and textareas. */
export function controlClass(hasError, extra) {
  return cn(
    'block w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-gray-900',
    'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-600/25',
    'disabled:cursor-not-allowed disabled:bg-gray-100',
    hasError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-brand-600',
    extra,
  );
}

export function describedBy(id, { error, hint }) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
