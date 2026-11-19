import { cn } from '@/lib/cn';

const TONES = {
  gray: 'bg-gray-100/90 text-gray-700 ring-gray-500/15',
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  yellow: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  blue: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  red: 'bg-red-50 text-red-800 ring-red-600/20',
  brand: 'bg-brand-50 text-brand-800 ring-brand-600/20',
};

const SIZES = {
  sm: 'gap-1 px-2 py-0.5 text-xs',
  md: 'gap-1.5 px-2.5 py-1 text-sm',
  lg: 'gap-2 px-3 py-1.5 text-base',
};

export default function Badge({ tone = 'gray', size = 'md', icon: Icon, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold ring-1 ring-inset',
        TONES[tone],
        SIZES[size],
        className,
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}
