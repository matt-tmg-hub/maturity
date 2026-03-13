'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  completed_at: string
  created_at: string
}

interface Subscription {
  plan_type: 'annual' | 'onetime'
  status: string
}

const DOMAIN_ORDER = ['org', 'customer', 'trade', 'internal', 'builder_rep', 'systems']
const DOMAIN_NAMES: Record<string, string> = {
  org: 'Organizational Structure',
  customer: 'Customer Experience',
  trade: 'Trade Partner / Supplier',
  internal: 'Internal Operations',
  builder_rep: 'Builder Rep Experience',
  systems: 'Supporting Systems',
}
const DOMAIN_ICONS: Record<string, string> = {
  org: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  customer: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  trade: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0',
  internal: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  builder_rep: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  systems: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
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
    }
    load()
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

    const badgeStyle = getLevelBadgeStyle(assessment.maturity_level_key)
    const scoreColor = getScoreColor(assessment.overall_score)

    function checkPage(needed: number) {
      if (y + needed > BOTTOM_SAFE) {
        doc.addPage()
        y = MARGIN
        addFooter()
      }
    }

    function addFooter() {
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('Confidential — The Mainspring Group LLC | buildermaturity.com', MARGIN, PAGE_H - 8)
      doc.text(`Page ${doc.getNumberOfPages()}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' })
    }

    // Header bar
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

    // Company name
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

    // Score circle area
    const circleX = PAGE_W - MARGIN - 24
    const circleY = y + 16
    const r = [255, getScoreColor(assessment.overall_score)].length // dummy
    // Draw circle
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0]
    }
    const [sr, sg, sb] = hexToRgb(scoreColor)
    doc.setDrawColor(sr, sg, sb)
    doc.setLineWidth(2.5)
    doc.circle(circleX, circleY, 16)
    doc.setTextColor(sr, sg, sb)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text(`${assessment.overall_score}%`, circleX, circleY + 2, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text('overall', circleX, circleY + 7, { align: 'center' })

    // Maturity level badge area
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 31, 61)
    doc.text(`Maturity Level: ${assessment.maturity_level || 'N/A'}`, MARGIN, y + 8)
    y += 18

    // Divider
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 10

    // Domain scores
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 31, 61)
    doc.text('Domain Scores', MARGIN, y)
    y += 7

    DOMAIN_ORDER.forEach(key => {
      const d = assessment.domain_scores?.[key]
      if (!d) return
      checkPage(14)
      const [dr, dg, db] = hexToRgb(getScoreColor(d.pct))

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(55, 65, 81)
      doc.text(DOMAIN_NAMES[key], MARGIN, y + 4)

      // Bar background
      const barX = MARGIN + 70
      const barW = CONTENT_W - 70 - 20
      doc.setFillColor(243, 244, 246)
      doc.roundedRect(barX, y, barW, 5, 1, 1, 'F')

      // Bar fill
      doc.setFillColor(dr, dg, db)
      const fillW = Math.max(2, (d.pct / 100) * barW)
      doc.roundedRect(barX, y, fillW, 5, 1, 1, 'F')

      // Score text
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(dr, dg, db)
      doc.text(`${d.pct}%`, PAGE_W - MARGIN, y + 4, { align: 'right' })

      y += 12
    })

    y += 4
    doc.setDrawColor(229, 231, 235)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 10

    // Recommendations
    checkPage(20)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 31, 61)
    doc.text('Recommendations', MARGIN, y)
    y += 8

    // Strip HTML tags and render as text
    const recs = (assessment.ai_recommendations || '').replace(/<h4>/g, '\n').replace(/<\/h4>/g, '\n').replace(/<strong>/g, '').replace(/<\/strong>/g, '').replace(/<br\/?>/g, '\n').replace(/<p>/g, '').replace(/<\/p>/g, '\n').replace(/<[^>]+>/g, '').trim()

    const sections = recs.split('\n').filter(s => s.trim())
    sections.forEach(section => {
      const trimmed = section.trim()
      if (!trimmed) return
      // Detect headers (short lines that were h4 tags)
      const isHeader = trimmed.length < 60 && !trimmed.includes('.') && sections.indexOf(section) > 0
      checkPage(10)
      if (isHeader) {
        y += 4
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 31, 61)
        doc.text(trimmed, MARGIN, y)
        y += 6
      } else {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(55, 65, 81)
        const lines = doc.splitTextToSize(trimmed, CONTENT_W)
        lines.forEach((line: string) => {
          checkPage(6)
          doc.text(line, MARGIN, y)
          y += 5.5
        })
      }
    })

    y += 8

    // Maturity level reference
    checkPage(60)
    doc.setDrawColor(229, 231, 235)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 31, 61)
    doc.text('Maturity Level Reference', MARGIN, y)
    y += 7

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
      doc.setFillColor(lr, lg, lb)
      doc.circle(MARGIN + 2, y + 1, 2, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(lr, lg, lb)
      doc.text(lv.name, MARGIN + 7, y + 3)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      doc.text(`— ${lv.sentiment}`, MARGIN + 7 + doc.getTextWidth(lv.name) + 2, y + 3)
      y += 8
    })

    addFooter()

    const filename = `${assessment.company_name.replace(/[^a-zA-Z0-9]/g, '-')}-Maturity-Report-${new Date(assessment.completed_at).toISOString().slice(0, 10)}.pdf`
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
          <div style={{ width: 34, height: 34, background: '#0f1f3d', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          </div>
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
                {assessment.respondent_name && ` · ${assessment.respondent_name}`}
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Focus area */}
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#c2410c', marginBottom: 8 }}>Priority Focus Area</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#7c2d12', marginBottom: 4 }}>{DOMAIN_NAMES[lowestDomain?.key] || '—'}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: getScoreColor(lowestDomain?.pct || 0) }}>{lowestDomain?.pct || 0}%</div>
            <div style={{ fontSize: 12, color: '#9a3412', marginTop: 4 }}>Lowest scoring domain — greatest opportunity for improvement</div>
          </div>

          {/* Strongest area */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#15803d', marginBottom: 8 }}>Strongest Area</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#14532d', marginBottom: 4 }}>{DOMAIN_NAMES[highestDomain?.key] || '—'}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: getScoreColor(highestDomain?.pct || 0) }}>{highestDomain?.pct || 0}%</div>
            <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>Your competitive advantage — leverage this across the business</div>
          </div>
        </div>

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
        {assessment.ai_recommendations && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Recommendations</h2>
            <div
              style={{ fontSize: 14, lineHeight: 1.75, color: '#374151' }}
              dangerouslySetInnerHTML={{ __html: assessment.ai_recommendations
                .replace(/<h4>/g, '<h4 style="font-size:15px;font-weight:700;color:#0f1f3d;margin:20px 0 8px;padding:0">')
                .replace(/<p>/g, '<p style="margin:0 0 12px;padding:0">')
              }}
            />
          </div>
        )}

        {/* Maturity level reference */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px' }}>
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

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
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
