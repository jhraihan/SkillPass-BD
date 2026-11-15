import {
  BadgeCheck,
  CalendarClock,
  CircleCheckBig,
  IdCard,
  MessageCircleReply,
  Search,
  ShieldCheck,
  Sprout,
  Star,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button, Card } from '@/components/ui';
import { TRUST_FACTORS, TRUST_WEIGHTS } from '@/lib/constants';
import { formatNumber } from '@/lib/format';

const ICONS = {
  completion: CircleCheckBig,
  rating: Star,
  verified_jobs: BadgeCheck,
  cancellation: XCircle,
  response: MessageCircleReply,
  identity: IdCard,
  experience: CalendarClock,
};

const PROMISES = [
  { key: 'confirmed', icon: BadgeCheck },
  { key: 'fairStart', icon: Sprout },
  { key: 'notForSale', icon: ShieldCheck },
];

export default function TrustExplainerPage() {
  const { t, i18n } = useTranslation('public');
  const number = (value) => formatNumber(value, i18n.language);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-navy-700">{t('trust.title')}</h1>
        <p className="text-lg text-gray-700">{t('trust.intro')}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-navy-700">{t('trust.factorsTitle')}</h2>
        <ul className="space-y-3">
          {TRUST_FACTORS.map((factor) => {
            const Icon = ICONS[factor];
            return (
              <li key={factor}>
                <Card className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                    <Icon className="size-6 text-brand-700" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-semibold text-gray-900">
                        {t(`common:trust.factors.${factor}`)}
                      </h3>
                      <span className="shrink-0 text-sm font-semibold text-brand-700">
                        {t('trust.points', {
                          count: TRUST_WEIGHTS[factor],
                          value: number(TRUST_WEIGHTS[factor]),
                        })}
                      </span>
                    </div>
                    <p className="text-gray-600">{t(`trust.how.${factor}`)}</p>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
        <p className="text-sm text-gray-600">{t('trust.total')}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {PROMISES.map(({ key, icon: Icon }) => (
          <Card key={key} className="space-y-2">
            <Icon className="size-8 text-brand-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-navy-700">{t(`trust.${key}Title`)}</h2>
            <p className="text-gray-600">{t(`trust.${key}Text`)}</p>
          </Card>
        ))}
      </section>

      <Button as={Link} to="/workers" size="lg" icon={Search}>
        {t('trust.cta')}
      </Button>
    </div>
  );
}
