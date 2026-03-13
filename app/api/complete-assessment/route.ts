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
    z.enum(['-1', '0', '1', '2', '3']).nullable()
  ),
  assessmentId: z.string().uuid().nullable().optional(),
})

function buildPrompt(companyInfo: z.infer<typeof AssessmentSchema>['companyInfo'], domainScores: ReturnType<typeof calculateScores>['domainScores'], overall: number, answers: Record<string, string | null>) {
  const level = getLevelFromScore(overall)
  const sorted = Object.values(domainScores).sort((a, b) => a.pct - b.pct)
  const lowest = sorted[0]
  const highest = sorted[sorted.length - 1]

  let answerSummary = ''
  DOMAINS.forEach(domain => {
    answerSummary += `\n${domain.name} (${domainScores[domain.key]?.pct ?? 0}%):`
    domain.questions.forEach(q => {
      const ans = answers[q.id]
      if (ans !== null && ans !== undefined) {
        answerSummary += `\n  - ${q.label}: Level ${ans} — "${q.levels[ans]?.slice(0, 80)}"`
      }
    })
  })

  return `You are an expert operational advisor for residential homebuilders.
A building company CEO has completed an Operational Maturity Assessment.

Company: ${companyInfo.company} (${companyInfo.volume} homes/year, ${companyInfo.state})
Respondent: ${companyInfo.name}, ${companyInfo.title}
Overall Score: ${overall}% — ${level.name} ('${level.sentiment}')

Domain Scores:
${Object.values(domainScores).map(d => `- ${d.domainName}: ${d.pct}% (${getLevelFromScore(d.pct).name})`).join('\n')}

Lowest domain: ${lowest?.domainName} at ${lowest?.pct}%
Highest domain: ${highest?.domainName} at ${highest?.pct}%

Key answer details:${answerSummary}

Please provide a concise, practical assessment including:
1. A 2-sentence overall assessment of where this company stands
2. The #1 priority area with specific reasoning from their actual answers
3. Three concrete next steps achievable in the next 90 days
4. One sentence acknowledging their strongest area

Reference the maturity level names (Anchor, Typical, Strategic Implementer, Adaptive Innovator, Guiding Star) when relevant. The Guiding Star level represents full digital integration — use it as the north star reference point.

Tone: Direct, practical, specific to a residential homebuilder.
Format with <h4> headers and <p> tags.`
}

function getFallbackRecommendations(domainScores: ReturnType<typeof calculateScores>['domainScores'], overall: number, companyInfo: z.infer<typeof AssessmentSchema>['companyInfo']) {
  const level = getLevelFromScore(overall)
  const sorted = Object.values(domainScores).sort((a, b) => a.pct - b.pct)
  const lowest = sorted[0]
  const highest = sorted[sorted.length - 1]
  return `<h4>Overall Standing</h4><p>${companyInfo.company} scored ${overall}%, placing you at the <strong>${level.name}</strong> level — '${level.sentiment}'. ${overall < 50 ? 'There are significant opportunities to systematize operations and reduce reactive firefighting.' : 'You are ahead of most builders. Focus now on the gaps pulling your overall score down.'}</p><h4>Priority Area</h4><p>Your lowest-scoring domain is <strong>${lowest?.domainName} at ${lowest?.pct}%</strong>. This is where improvement will have the greatest operational impact. Raising this domain to 50%+ would meaningfully shift your overall score.</p><h4>Next 90 Days</h4><p>1. Audit your current processes in ${lowest?.domainName} — document what exists today.<br/>2. Identify the two questions in that domain where you scored lowest and address one specifically.<br/>3. Assign ownership — these improvements need a named person responsible, not a committee.</p><h4>Strongest Area</h4><p>Your strongest domain is <strong>${highest?.domainName} at ${highest?.pct}%</strong>. This is a real competitive advantage — make sure it is visible to your customers and trade partners.</p>`
}

async function getAIRecommendations(prompt: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('AI_TIMEOUT')), 25000)
  )
  const aiPromise = anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
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

    // Verify subscription
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

    // Build domain scores for storage (Supabase-friendly format)
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

      // Increment assessments_used for onetime plans
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
