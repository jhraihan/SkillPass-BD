import { BriefcaseBusiness, History, MessageSquareText, ShieldCheck, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button, Card } from '@/components/ui';
import { formatNumber } from '@/lib/format';

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <Icon className="size-7 text-brand-600" aria-hidden="true" />
      <span className="text-3xl font-bold text-navy-700">{value}</span>
      <span className="text-base text-gray-600">{label}</span>
    </div>
  );
}

export default function TrustScoreCard({ profile }) {
  const { t, i18n } = useTranslation('worker');
  const number = (value, options) => formatNumber(value, i18n.language, options);

  return (
    <Card className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">{t('trustCard.title')}</h2>
      <div className="grid grid-cols-3 gap-2">
        <Stat
          icon={ShieldCheck}
          value={profile.is_new ? '—' : number(profile.trust_score)}
          label={t('trustCard.title')}
        />
        <Stat
          icon={BriefcaseBusiness}
          value={number(profile.verified_jobs_count)}
          label={t('trustCard.verifiedJobs')}
        />
        <Stat
          icon={Star}
          value={
            profile.review_count ? number(profile.avg_rating, { maximumFractionDigits: 1 }) : '—'
          }
          label={t('trustCard.rating')}
        />
      </div>
      {profile.is_new && <p className="text-gray-600">{t('trustCard.newHint')}</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button as={Link} to="/worker/reviews" variant="outline" size="lg" icon={MessageSquareText}>
          {t('trustCard.reviews')}
        </Button>
        <Button as={Link} to="/worker/history" variant="outline" size="lg" icon={History}>
          {t('trustCard.history')}
        </Button>
      </div>
    </Card>
  );
}
