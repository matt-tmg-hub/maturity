'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LEVEL_NAMES, getDomainsFor, type Question } from '@/lib/maturityData'
import { isProfileKey } from '@/lib/profile'

interface Assessment {
  id: string
  company_name: string
  respondent_name: string | null
  respondent_title: string | null
  homes_per_year: string | null
  state_region: string | null
  overall_score: number
  maturity_level: string | null
  maturity_level_key: string | null
  domain_scores: Record<string, { pct: number; answered: number; total: number }>
  ai_recommendations: string | null
  answers: Record<string, string>
  status?: string
  completed_at: string
  created_at: string
}

interface Subscription {
  plan_type: 'annual' | 'onetime'
  status: string
}

// Full question data for response summary

const GEN_STEPS = [
  'Reviewing every one of your responses',
  'Finding your priority areas',
  'Comparing where you are to the next level',
  'Building your 90-day action plan',
  'Writing your milestones',
  'Finishing up',
]

const LEVEL_COLORS: Record<string, string> = {
  '-1': '#dc2626',
  '0': '#f59e0b',
  '1': '#3b82f6',
  '2': '#8b5cf6',
  '3': '#16a34a',
}

function getScoreColor(pct: number): string {
  if (pct < 25) return '#dc2626'
  if (pct < 50) return '#f59e0b'
  if (pct < 75) return '#3b82f6'
  return '#16a34a'
}

function getLevelBadgeStyle(key: string | null) {
  if (key === '3') return { bg: '#dcfce7', color: '#15803d' }
  if (key === '2') return { bg: '#dbeafe', color: '#1d4ed8' }
  if (key === '1') return { bg: '#fef3c7', color: '#92400e' }
  if (key === '0') return { bg: '#f3f4f6', color: '#374151' }
  return { bg: '#fee2e2', color: '#991b1b' }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTop: '3px solid #1d4ed8', borderRadius: '50%', margin: '0 auto' }} />
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 16 }}>Loading your report...</p>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)
  const [streamText, setStreamText] = useState('')
  const [genStep, setGenStep] = useState(0)
  const recsRef = useRef<HTMLDivElement>(null)

  // Domain names, question labels and level text come from the question set this assessment was
  // answered against (v1 for older reports, v2 for current), so the report never drifts from what
  // the customer actually saw.
  const domainSet = useMemo(() => getDomainsFor(assessment?.answers, assessment?.domain_scores), [assessment])
  const DOMAIN_ORDER = domainSet.map(d => d.key)
  const DOMAIN_NAMES: Record<string, string> = Object.fromEntries(domainSet.map(d => [d.key, d.name]))
  const DOMAIN_QUESTIONS: Record<string, Question[]> = Object.fromEntries(domainSet.map(d => [d.key, d.questions]))
  const DOMAIN_ICONS: Record<string, string> = Object.fromEntries(domainSet.map(d => [d.key, d.iconPath]))
  const autoStarted = useRef(false)

  const handleRegenerate = useCallback(async (target?: Assessment) => {
    const a = target || assessment
    if (!a || regenerating) return
    setRegenerating(true)
    setRegenError(null)
    setStreamText('')
    try {
      const res = await fetch('/api/regenerate-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: a.id }),
      })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed (${res.status})`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setStreamText(full.split('<!--FINAL-->')[0])
      }
      const errMatch = full.match(/<!--ERROR:(.*?)-->/)
      if (errMatch) throw new Error(errMatch[1])
      const finalIdx = full.indexOf('<!--FINAL-->')
      const finalHtml = finalIdx >= 0 ? full.slice(finalIdx + '<!--FINAL-->'.length).trim() : full.trim()
      if (!finalHtml.includes('<h4>')) throw new Error('Generation returned no content')
      setAssessment(prev => prev ? { ...prev, ai_recommendations: finalHtml } : prev)
      setStreamText('')
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Generation failed')
      setStreamText('')
    } finally {
      setRegenerating(false)
    }
  }, [assessment, regenerating])

  // Cycle the status line while the model is thinking and before any text has streamed in.
  useEffect(() => {
    if (!regenerating || streamText) return
    setGenStep(0)
    const t = setInterval(() => setGenStep(s => Math.min(s + 1, GEN_STEPS.length - 1)), 5000)
    return () => clearInterval(t)
  }, [regenerating, streamText])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: a } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (!a) { setNotFound(true); setLoading(false); return }

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_type, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      setAssessment(a)
      setSubscription(sub || null)
      setLoading(false)

      // First visit after completing: recommendations haven't been generated yet - start now.
      if (!a.ai_recommendations && a.status === 'complete' && !autoStarted.current) {
        autoStarted.current = true
        handleRegenerate(a)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router])

  async function handleExportPDF() {
    if (!assessment) return
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'letter' })

    const MARGIN = 18
    const PAGE_W = 216
    const CONTENT_W = PAGE_W - MARGIN * 2
    const PAGE_H = 279
    const BOTTOM_SAFE = PAGE_H - 18
    let y = MARGIN

    const scoreColor = getScoreColor(assessment.overall_score)

    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0]
    }

    function addPageHeader() {
      doc.setFillColor(15, 31, 61)
      doc.rect(0, 0, PAGE_W, 10, 'F')
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(160, 170, 190)
      doc.text('Builder Maturity Report', MARGIN, 7)
      doc.text(assessment?.company_name ?? '', PAGE_W - MARGIN, 7, { align: 'right' })
    }

    function addFooter() {
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('Confidential - The Mainspring Group LLC | buildermaturity.com', MARGIN, PAGE_H - 8)
      doc.text(`Page ${doc.getNumberOfPages()}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' })
    }

    function checkPage(needed: number) {
      if (y + needed > BOTTOM_SAFE) {
        addFooter()
        doc.addPage()
        addPageHeader()
        y = 20
      }
    }

    function sectionDivider(title: string) {
      checkPage(16)
      y += 4
      doc.setDrawColor(229, 231, 235)
      doc.setLineWidth(0.3)
      doc.line(MARGIN, y, PAGE_W - MARGIN, y)
      y += 8
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 31, 61)
      doc.text(title, MARGIN, y)
      y += 7
    }

    // ---- PAGE 1 HEADER ----
    doc.setFillColor(15, 31, 61)
    doc.rect(0, 0, PAGE_W, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Builder Maturity Report', MARGIN, 13)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(180, 190, 210)
    doc.text('The Mainspring Group LLC | buildermaturity.com', MARGIN, 21)
    doc.text(formatDate(assessment.completed_at || assessment.created_at), PAGE_W - MARGIN, 21, { align: 'right' })

    y = 38

    // Company + respondent
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 31, 61)
    doc.text(assessment.company_name, MARGIN, y)
    y += 7

    if (assessment.respondent_name) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      let meta = assessment.respondent_name
      if (assessment.respondent_title) meta += `, ${assessment.respondent_title}`
      if (assessment.homes_per_year) meta += ` | ${assessment.homes_per_year} homes/yr`
      if (assessment.state_region) meta += ` | ${assessment.state_region}`
      doc.text(meta, MARGIN, y)
      y += 10
    } else {
      y += 4
    }

    // Score circle (top right)
    const circleX = PAGE_W - MARGIN - 22
    const circleY = y - 4
    const [sr, sg, sb] = hexToRgb(scoreColor)
    doc.setDrawColor(sr, sg, sb)
    doc.setLineWidth(2.5)
    doc.circle(circleX, circleY, 15)
    doc.setTextColor(sr, sg, sb)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(`${assessment.overall_score}%`, circleX, circleY + 2, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text('overall', circleX, circleY + 7, { align: 'center' })

    // Maturity level
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 31, 61)
    doc.text(`Maturity Level: ${assessment.maturity_level || 'N/A'}`, MARGIN, y + 8)
    y += 18

    // ---- DOMAIN SCORES ----
    sectionDivider('Domain Scores')

    DOMAIN_ORDER.forEach(key => {
      const d = assessment.domain_scores?.[key]
      if (!d) return
      checkPage(14)
      const [dr, dg, db] = hexToRgb(getScoreColor(d.pct))
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(55, 65, 81)
      doc.text(DOMAIN_NAMES[key], MARGIN, y + 4)
      const barX = MARGIN + 72
      const barW = CONTENT_W - 72 - 18
      doc.setFillColor(243, 244, 246)
      doc.roundedRect(barX, y, barW, 5, 1, 1, 'F')
      doc.setFillColor(dr, dg, db)
      doc.roundedRect(barX, y, Math.max(2, (d.pct / 100) * barW), 5, 1, 1, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(dr, dg, db)
      doc.text(`${d.pct}%`, PAGE_W - MARGIN, y + 4, { align: 'right' })
      y += 12
    })

    // ---- RECOMMENDATIONS ----
    sectionDivider('Recommendations')

    const recs = (assessment.ai_recommendations || '<p>Recommendations have not been generated for this assessment yet. Open the report online and click Generate Recommendations, then export again.</p>')
      .replace(/<h4>/g, '\n__HEADING__')
      .replace(/<\/h4>/g, '\n')
      .replace(/<strong>/g, '')
      .replace(/<\/strong>/g, '')
      .replace(/<br\/?>/g, '\n')
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .trim()

    recs.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (!trimmed) return
      if (trimmed.startsWith('__HEADING__')) {
        const heading = trimmed.replace('__HEADING__', '').trim()
        if (!heading) return
        checkPage(12)
        y += 3
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 31, 61)
        doc.text(heading, MARGIN, y)
        y += 6
      } else {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(55, 65, 81)
        const lines = doc.splitTextToSize(trimmed, CONTENT_W)
        lines.forEach((l: string) => {
          checkPage(6)
          doc.text(l, MARGIN, y)
          y += 5.5
        })
      }
    })

    // ---- MATURITY LEVEL REFERENCE ----
    sectionDivider('Maturity Level Reference')

    const levels = [
      { key: '-1', name: 'Anchor', sentiment: 'Shoot from the hip', color: '#dc2626' },
      { key: '0', name: 'Typical', sentiment: 'Re-Active', color: '#f59e0b' },
      { key: '1', name: 'Strategic Implementer', sentiment: 'Pro-Active', color: '#3b82f6' },
      { key: '2', name: 'Adaptive Innovator', sentiment: 'Management by Exception', color: '#8b5cf6' },
      { key: '3', name: 'Guiding Star', sentiment: 'Digitally Optimized', color: '#16a34a' },
    ]

    levels.forEach(lv => {
      checkPage(10)
      const [lr, lg, lb] = hexToRgb(lv.color)
      const isCurrent = assessment.maturity_level_key === lv.key
      doc.setFillColor(lr, lg, lb)
      doc.circle(MARGIN + 2, y + 1, 2, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', isCurrent ? 'bold' : 'normal')
      doc.setTextColor(lr, lg, lb)
      doc.text(lv.name, MARGIN + 7, y + 3)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      const nameW = doc.getTextWidth(lv.name)
      doc.text(`- ${lv.sentiment}${isCurrent ? ' (Your Level)' : ''}`, MARGIN + 7 + nameW + 2, y + 3)
      y += 8
    })

    // ---- YOUR RESPONSES ----
    addFooter()
    doc.addPage()
    addPageHeader()
    y = 20

    // Section title
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 31, 61)
    doc.text('Your Responses', MARGIN, y)
    y += 4
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('A complete record of every answer you selected, organized by domain.', MARGIN, y + 4)
    y += 12

    const answers = assessment.answers || {}

    DOMAIN_ORDER.forEach(domainKey => {
      const questions = DOMAIN_QUESTIONS[domainKey]
      const domainScore = assessment.domain_scores?.[domainKey]
      if (!questions) return

      // Domain header
      checkPage(18)
      const [dr, dg, db] = hexToRgb(getScoreColor(domainScore?.pct || 0))
      doc.setFillColor(245, 247, 250)
      doc.roundedRect(MARGIN, y, CONTENT_W, 10, 2, 2, 'F')
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 31, 61)
      doc.text(DOMAIN_NAMES[domainKey], MARGIN + 4, y + 7)
      if (domainScore) {
        doc.setTextColor(dr, dg, db)
        doc.text(`${domainScore.pct}%`, PAGE_W - MARGIN - 4, y + 7, { align: 'right' })
      }
      y += 14

      questions.forEach((q, qi) => {
        const answerKey = answers[q.id]
        const skipped = answerKey === undefined || answerKey === null

        if (skipped) return // skip unanswered questions

        const levelName = LEVEL_NAMES[answerKey] || answerKey
        const levelDesc = q.levels[answerKey] || ''
        const [lr, lg, lb] = hexToRgb(LEVEL_COLORS[answerKey] || '#6b7280')

        // Estimate height needed
        const descLines = doc.splitTextToSize(levelDesc, CONTENT_W - 8)
        const needed = 8 + descLines.length * 4.5 + 6
        checkPage(needed)

        // Question label
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(55, 65, 81)
        const qLabel = `${qi + 1}. ${q.label}`
        doc.text(qLabel, MARGIN, y)

        // Level badge inline
        const labelW = doc.getTextWidth(qLabel)
        doc.setFillColor(lr, lg, lb)
        doc.roundedRect(MARGIN + labelW + 4, y - 4, doc.getTextWidth(levelName) + 6, 5.5, 1, 1, 'F')
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text(levelName, MARGIN + labelW + 7, y - 0.5)
        y += 5

        // Description text
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(107, 114, 128)
        descLines.forEach((l: string) => {
          checkPage(5)
          doc.text(l, MARGIN + 4, y)
          y += 4.5
        })
        y += 4

        // Light separator between questions
        if (qi < questions.length - 1) {
          doc.setDrawColor(240, 242, 244)
          doc.setLineWidth(0.2)
          doc.line(MARGIN + 4, y - 2, PAGE_W - MARGIN - 4, y - 2)
        }
      })

      y += 6
    })

    addFooter()

    const dateStr = new Date(assessment.completed_at || assessment.created_at).toISOString().slice(0, 10)
    const filename = `${assessment.company_name.replace(/[^a-zA-Z0-9]/g, '-')}-Maturity-Report-${dateStr}.pdf`
    doc.save(filename)
  }

  if (loading) return <LoadingScreen />

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Report not found</h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>This report doesn't exist or you don't have access to it.</p>
          <a href="/dashboard" style={{ color: '#1d4ed8', fontSize: 14, fontWeight: 600 }}>Back to Dashboard</a>
        </div>
      </div>
    )
  }

  if (!assessment) return null

  const badgeStyle = getLevelBadgeStyle(assessment.maturity_level_key)
  const scoreColor = getScoreColor(assessment.overall_score)
  const isAnnual = subscription?.plan_type === 'annual'

  const domainsSorted = DOMAIN_ORDER
    .map(key => ({ key, ...(assessment.domain_scores?.[key] || { pct: 0, answered: 0, total: 0 }) }))
    .sort((a, b) => a.pct - b.pct)

  const lowestDomain = domainsSorted[0]
  const highestDomain = domainsSorted[domainsSorted.length - 1]

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter',sans-serif" }}>
      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="https://rkfkccefwlarscfjmncz.supabase.co/storage/v1/object/public/assets/Wht%20M%20Solid%20Blue%20Sq%20Clear%20Background.png" alt="Mainspring M" style={{ width: 36, height: 36, borderRadius: 8, display: 'block' }} />
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f1f3d', display: 'block', lineHeight: 1.2 }}>Builder Maturity</span>
            <span style={{ fontSize: 10, color: '#9ca3af', display: 'block', lineHeight: 1 }}>by The Mainspring Group</span>
          </div>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAnnual && (
            <a href={`/assessment?edit=${assessment.id}`} style={{ fontSize: 13, fontWeight: 500, padding: '7px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', textDecoration: 'none' }}>Edit Responses</a>
          )}
          <button onClick={handleExportPDF} style={{ fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 7, border: 'none', background: '#0f1f3d', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export PDF
          </button>
          <a href="/dashboard" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none', fontWeight: 500 }}>Dashboard</a>
        </div>
      </nav>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Header card */}
        <div style={{ background: '#0f1f3d', borderRadius: 16, padding: '32px', marginBottom: 24, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                {formatDate(assessment.completed_at || assessment.created_at)}
                {assessment.respondent_name && ` \u00B7 ${assessment.respondent_name}`}
                {assessment.respondent_title && `, ${assessment.respondent_title}`}
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 12px', fontFamily: "'DM Serif Display',serif" }}>{assessment.company_name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 20, background: badgeStyle.bg, color: badgeStyle.color }}>
                  {assessment.maturity_level}
                </span>
                {assessment.homes_per_year && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{assessment.homes_per_year} homes/yr</span>}
                {assessment.state_region && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{assessment.state_region}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 110, height: 110, borderRadius: '50%', border: `5px solid ${scoreColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 38, fontWeight: 700, lineHeight: 1, color: scoreColor, fontFamily: "'DM Serif Display',serif" }}>{assessment.overall_score}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>out of 100</span>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Overall Score</span>
            </div>
          </div>
        </div>

        {/* Focus / Strongest cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#c2410c', marginBottom: 8 }}>Priority Focus Area</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#7c2d12', marginBottom: 4 }}>{DOMAIN_NAMES[lowestDomain?.key] || '-'}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: getScoreColor(lowestDomain?.pct || 0) }}>{lowestDomain?.pct || 0}%</div>
            <div style={{ fontSize: 12, color: '#9a3412', marginTop: 4 }}>Lowest scoring domain - greatest opportunity for improvement</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#15803d', marginBottom: 8 }}>Strongest Area</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#14532d', marginBottom: 4 }}>{DOMAIN_NAMES[highestDomain?.key] || '-'}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: getScoreColor(highestDomain?.pct || 0) }}>{highestDomain?.pct || 0}%</div>
            <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>Your competitive advantage - leverage this across the business</div>
          </div>
        </div>

        {regenerating && !assessment.ai_recommendations && (
          <button onClick={() => recsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 18px', marginBottom: 24, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
            <span className="bm-spin" style={{ width: 18, height: 18, border: '2.5px solid #bfdbfe', borderTopColor: '#1d4ed8', borderRadius: '50%', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 14, color: '#1e3a8a' }}><strong>Your recommendations are being written.</strong> Your scores are ready now; the full report appears below in about a minute.</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8', whiteSpace: 'nowrap' }}>Jump to it &darr;</span>
          </button>
        )}

        {/* Domain scores */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Domain Scores</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {DOMAIN_ORDER.map(key => {
              const d = assessment.domain_scores?.[key]
              if (!d) return null
              return (
                <div key={key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d={DOMAIN_ICONS[key]} /></svg>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>{DOMAIN_NAMES[key]}</span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{d.answered}/{d.total} answered</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: getScoreColor(d.pct), width: 40, textAlign: 'right' }}>{d.pct}%</span>
                  </div>
                  <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, width: `${d.pct}%`, background: getScoreColor(d.pct), transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recommendations */}
        <div ref={recsRef} style={{ scrollMarginTop: 80 }} />
        {!assessment.ai_recommendations && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 16px' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Recommendations</h2>
              {regenerating && (
                <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0f1f3d', display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite' }} />
                  Writing your recommendations&hellip;
                </span>
              )}
            </div>
            {regenerating && streamText && (
              <div
                style={{ fontSize: 14, lineHeight: 1.75, color: '#374151' }}
                dangerouslySetInnerHTML={{ __html: streamText
                  .replace(/<!--ERROR:.*?-->/g, '')
                  .replace(/<h4>/g, '<h4 style="font-size:15px;font-weight:700;color:#0f1f3d;margin:20px 0 8px;padding:0">')
                  .replace(/<p>/g, '<p style="margin:0 0 12px;padding:0">')
                }}
              />
            )}
            {regenerating && streamText && (
              <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6b7280', margin: '8px 0 0' }}>
                <span className="bm-spin" style={{ width: 12, height: 12, border: '2px solid #e5e7eb', borderTopColor: '#0f1f3d', borderRadius: '50%' }} />
                Still writing&hellip;
              </p>
            )}
            {regenerating && !streamText && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '28px 12px 20px' }}>
                <span className="bm-spin" style={{ width: 44, height: 44, border: '4px solid #e5e7eb', borderTopColor: '#0f1f3d', borderRadius: '50%', marginBottom: 18 }} />
                <p style={{ fontSize: 16, fontWeight: 700, color: '#0f1f3d', margin: '0 0 6px' }}>{GEN_STEPS[genStep]}&hellip;</p>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 18px', lineHeight: 1.6, maxWidth: 440 }}>
                  We&apos;re reading all {Object.keys(assessment.answers || {}).filter(k => !isProfileKey(k)).length} of your responses and writing recommendations specific to your company. This usually takes about a minute. The report will start appearing right here.
                </p>
                <div style={{ width: '100%', maxWidth: 360, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${((genStep + 1) / GEN_STEPS.length) * 100}%`, background: '#0f1f3d', borderRadius: 3, transition: 'width 1s ease' }} />
                </div>
              </div>
            )}
            {!regenerating && (
              <>
                <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 14px', lineHeight: 1.6 }}>
                  {regenError
                    ? <>The recommendations couldn&apos;t be generated ({regenError}). Your scores and responses are saved &mdash; try again in a moment.</>
                    : <>Your scores and responses are saved. Generate your recommendations to see your priorities and action plan.</>}
                </p>
                <button onClick={() => handleRegenerate()}
                  style={{ fontSize: 13, fontWeight: 600, padding: '9px 18px', borderRadius: 7, border: 'none', background: '#0f1f3d', color: '#fff', cursor: 'pointer' }}>
                  {regenError ? 'Try Again' : 'Generate Recommendations'}
                </button>
              </>
            )}
            <style>{`@keyframes pulse { 0%,100% { opacity: .25 } 50% { opacity: 1 } } @keyframes bmspin { to { transform: rotate(360deg) } } .bm-spin { display: inline-block; animation: bmspin .8s linear infinite }`}</style>
          </div>
        )}
        {assessment.ai_recommendations && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 20px' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Recommendations</h2>
              <button onClick={() => handleRegenerate()} disabled={regenerating} title="Re-run the recommendations engine against your saved responses"
                style={{ fontSize: 12, fontWeight: 500, padding: '5px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: regenerating ? '#9ca3af' : '#6b7280', cursor: regenerating ? 'default' : 'pointer' }}>
                {regenerating ? 'Regenerating\u2026' : 'Regenerate'}
              </button>
            </div>
            {regenError && <p style={{ fontSize: 13, color: '#b91c1c', margin: '0 0 12px' }}>{regenError}. Please try again in a moment.</p>}
            <div
              style={{ fontSize: 14, lineHeight: 1.75, color: '#374151' }}
              dangerouslySetInnerHTML={{ __html: (regenerating && streamText ? streamText.replace(/<!--ERROR:.*?-->/g, '') : assessment.ai_recommendations)
                .replace(/<h4>/g, '<h4 style="font-size:15px;font-weight:700;color:#0f1f3d;margin:20px 0 8px;padding:0">')
                .replace(/<p>/g, '<p style="margin:0 0 12px;padding:0">')
              }}
            />
          </div>
        )}

        {/* Maturity level reference */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Maturity Level Reference</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: '-1', name: 'Anchor', sentiment: 'Shoot from the hip', color: '#dc2626' },
              { key: '0', name: 'Typical', sentiment: 'Re-Active', color: '#f59e0b' },
              { key: '1', name: 'Strategic Implementer', sentiment: 'Pro-Active', color: '#3b82f6' },
              { key: '2', name: 'Adaptive Innovator', sentiment: 'Management by Exception', color: '#8b5cf6' },
              { key: '3', name: 'Guiding Star', sentiment: 'Digitally Optimized', color: '#16a34a' },
            ].map(lv => {
              const isCurrentLevel = assessment.maturity_level_key === lv.key
              return (
                <div key={lv.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: isCurrentLevel ? `${lv.color}10` : '#f9fafb', border: `1px solid ${isCurrentLevel ? lv.color + '40' : '#f3f4f6'}` }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: lv.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: lv.color, width: 180, flexShrink: 0 }}>{lv.name}</span>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{lv.sentiment}</span>
                  {isCurrentLevel && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: lv.color, background: `${lv.color}15`, padding: '2px 8px', borderRadius: 10 }}>Your Level</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Your Responses (on-screen preview) */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Your Responses</h2>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Every answer you selected, organized by domain. Included in your PDF export.</p>
            </div>
          </div>
          {DOMAIN_ORDER.map(domainKey => {
            const questions = DOMAIN_QUESTIONS[domainKey]
            const domainScore = assessment.domain_scores?.[domainKey]
            const answeredQs = questions.filter(q => assessment.answers?.[q.id] !== undefined)
            if (answeredQs.length === 0) return null
            return (
              <div key={domainKey} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: '#f8fafc', borderRadius: 8, marginBottom: 12, border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f1f3d' }}>{DOMAIN_NAMES[domainKey]}</span>
                  {domainScore && <span style={{ fontSize: 13, fontWeight: 700, color: getScoreColor(domainScore.pct) }}>{domainScore.pct}%</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {answeredQs.map((q, qi) => {
                    const answerKey = assessment.answers?.[q.id]
                    const levelName = LEVEL_NAMES[answerKey] || answerKey
                    const levelDesc = q.levels[answerKey] || ''
                    const levelColor = LEVEL_COLORS[answerKey] || '#6b7280'
                    return (
                      <div key={q.id} style={{ paddingLeft: 14, borderLeft: `3px solid ${levelColor}20` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{q.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${levelColor}15`, color: levelColor, flexShrink: 0 }}>{levelName}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>{levelDesc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 20px', background: '#0f1f3d', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export PDF
          </button>
          {isAnnual && (
            <a href={`/assessment?edit=${assessment.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 20px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 9, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Edit Responses
            </a>
          )}
          <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 20px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 9, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Back to Dashboard
          </a>
        </div>
      </main>
    </div>
  )
}
