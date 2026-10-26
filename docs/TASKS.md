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

- [ ] Django admin for `User`; `CustomerProfile` model
- [ ] Register: customer password / worker 6-digit PIN with weak-PIN blocklist
- [ ] Login with throttling, failed-attempt counter and 24 h lockout; worker 30-day refresh token
- [ ] Refresh, logout (blacklist), `me` GET/PATCH, change password/PIN, forced change after reset
- [ ] `create_admin` management command; tests for every auth rule
- [ ] Hooks + mocks: `useLogin`, `useRegister`, `useLogout`, `useMe`, `useChangeCredential`; AuthProvider calls logout API

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

- [ ] Models: Division, District, Area, ServiceCategory, Skill (bn/en names, slugs)
- [ ] Fixtures: Dhaka areas, 6–8 categories, ~40 skills
- [ ] Read endpoints + admin CRUD endpoints; Django admin; tests
- [ ] Hooks + mocks: `useCategories`, `useSkills`, `useAreas`, admin mutations

**M5 — Admin & Verification** · zip `M5-catalog.zip` · branch `m5/catalog`

- [ ] `CatalogPage.jsx` — `/admin/catalog`
- [ ] `CatalogForm.jsx`

## Part 4 — Worker profiles & search  (`profiles`)

**Lead**

- [ ] Models: WorkerProfile (counters), WorkerSkill, WorkerServiceArea
- [ ] Worker `me` profile, photo upload, availability, replace skills / areas, completeness %
- [ ] Public profile serializer (badges, hidden phone), search filters + ordering, worker dashboard endpoint; tests
- [ ] Domain components: `WorkerCard`; hooks + mocks for search, profile, availability

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

- [ ] Models: ServiceRequest, Booking (one active per request), BookingStatusHistory
- [ ] Matching service with reasons; `transition()` service with row locks and history
- [ ] Action endpoints (accept, decline, on-the-way, start, mark-complete, confirm, cancel, dispute); contact/address privacy
- [ ] `process_booking_timeouts` command (24 h expire, 72 h auto-close); tests for every transition
- [ ] Domain component `StatusTimeline`; hooks + mocks for requests, matches, bookings, actions

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

- [ ] Review model + eligibility rules; worker reviews list; verified work history endpoint
- [ ] Trust score service (7 factors, Bayesian rating, cold start), history, recalculation triggers + command; tests
- [ ] Domain components `ReviewCard`, `TrustBreakdown`; hooks + mocks

**M2 — Public & Auth** · zip `M2-reviews.zip` · branch `m2/reviews`

- [ ] `TrustExplainerPage.jsx` — `/trust-score`

**M3 — Customer** · zip `M3-reviews.zip` · branch `m3/reviews`

- [ ] `ReviewFormPage.jsx` — `/customer/bookings/1/review`

**M4 — Worker** · zip `M4-reviews.zip` · branch `m4/reviews`

- [ ] `MyReviewsPage.jsx` — `/worker/reviews`
- [ ] `WorkHistoryPage.jsx` — `/worker/history`

## Part 7 — Verification  (`verification`)

**Lead**

- [ ] Models: Verification, VerificationDocument; upload validation (type by content, 5 MB)
- [ ] Private storage + authenticated document streaming; approve / reject; badges; audit log
- [ ] Tests (nobody else can read documents); hooks + mocks

**M5 — Admin & Verification** · zip `M5-verification.zip` · branch `m5/verification`

- [ ] `VerificationUploadPage.jsx` — `/worker/verification`
- [ ] `VerificationQueuePage.jsx` — `/admin/verifications`
- [ ] `VerificationReviewPage.jsx` — `/admin/verifications/1`
- [ ] `DocumentViewer.jsx`

## Part 8 — Reports & disputes  (`reports`)

**Lead**

- [ ] Report model; create, admin queue, resolve (fault + booking outcome)
- [ ] Admin: suspend / reactivate, unlock, reset PIN/password; audit entries; tests
- [ ] Hooks + mocks for reports and admin users

**M2 — Public & Auth** · zip `M2-reports.zip` · branch `m2/reports`

- [ ] `ReportModal.jsx`

**M5 — Admin & Verification** · zip `M5-reports.zip` · branch `m5/reports`

- [ ] `ReportsQueuePage.jsx` — `/admin/reports`
- [ ] `ReportResolvePage.jsx` — `/admin/reports/1`
- [ ] `UsersPage.jsx` — `/admin/users`
- [ ] `ResolveForm.jsx`
- [ ] `UserStatusBadge.jsx`

## Part 9 — Notifications & help  (`notifications`)

**Lead**

- [ ] Notification model; `notify()` wired to booking / review / verification / dispute events
- [ ] List, unread count, mark read endpoints; tests
- [ ] Hooks: notifications with 30 s polling, new-job sound + vibration; support phone/WhatsApp settings

**M3 — Customer** · zip `M3-notifications.zip` · branch `m3/notifications`

- [ ] `NotificationsPage.jsx` — `/notifications`
- [ ] `AccountSettingsPage.jsx` — `/account`
- [ ] `NotificationBell.jsx`

**M4 — Worker** · zip `M4-notifications.zip` · branch `m4/notifications`

- [ ] `HelpPage.jsx` — `/worker/help`

## Part 10 — Admin dashboard  (`admin`)

**Lead**

- [ ] `admin/stats/` endpoint; add Recharts; `useAdminStats` hook + mocks

**M5 — Admin & Verification** · zip `M5-admin.zip` · branch `m5/admin`

- [ ] `AdminDashboardPage.jsx` — `/admin`
- [ ] `StatCard.jsx`
- [ ] `BookingsChart.jsx`

## Part 11 — Worker assistance  (`assistance`)

**Lead**

- [ ] Read-aloud hook (Bengali speech synthesis, audio-clip fallback); voice-typing hook
- [ ] PWA: vite-plugin-pwa, manifest, offline screen; assisted onboarding endpoint; tutorial video on Help
- [ ] Add any new member files for this part to `ownership.json`

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
