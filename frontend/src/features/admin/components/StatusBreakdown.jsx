import { useTranslation } from 'react-i18next';
import { StatusTag } from '@/components/domain';
import { Card } from '@/components/ui';
import { formatNumber } from '@/lib/format';

export default function StatusBreakdown({ byStatus }) {
  const { t, i18n } = useTranslation('admin');
  const statuses = Object.entries(byStatus)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-semibold text-navy-700">{t('dashboard.byStatus')}</h2>
      {statuses.length === 0 && <p className="text-gray-500">{t('dashboard.noBookings')}</p>}
      <ul className="divide-y divide-gray-100">
        {statuses.map(([status, count]) => (
          <li key={status} className="flex items-center justify-between py-2">
            <StatusTag status={status} size="sm" />
            <span className="font-semibold text-gray-900">
              {formatNumber(count, i18n.language)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
