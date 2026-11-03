import { DISPUTED_MOCK_BOOKING_ID, mockAdminBooking, mockSetBookingOutcome } from './bookings';
import { mockAdminSetSuspended, mockUserIdForWorker } from './adminUsers';
import { mockModerateReview, mockReviewById } from './reviews';
import { mockUsers } from './users';
import { mockError, mockPaginate, mockRequest } from './utils';
import { myProfile, workers } from './workers';

const OPEN = ['OPEN', 'IN_REVIEW'];
let nextId = 700;

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 3600000).toISOString();
}

function person(user) {
  return { id: user.id, name: user.full_name, phone: user.phone, role: user.role };
}

function make(reporterRole, targetType, targetId, reason, extra = {}) {
  return {
    id: (nextId += 1),
    reporter: person(mockUsers[reporterRole]),
    target_type: targetType,
    target_id: targetId,
    reason,
    description: '',
    is_dispute: false,
    status: 'OPEN',
    resolution_note: '',
    fault: '',
    assigned_admin: null,
    created_at: hoursAgo(extra.hours ?? 5),
    resolved_at: null,
    ...extra,
  };
}

const firstReview = mockReviewById(13000);

const reports = [
  make('CUSTOMER', 'BOOKING', DISPUTED_MOCK_BOOKING_ID, 'POOR_WORK', {
    is_dispute: true,
    description: 'The pump stopped again after one hour.',
    hours: 20,
  }),
  make('CUSTOMER', 'WORKER', 18, 'FAKE_PROFILE', {
    description: 'The profile photo looks copied from the internet.',
    hours: 9,
  }),
  make('WORKER', 'REVIEW', firstReview?.review.id ?? 13000, 'INAPPROPRIATE', {
    description: 'This customer used rude words.',
    hours: 3,
  }),
  make('CUSTOMER', 'WORKER', 17, 'OVERCHARGING', {
    status: 'DISMISSED',
    resolution_note: 'Price was agreed before the job.',
    resolved_at: hoursAgo(30),
    assigned_admin: 'Admin One',
    hours: 48,
  }),
];

function workerSummary(worker) {
  const userId = mockUserIdForWorker(worker.id);
  return {
    id: worker.id,
    display_name: worker.display_name,
    trust_score: worker.trust_score,
    user: {
      id: userId,
      name: worker.display_name,
      phone: `+8801${String(700000000 + worker.id * 1234567).slice(0, 9)}`,
      role: 'WORKER',
      is_suspended: Boolean(worker.is_suspended),
    },
  };
}

function targetOf(report) {
  if (report.target_type === 'BOOKING') {
    const booking = mockAdminBooking(report.target_id);
    if (!booking) return null;
    const worker = workers.find((w) => w.id === booking.worker.id);
    return { ...booking, worker: workerSummary(worker) };
  }
  if (report.target_type === 'WORKER') {
    const worker = workers.find((w) => w.id === report.target_id);
    return worker ? workerSummary(worker) : null;
  }
  const found = mockReviewById(report.target_id);
  if (!found) return null;
  return {
    ...found.review,
    is_hidden: Boolean(found.review.is_hidden),
    is_invalid: Boolean(found.review.is_invalid),
    author: { ...person(mockUsers.CUSTOMER), is_suspended: false },
    worker: workerSummary(workers.find((w) => w.id === found.workerId)),
  };
}

function present(report, viewerRole) {
  const { reporter, assigned_admin: assigned, ...rest } = report;
  if (viewerRole !== 'ADMIN') return rest;
  return { ...rest, reporter, assigned_admin: assigned, target: targetOf(report) };
}

function visibleTo(viewerRole) {
  if (viewerRole === 'ADMIN') return reports;
  const me = viewerRole === 'WORKER' ? myProfile().display_name : mockUsers.CUSTOMER.full_name;
  return reports
    .filter((r) => r.reporter.name === me)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function mockListReports({ status, target_type: type, dispute, page = 1 } = {}, role) {
  const items = visibleTo(role)
    .filter((r) => !status || r.status === status)
    .filter((r) => !type || r.target_type === type)
    .filter((r) => dispute === undefined || String(r.is_dispute) === String(dispute))
    .map((r) => present(r, role));
  return mockRequest(mockPaginate(items, Number(page), 20));
}

export function mockGetReport(id, role) {
  const report = visibleTo(role).find((r) => String(r.id) === String(id));
  return report ? mockRequest(present(report, role)) : mockError(404, 'Not found.');
}

export function mockCreateReport(
  { target_type: type, target_id: id, reason, description = '' },
  role,
) {
  const reporter = person(role === 'WORKER' ? mockUsers.WORKER : mockUsers.CUSTOMER);
  const duplicate = reports.some(
    (r) =>
      r.reporter.name === reporter.name &&
      r.target_type === type &&
      String(r.target_id) === String(id) &&
      OPEN.includes(r.status),
  );
  if (duplicate) {
    return mockError(409, 'You already reported this.', {}, { code: 'already_reported' });
  }
  const report = {
    ...make('CUSTOMER', type, Number(id), reason, { description, hours: 0 }),
    reporter,
  };
  reports.push(report);
  return mockRequest(present(report, role));
}

function findOpen(id) {
  const report = reports.find((r) => String(r.id) === String(id));
  if (!report) return { error: mockError(404, 'Not found.') };
  if (!OPEN.includes(report.status)) {
    return {
      error: mockError(409, 'This report is already closed.', {}, { code: 'already_decided' }),
    };
  }
  return { report };
}

export function mockTakeReport(id) {
  const { report, error } = findOpen(id);
  if (error) return error;
  Object.assign(report, { status: 'IN_REVIEW', assigned_admin: 'Admin One' });
  return mockRequest(present(report, 'ADMIN'));
}

function subjectUserId(report, target, fault) {
  if (report.target_type === 'WORKER') return target.user.id;
  if (report.target_type === 'REVIEW') return target.author.id;
  return { WORKER: target.worker.user.id, CUSTOMER: target.customer.id }[fault] ?? null;
}

export function mockResolveReport({ id, ...data }) {
  const { report, error } = findOpen(id);
  if (error) return error;
  const target = targetOf(report);
  const disputed = report.target_type === 'BOOKING' && target?.status === 'DISPUTED';
  if (data.status !== 'DISMISSED' && disputed && !data.booking_outcome) {
    return mockError(400, 'Invalid input.', { booking_outcome: ['Choose how this job ends.'] });
  }
  if (data.booking_outcome)
    mockSetBookingOutcome(target.id, data.booking_outcome, data.resolution_note);
  if (data.review_action) mockModerateReview(target.id, data.review_action);
  if (data.suspend) mockAdminSetSuspended(subjectUserId(report, target, data.fault), true);
  Object.assign(report, {
    status: data.status ?? 'RESOLVED',
    resolution_note: data.resolution_note,
    fault: data.fault ?? '',
    assigned_admin: report.assigned_admin ?? 'Admin One',
    resolved_at: new Date().toISOString(),
  });
  return mockRequest(present(report, 'ADMIN'));
}
