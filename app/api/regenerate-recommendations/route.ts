// Streams recommendations to the client as they are generated, then saves the full text.
// Runs for as long as the generation takes (up to maxDuration) instead of racing a
// 60-second serverless limit. Used for the first generation after an assessment is
// completed and for re-running older reports.
export const maxDuration = 300

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { streamRecommendations } from '@/lib/recommendations'
import { z } from 'zod'

const BodySchema = z.object({
  assessmentId: z.string().uuid(),
})

const SaveSchema = z.object({
  assessmentId: z.string().uuid(),
  recommendations: z.string().min(20).max(60000),
})

// Ownership is verified with the user's session; the write itself uses the service role so it
// cannot be blocked by row-level security or a session that expired mid-generation.
function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function saveRecommendations(assessmentId: string, userId: string, html: string): Promise<string | null> {
  let lastError = ''
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error, data } = await adminClient()
      .from('assessments')
      .update({ ai_recommendations: html })
      .eq('id', assessmentId)
      .eq('user_id', userId)
      .select('id')
    if (!error && data && data.length > 0) return null
    lastError = error ? error.message : 'no row updated'
    console.error(`[recommendations] save attempt ${attempt} failed for ${assessmentId}:`, lastError)
    await new Promise(r => setTimeout(r, 500 * attempt))
  }
  return lastError
}

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
  const userId = user.id

  const encoder = new TextEncoder()
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const full = await streamRecommendations(companyInfo, answers, chunk => {
          controller.enqueue(encoder.encode(chunk))
        })
        // Persist before closing so the function is still alive for the write
        const saveError = await saveRecommendations(a.id, userId, full)
        if (saveError) {
          // Hand the text to the client anyway; it will save through the PUT endpoint below
          controller.enqueue(encoder.encode(`\n<!--SAVEFAILED:${saveError}-->\n<!--FINAL-->${full}`))
        } else {
          console.log(`[recommendations] saved ${full.length} chars for ${a.id}`)
          controller.enqueue(encoder.encode(`\n<!--FINAL-->${full}`))
        }
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

// Fallback save path: the client calls this with the generated text if the streaming
// route reported that its own save failed.
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = SaveSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })
  if (!parsed.data.recommendations.includes('<h4>')) return Response.json({ error: 'Invalid content' }, { status: 400 })

  const { data: a } = await supabase
    .from('assessments')
    .select('id')
    .eq('id', parsed.data.assessmentId)
    .eq('user_id', user.id)
    .single()
  if (!a) return Response.json({ error: 'Not found' }, { status: 404 })

  const saveError = await saveRecommendations(a.id, user.id, parsed.data.recommendations)
  if (saveError) return Response.json({ error: `Save failed: ${saveError}` }, { status: 500 })
  return Response.json({ ok: true })
}
