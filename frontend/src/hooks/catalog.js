import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockCatalogDelete, mockCatalogList, mockCatalogSave } from '@/mocks/catalog';
import { api, apiOrMock } from './request';

const CATALOG_STALE_TIME = 5 * 60 * 1000;

function useCatalogList(resource, filters = {}) {
  const { includeInactive = false, ...rest } = filters;
  const params = { ...rest, ...(includeInactive ? { include_inactive: true } : {}) };
  return useQuery({
    queryKey: ['catalog', resource, filters],
    queryFn: () =>
      apiOrMock(
        () => api.get(`/${resource}/`, { params }),
        () => mockCatalogList(resource, filters),
      ),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useCategories({ includeInactive = false } = {}) {
  return useCatalogList('categories', { includeInactive });
}

export function useSkills({ category, includeInactive = false } = {}) {
  return useCatalogList('skills', { category, includeInactive });
}

export function useAreas({ district, includeInactive = false } = {}) {
  return useCatalogList('areas', { district, includeInactive });
}

export function useDistricts() {
  return useCatalogList('districts');
}

export function useSaveCatalogItem(resource) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...values }) =>
      apiOrMock(
        () => (id ? api.patch(`/${resource}/${id}/`, values) : api.post(`/${resource}/`, values)),
        () => mockCatalogSave(resource, { id, ...values }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog'] }),
  });
}

export function useDeleteCatalogItem(resource) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      apiOrMock(
        () => api.delete(`/${resource}/${id}/`),
        () => mockCatalogDelete(resource, id),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog'] }),
  });
}
