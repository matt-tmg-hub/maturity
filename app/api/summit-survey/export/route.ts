import { FIELDS, communityCount, communityFields, toRow } from '@/lib/summitSurvey'
import { loadAllSurveys, requireSurveyAdmin } from '@/lib/summitAdmin'

function csvCell(v: string): string {
  // Neutralize spreadsheet formulas and quote every cell.
  const safe = /^[=+\-@]/.test(v) && !/^-?\d/.test(v) ? `'${v}` : v
  return `"${safe.replace(/"/g, '""')}"`
}

export async function GET() {
  if (!(await requireSurveyAdmin())) return new Response('Not found', { status: 404 })

  const surveys = await loadAllSurveys()
  const maxCommunities = Math.max(0, ...surveys.map(s => communityCount(s.data || {})))
  const fields = [
    ...FIELDS.filter(f => f.section <= 2),
    ...communityFields(maxCommunities),
    ...FIELDS.filter(f => f.section > 2),
  ]
  const header = ['Email', 'Status', 'Submitted at', 'Last updated', ...fields.map(f => f.label)]
  const lines = [header.map(csvCell).join(',')]
  for (const s of surveys) {
    const row = toRow(s.data || {})
    lines.push([
      s.email, s.status, s.submitted_at || '', s.updated_at,
      ...fields.map(f => row[f.key] ?? ''),
    ].map(v => csvCell(String(v))).join(','))
  }

  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="summit-surveys-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
