import { BellRing, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import Button from '@/components/ui/Button';
import { useNewJobAlert } from '@/hooks/notifications';
import { notificationParams } from '@/lib/notificationTypes';

export default function NewJobAlert() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { alert, dismiss } = useNewJobAlert();
  if (!alert) return null;

  const params = notificationParams(alert.data, i18n.language);
  const open = () => {
    dismiss();
    navigate(`/worker/requests/${alert.data.booking_id}`);
  };

  return (
    <div
      role="alert"
      className="sticky top-14 z-20 mx-auto flex max-w-xl items-center gap-3 bg-green-600 px-4 py-3 text-white shadow-lg"
    >
      <BellRing className="size-8 shrink-0 animate-pulse" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xl font-bold">{t('notifications.newJob.title')}</p>
        <p className="truncate">{t('notifications.newJob.detail', params)}</p>
      </div>
      <Button size="lg" variant="outline" onClick={open} className="shrink-0">
        {t('notifications.newJob.open')}
      </Button>
      <button
        type="button"
        onClick={dismiss}
        className="rounded-lg p-2 hover:bg-green-700"
        aria-label={t('actions.close')}
      >
        <X className="size-6" aria-hidden="true" />
      </button>
    </div>
  );
}
