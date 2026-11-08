import { zodResolver } from '@hookform/resolvers/zod';
import { House, UserPlus, Wrench } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router';
import { z } from 'zod';
import { getErrorMessage } from '@/api/errors';
import { Alert, Button, Card, Input, TileGroup } from '@/components/ui';
import { useAuth, useRegister } from '@/hooks/auth';
import { homePathForRole } from '@/lib/constants';
import { applyServerErrors, fieldError } from '@/lib/forms';
import { isValidBdPhone, MIN_PASSWORD_LENGTH, pinError } from '@/lib/validation';

const schema = z
  .object({
    role: z.enum(['CUSTOMER', 'WORKER'], { error: 'common:errors.required' }),
    full_name: z.string().trim().min(1, 'common:errors.required').max(150),
    phone: z.string().refine(isValidBdPhone, 'common:errors.phone'),
    email: z.union([z.literal(''), z.email('register.errors.email')]),
    password: z.string(),
    confirm: z.string(),
  })
  .superRefine((values, ctx) => {
    const isWorker = values.role === 'WORKER';
    const problem = isWorker
      ? pinError(values.password, values.phone)
      : values.password.length < MIN_PASSWORD_LENGTH && 'common:errors.passwordMin';
    if (problem) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: problem });
    } else if (values.confirm !== values.password) {
      const message = isWorker ? 'common:errors.pinMismatch' : 'common:errors.passwordMismatch';
      ctx.addIssue({ code: 'custom', path: ['confirm'], message });
    }
  });

export default function RegisterPage() {
  const { t, i18n } = useTranslation('public');
  const { user } = useAuth();
  const registerUser = useRegister();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      role: undefined,
      full_name: '',
      phone: '',
      email: '',
      password: '',
      confirm: '',
    },
  });

  const role = useWatch({ control, name: 'role' });

  if (user) return <Navigate to={homePathForRole(user.role)} replace />;

  const isWorker = role === 'WORKER';
  const secretProps = isWorker
    ? { inputMode: 'numeric', maxLength: 6, autoComplete: 'new-password' }
    : { autoComplete: 'new-password' };

  const onSubmit = ({ confirm: _confirm, email, ...values }) =>
    registerUser.mutate(
      { ...values, email: isWorker ? undefined : email, preferred_language: i18n.language },
      { onError: (error) => applyServerErrors(error, setError) },
    );

  const roleOptions = [
    { value: 'CUSTOMER', icon: House, ...t('register.roles.CUSTOMER', { returnObjects: true }) },
    { value: 'WORKER', icon: Wrench, ...t('register.roles.WORKER', { returnObjects: true }) },
  ];

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">{t('register.title')}</h1>
          <p className="mt-1 text-gray-600">{t('register.subtitle')}</p>
        </div>

        {registerUser.isError && !registerUser.error?.response?.data?.errors && (
          <Alert tone="error">{getErrorMessage(registerUser.error, t)}</Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <TileGroup
                label={t('register.roleLabel')}
                options={roleOptions}
                value={field.value}
                onChange={field.onChange}
                error={fieldError(errors, 'role', t)}
              />
            )}
          />

          {role && (
            <>
              <Input
                label={t('register.fullName')}
                autoComplete="name"
                error={fieldError(errors, 'full_name', t)}
                {...register('full_name')}
              />
              <Input
                label={t('register.phone')}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="01712345678"
                error={fieldError(errors, 'phone', t)}
                {...register('phone')}
              />
              {!isWorker && (
                <Input
                  label={t('register.email')}
                  type="email"
                  autoComplete="email"
                  error={fieldError(errors, 'email', t)}
                  {...register('email')}
                />
              )}
              <Input
                label={t(isWorker ? 'register.pin' : 'register.password')}
                hint={t(isWorker ? 'register.pinHint' : 'register.passwordHint')}
                type="password"
                error={fieldError(errors, 'password', t)}
                {...secretProps}
                {...register('password')}
              />
              <Input
                label={t(isWorker ? 'register.confirmPin' : 'register.confirmPassword')}
                type="password"
                error={fieldError(errors, 'confirm', t)}
                {...secretProps}
                {...register('confirm')}
              />
              <Button
                type="submit"
                size="lg"
                fullWidth
                icon={UserPlus}
                loading={registerUser.isPending}
              >
                {t('register.submit')}
              </Button>
            </>
          )}
        </form>

        <p className="text-center text-gray-600">
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            {t('register.login')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
