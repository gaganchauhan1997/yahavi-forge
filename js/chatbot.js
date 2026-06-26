/* ============================================================
   YAHAVI CHAT — soft, rounded, self-contained.
   Works on any page (landing OR app). Reads BYOK keys from
   localStorage directly so it doesn't depend on other Forge modules.
   English + Hinglish friendly.
   ============================================================ */
(function () {
  'use strict'

  const SYSTEM = `You are Yahavi — a friendly bilingual (English + Hindi/Hinglish) career assistant inside Yahavi Forge (forge.hackknow.com), made by Hackknow.

Style:
- Detect the user's language: English, Hindi (Devanagari), or Hinglish. Reply in the same register.
- Concise. Use bullets when listing.
- Warm, helpful, never preachy.

You help users with:
- Resume tips, bullet rewriting, ATS optimisation
- Picking the right tool from Forge's 17
- Career switches, gaps, interview prep, job search strategy
- Pricing & plans (see below)

Forge's 17 tools across 5 categories (link to /app#/<id> when recommending):
  BUILD: builder, bullet-upgrader, portfolio, gap, quick-achievement
  ANALYZE: ats, scan-6sec, roast
  TAILOR: tailor-jd, truth-lock, company-tailor
  OUTREACH: cover-letter, recruiter-hook, app-pack
  STRATEGY: role-finder, app-optimizer, prep

Pricing:
  • FREE: BUILD category only (5 tools), unlimited exports with a small Hackknow watermark
  • DAY PASS ₹49: all 17 tools, unlimited, no watermark, 24h
  • PER CATEGORY ₹60/mo: pick any of the 5 categories
  • ALL CATEGORIES ₹249/mo (savings vs picking all 5)
  • YEARLY ₹2499 (effective ₹208/mo, ~17% off)
  • ENTERPRISE: custom
  • STUDENT: 80% discount with marksheet upload
  • BEGINNER (job-seeking, never employed): 1 month free with grad/12th marksheet
  • LOYALTY: extra discount when following all our channels

If asked about API key safety, simply say: "Forge uses bring-your-own-key — you fetch a free Groq or Gemini key, paste it in ▸ KEYS, and the platform routes your requests to that AI. You can revoke any key from your provider's dashboard whenever you want."

Never lecture about privacy. Be warm. Help.`

  // Minimal inline provider knowledge (works without other Forge JS loaded)
  const PROVIDERS_INLINE = {
    groq: {
      name: 'Groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile',
      type: 'openai',
    },
    gemini: {
      name: 'Google Gemini',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      type: 'gemini',
    },
    openrouter: {
      name: 'OpenRouter',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      type: 'openai',
    },
  }

  function loadKeysInline() {
    try {
      return JSON.parse(localStorage.getItem('yahavi-forge-keys') || '{}') || {}
    } catch {
      return {}
    }
  }

  async function callOne(id, key, messages) {
    const p = PROVIDERS_INLINE[id]
    if (!p) throw new Error(`Unknown provider: ${id}`)
    if (p.type === 'openai') {
      const res = await fetch(p.url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: p.model, messages, temperature: 0.7, max_tokens: 1200 }),
      })
      if (!res.ok) throw new Error(`${p.name}: HTTP ${res.status}`)
      const d = await res.json()
      return { text: d.choices?.[0]?.message?.content || '', provider: p.name }
    }
    if (p.type === 'gemini') {
      const sys = messages.find((m) => m.role === 'system')
      const turns = messages.filter((m) => m.role !== 'system')
      const body = {
        contents: turns.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
      }
      if (sys) body.systemInstruction = { parts: [{ text: sys.content }] }
      const res = await fetch(`${p.url}?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`${p.name}: HTTP ${res.status}`)
      const d = await res.json()
      return { text: d.candidates?.[0]?.content?.parts?.[0]?.text || '', provider: p.name }
    }
    throw new Error(`Unsupported provider type: ${p.type}`)
  }

  async function aiCall(messages) {
    const keys = loadKeysInline()
    const order = ['groq', 'gemini', 'openrouter']
    const errors = []
    for (const id of order) {
      if (!keys[id]) continue
      try {
        return await callOne(id, keys[id], messages)
      } catch (e) {
        errors.push({ id, msg: (e && e.message) || String(e) })
      }
    }
    if (errors.length === 0) {
      const err = new Error('NO_KEYS')
      err.code = 'NO_KEYS'
      throw err
    }
    const err = new Error(errors.map((e) => `${e.id}: ${e.msg}`).join('\n'))
    err.code = 'ALL_FAILED'
    throw err
  }

  /* ──────────────────────── tiny markdown → html ──────────────────────── */
  function mdToHtml(t) {
    if (!t) return ''
    let h = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    h = h.replace(/`([^`\n]+)`/g, '<code>$1</code>')
    h = h.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
    h = h.replace(/^### +(.+)$/gm, '<h4>$1</h4>')
    h = h.replace(/^## +(.+)$/gm, '<h3>$1</h3>')
    h = h.replace(/^[-*•] +(.+)$/gm, '<li>$1</li>')
    if (/<li>/.test(h)) {
      const lines = h.split('\n')
      const out = []
      let inList = false
      for (const line of lines) {
        if (/^<li>/.test(line)) {
          if (!inList) { out.push('<ul>'); inList = true }
          out.push(line)
        } else {
          if (inList) { out.push('</ul>'); inList = false }
          out.push(line)
        }
      }
      if (inList) out.push('</ul>')
      h = out.join('\n')
    }
    h = h
      .split(/\n\n+/)
      .map((b) => {
        const t = b.trim()
        if (!t) return ''
        if (/^<(h\d|ul|ol|li|p|blockquote)/.test(t)) return b
        return `<p>${b.replace(/\n/g, '<br>')}</p>`
      })
      .join('\n')
    return h
  }

  /* ──────────────────────── UI ──────────────────────── */
  let panel, msgs, input, sendBtn
  const history = []

  function open_() {
    if (!panel) build()
    panel.classList.add('open')
    document.getElementById('ask-yahavi-btn')?.classList.add('hide')
    setTimeout(() => input?.focus(), 220)
  }
  function close_() {
    panel?.classList.remove('open')
    document.getElementById('ask-yahavi-btn')?.classList.remove('hide')
  }

  function build() {
    panel = document.createElement('div')
    panel.id = 'yahavi-chat'
    panel.className = 'yahavi-chat'
    panel.innerHTML = `
      <header class="yc-head">
        <div class="yc-id">
          <div class="yc-avatar">Y</div>
          <div>
            <div class="yc-name">Yahavi</div>
            <div class="yc-status"><span class="yc-dot"></span> Online</div>
          </div>
        </div>
        <button class="yc-close" aria-label="Close" type="button">×</button>
      </header>
      <div class="yc-msgs"></div>
      <form class="yc-form">
        <input type="text" class="yc-input" placeholder="Ask anything… / kuch bhi poochho" autocomplete="off" />
        <button type="submit" class="yc-send" aria-label="Send">→</button>
      </form>
    `
    document.body.appendChild(panel)
    msgs = panel.querySelector('.yc-msgs')
    input = panel.querySelector('.yc-input')
    sendBtn = panel.querySelector('.yc-send')
    panel.querySelector('.yc-close').addEventListener('click', close_)
    panel.querySelector('.yc-form').addEventListener('submit', onSubmit)
    greet()
  }

  function greet() {
    const hasKey = Object.values(loadKeysInline()).some(Boolean)
    const html = hasKey
      ? `Hi! I'm <strong>Yahavi</strong>.<br>Ask me anything about your resume, job hunt, ya kaunsa Forge tool kab use karna hai. <em>Bilingual — English ya Hinglish, jo chahiye.</em>`
      : `Hi! I'm <strong>Yahavi</strong>.<br>Ask away — but first add a free API key in <a href="/app">▸ KEYS</a> (60 sec at console.groq.com/keys). Phir main full speed se help kar dunga.`
    addMsg('ai', html)
  }

  function addMsg(role, html) {
    const d = document.createElement('div')
    d.className = `yc-msg yc-msg-${role}`
    d.innerHTML = `<div class="yc-bubble">${html}</div>`
    msgs.appendChild(d)
    msgs.scrollTop = msgs.scrollHeight
    return d
  }

  async function onSubmit(e) {
    e.preventDefault()
    const text = input.value.trim()
    if (!text) return
    input.value = ''
    addMsg('user', escapeHtml(text))
    history.push({ role: 'user', content: text })
    const t = addMsg('ai', `<span class="yc-typing"><span></span><span></span><span></span></span>`)
    sendBtn.disabled = true
    try {
      const messages = [{ role: 'system', content: SYSTEM }, ...history]
      const { text: answer, provider } = await aiCall(messages)
      history.push({ role: 'assistant', content: answer })
      t.querySelector('.yc-bubble').innerHTML =
        mdToHtml(answer) +
        `<div class="yc-attrib">via ${escapeHtml(provider)}</div>`
    } catch (err) {
      const msg =
        err && err.code === 'NO_KEYS'
          ? `No API key yet. Add a free one in <a href="/app">▸ KEYS</a>, then ask again.`
          : `<em>Couldn't reach the AI right now. ${escapeHtml(((err && err.message) || String(err)).slice(0, 200))}</em>`
      t.querySelector('.yc-bubble').innerHTML = msg
    } finally {
      sendBtn.disabled = false
      input.focus()
    }
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function init() {
    const btn = document.getElementById('ask-yahavi-btn')
    if (btn) btn.addEventListener('click', open_)
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
