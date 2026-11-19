import { cn } from '@/lib/cn';

export default function Card({ as: Component = 'div', className, children, ...props }) {
  return (
    <Component
      className={cn(
        'rounded-3xl border border-white/80 bg-white/80 p-4 shadow-soft sm:p-6',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
