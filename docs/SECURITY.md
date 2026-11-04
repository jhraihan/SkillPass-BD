# Security checklist

Status of each item for v1.0. "Test" names the automated test that proves it, where one exists.

## Accounts and sign-in

| Item | Status | How |
|---|---|---|
| Passwords and worker PINs are hashed | Done | Django `set_password` (PBKDF2). PINs are never logged or returned, except a temporary PIN shown once to the admin who issued it. |
| Weak PINs rejected | Done | 6 digits; no repeats, sequences, common PINs or the last 6 digits of the phone. `tests/accounts/test_credentials.py` |
| Brute-force protection | Done | `auth` throttle (5/min) plus lockout after 10 wrong tries in 24 h; admin unlock. `tests/accounts/test_auth_api.py` |
| Short-lived tokens | Done | 15-minute access token; refresh rotation and blacklist; all tokens revoked on credential change, reset and suspension. `tests/accounts/test_admin_users.py` |
| Suspended / locked users are signed out | Done | Every request re-checks the user (`user_can_authenticate`). |
| Temporary credentials must be changed | Done | `must_change_credential` forces the set-PIN screen. |

## Access control

| Item | Status | How |
|---|---|---|
| Every endpoint has an explicit permission | Done | `common.permissions`; reviewed per view. |
| Participants only see their own bookings | Done | Querysets filtered by user; others get 404. `tests/bookings/test_access_and_matching.py` |
| Address and phone hidden until a booking is accepted | Done | `contact_visible`. `tests/bookings` |
| Verification documents are private | Done | Stored outside `MEDIA_ROOT`, random file names, no public URL; streamed only to the owner and admins with `Cache-Control: private, no-store`. `tests/verification/test_review.py` |
| Admin-only actions | Done | Approve/reject, resolve reports, suspend, reset credentials, onboarding, stats. Tested per app. |
| Admins cannot suspend or reset themselves | Done | `tests/accounts/test_admin_users.py` |
| Reporter identity hidden from the reported person | Done | Only admins see `reporter`. `tests/reports/test_create.py` |

## Input and files

| Item | Status | How |
|---|---|---|
| Upload type checked by content, not name | Done | Magic-byte sniffing (JPG/PNG/PDF), 5 MB each, max 5 files. `tests/verification/test_submit.py` |
| Worker photos re-encoded | Done | Pillow resize to 800 px JPEG, strips EXIF. |
| Server-side validation on every write | Done | DRF serializers + service-layer checks; consistent `{detail, code, errors}`. |
| Database constraints back business rules | Done | One review per booking, one active booking per request, rating range checks. |

## Platform

| Item | Status | How |
|---|---|---|
| Secrets only in environment variables | Done | `.env` is git-ignored; `render.yaml` generates `DJANGO_SECRET_KEY` and `CRON_TOKEN`. Prod refuses to start with the dev secret key. |
| HTTPS, HSTS, secure cookies | Done | `config/settings/prod.py`; `manage.py check --deploy` clean (HSTS preload intentionally off on a shared domain). |
| CORS limited to the frontend origin | Done | `CORS_ALLOWED_ORIGINS`. |
| Internal cron endpoint protected | Done | Constant-time token check; 404 without the token. `tests/test_deploy_helpers.py` |
| Audit trail | Done | Verification decisions, report resolutions, suspensions, unlocks, credential resets and onboarding are written to the append-only `AuditLog`. |
| Dependency checks | Ongoing | Run `pip list --outdated` and `npm audit` before each release. |

## Known limits (accepted for the university demo)

- No SMS one-time code at registration (PRD Q2).
- No automatic malware scan of uploaded PDFs; admins open them in the browser viewer only.
- Free hosting stores uploads on an ephemeral disk (see `DEPLOY.md`).
