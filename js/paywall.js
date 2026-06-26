/* ============================================================
   YAHAVI FORGE — Guest export paywall (v5)
   When a guest (not signed in) hits Push/Export/PDF/HTML, this
   shows pricing options + coupon input + sign-in CTA.

   Hooks:
     HKForge.Paywall.guard({ action, onAllow })
       -> if allowed (signed in OR coupon redeemed), runs onAllow()
       -> otherwise renders the modal
     HKForge.Paywall.open({ action, onAllow })
   ============================================================ */
(function (root) {
  'use strict'

  const escText = (s) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const escAttr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')

  // Pricing (must mirror pricing.html + monorepo billing config)
  const PLANS = [
    {
      id: 'free',
      label: '▸ FREE FOREVER',
      sub: 'Builder only · watermarked PDF · 1 export/day',
      price: '₹0',
      cta: 'Sign in for Free tier',
      action: 'signin',
      tone: 'free',
    },
    {
      id: 'day',
      label: '▸ DAY PASS',
      sub: '24h · all 17 tools · no watermark · unlimited exports',
      price: '₹49',
      cta: 'Buy Day Pass',
      action: 'buy:day',
      tone: 'day',
    },
    {
      id: 'monthly',
      label: '▸ ALL-ACCESS MONTHLY',
      sub: '30 days · all categories · priority AI · cloud sync',
      price: '₹249/mo',
      cta: 'Subscribe Monthly',
      action: 'buy:monthly',
      tone: 'monthly',
      featured: true,
    },
    {
      id: 'yearly',
      label: '▸ YEARLY (save ₹489)',
      sub: '12 months · everything monthly has · early features',
      price: '₹2,499/yr',
      cta: 'Go Yearly',
      action: 'buy:yearly',
      tone: 'yearly',
    },
  ]

  function isSignedIn() {
    try {
      const cached = JSON.parse(localStorage.getItem('yahavi-forge-auth-cache') || 'null')
      if (cached && cached.userId) return true
    } catch {}
    if (root.HKAuth && root.HKAuth.cachedUser) return !!root.HKAuth.cachedUser
    return false
  }

  function hasUnlockedSession() {
    // Any of: signed in, valid paid session token, redeemed launch coupon
    try {
      const s = JSON.parse(localStorage.getItem('yahavi-forge-session') || 'null')
      if (s && s.unlocked && s.expiresAt && new Date(s.expiresAt) > new Date()) return true
    } catch {}
    return isSignedIn()
  }

  function setUnlockedSession(planId, hours = 24) {
    const s = {
      unlocked: true,
      planId,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
    }
    try { localStorage.setItem('yahavi-forge-session', JSON.stringify(s)) } catch {}
  }

  function ensureBg() {
    let bg = document.getElementById('paywall-modal-bg')
    if (bg) return bg
    bg = document.createElement('div')
    bg.id = 'paywall-modal-bg'
    bg.className = 'paywall-modal-bg'
    bg.setAttribute('role', 'dialog')
    bg.setAttribute('aria-modal', 'true')
    document.body.appendChild(bg)
    return bg
  }

  function open({ action = 'export', onAllow } = {}) {
    const bg = ensureBg()
    const Coupon = root.HKForge && root.HKForge.Coupon
    const eligibleLoyalty = Coupon && Coupon.checkLoyaltyEligibility().eligible
    const existingCoupon = Coupon && Coupon.getCoupons().find((c) => c.type === 'LOYALTY50' && !c.usedAt)
    const exportCount = Coupon ? Coupon.getExportCount() : 0

    const actionLabel = ({
      export: 'export this tool output',
      push: 'push this to Resumes',
      pdf: 'download as PDF',
      html: 'download as HTML',
      cloud: 'sync to your account',
    })[action] || 'continue'

    bg.innerHTML = `
      <div class="paywall-modal" role="document">
        <button class="paywall-close" type="button" aria-label="Close paywall">×</button>
        <div class="paywall-eyebrow">▸ UNLOCK TO ${escText(actionLabel.toUpperCase())}</div>
        <h2 class="paywall-h">Pick your unlock — or sign in for Free tier.</h2>
        <p class="paywall-sub">
          Yahavi Forge is BYOK (your own AI keys) — so it stays radically affordable.
          The fee covers hosting, templates, and one human team. No subscription tax.
        </p>

        ${
          existingCoupon
            ? `<div class="coupon-banner unlocked compact">
                <div class="coupon-eyebrow">▸ YOUR 50% COUPON IS READY</div>
                <div class="coupon-code-row">
                  <code class="coupon-code">${escText(existingCoupon.code)}</code>
                  <button class="btn btn-ghost coupon-copy" data-code="${escAttr(existingCoupon.code)}" type="button">⧉ COPY</button>
                </div>
                <div class="coupon-fine">Auto-applied at checkout. Valid until ${escText(new Date(existingCoupon.expiresAt).toLocaleDateString())}.</div>
              </div>`
            : eligibleLoyalty
            ? `<div class="coupon-banner">
                <div class="coupon-eyebrow">▸ YOU JUST UNLOCKED A 50% COUPON</div>
                <div class="coupon-msg">Submit a 4★+ review from the menu and we'll auto-issue it.</div>
              </div>`
            : ''
        }

        <div class="paywall-opts">
          ${PLANS.map(
            (p) => `
            <button class="paywall-opt ${p.tone}${p.featured ? ' featured' : ''}"
              data-action="${escAttr(p.action)}" data-plan="${escAttr(p.id)}" type="button">
              <div class="paywall-opt-left">
                <div class="paywall-opt-label">${escText(p.label)}</div>
                <div class="paywall-opt-sub">${escText(p.sub)}</div>
              </div>
              <div class="paywall-opt-right">
                <div class="paywall-opt-price">${escText(p.price)}</div>
                <div class="paywall-opt-cta">${escText(p.cta)} ▸</div>
              </div>
            </button>`
          ).join('')}
        </div>

        <div class="paywall-coupon-input">
          <input type="text" id="paywall-coupon" placeholder="Have a coupon code? LAUNCH50, STUDENT80..." autocomplete="off" maxlength="32" />
          <button class="btn btn-ghost" id="paywall-redeem" type="button">▸ REDEEM</button>
        </div>
        <div class="paywall-redeem-status" id="paywall-redeem-status" aria-live="polite"></div>

        <div class="paywall-foot">
          <div class="paywall-foot-line">
            ▸ Already a member? <a href="/login?next=${escAttr(location.hash || '/app')}">Sign in →</a>
          </div>
          <div class="paywall-foot-fine">
            Guest exports used: <b>${exportCount}</b> · Refund policy on <a href="/refund">/refund</a> · Payments via Razorpay (UPI/Cards/Netbanking/Wallets)
          </div>
        </div>
      </div>
    `

    bg.classList.add('show')

    /* ─── interactions ─── */
    function close(allow) {
      bg.classList.remove('show')
      setTimeout(() => {
        bg.remove()
        if (allow && typeof onAllow === 'function') onAllow()
      }, 220)
    }
    bg.querySelector('.paywall-close').addEventListener('click', () => close(false))
    bg.addEventListener('click', (e) => { if (e.target === bg) close(false) })

    bg.querySelectorAll('.coupon-copy').forEach((b) =>
      b.addEventListener('click', () => {
        if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.code)
        b.textContent = '✓ COPIED'
        setTimeout(() => (b.textContent = '⧉ COPY'), 1500)
      })
    )

    bg.querySelectorAll('.paywall-opt').forEach((btn) =>
      btn.addEventListener('click', () => {
        const a = btn.dataset.action
        if (a === 'signin') {
          location.href = '/login?next=' + encodeURIComponent(location.hash || '/app')
          return
        }
        if (a.startsWith('buy:')) {
          const planId = a.split(':')[1]
          startCheckout(planId, close)
        }
      })
    )

    const couponInput = bg.querySelector('#paywall-coupon')
    const couponBtn = bg.querySelector('#paywall-redeem')
    const couponStatus = bg.querySelector('#paywall-redeem-status')
    couponBtn.addEventListener('click', () => {
      const code = couponInput.value.trim().toUpperCase()
      if (!code) { couponStatus.textContent = 'Enter a code first.'; return }
      const C = root.HKForge && root.HKForge.Coupon
      if (!C) { couponStatus.textContent = 'Coupon engine unavailable.'; return }
      const r = C.validateCode(code)
      if (!r.ok) {
        couponStatus.className = 'paywall-redeem-status err'
        couponStatus.textContent =
          r.reason === 'not_found' ? 'Code not recognized.' :
          r.reason === 'used' ? 'Code already used.' :
          r.reason === 'expired' ? 'Code expired.' :
          'Invalid code.'
        return
      }
      couponStatus.className = 'paywall-redeem-status ok'
      couponStatus.textContent = `✓ ${r.coupon.percentOff}% off applied. Pick a plan to continue.`
      // Annotate state so the next plan click uses the discount
      bg._activeCoupon = r.coupon
    })

    couponInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); couponBtn.click() }
    })
  }

  /* ─────── Razorpay checkout (graceful fallback if not loaded) ─────── */
  function startCheckout(planId, close) {
    const amounts = { day: 4900, monthly: 24900, yearly: 249900 } // paise
    const labels = { day: 'Day Pass', monthly: 'All-Access Monthly', yearly: 'All-Access Yearly' }
    const amt = amounts[planId]
    if (!amt) { close(false); return }

    // If Razorpay is not yet present, fall back to the pricing page
    // (server-side order creation lives in monorepo apps/api).
    if (typeof root.Razorpay !== 'function') {
      const next = encodeURIComponent(location.hash || '/app')
      location.href = `/pricing?plan=${encodeURIComponent(planId)}&next=${next}`
      return
    }

    fetch('/api/billing/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, currency: 'INR' }),
    })
      .then((r) => r.json())
      .then((order) => {
        const opts = {
          key: order.key,
          amount: amt,
          currency: 'INR',
          name: 'Yahavi Forge',
          description: labels[planId],
          order_id: order.id,
          handler: (resp) => {
            // Verify on server then unlock
            fetch('/api/billing/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(resp),
            })
              .then((r) => r.json())
              .then((v) => {
                if (v.ok) {
                  setUnlockedSession(planId, planId === 'day' ? 24 : planId === 'monthly' ? 24 * 30 : 24 * 365)
                  close(true)
                } else close(false)
              })
              .catch(() => close(false))
          },
          theme: { color: '#ff2e63' },
          modal: { ondismiss: () => close(false) },
        }
        new root.Razorpay(opts).open()
      })
      .catch(() => {
        // If the API isn't reachable, send to pricing as a graceful fallback
        const next = encodeURIComponent(location.hash || '/app')
        location.href = `/pricing?plan=${encodeURIComponent(planId)}&next=${next}`
      })
  }

  /** Wrap any export action. Pass {action, onAllow} — if user is unlocked,
   *  onAllow runs immediately. Otherwise the paywall shows; on success, onAllow runs. */
  function guard({ action, onAllow }) {
    if (hasUnlockedSession()) {
      // Even unlocked users bump the count so we can show stats
      try {
        const C = root.HKForge && root.HKForge.Coupon
        if (C) C.bumpExportCount()
      } catch {}
      onAllow && onAllow()
      return
    }
    open({ action, onAllow })
  }

  root.HKForge = root.HKForge || {}
  root.HKForge.Paywall = { open, guard, isSignedIn, hasUnlockedSession, setUnlockedSession }
})(window)
