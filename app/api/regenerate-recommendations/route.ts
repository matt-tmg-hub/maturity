// Streams recommendations to the client as they are generated, then saves the full text.
// Runs for as long as the generation takes (up to maxDuration) instead of racing a
// 60-second serverless limit. Used for the first generation after an assessment is
// completed and for re-running older reports.
export const maxDuration = 300

import { createClient } from '@/lib/supabase/server'
import { streamRecommendations } from '@/lib/recommendations'
import { z } from 'zod'

const BodySchema = z.object({
  assessmentId: z.string().uuid(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const { data: a } = await supabase
    .from('assessments')
    .select('id, company_name, respondent_name, respondent_title, homes_per_year, state_region, answers, status')
    .eq('id', parsed.data.assessmentId)
    .eq('user_id', user.id)
    .single()

  if (!a) return Response.json({ error: 'Not found' }, { status: 404 })
  if (a.status !== 'complete') return Response.json({ error: 'Assessment is not complete' }, { status: 400 })

  const companyInfo = {
    company: a.company_name,
    name: a.respondent_name || '',
    title: a.respondent_title || 'CEO',
    volume: a.homes_per_year || '',
    state: a.state_region || '',
  }
  const answers = (a.answers || {}) as Record<string, string>

  const encoder = new TextEncoder()
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const full = await streamRecommendations(companyInfo, answers, chunk => {
          controller.enqueue(encoder.encode(chunk))
        })
        // Persist before closing so the function is still alive for the write
        const { error } = await supabase
          .from('assessments')
          .update({ ai_recommendations: full })
          .eq('id', a.id)
          .eq('user_id', user.id)
        if (error) console.error('[recommendations] save failed:', error.message)
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Generation failed'
        // Signal failure in-band so the client can distinguish it from a completed stream
        controller.enqueue(encoder.encode(`\n<!--ERROR:${msg}-->`))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
