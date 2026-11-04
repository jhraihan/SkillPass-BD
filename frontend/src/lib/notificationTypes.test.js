import { describe, expect, it } from 'vitest';
import { notificationLink, notificationParams } from './notificationTypes';

describe('notificationLink', () => {
  it('sends each role to the right screen', () => {
    const job = { type: 'NEW_JOB', data: { booking_id: 7 } };
    const update = { type: 'WORKER_ON_THE_WAY', data: { booking_id: 7 } };

    expect(notificationLink(job, 'WORKER')).toBe('/worker/requests/7');
    expect(notificationLink(update, 'CUSTOMER')).toBe('/customer/bookings/7');
    expect(notificationLink({ type: 'VERIFICATION_REJECTED', data: {} }, 'WORKER')).toBe(
      '/worker/verification',
    );
    expect(notificationLink({ type: 'BOOKING_DISPUTED', data: {} }, 'ADMIN')).toBe(
      '/admin/reports',
    );
  });
});

describe('notificationParams', () => {
  it('picks the name in the current language', () => {
    const data = { category: { name_en: 'Plumbing', name_bn: 'প্লাম্বিং' }, stars: '4.5' };

    expect(notificationParams(data, 'bn')).toEqual({ category: 'প্লাম্বিং', stars: '4.5' });
    expect(notificationParams(data, 'en').category).toBe('Plumbing');
  });
});
