import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import Modal from './Modal';
import Textarea from './Textarea';

export default function ReasonDialog({
  open,
  onClose,
  onSubmit,
  title,
  message,
  label,
  confirmLabel,
  tone = 'danger',
  loading = false,
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const missing = !reason.trim();

  const close = () => {
    setReason('');
    setTouched(false);
    onClose();
  };

  const submit = () => {
    setTouched(true);
    if (!missing) onSubmit(reason.trim());
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={loading}>
            {t('actions.cancel')}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={submit}
            loading={loading}
          >
            {confirmLabel ?? t('actions.confirm')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {message && <p className="text-gray-700">{message}</p>}
        <Textarea
          label={label}
          value={reason}
          maxLength={1000}
          onChange={(event) => setReason(event.target.value)}
          error={touched && missing ? t('errors.required') : undefined}
        />
      </div>
    </Modal>
  );
}
