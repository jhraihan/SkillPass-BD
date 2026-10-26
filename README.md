# SkillPass BD

A digital professional identity and verified work history platform for Bangladesh's informal skilled workers — electricians, plumbers, AC technicians, mechanics, painters, cleaners and more.

Each worker gets a **"skill passport"**: verified identity, structured skills, customer-confirmed work history, structured reviews, and an explainable trust score. Customers use it to find and book workers based on evidence instead of word of mouth.

> University Software Engineering Project · Status: in development

## Features

- **Worker SkillPass profiles** — skills, experience, service areas, availability, badges
- **Search & matching** — find workers by skill, area, trust score and availability
- **Bookings** — request → match → book → accept → on the way → start → complete → confirm
- **Verified work history** — every customer-confirmed job becomes permanent evidence
- **Structured reviews** — quality, professionalism, punctuality, communication, would hire again
- **Explainable trust score** — 0–100 from 7 measurable factors, with a visible breakdown
- **Verification** — identity and skill evidence reviewed by admins, shown as separate badges
- **Worker-friendly UI** — Bengali first, picture tiles, big buttons, one clear action per screen
- **Admin panel** — verification queue, disputes, users, catalog

Full requirements: [docs/PRD.md](docs/PRD.md) · Overview: [docs/SkillPass_BD_Overview.pdf](docs/SkillPass_BD_Overview.pdf)

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, TanStack Query, Tailwind CSS, React Hook Form + Zod, react-i18next (বাংলা / English) |
| Backend | Python 3.12, Django 5.2, Django REST Framework, Simple JWT, drf-spectacular |
| Database | PostgreSQL 16+ |
| Testing | pytest, Vitest, React Testing Library |
| CI | GitHub Actions |

## Project structure

```
backend/             Django REST API
  config/            settings (base / dev / test / prod), urls
  apps/              accounts, catalog, workers, bookings, reviews,
                     verification, trust, reports, notifications, audit
  common/            shared base model, permissions, pagination, errors
frontend/            React app
  src/components/    shared UI kit (ui/) and domain components (domain/)
  src/features/      pages by area: public, customer, worker, admin
  src/hooks/         data hooks (real API or mock data)
  src/i18n/          translations (bn / en)
docs/                requirements, guides, diagrams, test plans
```

## Getting started

### Option A — Frontend only (no backend needed)

Needs [Node.js 24 LTS](https://nodejs.org/).

```bash
cd frontend
cp .env.example .env        # Windows: copy .env.example .env
npm install
npm run dev
```

Open http://localhost:5173. With `VITE_USE_MOCKS=true` the app uses fake data. Use the yellow **"view as"** switcher (bottom left) to see the customer, worker or admin area, or add `?mockRole=WORKER` to the address.

### Option B — Full stack

Needs Python 3.12 and PostgreSQL 16+.

```bash
# 1. Create the database (asks for the postgres password)
createdb -U postgres skillpass

# 2. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements/dev.txt
cp .env.example .env            # then set DATABASE_URL with your password
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

- API: http://localhost:8000/api/v1/
- API docs (Swagger): http://localhost:8000/api/docs/
- Django admin: http://localhost:8000/admin/

Then run the frontend (Option A) with `VITE_USE_MOCKS=false`.

## Useful commands

| Where | Command | What it does |
|---|---|---|
| backend | `pytest` | Run backend tests |
| backend | `ruff check .` / `black .` | Lint / format Python |
| frontend | `npm test` | Run frontend tests |
| frontend | `npm run lint` | Lint JavaScript |
| frontend | `npm run build` | Production build |

## Team

See [CONTRIBUTORS.md](CONTRIBUTORS.md). How we work together: [CONTRIBUTING.md](CONTRIBUTING.md).
