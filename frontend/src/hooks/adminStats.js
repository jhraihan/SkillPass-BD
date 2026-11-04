import { useQuery } from '@tanstack/react-query';
import { mockAdminStats } from '@/mocks/adminStats';
import { api, apiOrMock } from './request';

export function useAdminStats(days = 30) {
  return useQuery({
    queryKey: ['admin', 'stats', days],
    queryFn: () =>
      apiOrMock(
        () => api.get('/admin/stats/', { params: { days } }),
        () => mockAdminStats(days),
      ),
    placeholderData: (previous) => previous,
    refetchInterval: 60000,
  });
}
