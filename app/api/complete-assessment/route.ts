import { createClient } from '@/lib/supabase/server'
import { calculateScores, getLevelFromScore } from '@/lib/scoring'
import { DOMAINS } from '@/lib/maturityData'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const AssessmentSchema = z.object({
  companyInfo: z.object({
    company: z.string().min(1).max(100),
    name: z.string().min(1).max(100),
    title: z.string().max(50).default('CEO'),
    volume: z.string().max(50).optional().default(''),
    state: z.string().max(50).optional().default(''),
  }),
  answers: z.record(
    z.string(),
    z.enum(['-1', '0', '1', '2', '3', 'na']).nullable()
  ),
  assessmentId: z.string().uuid().nullable().optional(),
})

function getNextLevel(currentLevel: string): string | null {
  const progression: Record<string, string> = { '-1': '0', '0': '1', '1': '2', '2': '3' }
  return progression[currentLevel] ?? null
}

function identifyPriorityDomains(domainScores: ReturnType<typeof calculateScores>['domainScores']) {
  const scored = Object.values(domainScores).filter(d => d.answered > 0)
  const avg = scored.reduce((sum, d) => sum + d.pct, 0) / scored.length
  const sorted = [...scored].sort((a, b) => a.pct - b.pct)
  const spread = sorted[sorted.length - 1].pct - sorted[0].pct
  const isClustered = spread <= 15

  const priorityDomains = isClustered
    ? sorted.slice(0, 3)
    : sorted.filter(d => d.pct < 37.5 || d.pct < avg - 15).slice(0, 2)

  // If two focus domains are within 10 points — treat as parallel priorities (different teams, same timeframe)
  const twoDomainsClose = priorityDomains.length >= 2 &&
    (priorityDomains[1].pct - priorityDomains[0].pct) <= 10

  return { focusDomains: priorityDomains, isClustered, twoDomainsClose, avg: Math.round(avg) }
}

function buildPrompt(
  companyInfo: z.infer<typeof AssessmentSchema>['companyInfo'],
  domainScores: ReturnType<typeof calculateScores>['domainScores'],
  overall: number,
  answers: Record<string, string | null>
) {
  const level = getLevelFromScore(overall)
  const sorted = Object.values(domainScores).filter(d => d.answered > 0).sort((a, b) => a.pct - b.pct)
  const highest = sorted[sorted.length - 1]
  const { focusDomains, isClustered, twoDomainsClose, avg } = identifyPriorityDomains(domainScores)

  // Gap analysis — focus domains only, lowest questions first
  let gapAnalysis = ''
  DOMAINS.forEach(domain => {
    const domainScore = domainScores[domain.key]
    if (!domainScore || domainScore.answered === 0) return
    if (!focusDomains.find(f => f.domainName === domainScore.domainName)) return

    const isPrimary = focusDomains[0].domainName === domainScore.domainName
    gapAnalysis += `\n\n### ${domain.name} — ${domainScore.pct}% (${getLevelFromScore(domainScore.pct).name})`
    gapAnalysis += twoDomainsClose ? ' ← PARALLEL PRIORITY\n' : isPrimary ? ' ← PRIMARY FOCUS\n' : ' ← SECONDARY (address after primary is moving)\n'

    const questionScores: { q: typeof domain.questions[0], ans: string }[] = []
    domain.questions.forEach(q => {
      const ans = answers[q.id]
      if (ans === null || ans === undefined || ans === 'na') return
      questionScores.push({ q, ans })
    })

    questionScores.sort((a, b) => {
      const scoreMap: Record<string, number> = { '-1': 0, '0': 1, '1': 2, '2': 3, '3': 4 }
      return (scoreMap[a.ans] ?? 0) - (scoreMap[b.ans] ?? 0)
    })

    questionScores.forEach(({ q, ans }) => {
      const nextLevel = getNextLevel(ans)
      if (!nextLevel) return
      const currentDesc = q.levels[ans] ?? ''
      const nextDesc = q.levels[nextLevel] ?? ''
      gapAnalysis += `\n**${q.label}** (Level ${ans} → Level ${nextLevel})\n`
      gapAnalysis += `Now: ${currentDesc}\n`
      gapAnalysis += `Next: ${nextDesc}\n`
    })
  })

  const domainSummary = sorted
    .map(d => `- ${d.domainName}: ${d.pct}% (${getLevelFromScore(d.pct).name})`)
    .join('\n')

  const focusContext = isClustered
    ? `All domains are within a narrow range (avg ${avg}%). No single domain is dramatically worse — focus on raising the floor across all areas.`
    : twoDomainsClose
    ? `Two domains are essentially tied at the bottom and should be treated as PARALLEL priorities: ${focusDomains.map(d => `${d.domainName} at ${d.pct}%`).join(' and ')}. These likely involve different teams so both can be worked simultaneously in the next 90 days.`
    : `One domain is clearly the primary focus: ${focusDomains[0]?.domainName} at ${focusDomains[0]?.pct}%. ${focusDomains.length > 1 ? `${focusDomains[1]?.domainName} at ${focusDomains[1]?.pct}% should be addressed after the primary is moving (days 90-180).` : ''}`

  // Per-domain section instructions for the prompt
  const domainSectionInstructions = focusDomains.map((fd, i) => {
    const timing = twoDomainsClose
      ? `Next 90 Days`
      : i === 0
      ? `First 90 Days`
      : `Days 90–180 (after ${focusDomains[0].domainName} is moving)`

    return `
<h4>${twoDomainsClose ? 'Priority' : i === 0 ? 'Your #1 Priority' : 'Also Needs Attention'}: ${fd.domainName}</h4>
[Write 1 focused paragraph on this domain. Reference the specific questions where they scored lowest. Describe what they're doing today and what the next level looks like — use the gap analysis content but write it in your own words, conversationally. Explain why this matters to their business. Keep it to the point.]

<h4>${fd.domainName} — Action Plan (${timing})</h4>
[Write 3-4 concrete actions specific to this domain. Each action must be something a specific person on this team can own and execute — not a concept. Lead with the most impactful. Base each action directly on the gap analysis for this domain. Format as a numbered list with <br/> between items.]

<h4>You'll Know You're There When... (${fd.domainName})</h4>
[Write 3-4 outcome milestone statements. Each starts with "You'll know you're there when..." and describes a concrete, observable condition that signals they've reached the next level. Derive these from the "Next" level descriptions in the gap analysis but rewrite them as real-world indicators — not copy-paste from the model. They should feel like advice from a smart industry insider.]`
  }).join('\n')

  return `You are an expert operational advisor for residential homebuilders. Give specific, actionable guidance — not generic advice. Every recommendation must tie directly to the gap analysis below.

Company: ${companyInfo.company} (${companyInfo.volume} homes/year, ${companyInfo.state})
Respondent: ${companyInfo.name}, ${companyInfo.title}
Overall Score: ${overall}% — ${level.name} ('${level.sentiment}')

Domain Scores (lowest to highest):
${domainSummary}

${focusContext}
Strongest domain: ${highest?.domainName} at ${highest?.pct}%

---
GAP ANALYSIS — Where They Are Now vs. What the Next Level Looks Like:
Use this directly. Do not generalize. Reference specific gaps when writing recommendations. Do not copy-paste the descriptions verbatim — translate them into plain, practical language.
${gapAnalysis}
---

Write the assessment using exactly these sections. A builder can only realistically act on a handful of things in the 6 months before their next assessment — keep advice tight, prioritized, and achievable. Do not pad. Keep each domain's advice separate so different team members can own their section.

<h4>Where You Stand</h4>
[2-3 sentences. Name their level, what it means day-to-day, and the single biggest operational constraint holding them back. Be direct.]
${domainSectionInstructions}

<h4>Protect Your Strength: ${highest?.domainName}</h4>
[1-2 sentences. Acknowledge what they're doing well and briefly note how this strength can support improvement in the weaker areas.]

Tone: Direct, practical, written for a homebuilder CEO. No filler. Reference maturity level names (Anchor, Typical, Strategic Implementer, Adaptive Innovator, Guiding Star) where relevant.
Format with <h4> headers and <p> tags. Use <br/> between numbered action items.`
}

function getFallbackRecommendations(
  domainScores: ReturnType<typeof calculateScores>['domainScores'],
  overall: number,
  companyInfo: z.infer<typeof AssessmentSchema>['companyInfo']
) {
  const level = getLevelFromScore(overall)
  const sorted = Object.values(domainScores).filter(d => d.answered > 0).sort((a, b) => a.pct - b.pct)
  const highest = sorted[sorted.length - 1]
  const { focusDomains, twoDomainsClose } = identifyPriorityDomains(domainScores)

  const domainFallbacks = focusDomains.map((fd, i) => {
    const timing = twoDomainsClose ? 'Next 90 Days' : i === 0 ? 'First 90 Days' : 'Days 90–180'
    return `<h4>${fd.domainName} — Action Plan (${timing})</h4><p>1. Document your current process in ${fd.domainName} — write down exactly what happens today.<br/>2. Identify the two lowest-scoring questions in this domain and assign a named person to own each improvement.<br/>3. Set a clear target: define what the next level looks like for your business specifically.</p><h4>You'll Know You're There When... (${fd.domainName})</h4><p>You'll know you're there when your team can describe your ${fd.domainName} process without hesitation.<br/>You'll know you're there when exceptions in this area are rare and handled by your system, not by you personally.<br/>You'll know you're there when the people responsible for this domain stop firefighting and start operating proactively.</p>`
  }).join('')

  return `<h4>Where You Stand</h4><p>${companyInfo.company} scored ${overall}%, placing you at the <strong>${level.name}</strong> level — '${level.sentiment}'. ${overall < 50 ? 'There are significant opportunities to systematize operations and reduce reactive firefighting.' : 'You are ahead of most builders. Focus now on the gaps pulling your overall score down.'}</p>${domainFallbacks}<h4>Protect Your Strength: ${highest?.domainName}</h4><p>Your strongest domain is <strong>${highest?.domainName} at ${highest?.pct}%</strong>. Use the discipline that got you here to drive improvement in your weaker areas.</p>`
}

async function getAIRecommendations(prompt: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('AI_TIMEOUT')), 25000)
  )
  const aiPromise = anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })
  try {
    const response = await Promise.race([aiPromise, timeoutPromise])
    return response.content[0].type === 'text' ? response.content[0].text : ''
  } catch (err: unknown) {
    console.error('AI recommendation error:', err instanceof Error ? err.message : err)
    return ''
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = AssessmentSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const { companyInfo, answers, assessmentId } = parsed.data

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!sub) return Response.json({ error: 'No active subscription' }, { status: 403 })

    const cleanAnswers = Object.fromEntries(
      Object.entries(answers).filter(([, v]) => v !== null)
    ) as Record<string, string>

    const { domainScores, overall, maturityLevel } = calculateScores(cleanAnswers)

    const prompt = buildPrompt(companyInfo, domainScores, overall, answers)
    let recommendations = await getAIRecommendations(prompt)
    if (!recommendations) {
      recommendations = getFallbackRecommendations(domainScores, overall, companyInfo)
    }

    const domainScoresForDB = Object.fromEntries(
      Object.entries(domainScores).map(([k, v]) => [k, { pct: v.pct, answered: v.answered, total: v.total }])
    )

    const assessmentData = {
      user_id: user.id,
      company_name: companyInfo.company,
      respondent_name: companyInfo.name,
      respondent_title: companyInfo.title,
      homes_per_year: companyInfo.volume,
      state_region: companyInfo.state,
      answers: cleanAnswers,
      domain_scores: domainScoresForDB,
      overall_score: overall,
      maturity_level: maturityLevel.name,
      maturity_level_key: maturityLevel.key,
      ai_recommendations: recommendations,
      status: 'complete',
      completed_at: new Date().toISOString(),
    }

    let savedId = assessmentId

    if (assessmentId) {
      await supabase.from('assessments').update(assessmentData).eq('id', assessmentId).eq('user_id', user.id)
    } else {
      const { data } = await supabase.from('assessments').insert(assessmentData).select('id').single()
      savedId = data?.id

      if (sub.plan_type === 'onetime') {
        await supabase.from('subscriptions')
          .update({ assessments_used: (sub.assessments_used ?? 0) + 1 })
          .eq('id', sub.id)
      }
    }

    return Response.json({
      id: savedId,
      domainScores: domainScoresForDB,
      overall,
      maturityLevel,
      recommendations,
    })
  } catch (err) {
    console.error('complete-assessment error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
