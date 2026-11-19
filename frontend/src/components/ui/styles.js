import { cn } from '@/lib/cn';

export function controlClass(hasError, extra) {
  return cn(
    'neu-inset block w-full rounded-2xl border bg-white/90 px-4 py-3 text-base text-gray-900',
    'transition placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-4',
    'disabled:cursor-not-allowed disabled:bg-gray-100',
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
      : 'border-gray-200 focus:border-brand-500 focus:ring-brand-500/15',
    extra,
  );
}

export function describedBy(id, { error, hint }) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
