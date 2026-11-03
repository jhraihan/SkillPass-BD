import { areas, categories, skills } from './catalogData';
import { mockError, mockPaginate, mockRequest } from './utils';

const skillBySlug = Object.fromEntries(skills.map((skill) => [skill.slug, skill]));
const areaBySlug = Object.fromEntries(areas.map((area) => [area.slug, area]));

const COMPLETENESS_STEPS = [
  ['skills', 25, (p) => p.skills.length > 0],
  ['areas', 25, (p) => p.service_areas.length > 0],
  ['photo', 20, (p) => Boolean(p.photo)],
  ['experience', 10, (p) => p.years_experience > 0],
  ['bio', 10, (p) => Boolean(p.bio?.trim())],
  ['identity', 10, (p) => p.identity_verified],
];

function categoriesFor(skillList) {
  const slugs = [...new Set(skillList.map((s) => s.category_slug))];
  return slugs.map((slug) => {
    const { name_en, name_bn, icon } = categories.find((c) => c.slug === slug);
    return { slug, name_en, name_bn, icon };
  });
}

function buildWorker(id, name, skillSlugs, areaSlugs, extra = {}) {
  const workerSkills = skillSlugs.map((slug) => {
    const { id: skillId, name_en, name_bn, category_slug } = skillBySlug[slug];
    return { id: skillId, slug, name_en, name_bn, category_slug, evidence_verified: false };
  });
  const worker = {
    id,
    display_name: name,
    photo: null,
    bio: '',
    years_experience: 0,
    availability_status: 'AVAILABLE',
    identity_verified: false,
    trust_score: 0,
    verified_jobs_count: 0,
    completed_jobs_count: 0,
    avg_rating: 0,
    review_count: 0,
    member_since: '2026-03-01T10:00:00Z',
    skills: workerSkills,
    service_areas: areaSlugs.map((slug) => {
      const { id: areaId, name_en, name_bn } = areaBySlug[slug];
      return { id: areaId, slug, name_en, name_bn };
    }),
    ...extra,
  };
  worker.categories = categoriesFor(worker.skills);
  worker.is_new = worker.completed_jobs_count < 3;
  worker.trust = { score: worker.trust_score, breakdown: [] };
  return worker;
}

export const workers = [
  buildWorker(
    2,
    'রহিম উদ্দিন',
    ['ac-servicing', 'ac-gas-refill', 'split-ac-installation'],
    ['mirpur', 'shyamoli'],
    {
      bio: 'এসি সার্ভিসিং ও ইনস্টলেশনে ৯ বছরের অভিজ্ঞতা।',
      years_experience: 9,
      identity_verified: true,
      trust_score: 82,
      verified_jobs_count: 28,
      completed_jobs_count: 31,
      avg_rating: 4.4,
      review_count: 28,
    },
  ),
  buildWorker(
    11,
    'Karim Hossain',
    ['tap-pipe-repair', 'water-pump-repair', 'bathroom-fitting'],
    ['dhanmondi', 'mohammadpur'],
    {
      years_experience: 12,
      identity_verified: true,
      trust_score: 76,
      verified_jobs_count: 19,
      completed_jobs_count: 21,
      avg_rating: 4.6,
      review_count: 17,
      availability_status: 'BUSY',
    },
  ),
  buildWorker(
    12,
    'সালাম মিয়া',
    ['house-wiring', 'switch-socket-repair', 'fan-installation'],
    ['uttara'],
    {
      years_experience: 6,
      trust_score: 71,
      verified_jobs_count: 12,
      completed_jobs_count: 13,
      avg_rating: 4.2,
      review_count: 11,
    },
  ),
  buildWorker(
    13,
    'Jamal Uddin',
    ['interior-painting', 'waterproofing', 'wall-putty'],
    ['badda', 'rampura', 'banasree'],
    {
      years_experience: 15,
      identity_verified: true,
      trust_score: 88,
      verified_jobs_count: 40,
      completed_jobs_count: 42,
      avg_rating: 4.8,
      review_count: 36,
    },
  ),
  buildWorker(
    14,
    'নাসির আহমেদ',
    ['washing-machine-repair', 'refrigerator-repair', 'microwave-repair'],
    ['mirpur', 'farmgate'],
    {
      years_experience: 4,
      trust_score: 58,
      verified_jobs_count: 5,
      completed_jobs_count: 6,
      avg_rating: 3.9,
      review_count: 5,
      availability_status: 'OFFLINE',
    },
  ),
  buildWorker(
    15,
    'Rubina Akter',
    ['home-deep-cleaning', 'kitchen-cleaning', 'bathroom-cleaning'],
    ['gulshan', 'banani'],
    {
      years_experience: 3,
      identity_verified: true,
      trust_score: 69,
      verified_jobs_count: 9,
      completed_jobs_count: 9,
      avg_rating: 4.7,
      review_count: 8,
    },
  ),
  buildWorker(
    16,
    'মোস্তফা কামাল',
    ['furniture-repair', 'door-window-repair', 'lock-installation'],
    ['old-dhaka', 'lalbagh'],
    {
      years_experience: 20,
      trust_score: 73,
      verified_jobs_count: 15,
      completed_jobs_count: 16,
      avg_rating: 4.3,
      review_count: 14,
    },
  ),
  buildWorker(
    17,
    'Shahin Alam',
    ['car-servicing', 'motorcycle-repair', 'battery-replacement'],
    ['tejgaon', 'mohakhali'],
    {
      years_experience: 8,
      trust_score: 64,
      verified_jobs_count: 7,
      completed_jobs_count: 8,
      avg_rating: 4.1,
      review_count: 6,
    },
  ),
  buildWorker(18, 'আরিফ হোসেন', ['ac-servicing', 'refrigerator-repair'], ['khilgaon', 'malibagh'], {
    years_experience: 2,
    trust_score: 35,
    completed_jobs_count: 1,
    avg_rating: 5,
    review_count: 1,
  }),
  buildWorker(
    19,
    'Monir Hasan',
    ['drain-cleaning', 'water-tank-cleaning'],
    ['jatrabari', 'motijheel'],
    {
      years_experience: 5,
      trust_score: 52,
      verified_jobs_count: 4,
      completed_jobs_count: 5,
      avg_rating: 4.0,
      review_count: 4,
    },
  ),
];

const ORDERINGS = {
  '-trust_score': (a, b) => b.trust_score - a.trust_score,
  '-avg_rating': (a, b) => b.avg_rating - a.avg_rating,
  '-verified_jobs_count': (a, b) => b.verified_jobs_count - a.verified_jobs_count,
  '-years_experience': (a, b) => b.years_experience - a.years_experience,
};

export const WORKER_PAGE_SIZE = 20;

export function mockSearchWorkers({
  category,
  skill,
  area,
  min_trust,
  verified,
  available,
  search,
  ordering,
  page = 1,
} = {}) {
  const term = search?.toLowerCase();
  const results = workers
    .filter((w) => !category || w.categories.some((c) => c.slug === category))
    .filter((w) => !skill || w.skills.some((s) => s.slug === skill))
    .filter((w) => !area || w.service_areas.some((a) => a.slug === area))
    .filter((w) => !min_trust || w.trust_score >= Number(min_trust))
    .filter((w) => !verified || w.identity_verified)
    .filter((w) => !available || w.availability_status === 'AVAILABLE')
    .filter(
      (w) =>
        !term ||
        w.display_name.toLowerCase().includes(term) ||
        w.skills.some((s) => `${s.name_en} ${s.name_bn}`.toLowerCase().includes(term)),
    )
    .sort(ORDERINGS[ordering] ?? ORDERINGS['-trust_score']);
  return mockRequest(mockPaginate(results, Number(page), WORKER_PAGE_SIZE));
}

export function mockGetWorker(id) {
  const worker = workers.find((w) => String(w.id) === String(id));
  return worker ? mockRequest(worker) : mockError(404, 'Not found.', {}, { code: 'not_found' });
}

const me = workers[0];

export function myProfile() {
  me.categories = categoriesFor(me.skills);
  const missing = COMPLETENESS_STEPS.filter(([, , done]) => !done(me)).map(([key]) => key);
  const percent = COMPLETENESS_STEPS.filter(([key]) => !missing.includes(key)).reduce(
    (sum, [, weight]) => sum + weight,
    0,
  );
  return {
    ...me,
    completeness: { percent, missing, next_step: missing[0] ?? null },
    is_setup_complete: me.skills.length > 0 && me.service_areas.length > 0,
  };
}

export function mockMyProfile() {
  return mockRequest(myProfile());
}

export function mockUpdateMyProfile(changes) {
  Object.assign(me, changes);
  return mockRequest(myProfile());
}

export function mockSetMySkills(ids) {
  me.skills = skills
    .filter((s) => ids.includes(s.id))
    .map(({ id, slug, name_en, name_bn, category_slug }) => ({
      id,
      slug,
      name_en,
      name_bn,
      category_slug,
      evidence_verified: false,
    }));
  return mockRequest(myProfile());
}

export function mockSetMyAreas(ids) {
  me.service_areas = areas
    .filter((a) => ids.includes(a.id))
    .map(({ id, slug, name_en, name_bn }) => ({ id, slug, name_en, name_bn }));
  return mockRequest(myProfile());
}

export function mockUploadMyPhoto(file) {
  me.photo = URL.createObjectURL(file);
  return mockRequest(myProfile());
}
