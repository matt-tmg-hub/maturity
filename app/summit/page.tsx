import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SURVEY_EVENT, type SurveyData } from '@/lib/summitSurvey'
import SurveyClient from './SurveyClient'

// Unlisted page: not linked from the site and kept out of search engines.
export const metadata: Metadata = {
  title: 'Company Survey | Epcon Franchise Builder Summit',
  robots: { index: false, follow: false },
}

export default async function SummitSurveyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/summit')

  const [{ data: survey }, { data: profile }, { data: lastAssessment }] = await Promise.all([
    supabase.from('summit_surveys').select('data, status, updated_at').eq('user_id', user.id).eq('event', SURVEY_EVENT).maybeSingle(),
    supabase.from('users').select('full_name, company_name, title').eq('id', user.id).maybeSingle(),
    supabase.from('assessments').select('company_name, respondent_name, respondent_title').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  let initial: SurveyData = (survey?.data as SurveyData) || {}
  if (!survey) {
    // First visit: pre-fill who they are from their account / assessment.
    const company = lastAssessment?.company_name || profile?.company_name || ''
    const name = lastAssessment?.respondent_name || profile?.full_name || ''
    const title = lastAssessment?.respondent_title || profile?.title || ''
    initial = {
      ...(company ? { co_company: company } : {}),
      ...(name ? { co_respondent: title ? `${name}, ${title}` : name } : {}),
    }
  }

  const displayName = profile?.full_name || lastAssessment?.respondent_name || user.email || ''
  const displayCompany = initial.co_company || ''

  return (
    <SurveyClient
      initialData={initial}
      initialStatus={(survey?.status as 'in_progress' | 'submitted') || 'in_progress'}
      initialSavedAt={survey?.updated_at || null}
      displayName={displayName}
      displayCompany={displayCompany}
    />
  )
}
