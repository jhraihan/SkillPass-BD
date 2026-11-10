import { CalendarCheck, Search, Star, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button, Card } from '@/components/ui';
import CategoryTiles from '../components/CategoryTiles';
import HeroSearch from '../components/HeroSearch';

const STEPS = [
  { key: 'find', icon: Search },
  { key: 'book', icon: CalendarCheck },
  { key: 'review', icon: Star },
];

export default function LandingPage() {
  const { t } = useTranslation('public');

  return (
    <div>
      <section className="bg-gradient-to-br from-navy-700 to-brand-700 px-4 py-14 text-white">
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-3xl font-bold sm:text-4xl">{t('landing.title')}</h1>
          <p className="max-w-2xl text-lg text-brand-50">{t('landing.subtitle')}</p>
          <div className="text-gray-900">
            <HeroSearch />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-4 px-4 py-10">
        <h2 className="text-2xl font-bold text-navy-700">{t('landing.categoriesTitle')}</h2>
        <CategoryTiles />
      </section>

      <section className="mx-auto max-w-5xl space-y-4 px-4 pb-10">
        <h2 className="text-2xl font-bold text-navy-700">{t('landing.howTitle')}</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ key, icon: Icon }, index) => (
            <li key={key}>
              <Card className="h-full space-y-2">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800">
                    {index + 1}
                  </span>
                  <Icon className="size-6 text-brand-600" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t(`landing.steps.${key}.title`)}
                </h3>
                <p className="text-gray-600">{t(`landing.steps.${key}.text`)}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-14">
        <Card className="flex flex-col items-start gap-4 bg-brand-50 sm:flex-row sm:items-center">
          <Wrench className="size-10 shrink-0 text-brand-600" aria-hidden="true" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-navy-700">{t('landing.workerCta.title')}</h2>
            <p className="text-gray-700">{t('landing.workerCta.text')}</p>
          </div>
          <Button as={Link} to="/register" size="lg">
            {t('landing.workerCta.button')}
          </Button>
        </Card>
      </section>
    </div>
  );
}
