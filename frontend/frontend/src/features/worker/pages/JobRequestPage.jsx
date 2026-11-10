import { Check, Lock, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { getErrorMessage } from '@/api/errors';
import { CategoryIcon } from '@/components/domain';
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  LoadingState,
  useToast,
} from '@/components/ui';
import { useScreenVoice } from '@/hooks/assistance';
import { useBooking, useBookingAction } from '@/hooks/bookings';
import { formatDate, localName } from '@/lib/format';

function Fact({ label, children }) {
  return (
    <div>
      <p className="text-base text-gray-500">{label}</p>
      <p className="text-xl text-gray-900">{children}</p>
    </div>
  );
}

export default function JobRequestPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation('worker');
  const navigate = useNavigate();
  const toast = useToast();
  const { data: booking, isPending, isError, error, refetch } = useBooking(id);
  const runAction = useBookingAction();
  const [confirmDecline, setConfirmDecline] = useState(false);
  useScreenVoice(
    booking &&
      t('voice.request', {
        category: localName(booking.request.category_detail, i18n.language),
        area: localName(booking.request.area_detail, i18n.language),
      }),
  );

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />;

  const { request } = booking;
  const run = (action) =>
    runAction.mutate(
      { id: booking.id, action },
      {
        onSuccess: () => {
          toast.success(t(action === 'accept' ? 'request.accepted' : 'request.declined'));
          navigate(action === 'accept' ? `/worker/jobs/${booking.id}` : '/worker', {
            replace: true,
          });
        },
        onError: (mutationError) => toast.error(getErrorMessage(mutationError, t)),
      },
    );

  if (booking.status !== 'PENDING') {
    return (
      <Alert tone="info" title={t('request.notPending')}>
        <Link to={`/worker/jobs/${booking.id}`} className="font-semibold underline">
          {t('request.openJob')}
        </Link>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-navy-700">{t('request.title')}</h1>
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <CategoryIcon name={request.category_detail.icon} className="size-10 text-brand-600" />
          <p className="text-2xl font-semibold">
            {localName(request.category_detail, i18n.language)}
          </p>
        </div>
        <Fact label={t('request.problem')}>{request.description}</Fact>
        <Fact label={t('request.area')}>{localName(request.area_detail, i18n.language)}</Fact>
        <Fact label={t('request.when')}>
          {formatDate(request.preferred_date, i18n.language)} ·{' '}
          {t(`common:booking.slots.${request.preferred_slot}`)}
        </Fact>
        <Fact label={t('request.customer')}>{booking.customer.name}</Fact>
      </Card>

      <p className="flex items-center gap-2 text-gray-600">
        <Lock className="size-5 shrink-0" aria-hidden="true" />
        {t('request.privacy')}
      </p>

      <Button
        size="xl"
        fullWidth
        icon={Check}
        loading={runAction.isPending}
        onClick={() => run('accept')}
        className="min-h-16 text-2xl"
      >
        {t('request.accept')}
      </Button>
      <Button
        size="lg"
        variant="outline"
        fullWidth
        icon={X}
        onClick={() => setConfirmDecline(true)}
      >
        {t('request.decline')}
      </Button>

      <ConfirmDialog
        open={confirmDecline}
        onClose={() => setConfirmDecline(false)}
        onConfirm={() => run('decline')}
        loading={runAction.isPending}
        title={t('request.declineTitle')}
        message={t('request.declineMessage')}
        confirmLabel={t('request.decline')}
      />
    </div>
  );
}
