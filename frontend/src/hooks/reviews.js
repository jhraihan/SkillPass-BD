import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  mockCreateReview,
  mockMyReviews,
  mockMyWorkHistory,
  mockWorkerReviews,
  mockWorkHistory,
} from '@/mocks/reviews';
import { api, apiOrMock } from './request';

export { REVIEW_PAGE_SIZE } from '@/mocks/reviews';

function usePagedList(key, path, mock, { page = 1, enabled = true } = {}) {
  return useQuery({
    queryKey: [...key, { page }],
    queryFn: () =>
      apiOrMock(
        () => api.get(path, { params: { page } }),
        () => mock(page),
      ),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useWorkerReviews(workerId, { page = 1 } = {}) {
  return usePagedList(
    ['workers', 'detail', String(workerId), 'reviews'],
    `/workers/${workerId}/reviews/`,
    (p) => mockWorkerReviews(workerId, p),
    { page, enabled: Boolean(workerId) },
  );
}

export function useWorkHistory(workerId, { page = 1 } = {}) {
  return usePagedList(
    ['workers', 'detail', String(workerId), 'history'],
    `/workers/${workerId}/work-history/`,
    (p) => mockWorkHistory(workerId, p),
    { page, enabled: Boolean(workerId) },
  );
}

export function useMyReviews({ page = 1 } = {}) {
  return usePagedList(['workers', 'me', 'reviews'], '/workers/me/reviews/', mockMyReviews, {
    page,
  });
}

export function useMyWorkHistory({ page = 1 } = {}) {
  return usePagedList(
    ['workers', 'me', 'history'],
    '/workers/me/work-history/',
    mockMyWorkHistory,
    {
      page,
    },
  );
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values) =>
      apiOrMock(
        () => api.post('/reviews/', values),
        () => mockCreateReview(values),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}
