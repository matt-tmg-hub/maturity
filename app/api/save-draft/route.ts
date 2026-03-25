import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const DraftSchema = z.object({
  companyInfo: z.object({
    company: z.string().max(100).default(''),
    name: z.string().max(100).default(''),
    title: z.string().max(50).default('CEO'),
    volume: z.string().max(50).default(''),
    state: z.string().max(50).default(''),
  }),
  answers: z.record(z.string(), z.string().nullable()),
  currentQ: z.number().int().min(0).default(0),
  draftId: z.string().uuid().nullable().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = DraftSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

    const { companyInfo, answers, currentQ, draftId } = parsed.data

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single()
    if (!sub) return Response.json({ error: 'No active subscription' }, { status: 403 })

    const draftData = {
      user_id: user.id,
      company_name: companyInfo.company || null,
      respondent_name: companyInfo.name || null,
      respondent_title: companyInfo.title || null,
      homes_per_year: companyInfo.volume || null,
      state_region: companyInfo.state || null,
      answers: answers,
      status: 'in_progress',
      current_question_index: currentQ,
    }

    if (draftId) {
      const { error } = await supabase
        .from('assessments')
        .update(draftData)
        .eq('id', draftId)
        .eq('user_id', user.id)
        .eq('status', 'in_progress')
      if (error) throw error
      return Response.json({ id: draftId })
    } else {
      const { data, error } = await supabase
        .from('assessments')
        .insert(draftData)
        .select('id')
        .single()
      if (error) throw error
      return Response.json({ id: data.id })
    }
  } catch (err) {
    console.error('save-draft error:', err)
    return Response.json({ error: 'Failed to save draft' }, { status: 500 })
  }
}
