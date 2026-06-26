/* ============================================================
   YAHAVI FORGE — generic tool runner
   --------------------------------------------------------------
   Reads a tool config from HKForge.TOOLS[id], renders an input
   panel + output panel into #tool-mount, wires the run/copy/PDF
   buttons, and handles the AI call.

   Special tools:
     • home        → renders the hero + feature grid
     • ats         → uses local ATS scorer + AI report (combined)
     • portfolio   → renders generated HTML in a live iframe-style preview
   ============================================================ */
(function (root) {
  'use strict'
  const F = root.HKForge
  const $ = (sel, r = document) => r.querySelector(sel)
  const $$ = (sel, r = document) => [...r.querySelectorAll(sel)]

  /* ──────────────────────── escape helpers ──────────────────────── */
  const escAttr = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  const escText = (s) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  /* ──────────────────────── home page ──────────────────────── */
  function renderHome(mount) {
    const cards = F.SIDEBAR.filter((g) => g.id !== 'home')
      .flatMap((g) => g.items)
      .filter((t) => t !== 'home')
      .map((id) => {
        const t = F.TOOLS[id]
        if (!t) return ''
        return `
          <button class="feature-card" data-goto="${escAttr(id)}">
            <div class="feature-num">${escText(t.num)} · ${escText(t.category.toUpperCase())}</div>
            <div class="feature-title">${escText(t.icon || '▸')} ${escText(t.title)}</div>
            <div class="feature-desc">${escText(t.subtitle)}</div>
            <div class="feature-cta">OPEN ▸</div>
          </button>`
      })
      .join('')

    mount.innerHTML = `
      <section class="hero">
        <div class="hero-eyebrow"><span class="blink"></span> AI CAREER OS · LIVE · BY HACKKNOW</div>
        <h1 class="hero-title">YAHAVI<br><span class="accent">FORGE</span></h1>
        <p class="hero-sub">
          Not a resume builder. The <strong>AI hiring assistant</strong> that runs on free-tier intelligence —
          turning raw experience into <strong>interview callbacks</strong>, ATS hits, and recruiter attention.
          17 tools. Bring your own keys.
        </p>
        <div class="hero-meta">
          <div class="hero-stat"><strong>17</strong><span>AI MODULES</span></div>
          <div class="hero-stat"><strong>6</strong><span>FREE PROVIDERS</span></div>
          <div class="hero-stat"><strong>$0</strong><span>MONTHLY COST</span></div>
          <div class="hero-stat"><strong>∞</strong><span>RESUMES</span></div>
        </div>
      </section>

      <div class="section-head">
        <div class="section-title"><span class="num">MODULES</span>The Toolkit</div>
        <div class="section-meta">Click any tile · powered by your keys</div>
      </div>

      <div class="feature-grid">${cards}</div>
    `
    $$('[data-goto]', mount).forEach((b) =>
      b.addEventListener('click', () => F.UI.go(b.dataset.goto))
    )
  }

  /* ──────────────────────── tool page (generic) ──────────────────────── */
  function renderTool(mount, id) {
    const tool = F.TOOLS[id]
    if (!tool) {
      mount.innerHTML = `<div class="output-empty">▸ Unknown tool: ${escText(id)}</div>`
      return
    }
    if (id === 'ats') return renderAts(mount, tool)
    if (tool.kind === 'resume-output') return renderResumeOutput(mount)
    if (tool.kind === 'omni-export') return renderOmniExport(mount)

    const draft = F.state.loadDraft(id)
    const prefs = F.state.loadPrefs()
    const chip =
      tool.chips && tool.chips.prefKey ? prefs[tool.chips.prefKey] || tool.chips.options[0].value : null

    const chipsHtml = tool.chips
      ? `<div class="mode-chips">
          ${tool.chips.options
            .map(
              (o) => `<button class="mode-chip ${o.value === chip ? 'active' : ''}"
                data-chip-key="${escAttr(tool.chips.prefKey || tool.chips.key)}"
                data-chip="${escAttr(o.value)}">▸ ${escText(o.label)}</button>`
            )
            .join('')}
        </div>`
      : ''

    const inputsHtml = tool.inputs
      .map((inp) => {
        const val = draft[inp.id] || ''
        const req = inp.required ? '<span style="color:var(--pink);margin-left:4px;">*</span>' : ''
        let field
        if (inp.type === 'select') {
          field = `<select id="inp-${escAttr(inp.id)}">${inp.options
            .map(
              (o) =>
                `<option value="${escAttr(o.value)}"${o.value === val ? ' selected' : ''}>${escText(
                  o.label
                )}</option>`
            )
            .join('')}</select>`
        } else if (inp.rows && inp.rows > 1) {
          field = `<textarea id="inp-${escAttr(inp.id)}" rows="${inp.rows}" placeholder="${escAttr(
            inp.placeholder || ''
          )}">${escText(val)}</textarea>`
        } else {
          field = `<input type="text" id="inp-${escAttr(inp.id)}" placeholder="${escAttr(
            inp.placeholder || ''
          )}" value="${escAttr(val)}" />`
        }
        return `<div class="form-group">
          <label class="form-label" for="inp-${escAttr(inp.id)}">${escText(inp.label)}${req}</label>
          ${field}
        </div>`
      })
      .join('')

    const portfolioPreviewHtml = tool.portfolioOutput
      ? `<button class="btn btn-ghost" id="btn-open-preview" disabled>↗ OPEN PORTFOLIO PREVIEW</button>`
      : ''

    mount.innerHTML = `
      <div class="section-head">
        <div class="section-title">
          <span class="num">${escText(tool.num || '—')}</span>${escText(tool.icon || '')} ${escText(tool.title)}
        </div>
        <div class="section-meta">${escText(tool.subtitle)}</div>
      </div>

      ${chipsHtml}

      <div class="module-grid">
        <div class="panel">
          <div class="panel-label"><span>▸ INPUT</span><span class="badge">RAW</span></div>
          ${inputsHtml}
          <div class="btn-row" style="margin-top:8px;">
            <button class="btn btn-primary" id="btn-run">▸ RUN ${escText(tool.title.toUpperCase())}</button>
            <button class="btn btn-ghost" id="btn-copy" disabled>⧉ COPY</button>
            <button class="btn btn-ghost" id="btn-pdf" disabled>↓ PDF</button>
            <button class="btn btn-ghost" id="btn-html" disabled>↓ HTML</button>
            <button class="btn btn-pink" id="btn-push-resume" disabled>↗ PUSH TO RESUME</button>
            ${portfolioPreviewHtml}
          </div>
        </div>

        <div class="panel dark">
          <div class="panel-label"><span>▸ OUTPUT</span><span class="badge">FORGED</span></div>
          <div class="output-area" id="output" style="background:var(--paper);color:var(--ink);">
            <div class="output-empty">▸ Click RUN to generate</div>
          </div>
        </div>
      </div>

      <div class="sp-wrap" id="style-preset-picker"></div>
      <div id="tool-reviews-section" style="margin-top:24px;"></div>
    `

    /* draft autosave */
    const readInputs = () => {
      const out = {}
      tool.inputs.forEach((inp) => {
        const el = $('#inp-' + inp.id, mount)
        if (el) out[inp.id] = el.value
      })
      return out
    }
    let saveTimer
    tool.inputs.forEach((inp) => {
      const el = $('#inp-' + inp.id, mount)
      if (!el) return
      el.addEventListener('input', () => {
        clearTimeout(saveTimer)
        saveTimer = setTimeout(() => F.state.saveDraft(id, readInputs()), 400)
      })
    })

    /* chips */
    $$('.mode-chip[data-chip]', mount).forEach((c) =>
      c.addEventListener('click', () => {
        $$('.mode-chip[data-chip]', mount).forEach((x) => x.classList.remove('active'))
        c.classList.add('active')
        F.state.patchPrefs({ [c.dataset.chipKey]: c.dataset.chip })
      })
    )

    /* run */
    $('#btn-run', mount).addEventListener('click', async () => {
      const inputs = readInputs()
      const missing = tool.inputs.filter((i) => i.required && !(inputs[i.id] || '').trim())
      if (missing.length) {
        F.UI.toast('▸ Missing: ' + missing.map((i) => i.label).join(', '), 'error')
        return
      }
      const out = $('#output', mount)
      out.innerHTML =
        '<div class="loading"><span class="loading-dots"><span></span><span></span><span></span></span> <span>Forging…</span></div>'
      $('#btn-run', mount).disabled = true
      try {
        const keys = F.state.loadKeys()
        const curPrefs = F.state.loadPrefs()
        const chipNow = tool.chips
          ? curPrefs[tool.chips.prefKey || tool.chips.key] || tool.chips.options[0].value
          : null
        const messages = [
          { role: 'system', content: tool.systemPrompt(chipNow) },
          { role: 'user', content: tool.userPrompt(inputs, chipNow) },
        ]
        const { result, provider } = await F.aiCall(keys, curPrefs, messages, {
          temperature: tool.temperature,
          max_tokens: tool.maxTokens,
        })
        renderOutput(out, result, provider, tool)
        ;['btn-copy', 'btn-pdf', 'btn-html', 'btn-push-resume'].forEach((b) => {
          const el = $('#' + b, mount)
          if (el) el.disabled = false
        })
        // Wire style presets after first output
        const spPicker = $('#style-preset-picker', mount)
        if (spPicker && root.HKForge?.StylePresets) {
          out.dataset.toolId = id
          root.HKForge.StylePresets.renderPicker(spPicker, out)
        }
        if (tool.portfolioOutput) {
          const pp = $('#btn-open-preview', mount)
          if (pp) {
            pp.disabled = false
            pp.onclick = () => openPortfolioPreview(result)
          }
        }
      } catch (e) {
        out.innerHTML = `<div style="border:3px solid var(--pink);background:rgba(255,46,99,.08);padding:18px;">
          <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:var(--pink);margin-bottom:10px;">ERROR</div>
          <pre style="font-family:var(--font-mono);font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-word;color:var(--ink);">${escText(e.message || String(e))}</pre>
        </div>`
      } finally {
        $('#btn-run', mount).disabled = false
      }
    })

    /* copy / pdf / html */
    $('#btn-copy', mount).addEventListener('click', () => {
      const txt = $('#output', mount).dataset.raw || $('#output', mount).innerText
      navigator.clipboard.writeText(txt).then(
        () => F.UI.toast('▸ Copied', 'success'),
        () => F.UI.toast('Copy failed', 'error')
      )
    })
    // v5 — wrap exports with paywall guard so guests/free tier see plan options
    const Paywall = root.HKForge && root.HKForge.Paywall
    const guard = (action, fn) => {
      if (Paywall && Paywall.guard) Paywall.guard({ action, onAllow: fn })
      else fn()
    }

    $('#btn-pdf', mount).addEventListener('click', () => {
      guard('pdf', () => {
        const w = window.open('', '_blank')
        if (!w) return F.UI.toast('Popup blocked', 'error')
        const title = tool.title + ' — Yahavi Forge'
        const content = $('#output', mount).innerHTML
        w.document.write(`<!doctype html><meta charset="utf-8"><title>${escText(title)}</title>
          <style>body{font-family:'Space Grotesk',system-ui,sans-serif;max-width:780px;margin:32px auto;padding:0 16px;line-height:1.55;color:#0a0a0a}
          h1,h2,h3{font-family:'Archivo Black',sans-serif;text-transform:uppercase;letter-spacing:-.01em}
          strong{background:#ffea00;padding:0 3px}code{font-family:'JetBrains Mono',monospace;background:#0a0a0a;color:#faf6e9;padding:1px 5px}
          hr{border:none;border-top:2px solid #0a0a0a;margin:16px 0}
          @media print { body { margin: 0; padding: 0 24px } button { display: none } }
          </style>
          <h1>${escText(tool.title)}</h1>
          <p style="color:#6b6b6b;font-family:'JetBrains Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:.1em;">▸ Yahavi Forge by Hackknow · ${new Date().toLocaleDateString()}</p>
          ${content}
          <script>setTimeout(()=>window.print(),300)<\/script>`)
        maybeAskForReview()
      })
    })
    $('#btn-html', mount).addEventListener('click', () => {
      guard('html', () => {
        const html = $('#output', mount).innerHTML
        const blob = new Blob(
          [
            `<!doctype html><meta charset="utf-8"><title>${escText(
              tool.title
            )} — Yahavi Forge</title>
          <style>body{font-family:'Space Grotesk',system-ui,sans-serif;max-width:780px;margin:32px auto;padding:0 16px;line-height:1.55;color:#0a0a0a;background:#faf6e9}
          h1,h2,h3{font-family:'Archivo Black',sans-serif;text-transform:uppercase}strong{background:#ffea00;padding:0 3px}</style>
          <h1>${escText(tool.title)}</h1>${html}`,
          ],
          { type: 'text/html;charset=utf-8' }
        )
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `yahavi-forge-${id}.html`
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 5000)
        maybeAskForReview()
      })
    })
    // v3 — Push to Resume: save the AI output as a Resume row in localStorage so
    // the user can come back to it from the Builder.
    const pushBtn = $('#btn-push-resume', mount)
    if (pushBtn) {
      pushBtn.addEventListener('click', () => {
        guard('push', () => {
          const out = $('#output', mount)
          const raw = out?.dataset?.raw || out?.innerText || ''
          if (!raw.trim()) return
          const list = F.state.loadResumes ? F.state.loadResumes() : []
          const entry = {
            id: 'r_' + Date.now().toString(36),
            title: `${tool.title} · ${new Date().toLocaleDateString()}`,
            source_tool: id,
            content: raw,
            created_at: new Date().toISOString(),
          }
          list.unshift(entry)
          if (F.state.saveResumes) F.state.saveResumes(list.slice(0, 50))
          F.UI.toast('▸ Pushed to My Resumes (saved on this device)', 'success')
          maybeAskForReview()
        })
      })
    }
  }

  /* per-export review prompt — at most one ask per session, capped per-key/30days
     v5 — prefers the new HKForge.Review modal (star rating + comment + coupon trigger). */
  function maybeAskForReview() {
    try {
      const askedAt = parseInt(localStorage.getItem('yahavi-forge-reviewed-at') || '0', 10)
      if (askedAt && Date.now() - askedAt < 30 * 24 * 60 * 60 * 1000) return // 30-day cooldown
      if (sessionStorage.getItem('yahavi-forge-review-asked')) return
      sessionStorage.setItem('yahavi-forge-review-asked', '1')
      // Bump export count for paywall stats + review eligibility
      try {
        const C = root.HKForge && root.HKForge.Coupon
        if (C) C.bumpExportCount()
      } catch {}
      setTimeout(() => {
        const R = root.HKForge && root.HKForge.Review
        if (R && R.open) R.open({ trigger: 'post-export' })
        else showReviewModal() // fallback to legacy social-share modal
        localStorage.setItem('yahavi-forge-reviewed-at', String(Date.now()))
      }, 900)
    } catch {}
  }
  function showReviewModal() {
    if (document.getElementById('review-modal')) return
    const m = document.createElement('div')
    m.id = 'review-modal'
    m.style.cssText =
      'position:fixed;inset:0;background:rgba(10,10,10,.7);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;'
    m.innerHTML = `
      <div style="background:var(--card);border:var(--border-thick);box-shadow:8px 8px 0 var(--pink);max-width:420px;padding:28px;font-family:var(--font-body);">
        <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--pink);margin-bottom:8px;">▸ ONE QUICK FAVOUR</div>
        <h3 style="font-family:var(--font-display);font-size:22px;text-transform:uppercase;letter-spacing:-.01em;line-height:1.05;margin-bottom:10px;">Did Yahavi Forge help you?</h3>
        <p style="font-size:14px;line-height:1.5;margin-bottom:18px;">If yes — a 30-second review on social helps a tiny team in Delhi keep this free for everyone else. ❤️</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <a class="btn btn-primary" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/sharing/share-offsite/?url=https://forge.hackknow.com&summary=Yahavi%20Forge%20is%20a%20free%2017-tool%20AI%20career%20OS%20%E2%80%94%20bring%20your%20own%20free%20keys.%20Saved%20me%20hours.%20%E2%9D%A4%EF%B8%8F">▸ Share on LinkedIn</a>
          <a class="btn btn-ghost" target="_blank" rel="noopener noreferrer" href="https://twitter.com/intent/tweet?text=Just%20used%20%40hackknow%20Yahavi%20Forge%20%E2%80%94%20free%20AI%20career%20OS%2C%2017%20tools%2C%20BYOK.%20https%3A%2F%2Fforge.hackknow.com">▸ Post on X</a>
          <button class="btn btn-ghost" id="review-skip">▸ Maybe later</button>
        </div>
      </div>
    `
    document.body.appendChild(m)
    const close = () => {
      localStorage.setItem('yahavi-forge-reviewed-at', String(Date.now()))
      m.remove()
    }
    m.querySelector('#review-skip').addEventListener('click', close)
    m.addEventListener('click', (e) => {
      if (e.target === m) close()
    })
  }

  /* ──────────────────────── ATS (special: local + AI) ──────────────────────── */
  function renderAts(mount, tool) {
    const draft = F.state.loadDraft('ats')
    const inputs = tool.inputs
      .map(
        (inp) =>
          `<div class="panel">
            <div class="panel-label"><span>▸ ${escText(inp.label.toUpperCase())}</span><span class="badge">${
            inp.id === 'resume' ? 'YOU' : 'TARGET'
          }</span></div>
            <textarea id="inp-${escAttr(inp.id)}" rows="${inp.rows || 12}" placeholder="${escAttr(
            inp.placeholder
          )}">${escText(draft[inp.id] || '')}</textarea>
            <div class="input-hint">${
              inp.id === 'resume'
                ? '▸ Tip: include sections, dates, metrics'
                : '▸ Tip: keep the entire JD incl. preferred quals'
            }</div>
          </div>`
      )
      .join('')

    mount.innerHTML = `
      <div class="section-head">
        <div class="section-title"><span class="num">${escText(tool.num)}</span>${escText(
      tool.title
    )}</div>
        <div class="section-meta">${escText(tool.subtitle)}</div>
      </div>

      <div class="module-grid">${inputs}</div>

      <div class="btn-row" style="margin-bottom:18px;">
        <button class="btn btn-primary" id="btn-ats-run">▸ GENERATE INTELLIGENCE REPORT</button>
        <span class="input-hint" style="margin-left:6px;">Local score runs instantly · full AI report needs at least one key in ▸ KEYS</span>
      </div>

      <div id="report-container">
        <div class="report-empty">▸ Paste resume + JD above · click GENERATE</div>
      </div>
    `

    const readInputs = () => ({
      resume: $('#inp-resume', mount).value,
      jd: $('#inp-jd', mount).value,
    })
    let saveTimer
    ;['resume', 'jd'].forEach((id) =>
      $('#inp-' + id, mount).addEventListener('input', () => {
        clearTimeout(saveTimer)
        saveTimer = setTimeout(() => F.state.saveDraft('ats', readInputs()), 400)
      })
    )

    $('#btn-ats-run', mount).addEventListener('click', async () => {
      const { resume, jd } = readInputs()
      if (!resume.trim() || !jd.trim()) {
        F.UI.toast('▸ Resume + JD both required', 'error')
        return
      }
      const container = $('#report-container', mount)
      const local = F.computeLocalAtsScore(resume, jd)

      // Render local score immediately (no AI dependency)
      container.innerHTML = renderAtsLocal(local)

      // Then try to enrich with AI report if keys present
      const keys = F.state.loadKeys()
      if (Object.keys(keys).length === 0) return // no keys, local only — that's fine
      const enrich = document.createElement('div')
      enrich.innerHTML =
        '<div class="loading" style="margin-top:16px;"><span class="loading-dots"><span></span><span></span><span></span></span> <span>Calling AI for narrative report…</span></div>'
      container.appendChild(enrich)

      try {
        const messages = [
          {
            role: 'system',
            content: `You are an ATS optimization expert. Take the user's resume + JD + the precomputed local score and produce a NARRATIVE intelligence report.

Output format:

## RECRUITER PERCEPTION (2 sentences)
What a recruiter sees in the first 6 seconds.

## KEYWORD GAPS (table)
| Missing keyword | Where to add it |

## REWRITTEN BULLETS (3-5 highest-impact)
Real bullets the candidate can paste in.

## SKILL CREDIBILITY (3 bullets)
Honest gaps the resume can't fake.

## NEXT 7-DAY ACTION
3 concrete things to do this week.

Reference the local score (out of 100) where useful but don't repeat the breakdown verbatim.`,
          },
          {
            role: 'user',
            content: `LOCAL SCORE: ${local.score}/100
Breakdown: ${JSON.stringify(local.breakdown)}
Matched: ${local.matched_keywords.join(', ')}
Missing: ${local.missing_keywords.join(', ')}

RESUME:
${resume}

---

JOB DESCRIPTION:
${jd}`,
          },
        ]
        const { result, provider } = await F.aiCall(keys, F.state.loadPrefs(), messages, {
          temperature: 0.55,
          max_tokens: 2500,
        })
        enrich.innerHTML = `
          <div style="font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:var(--ink-faint);margin:18px 0 10px;padding-bottom:8px;border-bottom:1px dotted var(--ink);">▸ ANALYZED BY ${escText(
            (F.PROVIDERS[provider] && F.PROVIDERS[provider].name) || provider
          )}</div>
          <div class="output-area has-content" style="background:var(--card);">${F.mdToHtml(result)}</div>`
      } catch (e) {
        enrich.innerHTML = `<div style="border:3px solid var(--pink);background:rgba(255,46,99,.08);padding:14px;margin-top:14px;">
          <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;text-transform:uppercase;color:var(--pink);margin-bottom:8px;">AI ENRICHMENT FAILED</div>
          <pre style="font-family:var(--font-mono);font-size:12px;white-space:pre-wrap;">${escText(
            e.message || String(e)
          )}</pre>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--ink-faint);margin-top:8px;">▸ Local score above is still valid.</div>
        </div>`
      }
    })
  }

  function renderAtsLocal(s) {
    const grade =
      s.score >= 80 ? 'STRONG' : s.score >= 65 ? 'GOOD' : s.score >= 50 ? 'OK' : 'NEEDS WORK'
    const matched = s.matched_keywords.slice(0, 16).map((k) => `<span class="kw kw-on">${escText(k)}</span>`).join(' ')
    const missing = s.missing_keywords.slice(0, 16).map((k) => `<span class="kw kw-off">${escText(k)}</span>`).join(' ')
    const bars = Object.entries(s.breakdown)
      .map(([k, v]) => {
        const pct = Math.round((v.score / v.max) * 100)
        return `<div class="ats-bar-row">
          <div class="ats-bar-label">${escText(k.replace(/_/g, ' ').toUpperCase())}</div>
          <div class="ats-bar-track"><div class="ats-bar-fill" style="width:${pct}%"></div></div>
          <div class="ats-bar-value">${v.score}/${v.max}</div>
        </div>`
      })
      .join('')

    return `
      <style>
        .score-block { display:flex; align-items:center; gap:24px; margin-bottom:24px; padding:24px; background:var(--ink); color:var(--paper); border:var(--border-thick); box-shadow:var(--shadow-md); }
        .score-num { font-family:var(--font-display); font-size:96px; line-height:.85; letter-spacing:-.05em; color:var(--yellow); }
        .ats-bar-row { display:grid; grid-template-columns:1fr 3fr auto; gap:12px; align-items:center; padding:10px 0; border-bottom:1px dotted var(--ink); font-family:var(--font-mono); font-size:11px; }
        .ats-bar-label { font-weight:700; letter-spacing:.08em; }
        .ats-bar-track { background:var(--paper-warm); height:10px; border:2px solid var(--ink); }
        .ats-bar-fill { height:100%; background:var(--yellow); border-right:2px solid var(--ink); }
        .ats-bar-value { font-weight:700; }
        .kw { display:inline-block; font-family:var(--font-mono); font-size:11px; padding:3px 7px; margin:2px 3px; border:2px solid var(--ink); }
        .kw-on { background:var(--lime); }
        .kw-off { background:var(--pink); color:var(--paper); }
      </style>
      <div class="score-block">
        <div class="score-num">${s.score}</div>
        <div>
          <div class="score-label" style="font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:.15em;opacity:.7;">LOCAL ATS SCORE</div>
          <div class="score-grade" style="font-family:var(--font-display);font-size:28px;text-transform:uppercase;letter-spacing:-.01em;">${grade}</div>
          <div style="font-family:var(--font-mono);font-size:11px;opacity:.7;margin-top:6px;">${s.word_count} words · ${s.verb_hits} action verbs · ${s.quant_hits} quantified</div>
        </div>
      </div>
      <div class="panel" style="margin-bottom:18px;">
        <div class="panel-label"><span>▸ BREAKDOWN</span><span class="badge">/100</span></div>
        ${bars}
      </div>
      <div class="panel" style="margin-bottom:18px;">
        <div class="panel-label"><span>▸ MATCHED KEYWORDS</span><span class="badge">${s.matched_keywords.length}</span></div>
        <div style="line-height:2.4;">${matched || '<span style="color:var(--ink-faint);">No keyword overlap.</span>'}</div>
      </div>
      <div class="panel" style="margin-bottom:18px;">
        <div class="panel-label"><span>▸ MISSING KEYWORDS</span><span class="badge">${s.missing_keywords.length}</span></div>
        <div style="line-height:2.4;">${missing || '<span style="color:var(--ink-faint);">No missing keywords detected.</span>'}</div>
      </div>`
  }

  /* ──────────────────────── output renderer (markdown → html) ──────────────────────── */
  function renderOutput(el, raw, provider, tool) {
    el.classList.add('has-content')
    el.style.background = 'var(--card)'
    el.dataset.raw = raw
    const providerName = (F.PROVIDERS[provider] && F.PROVIDERS[provider].name) || provider
    const head = `<div style="font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:var(--ink-faint);margin-bottom:14px;padding-bottom:10px;border-bottom:1px dotted var(--ink);">▸ Generated by ${escText(
      providerName
    )} · ${(raw.length / 1024).toFixed(1)}KB</div>`

    if (tool && tool.portfolioOutput) {
      el.innerHTML = head + `<pre style="font-family:var(--font-mono);font-size:11px;white-space:pre-wrap;word-break:break-word;max-height:520px;overflow-y:auto;background:var(--paper-warm);padding:12px;border:2px dashed var(--ink);">${escText(
        raw
      )}</pre>`
      return
    }
    el.innerHTML = head + F.mdToHtml(raw)
  }

  /* portfolio preview — opens full HTML in new tab */
  function openPortfolioPreview(html) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    window.open(URL.createObjectURL(blob), '_blank')
  }

  /* ─────── Resume Output renderer ─────── */
  function renderResumeOutput(mount) {
    const list = F.state.loadResumes ? F.state.loadResumes() : []
    if (!list.length) {
      mount.innerHTML = `
        <div class="panel" style="text-align:center;padding:40px 24px;">
          <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--pink);margin-bottom:12px;">▸ RESUME OUTPUT</div>
          <h2 style="font-family:var(--font-display);font-size:28px;text-transform:uppercase;letter-spacing:-.01em;margin-bottom:12px;">No saved outputs yet.</h2>
          <p style="font-size:14px;color:var(--ink-soft);line-height:1.6;max-width:420px;margin:0 auto 22px;">
            Run any tool, then click <strong>↗ PUSH TO RESUME</strong> to save the output here for future reference.
          </p>
          <a class="btn btn-primary" href="#/builder">▸ OPEN RESUME BUILDER</a>
        </div>`
      return
    }
    mount.innerHTML = `
      <div class="panel" style="padding:18px 20px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
          <div>
            <div class="panel-label"><span>▸ RESUME OUTPUT</span></div>
            <div style="font-family:var(--font-mono);font-size:10.5px;color:var(--ink-faint);">${list.length} saved output${list.length > 1 ? 's' : ''} — click to expand</div>
          </div>
          <button class="btn set-danger" id="ro-clear" type="button">▸ CLEAR ALL</button>
        </div>
      </div>
      <div id="ro-list"></div>`

    const roList = mount.querySelector('#ro-list')
    roList.innerHTML = list.map((it, i) => `
      <div class="panel" style="margin-bottom:10px;cursor:pointer;" data-ro-idx="${i}">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:14px 18px;">
          <div>
            <div style="font-family:var(--font-body);font-size:14px;font-weight:700;">${escText(it.title || it.id)}</div>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--ink-faint);margin-top:3px;">${escText(it.source_tool || '')} · ${escText(it.created_at || '')}</div>
          </div>
          <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:.06em;">▸ EXPAND</div>
        </div>
        <div class="ro-content" style="display:none;padding:0 18px 16px;">
          <div style="background:var(--paper-warm);border:1px dashed var(--ink);padding:14px;font-size:13px;line-height:1.6;white-space:pre-wrap;max-height:400px;overflow-y:auto;">${escText(it.content || '')}</div>
          <div style="display:flex;gap:8px;margin-top:10px;">
            <button class="btn btn-ghost ro-copy" data-content="${escAttr(it.content||'')}" type="button">⧉ COPY</button>
            <button class="btn set-danger ro-del" data-idx="${i}" type="button">✕ DELETE</button>
          </div>
        </div>
      </div>`).join('')

    roList.querySelectorAll('[data-ro-idx]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('button')) return
        const content = el.querySelector('.ro-content')
        const isOpen = content.style.display !== 'none'
        content.style.display = isOpen ? 'none' : 'block'
        el.querySelector('div > div > div:last-child').textContent = isOpen ? '▸ EXPAND' : '▾ COLLAPSE'
      })
    })
    roList.querySelectorAll('.ro-copy').forEach(btn =>
      btn.addEventListener('click', () => {
        if (navigator.clipboard) navigator.clipboard.writeText(btn.dataset.content)
        btn.textContent = '✓ COPIED'; setTimeout(() => (btn.textContent = '⧉ COPY'), 1500)
      })
    )
    roList.querySelectorAll('.ro-del').forEach(btn =>
      btn.addEventListener('click', () => {
        if (!confirm('Delete this output?')) return
        const arr = F.state.loadResumes ? F.state.loadResumes() : []
        arr.splice(Number(btn.dataset.idx), 1)
        if (F.state.saveResumes) F.state.saveResumes(arr)
        renderResumeOutput(mount)
      })
    )
    mount.querySelector('#ro-clear')?.addEventListener('click', () => {
      if (!confirm('Clear all saved outputs?')) return
      if (F.state.saveResumes) F.state.saveResumes([])
      renderResumeOutput(mount)
    })
  }

  /* ─────── Omni Export renderer ─────── */
  function renderOmniExport(mount) {
    const list = F.state.loadResumes ? F.state.loadResumes() : []
    if (!list.length) {
      mount.innerHTML = `
        <div class="panel" style="text-align:center;padding:40px 24px;">
          <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--pink);margin-bottom:12px;">▸ OMNI EXPORT</div>
          <h2 style="font-family:var(--font-display);font-size:28px;text-transform:uppercase;letter-spacing:-.01em;margin-bottom:12px;">Nothing to compile yet.</h2>
          <p style="font-size:14px;color:var(--ink-soft);line-height:1.6;max-width:420px;margin:0 auto 22px;">
            Use any tool, push outputs with <strong>↗ PUSH TO RESUME</strong>, then come back here to export everything as one document.
          </p>
        </div>`
      return
    }

    // Build compiled document HTML
    function buildDoc() {
      const rows = list.map((it, i) =>
        `<section style="margin-bottom:36px;border-bottom:2px solid #0a0a0a;padding-bottom:28px;">
          <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:8px;">
            <span style="font-family:'Archivo Black',sans-serif;font-size:42px;color:#ff2e63;line-height:1;">${String(i + 1).padStart(2, '0')}</span>
            <div>
              <h2 style="font-family:'Archivo Black',sans-serif;font-size:20px;text-transform:uppercase;letter-spacing:-.01em;">${escText(it.title || it.id)}</h2>
              <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#6b6b6b;letter-spacing:.04em;">${escText(it.source_tool || '')} · ${escText(it.created_at || '')}</div>
            </div>
          </div>
          <div style="white-space:pre-wrap;font-size:13.5px;line-height:1.7;color:#1a1a1a;">${escText(it.content || '')}</div>
        </section>`).join('')
      return `<!doctype html><html lang="en"><head><meta charset="utf-8">
        <title>Yahavi Forge — Omni Export</title>
        <style>
          body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;max-width:820px;margin:40px auto;padding:0 24px;color:#0a0a0a;background:#faf6e9}
          @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Plus+Jakarta+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
          @media print{body{margin:0;padding:0 24px}.no-print{display:none}}
        </style></head><body>
        <div class="no-print" style="text-align:right;margin-bottom:24px;">
          <button onclick="window.print()" style="font-family:'JetBrains Mono',monospace;font-weight:800;font-size:11px;letter-spacing:.12em;text-transform:uppercase;padding:10px 18px;background:#0a0a0a;color:#faf6e9;border:none;cursor:pointer;">▸ PRINT / SAVE AS PDF</button>
        </div>
        <header style="margin-bottom:36px;border-bottom:4px solid #0a0a0a;padding-bottom:20px;">
          <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#ff2e63;margin-bottom:6px;">▸ YAHAVI FORGE · BY HACKKNOW.COM</div>
          <h1 style="font-family:'Archivo Black',sans-serif;font-size:36px;text-transform:uppercase;letter-spacing:-.02em;line-height:1;">OMNI EXPORT</h1>
          <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#6b6b6b;margin-top:6px;">${list.length} section${list.length > 1 ? 's' : ''} · Generated ${new Date().toLocaleDateString()}</div>
        </header>
        ${rows}
        <footer style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#aaa;text-align:center;margin-top:40px;padding-top:16px;border-top:1px solid #ddd;">forge.hackknow.com · Yahavi Forge by Hackknow</footer>
        </body></html>`
    }

    mount.innerHTML = `
      <div class="panel" style="padding:18px 20px;margin-bottom:16px;">
        <div class="panel-label"><span>▸ OMNI EXPORT</span></div>
        <div style="font-family:var(--font-mono);font-size:10.5px;color:var(--ink-faint);margin-top:4px;">${list.length} section${list.length > 1 ? 's' : ''} compiled into one numbered document</div>
      </div>
      <div style="background:var(--paper-warm);border:var(--border);padding:20px 22px;margin-bottom:14px;">
        <div style="font-family:var(--font-display);font-size:14px;text-transform:uppercase;letter-spacing:-.01em;margin-bottom:12px;">▸ SECTIONS IN THIS EXPORT</div>
        ${list.map((it, i) => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dotted var(--ink);">
            <span style="font-family:var(--font-display);font-size:18px;color:var(--pink);min-width:28px;">${String(i + 1).padStart(2, '0')}</span>
            <div>
              <div style="font-family:var(--font-body);font-size:13px;font-weight:700;">${escText(it.title || it.id)}</div>
              <div style="font-family:var(--font-mono);font-size:10px;color:var(--ink-faint);">${escText(it.source_tool || '')}</div>
            </div>
          </div>`).join('')}
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-primary" id="oe-pdf" type="button">▸ OPEN AS PRINT / PDF</button>
        <button class="btn btn-ghost" id="oe-html" type="button">↓ DOWNLOAD HTML</button>
      </div>`

    mount.querySelector('#oe-pdf').addEventListener('click', () => {
      const Paywall = root.HKForge && root.HKForge.Paywall
      const go = () => { const w = window.open('', '_blank'); if (w) w.document.write(buildDoc()) }
      if (Paywall && Paywall.guard) Paywall.guard({ action: 'export', onAllow: go })
      else go()
    })
    mount.querySelector('#oe-html').addEventListener('click', () => {
      const Paywall = root.HKForge && root.HKForge.Paywall
      const go = () => {
        const blob = new Blob([buildDoc()], { type: 'text/html;charset=utf-8' })
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
        a.download = `yahavi-forge-omni-export-${Date.now()}.html`; a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 5000)
      }
      if (Paywall && Paywall.guard) Paywall.guard({ action: 'html', onAllow: go })
      else go()
    })
  }

  /* ─────────────────── PER-TOOL REVIEWS ─────────────────── */
  function initToolReviews(mount, toolId) {
    const section = $('#tool-reviews-section', mount)
    if (!section) return
    const key = 'yahavi-forge-tool-reviews-' + toolId

    function loadReviews() {
      try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
    }
    function saveReviews(arr) {
      try { localStorage.setItem(key, JSON.stringify(arr)) } catch {}
    }

    function starHtml(rating, interactive) {
      return [1,2,3,4,5].map(n =>
        `<span class="tr-star${interactive ? ' tr-star-btn' : ''}" data-star="${n}" style="cursor:${interactive?'pointer':'default'};color:${n <= rating ? '#FFD400' : 'rgba(10,10,10,0.18)'};font-size:${interactive?'22px':'16px'};">★</span>`
      ).join('')
    }

    function render() {
      const reviews = loadReviews().sort((a, b) => new Date(b.date) - new Date(a.date))
      section.innerHTML = `
        <div class="tr-wrap">
          <div class="tr-head">
            <div class="tr-title">▸ REVIEWS <span class="tr-count">${reviews.length > 0 ? reviews.length : ''}</span></div>
            <button class="btn btn-ghost tr-write-btn" type="button" id="tr-toggle">▸ WRITE A REVIEW</button>
          </div>

          <div class="tr-form-wrap" id="tr-form-wrap" style="display:none;">
            <div class="tr-form">
              <div class="tr-form-stars" id="tr-form-stars" data-rating="0">${starHtml(0, true)}</div>
              <input type="text" id="tr-name" placeholder="Your name (e.g. Rahul S.)" maxlength="50" class="tr-input" />
              <textarea id="tr-comment" placeholder="What did you think of this tool? (optional)" rows="3" maxlength="500" class="tr-textarea"></textarea>
              <div style="display:flex;gap:8px;margin-top:8px;">
                <button class="btn btn-primary" id="tr-submit" type="button">▸ SUBMIT REVIEW</button>
                <button class="btn btn-ghost" id="tr-cancel" type="button">Cancel</button>
              </div>
              <div id="tr-msg" style="font-family:var(--font-mono);font-size:11px;margin-top:6px;color:var(--pink);"></div>
            </div>
          </div>

          ${reviews.length === 0
            ? `<div class="tr-empty">No reviews yet — be the first to review this tool.</div>`
            : reviews.map(r => `
              <div class="tr-card">
                <div class="tr-card-head">
                  <span class="tr-card-name">${escText(r.name || 'Anonymous')}</span>
                  <span class="tr-card-stars">${starHtml(r.rating || 0, false)}</span>
                  <span class="tr-card-date">${new Date(r.date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</span>
                </div>
                ${r.comment ? `<div class="tr-card-comment">${escText(r.comment)}</div>` : ''}
              </div>`).join('')
          }
        </div>
      `

      // Wire toggle
      let formOpen = false
      const toggleBtn = $('#tr-toggle', section)
      const formWrap = $('#tr-form-wrap', section)
      toggleBtn?.addEventListener('click', () => {
        formOpen = !formOpen
        formWrap.style.display = formOpen ? 'block' : 'none'
        toggleBtn.textContent = formOpen ? '✕ CLOSE' : '▸ WRITE A REVIEW'
      })
      $('#tr-cancel', section)?.addEventListener('click', () => {
        formOpen = false
        formWrap.style.display = 'none'
        toggleBtn.textContent = '▸ WRITE A REVIEW'
      })

      // Star picker
      let selectedRating = 0
      const starsEl = $('#tr-form-stars', section)
      starsEl?.querySelectorAll('.tr-star-btn').forEach(s => {
        s.addEventListener('click', () => {
          selectedRating = Number(s.dataset.star)
          starsEl.innerHTML = starHtml(selectedRating, true)
          // Re-wire after innerHTML reset
          starsEl.querySelectorAll('.tr-star-btn').forEach(s2 => {
            s2.addEventListener('click', () => {
              selectedRating = Number(s2.dataset.star)
              starsEl.innerHTML = starHtml(selectedRating, true)
            })
          })
        })
      })

      // Submit
      $('#tr-submit', section)?.addEventListener('click', () => {
        const name = ($('#tr-name', section)?.value || '').trim()
        const comment = ($('#tr-comment', section)?.value || '').trim()
        const msg = $('#tr-msg', section)
        if (!selectedRating) { if (msg) msg.textContent = 'Please select a star rating.'; return }
        if (!name) { if (msg) msg.textContent = 'Please enter your name.'; return }
        const arr = loadReviews()
        arr.push({ name, rating: selectedRating, comment, date: new Date().toISOString() })
        saveReviews(arr)
        render() // re-render with new review
        // Trigger loyalty coupon check
        const C = root.HKForge?.Coupon
        if (C) {
          C.saveReviewState(selectedRating, comment)
          const elig = C.checkLoyaltyEligibility()
          if (elig.eligible) C.issueLoyaltyCoupon()
        }
        if (window.HKForge?.UI?.toast) window.HKForge.UI.toast('▸ Review submitted — thank you!', 'success')
      })
    }

    render()
  }

  // Wire reviews after renderTool builds the DOM
  const _origRenderTool = F.runner ? F.runner.renderTool : null
  function renderToolWithReviews(mount, id) {
    // renderTool is re-exported at the bottom, so call the local function
    renderTool(mount, id)
    if (id !== 'home' && id !== 'ats' && id !== 'resume-output' && id !== 'omni-export') {
      initToolReviews(mount, id)
    }
  }

  root.HKForge = root.HKForge || {}
  root.HKForge.runner = { renderHome, renderTool: renderToolWithReviews }
})(window)
