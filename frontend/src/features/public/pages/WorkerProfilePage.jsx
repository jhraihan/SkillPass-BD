import { BadgeCheck, Flag, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { getErrorMessage } from '@/api/errors';
import { TrustBreakdown, TrustScorePill } from '@/components/domain';
import { Button, Card, ErrorState, LoadingState, PageHeader } from '@/components/ui';
import { useWorker } from '@/hooks/workers';
import { localName } from '@/lib/format';
import ProfileHeader from '../components/ProfileHeader';
import ReportModal from '../components/ReportModal';
import ReviewsSection from '../components/ReviewsSection';
import WorkHistorySection from '../components/WorkHistorySection';

function Section({ title, children }) {
  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-semibold text-navy-700">{title}</h2>
      {children}
    </Card>
  );
}

export default function WorkerProfilePage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation('public');
  const { data: worker, isPending, isError, error, refetch } = useWorker(id);
  const [reporting, setReporting] = useState(false);
  const name = (item) => localName(item, i18n.language);

  if (isPending) return <LoadingState />;
  if (isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <PageHeader title={t('profile.notFound')} backTo="/workers" />
        <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <ProfileHeader worker={worker} />

      <div className="grid gap-4 md:grid-cols-2">
        <Section title={t('profile.about')}>
          <p className="text-gray-700">{worker.bio || t('profile.noBio')}</p>
          {worker.years_experience > 0 && (
            <p className="font-medium text-gray-900">
              {t('common:worker.years', { count: worker.years_experience })}
            </p>
          )}
        </Section>

        <Section title={t('profile.skills')}>
          <ul className="flex flex-wrap gap-2">
            {worker.skills.map((skill) => (
              <li
                key={skill.id}
                className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-gray-800"
              >
                {name(skill)}
                {skill.evidence_verified && (
                  <BadgeCheck
                    className="size-4 text-green-600"
                    aria-label={t('common:worker.evidenceVerified')}
                  />
                )}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t('profile.areas')}>
          <ul className="flex flex-wrap gap-2">
            {worker.service_areas.map((area) => (
              <li
                key={area.id}
                className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-gray-800"
              >
                <MapPin className="size-4 text-gray-500" aria-hidden="true" />
                {name(area)}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title={t('profile.trustTitle')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TrustScorePill score={worker.trust.score} isNew={worker.is_new} />
          <Link to="/trust-score" className="font-medium text-brand-700 hover:underline">
            {t('profile.trustHow')}
          </Link>
        </div>
        <TrustBreakdown breakdown={worker.trust.breakdown} />
      </Section>

      <WorkHistorySection workerId={worker.id} />
      <ReviewsSection worker={worker} />

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" icon={Flag} onClick={() => setReporting(true)}>
          {t('report.profileButton')}
        </Button>
      </div>
      <ReportModal
        open={reporting}
        onClose={() => setReporting(false)}
        targetType="WORKER"
        targetId={worker.id}
        subject={worker.display_name}
      />
    </div>
  );
}
