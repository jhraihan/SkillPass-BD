# Test plan

SkillPass BD v1.0 — what is tested, how, and what "done" means.

## 1. Scope

All P0 functional requirements in [PRD.md](../PRD.md): authentication, catalog, worker profiles and search, requests, matching and bookings, completion verification, work history, structured reviews, verification, trust score, reports and disputes, notifications, admin dashboard; plus the P1 worker assistance features.

Out of scope: payments, native apps, SMS, AI assistance (P2).

## 2. Test levels

| Level | Tool | Where | Runs |
|---|---|---|---|
| Backend unit + API | pytest, pytest-django | `backend/tests/` | Every push (CI) |
| Query-count (N+1) checks | `CaptureQueriesContext` | `backend/tests/test_query_counts.py` | CI |
| Frontend unit / component | Vitest, Testing Library | `frontend/src/**/*.test.*` | CI |
| Lint / format | ruff, black, ESLint, Prettier | both | CI |
| Manual end-to-end | browser, test script below | staging (Render) | Before release |
| Usability with workers | moderated sessions | [USABILITY.md](USABILITY.md) | Before release |

Exit criteria: CI green, backend coverage ≥ 70 % (currently ~97 %), every manual case below passes, usability goal met.

## 3. How to run

```bash
cd backend && .venv/Scripts/python -m pytest --cov=apps --cov=common
cd frontend && npm run lint && npm test && npm run build
```

For manual tests use a fresh database with `python manage.py seed_demo` (it prints the demo logins).

## 4. Manual end-to-end cases

| ID | Area (PRD) | Steps | Expected |
|---|---|---|---|
| E1 | Auth (FR-01) | Register a worker with PIN `123456` | Refused: PIN too easy |
| E2 | Auth | Sign in with a wrong PIN 10 times | Account locked; admin **Unlock** restores access |
| E3 | Search (FR-05) | Search AC repair in Mirpur, filter *Identity verified* | Only verified AC workers serving Mirpur |
| E4 | Profile (FR-04) | Open a worker profile as a guest | Badges, trust breakdown, verified history, reviews; no phone number |
| E5 | Booking (FR-07/08) | Customer requests a job and books a matched worker | Worker gets beep + green card; booking is New request |
| E6 | Privacy | Before acceptance, worker opens the request | Address and phone hidden; shown after **Accept** |
| E7 | Job flow (FR-10) | Worker: On the way → Start → Work done; customer confirms | Status timeline complete; job counts as verified |
| E8 | Review (FR-13) | Customer reviews the job; tries again | First succeeds; second refused; trust score updates |
| E9 | Dispute (FR-16) | Customer reports a problem on "waiting for confirmation" | Dispute appears in admin queue; admins notified |
| E10 | Resolution | Admin cancels the dispute, fault Worker | Booking cancelled; worker cancellation counted; both notified |
| E11 | Verification (FR-14) | Worker uploads NID; admin approves | Identity badge on profile; trust score rises |
| E12 | Upload safety | Upload a `.exe` renamed to `.jpg` | Refused |
| E13 | Document privacy | Another worker opens the document URL | 404 |
| E14 | Suspension | Admin suspends a worker | Worker signed out; hidden from search |
| E15 | Temporary PIN | Admin issues a new PIN; worker signs in | Forced to choose a new PIN |
| E16 | Onboarding (FR-22) | Admin **Add worker** | Worker account created; temporary PIN shown once |
| E17 | Timeouts | Leave a request 24 h (or call the timeouts job) | Booking expires; customer notified |
| E18 | Notifications (FR-17) | Check bell after E5–E10 | Unread count and correct texts in the user's language |
| E19 | Dashboard (FR-19) | Open `/admin`, switch 7/30/90 days | Numbers and chart change; queues link correctly |
| E20 | Language | Switch বাংলা / English on every area | No missing text keys |
| E21 | PWA | Install on Android; turn on airplane mode | App opens; "ইন্টারনেট নেই" banner shown |
| E22 | Mobile layout | Worker screens at 360 px width | Big buttons, no horizontal scroll, text ≥ 18 px |

## 5. Defects

Log each failure as a GitHub issue with: case ID, steps, expected vs actual, screenshot, browser/phone. Severity: **blocker** (stops a P0 flow), **major**, **minor**. Release only with zero open blockers.

## 6. Results

| Date | Build / commit | Tester | Passed | Failed | Notes |
|---|---|---|---|---|---|
| | | | | | |
