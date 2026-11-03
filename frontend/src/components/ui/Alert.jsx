import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

const TONES = {
  error: { icon: AlertCircle, className: 'border-red-200 bg-red-50 text-red-900' },
  warning: { icon: TriangleAlert, className: 'border-amber-200 bg-amber-50 text-amber-900' },
  success: { icon: CheckCircle2, className: 'border-green-200 bg-green-50 text-green-900' },
  info: { icon: Info, className: 'border-navy-100 bg-navy-50 text-navy-900' },
};

export default function Alert({ tone = 'info', title, children, className }) {
  const { icon: Icon, className: toneClass } = TONES[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-xl border p-3 text-base', toneClass, className)}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
