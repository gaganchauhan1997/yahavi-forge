/* ============================================================
   YAHAVI FORGE — state (localStorage)
   Keys (BYOK) · preferences · tool input drafts.
   Auth session lives in cookies via @supabase/supabase-js (hk-auth.js).
   ============================================================ */
(function (root) {
  'use strict'

  const KEYS = 'yahavi-forge-keys'
  const PREFS = 'yahavi-forge-prefs'
  const DRAFT_PREFIX = 'yahavi-forge-draft:'

  function jget(k, fallback) {
    try {
      return JSON.parse(localStorage.getItem(k) || 'null') ?? fallback
    } catch {
      return fallback
    }
  }
  function jset(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v))
    } catch {}
  }

  /* ─── keys ─── */
  function loadKeys() {
    return jget(KEYS, {}) || {}
  }
  function saveKeys(keys) {
    jset(KEYS, keys || {})
  }
  function setKey(provider, value) {
    const keys = loadKeys()
    if (value && value.trim()) keys[provider] = value.trim()
    else delete keys[provider]
    saveKeys(keys)
    return keys
  }
  function activeKeyCount() {
    return Object.values(loadKeys()).filter(Boolean).length
  }

  /* ─── prefs ─── */
  const DEFAULT_PREFS = {
    preferredProvider: 'auto',
    tone: 'corporate',
    roastPersona: 'recruiter',
    gapTone: 'confident-honest',
    lastTool: 'home',
  }
  function loadPrefs() {
    return { ...DEFAULT_PREFS, ...(jget(PREFS, {}) || {}) }
  }
  function savePrefs(prefs) {
    jset(PREFS, { ...DEFAULT_PREFS, ...(prefs || {}) })
  }
  function patchPrefs(patch) {
    const p = loadPrefs()
    Object.assign(p, patch || {})
    savePrefs(p)
    return p
  }

  /* ─── per-tool input draft (so reload doesn't lose work) ─── */
  function loadDraft(toolId) {
    return jget(DRAFT_PREFIX + toolId, {}) || {}
  }
  function saveDraft(toolId, inputs) {
    if (!inputs || Object.keys(inputs).length === 0) localStorage.removeItem(DRAFT_PREFIX + toolId)
    else jset(DRAFT_PREFIX + toolId, inputs)
  }
  function clearDraft(toolId) {
    localStorage.removeItem(DRAFT_PREFIX + toolId)
  }

  /* ─── v3 — pushed resumes (output bin from "Push to Resume" buttons) ─── */
  const RESUMES_KEY = 'yahavi-forge-resumes'
  function loadResumes() {
    return jget(RESUMES_KEY, []) || []
  }
  function saveResumes(list) {
    jset(RESUMES_KEY, Array.isArray(list) ? list : [])
  }

  root.HKForge = root.HKForge || {}
  root.HKForge.state = {
    loadKeys,
    saveKeys,
    setKey,
    activeKeyCount,
    loadPrefs,
    savePrefs,
    patchPrefs,
    loadDraft,
    saveDraft,
    clearDraft,
    loadResumes,
    saveResumes,
  }
})(window)
