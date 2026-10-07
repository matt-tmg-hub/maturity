import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import { FIELDS, SECTIONS, communityCount, communityFields, sectionStarted, toRow } from '@/lib/summitSurvey'
import { loadAllSurveys, requireSurveyAdmin } from '@/lib/summitAdmin'

export const metadata: Metadata = {
  title: 'Summit Surveys (Admin)',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

function when(iso: string | null) {
  return iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) : '—'
}

export default async function SummitAdminPage() {
  if (!(await requireSurveyAdmin())) notFound()
  const surveys = await loadAllSurveys()
  const submitted = surveys.filter(s => s.status === 'submitted').length

  const cell: CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #EDF0F3', textAlign: 'left', fontSize: 14, verticalAlign: 'top' }

  return (
    <div style={{ minHeight: '100vh', background: '#F3F5F8', fontFamily: 'Inter, system-ui, sans-serif', color: '#0f1f3d' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 24px 64px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#A33F16' }}>Facilitator view</div>
            <h1 style={{ fontSize: 30, margin: '6px 0 4px' }}>Summit company surveys</h1>
            <p style={{ margin: 0, color: '#56606D', fontSize: 15 }}>{surveys.length} started · {submitted} submitted</p>
          </div>
          <a href="/api/summit-survey/export" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 20px', borderRadius: 8, background: '#0f1f3d', color: '#fff', fontWeight: 600, textDecoration: 'none' }}>Download CSV</a>
        </div>

        <div style={{ marginTop: 24, background: '#fff', border: '1px solid #DCE1E7', borderRadius: 12, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ background: '#F6F8FA' }}>
                {['Company', 'Respondent', 'Status', 'Sections started', 'P&L', 'Last updated'].map(h => (
                  <th key={h} style={{ ...cell, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.05em', color: '#56606D' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {surveys.length === 0 && (
                <tr><td colSpan={6} style={{ ...cell, color: '#56606D' }}>No surveys started yet. Attendees use buildermaturity.com/summit.</td></tr>
              )}
              {surveys.map(s => {
                const d = s.data || {}
                const started = SECTIONS.filter((_, i) => sectionStarted(d, i)).length
                return (
                  <tr key={s.id}>
                    <td style={{ ...cell, fontWeight: 600 }}>{d.co_company || '—'}</td>
                    <td style={cell}>{d.co_respondent || '—'}<div style={{ color: '#56606D', fontSize: 12 }}>{s.email}</div></td>
                    <td style={cell}>{s.status === 'submitted' ? `Submitted ${when(s.submitted_at)}` : 'In progress'}</td>
                    <td style={cell}>{started} of {SECTIONS.length}</td>
                    <td style={cell}>{d.pnl_choice === 'share' ? 'Shared' : d.pnl_choice === 'skip' ? 'Skipped' : '—'}</td>
                    <td style={cell}>{when(s.updated_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
          {surveys.map(s => {
            const row = toRow(s.data || {})
            return (
              <details key={s.id} style={{ background: '#fff', border: '1px solid #DCE1E7', borderRadius: 12, padding: '14px 18px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 15 }}>{row.co_company || s.email} — all answers</summary>
                {SECTIONS.map((sec, i) => (
                  <div key={sec.title} style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#56606D', marginBottom: 6 }}>{i + 1}. {sec.title}</div>
                    <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '6px 16px', margin: 0, fontSize: 14 }}>
                      {[...FIELDS.filter(f => f.section === i), ...(i === 2 ? communityFields(communityCount(s.data || {})) : [])].map(f => (
                        <div key={f.key} style={{ display: 'contents' }}>
                          <dt style={{ color: '#56606D' }}>{f.label}</dt>
                          <dd style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{row[f.key] || '—'}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </details>
            )
          })}
        </div>
      </div>
    </div>
  )
}
