/**
 * Yahavi Forge — Billing Worker (Cloudflare Workers)
 * Routes: POST /api/billing/order
 *         POST /api/billing/verify
 *
 * Environment variables (set via `wrangler secret put` — NEVER hardcode):
 *   RAZORPAY_KEY_ID      = rzp_live_T5zNyTT4rOMLaO
 *   RAZORPAY_KEY_SECRET  = <your secret>
 *
 * Deploy: cd worker && npx wrangler deploy
 */

const ALLOWED_ORIGINS = [
  'https://forge.hackknow.com',
  'http://localhost:3000',  // local dev
]

const PLAN_AMOUNTS = {
  day:     4900,   // ₹49
  monthly: 24900,  // ₹249
  yearly:  249900, // ₹2499
}

const PLAN_LABELS = {
  day:     'Yahavi Forge Day Pass',
  monthly: 'Yahavi Forge All-Access Monthly',
  yearly:  'Yahavi Forge All-Access Yearly',
}

/* ─── CORS helpers ─── */
function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age':       '86400',
  }
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  })
}

/* ─── Razorpay base-auth helper ─── */
function rzpAuth(env) {
  return 'Basic ' + btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)
}

/* ─── POST /api/billing/order ─── */
async function handleOrder(req, env, origin) {
  let body
  try { body = await req.json() } catch {
    return json({ error: 'Invalid JSON' }, 400, origin)
  }

  const { planId, currency = 'INR' } = body
  const amount = PLAN_AMOUNTS[planId]
  if (!amount) {
    return json({ error: `Unknown plan: ${planId}` }, 400, origin)
  }

  const receipt = `forge_${planId}_${Date.now()}`
  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization':  rzpAuth(env),
      'Content-Type':   'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt,
      notes: { plan: planId, source: 'forge.hackknow.com' },
    }),
  })

  if (!rzpRes.ok) {
    const errText = await rzpRes.text()
    console.error('Razorpay order error:', errText)
    return json({ error: 'Order creation failed' }, 502, origin)
  }

  const order = await rzpRes.json()
  // Return order id + publishable key (key_secret never leaves server)
  return json({ id: order.id, key: env.RAZORPAY_KEY_ID, amount, currency }, 200, origin)
}

/* ─── POST /api/billing/verify ─── */
async function handleVerify(req, env, origin) {
  let body
  try { body = await req.json() } catch {
    return json({ error: 'Invalid JSON' }, 400, origin)
  }

  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    planId,
  } = body

  if (!razorpay_payment_id) {
    return json({ ok: false, error: 'Missing payment ID' }, 400, origin)
  }

  // If order_id + signature present → verify HMAC (most secure path)
  if (razorpay_order_id && razorpay_signature) {
    const message = `${razorpay_order_id}|${razorpay_payment_id}`
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(env.RAZORPAY_KEY_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['sign']
    )
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(message))
    const computed = Array.from(new Uint8Array(sigBuf))
      .map(b => b.toString(16).padStart(2, '0')).join('')

    if (computed !== razorpay_signature) {
      console.warn('Signature mismatch for payment', razorpay_payment_id)
      return json({ ok: false, error: 'Signature mismatch' }, 200, origin)
    }

    return json({ ok: true, paymentId: razorpay_payment_id, planId }, 200, origin)
  }

  // Fallback: no order_id (direct checkout) → fetch payment from Razorpay and check status
  const fetchRes = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(razorpay_payment_id)}`,
    { headers: { 'Authorization': rzpAuth(env) } }
  )
  if (!fetchRes.ok) {
    return json({ ok: false, error: 'Payment lookup failed' }, 200, origin)
  }

  const payment = await fetchRes.json()
  const ok = payment.status === 'captured' || payment.status === 'authorized'
  return json({ ok, paymentId: razorpay_payment_id, status: payment.status, planId }, 200, origin)
}

/* ─── Router ─── */
export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || ''
    const { pathname, method } = new URL(req.url)

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    if (pathname === '/api/billing/order' && method === 'POST') {
      return handleOrder(req, env, origin)
    }
    if (pathname === '/api/billing/verify' && method === 'POST') {
      return handleVerify(req, env, origin)
    }

    return new Response('Not found', { status: 404 })
  },
}
