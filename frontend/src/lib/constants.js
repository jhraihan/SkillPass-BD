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
