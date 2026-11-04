import { mockRequest } from './utils';

const STATUSES = [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'AWAITING_CONFIRMATION',
  'COMPLETED',
  'AUTO_CLOSED',
  'CANCELLED',
  'DISPUTED',
];

const CATEGORIES = [
  {
    slug: 'ac-repair',
    name_en: 'AC Repair',
    name_bn: 'এসি মেরামত',
    icon: 'snowflake',
    share: 0.31,
  },
  { slug: 'electrical', name_en: 'Electrical', name_bn: 'ইলেকট্রিক', icon: 'zap', share: 0.24 },
  { slug: 'plumbing', name_en: 'Plumbing', name_bn: 'প্লাম্বিং', icon: 'droplets', share: 0.19 },
  {
    slug: 'appliance-repair',
    name_en: 'Appliance Repair',
    name_bn: 'যন্ত্রপাতি মেরামত',
    icon: 'washing-machine',
    share: 0.14,
  },
  {
    slug: 'painting',
    name_en: 'Painting',
    name_bn: 'রং মিস্ত্রি',
    icon: 'paint-roller',
    share: 0.12,
  },
];

function isoDay(offset) {
  const day = new Date();
  day.setDate(day.getDate() - offset);
  return day.toLocaleDateString('en-CA');
}

function daily(days) {
  return Array.from({ length: days }, (_, index) => {
    const offset = days - 1 - index;
    const wave = Math.round(6 + 4 * Math.sin(index / 2.3) + (index % 5));
    return {
      date: isoDay(offset),
      requested: wave,
      completed: Math.max(0, wave - 2 - (index % 3)),
    };
  });
}

export function mockAdminStats(days = 30) {
  const series = daily(days);
  const total = series.reduce((sum, day) => sum + day.requested, 0);
  const completed = series.reduce((sum, day) => sum + day.completed, 0);
  const weights = {
    COMPLETED: 0.62,
    AUTO_CLOSED: 0.06,
    CANCELLED: 0.1,
    DECLINED: 0.05,
    EXPIRED: 0.03,
  };
  const byStatus = Object.fromEntries(
    STATUSES.map((status) => [status, Math.round(total * (weights[status] ?? 0.02))]),
  );
  return mockRequest({
    period_days: days,
    generated_at: new Date().toISOString(),
    users: {
      by_role: { CUSTOMER: 412, WORKER: 138, CONTRACTOR: 0, ADMIN: 3 },
      new: Math.round(days * 2.4),
      suspended: 4,
    },
    workers: { total: 138, active: 104, available_now: 37, identity_verified: 71 },
    bookings: {
      total,
      by_status: byStatus,
      completion_rate: 0.86,
      verified_jobs: Math.round(completed * 0.9),
      daily: series,
    },
    queues: { pending_verifications: 3, open_reports: 2, open_disputes: 1 },
    reviews: { count: Math.round(completed * 0.7), average: 4.4 },
    top_categories: CATEGORIES.map(({ share, ...category }) => ({
      ...category,
      bookings: Math.round(total * share),
      completed: Math.round(completed * share),
    })),
  });
}
