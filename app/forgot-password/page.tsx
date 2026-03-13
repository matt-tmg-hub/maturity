'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleReset() {
    if (!email) return
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true); setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',sans-serif;background:#f9fafb;min-height:100vh;}
      `}</style>
      <nav style={{background:'#fff',borderBottom:'1px solid #e5e7eb',padding:'0 2rem',height:60,display:'flex',alignItems:'center'}}>
        <a href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <img src="https://rkfkccefwlarscfjmncz.supabase.co/storage/v1/object/public/assets/Wht%20M%20Solid%20Blue%20Sq%20Clear%20Background.png" alt="Mainspring M" style={{width:36,height:36,borderRadius:8,display:'block'}} />
          <div>
            <div style={{fontSize:15,fontWeight:700,color:'#0f1f3d'}}>Builder Maturity</div>
            <span style={{fontSize:11,color:'#9ca3af',display:'block',lineHeight:1}}>The Mainspring Group</span>
          </div>
        </a>
      </nav>
      <div style={{minHeight:'calc(100vh - 60px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 1rem'}}>
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,padding:'48px 40px',width:'100%',maxWidth:440,boxShadow:'0 4px 24px rgba(0,0,0,0.06)'}}>
          {sent ? (
            <>
              <div style={{width:56,height:56,background:'#dcfce7',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:'#0f1f3d',marginBottom:10,textAlign:'center'}}>Check your email</h1>
              <p style={{fontSize:14,color:'#6b7280',lineHeight:1.7,textAlign:'center',marginBottom:28}}>We sent a reset link to <strong>{email}</strong>. Click it to set a new password.</p>
              <a href="/login" style={{display:'block',textAlign:'center',padding:'12px',background:'#0f1f3d',color:'#fff',borderRadius:10,fontWeight:600,fontSize:14,textDecoration:'none'}}>Back to Sign In</a>
            </>
          ) : (
            <>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'#f59e0b',marginBottom:8}}>Password Reset</div>
              <h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:28,color:'#0f1f3d',marginBottom:6}}>Forgot your password?</h1>
              <p style={{fontSize:14,color:'#6b7280',marginBottom:28}}>Enter your email and we will send you a reset link.</p>
              {error && <div style={{background:'#fee2e2',border:'1px solid #fecaca',borderRadius:8,padding:'12px 16px',marginBottom:20,color:'#dc2626',fontSize:13}}>{error}</div>}
              <div style={{marginBottom:20}}>
                <label style={{display:'block',fontSize:13,fontWeight:600,color:'#374151',marginBottom:6}}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReset()} placeholder="you@company.com"
                  style={{width:'100%',padding:'10px 14px',border:'1px solid #e5e7eb',borderRadius:8,fontSize:14,outline:'none',fontFamily:'inherit'}} />
              </div>
              <button onClick={handleReset} disabled={loading || !email}
                style={{width:'100%',padding:'13px',background:'#0f1f3d',color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:600,cursor:'pointer',opacity:loading||!email?0.5:1}}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <p style={{textAlign:'center',fontSize:14,color:'#6b7280',marginTop:20}}>
                <a href="/login" style={{color:'#1d4ed8',fontWeight:600,textDecoration:'none'}}>Back to Sign In</a>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  )
}