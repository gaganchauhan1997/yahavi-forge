/* ============================================================
   YAHAVI FORGE — scroll reveal
   Adds .in-view to elements with .reveal as they enter the viewport.
   Respects prefers-reduced-motion. One-shot per element by default.
   ============================================================ */
(function () {
  'use strict'

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function init() {
    const targets = document.querySelectorAll('.reveal')
    if (!targets.length) return

    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('in-view'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in-view')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.08 }
    )
    targets.forEach((el) => io.observe(el))

    /* Soft parallax on hero title — subtle. */
    const title = document.querySelector('.land-title')
    if (title) {
      let ticking = false
      window.addEventListener(
        'scroll',
        () => {
          if (ticking) return
          ticking = true
          requestAnimationFrame(() => {
            const y = Math.min(window.scrollY, 220)
            title.style.transform = `translateY(${y * 0.12}px)`
            ticking = false
          })
        },
        { passive: true }
      )
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
