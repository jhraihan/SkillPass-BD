import { Check, MapPinned, MessageSquareWarning, Phone, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { getErrorMessage } from '@/api/errors';
import { CategoryIcon } from '@/components/domain';
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  LoadingState,
  ReasonDialog,
  useToast,
} from '@/components/ui';
import { useScreenVoice } from '@/hooks/assistance';
import { useBooking, useBookingAction } from '@/hooks/bookings';
import { cn } from '@/lib/cn';
import { mapsUrl } from '@/lib/constants';
import { localName } from '@/lib/format';
import BigActionButton from '../components/BigActionButton';

const STEPS = ['ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS', 'AWAITING_CONFIRMATION'];

function StepTracker({ status }) {
  const { t } = useTranslation('worker');
  const reached = STEPS.indexOf(
    status === 'COMPLETED' || status === 'AUTO_CLOSED' ? STEPS.at(-1) : status,
  );
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((step, index) => (
        <li key={step} className="flex flex-col items-center gap-1 text-center">
          <span
            className={cn(
              'flex size-9 items-center justify-center rounded-full',
              index <= reached ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500',
            )}
          >
            {index <= reached ? <Check className="size-5" aria-hidden="true" /> : index + 1}
          </span>
          <span className="text-sm text-gray-700">{t(`active.steps.${step}`)}</span>
        </li>
      ))}
    </ol>
  );
}

export default function ActiveJobPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation('worker');
  const toast = useToast();
  const { data: booking, isPending, isError, error, refetch } = useBooking(id);
  const runAction = useBookingAction();
  const [dialog, setDialog] = useState(null);
  useScreenVoice(booking && t(`voice.active.${booking.status}`, { defaultValue: '' }));

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />;

  const { request, customer } = booking;
  const can = (action) => booking.allowed_actions.includes(action);
  const run = (action, note) =>
    runAction.mutate(
      { id: booking.id, action, note },
      {
        onSuccess: () => toast.success(t('active.saved')),
        onError: (mutationError) => toast.error(getErrorMessage(mutationError, t)),
        onSettled: () => setDialog(null),
      },
    );
  const press = (action) => (action === 'mark-complete' ? setDialog('complete') : run(action));
  const finished = ['COMPLETED', 'AUTO_CLOSED'].includes(booking.status);
  const stopped = ['CANCELLED', 'DECLINED', 'EXPIRED', 'DISPUTED'].includes(booking.status);

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <div className="flex items-center gap-3">
          <CategoryIcon name={request.category_detail.icon} className="size-10 text-brand-600" />
          <h1 className="text-2xl font-bold text-navy-700">
            {localName(request.category_detail, i18n.language)}
          </h1>
        </div>
        <p className="text-xl text-gray-900">{customer.name}</p>
        <p className="text-gray-700">
          {t('active.address')}: {request.address_detail ?? '—'},{' '}
          {localName(request.area_detail, i18n.language)}
        </p>
        <p className="text-gray-600">{request.description}</p>
      </Card>

      {booking.contact_visible && !finished && (
        <div className="grid grid-cols-2 gap-3">
          <Button as="a" href={`tel:${customer.phone}`} size="xl" variant="secondary" icon={Phone}>
            {t('active.call')}
          </Button>
          <Button
            as="a"
            href={mapsUrl(request.address_detail, request.area_detail.name_en, 'Dhaka')}
            target="_blank"
            rel="noreferrer"
            size="xl"
            variant="outline"
            icon={MapPinned}
          >
            {t('active.directions')}
          </Button>
        </div>
      )}

      {!stopped && <StepTracker status={booking.status} />}
      <BigActionButton booking={booking} onPress={press} loading={runAction.isPending} />

      {booking.status === 'AWAITING_CONFIRMATION' && (
        <Alert tone="info">{t('active.waiting')}</Alert>
      )}
      {finished && <Alert tone="success">{t('active.done')}</Alert>}
      {stopped && <Alert tone="warning">{t('active.stopped')}</Alert>}

      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {can('dispute') && (
          <Button variant="ghost" icon={MessageSquareWarning} onClick={() => setDialog('dispute')}>
            {t('active.problem')}
          </Button>
        )}
        {can('cancel') && (
          <Button variant="ghost" icon={XCircle} onClick={() => setDialog('cancel')}>
            {t('active.cancel')}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={dialog === 'complete'}
        onClose={() => setDialog(null)}
        onConfirm={() => run('mark-complete')}
        loading={runAction.isPending}
        tone="primary"
        icon={Check}
        title={t('active.completeTitle')}
        message={t('active.completeMessage')}
        confirmLabel={t('active.next.mark-complete')}
      />
      <ReasonDialog
        open={dialog === 'cancel' || dialog === 'dispute'}
        onClose={() => setDialog(null)}
        onSubmit={(reason) => run(dialog, reason)}
        loading={runAction.isPending}
        title={t(dialog === 'dispute' ? 'active.problemTitle' : 'active.cancelTitle')}
        message={t(dialog === 'dispute' ? 'active.problemMessage' : 'active.cancelMessage')}
        label={t(dialog === 'dispute' ? 'active.problemLabel' : 'active.cancelLabel')}
        confirmLabel={t(dialog === 'dispute' ? 'active.problem' : 'active.cancel')}
      />
    </div>
  );
}
