/* ============================================================
   YAHAVI FORGE — BYOK AI providers + orchestration
   --------------------------------------------------------------
   Six free-tier providers (Groq · Gemini · OpenRouter · Together ·
   Mistral · Cohere). Auto-fallback ordering. Smart error mapping
   (401 / 429 / 403 / network) → human messages.
   Plus: local ATS scorer (works offline) and a tight Markdown→HTML.
   ============================================================ */
(function (root) {
  'use strict'

  const PROVIDERS = {
    groq: {
      name: 'Groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile',
      fallbackModel: 'llama-3.1-8b-instant',
      type: 'openai',
      keyHint: 'gsk_...',
      keyUrl: 'https://console.groq.com/keys',
      note: 'Fastest free tier · 14,400 req/day',
    },
    gemini: {
      name: 'Google Gemini',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      fallbackUrl:
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      model: 'gemini-2.0-flash',
      type: 'gemini',
      keyHint: 'AIza...',
      keyUrl: 'https://aistudio.google.com/apikey',
      note: 'Free · 1,500 req/day · 1M context',
    },
    openrouter: {
      name: 'OpenRouter',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      fallbackModel: 'google/gemini-2.0-flash-exp:free',
      type: 'openai',
      keyHint: 'sk-or-...',
      keyUrl: 'https://openrouter.ai/keys',
      note: 'Free tier across 100+ models',
    },
    together: {
      name: 'Together AI',
      url: 'https://api.together.xyz/v1/chat/completions',
      model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
      type: 'openai',
      keyHint: 'API key',
      keyUrl: 'https://api.together.xyz/settings/api-keys',
      note: 'Free tier · $5 signup credit',
    },
    mistral: {
      name: 'Mistral',
      url: 'https://api.mistral.ai/v1/chat/completions',
      model: 'mistral-small-latest',
      type: 'openai',
      keyHint: 'API key',
      keyUrl: 'https://console.mistral.ai/api-keys',
      note: 'Free tier · La Plateforme',
    },
    cohere: {
      name: 'Cohere',
      url: 'https://api.cohere.com/v2/chat',
      model: 'command-r-08-2024',
      type: 'cohere',
      keyHint: 'API key',
      keyUrl: 'https://dashboard.cohere.com/api-keys',
      note: 'Free trial · 1,000 req/month',
    },
  }
  const PROVIDER_ORDER = ['groq', 'gemini', 'openrouter', 'together', 'mistral', 'cohere']

  /* ──────────────────────── single provider call ──────────────────────── */
  async function callProvider(id, key, messages, options) {
    const p = PROVIDERS[id]
    const temperature = options.temperature ?? 0.7
    const maxTokens = options.max_tokens ?? 2048
    options = options || {}

    if (p.type === 'openai') {
      const body = {
        model: options.model || p.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }
      if (options.json_mode) body.response_format = { type: 'json_object' }
      const res = await fetch(p.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const text = await res.text()
        const err = new Error(`HTTP ${res.status}: ${text.slice(0, 240)}`)
        err.status = res.status
        throw err
      }
      const data = await res.json()
      return data.choices?.[0]?.message?.content || ''
    }

    if (p.type === 'gemini') {
      const sys = messages.find((m) => m.role === 'system')
      const turns = messages.filter((m) => m.role !== 'system')
      const body = {
        contents: turns.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }
      if (options.json_mode)
        body.generationConfig.responseMimeType = 'application/json'
      if (sys) body.systemInstruction = { parts: [{ text: sys.content }] }

      const tryUrl = async (url) =>
        fetch(`${url}?key=${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      let res = await tryUrl(p.url)
      if (!res.ok && p.fallbackUrl) {
        const res2 = await tryUrl(p.fallbackUrl)
        if (res2.ok) {
          const d2 = await res2.json()
          return d2.candidates?.[0]?.content?.parts?.[0]?.text || ''
        }
      }
      if (!res.ok) {
        const text = await res.text()
        const err = new Error(`HTTP ${res.status}: ${text.slice(0, 240)}`)
        err.status = res.status
        throw err
      }
      const data = await res.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }

    if (p.type === 'cohere') {
      const body = {
        model: options.model || p.model,
        messages: messages.map((m) => ({
          role:
            m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
          content: m.content,
        })),
        temperature,
      }
      const res = await fetch(p.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const text = await res.text()
        const err = new Error(`HTTP ${res.status}: ${text.slice(0, 240)}`)
        err.status = res.status
        throw err
      }
      const data = await res.json()
      return data.message?.content?.[0]?.text || ''
    }

    throw new Error(`Unknown provider type: ${p.type}`)
  }

  /* ─────────────────────── orchestration with fallback ─────────────────────── */
  async function aiCall(keys, prefs, messages, options) {
    options = options || {}
    const order =
      prefs?.preferredProvider && prefs.preferredProvider !== 'auto' && keys[prefs.preferredProvider]
        ? [prefs.preferredProvider, ...PROVIDER_ORDER.filter((p) => p !== prefs.preferredProvider)]
        : PROVIDER_ORDER

    const errors = []
    for (const id of order) {
      if (!keys[id]) continue
      try {
        const result = await callProvider(id, keys[id], messages, options)
        return { result, provider: id }
      } catch (e) {
        errors.push({ id, msg: e.message || String(e), status: e.status })
      }
    }
    if (errors.length === 0) {
      throw new Error(
        'NO API KEYS CONFIGURED\n\nOpen the ▸ KEYS panel and paste at least one free key.\nFastest start: Groq (60-second signup) — https://console.groq.com/keys'
      )
    }
    const summary = errors
      .map((e) => {
        const name = PROVIDERS[e.id]?.name || e.id
        if (e.status === 401 || /401|invalid|unauthor/i.test(e.msg))
          return `▸ ${name}: API key INVALID — regenerate at ${PROVIDERS[e.id]?.keyUrl}`
        if (e.status === 429 || /429|rate|quota/i.test(e.msg))
          return `▸ ${name}: RATE LIMITED — wait a minute or add another provider as backup`
        if (e.status === 403 || /403|forbidden/i.test(e.msg))
          return `▸ ${name}: ACCESS DENIED — key may need billing/verification`
        return `▸ ${name}: ${e.msg.slice(0, 200)}`
      })
      .join('\n')
    throw new Error(summary + '\n\nFix the issue above OR add another provider as fallback in ▸ KEYS.')
  }

  /* ──────────────────────── local ATS scorer (offline) ──────────────────────── */
  function computeLocalAtsScore(resumeText, jdText) {
    const STOP = new Set(
      'the a an and or but of in on at to for from with by as is was are were be been being have has had do does did will would shall should can could may might must this that these those it its i you he she we they them their our your his her my me us him about into through during before after above below up down out off over under again further then once here there when where why how all any both each few more most other some such no nor not only own same so than too very company role responsible work team using used use working'.split(
        ' '
      )
    )
    const tokenize = (t) =>
      (t || '').toLowerCase().match(/[a-z][a-z0-9+#.\-]{2,}/g)?.filter((w) => !STOP.has(w) && w.length >= 3) || []
    const ngrams = (toks, n) => {
      const out = []
      for (let i = 0; i <= toks.length - n; i++) out.push(toks.slice(i, i + n).join(' '))
      return out
    }
    const extract = (text, topK = 40) => {
      const toks = tokenize(text)
      const freq = {}
      toks.forEach((t) => (freq[t] = (freq[t] || 0) + 1))
      ngrams(toks, 2).forEach((bg) => {
        if (bg.split(' ').every((p) => p.length >= 4)) freq[bg] = (freq[bg] || 0) + 1.5
      })
      return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, topK)
    }
    const resumeLower = (resumeText || '').toLowerCase()
    const jdKw = extract(jdText, 40)
    const matched = jdKw.filter(([k]) => resumeLower.includes(k)).map(([k]) => k)
    const missing = jdKw.filter(([k]) => !resumeLower.includes(k)).map(([k]) => k)
    const kwScore = Math.min(50, Math.round((50 * matched.length) / Math.max(1, jdKw.length)))
    const words = (resumeText || '').split(/\s+/).filter(Boolean).length
    let lengthScore = 5
    if (words >= 350 && words <= 900) lengthScore = 10
    else if ((words >= 250 && words < 350) || (words > 900 && words <= 1100)) lengthScore = 7
    else if (words < 250) lengthScore = 3
    const sections = {
      experience: ['experience', 'work history', 'employment', 'professional'],
      education: ['education', 'academic', 'university', 'college', 'degree'],
      skills: ['skills', 'technologies', 'competencies', 'expertise', 'tech stack'],
      summary: ['summary', 'about', 'profile', 'objective'],
    }
    const sectionsFound = Object.values(sections).filter((kws) => kws.some((k) => resumeLower.includes(k))).length
    const sectionScore = Math.round((15 * sectionsFound) / 4)
    const verbs =
      'architected built shipped engineered designed led managed drove reduced increased accelerated automated optimized scaled launched delivered created developed implemented integrated migrated owned spearheaded transformed negotiated mentored achieved improved boosted streamlined orchestrated executed'.split(
        ' '
      )
    const verbHits = verbs.filter((v) => new RegExp('\\b' + v + '\\b').test(resumeLower)).length
    const verbScore = Math.min(10, verbHits)
    const quantHits = ((resumeText || '').match(/\b\d+[%xKkMmBb]?\b/g) || []).length
    const quantScore = Math.min(15, quantHits)
    const total = kwScore + lengthScore + sectionScore + verbScore + quantScore
    return {
      score: total,
      word_count: words,
      matched_keywords: matched.slice(0, 20),
      missing_keywords: missing.slice(0, 25),
      verb_hits: verbHits,
      quant_hits: quantHits,
      breakdown: {
        keyword_overlap: { score: kwScore, max: 50 },
        length_density: { score: lengthScore, max: 10 },
        section_completeness: { score: sectionScore, max: 15 },
        action_verbs: { score: verbScore, max: 10 },
        quantified_impact: { score: quantScore, max: 15 },
      },
    }
  }

  /* ──────────────────────── tiny Markdown → HTML ──────────────────────── */
  function mdToHtml(text) {
    if (!text) return ''
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>')
    html = html.replace(/\*\*([^\*\n]+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>')
    try {
      html = html.replace(/(?<!\w)\*([^\*\n]+?)\*(?!\w)/g, '<em>$1</em>')
    } catch {
      html = html.replace(/\*([^\*\n]+?)\*/g, '<em>$1</em>')
    }
    html = html.replace(/^### +(.+)$/gm, '<h3>$1</h3>')
    html = html.replace(/^## +(.+)$/gm, '<h2>$1</h2>')
    html = html.replace(/^# +(.+)$/gm, '<h1>$1</h1>')
    html = html.replace(/^[\-\*_]{3,}\s*$/gm, '<hr>')
    html = html.replace(/^> +(.+)$/gm, '<blockquote>$1</blockquote>')
    html = html.replace(/^[ \t]*[\-\*\+•] +(.+)$/gm, '<li data-bullet="u">$1</li>')
    html = html.replace(/^[ \t]*\d+\. +(.+)$/gm, '<li data-bullet="o">$1</li>')
    html = html.replace(
      /(<li data-bullet="u">[\s\S]*?<\/li>)(?:\n*(<li data-bullet="u">[\s\S]*?<\/li>))+/g,
      (m) => '<ul>' + m.replace(/ data-bullet="u"/g, '') + '</ul>'
    )
    html = html.replace(
      /(<li data-bullet="o">[\s\S]*?<\/li>)(?:\n*(<li data-bullet="o">[\s\S]*?<\/li>))+/g,
      (m) => '<ol>' + m.replace(/ data-bullet="o"/g, '') + '</ol>'
    )
    html = html.replace(/<li data-bullet="u">([\s\S]*?)<\/li>/g, '<ul><li>$1</li></ul>')
    html = html.replace(/<li data-bullet="o">([\s\S]*?)<\/li>/g, '<ol><li>$1</li></ol>')
    html = html
      .split(/\n\n+/)
      .map((block) => {
        const t = block.trim()
        if (!t) return ''
        if (/^<(h\d|ul|ol|li|hr|p|pre|blockquote|div)/.test(t)) return block
        return '<p>' + block.replace(/\n/g, '<br>') + '</p>'
      })
      .join('\n')
    return html
  }

  root.HKForge = root.HKForge || {}
  root.HKForge.PROVIDERS = PROVIDERS
  root.HKForge.PROVIDER_ORDER = PROVIDER_ORDER
  root.HKForge.aiCall = aiCall
  root.HKForge.computeLocalAtsScore = computeLocalAtsScore
  root.HKForge.mdToHtml = mdToHtml
})(window)
