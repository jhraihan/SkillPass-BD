# Contributing to SkillPass BD

## Who owns what

| Member | Area | Folders |
|---|---|---|
| Lead | Backend, database, shared frontend, CI, deployment | everything not listed below |
| M2 | Public & Auth pages | `frontend/src/features/public/`, `frontend/src/i18n/*/public.json` |
| M3 | Customer pages | `frontend/src/features/customer/`, `frontend/src/i18n/*/customer.json` |
| M4 | Worker pages | `frontend/src/features/worker/`, `frontend/src/i18n/*/worker.json` |
| M5 | Admin & verification pages | `frontend/src/features/admin/`, `frontend/src/i18n/*/admin.json` |

Only change files in your own area. If you need something changed elsewhere, ask the lead.

## The 7-step flow (GitHub Desktop)

1. **Current branch → `main`**, then **Fetch origin** and **Pull origin**.
2. **Branch → New branch**, e.g. `m3/bookings`.
3. Make your changes (only your files).
4. Check them: in `frontend`, run `npm run dev` and open your pages. Also try a phone-sized window.
5. Write a short commit message, e.g. `feat(customer): add booking detail page`, then **Commit**.
6. **Publish branch**, then **Create Pull Request** and fill in the template.
7. After the lead merges it: switch to `main` and **Pull origin** before starting again.

## Rules

- Never push to `main` directly (it is protected).
- Never commit `.env`, `node_modules/`, `.venv/`, or zip files.
- Never force push.
- Got a conflict or a scary error? Stop and comment on your PR — the lead will help.
- If GitHub says your branch is out of date, click **Update branch** on the PR page.

## Code conventions

- Pages get data only through hooks in `src/hooks/` — no direct API calls in pages.
- Import shared pieces from `@/components/ui`, `@/components/domain`, `@/hooks`, `@/lib`.
  Never import from another member's folder.
- All text goes through translations: `const { t } = useTranslation('customer')`, then `t('key')`.
- Worker screens: Bengali first, big buttons, one main action per screen (see PRD §14.2).
- Reference pages to copy from: `frontend/src/features/_example/` (open `/_examples` while running `npm run dev`).

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/): `feat(scope): …`, `fix(scope): …`, `docs: …`, `test: …`, `chore: …`.
