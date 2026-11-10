import {
  BriefcaseBusiness,
  CircleCheckBig,
  FileCheck2,
  Flag,
  Scale,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/api/errors';
import { ErrorState, LoadingState, PageHeader } from '@/components/ui';
import { useAdminStats } from '@/hooks/adminStats';
import { cn } from '@/lib/cn';
import { STATS_PERIODS } from '@/lib/constants';
import { formatNumber } from '@/lib/format';
import BookingsChart from '../components/BookingsChart';
import StatCard from '../components/StatCard';
import StatusBreakdown from '../components/StatusBreakdown';
import TopCategories from '../components/TopCategories';

export default function AdminDashboardPage() {
  const { t, i18n } = useTranslation('admin');
  const [days, setDays] = useState(30);
  const { data, isPending, isError, error, refetch } = useAdminStats(days);
  const number = (value, options) => formatNumber(value ?? 0, i18n.language, options);
  const percent = (value) =>
    value === null || value === undefined ? '—' : number(value, { style: 'percent' });

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />;

  const { users, workers, bookings, queues, reviews, top_categories: topCategories } = data;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        className="mb-0"
        actions={
          <div
            role="tablist"
            aria-label={t('dashboard.period')}
            className="flex gap-1 rounded-xl bg-white p-1"
          >
            {STATS_PERIODS.map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={days === value}
                onClick={() => setDays(value)}
                className={cn(
                  'min-h-10 rounded-lg px-3 text-sm font-medium',
                  days === value ? 'bg-brand-600 text-white' : 'text-gray-700 hover:bg-gray-100',
                )}
              >
                {t('dashboard.days', { value: number(value) })}
              </button>
            ))}
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={FileCheck2}
          tone="amber"
          label={t('dashboard.queues.verifications')}
          value={number(queues.pending_verifications)}
          to="/admin/verifications"
        />
        <StatCard
          icon={Scale}
          tone="red"
          label={t('dashboard.queues.disputes')}
          value={number(queues.open_disputes)}
          to="/admin/reports"
        />
        <StatCard
          icon={Flag}
          tone="red"
          label={t('dashboard.queues.reports')}
          value={number(queues.open_reports)}
          to="/admin/reports"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label={t('dashboard.users')}
          value={number(users.by_role.CUSTOMER + users.by_role.WORKER)}
          hint={t('dashboard.usersHint', {
            customers: number(users.by_role.CUSTOMER),
            workers: number(users.by_role.WORKER),
            fresh: number(users.new),
          })}
          to="/admin/users"
          tone="navy"
        />
        <StatCard
          icon={UserRoundCheck}
          label={t('dashboard.activeWorkers')}
          value={number(workers.active)}
          hint={t('dashboard.workersHint', {
            available: number(workers.available_now),
            verified: number(workers.identity_verified),
          })}
        />
        <StatCard
          icon={BriefcaseBusiness}
          label={t('dashboard.bookings')}
          value={number(bookings.total)}
          hint={t('dashboard.verifiedJobs', { value: number(bookings.verified_jobs) })}
          tone="navy"
        />
        <StatCard
          icon={CircleCheckBig}
          label={t('dashboard.completionRate')}
          value={percent(bookings.completion_rate)}
          hint={t('dashboard.completionHint')}
        />
      </section>

      <BookingsChart daily={bookings.daily} />

      <section className="grid gap-4 lg:grid-cols-2">
        <StatusBreakdown byStatus={bookings.by_status} />
        <TopCategories categories={topCategories} reviews={reviews} />
      </section>
    </div>
  );
}
