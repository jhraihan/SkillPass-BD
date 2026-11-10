import { BadgeCheck, CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { getErrorMessage } from '@/api/errors';
import { VerificationStatus } from '@/components/domain';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  LoadingState,
  PageHeader,
  ReasonDialog,
  useToast,
} from '@/components/ui';
import { useVerification, useVerificationDecision } from '@/hooks/verification';
import { formatDate, formatDateTime, localName } from '@/lib/format';
import DocumentViewer from '../components/DocumentViewer';

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{children}</dd>
    </div>
  );
}

export default function VerificationReviewPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation('admin');
  const toast = useToast();
  const [dialog, setDialog] = useState(null);
  const { data: item, isPending, isError, error, refetch } = useVerification(id);
  const decide = useVerificationDecision();

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />;

  const run = (decision, reason) =>
    decide.mutate(
      { id: item.id, decision, reason },
      {
        onSuccess: () => toast.success(t(`review.done.${decision}`)),
        onError: (mutationError) => toast.error(getErrorMessage(mutationError, t)),
        onSettled: () => setDialog(null),
      },
    );

  const { worker } = item;
  const typeLabel = t(`common:verification.type.${item.type}`);

  return (
    <div>
      <PageHeader
        title={t('review.title', { type: typeLabel })}
        backTo="/admin/verifications"
        actions={<VerificationStatus status={item.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-4">
          <Card className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar src={worker.photo} name={worker.display_name} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{worker.display_name}</p>
                <p className="text-sm text-gray-500">{worker.phone}</p>
              </div>
            </div>
            {worker.identity_verified && (
              <Badge tone="green" size="sm" icon={BadgeCheck}>
                {t('common:worker.identityVerified')}
              </Badge>
            )}
            <dl className="divide-y divide-gray-100">
              <Row label={t('review.fullName')}>{worker.full_name}</Row>
              <Row label={t('review.memberSince')}>
                {formatDate(worker.member_since, i18n.language)}
              </Row>
              <Row label={t('review.type')}>{typeLabel}</Row>
              {item.skill && (
                <Row label={t('review.skill')}>{localName(item.skill, i18n.language)}</Row>
              )}
              <Row label={t('review.submitted')}>
                {formatDateTime(item.created_at, i18n.language)}
              </Row>
            </dl>
            <Link
              to={`/workers/${worker.id}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              {t('review.publicProfile')}
            </Link>
          </Card>

          {item.status === 'PENDING' ? (
            <Card className="space-y-3">
              <p className="text-sm text-gray-600">{t(`review.checklist.${item.type}`)}</p>
              <Button fullWidth size="lg" icon={CheckCircle2} onClick={() => setDialog('approve')}>
                {t('review.approve')}
              </Button>
              <Button
                fullWidth
                size="lg"
                variant="outline"
                icon={XCircle}
                onClick={() => setDialog('reject')}
              >
                {t('review.reject')}
              </Button>
            </Card>
          ) : (
            <Alert tone={item.status === 'APPROVED' ? 'success' : 'error'}>
              {t(`review.decided.${item.status}`, {
                name: item.reviewed_by ?? '—',
                date: formatDateTime(item.reviewed_at, i18n.language),
              })}
              {item.rejection_reason && <p className="mt-1">{item.rejection_reason}</p>}
            </Alert>
          )}
        </div>

        <div className="space-y-4">
          {item.documents.map((document) => (
            <DocumentViewer key={document.id} document={document} />
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={dialog === 'approve'}
        onClose={() => setDialog(null)}
        onConfirm={() => run('approve')}
        loading={decide.isPending}
        tone="primary"
        icon={CheckCircle2}
        title={t('review.approveTitle')}
        message={t(`review.approveMessage.${item.type}`, { name: worker.display_name })}
        confirmLabel={t('review.approve')}
      />
      <ReasonDialog
        open={dialog === 'reject'}
        onClose={() => setDialog(null)}
        onSubmit={(reason) => run('reject', reason)}
        loading={decide.isPending}
        title={t('review.rejectTitle')}
        message={t('review.rejectMessage')}
        label={t('review.reason')}
        confirmLabel={t('review.reject')}
      />
    </div>
  );
}
