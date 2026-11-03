import { mockReviewBooking } from './bookings';
import { categories } from './catalogData';
import { mockUsers } from './users';
import { mockError, mockPaginate, mockRequest } from './utils';
import { myProfile, workers } from './workers';

export const REVIEW_PAGE_SIZE = 20;

const CUSTOMERS = ['Nusrat J.', 'Tanvir A.', 'সাবরিনা হ.', 'Imran K.', 'ফারহানা র.', 'Sakib H.'];
const COMMENTS = [
  'Came on time and fixed the problem quickly.',
  'খুব ভালো কাজ করেছেন, আবার ডাকবো।',
  'Explained the issue clearly before starting.',
  '',
  'Clean work, fair price.',
  'একটু দেরি হয়েছিল, কিন্তু কাজ ভালো।',
];
const LIMIT = 12;

function daysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function categoryBrief(slug) {
  const { id, name_en, name_bn, icon } = categories.find((c) => c.slug === slug);
  return { id, slug, name_en, name_bn, icon };
}

function seedHistory(worker) {
  return Array.from({ length: Math.min(worker.verified_jobs_count, LIMIT) }, (_, index) => {
    const skill = worker.skills[index % worker.skills.length];
    const area = worker.service_areas[index % worker.service_areas.length];
    const reviewed = index < Math.min(worker.review_count, LIMIT);
    const raw = Math.max(3, Math.min(5, worker.avg_rating + ((index % 3) - 1) * 0.5));
    const overall = Math.round(raw * 4) / 4;
    return {
      id: worker.id * 1000 + index,
      category: categoryBrief(skill.category_slug),
      skills: [{ id: skill.id, slug: skill.slug, name_en: skill.name_en, name_bn: skill.name_bn }],
      area,
      closed_at: daysAgo(3 + index * 6),
      customer_name: CUSTOMERS[index % CUSTOMERS.length],
      review: reviewed
        ? {
            overall,
            would_hire_again: overall >= 4,
            comment: COMMENTS[index % COMMENTS.length],
          }
        : null,
    };
  });
}

function seedReviews(worker, history) {
  return history
    .filter((job) => job.review)
    .map((job) => {
      const total = Math.round(job.review.overall * 4);
      const base = Math.floor(total / 4);
      const extra = (position) => (position < total % 4 ? 1 : 0);
      return {
        id: job.id,
        booking: job.id,
        customer_name: job.customer_name,
        category: job.category,
        quality: base + extra(0),
        professionalism: base + extra(1),
        punctuality: base + extra(2),
        communication: base + extra(3),
        overall: job.review.overall,
        would_hire_again: job.review.would_hire_again,
        comment: job.review.comment,
        created_at: job.closed_at,
      };
    });
}

const store = new Map(
  workers.map((worker) => {
    const history = seedHistory(worker);
    return [worker.id, { history, reviews: seedReviews(worker, history) }];
  }),
);

function entryFor(workerId) {
  return store.get(Number(workerId));
}

function page(items, pageNumber) {
  return mockRequest(mockPaginate(items, Number(pageNumber) || 1, REVIEW_PAGE_SIZE));
}

export function mockWorkerReviews(workerId, pageNumber) {
  const entry = entryFor(workerId);
  return entry ? page(entry.reviews, pageNumber) : mockError(404, 'Not found.');
}

export function mockWorkHistory(workerId, pageNumber) {
  const entry = entryFor(workerId);
  return entry ? page(entry.history, pageNumber) : mockError(404, 'Not found.');
}

export function mockMyReviews(pageNumber) {
  return mockWorkerReviews(myProfile().id, pageNumber);
}

export function mockMyWorkHistory(pageNumber) {
  return mockWorkHistory(myProfile().id, pageNumber);
}

export function mockCreateReview({ booking: bookingId, comment = '', ...ratings }) {
  const result = mockReviewBooking(bookingId);
  if (result.error) return result.error;
  const values = ['quality', 'professionalism', 'punctuality', 'communication'].map(
    (key) => ratings[key],
  );
  const overall = Math.round((values.reduce((sum, n) => sum + n, 0) / values.length) * 100) / 100;
  const [first, last] = [
    mockUsers.CUSTOMER.full_name.split(' ')[0],
    mockUsers.CUSTOMER.full_name.split(' ').at(-1),
  ];
  const review = {
    id: Date.now(),
    booking: result.booking.id,
    customer_name: `${first} ${last[0]}.`,
    category: result.category,
    ...ratings,
    overall,
    comment,
    created_at: new Date().toISOString(),
  };
  entryFor(result.workerId)?.reviews.unshift(review);
  return mockRequest(review);
}

export function mockReviewById(id) {
  for (const [workerId, entry] of store) {
    const review = entry.reviews.find((r) => String(r.id) === String(id));
    if (review) return { review, workerId };
  }
  return null;
}

export function mockModerateReview(id, action) {
  const found = mockReviewById(id);
  if (!found) return;
  const entry = store.get(found.workerId);
  entry.reviews = entry.reviews.filter((r) => r !== found.review);
  found.review[action === 'HIDE' ? 'is_hidden' : 'is_invalid'] = true;
}
