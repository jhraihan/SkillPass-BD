import { mockTrust } from './trust';
import { mockError, mockFind, mockPaginate, mockRequest } from './utils';
import { myProfile, workers } from './workers';

const PDF_TEXT = [
  '%PDF-1.4',
  '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
  '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
  '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 420 300]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj',
  '4 0 obj<</Length 74>>stream',
  'BT /F1 22 Tf 40 200 Td (Training Certificate) Tj 0 -40 Td (Sample document) Tj ET',
  'endstream endobj',
  '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj',
  'trailer<</Root 1 0 R>>',
  '%%EOF',
].join('\n');

function cardSvg(title, name, tone) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
<rect width="640" height="400" rx="24" fill="${tone}"/>
<rect x="32" y="96" width="150" height="190" rx="12" fill="#ffffff" opacity="0.85"/>
<circle cx="107" cy="160" r="38" fill="#cbd5e1"/>
<rect x="62" y="210" width="90" height="56" rx="20" fill="#cbd5e1"/>
<text x="32" y="60" font-family="sans-serif" font-size="30" font-weight="700" fill="#ffffff">${title}</text>
<text x="210" y="140" font-family="sans-serif" font-size="26" fill="#ffffff">${name}</text>
<text x="210" y="190" font-family="sans-serif" font-size="20" fill="#e2e8f0">ID 19XX XXXX XXXX</text>
<text x="210" y="230" font-family="sans-serif" font-size="20" fill="#e2e8f0">Sample document</text>
</svg>`;
}

const blobs = new Map();
let nextId = 500;

function addDocument(name, contentType, blob) {
  const id = (nextId += 1);
  blobs.set(id, blob);
  return { id, original_name: name, content_type: contentType, size: blob.size };
}

function svgDocument(name, title, worker, tone) {
  const blob = new Blob([cardSvg(title, worker.display_name, tone)], { type: 'image/svg+xml' });
  return addDocument(name, 'image/jpeg', blob);
}

function pdfDocument(name) {
  return addDocument(name, 'application/pdf', new Blob([PDF_TEXT], { type: 'application/pdf' }));
}

function workerById(id) {
  return workers.find((worker) => worker.id === id);
}

function skillBrief(worker, slug) {
  const { id, name_en, name_bn } = worker.skills.find((skill) => skill.slug === slug);
  return { id, slug, name_en, name_bn };
}

function daysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function make(workerId, type, status, documents, extra = {}) {
  return {
    id: (nextId += 1),
    worker_id: workerId,
    type,
    skill: null,
    status,
    rejection_reason: '',
    created_at: daysAgo(extra.age ?? 1),
    reviewed_at: status === 'PENDING' ? null : daysAgo((extra.age ?? 1) - 0.5),
    reviewed_by: status === 'PENDING' ? null : 'Admin One',
    documents,
    ...extra,
  };
}

const salam = workerById(12);
const nasir = workerById(14);
const shahin = workerById(17);
const rahim = workerById(2);

const verifications = [
  make(2, 'IDENTITY', 'APPROVED', [svgDocument('nid-front.jpg', 'NID (front)', rahim, '#0f766e')], {
    age: 40,
  }),
  make(2, 'SKILL_EVIDENCE', 'REJECTED', [pdfDocument('ac-training.pdf')], {
    age: 6,
    skill: skillBrief(rahim, 'split-ac-installation'),
    rejection_reason: 'The certificate is hard to read. Please send a clearer photo.',
  }),
  make(
    12,
    'IDENTITY',
    'PENDING',
    [
      svgDocument('nid-front.jpg', 'NID (front)', salam, '#1e3a8a'),
      svgDocument('nid-back.jpg', 'NID (back)', salam, '#334155'),
    ],
    { age: 3 },
  ),
  make(17, 'SKILL_EVIDENCE', 'PENDING', [pdfDocument('workshop-certificate.pdf')], {
    age: 2,
    skill: skillBrief(shahin, 'car-servicing'),
  }),
  make(14, 'IDENTITY', 'PENDING', [svgDocument('nid.jpg', 'NID (front)', nasir, '#7c2d12')], {
    age: 1,
  }),
];

function present(verification, viewerRole) {
  const { worker_id: workerId, reviewed_by: reviewedBy, ...rest } = verification;
  if (viewerRole !== 'ADMIN') return rest;
  const worker = workerById(workerId);
  return {
    ...rest,
    reviewed_by: reviewedBy,
    worker: {
      id: worker.id,
      display_name: worker.display_name,
      full_name: worker.display_name,
      phone: `+8801${String(700000000 + worker.id * 1234567).slice(0, 9)}`,
      photo: worker.photo,
      identity_verified: worker.identity_verified,
      member_since: worker.member_since,
    },
  };
}

function visibleTo(viewerRole) {
  if (viewerRole === 'ADMIN') {
    return [...verifications].sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  return verifications
    .filter((v) => v.worker_id === myProfile().id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function mockListVerifications({ status, type, page = 1 } = {}, viewerRole) {
  const items = visibleTo(viewerRole)
    .filter((v) => !status || v.status === status)
    .filter((v) => !type || v.type === type)
    .map((v) => present(v, viewerRole));
  return mockRequest(mockPaginate(items, Number(page), 20));
}

export function mockGetVerification(id, viewerRole) {
  return mockFind(
    visibleTo(viewerRole).map((v) => present(v, viewerRole)),
    id,
  );
}

function conflict(detail, code) {
  return mockError(409, detail, {}, { code });
}

export function mockSubmitVerification({ type, skill, files = [] }) {
  const me = myProfile();
  const link = skill ? me.skills.find((s) => s.id === Number(skill)) : null;
  if (type === 'SKILL_EVIDENCE' && !link) {
    return mockError(400, 'Invalid input.', { skill: ['Choose the skill this evidence is for.'] });
  }
  if (!files.length) {
    return mockError(400, 'Invalid input.', { files: ['Add at least one photo or PDF.'] });
  }
  if (type === 'IDENTITY' && me.identity_verified) {
    return conflict('Your identity is already verified.', 'already_verified');
  }
  if (link?.evidence_verified)
    return conflict('This skill is already checked.', 'already_verified');
  const pending = verifications.some(
    (v) =>
      v.worker_id === me.id &&
      v.type === type &&
      v.status === 'PENDING' &&
      (v.skill?.id ?? null) === (link?.id ?? null),
  );
  if (pending)
    return conflict('You already sent this. Please wait for the review.', 'already_pending');
  const verification = make(
    me.id,
    type,
    'PENDING',
    files.map((file) => addDocument(file.name, file.type || 'image/jpeg', file)),
    { age: 0, skill: link ? skillBrief(me, link.slug) : null },
  );
  verifications.push(verification);
  return mockRequest(present(verification, 'WORKER'));
}

function applyApproval(verification) {
  const worker = workerById(verification.worker_id);
  if (verification.type === 'IDENTITY') {
    worker.identity_verified = true;
    worker.trust = mockTrust(worker);
    worker.trust_score = worker.trust.score;
  } else {
    const skill = worker.skills.find((s) => s.id === verification.skill?.id);
    if (skill) skill.evidence_verified = true;
  }
}

export function mockDecideVerification({ id, decision, reason = '' }) {
  const verification = verifications.find((v) => String(v.id) === String(id));
  if (!verification) return mockError(404, 'Not found.', {}, { code: 'not_found' });
  if (verification.status !== 'PENDING') {
    return conflict('This request was already decided.', 'already_decided');
  }
  if (decision === 'reject' && !reason.trim()) {
    return mockError(400, 'Invalid input.', { reason: ['This field may not be blank.'] });
  }
  Object.assign(verification, {
    status: decision === 'approve' ? 'APPROVED' : 'REJECTED',
    rejection_reason: decision === 'reject' ? reason.trim() : '',
    reviewed_at: new Date().toISOString(),
    reviewed_by: 'Admin One',
  });
  if (decision === 'approve') applyApproval(verification);
  return mockRequest(present(verification, 'ADMIN'));
}

export function mockDocument(id) {
  const blob = blobs.get(Number(id));
  if (!blob) return mockError(404, 'Not found.', {}, { code: 'not_found' });
  return new Promise((resolve) => setTimeout(() => resolve(blob), 250));
}
