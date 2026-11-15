import { CheckCircle2, MessageSquareWarning, Star, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getErrorMessage } from '@/api/errors';
import { Button, ConfirmDialog, useToast } from '@/components/ui';
import { useBookingAction } from '@/hooks/bookings';
import { REVIEWABLE_STATUSES } from '@/lib/constants';
import CancelDisputeModal from './CancelDisputeModal';

export default function BookingActions({ booking }) {
  const { t } = useTranslation('customer');
  const toast = useToast();
  const runAction = useBookingAction();
  const [dialog, setDialog] = useState(null);
  const can = (action) => booking.allowed_actions.includes(action);

  const run = (action, note) =>
    runAction.mutate(
      { id: booking.id, action, note },
      {
        onSuccess: () => toast.success(t(`actions.done.${action}`)),
        onError: (error) => toast.error(getErrorMessage(error, t)),
        onSettled: () => setDialog(null),
      },
    );

  return (
    <div className="flex flex-wrap gap-3">
      {can('confirm') && (
        <Button size="lg" icon={CheckCircle2} onClick={() => setDialog('confirm')}>
          {t('actions.confirm')}
        </Button>
      )}
      {can('dispute') && (
        <Button
          size="lg"
          variant="outline"
          icon={MessageSquareWarning}
          onClick={() => setDialog('dispute')}
        >
          {t('actions.dispute')}
        </Button>
      )}
      {can('cancel') && (
        <Button size="lg" variant="outline" icon={XCircle} onClick={() => setDialog('cancel')}>
          {t('actions.cancel')}
        </Button>
      )}
      {REVIEWABLE_STATUSES.includes(booking.status) && !booking.has_review && (
        <Button as={Link} to={`/customer/bookings/${booking.id}/review`} size="lg" icon={Star}>
          {t('actions.review')}
        </Button>
      )}

      <ConfirmDialog
        open={dialog === 'confirm'}
        onClose={() => setDialog(null)}
        onConfirm={() => run('confirm')}
        loading={runAction.isPending}
        tone="primary"
        icon={CheckCircle2}
        title={t('actions.confirmTitle')}
        message={t('actions.confirmMessage')}
        confirmLabel={t('actions.confirm')}
      />
      <CancelDisputeModal
        mode={dialog === 'dispute' ? 'dispute' : 'cancel'}
        open={dialog === 'cancel' || dialog === 'dispute'}
        onClose={() => setDialog(null)}
        onSubmit={(reason) => run(dialog, reason)}
        loading={runAction.isPending}
      />
    </div>
  );
}
