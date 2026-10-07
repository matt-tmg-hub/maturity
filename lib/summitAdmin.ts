// Server-only helpers for the facilitator view of summit surveys.
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { SURVEY_EVENT, adminEmails, type SurveyData } from '@/lib/summitSurvey'

export interface SurveyRecord {
  id: string
  user_id: string
  email: string
  data: SurveyData
  status: 'in_progress' | 'submitted'
  submitted_at: string | null
  updated_at: string
}

/** Returns the signed-in user's email if they are a survey admin, else null. */
export async function requireSurveyAdmin(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email?.toLowerCase()
  if (!email || !adminEmails().includes(email)) return null
  return email
}

/** All surveys for the event, read with the service role (bypasses RLS). Call only after requireSurveyAdmin. */
export async function loadAllSurveys(): Promise<SurveyRecord[]> {
  const svc = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await svc
    .from('summit_surveys')
    .select('id, user_id, data, status, submitted_at, updated_at')
    .eq('event', SURVEY_EVENT)
    .order('updated_at', { ascending: false })
  if (error) throw error
  const rows = data || []

  const ids = rows.map(r => r.user_id)
  const emails: Record<string, string> = {}
  if (ids.length) {
    const { data: users } = await svc.from('users').select('id, email').in('id', ids)
    for (const u of users || []) emails[u.id] = u.email
  }
  return rows.map(r => ({ ...r, email: emails[r.user_id] || '' })) as SurveyRecord[]
}
