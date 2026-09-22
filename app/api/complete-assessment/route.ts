export const maxDuration = 30

import { createClient } from '@/lib/supabase/server'
import { calculateScores } from '@/lib/scoring'
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

    // Recommendations are generated separately by /api/regenerate-recommendations, which
    // streams them to the results page. Saving here stays fast and can't time out.
    const recommendations: string | null = null

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
