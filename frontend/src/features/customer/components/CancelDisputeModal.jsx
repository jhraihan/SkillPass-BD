import { useTranslation } from 'react-i18next';
import { ReasonDialog } from '@/components/ui';

export default function CancelDisputeModal({ mode, open, onClose, onSubmit, loading }) {
  const { t } = useTranslation('customer');

  return (
    <ReasonDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      loading={loading}
      title={t(`actions.${mode}Title`)}
      message={t(`actions.${mode}Message`)}
      label={t(`actions.${mode}Label`)}
      confirmLabel={t(`actions.${mode}`)}
    />
  );
}
