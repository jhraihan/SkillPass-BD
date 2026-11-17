import { CalendarDays, MapPin, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { CategoryIcon, StatusTag } from '@/components/domain';
import { cn } from '@/lib/cn';
import { formatDate, localName } from '@/lib/format';

export default function JobCard({ booking }) {
  const { t, i18n } = useTranslation('worker');
  const { request } = booking;
  const isRequest = booking.status === 'PENDING';
  const target = isRequest ? `/worker/requests/${booking.id}` : `/worker/jobs/${booking.id}`;

  return (
    <Link
      to={target}
      className={cn(
        'block space-y-2 rounded-2xl border-2 bg-white p-4',
        isRequest ? 'border-green-300 bg-green-50' : 'border-gray-200',
      )}
    >
      <div className="flex items-center gap-3">
        <CategoryIcon name={request.category_detail.icon} className="size-9 text-brand-600" />
        <p className="flex-1 text-xl font-semibold text-gray-900">
          {localName(request.category_detail, i18n.language)}
        </p>
        <StatusTag status={booking.status} size="sm" />
      </div>
      <p className="flex items-center gap-2 text-gray-700">
        <MapPin className="size-5 shrink-0" aria-hidden="true" />
        {localName(request.area_detail, i18n.language)}
      </p>
      <p className="flex items-center gap-2 text-gray-700">
        <CalendarDays className="size-5 shrink-0" aria-hidden="true" />
        {formatDate(request.preferred_date, i18n.language)} ·{' '}
        {t(`common:booking.slots.${request.preferred_slot}`)}
      </p>
      <p className="flex items-center gap-2 text-gray-700">
        <UserRound className="size-5 shrink-0" aria-hidden="true" />
        {booking.customer.name}
      </p>
    </Link>
  );
}
