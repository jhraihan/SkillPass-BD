import { CalendarCheck, ClipboardList, PlusCircle, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useAuth } from '@/hooks/auth';
import { useBookings, useServiceRequests } from '@/hooks/bookings';
import { Button, Card, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { localName } from '@/lib/format';
import { BookingRow } from './MyBookingsPage';

export default function CustomerDashboardPage() {
  const { t, i18n } = useTranslation('customer');
  const { user } = useAuth();
  const bookings = useBookings({ scope: 'active' });
  const requests = useServiceRequests();
  const openRequests = requests.data?.results.filter(
    (request) => request.status === 'OPEN' && !request.active_booking,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-navy-700">
          {t('dashboard.greeting', { name: user.full_name })}
        </h1>
        <Button as={Link} to="/customer/requests/new" size="lg" icon={PlusCircle}>
          {t('dashboard.newRequest')}
        </Button>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.activeBookings')}</h2>
          <Link
            to="/customer/bookings"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            {t('dashboard.viewAll')}
          </Link>
        </div>
        {bookings.isPending && <LoadingState className="py-6" />}
        {bookings.isError && <ErrorState onRetry={bookings.refetch} className="py-6" />}
        {bookings.data?.results.length === 0 && (
          <EmptyState icon={CalendarCheck} title={t('dashboard.noActive')} className="py-6" />
        )}
        <div className="space-y-3">
          {bookings.data?.results.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.openRequests')}</h2>
        {requests.isPending && <LoadingState className="py-6" />}
        {requests.isError && <ErrorState onRetry={requests.refetch} className="py-6" />}
        {openRequests?.length === 0 && (
          <EmptyState icon={ClipboardList} title={t('dashboard.noRequests')} className="py-6" />
        )}
        <ul className="space-y-3">
          {openRequests?.map((request) => (
            <li
              key={request.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 p-4"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {localName(request.category_detail, i18n.language)}
                </p>
                <p className="text-sm text-gray-600">{request.description}</p>
              </div>
              <Button
                as={Link}
                to={`/customer/requests/${request.id}/matches`}
                variant="outline"
                icon={Users}
              >
                {t('dashboard.seeMatches')}
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
