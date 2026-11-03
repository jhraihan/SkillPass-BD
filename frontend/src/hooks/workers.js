import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  mockGetWorker,
  mockMyProfile,
  mockSearchWorkers,
  mockSetMyAreas,
  mockSetMySkills,
  mockUpdateMyProfile,
  mockUploadMyPhoto,
  mockWorkerDashboard,
} from '@/mocks/workers';
import { api, apiOrMock } from './request';

export { WORKER_PAGE_SIZE } from '@/mocks/workers';

const MY_PROFILE_KEY = ['workers', 'me'];

function cleanParams(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== '' && value !== undefined && value !== false,
    ),
  );
}

export function useWorkerSearch(filters = {}) {
  const params = cleanParams(filters);
  return useQuery({
    queryKey: ['workers', 'search', params],
    queryFn: () =>
      apiOrMock(
        () => api.get('/workers/', { params }),
        () => mockSearchWorkers(params),
      ),
    placeholderData: (previous) => previous,
  });
}

export function useWorker(id) {
  return useQuery({
    queryKey: ['workers', 'detail', String(id)],
    queryFn: () =>
      apiOrMock(
        () => api.get(`/workers/${id}/`),
        () => mockGetWorker(id),
      ),
    enabled: Boolean(id),
  });
}

export function useMyWorkerProfile() {
  return useQuery({
    queryKey: MY_PROFILE_KEY,
    queryFn: () =>
      apiOrMock(
        () => api.get('/workers/me/'),
        () => mockMyProfile(),
      ),
  });
}

export function useWorkerDashboard() {
  return useQuery({
    queryKey: [...MY_PROFILE_KEY, 'dashboard'],
    queryFn: () =>
      apiOrMock(
        () => api.get('/workers/me/dashboard/'),
        () => mockWorkerDashboard(),
      ),
  });
}

function useMyProfileMutation(realCall, mockCall) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) =>
      apiOrMock(
        () => realCall(input),
        () => mockCall(input),
      ),
    onSuccess: (profile) => {
      queryClient.setQueryData(MY_PROFILE_KEY, profile);
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useUpdateMyWorkerProfile() {
  return useMyProfileMutation((changes) => api.patch('/workers/me/', changes), mockUpdateMyProfile);
}

export function useSetMySkills() {
  return useMyProfileMutation(
    (ids) => api.put('/workers/me/skills/', { skills: ids }),
    mockSetMySkills,
  );
}

export function useSetMyAreas() {
  return useMyProfileMutation(
    (ids) => api.put('/workers/me/service-areas/', { areas: ids }),
    mockSetMyAreas,
  );
}

export function useUploadMyPhoto() {
  return useMyProfileMutation((file) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post('/workers/me/photo/', form);
  }, mockUploadMyPhoto);
}
