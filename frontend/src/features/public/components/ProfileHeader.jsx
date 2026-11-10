import { BadgeCheck, BriefcaseBusiness, CalendarPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { AvailabilityDot, StarRating, TrustScorePill } from '@/components/domain';
import { Avatar, Badge, Button, Card } from '@/components/ui';
import { formatDate } from '@/lib/format';

export default function ProfileHeader({ worker }) {
  const { t, i18n } = useTranslation('public');

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar src={worker.photo} name={worker.display_name} size="xl" />
      <div className="flex-1 space-y-2">
        <h1 className="text-2xl font-bold text-navy-700">{worker.display_name}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <AvailabilityDot status={worker.availability_status} />
          <TrustScorePill score={worker.trust_score} isNew={worker.is_new} />
          {worker.review_count > 0 ? (
            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
              <StarRating value={worker.avg_rating} readOnly showValue />
              <span>({t('common:worker.reviews', { count: worker.review_count })})</span>
            </span>
          ) : (
            <span className="text-sm text-gray-500">{t('common:worker.noReviews')}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {worker.identity_verified && (
            <Badge tone="green" icon={BadgeCheck}>
              {t('common:worker.identityVerified')}
            </Badge>
          )}
          <Badge tone="blue" icon={BriefcaseBusiness}>
            {t('common:worker.verifiedJobs', { count: worker.verified_jobs_count })}
          </Badge>
        </div>
        <p className="text-sm text-gray-500">
          {t('profile.memberSince', { date: formatDate(worker.member_since, i18n.language) })}
        </p>
      </div>
      <Button
        as={Link}
        to={`/customer/requests/new?worker=${worker.id}`}
        size="lg"
        icon={CalendarPlus}
      >
        {t('profile.book')}
      </Button>
    </Card>
  );
}
