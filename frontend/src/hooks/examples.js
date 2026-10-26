// Mock-only hooks used by the reference pages in features/_example.
// Real hooks follow the same shape but use apiOrMock() from ./request.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { exampleItems } from '@/mocks/examples';
import { mockFind, mockPaginate, mockRequest } from '@/mocks/utils';

export const EXAMPLE_PAGE_SIZE = 5;

export function useExampleItems({ page = 1 } = {}) {
  return useQuery({
    queryKey: ['examples', 'list', { page }],
    queryFn: () => mockRequest(mockPaginate(exampleItems, page, EXAMPLE_PAGE_SIZE)),
    placeholderData: (previous) => previous,
  });
}

export function useExampleItem(id) {
  return useQuery({
    queryKey: ['examples', 'detail', id],
    queryFn: () => mockFind(exampleItems, id),
    enabled: Boolean(id),
  });
}

export function useCreateExampleItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values) =>
      mockRequest({ id: exampleItems.length + 1, status: 'PENDING', ...values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['examples'] }),
  });
}
