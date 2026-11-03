import { BadgeCheck, BriefcaseBusiness, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { localName } from '@/lib/format';
import AvailabilityDot from './AvailabilityDot';
import StarRating from './StarRating';
import TrustScorePill from './TrustScorePill';

const MAX_SKILLS = 3;
const MAX_AREAS = 2;

export default function WorkerCard({ worker, footer, className }) {
  const { t, i18n } = useTranslation();
  const name = (item) => localName(item, i18n.language);
  const extraAreas = worker.service_areas.length - MAX_AREAS;

  return (
    <article
      className={cn(
        'relative flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-brand-300',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar src={worker.photo} name={worker.display_name} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-gray-900">
            <Link to={`/workers/${worker.id}`} className="after:absolute after:inset-0">
              {worker.display_name}
            </Link>
          </h3>
          <AvailabilityDot status={worker.availability_status} />
        </div>
        <TrustScorePill score={worker.trust_score} isNew={worker.is_new} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {worker.review_count > 0 ? (
          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
            <StarRating value={worker.avg_rating} readOnly showValue />
            <span>({t('worker.reviews', { count: worker.review_count })})</span>
          </span>
        ) : (
          <span className="text-sm text-gray-500">{t('worker.noReviews')}</span>
        )}
        {worker.identity_verified && (
          <Badge tone="green" size="sm" icon={BadgeCheck}>
            {t('worker.identityVerified')}
          </Badge>
        )}
        {worker.verified_jobs_count > 0 && (
          <Badge tone="blue" size="sm" icon={BriefcaseBusiness}>
            {t('worker.verifiedJobs', { count: worker.verified_jobs_count })}
          </Badge>
        )}
      </div>

      <ul className="flex flex-wrap gap-1.5">
        {worker.skills.slice(0, MAX_SKILLS).map((skill) => (
          <li key={skill.id} className="rounded-lg bg-gray-100 px-2 py-1 text-sm text-gray-700">
            {name(skill)}
          </li>
        ))}
      </ul>

      <p className="flex items-center gap-1.5 text-sm text-gray-600">
        <MapPin className="size-4 shrink-0" aria-hidden="true" />
        {worker.service_areas.slice(0, MAX_AREAS).map(name).join(', ')}
        {extraAreas > 0 && ` ${t('worker.moreAreas', { count: extraAreas })}`}
      </p>

      {footer && <div className="relative z-10 pt-1">{footer}</div>}
    </article>
  );
}
