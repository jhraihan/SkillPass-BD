import { House, MapPinOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '@/components/ui';

export default function NotFoundPage() {
  const { t } = useTranslation('public');

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <MapPinOff className="size-16 text-gray-300" aria-hidden="true" />
      <p className="text-5xl font-bold text-navy-700">404</p>
      <h1 className="text-2xl font-semibold text-gray-900">{t('notFound.title')}</h1>
      <p className="text-gray-600">{t('notFound.text')}</p>
      <Button as={Link} to="/" size="lg" icon={House}>
        {t('notFound.home')}
      </Button>
    </div>
  );
}
