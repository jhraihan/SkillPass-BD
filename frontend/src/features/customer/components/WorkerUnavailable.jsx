import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Alert, Button } from '@/components/ui';

export default function WorkerUnavailable({ worker }) {
  const { t } = useTranslation('customer');
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Alert tone="warning" title={t('request.offlineTitle', { name: worker.display_name })}>
        {t('request.offlineText')}
      </Alert>
      <div className="flex flex-wrap gap-3">
        <Button as={Link} to="/workers">
          {t('request.findOthers')}
        </Button>
        <Button as={Link} to="/customer/requests/new" variant="outline">
          {t('request.requestAll')}
        </Button>
      </div>
    </div>
  );
}
