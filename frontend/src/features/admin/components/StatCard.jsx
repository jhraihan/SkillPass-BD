import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { Card } from '@/components/ui';
import { cn } from '@/lib/cn';

const TONES = {
  brand: 'bg-brand-50 text-brand-700',
  navy: 'bg-navy-50 text-navy-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
};

export default function StatCard({ icon: Icon, label, value, hint, to, tone = 'brand' }) {
  const body = (
    <Card
      className={cn(
        'flex h-full items-start gap-3',
        to && 'transition-colors hover:border-brand-300',
      )}
    >
      {Icon && (
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            TONES[tone],
          )}
        >
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {hint && <p className="text-sm text-gray-500">{hint}</p>}
      </div>
      {to && <ArrowRight className="size-5 shrink-0 text-gray-400" aria-hidden="true" />}
    </Card>
  );

  return to ? (
    <Link to={to} className="block rounded-2xl focus-visible:outline-2">
      {body}
    </Link>
  ) : (
    body
  );
}
