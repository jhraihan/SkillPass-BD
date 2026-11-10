import { zodResolver } from '@hookform/resolvers/zod';
import { Flag, LogIn } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { z } from 'zod';
import { getErrorMessage } from '@/api/errors';
import { Alert, Button, Modal, Textarea, TileGroup, useToast } from '@/components/ui';
import { useAuth } from '@/hooks/auth';
import { useCreateReport } from '@/hooks/reports';
import { REPORT_REASONS_BY_TARGET } from '@/lib/constants';
import { fieldError } from '@/lib/forms';

const schema = z.object({
  reason: z.string({ error: 'report.errors.reason' }).min(1, 'report.errors.reason'),
  description: z.string().trim().max(1000, 'report.errors.description'),
});

export default function ReportModal({ open, onClose, targetType, targetId, subject }) {
  const { t } = useTranslation('public');
  const { user } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const createReport = useCreateReport();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { description: '' } });

  const close = () => {
    reset();
    createReport.reset();
    onClose();
  };

  const onSubmit = (values) =>
    createReport.mutate(
      { target_type: targetType, target_id: targetId, ...values },
      {
        onSuccess: () => {
          toast.success(t('report.sent'));
          close();
        },
      },
    );

  const reasons = REPORT_REASONS_BY_TARGET[targetType] ?? [];
  const formId = `report-${targetType}-${targetId}`;

  return (
    <Modal
      open={open}
      onClose={close}
      title={t(`report.title.${targetType}`)}
      footer={
        user && (
          <>
            <Button variant="ghost" onClick={close}>
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="submit"
              form={formId}
              variant="danger"
              icon={Flag}
              loading={createReport.isPending}
            >
              {t('report.submit')}
            </Button>
          </>
        )
      }
    >
      {!user ? (
        <div className="space-y-4">
          <p className="text-gray-700">{t('report.loginFirst')}</p>
          <Button as={Link} to="/login" state={{ from: location }} icon={LogIn}>
            {t('report.login')}
          </Button>
        </div>
      ) : (
        <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {subject && <p className="text-sm text-gray-600">{t('report.about', { subject })}</p>}
          {createReport.isError && (
            <Alert tone="error">{getErrorMessage(createReport.error, t)}</Alert>
          )}
          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <TileGroup
                label={t('report.reason')}
                options={reasons.map((reason) => ({
                  value: reason,
                  label: t(`common:report.reason.${reason}`),
                }))}
                value={field.value}
                onChange={field.onChange}
                error={fieldError(errors, 'reason', t)}
              />
            )}
          />
          <Textarea
            label={t('report.description')}
            hint={t('report.descriptionHint')}
            rows={3}
            maxLength={1000}
            error={fieldError(errors, 'description', t)}
            {...register('description')}
          />
          <p className="text-sm text-gray-500">{t('report.privacy')}</p>
        </form>
      )}
    </Modal>
  );
}
