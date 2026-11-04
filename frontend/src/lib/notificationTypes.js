import {
  BadgeCheck,
  Ban,
  BellRing,
  CheckCheck,
  CircleCheckBig,
  Clock,
  FileX2,
  Hourglass,
  Navigation,
  Scale,
  Star,
  TriangleAlert,
  Wrench,
  XCircle,
} from 'lucide-react';

export const NOTIFICATION_STYLE = {
  NEW_JOB: { icon: BellRing, tone: 'green' },
  BOOKING_ACCEPTED: { icon: CircleCheckBig, tone: 'green' },
  BOOKING_DECLINED: { icon: XCircle, tone: 'red' },
  BOOKING_EXPIRED: { icon: Clock, tone: 'red' },
  BOOKING_CANCELLED: { icon: Ban, tone: 'red' },
  WORKER_ON_THE_WAY: { icon: Navigation, tone: 'yellow' },
  JOB_STARTED: { icon: Wrench, tone: 'yellow' },
  CONFIRM_COMPLETION: { icon: Hourglass, tone: 'yellow' },
  JOB_COMPLETED: { icon: CheckCheck, tone: 'blue' },
  JOB_AUTO_CLOSED: { icon: CheckCheck, tone: 'blue' },
  BOOKING_DISPUTED: { icon: TriangleAlert, tone: 'red' },
  DISPUTE_RESOLVED: { icon: Scale, tone: 'blue' },
  REVIEW_RECEIVED: { icon: Star, tone: 'yellow' },
  VERIFICATION_APPROVED: { icon: BadgeCheck, tone: 'green' },
  VERIFICATION_REJECTED: { icon: FileX2, tone: 'red' },
};

export function notificationLink(notification, role) {
  const { type, data = {} } = notification;
  if (role === 'ADMIN') return type === 'BOOKING_DISPUTED' ? '/admin/reports' : null;
  if (role === 'WORKER') {
    if (type === 'NEW_JOB') return `/worker/requests/${data.booking_id}`;
    if (type === 'REVIEW_RECEIVED') return '/worker/reviews';
    if (type.startsWith('VERIFICATION_')) return '/worker/verification';
    return data.booking_id ? `/worker/jobs/${data.booking_id}` : null;
  }
  return data.booking_id ? `/customer/bookings/${data.booking_id}` : null;
}

export function notificationParams(data = {}, lang = 'bn') {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value && typeof value === 'object'
        ? (lang === 'bn' ? value.name_bn : value.name_en) || value.name_en || ''
        : value,
    ]),
  );
}
