# StudyPlan API (Vercel Functions)

## Auth
- `POST /api/auth/register` { email, password, name }
- `POST /api/auth/login` { email, password }
- `GET /api/auth/me` (Bearer token)

Set `AUTH_SECRET` in Vercel env for signing tokens.
Set `ADMIN_EMAIL` in Vercel env to grant admin role automatically on login/register.
For local testing, you can edit `api/_data/users.json` and set `"role": "admin"`.

## Integrations
- `POST /api/integrations/pronote` (Bearer token)
- `POST /api/integrations/ecoledirecte` (Bearer token)

These endpoints currently return 501 until real backend sync is implemented.

## Admin
- `GET /api/admin/stats` (Bearer admin token)

## Support
- `GET /api/support/tickets`
- `POST /api/support/tickets`
