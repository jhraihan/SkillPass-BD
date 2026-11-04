import { mockPaginate, mockRequest } from './utils';

const AC = { name_en: 'AC Repair', name_bn: 'এসি মেরামত', icon: 'snowflake' };
const PAINT = { name_en: 'Painting', name_bn: 'রং মিস্ত্রি', icon: 'paint-roller' };
const MIRPUR = { name_en: 'Mirpur', name_bn: 'মিরপুর' };
const BADDA = { name_en: 'Badda', name_bn: 'বাড্ডা' };

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

let nextId = 900;

function make(type, data, minutes, isRead = false) {
  return {
    id: (nextId += 1),
    type,
    title: '',
    body: '',
    data,
    is_read: isRead,
    created_at: minutesAgo(minutes),
  };
}

const lists = {
  WORKER: [
    make('NEW_JOB', { booking_id: 102, category: AC, area: MIRPUR, name: 'Nusrat' }, 2),
    make('REVIEW_RECEIVED', { booking_id: 110, category: AC, area: MIRPUR, stars: '4.5' }, 180),
    make(
      'VERIFICATION_APPROVED',
      { subject: { name_en: 'Identity (NID)', name_bn: 'পরিচয় (এনআইডি)' } },
      60 * 30,
      true,
    ),
    make(
      'JOB_COMPLETED',
      { booking_id: 104, category: AC, area: MIRPUR, name: 'Nusrat' },
      60 * 50,
      true,
    ),
  ],
  CUSTOMER: [
    make(
      'CONFIRM_COMPLETION',
      { booking_id: 108, category: AC, area: MIRPUR, name: 'রহিম উদ্দিন' },
      15,
    ),
    make(
      'WORKER_ON_THE_WAY',
      { booking_id: 104, category: AC, area: MIRPUR, name: 'রহিম উদ্দিন' },
      90,
    ),
    make(
      'BOOKING_ACCEPTED',
      { booking_id: 106, category: AC, area: MIRPUR, name: 'Karim Hossain' },
      60 * 5,
      true,
    ),
    make('JOB_COMPLETED', { booking_id: 110, category: PAINT, area: BADDA }, 60 * 26, true),
  ],
  ADMIN: [
    make(
      'BOOKING_DISPUTED',
      { booking_id: 112, category: AC, area: MIRPUR, reason: 'The pump stopped again.' },
      30,
    ),
  ],
};

function listFor(role) {
  return lists[role] ?? [];
}

export function mockListNotifications({ unread, type, page = 1 } = {}, role) {
  const items = listFor(role)
    .filter((n) => String(unread) !== 'true' || !n.is_read)
    .filter((n) => !type || n.type === type);
  return mockRequest(mockPaginate(items, Number(page), 20), { delay: 200 });
}

export function mockUnreadCount(role) {
  return mockRequest({ count: listFor(role).filter((n) => !n.is_read).length }, { delay: 150 });
}

export function mockMarkRead(id, role) {
  let updated = 0;
  listFor(role).forEach((n) => {
    if ((id === undefined || String(n.id) === String(id)) && !n.is_read) {
      n.is_read = true;
      updated += 1;
    }
  });
  return mockRequest({ updated }, { delay: 150 });
}

export function mockSupport() {
  return mockRequest({ phone: '+8801700000000', whatsapp: '8801700000000', hours: '9:00-21:00' });
}
