'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DOMAINS } from '@/lib/maturityData'
import { BUYER_OPTIONS, SOFTWARE_OPTIONS, VOLUME_OPTIONS, isProfileKey, profileToAnswers, readProfile, type Profile } from '@/lib/profile'
import { calculateScores, getLevelFromScore } from '@/lib/scoring'

interface CompanyInfo {
  company: string
  name: string
  title: string
  volume: string
  state: string
}

const GLOSSARY_TERMS: { term: string; full: string; def: string }[] = [
  { term: 'ERP', full: 'Enterprise Resource Planning', def: 'Your central business software that manages purchasing, scheduling, accounting, and job costing in one platform (e.g., BuilderTREND, CoConstruct, Sage, Hyphen).' },
  { term: 'CRM', full: 'Customer Relationship Management', def: 'Software that tracks leads, prospects, and customer communications throughout the sales pipeline.' },
  { term: 'BIM', full: 'Building Information Modeling', def: 'A 3D digital model containing design, schedule, and cost data. 4D BIM adds time/schedule; 5D BIM adds cost.' },
  { term: 'DfMA', full: 'Design for Manufacturing & Assembly', def: 'Designing home components to be built off-site and assembled on the lot, rather than constructed from scratch on-site.' },
  { term: 'Digital Twin', full: 'Digital Twin', def: 'A live digital replica of the completed home tied to its actual systems \u2014 delivered at closing for ongoing management, warranty, and smart home control.' },
  { term: 'AP', full: 'Accounts Payable', def: 'The internal function responsible for processing and paying invoices and purchase orders to trade partners and suppliers.' },
  { term: 'PO / WO', full: 'Purchase Order / Work Order', def: 'A PO is a formal commitment to buy specific labor or materials. A WO instructs a specific task to be performed. Both define scope and price before work begins.' },
  { term: 'G&A', full: 'General & Administrative', def: 'Overhead costs not tied to a specific job \u2014 office rent, staff salaries, insurance, software subscriptions, etc.' },
  { term: 'EFT', full: 'Electronic Funds Transfer', def: 'Direct bank-to-bank payment (ACH) instead of mailing a paper check.' },
  { term: 'JIT', full: 'Just-In-Time', def: 'Ordering materials and scheduling labor to arrive exactly when needed, minimizing waste and on-site storage.' },
  { term: 'QC', full: 'Quality Control', def: 'Inspecting completed work against defined standards before approving payment or moving to the next phase.' },
  { term: 'KPI', full: 'Key Performance Indicator', def: 'A measurable metric to track business performance \u2014 e.g., cycle time, defect rate, or customer satisfaction score.' },
  { term: 'Stakeout', full: 'Stakeout', def: 'The surveying step where lot boundaries and foundation footprint are physically marked on the ground before construction begins.' },
  { term: 'Itemization', full: 'Itemized Purchasing', def: 'Buying labor and material by what actually drives the vendor\u2019s cost (square feet, tonnage, fixtures, trips) instead of one lump-sum price per trade.' },
  { term: 'Takeoff', full: 'Quantity Takeoff', def: 'Measuring quantities from the plans before work starts \u2014 yards of concrete, square feet of driveway, tons of stone \u2014 so the budget is set before the invoice arrives.' },
  { term: 'Variance / VPO', full: 'Variance Purchase Order', def: 'Any cost outside the original purchase order. Tracked with a reason code so repeat causes can be fixed at the source.' },
  { term: 'Value Engineering', full: 'Value Engineering', def: 'Removing cost the buyer does not value through smarter specs, better processes, supply chain terms, or matching product to what buyers actually want.' },
  { term: 'Soft Cycle', full: 'Soft Cycle', def: 'The stretch between a signed contract and the start of construction: selections, financing, plans, and permits.' },
  { term: 'SOP', full: 'Standard Operating Procedure', def: 'A written description of how a task or handoff is done, what it needs to start, and what it must produce.' },
  { term: 'Decision-Oriented Dashboard', full: 'Decision-Oriented Dashboard', def: 'A dashboard that shows the exceptions that need action (and who owns them) instead of every number, so leaders manage by exception.' },
  { term: 'KPI vs. Driver', full: 'Key Performance Indicator vs. Driver Metric', def: 'A KPI (like gross margin) is usually lagging and shared by several people. A driver (like variance % or schedule slip) is leading, has one owner, and can be acted on directly.' },
  { term: 'Margin Shift', full: 'Margin Shift', def: 'How a home\u2019s gross margin changes between contract and closing, broken out by cause (variances, change orders, incentives, vendor changes).' },
  { term: 'Start Package', full: 'Start Package', def: 'The budget, purchase orders, and schedule released when a home starts. If it is incomplete, the budget does not reflect what the home will really cost.' },
  { term: 'AI / ML', full: 'Artificial Intelligence / Machine Learning', def: 'Software that learns from data to automate decisions \u2014 e.g., optimizing schedules, predicting buyer behavior, or flagging quality issues.' },
]

function getScoreColor(pct: number): string {
  if (pct < 25) return '#dc2626'
  if (pct < 50) return '#f59e0b'
  if (pct < 75) return '#3b82f6'
  return '#16a34a'
}

function DRAFT_KEY(userId: string) { return `bm_draft_${userId}` }

const ALL_QUESTIONS = DOMAINS.flatMap(d =>
  d.questions.map(q => ({ ...q, domainKey: d.key, domainName: d.name, domainIconPath: d.iconPath }))
)
const TOTAL = ALL_QUESTIONS.length

export default function AssessmentClient({
  userId, editAnswers, editCompanyInfo, editAssessmentId
}: {
  userId: string
  editAnswers?: Record<string, string>
  editCompanyInfo?: CompanyInfo
  editAssessmentId?: string
}) {
  const router = useRouter()
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const [screen, setScreen] = useState<'company' | 'assessment' | 'submitting'>(editAnswers ? 'assessment' : 'company')
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(
    editCompanyInfo || { company: '', name: '', title: 'CEO', volume: '', state: '' }
  )
  const [companyErrors, setCompanyErrors] = useState<Record<string, string>>({})
  // Scored answers only; profile (P.*) keys are split out into `profile`.
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(editAnswers || {}).filter(([k]) => !isProfileKey(k)))
  )
  const [profile, setProfile] = useState<Profile>(readProfile(editAnswers))
  const [currentQ, setCurrentQ] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showResumeBanner, setShowResumeBanner] = useState(false)
  const [showGlossary, setShowGlossary] = useState(false)
  const [draftData, setDraftData] = useState<{ answers: Record<string, string>; companyInfo: CompanyInfo; profile?: Profile } | null>(null)
  const [supabaseDraftId, setSupabaseDraftId] = useState<string | null>(editAssessmentId || null)
  const [nextShake, setNextShake] = useState(false)
  const [qCounterKey, setQCounterKey] = useState(0)
  const prevQRef = useRef(currentQ)

  // Animate counter when question changes
  useEffect(() => {
    if (prevQRef.current !== currentQ) {
      setQCounterKey(k => k + 1)
      prevQRef.current = currentQ
    }
  }, [currentQ])

  // Auto-resume if coming from dashboard Continue button
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('resume') !== 'true') return
    try {
      const raw = localStorage.getItem(DRAFT_KEY(userId))
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Object.keys(parsed.answers || {}).length > 0) {
          setAnswers(parsed.answers)
          setCompanyInfo(parsed.companyInfo || { company: '', name: '', title: 'CEO', volume: '', state: '' })
          if (parsed.profile) setProfile(parsed.profile)
          if (parsed.supabaseDraftId) setSupabaseDraftId(parsed.supabaseDraftId)
          if (typeof parsed.currentQ === 'number') setCurrentQ(parsed.currentQ)
          setScreen('assessment')
          return
        }
      }
    } catch {}
    // No valid draft - just proceed normally (company info screen)
  }, [userId])

  // Load localStorage draft on mount
  useEffect(() => {
    if (editAnswers) return
    try {
      const raw = localStorage.getItem(DRAFT_KEY(userId))
      if (raw) {
        const parsed = JSON.parse(raw)
        const minutesAgo = (Date.now() - new Date(parsed.savedAt).getTime()) / 60000
        if (minutesAgo < 10080 && Object.keys(parsed.answers || {}).length > 0) {
          setDraftData(parsed)
          setShowResumeBanner(true)
          if (parsed.supabaseDraftId) setSupabaseDraftId(parsed.supabaseDraftId)
        }
      }
    } catch {}
  }, [userId, editAnswers])

  // Auto-save to localStorage + Supabase on answer change
  useEffect(() => {
    if (screen !== 'assessment') return
    const timer = setTimeout(async () => {
      try {
        localStorage.setItem(DRAFT_KEY(userId), JSON.stringify({
          answers, companyInfo, profile, savedAt: new Date().toISOString(),
          version: 2, supabaseDraftId, currentQ
        }))
      } catch {}
      // Supabase save - only if not in edit mode
      if (!editAssessmentId && Object.keys(answers).length > 0) {
        try {
          const res = await fetch('/api/save-draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyInfo, answers: { ...answers, ...profileToAnswers(profile) }, currentQ, draftId: supabaseDraftId }),
          })
          if (res.ok) {
            const d = await res.json()
            if (d.id && !supabaseDraftId) setSupabaseDraftId(d.id)
          }
        } catch {}
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [answers, companyInfo, profile, screen, userId, currentQ, supabaseDraftId, editAssessmentId])

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
    if (draftData.profile) setProfile(draftData.profile)
    setShowResumeBanner(false)
    setScreen('assessment')
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY(userId)) || '{}')
    if (typeof saved.currentQ === 'number') setCurrentQ(saved.currentQ)
  }

  function discardDraft() {
    try { localStorage.removeItem(DRAFT_KEY(userId)) } catch {}
    if (supabaseDraftId) {
      fetch('/api/save-draft', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ draftId: supabaseDraftId }) }).catch(() => {})
    }
    setSupabaseDraftId(null)
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
    const firstUnanswered = ALL_QUESTIONS.findIndex(q => !answers[q.id])
    setCurrentQ(firstUnanswered >= 0 ? firstUnanswered : 0)
  }

  const answeredCount = useMemo(() =>
    ALL_QUESTIONS.filter(q => answers[q.id] !== null && answers[q.id] !== undefined).length,
    [answers]
  )

  const unansweredIndices = useMemo(() =>
    ALL_QUESTIONS.map((q, i) => ({ q, i })).filter(({ q }) => answers[q.id] === undefined).map(({ i }) => i),
    [answers]
  )

  const firstUnansweredIdx = unansweredIndices.length > 0 ? unansweredIndices[0] : null
  const allAnswered = firstUnansweredIdx === null

  // Items must be answered in order. You can go back to anything already answered, or to the
  // first unanswered item, but you can't jump ahead and leave gaps.
  const lastAnsweredIdx = useMemo(() => {
    let last = -1
    ALL_QUESTIONS.forEach((q, i) => { if (answers[q.id] !== undefined) last = i })
    return last
  }, [answers])
  const canJumpTo = (i: number) => allAnswered || i <= (firstUnansweredIdx ?? 0) || answers[ALL_QUESTIONS[i]?.id] !== undefined
  // A gap left behind (e.g. from an older saved draft): unanswered but with later items answered
  const isSkipped = (i: number) => answers[ALL_QUESTIONS[i]?.id] === undefined && i < lastAnsweredIdx
  const skippedCount = unansweredIndices.filter(i => isSkipped(i)).length

  const liveScore = useMemo(() => {
    if (answeredCount < 5) return null
    const { overall, insufficientData } = calculateScores(answers)
    return { pct: overall, insufficient: insufficientData }
  }, [answers, answeredCount])

  function selectAnswer(qId: string, level: string) {
    setAnswers(prev => ({ ...prev, [qId]: level }))
    setTimeout(() => {
      // After the last scored item, move to the short profile step (index TOTAL)
      setCurrentQ(q => Math.min(q + 1, TOTAL))
    }, 320)
  }

  function handleNextClick() {
    if (!answers[currentQuestion?.id]) {
      setNextShake(true)
      setTimeout(() => setNextShake(false), 500)
      return
    }
    if (currentQ < TOTAL) setCurrentQ(q => q + 1)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/complete-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyInfo, answers: { ...answers, ...profileToAnswers(profile) }, assessmentId: supabaseDraftId || editAssessmentId || null }),
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

  const onProfileStep = currentQ >= TOTAL
  const currentQuestion = ALL_QUESTIONS[Math.min(currentQ, TOTAL - 1)]
  const currentDomain = DOMAINS.find(d => d.key === currentQuestion?.domainKey)
  const domainStartIdx = ALL_QUESTIONS.findIndex(q => q.domainKey === currentQuestion?.domainKey)
  const domainProgress = currentQ - domainStartIdx + 1
  const domainTotal = currentDomain?.questions.length || 0

  // ---- COMPANY INFO SCREEN ----
  if (screen === 'company') {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter',sans-serif" }}>
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
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1d4ed8', margin: '0 0 4px' }}>Resume your in-progress assessment?</p>
              <p style={{ fontSize: 13, color: '#374151', margin: '0 0 12px' }}>
                You have a saved assessment with {Object.keys(draftData.answers).length} of {TOTAL} items answered. It will remain available until you complete it.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={resumeDraft} style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Continue Assessment</button>
                <button onClick={discardDraft} style={{ background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 7, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Start Fresh</button>
              </div>
            </div>
          )}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f1f3d', margin: '0 0 8px', fontFamily: "'DM Serif Display',serif" }}>
              {editAssessmentId ? 'Edit Your Assessment' : 'Start Your Assessment'}
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
              {TOTAL} items across {DOMAINS.length} operational domains. Takes about 20-30 minutes. Tell us a bit about your company first.
            </p>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '32px 28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Company Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="text" value={companyInfo.company} onChange={e => setCompanyInfo(p => ({ ...p, company: e.target.value }))} placeholder="ABC Homes"
                  style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: `1px solid ${companyErrors.company ? '#dc2626' : '#e5e7eb'}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif" }} />
                {companyErrors.company && <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }}>{companyErrors.company}</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Your Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="text" value={companyInfo.name} onChange={e => setCompanyInfo(p => ({ ...p, name: e.target.value }))} placeholder="John Smith"
                  style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: `1px solid ${companyErrors.name ? '#dc2626' : '#e5e7eb'}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif" }} />
                {companyErrors.name && <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0' }}>{companyErrors.name}</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Your Title</label>
                <input type="text" value={companyInfo.title} onChange={e => setCompanyInfo(p => ({ ...p, title: e.target.value }))} placeholder="CEO"
                  style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif" }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>State / Region</label>
                <input type="text" value={companyInfo.state} onChange={e => setCompanyInfo(p => ({ ...p, state: e.target.value }))} placeholder="Texas"
                  style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter',sans-serif" }} />
              </div>
              <button onClick={startAssessment} style={{ background: '#0f1f3d', color: '#fff', border: 'none', borderRadius: 9, padding: '13px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
                Begin Assessment &rarr;
              </button>
            </div>
          </div>
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 12 }}>{DOMAINS.length} Domains Covered</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DOMAINS.map((d, i) => (
                <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', width: 16 }}>{i + 1}</span>
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

  // ---- ASSESSMENT SCREEN ----
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @keyframes qFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-5px); }
          40%     { transform: translateX(5px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
        .q-counter { animation: qFadeUp 0.28s ease; }
        .next-shake { animation: shake 0.4s ease; }
      `}</style>

      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        {/* Nav */}
        <div style={{ padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="https://rkfkccefwlarscfjmncz.supabase.co/storage/v1/object/public/assets/Wht%20M%20Solid%20Blue%20Sq%20Clear%20Background.png" alt="Mainspring M" style={{ width: 30, height: 30, borderRadius: 6, display: 'block' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f1f3d' }}>Builder Maturity</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="/dashboard" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none', padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontWeight: 500 }}>&#8592; Dashboard</a>
            <button onClick={() => { try { localStorage.setItem('bm_saved', '1') } catch(e){} window.location.href = '/dashboard' }}
              style={{ fontSize: 12, color: '#16a34a', background: 'none', border: '1px solid #bbf7d0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
              Save &amp; Exit
            </button>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{answeredCount}/{TOTAL}</span>
            <button onClick={() => setShowGlossary(true)}
              style={{ fontSize: 12, color: '#1d4ed8', background: 'none', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
              Glossary
            </button>
          </div>
        </div>
        {/* Progress bars */}
        <div style={{ padding: '0 24px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#9ca3af', width: 120, flexShrink: 0 }}>Completion</span>
            <div style={{ flex: 1, height: 5, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, width: `${(answeredCount / TOTAL) * 100}%`, background: '#3b82f6', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', width: 34, textAlign: 'right', flexShrink: 0 }}>{Math.round((answeredCount / TOTAL) * 100)}%</span>
          </div>
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
          {DOMAINS.map((d) => {
            const domainAnswered = d.questions.filter(q => answers[q.id] !== undefined).length
            const isActive = !onProfileStep && currentQuestion?.domainKey === d.key
            const firstQIdx = ALL_QUESTIONS.findIndex(q => q.domainKey === d.key)
            const tabLocked = !canJumpTo(firstQIdx)
            return (
              <button key={d.key} onClick={() => { if (!tabLocked) setCurrentQ(firstQIdx) }} disabled={tabLocked}
                title={tabLocked ? 'Finish the earlier sections first' : undefined}
                style={{ padding: '8px 14px', fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? '#0f1f3d' : tabLocked ? '#d1d5db' : '#6b7280', background: 'none', border: 'none', borderBottom: isActive ? '2px solid #0f1f3d' : '2px solid transparent', cursor: tabLocked ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
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

        {/* Progress Map - NOW ABOVE nav, with jump-to-unanswered */}
        <div style={{ marginTop: 24, padding: '16px 20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Progress Map</p>
            {firstUnansweredIdx !== null ? (
              <button
                onClick={() => setCurrentQ(firstUnansweredIdx)}
                style={{ fontSize: 11, fontWeight: 700, color: skippedCount > 0 ? '#b91c1c' : '#1d4ed8', background: skippedCount > 0 ? '#fef2f2' : '#eff6ff', border: `1px solid ${skippedCount > 0 ? '#fecaca' : '#bfdbfe'}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>&#8594;</span>
                {skippedCount > 0 ? `${skippedCount} skipped` : `${unansweredIndices.length} to go`} &#8212; {skippedCount > 0 ? 'Go to first skipped' : 'Go to next'}
              </button>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>&#10003; All items answered</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DOMAINS.map((domain) => {
              const dqs = ALL_QUESTIONS.map((q, qi) => ({ q, qi })).filter(({ q }) => q.domainKey === domain.key)
              const isActive = !onProfileStep && currentQuestion?.domainKey === domain.key
              return (
                <div key={domain.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: isActive ? '#0f1f3d' : '#9ca3af', fontWeight: isActive ? 700 : 400, width: 70, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{domain.short}</span>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {dqs.map(({ q, qi }) => {
                      const ans = answers[q.id]
                      const locked = !canJumpTo(qi)
                      const skipped = qi !== currentQ && isSkipped(qi)
                      const bg = qi === currentQ ? '#0f1f3d'
                        : ans === 'na' ? '#9ca3af'
                        : ans !== undefined ? getScoreColor((parseInt(ans) + 1) * 25)
                        : skipped ? '#fff' : '#f3f4f6'
                      return (
                        <button key={q.id} onClick={() => { if (!locked) setCurrentQ(qi) }} disabled={locked}
                          title={skipped ? `Skipped: ${q.label}` : locked ? 'Answer the earlier items first' : q.label}
                          aria-label={skipped ? `Skipped: ${q.label}` : q.label}
                          style={{ width: 14, height: 14, borderRadius: 2, boxSizing: 'border-box', padding: 0, border: qi === currentQ ? '2px solid #0f1f3d' : skipped ? '2px solid #dc2626' : 'none', cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.5 : 1, flexShrink: 0, background: bg }} />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 0' }}>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
              {skippedCount > 0
                ? <><span style={{ display: 'inline-block', width: 9, height: 9, border: '2px solid #dc2626', borderRadius: 2, verticalAlign: 'middle', marginRight: 5 }} />Red outline = skipped. Answer these (or mark N/A) before finishing.</>
                : 'Click an answered square to go back and change it'}
            </p>
            <button onClick={() => { if (allAnswered) setCurrentQ(TOTAL) }} disabled={!allAnswered}
              title={allAnswered ? undefined : 'Available once every item is answered'}
              style={{ fontSize: 11, fontWeight: 600, color: onProfileStep ? '#fff' : allAnswered ? '#0f1f3d' : '#d1d5db', background: onProfileStep ? '#0f1f3d' : '#f3f4f6', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: allAnswered ? 'pointer' : 'not-allowed' }}>
              About Your Company
            </button>
          </div>
        </div>


        {onProfileStep && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px 28px 24px', marginTop: 24, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 6px' }}>Last step &mdash; About Your Company</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f1f3d', margin: '0 0 6px', lineHeight: 1.3 }}>Three quick questions</h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px', lineHeight: 1.5 }}>Not scored. Your answers help tailor your recommendations to a builder of your size and buyer.</p>

            <p style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 10px' }}>1. How many homes do you build per year?</p>
            <div role="radiogroup" aria-label="Homes built per year" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {VOLUME_OPTIONS.map(v => {
                const sel = companyInfo.volume === v
                return (
                  <button key={v} role="radio" aria-checked={sel} onClick={() => setCompanyInfo(p => ({ ...p, volume: v }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${sel ? '#0f1f3d' : '#e2e5ea'}`, background: sel ? '#0f1f3d' : '#fff', color: sel ? '#fff' : '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <span style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${sel ? '#fff' : '#b8c0cc'}`, background: '#fff', boxShadow: sel ? 'inset 0 0 0 3px #0f1f3d' : 'none', flexShrink: 0 }} />
                    {v}
                  </button>
                )
              })}
            </div>

            <p style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 4px' }}>2. Who are your primary buyers?</p>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 10px' }}>Select all that apply.</p>
            <div role="group" aria-label="Primary buyers" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {BUYER_OPTIONS.map(o => {
                const sel = profile.buyer.includes(o.value)
                return (
                  <button key={o.value} role="checkbox" aria-checked={sel}
                    onClick={() => setProfile(p => ({ ...p, buyer: sel ? p.buyer.filter(b => b !== o.value) : [...p.buyer, o.value] }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${sel ? '#0f1f3d' : '#e2e5ea'}`, background: sel ? '#0f1f3d' : '#fff', color: sel ? '#fff' : '#374151', fontSize: 14, cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sel ? '#fff' : '#b8c0cc'}`, background: sel ? '#fff' : '#fff', color: '#0f1f3d', fontSize: 12, fontWeight: 900, lineHeight: '12px', textAlign: 'center', flexShrink: 0 }}>{sel ? '\u2713' : ''}</span>
                    {o.label}
                  </button>
                )
              })}
            </div>

            <p style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 10px' }}>3. What is your main operating software?</p>
            <div role="radiogroup" aria-label="Main operating software" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              {SOFTWARE_OPTIONS.map(o => {
                const sel = profile.software === o.value
                return (
                  <button key={o.value} role="radio" aria-checked={sel} onClick={() => setProfile(p => ({ ...p, software: o.value }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${sel ? '#0f1f3d' : '#e2e5ea'}`, background: sel ? '#0f1f3d' : '#fff', color: sel ? '#fff' : '#374151', fontSize: 14, cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${sel ? '#fff' : '#b8c0cc'}`, background: '#fff', boxShadow: sel ? 'inset 0 0 0 4px #0f1f3d' : 'none', flexShrink: 0 }} />
                    {o.label}
                  </button>
                )
              })}
            </div>

            {unansweredIndices.length > 0 && (
              <p style={{ fontSize: 12, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', margin: '16px 0 0' }}>
                {unansweredIndices.length} assessment {unansweredIndices.length === 1 ? 'item still needs' : 'items still need'} an answer before you can see your results. Use N/A for anything that doesn&apos;t apply to your business.
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
              <button onClick={() => setCurrentQ(TOTAL - 1)}
                style={{ padding: '9px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                &larr; Previous
              </button>
              <button onClick={handleSubmit} disabled={submitting || unansweredIndices.length > 0}
                style={{ padding: '11px 22px', background: '#0f1f3d', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: submitting || unansweredIndices.length > 0 ? 'not-allowed' : 'pointer', opacity: submitting || unansweredIndices.length > 0 ? 0.5 : 1 }}>
                {submitting ? 'Saving...' : 'Finish & View Results \u2192'}
              </button>
            </div>
          </div>
        )}

        {!onProfileStep && (<>
        {/* Domain header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={currentQuestion?.domainIconPath} /></svg>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af' }}>
              Domain {DOMAINS.findIndex(d => d.key === currentQuestion?.domainKey) + 1} &mdash; {currentQuestion?.domainName}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>{domainProgress} of {domainTotal}</span>
          </div>
          <div style={{ height: 3, background: '#f3f4f6', borderRadius: 2 }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${(domainProgress / domainTotal) * 100}%`, background: '#0f1f3d', transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Assessment item card */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px 28px 24px', marginBottom: 16 }}>
          <div key={qCounterKey} className="q-counter" style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12, fontWeight: 600 }}>
            {currentQ + 1} of {TOTAL}
          </div>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 4px', lineHeight: 1.4 }}>Which of the following best describes your</p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f1f3d', margin: '0 0 20px', lineHeight: 1.3 }}>{currentQuestion?.label}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['-1', '0', '1', '2', '3'].map((level, idx) => {
              const isSelected = answers[currentQuestion?.id] === level
              // Subtle light-to-dark progression across the five options (no level names or numbers shown)
              const restingTint = `rgba(15,31,61,${(idx * 0.025).toFixed(3)})`
              return (
                <button key={level} onClick={() => selectAnswer(currentQuestion.id, level)}
                  aria-label={`Select option ${idx + 1} of 5 for ${currentQuestion?.label}`}
                  aria-pressed={isSelected}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px', border: `1.5px solid ${isSelected ? '#0f1f3d' : '#e2e5ea'}`, borderRadius: 12, background: isSelected ? '#0f1f3d' : restingTint, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%', minHeight: 44 }}>
                  <div style={{ width: 18, height: 18, marginTop: 2, borderRadius: '50%', flexShrink: 0, border: `2px solid ${isSelected ? '#fff' : '#b8c0cc'}`, background: '#fff', boxShadow: isSelected ? 'inset 0 0 0 4px #0f1f3d' : 'none' }} />
                  <div style={{ flex: 1, fontSize: 14, color: isSelected ? '#fff' : '#374151', lineHeight: 1.5 }}>{currentQuestion?.levels[level]}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* N/A option */}
        <div style={{ marginTop: 8 }}>
          <button onClick={() => selectAnswer(currentQuestion.id, 'na')}
            style={{ width: '100%', padding: '10px 16px', borderRadius: 8, border: `2px solid ${answers[currentQuestion.id] === 'na' ? '#6b7280' : '#e5e7eb'}`, background: answers[currentQuestion.id] === 'na' ? '#6b7280' : '#f9fafb', color: answers[currentQuestion.id] === 'na' ? '#fff' : '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' as const, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, background: answers[currentQuestion.id] === 'na' ? 'rgba(255,255,255,0.3)' : '#e5e7eb', borderRadius: 4, padding: '2px 6px' }}>N/A</span>
            Not applicable to my business &#8212; excluded from scoring
          </button>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: currentQ === 0 ? '#d1d5db' : '#374151', cursor: currentQ === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500 }}>
            &larr; Previous
          </button>
          <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
            {!answers[currentQuestion?.id] && (
              <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>Select an answer to continue</span>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleNextClick}
                className={nextShake ? 'next-shake' : ''}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: answers[currentQuestion?.id] ? '#374151' : '#d1d5db', cursor: answers[currentQuestion?.id] ? 'pointer' : 'default', fontSize: 13, fontWeight: 500 }}>
                Next &rarr;
              </button>
            </div>
          </div>
        </div>

        </>)}
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
              <button onClick={() => setShowGlossary(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#6b7280', flexShrink: 0 }}>&times;</button>
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

      {/* Submitting overlay */}
      {submitting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 48px', textAlign: 'center', maxWidth: 360 }}>
            <div style={{ width: 48, height: 48, border: '3px solid #e5e7eb', borderTop: '3px solid #0f1f3d', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 17, fontWeight: 700, color: '#0f1f3d', margin: '0 0 8px' }}>Saving Your Answers</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>Calculating your scores now. On the next page your recommendations will be written while you watch &mdash; about a minute.</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  )
}
