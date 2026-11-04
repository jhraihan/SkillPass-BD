import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockAdminUserAction, mockListAdminUsers, mockOnboardWorker } from '@/mocks/adminUsers';
import { api, apiOrMock } from './request';

export function useAdminUsers(filters = {}) {
  const params = Object.fromEntries(
    Object.entries({ page: 1, ...filters }).filter(([, value]) => value),
  );
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () =>
      apiOrMock(
        () => api.get('/admin/users/', { params }),
        () => mockListAdminUsers(params),
      ),
    placeholderData: (previous) => previous,
  });
}

export function useAdminUserAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }) =>
      apiOrMock(
        () => api.post(`/admin/users/${id}/${action}/`, action === 'suspend' ? { reason } : {}),
        () => mockAdminUserAction({ id, action, reason }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useOnboardWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values) =>
      apiOrMock(
        () => api.post('/admin/workers/', values),
        () => mockOnboardWorker(values),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });
}
