import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/auth-context';
import {
  mockBookingAction,
  mockCancelRequest,
  mockCreateBooking,
  mockCreateRequest,
  mockGetBooking,
  mockGetRequest,
  mockListBookings,
  mockListRequests,
  mockMatches,
} from '@/mocks/bookings';
import { api, apiOrMock } from './request';

function useViewerRole() {
  return useAuth().user?.role;
}

function useInvalidateBookings() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['service-requests'] });
    queryClient.invalidateQueries({ queryKey: ['workers', 'me'] });
  };
}

export function useServiceRequests() {
  return useQuery({
    queryKey: ['service-requests', 'list'],
    queryFn: () =>
      apiOrMock(
        () => api.get('/service-requests/'),
        () => mockListRequests(),
      ),
  });
}

export function useServiceRequest(id) {
  return useQuery({
    queryKey: ['service-requests', 'detail', String(id)],
    queryFn: () =>
      apiOrMock(
        () => api.get(`/service-requests/${id}/`),
        () => mockGetRequest(id),
      ),
    enabled: Boolean(id),
  });
}

export function useCreateServiceRequest() {
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: (values) =>
      apiOrMock(
        () => api.post('/service-requests/', values),
        () => mockCreateRequest(values),
      ),
    onSuccess: invalidate,
  });
}

export function useCancelServiceRequest() {
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: (id) =>
      apiOrMock(
        () => api.post(`/service-requests/${id}/cancel/`),
        () => mockCancelRequest(id),
      ),
    onSuccess: invalidate,
  });
}

export function useMatches(requestId) {
  return useQuery({
    queryKey: ['service-requests', 'matches', String(requestId)],
    queryFn: () =>
      apiOrMock(
        () => api.get(`/service-requests/${requestId}/matches/`),
        () => mockMatches(requestId),
      ),
    enabled: Boolean(requestId),
  });
}

export function useBookings({ scope, page = 1 } = {}) {
  const role = useViewerRole();
  const params = { ...(scope ? { scope } : {}), page };
  return useQuery({
    queryKey: ['bookings', 'list', params],
    queryFn: () =>
      apiOrMock(
        () => api.get('/bookings/', { params }),
        () => mockListBookings(params, role),
      ),
    placeholderData: (previous) => previous,
  });
}

export function useBooking(id) {
  const role = useViewerRole();
  return useQuery({
    queryKey: ['bookings', 'detail', String(id)],
    queryFn: () =>
      apiOrMock(
        () => api.get(`/bookings/${id}/`),
        () => mockGetBooking(id, role),
      ),
    enabled: Boolean(id),
  });
}

export function useCreateBooking() {
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: (values) =>
      apiOrMock(
        () => api.post('/bookings/', values),
        () => mockCreateBooking(values),
      ),
    onSuccess: invalidate,
  });
}

export function useBookingAction() {
  const role = useViewerRole();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: ({ id, action, note }) =>
      apiOrMock(
        () => api.post(`/bookings/${id}/${action}/`, note ? { note } : {}),
        () => mockBookingAction({ id, action, note }, role),
      ),
    onSuccess: (booking) => {
      queryClient.setQueryData(['bookings', 'detail', String(booking.id)], booking);
      invalidate();
    },
  });
}
