import { useTranslation } from 'react-i18next';
import { Alert, Button, Modal } from '@/components/ui';

export default function CredentialModal({ issued, onClose }) {
  const { t } = useTranslation('admin');

  return (
    <Modal
      open={Boolean(issued)}
      onClose={onClose}
      title={t('users.issuedTitle')}
      footer={<Button onClick={onClose}>{t('common:actions.close')}</Button>}
    >
      {issued && (
        <div className="space-y-3">
          <p className="text-gray-700">
            {t(`users.issuedFor.${issued.kind}`, { name: issued.user.full_name })}
          </p>
          <p className="rounded-xl bg-gray-100 p-4 text-center font-mono text-3xl tracking-widest select-all">
            {issued.temporary_credential}
          </p>
          <Alert tone="warning">{t('users.issuedWarning')}</Alert>
        </div>
      )}
    </Modal>
  );
}
