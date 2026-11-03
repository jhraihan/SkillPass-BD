import { TRUST_WEIGHTS } from '@/lib/constants';

const PRIOR = 0.7;
const FAST = 30;
const SLOW = 1440;

function ratio(part, whole) {
  return whole < 3 ? [PRIOR, true] : [part / whole, false];
}

function responseValue(minutes) {
  const clamped = Math.min(Math.max(minutes, FAST), SLOW);
  return 1 - (clamped - FAST) / (SLOW - FAST);
}

export function mockTrust(worker) {
  const cancelled = worker.id % 3 === 0 ? 1 : 0;
  const accepted = worker.completed_jobs_count + cancelled;
  const [completion, completionPrior] = ratio(worker.completed_jobs_count, accepted);
  const [cancellation, cancellationPrior] = ratio(accepted - cancelled, accepted);
  const count = worker.review_count;
  const bayesian = (5 * 3.5 + worker.avg_rating * count) / (5 + count);
  const minutes = 10 + (worker.id % 5) * 40;
  const answered = accepted + (worker.id % 4);
  const factors = {
    completion: [
      completion,
      { finished: worker.completed_jobs_count, accepted, prior: completionPrior || undefined },
    ],
    rating: [(bayesian - 1) / 4, { average: count ? worker.avg_rating : null, count }],
    verified_jobs: [
      Math.min(worker.verified_jobs_count / 20, 1),
      { verified: worker.verified_jobs_count, cap: 20 },
    ],
    cancellation: [cancellation, { cancelled, accepted, prior: cancellationPrior || undefined }],
    response:
      answered < 3
        ? [PRIOR, { answered, prior: true }]
        : [responseValue(minutes), { answered, median_minutes: minutes }],
    identity: [worker.identity_verified ? 1 : 0, { verified: worker.identity_verified }],
    experience: [Math.min(worker.years_experience / 10, 1), { years: worker.years_experience }],
  };
  const breakdown = Object.entries(factors).map(([factor, [value, detail]]) => ({
    factor,
    weight: TRUST_WEIGHTS[factor],
    value: Math.round(value * 1000) / 1000,
    points: Math.round(TRUST_WEIGHTS[factor] * value * 10) / 10,
    detail: JSON.parse(JSON.stringify(detail)),
  }));
  const score = Math.round(breakdown.reduce((sum, item) => sum + item.points, 0));
  return { score, breakdown };
}
