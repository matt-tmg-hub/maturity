'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<'annual' | 'onetime' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)

  async function handleCheckout(planType: 'annual' | 'onetime') {
    setError(null)
    setLoadingPlan(planType)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType, promoCode: promoCode.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) { router.push('/login?redirect=/pricing'); return }
        throw new Error(data.error || 'Failed to create checkout session')
      }
      if (data.url) window.location.href = data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoadingPlan(null)
    }
  }

  const features: Record<'annual' | 'onetime', string[]> = {
    annual: ['Unlimited assessments', 'Edit & re-run assessments any time', 'Full PDF export with AI recommendations', 'Dashboard with historical tracking', 'Priority support'],
    onetime: ['1 full 53-question assessment', 'AI-powered recommendations report', 'PDF export', 'No subscription needed'],
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter',sans-serif" }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="https://rkfkccefwlarscfjmncz.supabase.co/storage/v1/object/public/assets/Wht%20M%20Solid%20Blue%20Sq%20Clear%20Background.png" alt="Mainspring M" style={{ width: 36, height: 36, borderRadius: 8, display: 'block' }} />
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f1f3d', display: 'block', lineHeight: 1.2 }}>Builder Maturity</span>
            <span style={{ fontSize: 10, color: '#9ca3af', display: 'block', lineHeight: 1 }}>by The Mainspring Group</span>
          </div>
        </a>
        <button onClick={() => router.push('/dashboard')} style={{ fontSize: 13, fontWeight: 500, padding: '7px 16px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Dashboard</button>
      </nav>

      <div style={{ textAlign: 'center', padding: '56px 24px 40px' }}>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 38, color: '#0f1f3d', margin: '0 0 14px', lineHeight: 1.15 }}>Simple, transparent pricing</h1>
        <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>Get the operational clarity your building company needs — choose the plan that fits how you work.</p>
      </div>

      {error && (
        <div style={{ maxWidth: 480, margin: '0 auto 24px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 20px', color: '#b91c1c', fontSize: 14, textAlign: 'center' }}>{error}</div>
      )}

      <div style={{ maxWidth: 360, margin: '0 auto 32px', padding: '0 24px' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Have a promo code?</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={promoCode}
              onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoApplied(false); }}
              placeholder="e.g. EPC2026"
              style={{ flex: 1, padding: '9px 12px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 7, outline: 'none', fontFamily: "'Inter',sans-serif", letterSpacing: '0.05em', fontWeight: 600, color: '#0f1f3d' }}
            />
            {promoCode && (
              <button onClick={() => setPromoApplied(true)} style={{ padding: '9px 16px', background: '#0f1f3d', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif", whiteSpace: 'nowrap' }}>
                Apply
              </button>
            )}
          </div>
          {promoApplied && promoCode && (
            <p style={{ fontSize: 12, color: '#16a34a', marginTop: 8, fontWeight: 600 }}>&#10003; Code <strong>{promoCode}</strong> will be applied at checkout</p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', padding: '0 24px 80px', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ background: '#fff', border: '2px solid #0f1f3d', borderRadius: 14, padding: '36px 28px', width: 340, display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 8px 32px rgba(15,31,61,0.10)' }}>
          <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: '#fff', fontWeight: 700, fontSize: 11, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>BEST VALUE</div>
          <div style={{ fontSize: 44, fontWeight: 800, color: '#0f1f3d', lineHeight: 1, fontFamily: "'DM Serif Display',serif" }}>$249</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>per year</div>
          <div style={{ fontSize: 13, color: '#6b7280', margin: '14px 0 20px', lineHeight: 1.5 }}>Unlimited assessments for your whole team. Full editing and PDF exports included.</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10, flexGrow: 1 }}>
            {features.annual.map((f, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#374151', lineHeight: 1.4 }}>
                <span style={{ width: 17, height: 17, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, marginTop: 1 }}>&#10003;</span>
                {f}
              </li>
            ))}
          </ul>
          <button disabled={!!loadingPlan} onClick={() => handleCheckout('annual')} style={{ background: '#0f1f3d', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 15, padding: '13px 0', cursor: loadingPlan ? 'not-allowed' : 'pointer', width: '100%', fontFamily: "'Inter',sans-serif", opacity: loadingPlan ? 0.7 : 1 }}>
            {loadingPlan === 'annual' ? 'Redirecting…' : 'Get Annual Access'}
          </button>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '36px 28px', width: 340, display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: '#0f1f3d', lineHeight: 1, fontFamily: "'DM Serif Display',serif" }}>$149</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>one-time payment</div>
          <div style={{ fontSize: 13, color: '#6b7280', margin: '14px 0 20px', lineHeight: 1.5 }}>Run a single assessment right now. No subscription required.</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10, flexGrow: 1 }}>
            {features.onetime.map((f, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#374151', lineHeight: 1.4 }}>
                <span style={{ width: 17, height: 17, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, marginTop: 1 }}>&#10003;</span>
                {f}
              </li>
            ))}
          </ul>
          <button disabled={!!loadingPlan} onClick={() => handleCheckout('onetime')} style={{ background: '#fff', color: '#0f1f3d', border: '2px solid #0f1f3d', borderRadius: 9, fontWeight: 700, fontSize: 15, padding: '13px 0', cursor: loadingPlan ? 'not-allowed' : 'pointer', width: '100%', fontFamily: "'Inter',sans-serif", opacity: loadingPlan ? 0.7 : 1 }}>
            {loadingPlan === 'onetime' ? 'Redirecting…' : 'Buy Single Assessment'}
          </button>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', paddingBottom: 48 }}>Payments secured by Stripe. Cancel annual plan any time.</p>
    </div>
  )
}