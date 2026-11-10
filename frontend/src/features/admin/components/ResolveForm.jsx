import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button, Checkbox, Select, Textarea } from '@/components/ui';
import { DISPUTE_OUTCOMES, FAULTS, REVIEW_ACTIONS } from '@/lib/constants';
import { applyServerErrors, fieldError } from '@/lib/forms';

const schema = z
  .object({
    status: z.enum(['RESOLVED', 'DISMISSED']),
    resolution_note: z.string().trim().min(5, 'resolve.errors.note').max(1000),
    booking_outcome: z.string(),
    fault: z.string(),
    review_action: z.string(),
    suspend: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.booking_outcome && !values.fault) {
      ctx.addIssue({ code: 'custom', path: ['fault'], message: 'resolve.errors.fault' });
    }
  });

export default function ResolveForm({ report, onSubmit, loading }) {
  const { t } = useTranslation('admin');
  const disputed = report.target_type === 'BOOKING' && report.target?.status === 'DISPUTED';
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'RESOLVED',
      resolution_note: '',
      booking_outcome: '',
      fault: '',
      review_action: '',
      suspend: false,
    },
  });
  const status = useWatch({ control, name: 'status' });
  const acting = status === 'RESOLVED';
  const options = (keys, prefix) => [
    { value: '', label: t('resolve.choose') },
    ...keys.map((key) => ({ value: key, label: t(`${prefix}.${key}`) })),
  ];

  const submit = (values) => {
    const payload = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== '' && value !== false),
    );
    onSubmit(acting ? payload : { status, resolution_note: values.resolution_note }, (error) =>
      applyServerErrors(error, setError),
    );
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      <Select
        label={t('resolve.status')}
        options={['RESOLVED', ...(disputed ? [] : ['DISMISSED'])].map((value) => ({
          value,
          label: t(`common:report.status.${value}`),
        }))}
        {...register('status')}
      />
      {acting && disputed && (
        <Select
          label={t('resolve.outcome')}
          options={options(DISPUTE_OUTCOMES, 'resolve.outcomes')}
          error={fieldError(errors, 'booking_outcome', t)}
          {...register('booking_outcome')}
        />
      )}
      {acting && report.target_type === 'BOOKING' && (
        <Select
          label={t('resolve.fault')}
          options={options(FAULTS, 'common:report.fault')}
          error={fieldError(errors, 'fault', t)}
          {...register('fault')}
        />
      )}
      {acting && report.target_type === 'REVIEW' && (
        <Select
          label={t('resolve.reviewAction')}
          options={options(REVIEW_ACTIONS, 'resolve.reviewActions')}
          error={fieldError(errors, 'review_action', t)}
          {...register('review_action')}
        />
      )}
      {acting && (
        <Controller
          name="suspend"
          control={control}
          render={({ field }) => (
            <Checkbox
              label={t(`resolve.suspend.${report.target_type}`)}
              checked={field.value}
              onChange={(event) => field.onChange(event.target.checked)}
              error={fieldError(errors, 'suspend', t)}
            />
          )}
        />
      )}
      <Textarea
        label={t('resolve.note')}
        hint={t('resolve.noteHint')}
        rows={4}
        maxLength={1000}
        error={fieldError(errors, 'resolution_note', t)}
        {...register('resolution_note')}
      />
      <Button type="submit" icon={CheckCircle2} loading={loading} fullWidth>
        {t('resolve.submit')}
      </Button>
    </form>
  );
}
