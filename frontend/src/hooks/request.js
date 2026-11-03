import api from '@/api/client';
import { USE_MOCKS } from '@/lib/config';
import { mockRequest } from '@/mocks/utils';

export async function apiOrMock(realCall, mock) {
  if (USE_MOCKS) {
    const data = typeof mock === 'function' ? mock() : mock;
    return data instanceof Promise ? data : mockRequest(data);
  }
  const response = await realCall();
  return response.data;
}

export { api };
