/* ============================================================
   YAHAVI FORGE — bootstrap.
   Load order assumed: providers → state → tools-config → runner → ui → main
   ============================================================ */
(function () {
  'use strict'
  // Expose top-level helpers
  window.HKForge.aiCall = window.HKForge.aiCall // already on namespace
  document.addEventListener('DOMContentLoaded', () => {
    try {
      window.HKForge.UI.init()
    } catch (e) {
      console.error('Forge init failed:', e)
    }
  })
})()
