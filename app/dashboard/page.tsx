'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ---- Types ----
interface UserProfile {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  title: string | null
}

interface Assessment {
  id: string
  company_name: string
  overall_score: number
  maturity_level: string | null
  maturity_level_key: string | null
  domain_scores: Record<string, { pct: number; answered: number; total: number }>
  completed_at: string
  created_at: string
}

interface Subscription {
  plan_type: 'annual' | 'onetime'
  status: string
  current_period_end: string | null
  assessments_used: number
  assessments_limit: number | null
}

// ---- Color helpers ----
function getScoreColor(pct: number): string {
  if (pct < 25) return '#dc2626'
  if (pct < 50) return '#f59e0b'
  if (pct < 75) return '#3b82f6'
  return '#16a34a'
}

function getLevelBadgeStyle(key: string | null): { bg: string; color: string } {
  if (key === '3') return { bg: '#dcfce7', color: '#15803d' }
  if (key === '2') return { bg: '#dbeafe', color: '#1d4ed8' }
  if (key === '1') return { bg: '#fef3c7', color: '#92400e' }
  if (key === '0') return { bg: '#f3f4f6', color: '#374151' }
  return { bg: '#fee2e2', color: '#991b1b' }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ---- Domain icons (SVG inline, no emoji per Section 0.6) ----
const domainIcons: Record<string, string> = {
  org: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  customer: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  trade: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0',
  internal: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  builder_rep: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  systems: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
}

const domainOrder = ['org', 'customer', 'trade', 'internal', 'builder_rep', 'systems']
const domainNames: Record<string, string> = {
  org: 'Org Structure',
  customer: 'Customer Experience',
  trade: 'Trade Partner',
  internal: 'Internal Operations',
  builder_rep: 'Builder Rep',
  systems: 'Supporting Systems',
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentSuccess = searchParams.get('payment') === 'success'

  const [user, setUser] = useState<UserProfile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentBanner, setShowPaymentBanner] = useState(paymentSuccess)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }

      // Load profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      // Load subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Load assessments
      const { data: asmts } = await supabase
        .from('assessments')
        .select('id, company_name, overall_score, maturity_level, maturity_level_key, domain_scores, completed_at, created_at')
        .eq('user_id', authUser.id)
        .eq('status', 'complete')
        .order('created_at', { ascending: false })
        .limit(20)

      setUser(profile || { id: authUser.id, email: authUser.email || '', full_name: null, company_name: null, title: null })
      setSubscription(sub || null)
      setAssessments(asmts || [])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  function handleStartAssessment() {
    if (!subscription) {
      router.push('/pricing')
    } else {
      router.push('/assessment')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={styles.spinner} />
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 16 }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const hasSubscription = !!subscription
  const isAnnual = subscription?.plan_type === 'annual'
  const isOnetime = subscription?.plan_type === 'onetime'
  const onetimeUsed = isOnetime && (subscription?.assessments_used ?? 0) >= (subscription?.assessments_limit ?? 1)
  const canStartNew = hasSubscription && !onetimeUsed

  const expiryDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null
  const isExpiringSoon = expiryDate
    ? (expiryDate.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000 && expiryDate > new Date()
    : false

  const latestAssessment = assessments[0] || null

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>
      {/* Nav */}
      <nav style={styles.nav}>
        <a href="/" style={styles.logoWrap}>
          <div style={styles.logoMark}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <span style={styles.logoText}>Builder Maturity</span>
            <span style={styles.logoSub}>by The Mainspring Group</span>
          </div>
        </a>
        <div style={styles.navRight}>
          <a href="/account" style={styles.navLink}>Account</a>
          <button onClick={handleSignOut} disabled={signingOut} style={styles.btnSignOut}>
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Payment success banner */}
        {showPaymentBanner && (
          <div style={styles.successBanner}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Payment successful! Your subscription is now active. You are all set to start your assessment.</span>
            <button onClick={() => setShowPaymentBanner(false)} style={styles.bannerClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Expiring soon banner */}
        {isExpiringSoon && (
          <div style={styles.warningBanner}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Your annual subscription expires on {expiryDate ? formatDate(expiryDate.toISOString()) : ''}. <a href="/account" style={{ color: '#92400e', fontWeight: 600 }}>Renew now</a></span>
          </div>
        )}

        {/* Header row */}
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.pageTitle}>
              {user?.full_name ? `Welcome back, ${user.full_name.split(' ')[0]}.` : 'Your Dashboard'}
            </h1>
            {user?.company_name && (
              <p style={styles.companyLabel}>{user.company_name}</p>
            )}
          </div>
          <button
            onClick={handleStartAssessment}
            style={canStartNew ? styles.btnPrimary : styles.btnPrimaryDisabled}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <circle cx="12" cy="12" r="10" /><polyline points="12 8 16 12 12 16" /><line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            {!hasSubscription ? 'Get Access' : onetimeUsed ? 'Assessment Used' : 'Start New Assessment'}
          </button>
        </div>

        {/* Subscription status card */}
        <div style={styles.subCard}>
          <div style={styles.subCardLeft}>
            <div style={styles.subIconWrap}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={hasSubscription ? '#1d4ed8' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {hasSubscription
                  ? <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>
                  : <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>
                }
              </svg>
            </div>
            <div>
              <div style={styles.subLabel}>
                {!hasSubscription && 'No active plan'}
                {isAnnual && 'Annual Subscription'}
                {isOnetime && 'Single Assessment'}
              </div>
              <div style={styles.subDetail}>
                {!hasSubscription && 'Purchase a plan to start your maturity assessment'}
                {isAnnual && expiryDate && `Renews ${formatDate(expiryDate.toISOString())}`}
                {isAnnual && !expiryDate && 'Active - unlimited assessments'}
                {isOnetime && !onetimeUsed && 'Assessment available'}
                {isOnetime && onetimeUsed && 'Assessment has been used'}
              </div>
            </div>
          </div>
          {!hasSubscription && (
            <a href="/pricing" style={styles.btnOutlineSmall}>View Plans</a>
          )}
          {hasSubscription && (
            <span style={{
              ...styles.statusBadge,
              background: (onetimeUsed) ? '#fee2e2' : '#dcfce7',
              color: (onetimeUsed) ? '#991b1b' : '#15803d',
            }}>
              {onetimeUsed ? 'Used' : 'Active'}
            </span>
          )}
        </div>

        {/* No subscription CTA */}
        {!hasSubscription && (
          <div style={styles.ctaCard}>
            <div style={styles.ctaLeft}>
              <div style={styles.ctaEyebrow}>Get Started</div>
              <h2 style={styles.ctaTitle}>Measure where your business stands today</h2>
              <p style={styles.ctaBody}>
                The Homebuilding Maturity Assessment covers 53 items across 6 operational domains.
                Get your score, maturity level, and AI-powered roadmap in under 30 minutes.
              </p>
              <div style={styles.ctaActions}>
                <a href="/pricing" style={styles.btnAccent}>See Pricing</a>
                <span style={styles.ctaNote}>From $149 one-time &middot; No commitment required</span>
              </div>
            </div>
            <div style={styles.ctaRight}>
              {[
                { label: '53', desc: 'Scored questions' },
                { label: '6', desc: 'Operational domains' },
                { label: '5', desc: 'Maturity levels' },
              ].map(stat => (
                <div key={stat.label} style={styles.ctaStat}>
                  <div style={styles.ctaStatN}>{stat.label}</div>
                  <div style={styles.ctaStatL}>{stat.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Latest result snapshot (if assessments exist) */}
        {latestAssessment && (
          <>
            <h2 style={styles.sectionTitle}>Latest Assessment</h2>
            <div style={styles.latestCard} onClick={() => router.push(`/results/${latestAssessment.id}`)}>
              <div style={styles.latestLeft}>
                <div style={styles.latestMeta}>
                  {latestAssessment.company_name} &middot; {formatDate(latestAssessment.completed_at || latestAssessment.created_at)}
                </div>
                <div style={styles.latestLevelRow}>
                  {latestAssessment.maturity_level && (
                    <span style={{
                      ...styles.levelBadge,
                      ...getLevelBadgeStyle(latestAssessment.maturity_level_key),
                    }}>
                      {latestAssessment.maturity_level}
                    </span>
                  )}
                  <span style={styles.latestScore}>
                    {latestAssessment.overall_score}% overall
                  </span>
                </div>

                {/* Domain bars */}
                <div style={styles.domainGrid}>
                  {domainOrder.map(key => {
                    const d = latestAssessment.domain_scores?.[key]
                    if (!d) return null
                    return (
                      <div key={key} style={styles.domainRow}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d={domainIcons[key]} />
                        </svg>
                        <span style={styles.domainName}>{domainNames[key]}</span>
                        <div style={styles.domainBarWrap}>
                          <div style={{
                            ...styles.domainBar,
                            width: `${d.pct}%`,
                            background: getScoreColor(d.pct),
                          }} />
                        </div>
                        <span style={{ ...styles.domainPct, color: getScoreColor(d.pct) }}>
                          {d.pct}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Score circle */}
              <div style={styles.latestRight}>
                <div style={{
                  ...styles.scoreCircle,
                  borderColor: getScoreColor(latestAssessment.overall_score) + '40',
                }}>
                  <span style={{ ...styles.scoreNum, color: getScoreColor(latestAssessment.overall_score) }}>
                    {latestAssessment.overall_score}
                  </span>
                  <span style={styles.scoreSub}>out of 100</span>
                </div>
                <a
                  href={`/results/${latestAssessment.id}`}
                  style={styles.viewResultsBtn}
                  onClick={e => e.stopPropagation()}
                >
                  View Full Report
                </a>
              </div>
            </div>
          </>
        )}

        {/* Assessment history */}
        {assessments.length > 1 && (
          <>
            <h2 style={styles.sectionTitle}>Assessment History</h2>
            <div style={styles.historyTable}>
              <div style={styles.historyHeader}>
                <span style={{ flex: 2 }}>Date</span>
                <span style={{ flex: 2 }}>Company</span>
                <span style={{ flex: 1, textAlign: 'center' }}>Score</span>
                <span style={{ flex: 2 }}>Maturity Level</span>
                <span style={{ flex: 1 }}></span>
              </div>
              {assessments.slice(1).map(a => (
                <div key={a.id} style={styles.historyRow}>
                  <span style={{ flex: 2, color: '#6b7280', fontSize: 13 }}>
                    {formatDate(a.completed_at || a.created_at)}
                  </span>
                  <span style={{ flex: 2, fontSize: 13, fontWeight: 500, color: '#111827' }}>
                    {a.company_name}
                  </span>
                  <span style={{ flex: 1, textAlign: 'center' }}>
                    <span style={{ ...styles.scorePill, color: getScoreColor(a.overall_score), background: getScoreColor(a.overall_score) + '18' }}>
                      {a.overall_score}%
                    </span>
                  </span>
                  <span style={{ flex: 2 }}>
                    {a.maturity_level && (
                      <span style={{ ...styles.levelBadgeSmall, ...getLevelBadgeStyle(a.maturity_level_key) }}>
                        {a.maturity_level}
                      </span>
                    )}
                  </span>
                  <span style={{ flex: 1, textAlign: 'right' }}>
                    <a href={`/results/${a.id}`} style={styles.viewLink}>View</a>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state when no assessments and has subscription */}
        {assessments.length === 0 && hasSubscription && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" ry="1" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <h3 style={styles.emptyTitle}>No assessments yet</h3>
            <p style={styles.emptyBody}>
              Take your first Operational Maturity Assessment to see where your business stands
              across 6 key domains.
            </p>
            <button onClick={() => router.push('/assessment')} style={styles.btnPrimary}>
              Start Assessment
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

// ---- Styles ----
const styles: Record<string, React.CSSProperties> = {
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #1d4ed8',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  },
  nav: {
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '0 24px',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
  },
  logoMark: {
    width: 34,
    height: 34,
    background: '#0f1f3d',
    borderRadius: 7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f1f3d',
    display: 'block',
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: 10,
    color: '#9ca3af',
    display: 'block',
    lineHeight: 1,
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  navLink: {
    fontSize: 13,
    color: '#374151',
    textDecoration: 'none',
    fontWeight: 500,
  },
  btnSignOut: {
    fontSize: 13,
    fontWeight: 500,
    padding: '7px 16px',
    borderRadius: 7,
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
  },
  successBanner: {
    background: '#dcfce7',
    border: '1px solid #86efac',
    borderRadius: 10,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    fontSize: 14,
    color: '#15803d',
    fontWeight: 500,
  },
  bannerClose: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#15803d',
    display: 'flex',
    alignItems: 'center',
  },
  warningBanner: {
    background: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: 10,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    fontSize: 14,
    color: '#92400e',
    fontWeight: 500,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
    flexWrap: 'wrap',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: '#0f1f3d',
    lineHeight: 1.2,
    margin: 0,
    fontFamily: "'DM Serif Display', serif",
  },
  companyLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#0f1f3d',
    color: '#ffffff',
    border: 'none',
    borderRadius: 9,
    padding: '11px 22px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
  },
  btnPrimaryDisabled: {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#9ca3af',
    color: '#ffffff',
    border: 'none',
    borderRadius: 9,
    padding: '11px 22px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'not-allowed',
    whiteSpace: 'nowrap',
  },
  subCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 12,
  },
  subCardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  subIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
  },
  subDetail: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  btnOutlineSmall: {
    fontSize: 13,
    fontWeight: 500,
    padding: '7px 16px',
    borderRadius: 7,
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '4px 10px',
    borderRadius: 20,
  },
  ctaCard: {
    background: '#0f1f3d',
    borderRadius: 16,
    padding: '40px',
    display: 'flex',
    alignItems: 'center',
    gap: 40,
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  ctaLeft: {
    flex: 1,
    minWidth: 280,
  },
  ctaEyebrow: {
    display: 'inline-block',
    background: 'rgba(245,158,11,.15)',
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '4px 12px',
    borderRadius: 20,
    marginBottom: 14,
    border: '1px solid rgba(245,158,11,.3)',
  },
  ctaTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 24,
    color: '#ffffff',
    lineHeight: 1.2,
    marginBottom: 12,
  },
  ctaBody: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 1.7,
    marginBottom: 24,
  },
  ctaActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  btnAccent: {
    background: '#f59e0b',
    color: '#0f1f3d',
    border: 'none',
    borderRadius: 9,
    padding: '11px 24px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  ctaNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
  },
  ctaRight: {
    display: 'flex',
    gap: 32,
    flexWrap: 'wrap',
  },
  ctaStat: {
    textAlign: 'center',
  },
  ctaStatN: {
    fontSize: 32,
    fontWeight: 700,
    color: '#ffffff',
    fontFamily: "'DM Serif Display', serif",
  },
  ctaStatL: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 12,
  },
  latestCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: '28px',
    display: 'flex',
    gap: 32,
    cursor: 'pointer',
    marginBottom: 28,
    transition: 'border-color 0.15s',
  },
  latestLeft: {
    flex: 1,
  },
  latestMeta: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  latestLevelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  levelBadge: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '4px 10px',
    borderRadius: 20,
  },
  latestScore: {
    fontSize: 14,
    color: '#6b7280',
  },
  domainGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  domainRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  domainName: {
    fontSize: 12,
    color: '#374151',
    width: 140,
    flexShrink: 0,
    fontWeight: 500,
  },
  domainBarWrap: {
    flex: 1,
    height: 6,
    background: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  domainBar: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.5s ease',
  },
  domainPct: {
    fontSize: 11,
    fontWeight: 700,
    width: 36,
    textAlign: 'right',
    flexShrink: 0,
  },
  latestRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    minWidth: 140,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    border: '5px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9fafb',
  },
  scoreNum: {
    fontSize: 36,
    fontWeight: 700,
    fontFamily: "'DM Serif Display', serif",
    lineHeight: 1,
  },
  scoreSub: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  viewResultsBtn: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1d4ed8',
    textDecoration: 'none',
    padding: '8px 16px',
    border: '1px solid #dbeafe',
    borderRadius: 8,
    background: '#eff6ff',
    whiteSpace: 'nowrap',
  },
  historyTable: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 28,
  },
  historyHeader: {
    display: 'flex',
    padding: '10px 20px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#6b7280',
    gap: 8,
  },
  historyRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: '1px solid #f3f4f6',
    gap: 8,
  },
  scorePill: {
    fontSize: 12,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 20,
    display: 'inline-block',
  },
  levelBadgeSmall: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '3px 8px',
    borderRadius: 20,
  },
  viewLink: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1d4ed8',
    textDecoration: 'none',
  },
  emptyState: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: '48px 32px',
    textAlign: 'center',
    marginTop: 24,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    background: '#f3f4f6',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: '#6b7280',
    maxWidth: 420,
    margin: '0 auto 24px',
    lineHeight: 1.6,
  },
}
