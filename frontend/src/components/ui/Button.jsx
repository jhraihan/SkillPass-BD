import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  primary:
    'bg-linear-to-br from-brand-500 via-brand-600 to-brand-700 text-white shadow-lg shadow-brand-600/25 hover:shadow-xl hover:shadow-brand-500/35 hover:brightness-110',
  secondary:
    'bg-linear-to-br from-ink-700 to-ink-900 text-white shadow-lg shadow-ink-900/25 hover:shadow-xl hover:brightness-125',
  outline:
    'border border-gray-200 bg-white/85 text-gray-800 shadow-sm hover:border-brand-300 hover:bg-white hover:text-brand-800',
  danger:
    'bg-linear-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-600/25 hover:brightness-110',
  ghost: 'text-gray-700 hover:bg-ink-900/5',
};

const SIZES = {
  sm: 'min-h-9 gap-1.5 rounded-xl px-3.5 text-sm',
  md: 'min-h-11 gap-2 rounded-2xl px-5 text-base',
  lg: 'min-h-12 gap-2 rounded-2xl px-6 text-lg',
  xl: 'min-h-14 gap-3 rounded-2xl px-7 text-xl',
};

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon: Icon,
  type,
  disabled,
  className,
  children,
  ...props
}) {
  const isButton = Component === 'button';
  return (
    <Component
      type={isButton ? (type ?? 'button') : type}
      disabled={isButton ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-200',
        'active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="size-5 shrink-0" aria-hidden="true" />
      )}
      {children}
    </Component>
  );
}
