/* ============================================================
   YAHAVI FORGE — UI orchestration
   Sidebar nav · routing · keys drawer · toast.
   ============================================================ */
(function (root) {
  'use strict'
  const F = root.HKForge
  const $ = (sel, r = document) => r.querySelector(sel)
  const $$ = (sel, r = document) => [...r.querySelectorAll(sel)]
  const escAttr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  const escText = (s) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  /* ─────── toast ─────── */
  let toastTimer
  function toast(msg, type) {
    const t = $('#toast')
    if (!t) return
    t.textContent = msg
    t.className = 'toast show ' + (type || '')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (t.className = 'toast ' + (type || '')), 3200)
  }

  /* ─────── sidebar ─────── */
  function renderSidebar() {
    const nav = $('#sidebar .sidebar-tabs')
    if (!nav) return
    const groups = F.SIDEBAR.map((g) => {
      if (g.id === 'home') {
        const t = F.TOOLS.home
        return `<button class="nav-tab" data-tool="home">${escText(t.icon || '▸')} HOME</button>`
      }
      const items = g.items
        .map((id) => {
          const t = F.TOOLS[id]
          if (!t) return ''
          return `<button class="nav-tab" data-tool="${escAttr(id)}" title="${escAttr(t.subtitle)}">${escText(
            t.icon || '▸'
          )} ${escText(t.title.toUpperCase())}</button>`
        })
        .join('')
      return `<div class="sidebar-group">
        <div class="sidebar-group-label">▸ ${escText(g.label)}</div>
        ${items}
      </div>`
    }).join('')

    // v3: append My Account + Resources sections + KEYS button pinned at bottom
    const accountSection = `
      <div class="sidebar-section">
        <div class="sidebar-group-label">▸ My Account</div>
        <ul class="sidebar-foot-links">
          <li><a href="#/profile" data-link="profile">👤 Profile</a></li>
          <li><a href="#/settings" data-link="settings">⚙ Settings</a></li>
          <li><a href="/#pricing" data-link="pricing">💎 Pricing</a></li>
        </ul>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-group-label">▸ Resources</div>
        <ul class="sidebar-foot-links">
          <li><a href="/#tutorial" data-link="help">📘 Tutorial</a></li>
          <li><a href="mailto:team@hackknow.com">✉ team@hackknow.com</a></li>
          <li><a href="/terms">📜 Terms</a></li>
          <li><a href="/privacy">🔒 Privacy</a></li>
        </ul>
      </div>
      <div class="sidebar-section" style="border-top:none;padding-top:0;">
        <button class="sidebar-keys" id="sidebar-keys-btn" type="button" aria-label="Open API keys panel">
          <span class="key-dot"></span>
          <span class="sidebar-keys-label">▸ API KEYS — ADD ONE</span>
        </button>
        <div class="brightness-row">
          <span>☀</span>
          <input type="range" id="brightness-slider" min="0.6" max="1.3" step="0.05" value="1" aria-label="Brightness" />
          <span>◐</span>
        </div>
      </div>
    `
    nav.innerHTML = groups + accountSection
    nav.querySelectorAll('.nav-tab[data-tool]').forEach((b) =>
      b.addEventListener('click', () => go(b.dataset.tool))
    )
    const kBtn = $('#sidebar-keys-btn', nav)
    if (kBtn) kBtn.addEventListener('click', openDrawer)
    updateSidebarKeysState()
    if (window.HKForge && window.HKForge.theme && window.HKForge.theme.init) window.HKForge.theme.init()
  }

  function updateSidebarKeysState() {
    const btn = $('#sidebar-keys-btn')
    if (!btn) return
    const n = F.state.activeKeyCount()
    btn.classList.toggle('has-keys', n > 0)
    const label = btn.querySelector('.sidebar-keys-label')
    if (label) label.textContent = n === 0 ? '▸ API KEYS — ADD ONE' : `▸ ${n} KEY${n > 1 ? 'S' : ''} ACTIVE`
  }

  /* ─────── routing (URL hash) ─────── */
  function go(id) {
    if (!F.TOOLS[id]) id = 'home'
    F.state.patchPrefs({ lastTool: id })
    if (location.hash !== '#/' + id) location.hash = '#/' + id
    setActive(id)
    const mount = $('#tool-mount')
    if (!mount) return
    if (id === 'home') F.runner.renderHome(mount)
    else F.runner.renderTool(mount, id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Close mobile drawer
    $('#sidebar')?.classList.remove('open')
    $('#sidebar-overlay')?.classList.remove('open')
  }
  function setActive(id) {
    $$('#sidebar .nav-tab').forEach((b) => b.classList.toggle('active', b.dataset.tool === id))
  }
  function currentFromHash() {
    const m = (location.hash || '').match(/^#\/(\w[\w-]*)$/)
    return m ? m[1] : null
  }

  /* ─────── keys drawer ─────── */
  function renderProviderCards() {
    const list = $('#provider-list')
    if (!list) return
    const keys = F.state.loadKeys()
    list.innerHTML = Object.entries(F.PROVIDERS)
      .map(([id, p]) => {
        const has = !!keys[id]
        return `
        <div class="provider-card">
          <div class="provider-head">
            <div class="provider-name">${escText(p.name)}</div>
            <div class="provider-pill ${has ? '' : 'empty'}">${has ? 'CONFIGURED' : 'EMPTY'}</div>
          </div>
          <div class="provider-body">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--ink-faint);letter-spacing:.04em;margin-bottom:8px;">${escText(
              p.note
            )}</div>
            <input type="password" data-provider="${escAttr(id)}" placeholder="${escAttr(
              p.keyHint
            )}" value="${escAttr(keys[id] || '')}" autocomplete="off" />
            <a class="provider-link" href="${escAttr(
              p.keyUrl
            )}" target="_blank" rel="noopener noreferrer">▸ get free key</a>
          </div>
        </div>`
      })
      .join('')
    list.querySelectorAll('input[data-provider]').forEach((inp) => {
      let timer
      inp.addEventListener('input', () => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          F.state.setKey(inp.dataset.provider, inp.value)
          updateConnectionStatus()
          inp.parentElement.parentElement.querySelector('.provider-pill').textContent = inp.value.trim()
            ? 'CONFIGURED'
            : 'EMPTY'
          inp.parentElement.parentElement.querySelector('.provider-pill').classList.toggle('empty', !inp.value.trim())
        }, 200)
      })
    })
  }

  function updateConnectionStatus() {
    const n = F.state.activeKeyCount()
    updateSidebarKeysState()
    const el = $('#connection-status')
    if (!el) return
    if (n === 0) {
      el.className = 'status-pill'
      el.innerHTML = '<span class="dot"></span>NO KEYS — ADD ONE'
    } else {
      el.className = 'status-pill connected'
      el.innerHTML = `<span class="dot"></span>${n} KEY${n > 1 ? 'S' : ''} ACTIVE`
    }
  }

  function openDrawer() {
    $('#drawer')?.classList.add('open')
    $('#drawer-overlay')?.classList.add('open')
    renderProviderCards()
  }
  function closeDrawer() {
    $('#drawer')?.classList.remove('open')
    $('#drawer-overlay')?.classList.remove('open')
  }

  /* ─────── bootstrap ─────── */
  function init() {
    renderSidebar()
    $('#btn-open-settings')?.addEventListener('click', openDrawer)
    $('#drawer-close')?.addEventListener('click', closeDrawer)
    $('#drawer-overlay')?.addEventListener('click', closeDrawer)
    $('#nav-burger')?.addEventListener('click', () => {
      $('#sidebar')?.classList.add('open')
      $('#sidebar-overlay')?.classList.add('open')
    })
    $('#sidebar-overlay')?.addEventListener('click', () => {
      $('#sidebar')?.classList.remove('open')
      $('#sidebar-overlay')?.classList.remove('open')
    })

    updateConnectionStatus()
    const start = currentFromHash() || F.state.loadPrefs().lastTool || 'home'
    go(start)
    window.addEventListener('hashchange', () => {
      const id = currentFromHash()
      if (id && id !== F.state.loadPrefs().lastTool) go(id)
    })

    if (F.state.activeKeyCount() === 0) {
      setTimeout(() => toast('▸ Add a free API key to start forging', ''), 800)
    }
  }

  root.HKForge = root.HKForge || {}
  root.HKForge.UI = { init, go, toast, openDrawer, closeDrawer, updateConnectionStatus }
})(window)
