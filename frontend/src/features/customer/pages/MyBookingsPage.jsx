import { CalendarX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { CategoryIcon, StatusTag } from '@/components/domain';
import { EmptyState, ErrorState, LoadingState, PageHeader, Pagination } from '@/components/ui';
import { useBookings } from '@/hooks/bookings';
import { cn } from '@/lib/cn';
import { formatDate, localName } from '@/lib/format';

const TABS = ['active', 'past'];

export function BookingRow({ booking }) {
  const { t, i18n } = useTranslation('customer');
  const { request } = booking;
  return (
    <Link
      to={`/customer/bookings/${booking.id}`}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 hover:border-brand-300"
    >
      <CategoryIcon name={request.category_detail.icon} className="size-8 text-brand-600" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900">
          {localName(request.category_detail, i18n.language)}
        </p>
        <p className="text-sm text-gray-600">
          {booking.worker.display_name} · {formatDate(request.preferred_date, i18n.language)} ·{' '}
          {t(`common:booking.slots.${request.preferred_slot}`)}
        </p>
      </div>
      <StatusTag status={booking.status} size="sm" />
    </Link>
  );
}

export default function MyBookingsPage() {
  const { t } = useTranslation('customer');
  const [scope, setScope] = useState('active');
  const [page, setPage] = useState(1);
  const { data, isPending, isError, refetch } = useBookings({ scope, page });

  const switchTab = (next) => {
    setScope(next);
    setPage(1);
  };

  return (
    <div>
      <PageHeader title={t('bookings.title')} />
      <div role="tablist" className="mb-4 flex gap-2">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={scope === key}
            onClick={() => switchTab(key)}
            className={cn(
              'min-h-11 rounded-xl px-4 font-medium',
              scope === key
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100',
            )}
          >
            {t(`bookings.tabs.${key}`)}
          </button>
        ))}
      </div>

      {isPending && <LoadingState />}
      {isError && <ErrorState onRetry={refetch} />}
      {data?.results.length === 0 && <EmptyState icon={CalendarX} title={t('bookings.empty')} />}
      {data?.results.length > 0 && (
        <>
          <div className="space-y-3">
            {data.results.map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </div>
          <Pagination page={page} count={data.count} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
