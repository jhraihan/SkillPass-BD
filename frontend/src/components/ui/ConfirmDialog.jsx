import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import Modal from './Modal';

/**
 * Ask before destructive actions (Decline, Cancel, Delete) — PRD §14.2 "safe mistakes".
 * <ConfirmDialog open={open} onClose={close} onConfirm={doIt} title="…" message="…" tone="danger" />
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  icon: Icon = AlertTriangle,
  loading = false,
}) {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel ?? t('actions.cancel')}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel ?? t('actions.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <span
          className={
            tone === 'danger'
              ? 'rounded-full bg-red-100 p-3 text-red-600'
              : 'rounded-full bg-brand-100 p-3 text-brand-700'
          }
        >
          <Icon className="size-7" aria-hidden="true" />
        </span>
        <p className="pt-1 text-base text-gray-700">{message}</p>
      </div>
    </Modal>
  );
}
