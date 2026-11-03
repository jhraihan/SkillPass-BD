import { normalizeBdPhone } from '@/lib/validation';
import { mockUsers } from './users';
import { mockError, mockRequest } from './utils';

const MOCK_TOKENS = { access: 'mock-access-token', refresh: 'mock-refresh-token' };

function findMockUser(phone) {
  const normalized = normalizeBdPhone(phone);
  return Object.values(mockUsers).find((user) => user.phone === normalized);
}

export function mockLogin({ phone, password }) {
  const user = findMockUser(phone);
  if (!user || String(password).length < 6) {
    return mockError(
      401,
      'Phone number or PIN/password is incorrect.',
      {},
      { code: 'invalid_credentials' },
    );
  }
  return mockRequest({ ...MOCK_TOKENS, user });
}

export function mockRegister({ role, full_name, phone, email, preferred_language }) {
  if (findMockUser(phone)) {
    return mockError(400, 'Invalid input.', {
      phone: ['An account with this phone number already exists.'],
    });
  }
  return mockRequest({
    ...MOCK_TOKENS,
    user: {
      id: Date.now(),
      phone: normalizeBdPhone(phone),
      email: email || null,
      full_name,
      role,
      preferred_language: preferred_language ?? 'bn',
      must_change_credential: false,
    },
  });
}

export function mockChangeCredential({ current_password }) {
  if (String(current_password).length < 6) {
    return mockError(400, 'Invalid input.', {
      current_password: ['The current PIN/password is incorrect.'],
    });
  }
  return mockRequest(MOCK_TOKENS);
}
