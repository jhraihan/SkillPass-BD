import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation } from 'react-router';
import { z } from 'zod';
import { getErrorMessage } from '@/api/errors';
import { Alert, Button, Card, Input } from '@/components/ui';
import { useAuth, useLogin } from '@/hooks/auth';
import { USE_MOCKS } from '@/lib/config';
import { homePathForRole } from '@/lib/constants';
import { fieldError } from '@/lib/forms';
import { isValidBdPhone } from '@/lib/validation';

const schema = z.object({
  phone: z.string().refine(isValidBdPhone, 'common:errors.phone'),
  password: z.string().min(1, 'common:errors.required'),
});

export default function LoginPage() {
  const { t } = useTranslation('public');
  const { user } = useAuth();
  const location = useLocation();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { phone: '', password: '' } });

  if (user) {
    return <Navigate to={location.state?.from?.pathname ?? homePathForRole(user.role)} replace />;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">{t('login.title')}</h1>
          <p className="mt-1 text-gray-600">{t('login.subtitle')}</p>
        </div>

        {USE_MOCKS && <Alert tone="info">{t('login.mockHint')}</Alert>}
        {login.isError && <Alert tone="error">{getErrorMessage(login.error, t)}</Alert>}

        <form
          onSubmit={handleSubmit((values) => login.mutate(values))}
          noValidate
          className="space-y-5"
        >
          <Input
            label={t('login.phone')}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t('login.phonePlaceholder')}
            error={fieldError(errors, 'phone', t)}
            {...register('phone')}
          />
          <Input
            label={t('login.password')}
            type="password"
            autoComplete="current-password"
            error={fieldError(errors, 'password', t)}
            {...register('password')}
          />
          <Button type="submit" size="lg" fullWidth icon={LogIn} loading={login.isPending}>
            {t('login.submit')}
          </Button>
        </form>

        <p className="text-center text-gray-600">
          {t('login.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            {t('login.register')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
