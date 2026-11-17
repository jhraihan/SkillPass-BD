import { Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { getErrorMessage } from '@/api/errors';
import { StatusTag, StatusTimeline, TrustScorePill } from '@/components/domain';
import { Alert, Avatar, Button, Card, ErrorState, LoadingState, PageHeader } from '@/components/ui';
import { useBooking } from '@/hooks/bookings';
import BookingActions from '../components/BookingActions';
import RequestSummaryCard from '../components/RequestSummaryCard';

function Note({ label, text, tone = 'info' }) {
  if (!text) return null;
  return (
    <Alert tone={tone} title={label}>
      {text}
    </Alert>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation('customer');
  const { data: booking, isPending, isError, error, refetch } = useBooking(id);

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />;

  const { worker } = booking;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('detail.title', { id: booking.id })}
        backTo="/customer/bookings"
        actions={<StatusTag status={booking.status} size="lg" />}
      />

      <Card className="flex flex-wrap items-center gap-4">
        <Avatar src={worker.photo} name={worker.display_name} size="lg" />
        <div className="flex-1">
          <p className="text-sm text-gray-500">{t('detail.worker')}</p>
          <Link
            to={`/workers/${worker.id}`}
            className="text-lg font-semibold text-gray-900 hover:underline"
          >
            {worker.display_name}
          </Link>
          <div className="mt-1">
            <TrustScorePill score={worker.trust_score} isNew={worker.is_new} />
          </div>
        </div>
        {worker.phone && (
          <Button as="a" href={`tel:${worker.phone}`} size="lg" icon={Phone}>
            {t('detail.call', { name: worker.display_name })}
          </Button>
        )}
      </Card>

      {!booking.contact_visible && booking.status === 'PENDING' && (
        <Alert tone="info">{t('detail.contactHidden')}</Alert>
      )}
      {booking.is_verified && <Alert tone="success">{t('detail.verified')}</Alert>}

      <BookingActions booking={booking} />

      <Note label={t('detail.notes')} text={booking.completion_notes} />
      <Note label={t('detail.cancelReason')} text={booking.cancel_reason} tone="warning" />
      <Note label={t('detail.disputeReason')} text={booking.dispute_reason} tone="warning" />

      <RequestSummaryCard request={booking.request} />

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-navy-700">{t('detail.timeline')}</h2>
        <StatusTimeline history={booking.history} />
      </Card>
    </div>
  );
}
