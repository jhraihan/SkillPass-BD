// Reference detail page — copy this pattern for any page that shows one item.
// Route: /_examples/:id (dev only)   Data: useExampleItem
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { StarRating, StatusTag } from '@/components/domain';
import { Card, ErrorState, LoadingState, PageHeader } from '@/components/ui';
import { getErrorMessage } from '@/api/errors';
import { useExampleItem } from '@/hooks/examples';
import { formatDate } from '@/lib/format';

export default function ExampleDetailPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { data: item, isPending, isError, error, refetch } = useExampleItem(id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <PageHeader title={item?.title ?? t('examples.detailTitle')} backTo="/_examples" />

      {isPending && <LoadingState />}
      {isError && <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />}

      {item && (
        <Card>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label={t('examples.fields.status')}>
              <StatusTag status={item.status} />
            </Detail>
            <Detail label={t('examples.fields.category')}>
              {t(`examples.categories.${item.category}`)}
            </Detail>
            <Detail label={t('examples.fields.area')}>{item.area}</Detail>
            <Detail label={t('examples.fields.created')}>
              {formatDate(item.created_at, i18n.language)}
            </Detail>
            <Detail label={t('examples.fields.rating')}>
              <StarRating value={item.rating} readOnly showValue size="md" />
            </Detail>
          </dl>
        </Card>
      )}
    </div>
  );
}

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-1 text-base text-gray-900">{children}</dd>
    </div>
  );
}
