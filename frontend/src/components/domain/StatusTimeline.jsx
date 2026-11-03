import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import StatusTag from './StatusTag';

export default function StatusTimeline({ history = [], className }) {
  const { t, i18n } = useTranslation();

  return (
    <ol className={cn('relative space-y-4 border-l-2 border-gray-200 pl-5', className)}>
      {history.map((entry, index) => (
        <li key={`${entry.to_status}-${index}`} className="relative">
          <span
            className={cn(
              'absolute -left-[1.6rem] top-1.5 size-3 rounded-full ring-4 ring-white',
              index === history.length - 1 ? 'bg-brand-600' : 'bg-gray-300',
            )}
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag status={entry.to_status} size="sm" />
            <span className="text-sm text-gray-500">
              {formatDateTime(entry.created_at, i18n.language)}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{t(`booking.actor.${entry.actor_role}`)}</p>
          {entry.note && <p className="mt-1 text-sm italic text-gray-700">“{entry.note}”</p>}
        </li>
      ))}
    </ol>
  );
}
