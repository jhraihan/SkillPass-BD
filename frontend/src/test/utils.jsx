import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ToastProvider } from '@/components/ui';

/**
 * Render a page with everything it needs (data cache, router, toasts).
 *   renderPage(<BookingDetailPage />, { route: '/customer/bookings/5', path: '/customer/bookings/:id' })
 */
export function renderPage(ui, { route = '/', path = '*' } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={ui} />
            {path !== '*' && <Route path="*" element={null} />}
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}
