import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Languages, Save } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { z } from 'zod';
import { getErrorMessage } from '@/api/errors';
import { Alert, Button, Card, Input, PageHeader, TileGroup, useToast } from '@/components/ui';
import { useAuth, useUpdateMe } from '@/hooks/auth';
import { applyServerErrors, fieldError } from '@/lib/forms';

const schema = z.object({
  full_name: z.string().trim().min(2, 'account.errors.name').max(150),
  email: z.union([z.literal(''), z.email('account.errors.email')]),
  preferred_language: z.enum(['bn', 'en']),
});

export default function AccountSettingsPage() {
  const { t, i18n } = useTranslation('customer');
  const toast = useToast();
  const { user } = useAuth();
  const update = useUpdateMe();
  const isWorker = user.role === 'WORKER';
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    values: {
      full_name: user.full_name ?? '',
      email: user.email ?? '',
      preferred_language: user.preferred_language ?? i18n.language,
    },
  });

  const onSubmit = (values) =>
    update.mutate(values, {
      onSuccess: () => {
        i18n.changeLanguage(values.preferred_language);
        toast.success(t('account.saved'));
      },
      onError: (error) => applyServerErrors(error, setError),
    });

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title={t('account.title')} />

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <Input label={t('account.phone')} value={user.phone} readOnly disabled />
          <Input
            label={t('account.name')}
            error={fieldError(errors, 'full_name', t)}
            {...register('full_name')}
          />
          {!isWorker && (
            <Input
              type="email"
              label={t('account.email')}
              hint={t('account.emailHint')}
              error={fieldError(errors, 'email', t)}
              {...register('email')}
            />
          )}
          <Controller
            name="preferred_language"
            control={control}
            render={({ field }) => (
              <TileGroup
                label={t('account.language')}
                options={[
                  { value: 'bn', label: 'বাংলা', icon: Languages },
                  { value: 'en', label: 'English', icon: Languages },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {update.isError && !update.error.response?.data?.errors && (
            <Alert tone="error">{getErrorMessage(update.error, t)}</Alert>
          )}
          <Button
            type="submit"
            size={isWorker ? 'xl' : 'lg'}
            icon={Save}
            loading={update.isPending}
            disabled={!isDirty}
            fullWidth
          >
            {t('account.save')}
          </Button>
        </form>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">
            {t(isWorker ? 'account.pinTitle' : 'account.passwordTitle')}
          </p>
          <p className="text-sm text-gray-600">{t('account.credentialHint')}</p>
        </div>
        <Button as={Link} to="/set-pin" variant="outline" icon={KeyRound}>
          {t(isWorker ? 'account.changePin' : 'account.changePassword')}
        </Button>
      </Card>
    </div>
  );
}
