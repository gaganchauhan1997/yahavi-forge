/* ============================================================
   YAHAVI FORGE — Cookie Consent Banner (v5)
   Shows on first visit. Stores choice in localStorage.
   "Accept All" — analytics + functional cookies allowed.
   "Essential Only" — only strictly necessary storage.
   ============================================================ */
(function () {
  'use strict'

  const KEY = 'yahavi-forge-cookie-consent'
  const ACCEPTED = 'all'
  const ESSENTIAL = 'essential'

  function getConsent() {
    try { return localStorage.getItem(KEY) } catch { return null }
  }
  function setConsent(val) {
    try { localStorage.setItem(KEY, val) } catch {}
  }

  function dismiss(val) {
    setConsent(val)
    const b = document.getElementById('yf-cookie-bar')
    if (b) { b.classList.remove('show'); setTimeout(() => b.remove(), 400) }
    // Dispatch event so other modules can react
    window.dispatchEvent(new CustomEvent('hk:consent', { detail: { consent: val } }))
  }

  function inject() {
    if (getConsent()) return // already decided
    const bar = document.createElement('div')
    bar.id = 'yf-cookie-bar'
    bar.setAttribute('role', 'dialog')
    bar.setAttribute('aria-label', 'Cookie consent')
    bar.innerHTML = `
      <div class="ycb-inner">
        <div class="ycb-text">
          <div class="ycb-title">▸ THIS SITE USES COOKIES</div>
          <div class="ycb-body">
            We use essential cookies for theme, API keys (stored locally), and session management.
            Optional analytics help us improve Forge. Your AI keys <strong>never</strong> leave your device.
            See our <a href="/cookies" target="_blank">Cookie Policy</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.
          </div>
        </div>
        <div class="ycb-btns">
          <button class="ycb-btn ycb-essential" id="ycb-essential" type="button">Essential Only</button>
          <button class="ycb-btn ycb-accept" id="ycb-accept" type="button">▸ ACCEPT ALL</button>
        </div>
      </div>
    `
    document.body.appendChild(bar)
    requestAnimationFrame(() => bar.classList.add('show'))

    document.getElementById('ycb-accept').addEventListener('click', () => dismiss(ACCEPTED))
    document.getElementById('ycb-essential').addEventListener('click', () => dismiss(ESSENTIAL))
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject)
  } else {
    inject()
  }

  // Expose for settings page
  window.HKConsent = { getConsent, setConsent, ACCEPTED, ESSENTIAL }
})()
