import { mockUsers } from './users';
import { mockError, mockPaginate, mockRequest } from './utils';
import { workers } from './workers';

const DIGITS = '0123456789';
const LETTERS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function mockUserIdForWorker(workerId) {
  return workerId === 2 ? mockUsers.WORKER.id : 100 + workerId;
}

function daysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function base(user, extra = {}) {
  return {
    id: user.id,
    full_name: user.full_name,
    phone: user.phone,
    role: user.role,
    is_suspended: false,
    is_locked: false,
    failed_login_count: 0,
    must_change_credential: false,
    date_joined: daysAgo(60),
    last_login: daysAgo(1),
    worker_profile_id: null,
    ...extra,
  };
}

const users = [
  base(mockUsers.ADMIN, { date_joined: daysAgo(200) }),
  base(mockUsers.CUSTOMER, { date_joined: daysAgo(90) }),
  base(
    { id: 4, full_name: 'Tanvir Ahmed', phone: '+8801711000004', role: 'CUSTOMER' },
    { is_locked: true, failed_login_count: 10, date_joined: daysAgo(20) },
  ),
  base(
    { id: 5, full_name: 'Sabrina Haque', phone: '+8801711000005', role: 'CUSTOMER' },
    { is_suspended: true, date_joined: daysAgo(15), last_login: daysAgo(10) },
  ),
  ...workers.map((worker, index) =>
    base(
      {
        id: mockUserIdForWorker(worker.id),
        full_name: worker.display_name,
        phone: `+8801${String(700000000 + worker.id * 1234567).slice(0, 9)}`,
        role: 'WORKER',
      },
      { worker_profile_id: worker.id, date_joined: daysAgo(50 - index * 3) },
    ),
  ),
];

function byId(id) {
  return users.find((user) => String(user.id) === String(id));
}

export function mockAdminSetSuspended(id, value) {
  const user = byId(id);
  if (!user) return;
  user.is_suspended = value;
  const worker = workers.find((w) => w.id === user.worker_profile_id);
  if (worker) worker.is_suspended = value;
}

const STATES = {
  active: (u) => !u.is_suspended && !u.is_locked,
  suspended: (u) => u.is_suspended,
  locked: (u) => u.is_locked,
};

export function mockListAdminUsers({ search = '', role, state, page = 1 } = {}) {
  const term = search.trim().toLowerCase();
  const items = users
    .filter((u) => !term || `${u.full_name} ${u.phone}`.toLowerCase().includes(term))
    .filter((u) => !role || u.role === role)
    .filter((u) => !state || STATES[state](u))
    .sort((a, b) => b.date_joined.localeCompare(a.date_joined));
  return mockRequest(mockPaginate(items, Number(page), 20));
}

function pick(alphabet, length) {
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(
    '',
  );
}

export function mockAdminUserAction({ id, action, reason }) {
  const user = byId(id);
  if (!user) return mockError(404, 'Not found.');
  if (user.id === mockUsers.ADMIN.id && action !== 'unlock') {
    return mockError(400, 'Invalid input.', {
      detail: ['You cannot do this to your own account.'],
    });
  }
  if (action === 'suspend' && !reason?.trim()) {
    return mockError(400, 'Invalid input.', { reason: ['This field may not be blank.'] });
  }
  if (action === 'suspend') mockAdminSetSuspended(user.id, true);
  if (action === 'reactivate') mockAdminSetSuspended(user.id, false);
  if (action === 'unlock' || action === 'reset-credential') {
    Object.assign(user, { is_locked: false, failed_login_count: 0 });
  }
  if (action !== 'reset-credential') return mockRequest({ ...user });
  user.must_change_credential = true;
  const kind = user.role === 'WORKER' ? 'pin' : 'password';
  const credential =
    kind === 'pin' ? `${pick('123456789', 1)}${pick(DIGITS, 5)}` : pick(LETTERS, 12);
  return mockRequest({ user: { ...user }, kind, temporary_credential: credential });
}

export function mockOnboardWorker({ full_name: fullName, phone }) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  const normalized = `+880${digits.slice(-10)}`;
  if (!/^\+8801[3-9]\d{8}$/.test(normalized)) {
    return mockError(400, 'Invalid input.', {
      phone: ['Enter a valid Bangladeshi mobile number.'],
    });
  }
  if (users.some((u) => u.phone === normalized)) {
    return mockError(400, 'Invalid input.', {
      phone: ['An account with this phone number already exists.'],
    });
  }
  const user = base(
    { id: 300 + users.length, full_name: fullName, phone: normalized, role: 'WORKER' },
    { must_change_credential: true, date_joined: new Date().toISOString(), last_login: null },
  );
  users.push(user);
  const pin = `${pick('123456789', 1)}${pick(DIGITS, 5)}`;
  return mockRequest({ user: { ...user }, kind: 'pin', temporary_credential: pin });
}
