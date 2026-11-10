import { Hand, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { getErrorMessage } from '@/api/errors';
import {
  Alert,
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  PageHeader,
  useToast,
} from '@/components/ui';
import { useReport, useResolveReport, useTakeReport } from '@/hooks/reports';
import { OPEN_REPORT_STATUSES } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import ResolveForm from '../components/ResolveForm';
import ReportTarget from '../components/ReportTarget';

export default function ReportResolvePage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation('admin');
  const toast = useToast();
  const { data: report, isPending, isError, error, refetch } = useReport(id);
  const take = useTakeReport();
  const resolve = useResolveReport();

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />;

  const isOpen = OPEN_REPORT_STATUSES.includes(report.status);
  const notifyError = (mutationError) => toast.error(getErrorMessage(mutationError, t));
  const submit = (values, onFieldErrors) =>
    resolve.mutate(
      { id: report.id, ...values },
      {
        onSuccess: () => toast.success(t('resolve.done')),
        onError: (mutationError) => onFieldErrors(mutationError) || notifyError(mutationError),
      },
    );

  return (
    <div>
      <PageHeader
        title={t(`common:report.reason.${report.reason}`)}
        description={`${t(`common:report.target.${report.target_type}`)} #${report.target_id} · ${formatDateTime(report.created_at, i18n.language)}`}
        backTo="/admin/reports"
        actions={
          <span className="flex flex-wrap gap-2">
            {report.is_dispute && (
              <Badge tone="red" icon={Scale}>
                {t('common:report.dispute')}
              </Badge>
            )}
            <Badge tone={isOpen ? 'yellow' : 'gray'}>
              {t(`common:report.status.${report.status}`)}
            </Badge>
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Card className="space-y-2">
            <h2 className="font-semibold text-navy-700">{t('resolve.reportTitle')}</h2>
            <p className="text-sm text-gray-600">
              {t('resolve.reporter')}: {report.reporter.name} · {report.reporter.phone}
            </p>
            <p className="whitespace-pre-line text-gray-800">
              {report.description || t('resolve.noDescription')}
            </p>
          </Card>
          <Card className="space-y-2">
            <h2 className="font-semibold text-navy-700">{t('resolve.targetTitle')}</h2>
            <ReportTarget report={report} />
          </Card>
        </div>

        <Card className="h-fit space-y-4">
          {!isOpen && (
            <Alert tone={report.status === 'RESOLVED' ? 'success' : 'info'}>
              {t('resolve.closedBy', {
                name: report.assigned_admin ?? '—',
                date: formatDateTime(report.resolved_at, i18n.language),
              })}
              <p className="mt-1">{report.resolution_note}</p>
            </Alert>
          )}
          {report.status === 'OPEN' && (
            <Button
              variant="outline"
              icon={Hand}
              fullWidth
              loading={take.isPending}
              onClick={() => take.mutate(report.id, { onError: notifyError })}
            >
              {t('resolve.take')}
            </Button>
          )}
          {report.assigned_admin && isOpen && (
            <p className="text-sm text-gray-600">
              {t('resolve.assigned', { name: report.assigned_admin })}
            </p>
          )}
          {isOpen && <ResolveForm report={report} onSubmit={submit} loading={resolve.isPending} />}
        </Card>
      </div>
    </div>
  );
}
