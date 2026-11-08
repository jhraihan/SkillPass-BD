import { BellRing, CalendarCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';
import { getErrorMessage } from '@/api/errors';
import { Card, EmptyState, ErrorState, LoadingState, useToast } from '@/components/ui';
import { useScreenVoice } from '@/hooks/assistance';
import { useUpdateMyWorkerProfile, useWorkerDashboard } from '@/hooks/workers';
import AvailabilityToggle from '../components/AvailabilityToggle';
import CompletenessBar from '../components/CompletenessBar';
import JobCard from '../components/JobCard';
import TrustScoreCard from '../components/TrustScoreCard';

export default function WorkerHomePage() {
  const { t } = useTranslation('worker');
  const toast = useToast();
  const { data, isPending, isError, error, refetch } = useWorkerDashboard();
  const update = useUpdateMyWorkerProfile();
  useScreenVoice(
    data && t('voice.home', { count: data.pending_requests.length, jobs: data.today_jobs.length }),
  );

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />;

  const { profile, pending_requests: requests, today_jobs: jobs } = data;
  if (!profile.is_setup_complete) return <Navigate to="/worker/setup" replace />;

  const changeAvailability = (availability_status) =>
    update.mutate(
      { availability_status },
      {
        onSuccess: () => toast.success(t('availability.saved')),
        onError: (mutationError) => toast.error(getErrorMessage(mutationError, t)),
      },
    );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-navy-700">
        {t('home.greeting', { name: profile.display_name })}
      </h1>

      <AvailabilityToggle
        status={
          update.isPending ? update.variables?.availability_status : profile.availability_status
        }
        onChange={changeAvailability}
        disabled={update.isPending}
      />

      <CompletenessBar completeness={profile.completeness} />

      <Card className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">{t('home.newRequests')}</h2>
        {requests.length === 0 && (
          <EmptyState icon={BellRing} title={t('home.noRequests')} className="py-6" />
        )}
        {requests.map((booking) => (
          <JobCard key={booking.id} booking={booking} />
        ))}
      </Card>

      <Card className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">{t('home.todayJobs')}</h2>
        {jobs.length === 0 && (
          <EmptyState icon={CalendarCheck} title={t('home.noJobs')} className="py-6" />
        )}
        {jobs.map((booking) => (
          <JobCard key={booking.id} booking={booking} />
        ))}
      </Card>

      <TrustScoreCard profile={profile} />
    </div>
  );
}
