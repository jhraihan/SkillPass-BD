import api from '@/api/client';
import { USE_MOCKS } from '@/lib/config';
import { mockRequest } from '@/mocks/utils';

/**
 * Call the real API, or return mock data when VITE_USE_MOCKS=true.
 *   apiOrMock(() => api.get('/workers/', { params }), () => mockPaginate(workers, page))
 * `mock` may return plain data or a promise (e.g. mockFind / mockError).
 */
export async function apiOrMock(realCall, mock) {
  if (USE_MOCKS) {
    const data = typeof mock === 'function' ? mock() : mock;
    return data instanceof Promise ? data : mockRequest(data);
  }
  const response = await realCall();
  return response.data;
}

export { api };
