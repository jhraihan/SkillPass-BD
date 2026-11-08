import { BadgeCheck, Search, ShieldCheck, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button, Card } from '@/components/ui';

const SECTIONS = [
  { key: 'workers', icon: Wrench },
  { key: 'customers', icon: Search },
  { key: 'trust', icon: ShieldCheck },
];

export default function AboutPage() {
  const { t } = useTranslation('public');

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-navy-700">{t('about.title')}</h1>
        <p className="text-lg text-gray-700">{t('about.intro')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {SECTIONS.map(({ key, icon: Icon }) => (
          <Card key={key} className="space-y-2">
            <Icon className="size-8 text-brand-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-navy-700">{t(`about.${key}Title`)}</h2>
            <p className="text-gray-600">{t(`about.${key}Text`)}</p>
          </Card>
        ))}
      </div>

      <Link
        to="/trust-score"
        className="inline-flex items-center gap-2 font-semibold text-brand-700 hover:underline"
      >
        <BadgeCheck className="size-5" aria-hidden="true" />
        {t('about.trustLink')}
      </Link>

      <div className="flex flex-wrap gap-3">
        <Button as={Link} to="/register" size="lg" icon={Wrench}>
          {t('about.ctaWorker')}
        </Button>
        <Button as={Link} to="/workers" size="lg" variant="outline" icon={Search}>
          {t('about.ctaCustomer')}
        </Button>
      </div>
    </div>
  );
}
