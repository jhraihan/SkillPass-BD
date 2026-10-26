import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router';
import { Button, ErrorState } from '@/components/ui';

/** Shown instead of a page that crashed while rendering. */
export default function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="text-center">
        <ErrorState message={t('errors.pageCrashed')} />
        <Button onClick={() => window.location.reload()}>{t('actions.reload')}</Button>
      </div>
    </div>
  );
}
