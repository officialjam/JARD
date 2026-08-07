# Career Copilot

A career profile manager plus AI resume/cover-letter generator, application
tracker, and a chat assistant for interview prep, LinkedIn posts, and career
advice. Next.js 16 (App Router) + React 19. Multi-user: each person signs in
with Google and only ever sees their own data.

Model calls run through Google's Gemini API (free tier). Data lives in
Supabase (Postgres + auth), one row per signed-in user, protected by both
application code and Postgres row-level security.

## 1. Set up Supabase (do this before running anything)

1. [supabase.com](https://supabase.com) → sign in → **New Project**. Pick any
   name/region, set a database password (save it somewhere, though you won't
   need it day-to-day).
2. Once it's provisioned: left sidebar → **SQL Editor** → **New query**.
   Paste in the entire contents of `supabase-setup.sql` (included in this
   project) → **Run**. This creates the table that holds everyone's profile
   data, with row-level security so users can only ever read/write their own
   row.
3. Left sidebar → **Settings → API**. You'll need two values from this page
   in a minute: **Project URL** and the **anon public** key (sometimes
   labeled "publishable key").

## 2. Set up Google sign-in

This needs two consoles talking to each other — a bit fiddly, follow closely:

1. [console.cloud.google.com](https://console.cloud.google.com) → create a
   project (or use an existing one) → **APIs & Services → Credentials**.
2. **Create Credentials → OAuth client ID**. If prompted, configure the
   consent screen first (External, fill in an app name and your email —
   nothing fancy needed for testing).
3. Application type: **Web application**.
4. Under **Authorized redirect URIs**, add:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   (your project ref is in the Supabase Project URL from step 1.3 — the part
   before `.supabase.co`)
5. Save. You'll get a **Client ID** and **Client Secret** — copy both.
6. Back in Supabase: **Authentication → Providers → Google** → toggle it on
   → paste in the Client ID and Client Secret → Save.

## 3. Run it locally

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local` with three values:
```
GEMINI_API_KEY=...          # https://aistudio.google.com/apikey (free)
NEXT_PUBLIC_SUPABASE_URL=...        # from Supabase Settings -> API
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # from Supabase Settings -> API
```

Then:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it should redirect you
to `/login`. Click **Sign in with Google**. If it works, you land back on the
app signed in. If it errors, see Troubleshooting below.

## 4. Push to GitHub

```bash
git init
git add .
git commit -m "Career Copilot"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

(Skip this if you already have the repo connected — just commit and push as
usual.)

## 5. Deploy to Vercel

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new) (skip
   if already imported).
2. **Settings → Environment Variables** — add all three:
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Tick Production, Preview, and Development for each.
3. **One Google Cloud step you'll likely need to repeat**: once you have your
   live Vercel URL, go back to Google Cloud Console → your OAuth client →
   add `https://<your-project-ref>.supabase.co/auth/v1/callback` again if
   it's not already there (this doesn't change per-deployment — you only
   need it once — but it's easy to have skipped if you tested locally first
   and are only now deploying).
4. Deploy (or redeploy if it was already deployed before these env vars
   existed — **Deployments → ⋯ → Redeploy**).

## Troubleshooting sign-in specifically

- **"redirect_uri_mismatch" error from Google**: the URI in Google Cloud
  Console's Authorized redirect URIs doesn't exactly match
  `https://<project-ref>.supabase.co/auth/v1/callback`. Check for typos,
  http vs https, trailing slashes.
- **Redirects to /login with `?error=auth`**: the OAuth code exchange
  failed — usually means the Google provider isn't actually toggled on in
  Supabase, or the Client ID/Secret pasted into Supabase don't match Google
  Cloud Console.
- **Signs in, but immediately bounces back to /login**: usually the
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars are
  missing or wrong wherever you're testing (local `.env.local` or Vercel).

## Costs

Gemini's free tier and Supabase's free tier both cover normal use of this at
no cost. Supabase's free tier has project-level limits (database size, auth
user count) — fine for a personal project or small group; check
[supabase.com/pricing](https://supabase.com/pricing) if this grows.

## Project structure

```
proxy.js                     — refreshes auth session, redirects signed-out users to /login
app/
  page.js                    — home page, redirects to /login if not signed in
  login/page.js               — sign-in page
  auth/callback/route.js      — OAuth callback
  api/anthropic/route.js      — server-side proxy to Gemini (holds GEMINI_API_KEY)
  api/profile/route.js        — reads/writes the signed-in user's data in Supabase
lib/supabase/
  client.js                  — browser Supabase client
  server.js                  — server-side Supabase client
components/
  CareerCopilotApp.js         — the whole app (profile, generate, applications, chat)
supabase-setup.sql            — run once in Supabase's SQL editor
```

## Changing the model

`app/api/anthropic/route.js` → `MODEL` constant (currently
`gemini-3.6-flash`). Free-tier model availability shifts over time — check
[ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing)
if requests start failing.
