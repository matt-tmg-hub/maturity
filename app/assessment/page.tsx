import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AssessmentClient from './AssessmentClient'

export default async function AssessmentPage({
  searchParams,
}: {
  searchParams: { edit?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!sub) redirect('/pricing')

  // Check if onetime and already used
  if (sub.plan_type === 'onetime') {
    const used = sub.assessments_used ?? 0
    const limit = sub.assessments_limit ?? 1
    if (used >= limit) redirect('/dashboard?used=1')
  }

  // Check if annual subscription has expired
  if (sub.plan_type === 'annual' && sub.current_period_end) {
    if (new Date(sub.current_period_end) < new Date()) {
      redirect('/dashboard?expired=1')
    }
  }

  // Edit mode: load existing assessment
  let editAnswers: Record<string, string> | undefined
  let editCompanyInfo: { company: string; name: string; title: string; volume: string; state: string } | undefined
  let editAssessmentId: string | undefined

  if (searchParams.edit) {
    // Only annual subscribers can edit
    if (sub.plan_type === 'annual') {
      const { data: assessment } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', searchParams.edit)
        .eq('user_id', user.id)
        .single()

      if (assessment) {
        editAnswers = assessment.answers || {}
        editCompanyInfo = {
          company: assessment.company_name || '',
          name: assessment.respondent_name || '',
          title: assessment.respondent_title || 'CEO',
          volume: assessment.homes_per_year || '',
          state: assessment.state_region || '',
        }
        editAssessmentId = assessment.id
      }
    }
  }

  return (
    <AssessmentClient
      userId={user.id}
      editAnswers={editAnswers}
      editCompanyInfo={editCompanyInfo}
      editAssessmentId={editAssessmentId}
    />
  )
}
