# Yahavi Forge — Login + Legal + Cloudflare Deploy

Bundle for **forge.hackknow.com**. Stack unchanged: **vanilla HTML/CSS/JS** (no build step).
Login uses the live Supabase identity plane (project `ndrnrblhlkgugyvzsbba`). Only **one** new
runtime dependency: `@supabase/supabase-js` loaded from a CDN (no npm/build).

---

## 1. Files

**New**
- `login.html` — brutalist sign-in page (Google / GitHub / email magic-link + password).
- `hk-auth.js` — shared HackKnow auth helper (Supabase). Reusable across the ecosystem. Auto-mounts a nav account control wherever a page has `<div id="auth-slot">`.
- `terms.html` — Terms & Conditions.
- `privacy.html` — Privacy Policy.
- `legal.css` — prose styling for the two legal pages (built on the existing tokens).
- `_headers`, `_redirects` — Cloudflare Pages security headers + clean URLs.

**Changed**
- `index.html` — added `#auth-slot` in the nav, Terms/Privacy footer links, and the two auth `<script>` tags. `app.js`, `styles.css`, `report.*` are **untouched**.

---

## 2. Supabase setup (do this first — OAuth fails without it)

Dashboard → project **Yahavisai** (`ndrnrblhlkgugyvzsbba`):

1. **Authentication → URL Configuration**
   - **Site URL:** `https://forge.hackknow.com`
   - **Redirect URLs** (add all):
     - `https://forge.hackknow.com/login.html`
     - `https://*.pages.dev/login.html`  *(for CF preview builds)*
     - `http://localhost:8000/login.html` *(local dev)*
2. **Authentication → Providers**
   - **Email** → enable.
   - **Google** → enable, paste your Google OAuth client ID + secret (Google Cloud → OAuth consent + credentials; authorized redirect URI = `https://ndrnrblhlkgugyvzsbba.supabase.co/auth/v1/callback`).
   - **GitHub** → enable, paste a GitHub OAuth app client ID + secret (callback = same Supabase `/auth/v1/callback`).

> The publishable key in `hk-auth.js` is client-safe (RLS is on). Never put the `service_role` key in front-end files.

---

## 3a. Deploy to Cloudflare Pages — Dashboard (no API token needed)

1. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick repo **`gaganchauhan1997/yahavi-forge`**, branch `main`.
3. Build settings: **Framework preset = None**, **Build command = (empty)**, **Output directory = `/`** (root).
4. **Save and Deploy** → you get `forge-xxxx.pages.dev`.
5. **Custom domains → Set up a domain → `forge.hackknow.com`**. If the `hackknow.com` zone is on Cloudflare, the proxied CNAME is created automatically.

## 3b. Deploy via CLI (needs the Cloudflare API token — still outstanding)

```bash
# from the bundle root
export CLOUDFLARE_API_TOKEN=********      # see scopes below
npx wrangler pages deploy . --project-name=forge --branch=main
```
**Token scopes:** Account → *Cloudflare Pages: Edit*; Zone → *DNS: Edit* + *Zone: Read* (on `hackknow.com`); Account → *Account Settings: Read*. (Workers: Edit optional.)

---

## 4. DNS for forge.hackknow.com
- **Zone on Cloudflare:** adding the custom domain (3a step 5) creates the record for you.
- **Zone elsewhere (e.g. Hostinger):** add `CNAME  forge  →  forge-xxxx.pages.dev` (proxy/orange-cloud only applies on Cloudflare).

---

## 5. Local test
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
Static files + theme + navigation work offline; OAuth needs the localhost redirect URL added in step 2.

---

## 6. Hardening / follow-ups
- **Contact email:** `support@hackknow.com` is referenced in Terms/Privacy — confirm the mailbox exists (note: `team@shop.hackknow.com` is still pending creation per prior sessions).
- **Cross-subdomain SSO:** sessions persist per-origin (localStorage). For silent SSO across *all* `*.hackknow.com` tools, swap `hk-auth.js` storage to a cookie adapter scoped to `.hackknow.com` — documented as the next step, not shipped here.
- **Tighten CSP:** `_headers` ships a compatible CSP (allows `'unsafe-inline'`). After externalising `login.html`'s inline script, drop `'unsafe-inline'` from `script-src`.
- **Theme note:** your brief said "Dark / Black-Magenta" but the live repo is the **light paper** brutalist theme (yellow + magenta accents). Per the "match existing exactly" rule everything here matches the light theme. Say the word for a dark variant.
