export const maxDuration = 60

import { createClient } from '@/lib/supabase/server'
import { generateRecommendations } from '@/lib/recommendations'
import { z } from 'zod'

const BodySchema = z.object({
  assessmentId: z.string().uuid(),
})

/**
 * Re-runs the recommendations engine against a completed assessment's stored answers.
 * Used when the first run failed (ai_recommendations is null) or when the engine has
 * been improved and an older report should be refreshed.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = BodySchema.safeParse(await request.json())
    if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

    const { data: a } = await supabase
      .from('assessments')
      .select('id, company_name, respondent_name, respondent_title, homes_per_year, state_region, answers, status')
      .eq('id', parsed.data.assessmentId)
      .eq('user_id', user.id)
      .single()

    if (!a) return Response.json({ error: 'Not found' }, { status: 404 })
    if (a.status !== 'complete') return Response.json({ error: 'Assessment is not complete' }, { status: 400 })

    const { recommendations, error } = await generateRecommendations(
      {
        company: a.company_name,
        name: a.respondent_name || '',
        title: a.respondent_title || 'CEO',
        volume: a.homes_per_year || '',
        state: a.state_region || '',
      },
      (a.answers || {}) as Record<string, string>
    )

    if (!recommendations) {
      return Response.json({ error: 'Recommendations could not be generated', detail: error }, { status: 502 })
    }

    await supabase
      .from('assessments')
      .update({ ai_recommendations: recommendations })
      .eq('id', a.id)
      .eq('user_id', user.id)

    return Response.json({ recommendations })
  } catch (err) {
    console.error('regenerate-recommendations error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
