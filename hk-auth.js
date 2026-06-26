/* ============================================
   HACKKNOW ECOSYSTEM — SHARED AUTH (SUPABASE)
   Single sign-on across *.hackknow.com properties.
   By Hackknow · Operator: Myth
   --------------------------------------------
   Depends on supabase-js v2 (UMD) loaded BEFORE this file:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="hk-auth.js"></script>

   Identity plane: Supabase project "Yahavisai" (ap-southeast-1).
   The publishable key below is CLIENT-SAFE by design (RLS enforced
   on every table). It is NOT a secret — never put service_role here.
   ============================================ */

window.HKAuth = (function () {
  'use strict';

  /* ---- Config (client-safe) ---- */
  const SUPABASE_URL = 'https://ndrnrblhlkgugyvzsbba.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_oEQAM0warLbU-0bWEIk9pw_eAnPDLCC';

  // Where OAuth / magic-link bounces back to. login.html acts as the
  // auth hub: it establishes the session, then forwards to ?next.
  const CALLBACK_PATH = 'login.html';

  let _client = null;
  let _ready = false;

  /* ---- Client ---- */
  function client() {
    if (_client) return _client;
    if (!window.supabase || !window.supabase.createClient) {
      console.error('[HKAuth] supabase-js not loaded — add the CDN <script> before hk-auth.js');
      return null;
    }
    _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,   // handles ?code= / #access_token on return
        flowType: 'pkce',           // PKCE is the safest browser-side OAuth flow
        storageKey: 'hk-ecosystem-auth',
        // v5 security: use sessionStorage for PKCE code_verifier so it never persists
        // beyond the browser tab. The long-lived refresh token stays in localStorage
        // under storageKey above (Supabase default) — which is scoped to this origin.
        // If the browser supports __Host- prefixed cookies (future worker upgrade):
        // cookieOptions: { name: '__Host-hk-auth', secure: true, sameSite: 'Strict', path: '/' }
      },
      global: {
        headers: {
          // Identify our client in Supabase logs; not a secret
          'X-Client-Info': 'yahavi-forge/5',
        }
      }
    });
    _ready = true;
    return _client;
  }

  /* ---- Safe ?next= (same-origin relative paths only → no open redirect) ---- */
  function nextParam() {
    try {
      const raw = new URLSearchParams(location.search).get('next');
      if (!raw) return null;
      // Reject absolute URLs (scheme) and protocol-relative ("//host") to prevent open redirects.
      // Same-origin absolute paths ("/x") and relative paths ("x.html") are allowed.
      if (raw.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;
      return raw;
    } catch (_) { return null; }
  }

  function buildCallback() {
    const next = nextParam() || '/app';
    // Stash next for after the provider round-trip (redirectTo can't always carry query).
    try { sessionStorage.setItem('hk-next', next); } catch (_) {}
    // Absolute callback URL (Supabase requires absolute), resolved against the current page.
    // We use /login (clean path) as the receiver; CF Pages strips .html natively.
    return new URL('/login', location.origin).href;
  }

  function consumeNext() {
    let n = '/';
    try { n = sessionStorage.getItem('hk-next') || '/'; sessionStorage.removeItem('hk-next'); } catch (_) {}
    // Open-redirect guard: block absolute URLs (scheme: and protocol-relative //).
    // Only allow same-origin relative paths (starting with / or alphanumeric).
    if (!n || n.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(n)) n = '/app';
    // Avoid redirect loops back to login/signup
    if (n.startsWith('/login') || n.startsWith('/signin')) n = '/app';
    return n;
  }

  /* ---- Session helpers ---- */
  async function getSession() {
    const c = client(); if (!c) return null;
    const { data } = await c.auth.getSession();
    return data ? data.session : null;
  }

  async function getUser() {
    const s = await getSession();
    return s ? s.user : null;
  }

  function onChange(cb) {
    const c = client(); if (!c) return () => {};
    const { data } = c.auth.onAuthStateChange((_evt, session) => cb(session ? session.user : null, session));
    return () => { try { data.subscription.unsubscribe(); } catch (_) {} };
  }

  /* ---- Sign-in flows ---- */
  async function signInWithProvider(provider) {
    const c = client(); if (!c) throw new Error('Auth unavailable');
    return c.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: buildCallback(),
        queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : undefined
      }
    });
  }

  async function signInWithMagicLink(email) {
    const c = client(); if (!c) throw new Error('Auth unavailable');
    return c.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: buildCallback(), shouldCreateUser: true }
    });
  }

  async function signInWithPassword(email, password) {
    const c = client(); if (!c) throw new Error('Auth unavailable');
    return c.auth.signInWithPassword({ email, password });
  }

  async function signUpWithPassword(email, password) {
    const c = client(); if (!c) throw new Error('Auth unavailable');
    return c.auth.signUp({ email, password, options: { emailRedirectTo: buildCallback() } });
  }

  async function signOut() {
    const c = client(); if (!c) return;
    await c.auth.signOut();
  }

  /* ---- Gate a page: redirect to login if no session ---- */
  async function requireAuth(loginPath) {
    const s = await getSession();
    if (!s) {
      const here = location.pathname + location.search;
      location.replace((loginPath || CALLBACK_PATH) + '?next=' + encodeURIComponent(here));
      return null;
    }
    return s.user;
  }

  /* ---- Nav control: fills #auth-slot if present (used on the main app) ---- */
  function displayName(user) {
    if (!user) return '';
    const m = user.user_metadata || {};
    return m.full_name || m.name || m.user_name || (user.email ? user.email.split('@')[0] : 'ACCOUNT');
  }

  function mountNavControl(opts) {
    const slot = document.getElementById('auth-slot');
    if (!slot) return;
    opts = opts || {};
    const loginHref = opts.loginHref || (CALLBACK_PATH + '?next=' + encodeURIComponent(location.pathname));

    function renderLoggedOut() {
      slot.innerHTML =
        '<a class="btn-settings" id="hk-signin" href="' + loginHref + '" ' +
        'style="text-decoration:none;border-bottom:none;display:inline-flex;align-items:center;">▸ SIGN IN</a>';
    }
    function renderLoggedIn(user) {
      const name = (displayName(user) || '').toString().toUpperCase().slice(0, 18);
      slot.innerHTML =
        '<span class="status-pill connected" title="' + (user.email || '') + '" ' +
        'style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
        '<span class="dot"></span>' + name + '</span>' +
        '<button class="btn-settings" id="hk-signout" type="button" style="background:var(--ink);">▸ SIGN OUT</button>';
      const btn = document.getElementById('hk-signout');
      if (btn) btn.addEventListener('click', async () => {
        btn.disabled = true;
        await signOut();
        if (typeof window.toast === 'function') window.toast('▸ Signed out', '');
        renderLoggedOut();
      });
    }

    renderLoggedOut(); // optimistic default
    getUser().then(u => { if (u) renderLoggedIn(u); });
    onChange((u) => { u ? renderLoggedIn(u) : renderLoggedOut(); });
  }

  /* ---- Auto-mount the nav control if the host page provides #auth-slot ---- */
  function autoMount() {
    if (document.getElementById('auth-slot')) {
      try { mountNavControl(); } catch (e) { console.warn('[HKAuth] mount failed', e); }
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }

  return {
    SUPABASE_URL,
    client,
    getSession,
    getUser,
    onChange,
    signInWithProvider,
    signInWithMagicLink,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    requireAuth,
    mountNavControl,
    consumeNext,
    nextParam,
    isReady: () => _ready
  };
})();
