'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DOMAINS } from '@/lib/maturityData'
import { calculateScores, getLevelFromScore } from '@/lib/scoring'

interface CompanyInfo {
  company: string
  name: string
  title: string
  volume: string
  state: string
}

const LEVEL_LABELS: Record<string, string> = {
  '-1': 'Anchor',
  '0': 'Typical',
  '1': 'Strategic Implementer',
  '2': 'Adaptive Innovator',
  '3': 'Guiding Star',
}

const LEVEL_COLORS: Record<string, string> = {
  '-1': '#dc2626',
  '0': '#f59e0b',
  '1': '#3b82f6',
  '2': '#8b5cf6',
  '3': '#16a34a',
}


const GLOSSARY_TERMS: { term: string; full: string; def: string }[] = [
  { term: 'TPS', full: 'Trade Partner/Supplier', def: 'The subcontractors and material vendors (framers, plumbers, electricians, roofers, etc.) who perform work on your job sites.' },
  { term: 'ERP', full: 'Enterprise Resource Planning', def: 'Your central business software that manages purchasing, scheduling, accounting, and job costing in one platform (e.g., BuilderTREND, CoConstruct, Sage, Hyphen).' },
  { term: 'CRM', full: 'Customer Relationship Management', def: 'Software that tracks leads, prospects, and customer communications throughout the sales pipeline.' },
  { term: 'BIM', full: 'Building Information Modeling', def: 'A 3D digital model containing design, schedule, and cost data. 4D BIM adds time/schedule; 5D BIM adds cost.' },
  { term: 'DfMA', full: 'Design for Manufacturing & Assembly', def: 'Designing home components to be built off-site and assembled on the lot, rather than constructed from scratch on-site.' },
  { term: 'Digital Twin', full: 'Digital Twin', def: 'A live digital replica of the completed home tied to its actual systems â delivered at closing for ongoing management, warranty, and smart home control.' },
  { term: 'AP', full: 'Accounts Payable', def: 'The internal function responsible for processing and paying invoices and purchase orders to trade partners and suppliers.' },
  { term: 'PO / WO', full: 'Purchase Order / Work Order', def: 'A PO is a formal commitment to buy specific labor or materials. A WO instructs a specific task to be performed. Both define scope and price before work begins.' },
  { term: 'G&A', full: 'General & Administrative', def: 'Overhead costs not tied to a specific job â office rent, staff salaries, insurance, software subscriptions, etc.' },
  { term: 'EFT', full: 'Electronic Funds Transfer', def: 'Direct bank-to-bank payment (ACH) instead of mailing a paper check.' },
  { term: 'JIT', full: 'Just-In-Time', def: 'Ordering materials and scheduling labor to arrive exactly when needed, minimizing waste and on-site storage.' },
  { term: 'QC', full: 'Quality Control', def: 'Inspecting completed work against defined standards before approving payment or moving to the next phase.' },
  { term: 'KPI', full: 'Key Performance Indicator', def: 'A measurable metric to track business performance â e.g., cycle time, defect rate, or customer satisfaction score.' },
  { term: 'Stakeout', full: 'Stakeout', def: 'The surveying step where lot boundaries and foundation footprint are physically marked on the ground before construction begins.' },
  { term: 'AI / ML', full: 'Artificial Intelligence / Machine Learning', def: 'Software that learns from data to automate decisions â e.g., optimizing schedules, predicting buyer behavior, or flagging quality issues.' },
]

function getScoreColor(pct: number): string {
  if (pct < 25) return '#dc2626'
  if (pct < 50) return '#f59e0b'
  if (pct < 75) return '#3b82f6'
  return '#16a34a'
}

function DRAFT_KEY(userId: string) { return `bm_draft_${userId}` }

const ALL_QUESTIONS = DOMAINS.flatMap(d => d.questions.map(q => ({ ...q, domainKey: d.key, domainName: d.name, domainIconPath: d.iconPath })))
const TOTAL = ALL_QUESTIONS.length

export default function AssessmentClient({ userId, editAnswers, editCompanyInfo, editAssessmentId }: {
  userId: string
  editAnswers?: Record<string, string>
  editCompanyInfo?: CompanyInfo
  editAssessmentId?: string
}) {
  const router = useRouter()
  const [screen, setScreen] = useState<'company' | 'assessment' | 'submitting'>(editAnswers ? 'assessment' : 'company')
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(
    editCompanyInfo || { company: '', name: '', title: 'CEO', volume: '', state: '' }
  )
  const [companyErrors, setCompanyErrors] = useState<Record<string, string>>({})
  const [answers, setAnswers] = useState<Record<string, string>>(editAnswers || {})
  const [currentQ, setCurrentQ] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showResumeBanner, setShowResumeBanner] = useState(false)
  const [showGlossary, setShowGlossary] = useState(false)
  const [draftData, setDraftData] = useState<{ answers: Record<string, string>; companyInfo: CompanyInfo } | null>(null)

  // Load draft on mount
  useEffect(() => {
    if (editAnswers) return // skip draft check in edit mode
    try {
      const raw = localStorage.getItem(DRAFT_KEY(userId))
      if (raw) {
        const parsed = JSON.parse(raw)
        const minutesAgo = (Date.now() - new Date(parsed.savedAt).getTime()) / 60000
        if (minutesAgo < 1440 && Object.keys(parsed.answers || {}).length > 0) {
          setDraftData(parsed)
          setShowResumeBanner(true)
        }
      }
    } catch {}
  }, [userId, editAnswers])

  // Auto-save draft on answer change
  useEffect(() => {
    if (screen !== 'assessment') return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY(userId), JSON.stringify({
          answers, companyInfo, savedAt: new Date().toISOString(), version: 1
        }))
      } catch {}
    }, 500)
    return () => clearTimeout(timer)
  }, [answers, companyInfo, screen, userId])

  // In edit mode: jump to first unanswered question on mount
  useEffect(() => {
    if (!editAnswers) return
    const firstUnanswered = ALL_QUESTIONS.findIndex(q => !editAnswers[q.id])
    setCurrentQ(firstUnanswered >= 0 ? firstUnanswered : 0)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function resumeDraft() {
    if (!draftData) return
    setAnswers(draftData.answers)
    setCompanyInfo(draftData.companyInfo)
    setShowResumeBanner(false)
    setScreen('assessment')
  }

  function discardDraft() {
    try { localStorage.removeItem(DRAFT_KEY(userId)) } catch {}
    setShowResumeBanner(false)
  }

  function validateCompany(): boolean {
    const errors: Record<string, string> = {}
    if (!companyInfo.company.trim()) errors.company = 'Company name is required'
    else if (companyInfo.company.trim().length > 100) errors.company = 'Must be under 100 characters'
    if (!companyInfo.name.trim()) errors.name = 'Your name is required'
    setCompanyErrors(errors)
    return Object.keys(errors).length === 0
  }

  function startAssessment() {
    if (!validateCompany()) return
    setScreen('assessment')
    // jump to first unanswered question
    const firstUnanswered = ALL_QUESTIONS.findIndex(q => !answers[q.id])
    setCurrentQ(firstUnanswered >= 0 ? firstUnanswered : 0)
  }

  const answeredCount = useMemo(() => Object.values(answers).filter(a => a !== null && a !== undefined).length, [answers])

  const liveScore = useMemo(() => {
    if (answeredCount < 5) return null
    const { overall, insufficientData } = calculateScores(answers)
    return { pct: overall, insufficient: insufficientData }
  }, [answers, answeredCount])

  function selectAnswer(qId: string, level: string) {
    setAnswers(prev => ({ ...prev, [qId]: level }))
    setTimeout(() => {
      if (currentQ < TOTAL - 1) setCurrentQ(q => q + 1)
        else setShowCompletion(true)
    }, 320)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/complete-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyInfo, answers, assessmentId: editAssessmentId || null }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Submission failed')
      }
      const data = await res.json()
      try { localStorage.removeItem(DRAFT_KEY(userId)) } catch {}
      router.push(`/results/${data.id}`)
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Could not save your results. Please check your connection and try again.')
      setSubmitting(false)
    }
  }

  const currentQuestion = ALL_QUESTIONS[currentQ]
  const currentDomain = DOMAINS.find(d => d.key === currentQuestion?.domainKey)
  const domainStartIdx = ALL_QUESTIONS.findIndex(q => q.domainKey === currentQuestion?.domainKey)
  const domainEndIdx = domainStartIdx + (currentDomain?.questions.length || 0) - 1
  const domainProgress = currentQ - domainStartIdx + 1
  const domainTotal = currentDomain?.questions.length || 0

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ COMPANY INFO SCREEN ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  if (screen === 'company') {
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
          <a href="/dashboard" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>Back to Dashboard</a>
        </nav>

        <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
          {showResumeBanner && draftData && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1d4ed8', margin: '0 0 4px' }}>Resume your draft?</p>
              <p style={{ fontSize: 13, color: '#374151', margin: '0 0 12px' }}>You have a saved assessment in progress with {Object.keys(draftData.answers).length} questions answered.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={resumeDraft} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Resume Draft</button>
                <button onClick={discardDraft} style={{ background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 7, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Start Fresh</button>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f1f3d', margin: '0 0 8px', fontFamily: "'DM Serif Display',serif" }}>
              {editAssessmentId ? 'Edit Your Assessment' : 'Start Your Assessment'}
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
              53 questions across 6 operational domains. Takes about 20-30 minutes. Tell us a bit about your company first.
            </p>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '32px 28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Company Name */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Company Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  type="text"
                  value={companyInfo.company}
                  onChange={e => setCompanyInfo(p => ({ ...p, company: e.target.value }))}
                  placeholder="ABC Homes"
                  style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: `1px solid ${companyErrors.company ? '#dc2626' : '#e5e7eb'}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif" }}
                />
                {companyErrors.company && <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }}>{companyErrors.company}</p>}
              </div>

              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Your Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  type="text"
                  value={companyInfo.name}
                  onChange={e => setCompanyInfo(p => ({ ...p, name: e.target.value }))}
                  placeholder="John Smith"
                  style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: `1px solid ${companyErrors.name ? '#dc2626' : '#e5e7eb'}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif" }}
                />
                {companyErrors.name && <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }}>{companyErrors.name}</p>}
              </div>

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Your Title</label>
                <input
                  type="text"
                  value={companyInfo.title}
                  onChange={e => setCompanyInfo(p => ({ ...p, title: e.target.value }))}
                  placeholder="CEO"
                  style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif" }}
                />
              </div>

              {/* Homes per year */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Homes Built Per Year</label>
                <select
                  value={companyInfo.volume}
                  onChange={e => setCompanyInfo(p => ({ ...p, volume: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif", background: '#fff', color: companyInfo.volume ? '#111827' : '#9ca3af' }}
                >
                  <option value="">Select range</option>
                  <option value="1-10">1-10</option>
                  <option value="11-25">11-25</option>
                  <option value="26-50">26-50</option>
                  <option value="51-100">51-100</option>
                  <option value="101-250">101-250</option>
                  <option value="251-500">251-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>

              {/* State */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>State / Region</label>
                <input
                  type="text"
                  value={companyInfo.state}
                  onChange={e => setCompanyInfo(p => ({ ...p, state: e.target.value }))}
                  placeholder="Texas"
                  style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif" }}
                />
              </div>

              <button
                onClick={startAssessment}
                style={{ background: '#0f1f3d', color: '#fff', border: 'none', borderRadius: 9, padding: '13px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}
              >
                Begin Assessment &rarr;
              </button>
            </div>
          </div>

          {/* Domain overview */}
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 12 }}>6 Domains Covered</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DOMAINS.map((d, i) => (
                <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', width: 16 }}>{i}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d.iconPath} /></svg>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{d.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>{d.questions.length} items</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ ASSESSMENT SCREEN ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter',sans-serif" }}>
      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        {/* Nav */}
        <div style={{ padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="https://rkfkccefwlarscfjmncz.supabase.co/storage/v1/object/public/assets/Wht%20M%20Solid%20Blue%20Sq%20Clear%20Background.png" alt="Mainspring M" style={{ width: 30, height: 30, borderRadius: 6, display: 'block' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f1f3d' }}>Builder Maturity</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="/dashboard" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none', padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontWeight: 500 }}>← Dashboard</a>
            <button onClick={() => { try { localStorage.setItem('bm_saved','1') } catch(e){} window.location.href = '/dashboard' }} style={{ fontSize: 12, color: '#16a34a', background: 'none', border: '1px solid #bbf7d0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>Save &amp; Exit</button>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{answeredCount}/{TOTAL}</span>
            
            <button
              onClick={() => setShowGlossary(true)}
              style={{ fontSize: 12, color: '#1d4ed8', background: 'none', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontWeight: 600 }}
            >
              Glossary
            </button>

            {answeredCount >= 10 && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ background: '#0f1f3d', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Saving...' : 'View Results'}
              </button>
            )}
          </div>
        </div>

        {/* Progress bars */}
        <div style={{ padding: '0 24px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Completion bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#9ca3af', width: 120, flexShrink: 0 }}>Completion</span>
            <div style={{ flex: 1, height: 5, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${(answeredCount / TOTAL) * 100}%`, background: '#3b82f6', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', width: 34, textAlign: 'right', flexShrink: 0 }}>{Math.round((answeredCount / TOTAL) * 100)}%</span>
          </div>
          {/* Live score bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#9ca3af', width: 120, flexShrink: 0 }}>Est. Maturity Score</span>
            <div style={{ flex: 1, height: 5, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, width: liveScore ? `${liveScore.pct}%` : '0%', background: liveScore ? getScoreColor(liveScore.pct) : '#e5e7eb', transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, width: 34, textAlign: 'right', flexShrink: 0, color: liveScore ? getScoreColor(liveScore.pct) : '#9ca3af' }}>
              {liveScore ? `${liveScore.pct}%` : '--'}
            </span>
          </div>
        </div>

        {/* Domain tabs */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderTop: '1px solid #f3f4f6' }}>
          {DOMAINS.map((d, i) => {
            const domainAnswered = d.questions.filter(q => answers[q.id] !== undefined).length
            const isActive = currentQuestion?.domainKey === d.key
            const firstQIdx = ALL_QUESTIONS.findIndex(q => q.domainKey === d.key)
            return (
              <button
                key={d.key}
                onClick={() => setCurrentQ(firstQIdx)}
                style={{
                  padding: '8px 14px', fontSize: 12, fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#0f1f3d' : '#6b7280', background: 'none', border: 'none',
                  borderBottom: isActive ? '2px solid #0f1f3d' : '2px solid transparent',
                  cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d.iconPath} /></svg>
                {d.short}
                {domainAnswered === d.questions.length && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Question area */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 80px' }}>
        {submitError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#dc2626' }}>
            {submitError}
          </div>
        )}

        {/* Domain header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={currentQuestion?.domainIconPath} /></svg>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af' }}>
              Domain {DOMAINS.findIndex(d => d.key === currentQuestion?.domainKey)} &mdash; {currentQuestion?.domainName}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>{domainProgress} of {domainTotal}</span>
          </div>
          <div style={{ height: 3, background: '#f3f4f6', borderRadius: 2 }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${(domainProgress / domainTotal) * 100}%`, background: '#0f1f3d', transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Question card */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px 28px 24px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10 }}>Question {currentQ + 1} of {TOTAL}</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f1f3d', margin: '0 0 20px', lineHeight: 1.4 }}>{currentQuestion?.label}</h2>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select the level that best describes your current operation:</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['-1', '0', '1', '2', '3'].map(level => {
              const isSelected = answers[currentQuestion?.id] === level
              return (
                <button
                  key={level}
                  onClick={() => selectAnswer(currentQuestion.id, level)}
                  aria-label={`Select Level ${level}: ${LEVEL_LABELS[level]} for ${currentQuestion?.label}`}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
                    border: `2px solid ${isSelected ? LEVEL_COLORS[level] : '#e5e7eb'}`,
                    borderRadius: 10, background: isSelected ? `${LEVEL_COLORS[level]}0d` : '#fafafa',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%',
                    minHeight: 44
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                    background: isSelected ? LEVEL_COLORS[level] : '#f3f4f6',
                    color: isSelected ? '#fff' : '#6b7280',
                    border: `2px solid ${isSelected ? LEVEL_COLORS[level] : '#e5e7eb'}`
                  }}>
                    {level === '-1' ? '-1' : level}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? LEVEL_COLORS[level] : '#374151', marginBottom: 3 }}>
                      Level {level}: {LEVEL_LABELS[level]}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                      {currentQuestion?.levels[level]}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* N/A option */}
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => selectAnswer(currentQuestion.id, 'na')}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 8,
              border: `2px solid ${answers[currentQuestion.id] === 'na' ? '#6b7280' : '#e5e7eb'}`,
              background: answers[currentQuestion.id] === 'na' ? '#6b7280' : '#f9fafb',
              color: answers[currentQuestion.id] === 'na' ? '#fff' : '#6b7280',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' as const,
              display: 'flex', alignItems: 'center', gap: 10
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, background: answers[currentQuestion.id] === 'na' ? 'rgba(255,255,255,0.3)' : '#e5e7eb', borderRadius: 4, padding: '2px 6px' }}>N/A</span>
            Not applicable to my business — excluded from scoring
          </button>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <button
            onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: currentQ === 0 ? '#d1d5db' : '#374151', cursor: currentQ === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500 }}
          >
            &larr; Previous
          </button>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={() => setCurrentQ(q => Math.min(TOTAL - 1, q + 1))}
              disabled={currentQ === TOTAL - 1 || !answers[currentQuestion?.id]}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: currentQ === TOTAL - 1 ? '#d1d5db' : '#374151', cursor: currentQ === TOTAL - 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500 }}
            >
              Next &rarr;
            </button>
            {answeredCount >= 10 && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ padding: '9px 20px', background: '#0f1f3d', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Saving...' : 'View Results'}
              </button>
            )}
          </div>
        </div>

        {/* Answered count grid mini-map */}
        <div style={{ marginTop: 24, padding: '16px 20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Progress Map</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {DOMAINS.map((domain) => {
            const dqs = ALL_QUESTIONS.map((q, qi) => ({ q, qi })).filter(({ q }) => q.domainKey === domain.key)
            const isActive = currentQuestion?.domainKey === domain.key
            return (
              <div key={domain.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: isActive ? '#0f1f3d' : '#9ca3af', fontWeight: isActive ? 700 : 400, width: 70, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{domain.short}</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  {dqs.map(({ q, qi }) => (
                    <button key={q.id} onClick={() => setCurrentQ(qi)} title={q.label}
                      style={{ width: 14, height: 14, borderRadius: 2, border: qi === currentQ ? '2px solid #0f1f3d' : 'none', cursor: 'pointer', flexShrink: 0,
                        background: qi === currentQ ? '#0f1f3d' : answers[q.id] !== undefined ? getScoreColor(answers[q.id] === 'na' ? 0 : (parseInt(answers[q.id]) + 1) * 25) : '#f3f4f6' }} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '10px 0 0' }}>Click any square to jump to that question</p>
      </div>
      </main>

      {/* Glossary modal */}
      {showGlossary && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: 18, maxWidth: 600, width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, fontWeight: 400, color: '#0f1f3d', margin: 0 }}>Glossary</h2>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>Industry terms used throughout this assessment</p>
              </div>
              <button onClick={() => setShowGlossary(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#6b7280', flexShrink: 0 }}>Ã</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '16px 28px 24px' }}>
              {GLOSSARY_TERMS.map(({ term, full, def }) => (
                <div key={term} style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f1f3d', background: '#eff6ff', borderRadius: 5, padding: '2px 8px', flexShrink: 0 }}>{term}</span>
                    {full !== term && <span style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic' }}>{full}</span>}
                  </div>
                  <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6 }}>{def}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Completion screen */}
      {showCompletion && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 520, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', border: '3px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, color: '#0f1f3d', marginBottom: 12 }}>Assessment Complete!</h2>
            <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.6, marginBottom: 32 }}>
              You've answered all {ALL_QUESTIONS.length} questions. You can review and edit any previous answer, or click <strong>View Results</strong> to generate your report.
            </p>
            <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
              <button
                onClick={handleSubmit}
                style={{ backgroundColor: '#0f1f3d', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700, padding: '14px 0', borderRadius: 10, width: '100%' }}
              >
                View Results →
              </button>
              <button
                onClick={() => { setShowCompletion(false); setCurrentQ(0); }}
                style={{ backgroundColor: 'transparent', color: '#0f1f3d', border: '2px solid #e5e7eb', cursor: 'pointer', fontSize: 15, fontWeight: 500, padding: '12px 0', borderRadius: 10, width: '100%' }}
              >
                Review &amp; Edit Answers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitting overlay */}
      {submitting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 48px', textAlign: 'center', maxWidth: 360 }}>
            <div style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTop: '3px solid #0f1f3d', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 17, fontWeight: 700, color: '#0f1f3d', margin: '0 0 8px' }}>Calculating Your Score</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Generating your AI-powered recommendations&hellip; This takes about 10 seconds.</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  )
}
