import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
  secondary: 'bg-navy-700 text-white hover:bg-navy-800',
  outline: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-gray-700 hover:bg-gray-100',
};

const SIZES = {
  sm: 'min-h-9 gap-1.5 px-3 text-sm',
  md: 'min-h-11 gap-2 px-4 text-base',
  lg: 'min-h-12 gap-2 px-5 text-lg',
  // Worker primary actions: at least 56px tall (PRD §14.2).
  xl: 'min-h-14 gap-3 px-6 text-xl font-semibold',
};

/**
 * <Button variant="primary" size="xl" fullWidth icon={Check}>…</Button>
 * Render a link with: <Button as={Link} to="/somewhere">…</Button>
 */
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
        'inline-flex items-center justify-center rounded-xl font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
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
