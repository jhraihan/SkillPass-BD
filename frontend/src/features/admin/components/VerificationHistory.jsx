import { FileCheck2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VerificationStatus } from '@/components/domain';
import { Card, EmptyState } from '@/components/ui';
import { formatDate, localName } from '@/lib/format';

export default function VerificationHistory({ items }) {
  const { t, i18n } = useTranslation('admin');

  return (
    <Card className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-900">{t('upload.historyTitle')}</h2>
      {items.length === 0 && (
        <EmptyState icon={FileCheck2} title={t('upload.historyEmpty')} className="py-6" />
      )}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="space-y-2 rounded-xl border border-gray-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-gray-900">
                {t(`common:verification.type.${item.type}`)}
                {item.skill && ` · ${localName(item.skill, i18n.language)}`}
              </span>
              <VerificationStatus status={item.status} />
            </div>
            <p className="text-base text-gray-600">
              {t('upload.sentOn', { date: formatDate(item.created_at, i18n.language) })}
            </p>
            {item.rejection_reason && (
              <p className="rounded-lg bg-red-50 p-2 text-base text-red-800">
                {item.rejection_reason}
              </p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
