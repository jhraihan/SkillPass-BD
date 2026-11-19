import { CalendarPlus, Check, SearchX, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { getErrorMessage } from '@/api/errors';
import { WorkerCard } from '@/components/domain';
import {
  Alert,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  useToast,
} from '@/components/ui';
import {
  useCancelServiceRequest,
  useCreateBooking,
  useMatches,
  useServiceRequest,
} from '@/hooks/bookings';
import RequestSummaryCard from '../components/RequestSummaryCard';

function MatchReasons({ reasons }) {
  const { t, i18n } = useTranslation('customer');
  return (
    <ul className="mb-3 space-y-1">
      {reasons.map(({ code, params }) => (
        <li key={code} className="flex items-center gap-2 text-sm text-gray-700">
          <Check className="size-4 shrink-0 text-green-600" aria-hidden="true" />
          {t(`common:booking.matchReasons.${code}`, {
            ...params,
            area: i18n.language === 'bn' ? params.area_bn : params.area,
          })}
        </li>
      ))}
    </ul>
  );
}

export default function MatchResultsPage() {
  const { id } = useParams();
  const { t } = useTranslation('customer');
  const navigate = useNavigate();
  const toast = useToast();
  const request = useServiceRequest(id);
  const matches = useMatches(id);
  const createBooking = useCreateBooking();
  const cancelRequest = useCancelServiceRequest();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const cancel = () =>
    cancelRequest.mutate(Number(id), {
      onSuccess: () => {
        toast.success(t('matches.cancelled'));
        navigate('/customer');
      },
      onError: (error) => toast.error(getErrorMessage(error, t)),
      onSettled: () => setConfirmCancel(false),
    });

  const book = (worker) =>
    createBooking.mutate(
      { service_request: Number(id), worker: worker.id },
      {
        onSuccess: (booking) => {
          toast.success(t('matches.booked'));
          navigate(`/customer/bookings/${booking.id}`);
        },
        onError: (error) => toast.error(getErrorMessage(error, t)),
      },
    );

  if (request.isPending) return <LoadingState />;
  if (request.isError) {
    return <ErrorState message={getErrorMessage(request.error, t)} onRetry={request.refetch} />;
  }

  const activeBooking = request.data.active_booking;
  const canCancel = request.data.status === 'OPEN' && !activeBooking;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('matches.title')}
        description={t('matches.subtitle')}
        backTo="/customer"
        actions={
          canCancel && (
            <Button variant="outline" icon={XCircle} onClick={() => setConfirmCancel(true)}>
              {t('matches.cancel')}
            </Button>
          )
        }
      />
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={cancel}
        loading={cancelRequest.isPending}
        title={t('matches.cancelTitle')}
        message={t('matches.cancelMessage')}
        confirmLabel={t('matches.cancel')}
      />
      <RequestSummaryCard request={request.data} showStatus />

      {activeBooking && (
        <Alert tone="info" title={t('matches.alreadyBooked')}>
          <Link to={`/customer/bookings/${activeBooking}`} className="font-semibold underline">
            {t('matches.viewBooking')}
          </Link>
        </Alert>
      )}

      {matches.isPending && <LoadingState />}
      {matches.isError && <ErrorState onRetry={matches.refetch} />}
      {matches.data?.length === 0 && (
        <EmptyState
          icon={SearchX}
          title={t('matches.emptyTitle')}
          description={t('matches.emptyText')}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {matches.data?.map((worker) => (
          <WorkerCard
            key={worker.id}
            worker={worker}
            footer={
              <>
                <MatchReasons reasons={worker.match_reasons} />
                <Button
                  fullWidth
                  icon={CalendarPlus}
                  disabled={Boolean(activeBooking)}
                  loading={createBooking.isPending && createBooking.variables?.worker === worker.id}
                  onClick={() => book(worker)}
                >
                  {t('matches.book')}
                </Button>
              </>
            }
          />
        ))}
      </div>
    </div>
  );
}
