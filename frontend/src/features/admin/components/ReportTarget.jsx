import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ReviewCard, StatusTag, StatusTimeline } from '@/components/domain';
import { Alert } from '@/components/ui';
import UserStatusBadge from './UserStatusBadge';

function Person({ label, person, profileId }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">
          {profileId ? (
            <Link to={`/workers/${profileId}`} className="hover:underline">
              {person.name}
            </Link>
          ) : (
            person.name
          )}
        </p>
        <p className="text-sm text-gray-500">{person.phone}</p>
      </div>
      <UserStatusBadge user={{ ...person, is_locked: false }} />
    </div>
  );
}

export default function ReportTarget({ report }) {
  const { t, i18n } = useTranslation('admin');
  const target = report.target;
  if (!target) return <Alert tone="warning">{t('resolve.targetGone')}</Alert>;

  const worker = target.worker ?? target;
  const workerRow = (
    <Person label={t('resolve.worker')} person={worker.user} profileId={worker.id} />
  );

  if (report.target_type === 'WORKER') return workerRow;
  if (report.target_type === 'REVIEW') {
    return (
      <div className="space-y-2">
        <ReviewCard review={target} />
        <Person label={t('resolve.author')} person={target.author} />
        {workerRow}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-gray-900">
          {i18n.language === 'bn' ? target.category_bn : target.category} · #{target.id}
        </p>
        <StatusTag status={target.status} />
      </div>
      <p className="text-gray-700">{target.description}</p>
      {target.completion_notes && (
        <p className="text-sm text-gray-600">
          {t('resolve.workerNote')}: {target.completion_notes}
        </p>
      )}
      <Person label={t('resolve.customer')} person={target.customer} />
      {workerRow}
      <StatusTimeline history={target.history} />
    </div>
  );
}
