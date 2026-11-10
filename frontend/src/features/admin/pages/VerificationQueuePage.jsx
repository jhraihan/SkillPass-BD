import { Eye } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getErrorMessage } from '@/api/errors';
import { VerificationStatus } from '@/components/domain';
import {
  Button,
  ErrorState,
  LoadingState,
  PageHeader,
  Pagination,
  Select,
  Table,
} from '@/components/ui';
import { useVerifications } from '@/hooks/verification';
import { cn } from '@/lib/cn';
import { VERIFICATION_STATUSES, VERIFICATION_TYPES } from '@/lib/constants';
import { formatDateTime, formatNumber, localName } from '@/lib/format';

export default function VerificationQueuePage() {
  const { t, i18n } = useTranslation('admin');
  const [status, setStatus] = useState('PENDING');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch } = useVerifications({ status, type, page });

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const columns = [
    {
      key: 'worker',
      header: t('verifications.columns.worker'),
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900">{item.worker.display_name}</p>
          <p className="text-gray-500">{item.worker.phone}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: t('verifications.columns.type'),
      render: (item) => (
        <div>
          <p>{t(`common:verification.type.${item.type}`)}</p>
          {item.skill && <p className="text-gray-500">{localName(item.skill, i18n.language)}</p>}
        </div>
      ),
    },
    {
      key: 'documents',
      header: t('verifications.columns.documents'),
      render: (item) =>
        t('verifications.fileCount', {
          count: item.documents.length,
          value: formatNumber(item.documents.length, i18n.language),
        }),
    },
    {
      key: 'created_at',
      header: t('verifications.columns.submitted'),
      render: (item) => formatDateTime(item.created_at, i18n.language),
    },
    {
      key: 'status',
      header: t('verifications.columns.status'),
      render: (item) => <VerificationStatus status={item.status} size="sm" />,
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <Button as={Link} to={`/admin/verifications/${item.id}`} size="sm" icon={Eye}>
          {t('verifications.open')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('verifications.title')} description={t('verifications.description')} />

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div role="tablist" className="flex flex-wrap gap-2">
          {VERIFICATION_STATUSES.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={status === key}
              onClick={() => changeFilter(setStatus)(key)}
              className={cn(
                'min-h-11 rounded-xl px-4 font-medium',
                status === key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100',
              )}
            >
              {t(`common:verification.status.${key}`)}
            </button>
          ))}
        </div>
        <Select
          aria-label={t('verifications.filterType')}
          className="ml-auto w-56"
          value={type}
          onChange={(event) => changeFilter(setType)(event.target.value)}
          options={[
            { value: '', label: t('verifications.allTypes') },
            ...VERIFICATION_TYPES.map((key) => ({
              value: key,
              label: t(`common:verification.type.${key}`),
            })),
          ]}
        />
      </div>

      {isPending && <LoadingState />}
      {isError && <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />}
      {data && (
        <>
          <Table columns={columns} rows={data.results} emptyText={t('verifications.empty')} />
          <Pagination page={page} count={data.count} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
