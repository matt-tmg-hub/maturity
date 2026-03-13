'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Plan {
  id: 'onetime' | 'annual'
  name: string
  price: string
  period: string
  badge?: string
  tagline: string
  features: string[]
  cta: string
  highlight: boolean
}

const plans: Plan[] = [
  {
    id: 'onetime',
    name: 'Single Assessment',
    price: '$149',
    period: 'one time',
    tagline: 'Get a complete picture of where you stand today.',
    features: [
      'Full 53-question assessment',
      'Overall maturity score + domain breakdown',
      'AI-powered improvement roadmap',
      'PDF report download',
      'Access to your results for 12 months',
    ],
    cta: 'Buy Single Assessment',
    highlight: false,
  },
  {
    id: 'annual',
    name: 'Annual Subscription',
    price: '$249',
    period: 'per year',
    badge: 'Best Value',
    tagline: 'Track improvement over time. Reassess as often as you need.',
    features: [
      'Unlimited assessments all year',
      'Full assessment history saved',
      'Side-by-side progress comparison',
      'PDF export of any historical report',
      'Edit and re-submit most recent assessment',
      'Priority support',
    ],
    cta: 'Start Annual Subscription',
    highlight: true,
  },
]

const maturityLevels = [
  { key: '-1', name: 'Anchor', sentiment: 'Shoot from the hip', color: '#dc2626', bg: '#fee2e2' },
  { key: '0', name: 'Typical', sentiment: 'Re-Active', color: '#f59e0b', bg: '#fef3c7' },
  { key: '1', name: 'Strategic Implementer', sentiment: 'Pro-Active', color: '#3b82f6', bg: '#dbeafe' },
  { key: '2', name: 'Adaptive Innovator', sentiment: 'Management by Exception', color: '#8b5cf6', bg: '#ede9fe' },
  { key: '3', name: 'Guiding Star', sentiment: 'Digitally Optimized', color: '#16a34a', bg: '#dcfce7' },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSelectPlan(planId: 'onetime' | 'annual') {
    setError(null)
    setLoading(planId)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Not logged in - redirect to signup with return URL
      router.push(`/signup?returnTo=/pricing&plan=${planId}`)
      return
    }

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType: planId }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Failed to create checkout session')
      }

      const { url } = await res.json()
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(null)
    }
  }

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
          <a href="/login" style={styles.navLink}>Sign in</a>
          <a href="/signup" style={styles.btnNavPrimary}>Get started</a>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '56px 24px 80px' }}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.eyebrow}>Pricing</div>
          <h1 style={styles.title}>
            Know exactly where your operations stand.
          </h1>
          <p style={styles.subtitle}>
            Built for residential homebuilder CEOs who want real answers, not vague consulting.
            A full operational maturity assessment for a fraction of what a consultant charges.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={styles.errorBanner}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Plans */}
        <div style={styles.plansGrid}>
          {plans.map(plan => (
            <div
              key={plan.id}
              style={{
                ...styles.planCard,
                ...(plan.highlight ? styles.planCardHighlight : {}),
              }}
            >
              {plan.badge && (
                <div style={styles.planBadge}>{plan.badge}</div>
              )}

              <div style={styles.planHeader}>
                <div style={{ ...styles.planName, ...(plan.highlight ? { color: 'rgba(255,255,255,0.5)' } : {}) }}>{plan.name}</div>
                <div style={styles.planPriceRow}>
                  <span style={{ ...styles.planPrice, ...(plan.highlight ? { color: '#ffffff' } : {}) }}>{plan.price}</span>
                  <span style={styles.planPeriod}>{plan.period}</span>
                </div>
                <p style={{ ...styles.planTagline, ...(plan.highlight ? { color: 'rgba(255,255,255,0.6)' } : {}) }}>{plan.tagline}</p>
              </div>

              <ul style={styles.featureList}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ ...styles.featureItem, ...(plan.highlight ? { color: 'rgba(255,255,255,0.85)' } : {}) }}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={plan.highlight ? '#f59e0b' : '#1d4ed8'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0, marginTop: 1 }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading !== null}
                style={{
                  ...styles.planCta,
                  ...(plan.highlight ? styles.planCtaHighlight : styles.planCtaOutline),
                  ...(loading !== null ? styles.planCtaDisabled : {}),
                }}
              >
                {loading === plan.id ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={styles.spinnerSmall} />
                    Redirecting...
                  </span>
                ) : plan.cta}
              </button>

              {plan.id === 'annual' && (
                <p style={styles.planNote}>
                  Cancel anytime. No setup fees.
                </p>
              )}
              {plan.id === 'onetime' && (
                <p style={styles.planNote}>
                  One-time payment. Lifetime access to that report.
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Value prop comparison */}
        <div style={styles.compareSection}>
          <div style={styles.compareLine}>
            <span style={styles.compareLabel}>Traditional consultant</span>
            <span style={styles.compareOld}>$15,000 - $50,000</span>
          </div>
          <div style={styles.compareDivider} />
          <div style={styles.compareLine}>
            <span style={styles.compareLabel}>Builder Maturity annual</span>
            <span style={styles.compareNew}>$249/year</span>
          </div>
        </div>

        {/* Maturity level explainer */}
        <div style={styles.modelSection}>
          <h2 style={styles.modelTitle}>The Maturity Model</h2>
          <p style={styles.modelSubtitle}>
            Your assessment maps your operations to one of five maturity levels across 6 domains.
            Every builder has a starting point. Knowing yours is the first step.
          </p>
          <div style={styles.levelsRow}>
            {maturityLevels.map((level, i) => (
              <div key={level.key} style={styles.levelCard}>
                <div style={{ ...styles.levelNum, background: level.bg, color: level.color }}>
                  Level {level.key}
                </div>
                <div style={styles.levelName}>{level.name}</div>
                <div style={styles.levelSentiment}>{level.sentiment}</div>
                {i < maturityLevels.length - 1 && (
                  <div style={styles.levelArrow}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Domains */}
        <div style={styles.domainsSection}>
          <h2 style={styles.modelTitle}>6 Operational Domains Assessed</h2>
          <div style={styles.domainsGrid}>
            {[
              { key: 'org', name: 'Org Structure', desc: '9 items', path: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
              { key: 'customer', name: 'Customer Experience', desc: '11 items', path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
              { key: 'trade', name: 'Trade Partner / Supplier', desc: '12 items', path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0' },
              { key: 'internal', name: 'Internal Operations', desc: '4 items', path: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
              { key: 'builder_rep', name: 'Builder Rep Experience', desc: '8 items', path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { key: 'systems', name: 'Supporting Systems', desc: '9 items', path: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18' },
            ].map(domain => (
              <div key={domain.key} style={styles.domainCard}>
                <div style={styles.domainIconWrap}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={domain.path} />
                  </svg>
                </div>
                <div style={styles.domainCardName}>{domain.name}</div>
                <div style={styles.domainCardDesc}>{domain.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={styles.faqSection}>
          <h2 style={styles.modelTitle}>Common Questions</h2>
          <div style={styles.faqList}>
            {[
              {
                q: 'How long does the assessment take?',
                a: 'Most builders complete it in 20-30 minutes. You can save progress and return if needed.'
              },
              {
                q: 'Who should take this assessment?',
                a: 'The CEO or owner of the building company. This assessment requires visibility across all departments - sales, construction, purchasing, and customer experience.'
              },
              {
                q: 'What do I get when I finish?',
                a: 'An overall maturity score, domain-by-domain breakdown, your maturity level (Anchor through Guiding Star), and an AI-generated roadmap with specific next steps.'
              },
              {
                q: 'Is my data secure?',
                a: 'Yes. Your data is stored in Supabase with row-level security - only you can see your assessments and results. We never share individual company data.'
              },
              {
                q: 'Can I retake the assessment?',
                a: 'Annual subscribers can retake as many times as they want. Single assessment purchases include one full submission.'
              },
            ].map((item, i) => (
              <div key={i} style={styles.faqItem}>
                <div style={styles.faqQ}>{item.q}</div>
                <div style={styles.faqA}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div style={styles.finalCta}>
          <h2 style={styles.finalCtaTitle}>Ready to find your number?</h2>
          <p style={styles.finalCtaBody}>
            Most builders are surprised by what they find. Whether you are ahead of the curve or have ground to cover,
            knowing your score is the only way to make a plan.
          </p>
          <div style={styles.finalCtaButtons}>
            <button
              onClick={() => handleSelectPlan('annual')}
              disabled={loading !== null}
              style={{ ...styles.btnAccentLg, ...(loading !== null ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
            >
              {loading === 'annual' ? 'Redirecting...' : 'Get Annual Access - $249/yr'}
            </button>
            <button
              onClick={() => handleSelectPlan('onetime')}
              disabled={loading !== null}
              style={{ ...styles.btnGhostLg, ...(loading !== null ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
            >
              {loading === 'onetime' ? 'Redirecting...' : 'Single Assessment - $149'}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          &copy; 2026 The Mainspring Group LLC &middot; <a href="/" style={styles.footerLink}>buildermaturity.com</a>
        </p>
      </footer>
    </div>
  )
}

// ---- Styles ----
const styles: Record<string, React.CSSProperties> = {
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
  btnNavPrimary: {
    fontSize: 13,
    fontWeight: 600,
    padding: '7px 16px',
    borderRadius: 7,
    border: 'none',
    background: '#0f1f3d',
    color: '#ffffff',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  header: {
    textAlign: 'center',
    marginBottom: 48,
  },
  eyebrow: {
    display: 'inline-block',
    background: 'rgba(29,78,216,.08)',
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '5px 14px',
    borderRadius: 20,
    marginBottom: 16,
    border: '1px solid rgba(29,78,216,.15)',
  },
  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 'clamp(28px, 4vw, 44px)',
    color: '#0f1f3d',
    lineHeight: 1.15,
    marginBottom: 16,
    maxWidth: 620,
    margin: '0 auto 16px',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    maxWidth: 560,
    margin: '0 auto',
    lineHeight: 1.7,
  },
  errorBanner: {
    background: '#fee2e2',
    border: '1px solid #fca5a5',
    borderRadius: 10,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    fontSize: 14,
    color: '#991b1b',
    fontWeight: 500,
  },
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 24,
    marginBottom: 40,
  },
  planCard: {
    background: '#ffffff',
    border: '1.5px solid #e5e7eb',
    borderRadius: 16,
    padding: '32px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  planCardHighlight: {
    background: '#0f1f3d',
    borderColor: '#0f1f3d',
  },
  planBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#f59e0b',
    color: '#0f1f3d',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '4px 14px',
    borderRadius: 20,
    whiteSpace: 'nowrap',
  },
  planHeader: {
    marginBottom: 24,
  },
  planName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 12,
  },
  planPriceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 10,
  },
  planPrice: {
    fontSize: 44,
    fontWeight: 800,
    color: '#0f1f3d',
    fontFamily: "'DM Serif Display', serif",
    lineHeight: 1,
  },
  planPeriod: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: 500,
  },
  planTagline: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 1.5,
    margin: 0,
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flex: 1,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontSize: 14,
    color: '#374151',
    lineHeight: 1.45,
  },
  planCta: {
    width: '100%',
    padding: '13px',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    marginBottom: 10,
  },
  planCtaHighlight: {
    background: '#f59e0b',
    color: '#0f1f3d',
  },
  planCtaOutline: {
    background: '#0f1f3d',
    color: '#ffffff',
  },
  planCtaDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  spinnerSmall: {
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
  planNote: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    margin: 0,
  },
  compareSection: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '20px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    marginBottom: 56,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  compareLine: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  compareLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  compareOld: {
    fontSize: 16,
    fontWeight: 700,
    color: '#9ca3af',
    textDecoration: 'line-through',
  },
  compareNew: {
    fontSize: 20,
    fontWeight: 800,
    color: '#16a34a',
  },
  compareDivider: {
    width: 40,
    height: 2,
    background: '#e5e7eb',
  },
  modelSection: {
    marginBottom: 56,
  },
  modelTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#0f1f3d',
    marginBottom: 8,
    fontFamily: "'DM Serif Display', serif",
  },
  modelSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 1.6,
  },
  levelsRow: {
    display: 'flex',
    gap: 0,
    overflowX: 'auto',
    paddingBottom: 8,
  },
  levelCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '16px 18px',
    minWidth: 140,
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginRight: 8,
  },
  levelNum: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '3px 8px',
    borderRadius: 20,
    width: 'fit-content',
  },
  levelName: {
    fontSize: 13,
    fontWeight: 700,
    color: '#111827',
    lineHeight: 1.3,
  },
  levelSentiment: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  levelArrow: {
    position: 'absolute',
    right: -20,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1,
  },
  domainsSection: {
    marginBottom: 56,
  },
  domainsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 14,
    marginTop: 20,
  },
  domainCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '18px 16px',
    textAlign: 'center',
  },
  domainIconWrap: {
    width: 40,
    height: 40,
    background: '#eff6ff',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 10px',
  },
  domainCardName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#111827',
    lineHeight: 1.3,
    marginBottom: 4,
  },
  domainCardDesc: {
    fontSize: 11,
    color: '#9ca3af',
  },
  faqSection: {
    marginBottom: 56,
  },
  faqList: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    background: '#ffffff',
  },
  faqItem: {
    padding: '20px 24px',
    borderBottom: '1px solid #f3f4f6',
  },
  faqQ: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 6,
  },
  faqA: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 1.6,
  },
  finalCta: {
    background: '#0f1f3d',
    borderRadius: 20,
    padding: '48px 40px',
    textAlign: 'center',
  },
  finalCtaTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 'clamp(22px, 3vw, 32px)',
    color: '#ffffff',
    marginBottom: 12,
  },
  finalCtaBody: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    maxWidth: 520,
    margin: '0 auto 32px',
    lineHeight: 1.7,
  },
  finalCtaButtons: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  btnAccentLg: {
    background: '#f59e0b',
    color: '#0f1f3d',
    border: 'none',
    borderRadius: 10,
    padding: '13px 28px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnGhostLg: {
    background: 'rgba(255,255,255,0.08)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: '13px 28px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  footer: {
    borderTop: '1px solid #e5e7eb',
    padding: '20px 24px',
    textAlign: 'center',
    background: '#ffffff',
  },
  footerText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  footerLink: {
    color: '#6b7280',
    textDecoration: 'none',
  },
}
