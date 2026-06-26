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
        ;['btn-copy', 'btn-pdf', 'btn-html'].forEach((b) => ($('#' + b, mount).disabled = false))
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
    $('#btn-pdf', mount).addEventListener('click', () => {
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
    })
    $('#btn-html', mount).addEventListener('click', () => {
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

  root.HKForge = root.HKForge || {}
  root.HKForge.runner = { renderHome, renderTool }
})(window)
