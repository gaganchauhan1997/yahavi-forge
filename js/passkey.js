/* ============================================================
   YAHAVI FORGE — Passkey (WebAuthn) + 6-digit PIN fallback (v5)
   --------------------------------------------------------------
   Stores credential metadata in localStorage so users can sign
   back in via biometric (fingerprint / Face ID) or a 6-digit PIN
   on the SAME device. For multi-device sync, the server-side
   credential registry in the monorepo will mirror this once the
   Supabase project is back up.

   Public API:
     HKPasskey.isSupported()       -> bool
     HKPasskey.hasLocalCredential() -> bool
     HKPasskey.register(email)      -> Promise<{credentialId, type}>
     HKPasskey.authenticate()       -> Promise<{email, credentialId}>
     HKPasskey.removeLocal()        -> void
     HKPasskey.setPin(pin)          -> Promise<void>
     HKPasskey.verifyPin(pin)       -> Promise<bool>
   ============================================================ */
(function (root) {
  'use strict'

  const STORAGE_KEY = 'yahavi-forge-passkey'
  const PIN_KEY     = 'yahavi-forge-pin'

  /* ─────── feature detection ─────── */
  function isSupported() {
    return !!(root.PublicKeyCredential &&
      navigator.credentials &&
      typeof navigator.credentials.create === 'function')
  }
  function hasLocalCredential() {
    try {
      const c = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      return !!(c && c.credentialId)
    } catch { return false }
  }

  /* ─────── helpers ─────── */
  function b64uEncode(buf) {
    const bytes = new Uint8Array(buf)
    let s = ''
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  function b64uDecode(str) {
    const pad = '='.repeat((4 - (str.length % 4)) % 4)
    const s = (str + pad).replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(s)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  }
  function randomBuf(n) {
    const a = new Uint8Array(n)
    crypto.getRandomValues(a)
    return a
  }
  async function sha256Hex(s) {
    const enc = new TextEncoder().encode(s)
    const buf = await crypto.subtle.digest('SHA-256', enc)
    const bytes = new Uint8Array(buf)
    let hex = ''
    for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0')
    return hex
  }

  /* ─────── register a new passkey ─────── */
  async function register(email) {
    if (!isSupported()) throw new Error('Passkeys not supported on this browser/device')
    const userId = await sha256Hex(email.toLowerCase().trim())
    const rpId = location.hostname
    const challenge = randomBuf(32)
    const opts = {
      publicKey: {
        rp: { id: rpId === 'localhost' ? 'localhost' : rpId, name: 'Yahavi Forge' },
        user: {
          id: b64uDecode(userId.slice(0, 32)), // hash → 32 bytes
          name: email,
          displayName: email,
        },
        challenge,
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    }
    const cred = await navigator.credentials.create(opts)
    if (!cred) throw new Error('No credential returned')
    const credentialId = b64uEncode(cred.rawId)
    const meta = {
      credentialId,
      email,
      createdAt: new Date().toISOString(),
      rpId,
      type: cred.type,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta))
    return meta
  }

  /* ─────── authenticate ─────── */
  async function authenticate() {
    if (!isSupported()) throw new Error('Passkeys not supported on this browser/device')
    const meta = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!meta || !meta.credentialId) {
      // Fall through to PIN if user has one
      if (localStorage.getItem(PIN_KEY)) {
        const pin = await promptPin()
        const ok = await verifyPin(pin)
        if (!ok) throw new Error('Wrong PIN')
        const last = JSON.parse(localStorage.getItem(STORAGE_KEY + '-email') || 'null')
        return { email: (last && last.email) || 'you', credentialId: 'pin' }
      }
      throw new Error('No passkey registered on this device')
    }
    const challenge = randomBuf(32)
    const opts = {
      publicKey: {
        challenge,
        allowCredentials: [{
          type: 'public-key',
          id: b64uDecode(meta.credentialId),
          transports: ['internal', 'hybrid'],
        }],
        userVerification: 'preferred',
        timeout: 60000,
        rpId: meta.rpId || location.hostname,
      },
    }
    const assertion = await navigator.credentials.get(opts)
    if (!assertion) throw new Error('No assertion returned')
    // Mark a soft-session so HKAuth treats user as signed in even without Supabase round-trip
    const session = {
      userId: meta.credentialId,
      email: meta.email,
      method: 'passkey',
      issuedAt: new Date().toISOString(),
    }
    localStorage.setItem('yahavi-forge-auth-cache', JSON.stringify(session))
    return { email: meta.email, credentialId: meta.credentialId }
  }

  function removeLocal() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_KEY + '-email')
    localStorage.removeItem(PIN_KEY)
  }

  /* ─────── 6-digit PIN fallback ─────── */
  async function setPin(pin) {
    if (!/^\d{6}$/.test(pin)) throw new Error('PIN must be 6 digits')
    const salt = b64uEncode(randomBuf(16))
    const hash = await sha256Hex(salt + ':' + pin)
    localStorage.setItem(PIN_KEY, JSON.stringify({ salt, hash, setAt: new Date().toISOString() }))
  }
  async function verifyPin(pin) {
    const raw = localStorage.getItem(PIN_KEY)
    if (!raw) return false
    const { salt, hash } = JSON.parse(raw)
    const probe = await sha256Hex(salt + ':' + pin)
    return probe === hash
  }
  async function promptPin() {
    return new Promise((resolve) => {
      const bg = document.createElement('div')
      bg.className = 'paywall-modal-bg show'
      bg.style.zIndex = 999
      bg.innerHTML = `
        <div class="paywall-modal" style="max-width:380px;text-align:center;">
          <div class="paywall-eyebrow">▸ ENTER YOUR 6-DIGIT PIN</div>
          <h2 class="paywall-h" style="font-size:24px;">PIN unlock</h2>
          <input id="pk-pin" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6"
            placeholder="••••••" autocomplete="one-time-code"
            style="width:100%;text-align:center;font-size:28px;font-family:'JetBrains Mono',monospace;padding:14px;letter-spacing:14px;border:3px solid var(--ink);background:var(--paper-warm);margin:18px 0 14px;" />
          <button class="btn btn-primary" id="pk-go" type="button" style="width:100%;">▸ UNLOCK</button>
        </div>`
      document.body.appendChild(bg)
      const inp = bg.querySelector('#pk-pin')
      inp.focus()
      bg.querySelector('#pk-go').addEventListener('click', () => {
        const v = inp.value.trim()
        bg.remove()
        resolve(v)
      })
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const v = inp.value.trim()
          bg.remove()
          resolve(v)
        }
      })
    })
  }

  root.HKPasskey = {
    isSupported,
    hasLocalCredential,
    register,
    authenticate,
    removeLocal,
    setPin,
    verifyPin,
  }
})(window)
