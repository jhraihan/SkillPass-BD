import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/auth-context';
import {
  mockCreateReport,
  mockGetReport,
  mockListReports,
  mockResolveReport,
  mockTakeReport,
} from '@/mocks/reports';
import { api, apiOrMock } from './request';

function useViewerRole() {
  return useAuth().user?.role;
}

function cleanParams(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined),
  );
}

export function useReports(filters = {}) {
  const role = useViewerRole();
  const params = cleanParams({ page: 1, ...filters });
  return useQuery({
    queryKey: ['reports', 'list', role, params],
    queryFn: () =>
      apiOrMock(
        () => api.get('/reports/', { params }),
        () => mockListReports(params, role),
      ),
    placeholderData: (previous) => previous,
  });
}

export function useReport(id) {
  const role = useViewerRole();
  return useQuery({
    queryKey: ['reports', 'detail', String(id)],
    queryFn: () =>
      apiOrMock(
        () => api.get(`/reports/${id}/`),
        () => mockGetReport(id, role),
      ),
    enabled: Boolean(id),
  });
}

export function useCreateReport() {
  const role = useViewerRole();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values) =>
      apiOrMock(
        () => api.post('/reports/', values),
        () => mockCreateReport(values, role),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });
}

function useReportMutation(realCall, mockCall) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) =>
      apiOrMock(
        () => realCall(input),
        () => mockCall(input),
      ),
    onSuccess: (report) => {
      queryClient.setQueryData(['reports', 'detail', String(report.id)], report);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useTakeReport() {
  return useReportMutation((id) => api.post(`/reports/${id}/take/`), mockTakeReport);
}

export function useResolveReport() {
  return useReportMutation(
    ({ id, ...values }) => api.post(`/reports/${id}/resolve/`, values),
    mockResolveReport,
  );
}
