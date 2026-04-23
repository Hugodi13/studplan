# StudyPlan API (Vercel Functions)

## Hébergement
Le **front** peut être sur **Cloudflare Pages** (fichiers statiques). Les routes de ce dossier doivent alors tourner sur **Vercel** (ou autre). Dans le build du front, définir `VITE_API_BASE_URL` = l’URL du déploiement Vercel (ex. `https://studyplan-abc.vercel.app`).

Côté **Vercel (variables d’environnement du projet API)** : `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `CORS_ALLOW_ORIGIN` (séparateur virgule) avec au minimum l’URL du site Cloudflare et `http://localhost:5173` pour le dev, ex.  
`https://studyplan-c9w.pages.dev,http://localhost:5173`

## Auth
- `POST /api/auth/register` { email, password, name }
- `POST /api/auth/login` { email, password }
- `POST /api/auth/google` { credential } — ID token JWT renvoyé par le bouton « Se connecter avec Google » (même client ID côté web).
- `GET /api/auth/me` (Bearer token)

Set `GOOGLE_CLIENT_ID` (même identifiant client OAuth que le front, type *Application Web*) sur l’hébergeur API. Côté build / `.env` Vite : `VITE_GOOGLE_CLIENT_ID=...` (même valeur).

Dans [Google Cloud Console](https://console.cloud.google.com/) : APIs & Services → Créer des identifiants → ID client OAuth — **Application Web**. Origines JavaScript autorisées : `https://ton-domaine.pages.dev` (et `http://localhost:5173` en dev). URI de redirection : non requise pour le flux par jeton côté client, mais l’origine du site doit être autorisée.

Comptes **e-mail + mot de passe** : `auth_provider: "password"`. Comptes **Google** : `auth_provider: "google"` ; la connexion par mot de passe est refusée (`USE_GOOGLE_SIGNIN`).

### E-mails (Resend) — optionnel
Sans `RESEND_API_KEY` + `EMAIL_FROM`, **aucun e-mail n’est envoyé** (ce n’était pas câblé avant). L’inscription crée quand même une **session** (compte vérifié) pour que la connexion fonctionne.

Avec [Resend](https://resend.com) : `RESEND_API_KEY`, `EMAIL_FROM` (ex. `StudyPlan <onboarding@resend.dev>`), `PUBLIC_APP_URL` = l’URL du **front** (ex. `https://studyplan-c9w.pages.dev`, sans `/` final) pour générer les liens `/verify-email?token=…` et `/reset-password?token=…`. Si l’envoi de confirmation échoue, l’API se rabat sur une **session** pour ne pas te bloquer.

Oublie de mot de passe : même principe ; sans Resend, mets `AUTH_EXPOSE_TOKENS=1` côté API seulement pour debug afin d’exposer le jeton de reset dans le JSON (ne pas en prod grand public).

Set `AUTH_SECRET` in Vercel env for signing tokens.
Set `ADMIN_EMAIL` in Vercel env to grant admin role automatically on login/register.
For local testing, you can edit `api/_data/users.json` and set `"role": "admin"`.

## Integrations
- `POST /api/integrations/pronote` (Bearer token)
- `POST /api/integrations/ecoledirecte` (Bearer token)

These endpoints now return authenticated mock tasks by default, so the integration flow works immediately after deployment.
When you wire real connectors, replace the mock payloads in:
- `api/integrations/pronote.js`
- `api/integrations/ecoledirecte.js`

## Admin
- `GET /api/admin/stats` (Bearer admin token)

## Support
- `GET /api/support/tickets`
- `POST /api/support/tickets`
