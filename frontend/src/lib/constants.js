export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  WORKER: 'WORKER',
  CONTRACTOR: 'CONTRACTOR',
  ADMIN: 'ADMIN',
};

export const ROLE_HOME = {
  CUSTOMER: '/customer',
  WORKER: '/worker',
  ADMIN: '/admin',
};

export function homePathForRole(role) {
  return ROLE_HOME[role] ?? '/';
}

export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
  ON_THE_WAY: 'ON_THE_WAY',
  IN_PROGRESS: 'IN_PROGRESS',
  AWAITING_CONFIRMATION: 'AWAITING_CONFIRMATION',
  COMPLETED: 'COMPLETED',
  AUTO_CLOSED: 'AUTO_CLOSED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
};

export const ACTIVE_BOOKING_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'AWAITING_CONFIRMATION',
  'DISPUTED',
];

export const TIME_SLOTS = ['MORNING', 'AFTERNOON', 'EVENING'];

export function mapsUrl(...parts) {
  const query = parts.filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const TRUST_WEIGHTS = {
  completion: 25,
  rating: 20,
  verified_jobs: 15,
  cancellation: 15,
  response: 10,
  identity: 10,
  experience: 5,
};

export const TRUST_FACTORS = Object.keys(TRUST_WEIGHTS);

export const RATING_DIMENSIONS = ['quality', 'professionalism', 'punctuality', 'communication'];

export const REVIEWABLE_STATUSES = ['COMPLETED', 'AUTO_CLOSED'];

export const VERIFICATION_TYPES = ['IDENTITY', 'SKILL_EVIDENCE'];

export const VERIFICATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

export const DOCUMENT_RULES = {
  accept: 'image/jpeg,image/png,application/pdf',
  types: ['image/jpeg', 'image/png', 'application/pdf'],
  maxSizeMB: 5,
  maxFiles: 5,
};

export const REPORT_REASONS = [
  'NO_SHOW',
  'POOR_WORK',
  'OVERCHARGING',
  'MISCONDUCT',
  'FAKE_PROFILE',
  'INAPPROPRIATE',
  'OTHER',
];

export const REPORT_REASONS_BY_TARGET = {
  WORKER: ['FAKE_PROFILE', 'MISCONDUCT', 'OVERCHARGING', 'NO_SHOW', 'OTHER'],
  REVIEW: ['INAPPROPRIATE', 'FAKE_PROFILE', 'OTHER'],
  BOOKING: ['NO_SHOW', 'POOR_WORK', 'OVERCHARGING', 'MISCONDUCT', 'OTHER'],
};

export const REPORT_TARGETS = ['BOOKING', 'WORKER', 'REVIEW'];

export const REPORT_STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'];

export const OPEN_REPORT_STATUSES = ['OPEN', 'IN_REVIEW'];

export const FAULTS = ['WORKER', 'CUSTOMER', 'NONE'];

export const DISPUTE_OUTCOMES = ['COMPLETED', 'CANCELLED'];

export const REVIEW_ACTIONS = ['HIDE', 'INVALIDATE'];

export const USER_STATES = ['active', 'suspended', 'locked'];

export const STATS_PERIODS = [7, 30, 90];

export const CHART_COLORS = {
  requested: '#2a78d6',
  completed: '#eb6834',
  grid: '#e5e7eb',
  axis: '#6b7280',
};
