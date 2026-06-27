/* ============================================================
   YAHAVI FORGE — Review modal (v5)
   Star rating + comment + optional share row.
   On positive review (4-5 stars) AND 20+ min of chat,
   auto-issues a 50% loyalty coupon (LOYALTY50) — once per device.
   ============================================================ */
(function (root) {
  'use strict'

  const escText = (s) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const escAttr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')

  function ensureBg() {
    let bg = document.getElementById('rev-modal-bg')
    if (bg) return bg
    bg = document.createElement('div')
    bg.id = 'rev-modal-bg'
    bg.className = 'rev-modal-bg'
    bg.setAttribute('role', 'dialog')
    bg.setAttribute('aria-modal', 'true')
    document.body.appendChild(bg)
    return bg
  }

  function open({ trigger } = {}) {
    const bg = ensureBg()
    const Coupon = root.HKForge && root.HKForge.Coupon
    const chatMin = Coupon ? Coupon.getChatMinutes() : 0
    const remaining = Math.max(0, 20 - chatMin)
    const eligibleAfterReview = chatMin >= 20 && !(Coupon && Coupon.hasCoupon('LOYALTY50'))

    bg.innerHTML = `
      <div class="rev-modal" role="document">
        <button class="rev-close" type="button" aria-label="Close review">×</button>
        <div class="rev-eyebrow">▸ HOW WAS IT?</div>
        <h2 class="rev-h">Rate Yahavi Forge</h2>
        <p class="rev-sub">Your honest feedback helps us build better tools for everyone.</p>

        <div class="rev-stars" role="radiogroup" aria-label="Rating">
          ${[1, 2, 3, 4, 5]
            .map(
              (n) =>
                `<button type="button" data-star="${n}" aria-label="${n} star${n > 1 ? 's' : ''}">★</button>`
            )
            .join('')}
        </div>
        <div class="rev-stars-label" id="rev-stars-label">Tap a star to rate</div>

        <label class="rev-comment-label" for="rev-comment">What worked? What didn't?</label>
        <textarea id="rev-comment" class="rev-comment" rows="4"
          placeholder="A line or two — anything from speed to typography to a tool that nailed it."
          maxlength="2000"></textarea>

        ${
          eligibleAfterReview
            ? `<div class="coupon-banner" id="rev-coupon-tease">
                <div class="coupon-eyebrow">▸ LOYALTY UNLOCK READY</div>
                <div class="coupon-msg">
                  You've chatted ${chatMin} min. Drop a 4★+ review and we'll auto-issue a
                  <b>50% OFF coupon</b> — usable on any plan.
                </div>
              </div>`
            : remaining > 0
            ? `<div class="coupon-banner muted">
                <div class="coupon-eyebrow">▸ ${remaining} MIN AWAY FROM 50% OFF</div>
                <div class="coupon-msg">
                  Chat with the AI assistant for ${remaining} more minute${remaining > 1 ? 's' : ''} +
                  leave a 4★+ review to unlock a one-time 50% coupon.
                </div>
              </div>`
            : ''
        }

        <div class="rev-share-row" id="rev-share-row" hidden>
          <div class="rev-share-eyebrow">▸ SHARE THE LOVE (OPTIONAL)</div>
          <div class="rev-share-btns">
            <button type="button" class="rev-share-btn" data-share="twitter">𝕏 / Twitter</button>
            <button type="button" class="rev-share-btn" data-share="linkedin">in LinkedIn</button>
            <button type="button" class="rev-share-btn" data-share="copy">⧉ Copy link</button>
          </div>
        </div>

        <div class="rev-actions">
          <button class="btn btn-ghost" id="rev-cancel" type="button">▸ MAYBE LATER</button>
          <button class="btn btn-primary" id="rev-submit" type="button" disabled>▸ SUBMIT REVIEW</button>
        </div>
      </div>
    `

    bg.classList.add('show')

    // ─── interactions ───
    let rating = 0
    const stars = bg.querySelectorAll('.rev-stars button[data-star]')
    const label = bg.querySelector('#rev-stars-label')
    const submitBtn = bg.querySelector('#rev-submit')
    const shareRow = bg.querySelector('#rev-share-row')
    const commentEl = bg.querySelector('#rev-comment')

    const labels = ['Tap a star to rate', 'Brutal', 'Meh', 'OK', 'Great', 'Loved it']
    function paintStars() {
      stars.forEach((s) =>
        s.classList.toggle('lit', Number(s.dataset.star) <= rating)
      )
      label.textContent = labels[rating] || labels[0]
      submitBtn.disabled = rating === 0
      shareRow.hidden = rating < 4
    }
    stars.forEach((s) =>
      s.addEventListener('click', () => {
        rating = Number(s.dataset.star)
        paintStars()
      })
    )

    bg.querySelectorAll('.rev-share-btn').forEach((b) =>
      b.addEventListener('click', () => {
        const t =
          'Just rated Yahavi Forge — free AI Career OS by HackKnow. 17 tools, BYOK, no subscription tax: '
        const url = 'https://forge.hackknow.com'
        const action = b.dataset.share
        if (action === 'twitter') {
          window.open(
            'https://twitter.com/intent/tweet?text=' +
              encodeURIComponent(t) +
              '&url=' +
              encodeURIComponent(url),
            '_blank',
            'noopener'
          )
        } else if (action === 'linkedin') {
          window.open(
            'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url),
            '_blank',
            'noopener'
          )
        } else if (action === 'copy') {
          if (navigator.clipboard) navigator.clipboard.writeText(url)
          b.textContent = '✓ Copied'
          setTimeout(() => (b.textContent = '⧉ Copy link'), 1500)
        }
      })
    )

    function close() {
      bg.classList.remove('show')
      setTimeout(() => bg.remove(), 220)
    }
    bg.querySelector('.rev-close').addEventListener('click', close)
    bg.querySelector('#rev-cancel').addEventListener('click', close)
    bg.addEventListener('click', (e) => { if (e.target === bg) close() })

    submitBtn.addEventListener('click', () => {
      const comment = commentEl.value.trim()
      const C = root.HKForge && root.HKForge.Coupon
      if (C) C.saveReviewState(rating, comment)

      // Optional: POST to a public review-collector endpoint when one is wired.
      // We deliberately don't block on it.
      try {
        fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, comment, source: trigger || 'manual', ts: Date.now() }),
          keepalive: true,
        }).catch(() => {})
      } catch {}

      // Check loyalty coupon eligibility AFTER review is saved
      let coupon = null
      if (C) {
        const elig = C.checkLoyaltyEligibility()
        if (elig.eligible) {
          const r = C.issueLoyaltyCoupon()
          if (r.ok) coupon = r.coupon
        } else if (elig.reasons.includes('already_issued')) {
          coupon = C.getCoupons().find((c) => c.type === 'LOYALTY50') || null
        }
      }

      // Replace modal with thank-you view
      bg.innerHTML = `
        <div class="rev-modal" role="document">
          <button class="rev-close" type="button" aria-label="Close">×</button>
          <div class="rev-eyebrow">▸ THANK YOU</div>
          <h2 class="rev-h">${rating >= 4 ? "You're amazing." : 'Heard, loud and clear.'}</h2>
          <p class="rev-sub">
            ${
              rating >= 4
                ? "We'll keep shipping. Tell a friend and you've changed someone's career trajectory."
                : "We'll act on this. Drop us a line at team@hackknow.com if there's something specific we can fix."
            }
          </p>
          ${
            coupon
              ? `<div class="coupon-banner unlocked">
                  <div class="coupon-eyebrow">▸ LOYALTY 50% OFF — UNLOCKED</div>
                  <div class="coupon-code-row">
                    <code class="coupon-code" id="coupon-code-display">${escText(coupon.code)}</code>
                    <button class="btn btn-ghost coupon-copy" data-code="${escAttr(coupon.code)}" type="button">⧉ COPY</button>
                  </div>
                  <div class="coupon-fine">
                    Auto-applied when you check out. Valid 30 days. One-time use.
                  </div>
                </div>`
              : ''
          }
          <div class="rev-actions">
            <button class="btn btn-primary" id="rev-done" type="button">▸ BACK TO WORK</button>
          </div>
        </div>
      `
      bg.querySelector('.rev-close').addEventListener('click', close)
      bg.querySelector('#rev-done').addEventListener('click', close)
      const copyBtn = bg.querySelector('.coupon-copy')
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          if (navigator.clipboard) navigator.clipboard.writeText(copyBtn.dataset.code)
          copyBtn.textContent = '✓ COPIED'
          setTimeout(() => (copyBtn.textContent = '⧉ COPY'), 1600)
        })
      }
    })
  }

  /** Should-we-prompt-for-review heuristic.
   *  Returns true after the user has used the app for ~5 min of chat
   *  OR completed ≥1 export, AND hasn't reviewed in the last 30 days. */
  function shouldPrompt() {
    const C = root.HKForge && root.HKForge.Coupon
    if (!C) return false
    const last = C.getReviewState()
    if (last && Date.now() - new Date(last.submittedAt).getTime() < 30 * 24 * 60 * 60 * 1000) return false
    if (C.getChatMinutes() >= 5) return true
    if (C.getExportCount() >= 1) return true
    return false
  }

  root.HKForge = root.HKForge || {}
  root.HKForge.Review = { open, shouldPrompt }
})(window)
