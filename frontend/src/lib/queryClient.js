import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      // Save mobile data on budget phones: don't refetch just because the tab regained focus.
      refetchOnWindowFocus: false,
    },
  },
});
