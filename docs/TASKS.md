# SkillPass BD — Task List

Work is delivered **part by part** (PRD §17). Each part: the lead builds backend + hooks + member pages in the master copy, pushes the lead files with `sync_lead.py`, then sends each member a zip from `make_zips.py --part <key>`.

- **Lead** tasks are listed per part.
- **Member** files are generated from `scripts/ownership.json` (source of truth). Translation files (`i18n/*/<area>.json`) ship with every zip of their owner.
- Tick a box when its PR is merged into `main`.

| Member | Area |
|---|---|
| M2 | Public & Auth |
| M3 | Customer |
| M4 | Worker |
| M5 | Admin & Verification |

## Part 1 — Foundation  (`foundation`)

**Lead**

- [x] Backend scaffold: settings (base/dev/test/prod), 10 apps wired, `common` (base model, permissions, pagination, error format), health endpoint, Swagger
- [x] Custom `accounts.User` (phone login, roles, PIN fields) + initial migration, phone normalizer, tests (25 passing)
- [x] Frontend scaffold: Vite + React 19, Tailwind 4 theme, router with every route pre-wired, guards, layouts (public/customer/worker/admin)
- [x] UI kit (`components/ui`), `StatusTag`, `StarRating`, API client with JWT refresh, AuthProvider, i18n (bn/en), mock layer, example pages + tests
- [x] Scripts: `ownership.json`, `init_stubs.py`, `sync_lead.py`, `make_zips.py`; placeholders for all 71 member files
- [x] Repo files: README, CONTRIBUTING, CONTRIBUTORS, `.gitignore`, CI workflow, PR/issue templates
- [x] Create `backend/.env`, create database `skillpass`, run `migrate` and `pytest` on PostgreSQL
- [ ] Create GitHub repo, clone to `skillpass-bd-repo`, run `sync_lead.py`, first push
- [ ] Protect `main` (PR + 1 approval + CI), invite M2–M5

**Members (M2–M5)**

- [ ] Install Git, GitHub Desktop, Node.js 24 LTS, VS Code; accept repo invite; clone; `npm install` + `npm run dev`
- [ ] Practice PR: add yourself to `CONTRIBUTORS.md`

## Part 2 — Auth  (`auth`)

**Lead**

- [x] Django admin for `User`; `CustomerProfile` model
- [x] Register: customer password / worker 6-digit PIN with weak-PIN blocklist
- [x] Login with throttling, failed-attempt counter and 24 h lockout; worker 30-day refresh token
- [x] Refresh, logout (blacklist), `me` GET/PATCH, change password/PIN, forced change after reset
- [x] Admin creates users via Django admin / `createsuperuser`; tests for every auth rule (74 backend tests)
- [x] Hooks + mocks: `useLogin`, `useRegister`, `useChangeCredential`, `useUpdateMe`; `signOut` calls the logout API

**M2 — Public & Auth** · zip `M2-auth.zip` · branch `m2/auth`

- [ ] `LoginPage.jsx` — `/login`
- [ ] `RegisterPage.jsx` — `/register`
- [ ] `SetPinPage.jsx` — `/set-pin`
- [ ] `AboutPage.jsx` — `/about`
- [ ] `NotFoundPage.jsx` — `/any-unknown-page`
- [ ] `Navbar.jsx`
- [ ] `Footer.jsx`

## Part 3 — Catalog  (`catalog`)

**Lead**

- [x] Models: Division, District, Area, ServiceCategory, Skill (bn/en names, slugs)
- [x] Seed migration: 20 Dhaka areas, 8 categories, 40 skills (bn + en)
- [x] Read endpoints + admin CRUD (409 when in use); Django admin; tests (90 backend tests total)
- [x] Hooks + mocks: `useCategories`, `useSkills`, `useAreas`, `useDistricts`, `useSaveCatalogItem`, `useDeleteCatalogItem`

**M5 — Admin & Verification** · zip `M5-catalog.zip` · branch `m5/catalog`

- [ ] `CatalogPage.jsx` — `/admin/catalog`
- [ ] `CatalogForm.jsx`

## Part 4 — Worker profiles & search  (`profiles`)

**Lead**

- [x] Models: WorkerProfile (counters), WorkerSkill, WorkerServiceArea
- [x] Worker `me` profile, photo upload, availability, replace skills / areas, completeness %
- [x] Public profile serializer (badges, hidden phone), search filters + ordering, worker dashboard endpoint; tests
- [x] Domain components: `WorkerCard`, `TrustScorePill`, `AvailabilityDot`, `CategoryIcon`; hooks + mocks for search, profile, skills, areas, photo, dashboard

**M2 — Public & Auth** · zip `M2-profiles.zip` · branch `m2/profiles`

- [ ] `LandingPage.jsx` — `/`
- [ ] `WorkerSearchPage.jsx` — `/workers`
- [ ] `WorkerProfilePage.jsx` — `/workers/1`
- [ ] `HeroSearch.jsx`
- [ ] `CategoryTiles.jsx`
- [ ] `SearchFilters.jsx`
- [ ] `ProfileHeader.jsx`

**M4 — Worker** · zip `M4-profiles.zip` · branch `m4/profiles`

- [ ] `WorkerHomePage.jsx` — `/worker`
- [ ] `ProfileWizardPage.jsx` — `/worker/setup`
- [ ] `EditProfilePage.jsx` — `/worker/profile`
- [ ] `AvailabilityToggle.jsx`
- [ ] `WizardStep.jsx`
- [ ] `CompletenessBar.jsx`
- [ ] `TrustScoreCard.jsx`

## Part 5 — Bookings  (`bookings`)

**Lead**

- [x] Models: ServiceRequest, Booking (one active per request), BookingStatusHistory
- [x] Matching service with reasons; `transition()` service with row locks and history
- [x] Action endpoints (accept, decline, on-the-way, start, mark-complete, confirm, cancel, dispute); contact/address privacy
- [x] `process_booking_timeouts` command (24 h expire, 72 h auto-close); tests for every transition
- [x] Domain `StatusTimeline`, ui `ReasonDialog`; hooks + mocks for requests, matches, bookings, actions; worker dashboard lists requests and today's jobs (139 backend tests)

**M3 — Customer** · zip `M3-bookings.zip` · branch `m3/bookings`

- [ ] `CustomerDashboardPage.jsx` — `/customer`
- [ ] `NewRequestPage.jsx` — `/customer/requests/new`
- [ ] `MatchResultsPage.jsx` — `/customer/requests/1/matches`
- [ ] `MyBookingsPage.jsx` — `/customer/bookings`
- [ ] `BookingDetailPage.jsx` — `/customer/bookings/1`
- [ ] `BookingActions.jsx`
- [ ] `CancelDisputeModal.jsx`
- [ ] `RequestSummaryCard.jsx`

**M4 — Worker** · zip `M4-bookings.zip` · branch `m4/bookings`

- [ ] `MyJobsPage.jsx` — `/worker/jobs`
- [ ] `JobRequestPage.jsx` — `/worker/requests/1`
- [ ] `ActiveJobPage.jsx` — `/worker/jobs/1`
- [ ] `BigActionButton.jsx`
- [ ] `JobCard.jsx`

## Part 6 — Reviews & trust  (`reviews`)

**Lead**

- [x] Review model + eligibility rules; worker reviews list; verified work history endpoint
- [x] Trust score service (7 factors, Bayesian rating, cold start), history, recalculation triggers + command; tests
- [x] Domain components `ReviewCard`, `TrustBreakdown`, `WorkHistoryCard`; hooks + mocks

**M2 — Public & Auth** · zip `M2-reviews.zip` · branch `m2/reviews`

- [x] `TrustExplainerPage.jsx` — `/trust-score`
- [x] `ReviewsSection.jsx`, `WorkHistorySection.jsx` (components) — shown on `/workers/2`
- [x] Update `WorkerProfilePage.jsx` — trust breakdown, work history, reviews

**M3 — Customer** · zip `M3-reviews.zip` · branch `m3/reviews`

- [x] `ReviewFormPage.jsx` — `/customer/bookings/1/review`
- [x] Update `BookingActions.jsx` — hide "Rate this worker" once reviewed

**M4 — Worker** · zip `M4-reviews.zip` · branch `m4/reviews`

- [x] `MyReviewsPage.jsx` — `/worker/reviews`
- [x] `WorkHistoryPage.jsx` — `/worker/history`
- [x] Update `TrustScoreCard.jsx` — links to reviews and work history

## Part 7 — Verification  (`verification`)

**Lead**

- [x] Models: Verification, VerificationDocument; upload validation (type by content, 5 MB)
- [x] Private storage + authenticated document streaming; approve / reject; badges; audit log
- [x] Tests (nobody else can read documents); hooks + mocks

**M5 — Admin & Verification** · zip `M5-verification.zip` · branch `m5/verification`

- [x] `VerificationUploadPage.jsx` — `/worker/verification`
- [x] `VerificationQueuePage.jsx` — `/admin/verifications`
- [x] `VerificationReviewPage.jsx` — `/admin/verifications/1`
- [x] `DocumentViewer.jsx`
- [x] `VerificationHistory.jsx` (component) — shown on `/worker/verification`

## Part 8 — Reports & disputes  (`reports`)

**Lead**

- [x] Report model; create, admin queue, resolve (fault + booking outcome)
- [x] Admin: suspend / reactivate, unlock, reset PIN/password; audit entries; tests
- [x] Hooks + mocks for reports and admin users

**M2 — Public & Auth** · zip `M2-reports.zip` · branch `m2/reports`

- [x] `ReportModal.jsx`
- [x] Update `WorkerProfilePage.jsx`, `ReviewsSection.jsx` — report profile / review buttons

**M5 — Admin & Verification** · zip `M5-reports.zip` · branch `m5/reports`

- [x] `ReportsQueuePage.jsx` — `/admin/reports`
- [x] `ReportResolvePage.jsx` — `/admin/reports/1`
- [x] `UsersPage.jsx` — `/admin/users`
- [x] `ResolveForm.jsx`
- [x] `UserStatusBadge.jsx`
- [x] `ReportTarget.jsx`, `UserActions.jsx`, `CredentialModal.jsx`

## Part 9 — Notifications & help  (`notifications`)

**Lead**

- [x] Notification model; `notify()` wired to booking / review / verification / dispute events
- [x] List, unread count, mark read endpoints; tests
- [x] Hooks: notifications with 30 s polling, new-job sound + vibration; support phone/WhatsApp settings

**M3 — Customer** · zip `M3-notifications.zip` · branch `m3/notifications`

- [x] `NotificationsPage.jsx` — `/notifications`
- [x] `AccountSettingsPage.jsx` — `/account`
- [x] `NotificationBell.jsx`

**M4 — Worker** · zip `M4-notifications.zip` · branch `m4/notifications`

- [x] `HelpPage.jsx` — `/worker/help`

**M5 — Admin & Verification** · zip `M5-notifications.zip` · branch `m5/notifications`

- [x] Update `ResolveForm.jsx` — disputes cannot be dismissed

## Part 10 — Admin dashboard  (`admin`)

**Lead**

- [x] `admin/stats/` endpoint; add Recharts; `TrendChart` (domain); `useAdminStats` hook + mocks

**M5 — Admin & Verification** · zip `M5-admin.zip` · branch `m5/admin`

- [x] `AdminDashboardPage.jsx` — `/admin`
- [x] `StatCard.jsx`
- [x] `BookingsChart.jsx`
- [x] `StatusBreakdown.jsx`, `TopCategories.jsx`

## Part 11 — Worker assistance  (`assistance`)

**Lead**

- [x] Read-aloud hook (Bengali speech synthesis, audio-clip fallback); voice-typing hook
- [x] PWA: vite-plugin-pwa, manifest, offline screen; assisted onboarding endpoint; tutorial video on Help
- [x] Add any new member files for this part to `ownership.json`

**M4 — Worker** · zip `M4-assistance.zip` · branch `m4/assistance`

- [x] Screen voice on `WorkerHomePage`, `MyJobsPage`, `JobRequestPage`, `ActiveJobPage`
- [x] `EditProfilePage.jsx` — voice typing for bio
- [x] `HelpPage.jsx` — read-aloud buttons, tutorial video

**M5 — Admin & Verification** · zip `M5-assistance.zip` · branch `m5/assistance`

- [x] `CreateWorkerModal.jsx`, `UserFilters.jsx`
- [x] `UsersPage.jsx` — "Add worker" (assisted onboarding)

## Part 12 — Final  (`final`)

**Lead**

- [ ] Backend coverage ≥ 70%; security checklist; performance pass (N+1, indexes)
- [ ] Production settings, database, media storage, deploy backend (Render/Railway) and frontend (Vercel/Netlify)
- [ ] Schedule `process_booking_timeouts`; seed demo data; Swagger descriptions; tag `v1.0`

**M2 — Public & Auth** · zip `M2-final.zip` · branch `m2/final`

- [ ] `public.md`

**M3 — Customer** · zip `M3-final.zip` · branch `m3/final`

- [ ] `customer.md`

**M4 — Worker** · zip `M4-final.zip` · branch `m4/final`

- [ ] `worker.md`
- [ ] `USABILITY.md`

**M5 — Admin & Verification** · zip `M5-final.zip` · branch `m5/final`

- [ ] `admin.md`
- [ ] `TEST_PLAN.md`
