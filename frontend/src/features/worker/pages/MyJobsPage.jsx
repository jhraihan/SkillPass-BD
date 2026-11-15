import { ClipboardX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, LoadingState, Pagination } from '@/components/ui';
import { useScreenVoice } from '@/hooks/assistance';
import { useBookings } from '@/hooks/bookings';
import { cn } from '@/lib/cn';
import JobCard from '../components/JobCard';

const TABS = ['today', 'upcoming', 'past'];

export default function MyJobsPage() {
  const { t } = useTranslation('worker');
  const [scope, setScope] = useState('today');
  const [page, setPage] = useState(1);
  const { data, isPending, isError, refetch } = useBookings({ scope, page });
  useScreenVoice(t('voice.jobs'));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-navy-700">{t('jobs.title')}</h1>
      <div role="tablist" className="grid grid-cols-3 gap-2">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={scope === key}
            onClick={() => {
              setScope(key);
              setPage(1);
            }}
            className={cn(
              'min-h-12 rounded-xl text-lg font-semibold',
              scope === key ? 'bg-brand-600 text-white' : 'bg-white text-gray-700',
            )}
          >
            {t(`jobs.tabs.${key}`)}
          </button>
        ))}
      </div>

      {isPending && <LoadingState />}
      {isError && <ErrorState onRetry={refetch} />}
      {data?.results.length === 0 && <EmptyState icon={ClipboardX} title={t('jobs.empty')} />}
      <div className="space-y-3">
        {data?.results.map((booking) => (
          <JobCard key={booking.id} booking={booking} />
        ))}
      </div>
      {data && <Pagination page={page} count={data.count} onPageChange={setPage} />}
    </div>
  );
}
