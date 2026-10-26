import { cn } from '@/lib/cn';

export default function Card({ as: Component = 'div', className, children, ...props }) {
  return (
    <Component
      className={cn('rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5', className)}
      {...props}
    >
      {children}
    </Component>
  );
}
