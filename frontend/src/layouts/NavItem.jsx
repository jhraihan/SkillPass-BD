import { NavLink } from 'react-router';
import { cn } from '@/lib/cn';

/** Link that highlights itself when its page is open. variant: 'top' | 'side' | 'bottom' */
export default function NavItem({ to, icon: Icon, label, end = false, variant = 'top' }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center font-medium transition-colors',
          variant === 'top' && 'min-h-11 shrink-0 gap-2 rounded-xl px-3 text-sm',
          variant === 'side' && 'min-h-11 w-full gap-3 rounded-xl px-3 text-base',
          variant === 'bottom' && 'min-h-16 flex-1 flex-col justify-center gap-1 text-sm',
          variant === 'bottom'
            ? isActive
              ? 'text-brand-700'
              : 'text-gray-500'
            : isActive
              ? 'bg-brand-50 text-brand-800'
              : 'text-gray-700 hover:bg-gray-100',
        )
      }
    >
      {({ isActive }) => (
        <>
          {Icon && (
            <Icon
              className={cn(variant === 'bottom' ? 'size-7' : 'size-5', 'shrink-0')}
              strokeWidth={isActive && variant === 'bottom' ? 2.5 : 2}
              aria-hidden="true"
            />
          )}
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
