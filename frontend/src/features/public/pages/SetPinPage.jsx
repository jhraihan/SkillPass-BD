import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { getErrorMessage } from '@/api/errors';
import { Alert, Button, Card, Input, useToast } from '@/components/ui';
import { useAuth, useChangeCredential } from '@/hooks/auth';
import { homePathForRole } from '@/lib/constants';
import { applyServerErrors, fieldError } from '@/lib/forms';
import { MIN_PASSWORD_LENGTH, pinError } from '@/lib/validation';

function buildSchema(isWorker, phone) {
  return z
    .object({
      current_password: z.string().min(1, 'common:errors.required'),
      new_password: z.string(),
      confirm: z.string(),
    })
    .superRefine((values, ctx) => {
      const problem = isWorker
        ? pinError(values.new_password, phone)
        : values.new_password.length < MIN_PASSWORD_LENGTH && 'common:errors.passwordMin';
      if (problem) {
        ctx.addIssue({ code: 'custom', path: ['new_password'], message: problem });
      } else if (values.confirm !== values.new_password) {
        const message = isWorker ? 'common:errors.pinMismatch' : 'common:errors.passwordMismatch';
        ctx.addIssue({ code: 'custom', path: ['confirm'], message });
      }
    });
}

export default function SetPinPage() {
  const { t } = useTranslation('public');
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const changeCredential = useChangeCredential();
  const isWorker = user.role === 'WORKER';
  const schema = useMemo(() => buildSchema(isWorker, user.phone), [isWorker, user.phone]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { current_password: '', new_password: '', confirm: '' },
  });

  const onSubmit = ({ current_password, new_password }) =>
    changeCredential.mutate(
      { current_password, new_password },
      {
        onSuccess: () => {
          toast.success(t('setPin.success'));
          navigate(homePathForRole(user.role), { replace: true });
        },
        onError: (error) => applyServerErrors(error, setError),
      },
    );

  const secretProps = isWorker
    ? { type: 'password', inputMode: 'numeric', maxLength: 6 }
    : { type: 'password' };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">
            {t(isWorker ? 'setPin.titlePin' : 'setPin.titlePassword')}
          </h1>
          <p className="mt-1 text-gray-600">{t('setPin.subtitle')}</p>
        </div>

        {changeCredential.isError && !changeCredential.error?.response?.data?.errors && (
          <Alert tone="error">{getErrorMessage(changeCredential.error, t)}</Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <Input
            label={t(isWorker ? 'setPin.currentPin' : 'setPin.currentPassword')}
            autoComplete="current-password"
            error={fieldError(errors, 'current_password', t)}
            {...secretProps}
            {...register('current_password')}
          />
          <Input
            label={t(isWorker ? 'setPin.newPin' : 'setPin.newPassword')}
            autoComplete="new-password"
            error={fieldError(errors, 'new_password', t)}
            {...secretProps}
            {...register('new_password')}
          />
          <Input
            label={t(isWorker ? 'setPin.confirmPin' : 'setPin.confirmPassword')}
            autoComplete="new-password"
            error={fieldError(errors, 'confirm', t)}
            {...secretProps}
            {...register('confirm')}
          />
          <Button
            type="submit"
            size="lg"
            fullWidth
            icon={KeyRound}
            loading={changeCredential.isPending}
          >
            {t('setPin.submit')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
