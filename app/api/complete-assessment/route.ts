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

  // Sort lowest to highest
  const sorted = [...scored].sort((a, b) => a.pct - b.pct)

  // Determine if domains are clustered (all within 15 points of each other)
  const spread = sorted[sorted.length - 1].pct - sorted[0].pct
  const isClustered = spread <= 15

  // Priority domains: below 37.5% (Anchor/Typical) OR more than 15 pts below average
  // Hard floor: always flag anything below 37.5% regardless
  const priorityDomains = isClustered
    ? sorted // all are roughly equal — treat all as priorities
    : sorted.filter(d => d.pct < 37.5 || d.pct < avg - 15)

  // Cap at 2 priority domains to keep advice actionable
  // If clustered, still cap at 2-3 most impactful
  const focusDomains = isClustered ? sorted.slice(0, 3) : priorityDomains.slice(0, 2)

  return { focusDomains, isClustered, avg: Math.round(avg), spread }
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
  const { focusDomains, isClustered, avg } = identifyPriorityDomains(domainScores)

  // Build gap analysis ONLY for focus domains — current level + next level from the model
  let gapAnalysis = ''
  DOMAINS.forEach(domain => {
    const domainScore = domainScores[domain.key]
    if (!domainScore || domainScore.answered === 0) return
    if (!focusDomains.find(f => f.domainName === domainScore.domainName)) return

    const isPrimary = focusDomains[0].domainName === domainScore.domainName
    gapAnalysis += `\n\n### ${domain.name} — ${domainScore.pct}% (${getLevelFromScore(domainScore.pct).name})`
    gapAnalysis += isPrimary ? ' ← PRIMARY FOCUS\n' : '\n'

    // Find the lowest scoring questions within this domain first
    const questionScores: { q: typeof domain.questions[0], ans: string }[] = []
    domain.questions.forEach(q => {
      const ans = answers[q.id]
      if (ans === null || ans === undefined || ans === 'na') return
      questionScores.push({ q, ans })
    })

    // Sort questions lowest score first
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
    ? `All domains are clustered within a narrow range (avg ${avg}%). No single domain is dramatically worse than others — focus on raising the floor across all areas.`
    : `Focus domains are meaningfully below the average of ${avg}%: ${focusDomains.map(d => `${d.domainName} at ${d.pct}%`).join(', ')}.`

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
This is the maturity model content. Use it directly. Do not generalize — reference the specific gaps below when writing recommendations.
${gapAnalysis}
---

Write a focused assessment with these sections. A builder can only realistically act on a handful of things in the 6 months before their next assessment — so keep the advice tight, prioritized, and achievable. Do not pad. Do not give equal weight to areas that are not equal problems.

<h4>Where You Stand</h4>
<p>2-3 sentences. Name their level, what it means day-to-day, and the single biggest thing holding them back operationally.</p>

<h4>Your #1 Priority: ${focusDomains[0]?.domainName ?? 'Top Focus Area'}</h4>
<p>Deep focus on the lowest/weakest domain. Reference the specific questions where they scored lowest. Tell them exactly what they're doing today and what the next level looks like — use the gap analysis language directly, in plain English. Explain why this domain is the highest-leverage place to improve.</p>

${focusDomains.length > 1 ? `<h4>${isClustered ? 'Also Focus On' : 'Also Needs Attention'}: ${focusDomains[1]?.domainName ?? ''}</h4>
<p>Same treatment for the second focus domain. Specific, tied to the gap analysis. Don't repeat advice already given above.</p>

` : ''}<h4>Your Action Plan for the Next 6 Months</h4>
<p>3-5 concrete actions tied directly to moving from their current level to the next level in the priority domain(s). Each action should be something a homebuilder CEO can actually assign, schedule, or implement — not a concept. Lead with the most impactful. Format as a numbered list using <br/> between items.</p>

<h4>Protect Your Strength: ${highest?.domainName ?? ''}</h4>
<p>1-2 sentences. Acknowledge what they're doing well and briefly note how this strength can support improvement in their weaker areas.</p>

Tone: Direct, practical, written for a homebuilder CEO. No filler. Reference the maturity level names (Anchor, Typical, Strategic Implementer, Adaptive Innovator, Guiding Star) where relevant.
Format with <h4> headers and <p> tags throughout.`
}

function getFallbackRecommendations(
  domainScores: ReturnType<typeof calculateScores>['domainScores'],
  overall: number,
  companyInfo: z.infer<typeof AssessmentSchema>['companyInfo']
) {
  const level = getLevelFromScore(overall)
  const sorted = Object.values(domainScores).filter(d => d.answered > 0).sort((a, b) => a.pct - b.pct)
  const lowest = sorted[0]
  const highest = sorted[sorted.length - 1]
  const { focusDomains, isClustered } = identifyPriorityDomains(domainScores)

  return `<h4>Overall Standing</h4><p>${companyInfo.company} scored ${overall}%, placing you at the <strong>${level.name}</strong> level — '${level.sentiment}'. ${overall < 50 ? 'There are significant opportunities to systematize operations and reduce reactive firefighting.' : 'You are ahead of most builders. Focus now on the gaps pulling your overall score down.'}</p><h4>Priority Area</h4><p>Your lowest-scoring domain is <strong>${lowest?.domainName} at ${lowest?.pct}%</strong>. This is where improvement will have the greatest operational impact.</p>${focusDomains.length > 1 ? `<h4>${isClustered ? 'Also Focus On' : 'Also Needs Attention'}</h4><p>${focusDomains.slice(1).map(d => `<strong>${d.domainName} at ${d.pct}%</strong>`).join(' and ')} also ${focusDomains.length === 2 ? 'requires' : 'require'} attention in the next 6 months.</p>` : ''}<h4>Action Plan</h4><p>1. Document your current process in ${lowest?.domainName} — write down what actually happens today.<br/>2. Pick the one or two questions in that domain where you scored lowest and assign a named person to own the improvement.<br/>3. Set a 90-day target: what does Level ${getNextLevel(getLevelFromScore(lowest?.pct ?? 0).key) ?? '1'} look like for your business specifically?</p><h4>Strongest Area</h4><p>Your strongest domain is <strong>${highest?.domainName} at ${highest?.pct}%</strong>. This is a real competitive advantage — make sure it is visible to your customers and trade partners.</p>`
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
