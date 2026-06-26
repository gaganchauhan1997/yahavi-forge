/* ============================================================
   YAHAVI FORGE — Tool registry (16 tools across 5 categories)
   --------------------------------------------------------------
   Merged from:
   • yahavi-forge live (Builder, ATS, Roast, Tailor, Prep, Portfolio, Gap, Quick)
   • resume-hackknow (JD Matcher, Role Finder, Bullet Upgrader, Cover Letter,
       Recruiter Hook, App Optimizer, 6-Second Scan, Truth-Lock, App Pack,
       Company Tailor)
   • yahavi-forge.pages.dev (same UI as live)

   Categories drive the sidebar groupings.
   Each tool is rendered by `runner.js` from this single config — no
   per-tool HTML required.
   ============================================================ */
(function (root) {
  'use strict'

  const TOOLS = {
    /* ───────────────────────── HOME ───────────────────────── */
    home: {
      kind: 'home',
      title: 'Yahavi Forge',
      subtitle: 'AI Career OS · by Hackknow',
      category: 'home',
      num: '00',
      icon: '▸',
    },

    /* ═════════════════════════ BUILD ═════════════════════════ */
    builder: {
      title: 'AI Resume Builder',
      subtitle: 'Raw experience → STAR-method achievement bullets',
      category: 'build',
      num: '01',
      icon: '✦',
      chips: {
        key: 'tone',
        prefKey: 'tone',
        options: [
          { value: 'corporate', label: 'CORPORATE' },
          { value: 'startup', label: 'STARTUP' },
          { value: 'faang', label: 'FAANG' },
          { value: 'creative', label: 'CREATIVE' },
          { value: 'executive', label: 'EXECUTIVE' },
        ],
      },
      inputs: [
        { id: 'role', label: 'Target Role', placeholder: 'e.g. AI Full Stack Developer at a Series-B startup' },
        {
          id: 'experience',
          label: 'Raw Experience / What You Did',
          placeholder:
            'Paste a job description, bullet list, or just write what you did in plain language:\n\n• I built dashboards in Power BI for the operations team\n• I wrote Python scripts that automated daily reports\n• I led a team of 4 analysts\n• I integrated GPT-4 into our customer support tool\n\nForge will transform every line into achievement-grade bullets.',
          rows: 14,
          required: true,
        },
      ],
      systemPrompt: (chip) => `You are Yahavi Forge — an elite resume engineer. Tone for this rewrite: **${chip || 'corporate'}**.

Rewrite the user's raw experience into achievement-grade resume bullets using the STAR method (Situation, Task, Action, Result) so each line maximizes interview callbacks.

Rules:
- Start every bullet with a strong action verb (Architected, Engineered, Shipped, Reduced, Scaled, Automated, Designed, Led).
- Quantify results wherever realistic (%, $, users, time saved, scale).
- Use ATS-friendly plain text.
- NEVER fabricate experience or invent metrics not implied by the input.
- One line per bullet, 18–26 words.
- Bold the most important metric using **text**.

Output the rewritten bullets grouped by role/section, with clear headers.`,
      userPrompt: (i, chip) => `TARGET ROLE: ${i.role || 'Not specified'}
TONE: ${chip || 'corporate'}

RAW EXPERIENCE:
${i.experience}

Rewrite this now.`,
      temperature: 0.7,
      maxTokens: 2500,
    },

    'bullet-upgrader': {
      title: 'Bullet Point Upgrader',
      subtitle: 'Make bullets clearer and more results-focused',
      category: 'build',
      num: '02',
      icon: '✎',
      inputs: [
        {
          id: 'bullets',
          label: 'Your Bullet Points',
          placeholder:
            'Paste resume bullets, one per line:\n\n• Responsible for managing the team\n• Worked on customer analytics\n• Helped with product launches',
          rows: 12,
          required: true,
        },
      ],
      systemPrompt: () => `You are a resume bullet optimization engine. Rewrite each bullet to be:
- Clearer and results-focused
- Starting with a strong action verb
- Quantified where realistic
- Under 2 lines each
- Recruiter-impressive

Format each as: Original → Rewritten (with a one-line explanation of what changed).`,
      userPrompt: (i) => `BULLETS TO UPGRADE:\n${i.bullets}\n\nUpgrade each now.`,
      temperature: 0.8,
      maxTokens: 1500,
    },

    portfolio: {
      title: 'Portfolio Generator',
      subtitle: 'Resume → standalone HTML portfolio page · 5 themes',
      category: 'build',
      num: '03',
      icon: '◆',
      inputs: [
        { id: 'name', label: 'Your Name', placeholder: 'e.g. Gagan Chauhan' },
        {
          id: 'headline',
          label: 'Headline / Title',
          placeholder: 'e.g. AI Full Stack Developer · Founder of Hackknow',
        },
        {
          id: 'links',
          label: 'Links (one per line)',
          placeholder: 'GitHub: github.com/yourname\nLinkedIn: linkedin.com/in/yourname\nEmail: you@domain.com',
          rows: 4,
        },
        {
          id: 'style',
          label: 'Design Theme',
          type: 'select',
          options: [
            { value: 'editorial', label: '▸ EDITORIAL — Magazine-style serif' },
            { value: 'brutalist', label: '▸ BRUTALIST — Bold yellow + pink + hard shadows' },
            { value: 'minimal', label: '▸ MINIMAL — Swiss whitespace, monochrome' },
            { value: 'terminal', label: '▸ TERMINAL — Dark dev/hacker aesthetic' },
            { value: 'luxury', label: '▸ LUXURY — Fashion house, gold accents' },
          ],
        },
        {
          id: 'resume',
          label: 'Full Resume Content',
          placeholder:
            'Paste your full resume — about, experience, skills, projects, education, everything. Forge will structure it into a beautiful standalone webpage.',
          rows: 12,
          required: true,
        },
      ],
      systemPrompt: () => `You are an elite portfolio webpage generator. Produce a COMPLETE, standalone HTML document using only <style> tags (no external CSS), no JavaScript, no external images. Embed all CSS inline within a single <style> block in <head>.

The theme dictates the visual register:
- editorial: warm cream paper, serif headings (Georgia/Playfair), italic accents, magazine grid
- brutalist: hard black borders, yellow #ffea00 + pink #ff2e63 blocks, JetBrains Mono labels, no rounded corners, offset shadows
- minimal: pure white, Inter/system sans, generous whitespace, ultra-thin rules
- terminal: black bg, green #4ade80 + amber accents, monospaced everywhere, ASCII art dividers
- luxury: deep black + gold #c9a55c, Cormorant Garamond serif, art deco motifs, marble-cream sections

Structure the output exactly:
1. Header with name, headline, links
2. About / Summary
3. Experience (chronological)
4. Skills
5. Projects (if mentioned)
6. Education
7. Footer with contact

Output ONLY the complete <!DOCTYPE html>...</html> — nothing else, no commentary.`,
      userPrompt: (i) => `NAME: ${i.name || '—'}
HEADLINE: ${i.headline || '—'}
LINKS:
${i.links || '—'}
THEME: ${i.style || 'brutalist'}

RESUME CONTENT:
${i.resume}

Generate the complete standalone HTML portfolio page now.`,
      temperature: 0.7,
      maxTokens: 4000,
      portfolioOutput: true,
    },

    gap: {
      title: 'Career Gap Framing',
      subtitle: 'Turn gaps, switches, freelance into compelling narrative',
      category: 'build',
      num: '04',
      icon: '↻',
      chips: {
        key: 'gapTone',
        prefKey: 'gapTone',
        options: [
          { value: 'confident-honest', label: 'CONFIDENT & HONEST' },
          { value: 'growth-oriented', label: 'GROWTH-ORIENTED' },
          { value: 'entrepreneurial', label: 'ENTREPRENEURIAL' },
          { value: 'academic', label: 'ACADEMIC' },
        ],
      },
      inputs: [
        {
          id: 'input',
          label: 'Describe the Gap / Transition',
          placeholder:
            'e.g. I took 14 months off after my pharmacy job to study online courses on data analytics and Python. Did some freelance Excel automation gigs during that time.',
          rows: 8,
          required: true,
        },
      ],
      systemPrompt: (chip) => `You are a narrative coach for career gaps and transitions. Tone: **${chip || 'confident-honest'}**.

Reframe the user's gap into THREE polished outputs:

## RESUME LINE
One-line ATS-friendly version that frames the gap as deliberate, growth-driven activity.

## LINKEDIN ABOUT (3-4 sentences)
First-person, warm but professional.

## INTERVIEW ANSWER (60 seconds spoken)
Confident, story-first, with a concrete forward-looking close.

No apologies. No excuses. Show learning + agency.`,
      userPrompt: (i, chip) => `TONE: ${chip || 'confident-honest'}\n\nGAP / TRANSITION:\n${i.input}\n\nReframe now.`,
      temperature: 0.75,
      maxTokens: 1200,
    },

    'quick-achievement': {
      title: 'Achievement Generator',
      subtitle: 'Weak line → 3 quantified, action-led bullets',
      category: 'build',
      num: '05',
      icon: '⚡',
      inputs: [
        {
          id: 'input',
          label: 'Weak Statement to Transform',
          placeholder: 'e.g. "I made reports in Excel for the operations team"',
          rows: 5,
          required: true,
        },
      ],
      systemPrompt: () => `You are an achievement forge. The user gives one weak line; you output THREE distinct, recruiter-magnet bullets — each in a different angle:

## VARIANT A — IMPACT
Lead with the business outcome / dollar / % / scale.

## VARIANT B — SCOPE
Lead with the size of the work (number of stakeholders, frequency, complexity).

## VARIANT C — INNOVATION
Lead with what was novel / what you replaced / how you simplified.

Rules: each bullet ≤ 25 words, action verb start, quantified where reasonable, NO fabrication beyond plausible inference.`,
      userPrompt: (i) => `WEAK STATEMENT:\n${i.input}\n\nForge 3 variants now.`,
      temperature: 0.85,
      maxTokens: 800,
    },

    /* ═════════════════════════ ANALYZE ═════════════════════════ */
    ats: {
      title: 'Career Intelligence Report',
      subtitle: 'ATS score · keyword gap · recruiter perception · rewrite engine',
      category: 'analyze',
      num: '06',
      icon: '◎',
      kind: 'ats',
      inputs: [
        {
          id: 'resume',
          label: 'Your Resume',
          placeholder: 'Paste your full resume text here. Plain text works best — copy from your PDF or DOCX.',
          rows: 14,
          required: true,
        },
        {
          id: 'jd',
          label: 'Job Description',
          placeholder: "Paste the JD you're applying for. Include responsibilities, requirements, and 'about the team'.",
          rows: 14,
          required: true,
        },
      ],
      /* ATS is handled specially by runner.js — combines the local scorer
         (computeLocalAtsScore, works offline) with a full AI report when a
         key is available. See runner.js → runAts. */
    },

    'scan-6sec': {
      title: '6-Second Recruiter Scan',
      subtitle: 'What a senior recruiter sees in the first 6 seconds',
      category: 'analyze',
      num: '07',
      icon: '◉',
      inputs: [
        {
          id: 'resume',
          label: 'Your Resume',
          placeholder: 'Paste your resume.',
          rows: 16,
          required: true,
        },
      ],
      systemPrompt: () => `You are a senior recruiter who scans 200+ resumes per day. Simulate what you see in the FIRST 6 SECONDS of opening this resume.

Format:
## FIRST IMPRESSION
Two sentences. What hits immediately (good or bad).

## WHAT STANDS OUT
The 2–3 things that catch attention.

## WHAT LOOKS RISKY
Red flags or concerns — be specific.

## WHAT FEELS WEAK
Areas needing immediate improvement.

## VERDICT
PASS / MAYBE / INTERVIEW — with a one-line reason.

Be brutally honest. No fluff.`,
      userPrompt: (i) => `RESUME:\n${i.resume}\n\nGive your 6-second scan now.`,
      temperature: 0.6,
      maxTokens: 1000,
    },

    roast: {
      title: 'Resume Roast',
      subtitle: 'Brutal honesty · funny · always useful',
      category: 'analyze',
      num: '08',
      icon: '🔥',
      chips: {
        key: 'roastPersona',
        prefKey: 'roastPersona',
        options: [
          { value: 'recruiter', label: 'HONEST RECRUITER' },
          { value: 'faang', label: 'FAANG RECRUITER' },
          { value: 'hr', label: 'SARCASTIC HR' },
          { value: 'founder', label: 'STARTUP FOUNDER' },
        ],
      },
      inputs: [
        {
          id: 'resume',
          label: 'Feed the Fire',
          placeholder: "Paste your resume. Don't hold back — the more you give, the better the roast.",
          rows: 16,
          required: true,
        },
      ],
      systemPrompt: (chip) => {
        const personas = {
          recruiter:
            "You're a brutally honest senior recruiter. Tough love. Cut through the fluff. End with a tight, actionable 'so here's what I'd do' bullet list.",
          faang:
            "You're a FAANG (Google/Meta/Amazon/Apple) recruiter who screens 500+ resumes per week. Specific, technical, ruthless about leveling and impact. Be honest about whether this clears the bar.",
          hr:
            "You're a sarcastic, slightly tired HR generalist who's seen every cliché. Funny, biting, but every joke hides a real fix. Sign off with 'OK, here's what would actually help…'",
          founder:
            "You're a startup founder who has hired 30+ engineers/operators on a shoestring. You hate buzzword bingo and resume theater. Tell the candidate the truth a founder wishes someone had told THEM.",
        }
        return `${personas[chip || 'recruiter']}

Format:
## THE ROAST (3-5 paragraphs)
## WHAT'S ACTUALLY GOOD (1-2 bullets — don't lie to be nice)
## THE FIX LIST (3-5 specific, actionable items, in priority order)

Stay funny. Stay useful.`
      },
      userPrompt: (i) => `RESUME:\n${i.resume}\n\nLight it up.`,
      temperature: 0.9,
      maxTokens: 1800,
    },

    /* ═════════════════════════ TAILOR ═════════════════════════ */
    'tailor-jd': {
      title: 'Job Tailoring Engine',
      subtitle: '100% truthful · zero invention · maximum match',
      category: 'tailor',
      num: '09',
      icon: '⤲',
      inputs: [
        { id: 'resume', label: 'Original Resume', placeholder: 'Paste your current resume.', rows: 14, required: true },
        { id: 'jd', label: 'Target JD', placeholder: 'Paste the job description you want to land.', rows: 14, required: true },
      ],
      systemPrompt: () => `You are an expert resume tailor. Compare the resume against the JD and produce a tailored version that maximizes the keyword/skill match WITHOUT inventing any experience.

Output format:
## SUMMARY OF CHANGES
Bullet list of what you changed and why.

## TAILORED RESUME
The full rewritten resume, preserving the user's real experience but reshuffling emphasis, surfacing matching keywords, and tightening language.

## MATCH SCORE
BEFORE [estimated %] → AFTER [estimated %].

No fabrication. Bold key metrics with **text**.`,
      userPrompt: (i) => `RESUME:\n${i.resume}\n\n---\n\nJOB DESCRIPTION:\n${i.jd}\n\nTailor it now.`,
      temperature: 0.5,
      maxTokens: 2800,
    },

    'truth-lock': {
      title: 'Truth-Lock Tailor',
      subtitle: 'JD match WITHOUT fabrication — gaps tagged honestly',
      category: 'tailor',
      num: '10',
      icon: '🔒',
      inputs: [
        { id: 'resume', label: 'Your Resume', placeholder: 'Paste your resume.', rows: 12, required: true },
        { id: 'jd', label: 'Job Description', placeholder: 'Paste the JD.', rows: 12, required: true },
      ],
      systemPrompt: () => `You are a truth-locked resume tailoring engine. You NEVER fabricate experience.

Process every line of the resume:
- If it has real evidence that matches the JD → rewrite to emphasize the match.
- If evidence is missing → TAG the gap as [NEEDS EVIDENCE: short description].
- NEVER invent companies, projects, skills, certifications, or metrics.

Output format:

## TAILORED RESUME (truth-locked)
The full rewritten version with [NEEDS EVIDENCE: ...] inline where invention would have been required.

## TAGGED GAPS
A list of every [NEEDS EVIDENCE] tag, with what's missing.

## SUGGESTIONS
For each gap, ONE concrete way the user could honestly acquire/document that evidence in the next 1-2 weeks (course, side project, freelance gig, quantification from prior work).`,
      userPrompt: (i) => `RESUME:\n${i.resume}\n\n---\n\nJOB DESCRIPTION:\n${i.jd}\n\nTailor with truth-lock. NO fabrication.`,
      temperature: 0.4,
      maxTokens: 3000,
    },

    'company-tailor': {
      title: 'Company Tailor',
      subtitle: 'Per-company deep tailoring with culture + ICP context',
      category: 'tailor',
      num: '11',
      icon: '🏢',
      inputs: [
        { id: 'company', label: 'Company Name', placeholder: 'e.g. Stripe' },
        { id: 'role', label: 'Target Role Title', placeholder: 'e.g. Senior Frontend Engineer' },
        { id: 'sourceUrl', label: 'JD URL (optional)', placeholder: 'https://...' },
        { id: 'jd', label: 'Job Description', placeholder: 'Paste the full JD.', rows: 10, required: true },
        { id: 'resume', label: 'Your Resume', placeholder: 'Paste your resume.', rows: 10, required: true },
      ],
      systemPrompt: () => `You are a company-specific resume tailoring engine. Use what you know about the named company's product, public values, ICP, and culture to deepen the match.

Output format:

## COMPANY ANGLE (3 bullets)
What this specific company likely values in this role (product, scale, culture, tech).

## TAILORED RESUME
Full rewritten resume — every bullet adjusted to mirror the company's vocabulary and emphasis. NO fabrication.

## INTERVIEW HOOK (2 sentences)
A specific opener the candidate can use in their first response to "Tell me about yourself" that would resonate with THIS company.

## RISK FLAGS
Any obvious mismatches between resume and the company's likely bar.`,
      userPrompt: (i) =>
        `COMPANY: ${i.company || '—'}\nROLE: ${i.role || '—'}\n${i.sourceUrl ? `JD URL: ${i.sourceUrl}\n` : ''}\nJOB DESCRIPTION:\n${i.jd}\n\nRESUME:\n${i.resume}\n\nTailor for this company specifically.`,
      temperature: 0.6,
      maxTokens: 3200,
    },

    /* ═════════════════════════ OUTREACH ═════════════════════════ */
    'cover-letter': {
      title: 'Cover Letter',
      subtitle: 'Human, confident, specific — not generic',
      category: 'outreach',
      num: '12',
      icon: '✉',
      inputs: [
        { id: 'jd', label: 'Job Description', placeholder: 'Paste the JD.', rows: 10, required: true },
        { id: 'resume', label: 'Your Resume (optional, personalizes the letter)', placeholder: 'Paste your resume.', rows: 8 },
      ],
      systemPrompt: () => `Write a short, tailored cover letter. Sound HUMAN, confident, and specific — NOT generic or obviously AI-written.

Guidelines:
- Open with something specific about the company/role (NOT 'I'm writing to apply for…').
- Show genuine enthusiasm without corporate fluff.
- Reference 1-2 specific experiences that match.
- Keep under 300 words.
- End with a confident CTA (e.g. 'Happy to walk through X on a 15-min call').

Output ONLY the letter — no commentary, no markdown headings.`,
      userPrompt: (i) =>
        `JOB DESCRIPTION:\n${i.jd}\n\n${i.resume ? `MY BACKGROUND:\n${i.resume}\n\n` : ''}Write the cover letter now.`,
      temperature: 0.8,
      maxTokens: 900,
    },

    'recruiter-hook': {
      title: 'Recruiter Hook',
      subtitle: 'LinkedIn/email outreach that gets replies',
      category: 'outreach',
      num: '13',
      icon: '✉↗',
      inputs: [
        { id: 'jd', label: 'Job Post / Role', placeholder: 'Paste the job post or describe the role.', rows: 8, required: true },
        {
          id: 'background',
          label: 'Your 1-Line Pitch (optional)',
          placeholder: 'e.g. "AI Full Stack dev with 5 years building ML-powered products"',
        },
      ],
      systemPrompt: () => `Write a concise LinkedIn or email message to a recruiter for this role. Goal: spark interest and get a reply — NOT ask for a favor.

Rules:
- Under 150 words.
- Lead with value, not a request.
- Show you've read the JD.
- Include a specific hook they can respond to.
- Confident but never arrogant.
- No emojis, no buzzwords.

Output ONLY the message.`,
      userPrompt: (i) =>
        `ROLE:\n${i.jd}\n\nMY BACKGROUND: ${i.background || 'See above'}\n\nWrite the recruiter message now.`,
      temperature: 0.8,
      maxTokens: 600,
    },

    'app-pack': {
      title: 'Application Pack',
      subtitle: 'Full kit: tailored resume + cover + outreach + follow-ups',
      category: 'outreach',
      num: '14',
      icon: '📦',
      inputs: [
        { id: 'resume', label: 'Your Resume', placeholder: 'Paste your resume.', rows: 10, required: true },
        { id: 'jd', label: 'Job Description', placeholder: 'Paste the JD.', rows: 10, required: true },
      ],
      systemPrompt: () => `Generate a COMPLETE application pack for one target role. The candidate will apply tonight.

Output format:

## TAILORED RESUME
Company-specific rewritten resume.

## COVER LETTER
Tailored, human, ≤ 300 words.

## RECRUITER OUTREACH MESSAGE
LinkedIn/email message, ≤ 150 words.

## FOLLOW-UP MESSAGES
2 follow-up templates — Day 5 (gentle) and Day 12 (one last nudge).

## "WHY YOU / WHY THIS COMPANY" SCRIPT
60-second spoken answer for interviews.

Be specific to the role + company. No fluff.`,
      userPrompt: (i) =>
        `RESUME:\n${i.resume}\n\n---\n\nJOB DESCRIPTION:\n${i.jd}\n\nGenerate the full pack now.`,
      temperature: 0.7,
      maxTokens: 3500,
    },

    /* ═════════════════════════ STRATEGY ═════════════════════════ */
    'role-finder': {
      title: 'Role Fit Finder',
      subtitle: '10 roles you might be overlooking',
      category: 'strategy',
      num: '15',
      icon: '🎯',
      inputs: [
        {
          id: 'experience',
          label: 'Your Experience & Skills',
          placeholder: 'Paste your resume OR describe your experience, skills, and background.',
          rows: 14,
          required: true,
        },
      ],
      systemPrompt: () => `You are a career strategist who knows the hidden job market. Based on the candidate's background, list 10 roles they are qualified for but might be overlooking.

For each role, output:
1. **Role title**
2. Why they qualify (2 sentences)
3. Hiring demand: HIGH / MEDIUM / LOW
4. Response likelihood: HIGH / MEDIUM / LOW
5. One specific positioning tip

Rank by (hiring demand × response likelihood). Be honest about gaps. Don't suggest roles where the candidate would obviously be rejected.`,
      userPrompt: (i) => `MY BACKGROUND:\n${i.experience}\n\nList 10 roles I'm overlooking now.`,
      temperature: 0.7,
      maxTokens: 2200,
    },

    'app-optimizer': {
      title: 'Application Optimizer',
      subtitle: 'Smarter job-search strategy (weekly plan)',
      category: 'strategy',
      num: '16',
      icon: '📈',
      inputs: [
        {
          id: 'background',
          label: 'Your Background & Target Roles',
          placeholder: 'Describe your background and the roles you are targeting.',
          rows: 8,
          required: true,
        },
        {
          id: 'goals',
          label: 'Goals (optional)',
          placeholder: 'e.g. "Switch to AI/ML roles within 3 months"',
          rows: 2,
        },
      ],
      systemPrompt: () => `You are a job-search strategist. Create a smarter application strategy for the candidate.

Output:
## WEEKLY TARGETS
How many roles to apply to weekly (with reasoning).

## CUSTOMIZATION STRATEGY
How to customize efficiently for each application without burning out.

## FOLLOW-UP PLAN
When and how to follow up; what to send.

## CHANNEL MIX
% split across LinkedIn EasyApply / direct apply / referrals / recruiter outreach / cold messages — with rationale.

## WEEK-BY-WEEK PLAN
First 4 weeks, concrete actions.

Be specific. Numbers, scripts, time blocks.`,
      userPrompt: (i) =>
        `BACKGROUND:\n${i.background}\n\n${i.goals ? `GOALS:\n${i.goals}\n\n` : ''}Build my strategy now.`,
      temperature: 0.7,
      maxTokens: 2000,
    },

    prep: {
      title: 'Interview Prep Pack',
      subtitle: '12 predicted Qs · STAR answers · power closing questions',
      category: 'strategy',
      num: '17',
      icon: '🎤',
      inputs: [
        { id: 'jd', label: 'Job Description', placeholder: "Paste the JD you're interviewing for.", rows: 10, required: true },
        { id: 'resume', label: 'Resume (optional — personalizes the answers)', placeholder: 'Paste your resume.', rows: 8 },
      ],
      systemPrompt: () => `Build a complete interview prep pack for the candidate.

Output:
## 12 PREDICTED QUESTIONS
Numbered. Mix of behavioral, technical (role-specific), motivational, and culture-fit.

## SAMPLE STAR ANSWER FOR THE TOP 5
Format: "STAR answer for Q#N: [Situation/Task/Action/Result]" — keep each to ~80 seconds spoken.

## POWER CLOSING QUESTIONS
5 questions the candidate should ask THEM — the kind that signal seniority and genuine interest.

## 7-ITEM PREP CHECKLIST
Concrete things to do in the 24 hours before the interview.`,
      userPrompt: (i) =>
        `JOB DESCRIPTION:\n${i.jd}\n\n${i.resume ? `RESUME:\n${i.resume}\n\n` : ''}Build my prep pack now.`,
      temperature: 0.6,
      maxTokens: 3000,
    },
  }

  /* Sidebar groupings — order matters */
  const SIDEBAR = [
    { id: 'home', label: 'HOME', items: ['home'] },
    {
      id: 'build',
      label: 'BUILD',
      items: ['builder', 'bullet-upgrader', 'portfolio', 'gap', 'quick-achievement'],
    },
    {
      id: 'analyze',
      label: 'ANALYZE',
      items: ['ats', 'scan-6sec', 'roast'],
    },
    {
      id: 'tailor',
      label: 'TAILOR',
      items: ['tailor-jd', 'truth-lock', 'company-tailor'],
    },
    {
      id: 'outreach',
      label: 'OUTREACH',
      items: ['cover-letter', 'recruiter-hook', 'app-pack'],
    },
    {
      id: 'strategy',
      label: 'STRATEGY',
      items: ['role-finder', 'app-optimizer', 'prep'],
    },
  ]

  root.HKForge = root.HKForge || {}
  root.HKForge.TOOLS = TOOLS
  root.HKForge.SIDEBAR = SIDEBAR
})(window)
