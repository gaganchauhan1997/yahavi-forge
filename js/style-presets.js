/* ============================================================
   YAHAVI FORGE — 30 Output Style Presets (v5)
   Applied to .output-area via CSS class.
   Each preset has: id, label, emoji, description.
   CSS lives in style-presets.css.
   ============================================================ */
(function (root) {
  'use strict'

  const PRESETS = [
    { id: 'default',       label: 'Default',         emoji: '⬜', desc: 'Standard Forge output' },
    { id: 'professional',  label: 'Professional',     emoji: '👔', desc: 'Clean, formal, hiring-ready' },
    { id: 'corporate',     label: 'Corporate',        emoji: '🏢', desc: 'Navy blue, structured' },
    { id: 'startup',       label: 'Startup',          emoji: '🚀', desc: 'Bold, energetic, modern' },
    { id: 'faang',         label: 'FAANG',            emoji: '🎯', desc: 'Google/Meta ultra-minimal' },
    { id: 'executive',     label: 'Executive',        emoji: '💼', desc: 'Premium, dark, serious' },
    { id: 'creative',      label: 'Creative',         emoji: '🎨', desc: 'Colourful, expressive' },
    { id: 'tech',          label: 'Tech Terminal',    emoji: '💻', desc: 'Monospace, developer look' },
    { id: 'consulting',    label: 'Consulting',       emoji: '📊', desc: 'McKinsey-style bullet density' },
    { id: 'finance',       label: 'Finance',          emoji: '📈', desc: 'Bloomberg terminal feel' },
    { id: 'academic',      label: 'Academic',         emoji: '🎓', desc: 'Formal serif, structured' },
    { id: 'design',        label: 'Design',           emoji: '✏️', desc: 'Portfolio, visual hierarchy' },
    { id: 'warm',          label: 'Warm Amber',       emoji: '🌅', desc: 'Warm tones, approachable' },
    { id: 'teal',          label: 'Teal Modern',      emoji: '🌊', desc: 'Fresh, clean teal' },
    { id: 'pastel',        label: 'Pastel Soft',      emoji: '🌸', desc: 'Soft, gentle, approachable' },
    { id: 'neon',          label: 'Neon Night',       emoji: '⚡', desc: 'Cyberpunk dark + neon' },
    { id: 'newspaper',     label: 'Newspaper',        emoji: '📰', desc: 'Classic print editorial' },
    { id: 'brutalist',     label: 'Brutalist',        emoji: '◼', desc: 'Bold, raw, Forge-brand style' },
    { id: 'gradient',      label: 'Gradient',         emoji: '🌈', desc: 'Colourful gradient accents' },
    { id: 'indian',        label: 'Indian Classic',   emoji: '🪔', desc: 'Red/gold, traditional' },
    { id: 'minimal',       label: 'Minimal White',    emoji: '🤍', desc: 'Ultra clean, pure white' },
    { id: 'forest',        label: 'Dark Forest',      emoji: '🌲', desc: 'Deep green, nature' },
    { id: 'print',         label: 'Print Ready',      emoji: '🖨️', desc: 'B&W, optimised for printing' },
    { id: 'ats',           label: 'ATS Safe',         emoji: '🤖', desc: 'ATS-safe plain formatting' },
    { id: 'linkedin',      label: 'LinkedIn',         emoji: '💙', desc: 'LinkedIn-inspired blue' },
    { id: 'boxed',         label: 'Boxed',            emoji: '📦', desc: 'Each section in a card box' },
    { id: 'timeline',      label: 'Timeline',         emoji: '📅', desc: 'Chronological dot timeline' },
    { id: 'compact',       label: 'Compact',          emoji: '🗜️', desc: 'Dense, space-efficient' },
    { id: 'spacious',      label: 'Spacious',         emoji: '🌌', desc: 'Lots of breathing room' },
    { id: 'highlighted',   label: 'Highlighted',      emoji: '✨', desc: 'Key terms auto-highlighted' },
  ]

  /* Render the preset picker bar in `container` */
  function renderPicker(container, outputArea, currentPreset) {
    if (!container || !outputArea) return
    let active = currentPreset || 'default'

    container.innerHTML = `
      <div class="sp-label">▸ STYLE PRESETS</div>
      <div class="sp-scroll">
        ${PRESETS.map(p => `
          <button class="sp-chip${p.id === active ? ' active' : ''}"
            data-preset="${p.id}" title="${p.desc}" type="button">
            <span class="sp-emoji">${p.emoji}</span>
            <span class="sp-name">${p.label}</span>
          </button>`).join('')}
      </div>
    `

    function apply(id) {
      active = id
      // Remove old preset classes
      PRESETS.forEach(p => outputArea.classList.remove('sp-' + p.id))
      if (id !== 'default') outputArea.classList.add('sp-' + id)
      // Update active chip
      container.querySelectorAll('.sp-chip').forEach(b =>
        b.classList.toggle('active', b.dataset.preset === id)
      )
      // Persist per-tool
      try {
        const key = 'yahavi-forge-preset-' + (outputArea.dataset.toolId || 'default')
        localStorage.setItem(key, id)
      } catch {}
    }

    container.querySelectorAll('.sp-chip').forEach(btn =>
      btn.addEventListener('click', () => apply(btn.dataset.preset))
    )

    // Restore saved preset
    try {
      const key = 'yahavi-forge-preset-' + (outputArea.dataset.toolId || 'default')
      const saved = localStorage.getItem(key)
      if (saved && saved !== 'default') apply(saved)
    } catch {}
  }

  root.HKForge = root.HKForge || {}
  root.HKForge.StylePresets = { PRESETS, renderPicker }
})(window)
