/* ============================================================
   YAHAVI FORGE — Loyalty Coupon Engine (v5)
   Tracks chat duration, review state, and issues 50%-off coupons
   ONCE per user (per device). Server-managed DB-side too once
   Supabase is back up — see api/coupons in monorepo.

   localStorage keys:
     yahavi-forge-chat-seconds  (counter, incremented while chatbot is open)
     yahavi-forge-review-state  ({rating, comment, submittedAt, positive})
     yahavi-forge-coupons       (array of issued codes)
     yahavi-forge-export-count  (guest export attempts)

   Coupon issue conditions (must satisfy ALL):
     1. Chat duration >= 20 minutes  (1200 seconds)
     2. Review rating >= 4 (positive)
     3. No prior LOYALTY50 coupon issued to this device
   ============================================================ */
(function (root) {
  'use strict'

  const NS = 'yahavi-forge'
  const KEY_CHAT     = NS + '-chat-seconds'
  const KEY_REVIEW   = NS + '-review-state'
  const KEY_COUPONS  = NS + '-coupons'
  const KEY_EXPORTS  = NS + '-export-count'
  const KEY_LAST_BUMP = NS + '-chat-last-bump'

  const MIN_CHAT_SECONDS = 20 * 60 // 20 minutes
  const MIN_REVIEW_STARS = 4        // 4 or 5 = positive

  /* ─────── safe storage helpers ─────── */
  function readJSON(k, fallback) {
    try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback)) } catch { return fallback }
  }
  function writeJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
  }
  function readNum(k) { return Number(localStorage.getItem(k) || 0) || 0 }
  function writeNum(k, v) { try { localStorage.setItem(k, String(v)) } catch {} }

  /* ─────── chat duration tracking (passive — chatbot.js untouched) ─────── */
  // We watch #yahavi-chat for the .open class via MutationObserver so chatbot.js
  // doesn't need any modification. When the panel is open, we tick every 3 seconds.
  // Ticks pause on hidden tabs (document.hidden check).
  const TICK_MS = 3000
  let _chatTick = null
  let _observerBooted = false

  function _startTick() {
    if (_chatTick) return
    _chatTick = setInterval(function () {
      if (document.hidden) return
      const cur = readNum(KEY_CHAT)
      writeNum(KEY_CHAT, cur + (TICK_MS / 1000))
    }, TICK_MS)
  }
  function _stopTick() {
    if (_chatTick) { clearInterval(_chatTick); _chatTick = null }
  }
  function _bootObserver() {
    if (_observerBooted) return
    _observerBooted = true
    // Wait until DOM is ready, then watch for the chat panel appearing
    function attach() {
      const panel = document.getElementById('yahavi-chat')
      if (panel) {
        // Panel already exists — observe class mutations
        const obs = new MutationObserver(function (mutations) {
          for (const m of mutations) {
            if (m.attributeName === 'class') {
              panel.classList.contains('open') ? _startTick() : _stopTick()
            }
          }
        })
        obs.observe(panel, { attributes: true })
        return
      }
      // Panel not yet built — watch body for its insertion, then re-attach
      const bodyObs = new MutationObserver(function (_, obs) {
        const p = document.getElementById('yahavi-chat')
        if (p) { obs.disconnect(); _observerBooted = false; attach() }
      })
      bodyObs.observe(document.body, { childList: true, subtree: false })
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach)
    } else {
      // Chatbot panel is created lazily on first click — defer slightly
      setTimeout(attach, 800)
    }
  }

  // Boot the observer as soon as coupon.js loads
  _bootObserver()

  function bumpChatSeconds(deltaSec) {
    // Kept for any future direct caller; the observer handles normal tracking.
    const d = Math.min(Math.max(0, Number(deltaSec) || 0), TICK_MS / 1000 + 1)
    if (!d) return
    writeNum(KEY_CHAT, readNum(KEY_CHAT) + d)
  }
  function getChatSeconds() { return readNum(KEY_CHAT) }
  function getChatMinutes() { return Math.floor(getChatSeconds() / 60) }

  /* ─────── review state ─────── */
  function getReviewState() {
    return readJSON(KEY_REVIEW, null)
  }
  function saveReviewState(rating, comment) {
    const r = Math.max(1, Math.min(5, Number(rating) || 0))
    const state = {
      rating: r,
      comment: String(comment || '').slice(0, 2000),
      submittedAt: new Date().toISOString(),
      positive: r >= MIN_REVIEW_STARS,
    }
    writeJSON(KEY_REVIEW, state)
    return state
  }
  function hasPositiveReview() {
    const s = getReviewState()
    return !!(s && s.positive)
  }

  /* ─────── coupon issuance ─────── */
  function getCoupons() {
    return readJSON(KEY_COUPONS, [])
  }
  function hasCoupon(type) {
    return getCoupons().some((c) => c && c.type === type)
  }
  function generateCode(prefix) {
    // 4-letter prefix + 8-char random suffix
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let s = ''
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
    return `${prefix}-${s}`
  }
  function issueLoyaltyCoupon() {
    if (hasCoupon('LOYALTY50')) {
      return { ok: false, reason: 'already_issued', existing: getCoupons().find((c) => c.type === 'LOYALTY50') }
    }
    const code = generateCode('LOY50')
    const coupon = {
      code,
      type: 'LOYALTY50',
      percentOff: 50,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      usedAt: null,
      conditions: {
        chatMinutes: getChatMinutes(),
        reviewRating: (getReviewState() || {}).rating || 0,
      },
    }
    const list = getCoupons()
    list.push(coupon)
    writeJSON(KEY_COUPONS, list)
    return { ok: true, coupon }
  }

  /** Returns { eligible: bool, reasons: [missing-condition strings] } */
  function checkLoyaltyEligibility() {
    const reasons = []
    const chatSec = getChatSeconds()
    if (chatSec < MIN_CHAT_SECONDS) {
      reasons.push(`chat_${MIN_CHAT_SECONDS - chatSec}s_more`)
    }
    if (!hasPositiveReview()) {
      reasons.push('review_4plus_required')
    }
    if (hasCoupon('LOYALTY50')) {
      reasons.push('already_issued')
    }
    return { eligible: reasons.length === 0, reasons }
  }

  /** Validate a coupon code the user types in the paywall.
   *  Returns { ok, coupon } or { ok: false, reason }. */
  function validateCode(code) {
    const c = String(code || '').trim().toUpperCase()
    if (!c) return { ok: false, reason: 'empty' }
    const found = getCoupons().find((x) => x && x.code === c)
    if (!found) {
      // Universal first-week launch code (kept in sync with server)
      if (c === 'LAUNCH50') {
        return { ok: true, coupon: { code: 'LAUNCH50', type: 'LAUNCH', percentOff: 50, public: true } }
      }
      if (c === 'STUDENT80') {
        return { ok: true, coupon: { code: 'STUDENT80', type: 'STUDENT', percentOff: 80, requiresProof: true } }
      }
      return { ok: false, reason: 'not_found' }
    }
    if (found.usedAt) return { ok: false, reason: 'used' }
    if (found.expiresAt && new Date(found.expiresAt) < new Date()) return { ok: false, reason: 'expired' }
    return { ok: true, coupon: found }
  }

  function markCouponUsed(code) {
    const list = getCoupons()
    const idx = list.findIndex((x) => x.code === code)
    if (idx >= 0) {
      list[idx].usedAt = new Date().toISOString()
      writeJSON(KEY_COUPONS, list)
      return true
    }
    return false
  }

  /* ─────── export attempt tracking (for paywall) ─────── */
  function bumpExportCount() {
    const c = readNum(KEY_EXPORTS) + 1
    writeNum(KEY_EXPORTS, c)
    return c
  }
  function getExportCount() { return readNum(KEY_EXPORTS) }

  /* ─────── public API ─────── */
  root.HKForge = root.HKForge || {}
  root.HKForge.Coupon = {
    // chat tracking
    bumpChatSeconds,
    getChatSeconds,
    getChatMinutes,
    MIN_CHAT_SECONDS,

    // reviews
    saveReviewState,
    getReviewState,
    hasPositiveReview,
    MIN_REVIEW_STARS,

    // coupons
    getCoupons,
    hasCoupon,
    issueLoyaltyCoupon,
    checkLoyaltyEligibility,
    validateCode,
    markCouponUsed,

    // exports
    bumpExportCount,
    getExportCount,
  }
})(window)
