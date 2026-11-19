import { NavLink } from 'react-router';
import { cn } from '@/lib/cn';

const BASE = {
  top: 'min-h-11 shrink-0 gap-2 rounded-2xl px-3.5 text-sm',
  side: 'min-h-12 w-full gap-3 rounded-2xl px-3.5 text-base',
  bottom: 'min-h-16 flex-1 flex-col justify-center gap-0.5 text-sm',
};

function stateClass(variant, isActive) {
  if (variant === 'bottom') return isActive ? 'text-brand-700' : 'text-gray-500';
  return isActive
    ? 'bg-linear-to-r from-brand-500/15 to-electric-400/10 text-brand-800 ring-1 ring-brand-500/20'
    : 'text-gray-600 hover:bg-ink-900/5 hover:text-ink-900';
}

export default function NavItem({ to, icon: Icon, label, end = false, variant = 'top' }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center font-semibold transition-all duration-200',
          BASE[variant],
          stateClass(variant, isActive),
        )
      }
    >
      {({ isActive }) => (
        <>
          {Icon && variant === 'bottom' ? (
            <span
              className={cn(
                'flex h-8 w-14 items-center justify-center rounded-full transition-all duration-300',
                isActive && 'bg-linear-to-r from-brand-500/20 to-electric-400/15',
              )}
            >
              <Icon
                className="size-7 shrink-0"
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
              />
            </span>
          ) : (
            Icon && <Icon className="size-5 shrink-0" aria-hidden="true" />
          )}
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
