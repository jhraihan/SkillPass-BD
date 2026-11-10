# Admin guide

For SkillPass staff who verify workers, handle problems and manage accounts. Admin pages are under `/admin` in the web app. The Django admin (`<api>/admin/`) is for raw data only.

## Dashboard (`/admin`)

- Switch the period with **7 / 30 / 90 days**.
- The three top cards are your queues: **Documents waiting**, **Open disputes**, **Open reports**. Click a card to open it.
- Headline numbers: users, active workers (available now / identity verified), bookings, completion rate.
- **Bookings per day** compares new requests with finished jobs. Use **Show as table** for exact numbers.
- Lists show bookings by status and the top services with the average rating.

The dashboard refreshes every minute.

## Verification queue (`/admin/verifications`)

1. Open **Waiting for review** (oldest first). Filter by type if needed.
2. Press **Review**. Documents load securely; rotate photos or open PDFs in a new tab.
3. Follow the checklist on the page:
   - **Identity:** photo is clear, name matches the account, face matches the profile photo.
   - **Skill proof:** the certificate or photos clearly show that skill.
4. **Approve** or **Reject** with a reason the worker will read.

Approving identity gives the **Identity verified** badge and updates the trust score; approving skill proof marks that skill as checked. Every decision is final and recorded in the audit log.

## Reports and disputes (`/admin/reports`)

Reports come from customers and workers about a job, a worker profile or a review. A **Dispute** badge means the customer rejected a finished job.

1. Open a report. Press **I will handle this** so others know it is yours.
2. Read the report, the job timeline, the worker's note and both people's status.
3. Choose the decision:
   - **Dispute:** choose how the job ends (**Mark as done** or **Cancel**) and **who was at fault**. A dispute cannot be dismissed.
   - **Review report:** **Hide** (still counts in the score) or **Mark invalid** (removed from the score).
   - **Suspend** the person at fault if needed.
4. Write a short, factual **resolution note** — both sides may see it — and save.

Cancelling a dispute with fault **Worker** counts as a worker cancellation in the trust score. Both people are notified.

## Users (`/admin/users`)

- Search by name or phone; filter by role and status (active, suspended, locked).
- **Suspend** (reason required): signs the person out at once; workers disappear from search.
- **Reactivate** and **Unlock** (after 10 wrong sign-in tries).
- **New PIN / New password**: issues a temporary credential, shown **once**. Give it to the person directly, never in a group chat. They must change it at next sign-in.
- **Add worker**: assisted onboarding for workers who cannot sign up alone. Enter name and mobile number; a temporary PIN is shown once.

You cannot suspend or reset your own account.

## Catalog (`/admin/catalog`)

Manage services, skills and areas. Prefer **Deactivate** over delete; items already in use cannot be deleted.

## Audit log

Approvals, rejections, report decisions, suspensions, unlocks, credential resets and onboarding are stored in the append-only audit log (Django admin → *Audit logs*). Temporary PINs and passwords are never written there.
