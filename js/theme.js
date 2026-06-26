/* ============================================================
   YAHAVI FORGE — theme engine (v5)
   10 themes + brightness. Persisted in localStorage.
   Toggle button cycles through top-3 picks.
   ============================================================ */
(function (root) {
  'use strict'

  const KEY       = 'yahavi-forge-theme'
  const BRIGHT_KEY = 'yahavi-forge-brightness'

  /* All available themes */
  const THEMES = [
    'cyber-yellow',   // 1 — HackKnow brand (default)
    'matrix',         // 2 — Matrix Hacker
    'synthwave',      // 3 — Synthwave
    'tokyo',          // 4 — Tokyo Night
    'dracula',        // 5 — Dracula
    'github-dark',    // 6 — GitHub Dark
    'amber',          // 7 — Amber Terminal
    'neo-mint',       // 8 — Neo Mint
    'crimson',        // 9 — Crimson Forge
    'arctic',         // 10 — Arctic Glass
    // Legacy aliases kept for backward compat:
    'paper', 'dim', 'dark',
  ]

  /* Top-3 cycle for the nav toggle button */
  const CYCLE = ['cyber-yellow', 'matrix', 'tokyo']

  /* Theme metadata for the picker UI */
  const META = {
    'cyber-yellow': { label: '⭐ Cyber Yellow', bg: '#F5F0E6', primary: '#FFD400', accent: '#FF2E63', text: '#111111', feel: 'HackKnow Identity' },
    'matrix':       { label: '🟩 Matrix Hacker', bg: '#0B0F0C', primary: '#39FF14', accent: '#00D9FF', text: '#F5F5F5', feel: 'Hacker Terminal' },
    'synthwave':    { label: '🌈 Synthwave',    bg: '#1A102B', primary: '#FF2E88', accent: '#00E5FF', text: '#FFFFFF', feel: 'Future Retro' },
    'tokyo':        { label: '🌌 Tokyo Night',  bg: '#121826', primary: '#7AA2F7', accent: '#BB9AF7', text: '#E5E9F0', feel: 'Premium Tech' },
    'dracula':      { label: '🧛 Dracula',      bg: '#282A36', primary: '#BD93F9', accent: '#50FA7B', text: '#F8F8F2', feel: 'Coding Theme' },
    'github-dark':  { label: '💻 GitHub Dark', bg: '#0D1117', primary: '#58A6FF', accent: '#F85149', text: '#C9D1D9', feel: 'Professional' },
    'amber':        { label: '🟡 Amber Terminal',bg: '#111111', primary: '#FFC107', accent: '#FF9800', text: '#FFF8E1', feel: 'Old CRT Hacker' },
    'neo-mint':     { label: '🌿 Neo Mint',     bg: '#EEFDF7', primary: '#00C896', accent: '#111111', text: '#222222', feel: 'Modern Startup' },
    'crimson':      { label: '🔴 Crimson Forge',bg: '#160A0A', primary: '#FF3B30', accent: '#FFD400', text: '#FFFFFF', feel: 'Powerful AI' },
    'arctic':       { label: '❄️ Arctic Glass', bg: '#F5F8FC', primary: '#4F8EF7', accent: '#8A5CF6', text: '#111111', feel: 'Apple-like Premium' },
    'paper':        { label: '☀ Paper',         bg: '#faf6e9', primary: '#ffea00', accent: '#ff2e63', text: '#0a0a0a', feel: 'Default Light' },
    'dim':          { label: '◐ Minimal',        bg: '#f5f3eb', primary: '#ffea00', accent: '#ff2e63', text: '#1a1a1a', feel: 'Dim Light' },
    'dark':         { label: '☾ Dark',           bg: '#1a1a1f', primary: '#ffea00', accent: '#ff2e63', text: '#eef0ed', feel: 'Dark Grey' },
  }

  /* Toggle icons for nav button */
  const ICONS = {
    'cyber-yellow': '☀', 'paper': '☀', 'neo-mint': '☀', 'arctic': '☀',
    'dim': '◐',
    'dark': '☾', 'matrix': '▓', 'synthwave': '◈', 'tokyo': '◉',
    'dracula': '◆', 'github-dark': '◼', 'amber': '◉', 'crimson': '◈',
  }

  /* ─── storage helpers ─── */
  function getStored() {
    try { return localStorage.getItem(KEY) || null } catch { return null }
  }
  function setStored(t) {
    try { localStorage.setItem(KEY, t) } catch {}
  }
  function getBrightness() {
    const v = parseFloat(localStorage.getItem(BRIGHT_KEY) || '1')
    return Number.isFinite(v) && v >= 0.6 && v <= 1.3 ? v : 1
  }
  function setBrightness(v) {
    v = Math.max(0.6, Math.min(1.3, Number(v) || 1))
    try { localStorage.setItem(BRIGHT_KEY, String(v)) } catch {}
    document.documentElement.style.filter = v === 1 ? '' : `brightness(${v})`
  }

  /* ─── apply theme ─── */
  function apply(theme) {
    if (!THEMES.includes(theme)) theme = 'cyber-yellow'
    document.documentElement.setAttribute('data-theme', theme)
    setStored(theme)
    const btn = document.getElementById('theme-toggle')
    if (btn) {
      btn.textContent = ICONS[theme] || '◉'
      btn.title = META[theme] ? META[theme].label : theme
    }
    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent('hk:theme', { detail: { theme } }))
  }

  /* ─── cycle top-3 on toggle click ─── */
  function cycleNext() {
    const cur = document.documentElement.getAttribute('data-theme') || 'cyber-yellow'
    const idx = CYCLE.indexOf(cur)
    return idx >= 0 ? CYCLE[(idx + 1) % CYCLE.length] : CYCLE[0]
  }

  /* ─── init ─── */
  function init() {
    let theme = getStored()
    if (!theme || !THEMES.includes(theme)) {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ? 'matrix' : 'cyber-yellow'
    }
    apply(theme)
    setBrightness(getBrightness())

    const btn = document.getElementById('theme-toggle')
    if (btn && !btn.dataset.wired) {
      btn.dataset.wired = '1'
      btn.addEventListener('click', () => apply(cycleNext()))
    }
    const sl = document.getElementById('brightness-slider')
    if (sl) {
      sl.value = String(getBrightness())
      sl.addEventListener('input', (e) => setBrightness(parseFloat(e.target.value)))
    }
  }

  /* Apply immediately to prevent flash */
  const _initial = getStored() || (
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'matrix' : 'cyber-yellow'
  )
  document.documentElement.setAttribute('data-theme', _initial)

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }

  root.HKForge = root.HKForge || {}
  root.HKForge.theme = { apply, cycleNext, init, THEMES, META, CYCLE }
})(window)
