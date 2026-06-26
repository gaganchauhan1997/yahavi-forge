/* ============================================================
   YAHAVI FORGE — theme + brightness
   --------------------------------------------------------------
   3 themes (paper / dark / dim) + brightness slider.
   Persisted in localStorage. Respects prefers-color-scheme on first load.
   ============================================================ */
(function (root) {
  'use strict'
  const KEY = 'yahavi-forge-theme'
  const BRIGHT_KEY = 'yahavi-forge-brightness'
  const THEMES = ['paper', 'dark', 'dim']

  function getStored() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null')
    } catch {
      return null
    }
  }
  function setStored(theme) {
    try {
      localStorage.setItem(KEY, JSON.stringify(theme))
    } catch {}
  }
  function getBrightness() {
    const v = parseFloat(localStorage.getItem(BRIGHT_KEY) || '1')
    return Number.isFinite(v) && v >= 0.6 && v <= 1.3 ? v : 1
  }
  function setBrightness(v) {
    v = Math.max(0.6, Math.min(1.3, v))
    localStorage.setItem(BRIGHT_KEY, String(v))
    document.documentElement.style.setProperty('--theme-brightness', String(v))
    document.documentElement.style.filter = v === 1 ? '' : `brightness(${v})`
  }

  function apply(theme) {
    if (!THEMES.includes(theme)) theme = 'paper'
    document.documentElement.setAttribute('data-theme', theme)
    setStored(theme)
    // Update toggle button icon if present
    const btn = document.getElementById('theme-toggle')
    if (btn) {
      btn.dataset.theme = theme
      btn.setAttribute('aria-label', `Theme: ${theme} (click to switch)`)
      btn.innerHTML = ICONS[theme] || ICONS.paper
    }
  }

  const ICONS = {
    paper: '☀',
    dim: '◐',
    dark: '☾',
  }

  function next(theme) {
    return THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]
  }

  function init() {
    let theme = getStored()
    if (!theme) {
      // First visit — respect OS preference
      const dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      theme = dark ? 'dark' : 'paper'
    }
    apply(theme)
    setBrightness(getBrightness())

    // Wire the toggle button if it exists
    const btn = document.getElementById('theme-toggle')
    if (btn && !btn.dataset.wired) {
      btn.dataset.wired = '1'
      btn.addEventListener('click', () => apply(next(document.documentElement.getAttribute('data-theme') || 'paper')))
    }
    // Wire the brightness slider if it exists
    const sl = document.getElementById('brightness-slider')
    if (sl) {
      sl.value = String(getBrightness())
      sl.addEventListener('input', (e) => setBrightness(parseFloat(e.target.value)))
    }
  }

  // Apply immediately to prevent flash
  let initial = getStored()
  if (!initial) {
    initial = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'paper'
  }
  document.documentElement.setAttribute('data-theme', initial)

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }

  root.HKForge = root.HKForge || {}
  root.HKForge.theme = { apply, next, init }
})(window)
