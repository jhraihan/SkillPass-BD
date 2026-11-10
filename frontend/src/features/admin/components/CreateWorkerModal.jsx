import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { getErrorMessage } from '@/api/errors';
import { Alert, Button, Input, Modal, TileGroup } from '@/components/ui';
import { useOnboardWorker } from '@/hooks/adminUsers';
import { applyServerErrors, fieldError } from '@/lib/forms';
import { isValidBdPhone } from '@/lib/validation';

const schema = z.object({
  full_name: z.string().trim().min(2, 'onboard.errors.name').max(150),
  phone: z.string().refine(isValidBdPhone, 'common:errors.phone'),
  preferred_language: z.enum(['bn', 'en']),
});

const FORM_ID = 'create-worker';

export default function CreateWorkerModal({ open, onClose, onCreated }) {
  const { t } = useTranslation('admin');
  const onboard = useOnboardWorker();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', phone: '', preferred_language: 'bn' },
  });

  const close = () => {
    reset();
    onboard.reset();
    onClose();
  };

  const onSubmit = (values) =>
    onboard.mutate(values, {
      onSuccess: (result) => {
        close();
        onCreated(result);
      },
      onError: (error) => applyServerErrors(error, setError),
    });

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('onboard.title')}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" form={FORM_ID} icon={UserPlus} loading={onboard.isPending}>
            {t('onboard.submit')}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <p className="text-sm text-gray-600">{t('onboard.description')}</p>
        {onboard.isError && !onboard.error.response?.data?.errors && (
          <Alert tone="error">{getErrorMessage(onboard.error, t)}</Alert>
        )}
        <Input
          label={t('onboard.name')}
          error={fieldError(errors, 'full_name', t)}
          {...register('full_name')}
        />
        <Input
          type="tel"
          inputMode="tel"
          label={t('onboard.phone')}
          placeholder="01XXXXXXXXX"
          error={fieldError(errors, 'phone', t)}
          {...register('phone')}
        />
        <Controller
          name="preferred_language"
          control={control}
          render={({ field }) => (
            <TileGroup
              label={t('onboard.language')}
              options={[
                { value: 'bn', label: 'বাংলা' },
                { value: 'en', label: 'English' },
              ]}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </form>
    </Modal>
  );
}
