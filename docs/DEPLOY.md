# Deploying SkillPass BD

This guide puts the whole app online for a demo using [Render](https://render.com) (free plan) and GitHub Actions. You need a Render account linked to the GitHub repository.

## What gets created

`render.yaml` in the repository root is a Render **Blueprint**. It creates three things:

| Name | What it is |
|---|---|
| `skillpass-db` | PostgreSQL database |
| `skillpass-api` | Django API (Gunicorn), runs migrations on every start |
| `skillpass-web` | React app as a static site with SPA rewrites |

The booking timeouts (24 h to answer a request, 72 h to confirm a finished job) run every 15 minutes from `.github/workflows/timeouts.yml`, which calls a token-protected endpoint. This works on free plans.

## Steps

1. **Create the Blueprint.** In Render: *New* → *Blueprint* → pick the `SkillPass-BD` repository. Render reads `render.yaml`. Click *Apply*.
2. **Check the URLs.** If Render gave your services different names than `skillpass-api` / `skillpass-web`, update these environment variables and redeploy:
   - `skillpass-api`: `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`
   - `skillpass-web`: `VITE_API_BASE_URL`
3. **Fill the private values** in the Render dashboard (they are marked `sync: false`):
   - `SUPPORT_PHONE`, `SUPPORT_WHATSAPP` on `skillpass-api` — shown on the worker Help screen.
   - `VITE_TUTORIAL_VIDEO_URL` on `skillpass-web` — optional YouTube or `.mp4` link.
4. **Create an admin.** Open the `skillpass-api` *Shell* tab and run:
   ```bash
   python manage.py createsuperuser
   ```
   Give the account the admin role in Django admin (`/admin/`) or run
   `python manage.py shell -c "from apps.accounts.models import User; User.objects.filter(is_superuser=True).update(role='ADMIN')"`.
5. **Optional demo data** (only for a demo database):
   ```bash
   python manage.py seed_demo --yes
   ```
   It prints the demo phone numbers, passwords and PINs. Change or remove these accounts before real users join.
6. **Turn on the timeouts job.** In GitHub: *Settings* → *Secrets and variables* → *Actions* → add:
   - `API_URL` = `https://skillpass-api.onrender.com/api/v1`
   - `CRON_TOKEN` = the value Render generated for `CRON_TOKEN` on `skillpass-api`

   Run it once by hand from the *Actions* tab (*Booking timeouts* → *Run workflow*) and check it returns `{"expired": …, "auto_closed": …}`.
7. **Smoke test.** Open the web URL, register a customer and a worker, book, accept, complete, confirm, review. Check `/api/docs/` loads.

## Things to know about the free plan

- **Sleeping.** The free API sleeps after ~15 minutes without traffic; the first request then takes up to a minute. The timeouts job also wakes it.
- **Uploaded files are not permanent.** Worker photos and verification documents are stored on the service's disk, which is wiped on every deploy or restart. For anything beyond a demo, add a Render persistent disk and set `MEDIA_ROOT` and `PRIVATE_MEDIA_ROOT` to folders on it (for example `/var/data/media` and `/var/data/private`).
- **Database expiry.** Free Render databases expire after a limited time. Export data you want to keep (`pg_dump`).
- `SERVE_MEDIA=true` lets Django serve public photos itself. That is fine for a demo; a larger deployment should use object storage or a CDN.

## Running the production settings locally

```bash
cd backend
set DJANGO_SETTINGS_MODULE=config.settings.prod
set DJANGO_SECRET_KEY=<a long random value>
set DJANGO_ALLOWED_HOSTS=localhost
python manage.py check --deploy
```

`check --deploy` should report no issues.

## Release tag

After the final pull requests are merged:

```bash
git checkout main
git pull
git tag -a v1.0 -m "SkillPass BD v1.0"
git push origin v1.0
```
