import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/auth-context';
import { useObjectUrl } from '@/lib/objectUrl';
import {
  mockDecideVerification,
  mockDocument,
  mockGetVerification,
  mockListVerifications,
  mockSubmitVerification,
} from '@/mocks/verification';
import { api, apiOrMock } from './request';

function useViewerRole() {
  return useAuth().user?.role;
}

function useInvalidateVerification() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['verification'] });
    queryClient.invalidateQueries({ queryKey: ['workers'] });
  };
}

function cleanParams(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
}

export function useVerifications(filters = {}) {
  const role = useViewerRole();
  const params = cleanParams({ page: 1, ...filters });
  return useQuery({
    queryKey: ['verification', 'list', role, params],
    queryFn: () =>
      apiOrMock(
        () => api.get('/verification/', { params }),
        () => mockListVerifications(params, role),
      ),
    placeholderData: (previous) => previous,
  });
}

export function useVerification(id) {
  const role = useViewerRole();
  return useQuery({
    queryKey: ['verification', 'detail', String(id)],
    queryFn: () =>
      apiOrMock(
        () => api.get(`/verification/${id}/`),
        () => mockGetVerification(id, role),
      ),
    enabled: Boolean(id),
  });
}

function toFormData({ type, skill, files }) {
  const form = new FormData();
  form.append('type', type);
  if (skill) form.append('skill', skill);
  files.forEach((file) => form.append('files', file));
  return form;
}

export function useSubmitVerification() {
  const invalidate = useInvalidateVerification();
  return useMutation({
    mutationFn: (values) =>
      apiOrMock(
        () => api.post('/verification/', toFormData(values)),
        () => mockSubmitVerification(values),
      ),
    onSuccess: invalidate,
  });
}

export function useVerificationDecision() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateVerification();
  return useMutation({
    mutationFn: ({ id, decision, reason }) =>
      apiOrMock(
        () => api.post(`/verification/${id}/${decision}/`, decision === 'reject' ? { reason } : {}),
        () => mockDecideVerification({ id, decision, reason }),
      ),
    onSuccess: (verification) => {
      queryClient.setQueryData(['verification', 'detail', String(verification.id)], verification);
      invalidate();
    },
  });
}

export function useDocumentUrl(documentId) {
  const query = useQuery({
    queryKey: ['verification', 'document', String(documentId)],
    queryFn: () =>
      apiOrMock(
        () => api.get(`/verification/documents/${documentId}/`, { responseType: 'blob' }),
        () => mockDocument(documentId),
      ),
    enabled: Boolean(documentId),
    staleTime: Infinity,
  });
  const url = useObjectUrl(query.data ?? null);
  return { ...query, url };
}
