import { createClient } from '@/lib/supabase/server'
import { SURVEY_EVENT, SurveyPayload } from '@/lib/summitSurvey'

// Saves (autosave) or submits the signed-in user's summit survey.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = SurveyPayload.safeParse(await request.json())
    if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })
    const { data, submit } = parsed.data

    const { data: existing } = await supabase
      .from('summit_surveys')
      .select('id, status, submitted_at')
      .eq('user_id', user.id)
      .eq('event', SURVEY_EVENT)
      .maybeSingle()

    const now = new Date().toISOString()
    const status = submit || existing?.status === 'submitted' ? 'submitted' : 'in_progress'
    const submitted_at = submit ? now : existing?.submitted_at ?? null

    if (existing) {
      const { error } = await supabase
        .from('summit_surveys')
        .update({ data, status, submitted_at, updated_at: now })
        .eq('id', existing.id)
        .eq('user_id', user.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('summit_surveys')
        .insert({ user_id: user.id, event: SURVEY_EVENT, data, status, submitted_at, updated_at: now })
      if (error) throw error
    }

    return Response.json({ ok: true, status, savedAt: now })
  } catch (err) {
    console.error('summit-survey save error:', err)
    return Response.json({ error: 'Failed to save' }, { status: 500 })
  }
}
