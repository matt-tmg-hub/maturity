'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup() {
    if (!agreed) { setError('You must accept the Terms of Use and Privacy Policy to continue.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/pricing')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--navy:#0f1f3d;--blue:#1d4ed8;--accent:#f59e0b;--white:#ffffff;--gray-50:#f9fafb;--gray-200:#e5e7eb;--gray-400:#9ca3af;--gray-600:#4b5563;--gray-700:#374151;--gray-900:#111827;--red:#dc2626;--red-light:#fee2e2;--font:'Inter',sans-serif;--serif:'DM Serif Display',serif;}
        body{font-family:var(--font);background:var(--gray-50);min-height:100vh;}
        .auth-wrap{min-height:calc(100vh - 60px);display:flex;align-items:center;justify-content:center;padding:40px 1rem;}
        .auth-card{background:var(--white);border:1px solid var(--gray-200);border-radius:16px;padding:48px 40px;width:100%;max-width:440px;box-shadow:0 4px 24px rgba(0,0,0,0.06);}
        .auth-eyebrow{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:8px;}
        .auth-title{font-family:var(--serif);font-size:28px;color:var(--navy);margin-bottom:6px;}
        .auth-sub{font-size:14px;color:var(--gray-600);margin-bottom:32px;}
        .error-box{background:var(--red-light);border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-bottom:20px;color:var(--red);font-size:13px;}
        .field{margin-bottom:18px;}
        .field label{display:block;font-size:13px;font-weight:600;color:var(--gray-700);margin-bottom:6px;}
        .field input{width:100%;padding:10px 14px;border:1px solid var(--gray-200);border-radius:8px;font-family:var(--font);font-size:14px;color:var(--gray-900);background:var(--white);outline:none;transition:border-color .15s;}
        .field input:focus{border-color:var(--blue);}
        .btn-navy{width:100%;padding:13px;background:var(--navy);color:var(--white);font-size:15px;font-weight:600;border:none;border-radius:10px;cursor:pointer;margin-top:4px;font-family:var(--font);transition:opacity .15s;}
        .btn-navy:disabled{opacity:.5;cursor:not-allowed;}
        .divider{display:flex;align-items:center;gap:12px;margin:20px 0;}
        .divider-line{flex:1;height:1px;background:var(--gray-200);}
        .divider-text{font-size:12px;color:var(--gray-400);}
        .auth-switch{text-align:center;font-size:14px;color:var(--gray-600);}
        .auth-switch a{color:var(--blue);font-weight:600;text-decoration:none;}
        .checkbox-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:20px;}
        .checkbox-row input[type=checkbox]{width:16px;height:16px;margin-top:2px;flex-shrink:0;cursor:pointer;accent-color:var(--navy);}
        .checkbox-row label{font-size:13px;color:var(--gray-600);line-height:1.5;cursor:pointer;}
        .checkbox-row a{color:var(--blue);font-weight:600;text-decoration:none;}
      `}</style>

      <nav style={{background:'#fff',borderBottom:'1px solid #e5e7eb',padding:'0 2rem',height:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <a href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <img src="https://rkfkccefwlarscfjmncz.supabase.co/storage/v1/object/public/assets/Wht%20M%20Solid%20Blue%20Sq%20Clear%20Background.png" alt="Mainspring M" style={{width:36,height:36,borderRadius:8,display:'block'}} />
          <div>
            <div style={{fontSize:15,fontWeight:700,color:'#0f1f3d'}}>Builder Maturity</div>
            <span style={{fontSize:11,color:'#9ca3af',display:'block',lineHeight:1}}>The Mainspring Group</span>
          </div>
        </a>
        <a href="/login" style={{fontSize:'13px',fontWeight:500,padding:'7px 16px',borderRadius:'7px',border:'1px solid #e5e7eb',background:'#fff',color:'#374151',textDecoration:'none'}}>Sign In</a>
      </nav>

      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-eyebrow">Get Started</div>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Start your Builder Maturity assessment in minutes.</p>
          {error && <div className="error-box">{error}</div>}
          <div className="field"><label>Full name</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Smith" /></div>
          <div className="field"><label>Work email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" /></div>
          <div className="field"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignup()} placeholder="At least 8 characters" /></div>
          <div className="checkbox-row">
            <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            <label htmlFor="agree">
              I have read and agree to the <a href="/terms" target="_blank">Terms of Use</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.
            </label>
          </div>
          <button className="btn-navy" onClick={handleSignup} disabled={loading || !email || !password || !fullName || !agreed}>
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
          <div className="divider"><div className="divider-line"/><span className="divider-text">already have an account?</span><div className="divider-line"/></div>
          <p className="auth-switch"><a href="/login">Sign in instead</a></p>
        </div>
      </div>
    </>
  )
}