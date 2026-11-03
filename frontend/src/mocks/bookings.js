import { areas, categories, skills } from './catalogData';
import { mockUsers } from './users';
import { mockError, mockPaginate, mockRequest } from './utils';
import { myProfile, workers } from './workers';

const ACTIVE = [
  'PENDING',
  'ACCEPTED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'AWAITING_CONFIRMATION',
  'DISPUTED',
];
const CONTACT = [...ACTIVE.filter((s) => s !== 'PENDING'), 'COMPLETED', 'AUTO_CLOSED'];

const TRANSITIONS = {
  'PENDING>ACCEPTED': ['WORKER'],
  'PENDING>DECLINED': ['WORKER'],
  'PENDING>CANCELLED': ['CUSTOMER'],
  'ACCEPTED>ON_THE_WAY': ['WORKER'],
  'ACCEPTED>CANCELLED': ['CUSTOMER', 'WORKER'],
  'ON_THE_WAY>IN_PROGRESS': ['WORKER'],
  'ON_THE_WAY>CANCELLED': ['CUSTOMER', 'WORKER'],
  'IN_PROGRESS>AWAITING_CONFIRMATION': ['WORKER'],
  'IN_PROGRESS>DISPUTED': ['CUSTOMER', 'WORKER'],
  'AWAITING_CONFIRMATION>COMPLETED': ['CUSTOMER'],
  'AWAITING_CONFIRMATION>DISPUTED': ['CUSTOMER'],
};

const ACTIONS = {
  accept: 'ACCEPTED',
  decline: 'DECLINED',
  'on-the-way': 'ON_THE_WAY',
  start: 'IN_PROGRESS',
  'mark-complete': 'AWAITING_CONFIRMATION',
  confirm: 'COMPLETED',
  cancel: 'CANCELLED',
  dispute: 'DISPUTED',
};

const byId = (list, id) => list.find((item) => item.id === id);
const pick = ({ id, slug, name_en, name_bn, icon }) => ({ id, slug, name_en, name_bn, icon });
const daysFromToday = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const hoursAgo = (hours) => new Date(Date.now() - hours * 3600_000).toISOString();

let nextId = 100;
const requests = [];
const bookings = [];

function makeRequest({ category, skillSlugs = [], area, description, date, slot = 'MORNING' }) {
  const categoryItem = categories.find((c) => c.slug === category);
  const areaItem = areas.find((a) => a.slug === area);
  const skillItems = skills.filter((s) => skillSlugs.includes(s.slug));
  const request = {
    id: (nextId += 1),
    category: categoryItem.id,
    category_detail: pick(categoryItem),
    skills: skillItems.map((s) => s.id),
    skills_detail: skillItems.map(pick),
    description,
    area: areaItem.id,
    area_detail: pick(areaItem),
    address_detail: 'House 12, Road 3, Section 10',
    preferred_date: daysFromToday(date),
    preferred_slot: slot,
    status: 'OPEN',
    created_at: hoursAgo(5),
  };
  requests.push(request);
  return request;
}

function makeBooking(request, workerId, status, history) {
  const booking = {
    id: (nextId += 1),
    request_id: request.id,
    worker_id: workerId,
    status,
    accepted_at: CONTACT.includes(status) ? hoursAgo(3) : null,
    work_done_at: null,
    closed_at: null,
    cancel_reason: '',
    dispute_reason: '',
    completion_notes: '',
    is_verified: status === 'COMPLETED',
    created_at: hoursAgo(4),
    history: ['PENDING', ...history].map((to, index, all) => ({
      from_status: index ? all[index - 1] : '',
      to_status: to,
      actor_role: ['PENDING', 'COMPLETED'].includes(to) ? 'CUSTOMER' : 'WORKER',
      note: '',
      created_at: hoursAgo(4 - index * 0.5),
    })),
  };
  request.status =
    status === 'COMPLETED'
      ? 'CLOSED'
      : ACTIVE.includes(status) && status !== 'PENDING'
        ? 'BOOKED'
        : request.status;
  bookings.push(booking);
  return booking;
}

const acRequest = makeRequest({
  category: 'ac-repair',
  skillSlugs: ['ac-servicing'],
  area: 'mirpur',
  description: 'AC is not cooling and water is dripping.',
  date: 0,
});
makeBooking(acRequest, 2, 'PENDING', []);
const fridge = makeRequest({
  category: 'ac-repair',
  skillSlugs: ['refrigerator-repair'],
  area: 'mirpur',
  description: 'Fridge stopped cooling since yesterday.',
  date: 0,
  slot: 'AFTERNOON',
});
makeBooking(fridge, 2, 'IN_PROGRESS', ['ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS']);
const pipe = makeRequest({
  category: 'plumbing',
  skillSlugs: ['tap-pipe-repair'],
  area: 'dhanmondi',
  description: 'Kitchen tap is leaking.',
  date: 1,
});
makeBooking(pipe, 11, 'ACCEPTED', ['ACCEPTED']);
const install = makeRequest({
  category: 'ac-repair',
  skillSlugs: ['split-ac-installation'],
  area: 'mirpur',
  description: 'Install a new 1.5 ton split AC.',
  date: 2,
  slot: 'EVENING',
});
makeBooking(install, 2, 'AWAITING_CONFIRMATION', [
  'ACCEPTED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'AWAITING_CONFIRMATION',
]);
const paint = makeRequest({
  category: 'painting',
  skillSlugs: ['interior-painting'],
  area: 'badda',
  description: 'Paint two bedrooms.',
  date: -10,
});
makeBooking(paint, 13, 'COMPLETED', [
  'ACCEPTED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'AWAITING_CONFIRMATION',
  'COMPLETED',
]);
makeRequest({
  category: 'electrical',
  skillSlugs: ['fan-installation'],
  area: 'uttara',
  description: 'Install two ceiling fans.',
  date: 3,
});

function roleFor(booking, viewerRole) {
  return viewerRole === 'WORKER' ? 'WORKER' : 'CUSTOMER';
}

function present(booking, viewerRole) {
  const request = byId(requests, booking.request_id);
  const worker = byId(workers, booking.worker_id);
  const role = roleFor(booking, viewerRole);
  const contactVisible = Boolean(booking.accepted_at) && CONTACT.includes(booking.status);
  const customer = mockUsers.CUSTOMER;
  return {
    ...booking,
    request: {
      ...request,
      address_detail: role === 'WORKER' && !contactVisible ? null : request.address_detail,
    },
    worker: {
      id: worker.id,
      display_name: worker.display_name,
      photo: worker.photo,
      trust_score: worker.trust_score,
      is_new: worker.is_new,
      phone: contactVisible ? '+8801812345678' : null,
    },
    customer: {
      name:
        role === 'WORKER' && !contactVisible
          ? customer.full_name.split(' ')[0]
          : customer.full_name,
      phone: contactVisible ? customer.phone : null,
    },
    contact_visible: contactVisible,
    allowed_actions: Object.entries(ACTIONS)
      .filter(([, target]) => (TRANSITIONS[`${booking.status}>${target}`] ?? []).includes(role))
      .map(([action]) => action),
  };
}

function visibleTo(viewerRole) {
  return viewerRole === 'WORKER'
    ? bookings.filter((b) => b.worker_id === myProfile().id)
    : bookings;
}

const SCOPES = {
  active: (b) => ACTIVE.includes(b.status),
  today: (b) =>
    ACTIVE.includes(b.status) && byId(requests, b.request_id).preferred_date <= daysFromToday(0),
  upcoming: (b) =>
    ACTIVE.includes(b.status) && byId(requests, b.request_id).preferred_date > daysFromToday(0),
  past: (b) => !ACTIVE.includes(b.status),
};

export function mockListBookings({ scope, page = 1 } = {}, viewerRole) {
  const list = visibleTo(viewerRole)
    .filter(SCOPES[scope] ?? (() => true))
    .map((b) => present(b, viewerRole));
  return mockRequest(mockPaginate(list, Number(page), 20));
}

export function mockGetBooking(id, viewerRole) {
  const booking = visibleTo(viewerRole).find((b) => String(b.id) === String(id));
  return booking
    ? mockRequest(present(booking, viewerRole))
    : mockError(404, 'Not found.', {}, { code: 'not_found' });
}

export function mockBookingAction({ id, action, note = '' }, viewerRole) {
  const booking = byId(bookings, Number(id));
  const target = ACTIONS[action];
  const roles = TRANSITIONS[`${booking.status}>${target}`];
  if (!roles)
    return mockError(
      409,
      'This booking cannot move to that status now.',
      {},
      { code: 'invalid_transition' },
    );
  if (!roles.includes(roleFor(booking, viewerRole))) {
    return mockError(
      403,
      'You cannot do this on this booking.',
      {},
      { code: 'action_not_allowed' },
    );
  }
  if (['cancel', 'dispute'].includes(action) && !note.trim()) {
    return mockError(400, 'Invalid input.', { note: ['Please give a reason.'] });
  }
  booking.history.push({
    from_status: booking.status,
    to_status: target,
    actor_role: roleFor(booking, viewerRole),
    note,
    created_at: new Date().toISOString(),
  });
  booking.status = target;
  if (target === 'ACCEPTED') booking.accepted_at = new Date().toISOString();
  if (target === 'CANCELLED') booking.cancel_reason = note;
  if (target === 'DISPUTED') booking.dispute_reason = note;
  if (target === 'COMPLETED') booking.is_verified = true;
  return mockRequest(present(booking, viewerRole));
}

function presentRequest(request) {
  const active = bookings.find((b) => b.request_id === request.id && ACTIVE.includes(b.status));
  return { ...request, active_booking: active?.id ?? null };
}

export function mockListRequests() {
  return mockRequest(mockPaginate(requests.map(presentRequest), 1, 20));
}

export function mockGetRequest(id) {
  const request = requests.find((r) => String(r.id) === String(id));
  return request
    ? mockRequest(presentRequest(request))
    : mockError(404, 'Not found.', {}, { code: 'not_found' });
}

export function mockCreateRequest(values) {
  const category = byId(categories, Number(values.category));
  const area = byId(areas, Number(values.area));
  const request = makeRequest({
    category: category.slug,
    skillSlugs: skills.filter((s) => (values.skills ?? []).includes(s.id)).map((s) => s.slug),
    area: area.slug,
    description: values.description,
    date: 0,
    slot: values.preferred_slot,
  });
  Object.assign(request, {
    preferred_date: values.preferred_date,
    address_detail: values.address_detail,
  });
  return mockRequest(presentRequest(request));
}

export function mockCancelRequest(id) {
  const request = requests.find((r) => String(r.id) === String(id));
  request.status = 'CANCELLED';
  bookings
    .filter((b) => b.request_id === request.id && ACTIVE.includes(b.status))
    .forEach((b) =>
      Object.assign(b, { status: 'CANCELLED', cancel_reason: 'Request cancelled by customer.' }),
    );
  return mockRequest(presentRequest(request));
}

export function mockCreateBooking({ service_request, worker }) {
  const request = requests.find((r) => r.id === Number(service_request));
  if (bookings.some((b) => b.request_id === request.id && ACTIVE.includes(b.status))) {
    return mockError(
      409,
      'This request already has an active booking or is closed.',
      {},
      { code: 'request_not_open' },
    );
  }
  const booking = makeBooking(request, Number(worker), 'PENDING', []);
  return mockRequest(present(booking, 'CUSTOMER'));
}

export function mockMatches(requestId) {
  const request = requests.find((r) => String(r.id) === String(requestId));
  const asked = bookings.filter((b) => b.request_id === request.id).map((b) => b.worker_id);
  const matches = workers
    .filter((w) => w.availability_status !== 'OFFLINE' && !asked.includes(w.id))
    .filter((w) =>
      w.categories.some(
        (c) => c.id === request.category || c.slug === request.category_detail.slug,
      ),
    )
    .filter((w) => w.service_areas.some((a) => a.id === request.area))
    .map((w) => {
      const exact = w.skills.some((s) => request.skills.includes(s.id));
      const available = w.availability_status === 'AVAILABLE';
      const reasons = [
        {
          code: 'serves_area',
          params: { area: request.area_detail.name_en, area_bn: request.area_detail.name_bn },
        },
        { code: exact ? 'skill_match' : 'category_match', params: {} },
        ...(available ? [{ code: 'available_now', params: {} }] : []),
        ...(w.trust_score >= 75 ? [{ code: 'high_trust', params: { score: w.trust_score } }] : []),
      ];
      const score = (exact ? 30 : 18) + 0.3 * w.trust_score + (available ? 15 : 6) + 7;
      return { ...w, match_score: Math.round(score * 10) / 10, match_reasons: reasons };
    })
    .sort((a, b) => b.match_score - a.match_score);
  return mockRequest(matches);
}

export function mockWorkerDashboard() {
  const mine = visibleTo('WORKER');
  return mockRequest({
    profile: myProfile(),
    pending_requests: mine.filter((b) => b.status === 'PENDING').map((b) => present(b, 'WORKER')),
    today_jobs: mine
      .filter((b) => b.status !== 'PENDING' && SCOPES.today(b))
      .map((b) => present(b, 'WORKER')),
  });
}
