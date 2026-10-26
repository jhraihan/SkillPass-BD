import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';

/** Page title row: <PageHeader title="…" description="…" backTo="/customer" actions={<Button/>} /> */
export default function PageHeader({ title, description, backTo, actions, className }) {
  const { t } = useTranslation();
  return (
    <div className={cn('mb-6 space-y-3', className)}>
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex min-h-11 items-center gap-2 text-base font-medium text-brand-700 hover:text-brand-800"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
          {t('actions.back')}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">{title}</h1>
          {description && <p className="mt-1 text-gray-600">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}
