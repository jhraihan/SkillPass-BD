import { useTranslation } from 'react-i18next';
import { CategoryIcon } from '@/components/domain';
import { Badge, Card } from '@/components/ui';
import { formatDate, localName } from '@/lib/format';

function Row({ label, children }) {
  if (!children) return null;
  return (
    <div>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-gray-900">{children}</dd>
    </div>
  );
}

export default function RequestSummaryCard({ request, showStatus = false }) {
  const { t, i18n } = useTranslation('customer');
  const name = (item) => localName(item, i18n.language);

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <CategoryIcon name={request.category_detail.icon} className="size-8 text-brand-600" />
        <h2 className="flex-1 text-lg font-semibold text-gray-900">
          {name(request.category_detail)}
        </h2>
        {showStatus && <Badge>{t(`common:booking.requestStatus.${request.status}`)}</Badge>}
      </div>
      {request.skills_detail.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {request.skills_detail.map((skill) => (
            <li key={skill.id} className="rounded-lg bg-gray-100 px-2 py-1 text-sm text-gray-700">
              {name(skill)}
            </li>
          ))}
        </ul>
      )}
      <dl className="grid gap-3 sm:grid-cols-2">
        <Row label={t('summary.problem')}>{request.description}</Row>
        <Row label={t('summary.date')}>{formatDate(request.preferred_date, i18n.language)}</Row>
        <Row label={t('summary.time')}>{t(`common:booking.slots.${request.preferred_slot}`)}</Row>
        <Row label={t('summary.area')}>{name(request.area_detail)}</Row>
        <Row label={t('summary.address')}>{request.address_detail}</Row>
      </dl>
    </Card>
  );
}
