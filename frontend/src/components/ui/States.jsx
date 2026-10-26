import { AlertCircle, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import Button from './Button';
import Spinner from './Spinner';

/** Every page shows one of these while data loads, fails, or is empty. */

export function LoadingState({ label, className }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className={cn('flex flex-col items-center justify-center gap-3 py-16 text-gray-500', className)}
    >
      <Spinner size="lg" />
      <span>{label ?? t('states.loading')}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry, className }) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center gap-4 py-16 text-center', className)}
    >
      <AlertCircle className="size-12 text-red-500" aria-hidden="true" />
      <p className="max-w-sm text-base text-gray-700">{message ?? t('errors.generic')}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          {t('actions.retry')}
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  const { t } = useTranslation();
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}>
      <Icon className="size-12 text-gray-300" aria-hidden="true" />
      <p className="text-lg font-semibold text-gray-800">{title ?? t('states.empty')}</p>
      {description && <p className="max-w-sm text-gray-500">{description}</p>}
      {action}
    </div>
  );
}
