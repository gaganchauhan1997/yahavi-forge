/* ============================================================
   ASK YAHAVI — forge-native AI chat panel (BYOK)
   --------------------------------------------------------------
   Floating button (#ask-yahavi-btn) opens a brutalist chat panel.
   Uses the same keys/providers as the rest of Forge (reads from
   localStorage via HKForge.state, calls HKForge.aiCall).
   If no keys configured, prompts to add one (deeplink to /app#/home).
   ============================================================ */
(function () {
  'use strict'

  const SYSTEM = `You are Yahavi — the friendly, brutally-honest career assistant inside Yahavi Forge (forge.hackknow.com), made by Hackknow.

You help users with:
- Resume questions ("how do I rewrite this bullet?", "is this ATS-friendly?")
- Job search strategy ("how do I apply to FAANG?", "what should I prioritize this week?")
- Career switches, gaps, interview prep
- Recommending which of Forge's 17 tools to use for their situation

Forge's 17 tools, by category:
- BUILD: Resume Builder, Bullet Upgrader, Portfolio Generator, Career Gap Framing, Achievement Forge
- ANALYZE: ATS Intelligence Report, 6-Second Recruiter Scan, Resume Roast (4 personas)
- TAILOR: Job Tailoring Engine, Truth-Lock Tailor (no fabrication), Company Tailor (per-company deep)
- OUTREACH: Cover Letter, Recruiter Hook (LinkedIn outreach), Application Pack (full kit)
- STRATEGY: Role Fit Finder (10 overlooked roles), Application Optimizer (weekly plan), Interview Prep Pack

Style:
- Hinglish-friendly if the user writes Hinglish; English otherwise.
- Concise. Bullet-heavy when listing.
- When recommending a tool, link to it: e.g. "Open the Truth-Lock Tailor (/app#/truth-lock)".
- If asked about pricing: Forge is ₹0/month forever for the 17 tools. PRO (₹299/mo, coming soon) adds 30 designer templates + cloud sync.
- If asked who built you: Yahavi Forge by Hackknow (gaganchauhan1997 — Gagan Chauhan, CEO; Manish K. Singh, Co-Founder). Made in Delhi, India. Built for the World.
- Privacy: API keys live only in the user's browser. Resume content is never stored on Hackknow servers. Sign-in optional.

Never invent details about a user's resume. Always ask before assuming. Be warm but real.`

  let panel, msgs, input, sendBtn, history = []

  function openPanel() {
    if (!panel) buildPanel()
    panel.classList.add('open')
    setTimeout(() => input?.focus(), 150)
  }
  function closePanel() {
    panel?.classList.remove('open')
  }

  function buildPanel() {
    panel = document.createElement('div')
    panel.id = 'yahavi-chat'
    panel.className = 'yahavi-chat'
    panel.innerHTML = `
      <div class="yahavi-head">
        <div class="yahavi-title">
          <span class="yahavi-avatar">🤖</span>
          <div>
            <div class="yahavi-name">YAHAVI AI</div>
            <div class="yahavi-status"><span class="blink"></span> ONLINE · BYOK</div>
          </div>
        </div>
        <button class="yahavi-close" aria-label="Close">✕</button>
      </div>
      <div class="yahavi-msgs">
        <div class="yahavi-msg yahavi-msg-ai">
          <div class="yahavi-bubble">
            Hi! I'm <strong>Yahavi</strong>, the assistant inside Forge.<br>
            Ask me anything: resume tips, which tool to use, interview prep, job-search strategy.
            <br><br>
            <em>Tip:</em> I use the same API keys you've added to Forge. No key yet? <a href="/app#/home">Open Forge → click ▸ KEYS</a> and paste a free one.
          </div>
        </div>
      </div>
      <form class="yahavi-input-row">
        <input type="text" class="yahavi-input" placeholder="Ask Yahavi anything…" autocomplete="off" />
        <button type="submit" class="yahavi-send">▸</button>
      </form>
      <div class="yahavi-fine">▸ Your key stays in your browser. Yahavi never sees it directly — it's used by your browser to call the AI.</div>
    `
    document.body.appendChild(panel)
    msgs = panel.querySelector('.yahavi-msgs')
    input = panel.querySelector('.yahavi-input')
    sendBtn = panel.querySelector('.yahavi-send')
    panel.querySelector('.yahavi-close').addEventListener('click', closePanel)
    panel.querySelector('.yahavi-input-row').addEventListener('submit', onSubmit)
  }

  function addMsg(role, html) {
    const div = document.createElement('div')
    div.className = `yahavi-msg yahavi-msg-${role === 'user' ? 'user' : 'ai'}`
    div.innerHTML = `<div class="yahavi-bubble">${html}</div>`
    msgs.appendChild(div)
    msgs.scrollTop = msgs.scrollHeight
    return div
  }

  async function onSubmit(e) {
    e.preventDefault()
    const text = input.value.trim()
    if (!text) return
    input.value = ''
    addMsg('user', escapeHtml(text))
    history.push({ role: 'user', content: text })

    const F = window.HKForge
    if (!F || !F.aiCall || !F.state) {
      addMsg('ai', `<em>Chat needs Forge's BYOK engine loaded. <a href="/app">Open Forge</a> first, paste a free Groq key, then come back.</em>`)
      return
    }
    const keys = F.state.loadKeys()
    if (!keys || Object.values(keys).filter(Boolean).length === 0) {
      addMsg(
        'ai',
        `<em>No API key yet. <a href="/app#/home">Open Forge → ▸ KEYS</a> and paste a free Groq key (60 sec at console.groq.com/keys). I'll be here.</em>`
      )
      return
    }

    const thinking = addMsg(
      'ai',
      `<span class="yahavi-thinking"><span></span><span></span><span></span></span>`
    )
    sendBtn.disabled = true

    try {
      const messages = [
        { role: 'system', content: SYSTEM },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ]
      const { result, provider } = await F.aiCall(keys, F.state.loadPrefs(), messages, {
        temperature: 0.7,
        max_tokens: 1200,
      })
      history.push({ role: 'assistant', content: result })
      const html = F.mdToHtml(result)
      thinking.querySelector('.yahavi-bubble').innerHTML =
        html +
        `<div class="yahavi-attrib">via ${escapeHtml((F.PROVIDERS[provider] && F.PROVIDERS[provider].name) || provider)}</div>`
    } catch (err) {
      thinking.querySelector('.yahavi-bubble').innerHTML = `<em>${escapeHtml(err.message || String(err))}</em>`
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
    if (btn) btn.addEventListener('click', openPanel)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
