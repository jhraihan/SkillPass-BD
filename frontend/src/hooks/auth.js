import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/app/auth-context';
import { mockChangeCredential, mockLogin, mockRegister } from '@/mocks/auth';
import { api, apiOrMock } from './request';

export function useLogin() {
  const { signIn } = useAuth();
  return useMutation({
    mutationFn: (values) =>
      apiOrMock(
        () => api.post('/auth/login/', values),
        () => mockLogin(values),
      ),
    onSuccess: signIn,
  });
}

export function useRegister() {
  const { signIn } = useAuth();
  return useMutation({
    mutationFn: (values) =>
      apiOrMock(
        () => api.post('/auth/register/', values),
        () => mockRegister(values),
      ),
    onSuccess: signIn,
  });
}

export function useChangeCredential() {
  const { user, signIn } = useAuth();
  return useMutation({
    mutationFn: (values) =>
      apiOrMock(
        () => api.post('/auth/password/change/', values),
        () => mockChangeCredential(values),
      ),
    onSuccess: (tokens) => signIn({ ...tokens, user: { ...user, must_change_credential: false } }),
  });
}

export function useUpdateMe() {
  const { user, updateUser } = useAuth();
  return useMutation({
    mutationFn: (changes) =>
      apiOrMock(
        () => api.patch('/auth/me/', changes),
        () => ({ ...user, ...changes }),
      ),
    onSuccess: updateUser,
  });
}

export { useAuth };
