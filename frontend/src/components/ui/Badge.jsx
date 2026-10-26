import { cn } from '@/lib/cn';

const TONES = {
  gray: 'bg-gray-100 text-gray-700',
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  red: 'bg-red-100 text-red-800',
  brand: 'bg-brand-100 text-brand-800',
};

const SIZES = {
  sm: 'gap-1 px-2 py-0.5 text-xs',
  md: 'gap-1.5 px-2.5 py-1 text-sm',
  lg: 'gap-2 px-3 py-1.5 text-base',
};

/** Small label. Always pair color with text (and ideally an icon) — never color alone. */
export default function Badge({ tone = 'gray', size = 'md', icon: Icon, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
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
