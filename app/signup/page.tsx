'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  async function handleSignup() {
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          :root{--navy:#0f1f3d;--accent:#f59e0b;--white:#ffffff;--gray-50:#f9fafb;--gray-200:#e5e7eb;--gray-400:#9ca3af;--gray-600:#4b5563;--blue:#1d4ed8;--green:#16a34a;--green-light:#dcfce7;--font:'Inter',sans-serif;--serif:'DM Serif Display',serif;}
          body{font-family:var(--font);background:var(--gray-50);min-height:100vh;}
          .auth-nav{background:var(--white);border-bottom:1px solid var(--gray-200);padding:0 2rem;height:60px;display:flex;align-items:center;}
          .logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
          .logo-mark{width:34px;height:34px;background:var(--navy);border-radius:7px;display:flex;align-items:center;justify-content:center;}
          .logo-text{font-size:15px;font-weight:700;color:var(--navy);}
          .logo-sub{font-size:11px;color:var(--gray-400);font-weight:400;display:block;line-height:1;}
          .auth-wrap{min-height:calc(100vh - 60px);display:flex;align-items:center;justify-content:center;padding:40px 1rem;}
          .auth-card{background:var(--white);border:1px solid var(--gray-200);border-radius:16px;padding:48px 40px;width:100%;max-width:440px;box-shadow:0 4px 24px rgba(0,0,0,0.06);text-align:center;}
          .check-circle{width:64px;height:64px;background:var(--green-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;}
          .auth-title{font-family:var(--serif);font-size:26px;color:var(--navy);margin-bottom:10px;}
          .auth-sub{font-size:14px;color:var(--gray-600);line-height:1.7;margin-bottom:28px;}
          .btn-navy{display:inline-block;padding:12px 28px;background:var(--navy);color:var(--white);font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;}
        `}</style>
        <nav className="auth-nav">
          <a href="/" className="logo">
            <div className="logo-mark">
              <img src="https://rkfkccefwlarscfjmncz.supabase.co/storage/v1/object/public/assets/Wht_M_Solid_Blue_Sq_Clear_Background.png" alt="Mainspring M" style={{width:36,height:36,borderRadius:8,display:'block'}} />
            </div>
            <div>
              <div className="logo-text">Builder Maturity</div>
              <span className="logo-sub">The Mainspring Group</span>
            </div>
          </a>
        </nav>
        <div className="auth-wrap">
          <div className="auth-card">
            <div className="check-circle">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M6 14L11 19L22 8" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-sub">
              We sent a confirmation link to <strong>{email}</strong>.<br/>
              Click it to activate your account, then sign in.
            </p>
            <a href="/login" className="btn-navy">Go to Sign In</a>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --navy:#0f1f3d;--blue:#1d4ed8;--accent:#f59e0b;
          --white:#ffffff;--gray-50:#f9fafb;--gray-100:#f3f4f6;--gray-200:#e5e7eb;
          --gray-400:#9ca3af;--gray-600:#4b5563;--gray-700:#374151;--gray-900:#111827;
          --red:#dc2626;--red-light:#fee2e2;
          --font:'Inter',sans-serif;--serif:'DM Serif Display',serif;
        }
        body{font-family:var(--font);background:var(--gray-50);min-height:100vh;}
        .auth-nav{background:var(--white);border-bottom:1px solid var(--gray-200);padding:0 2rem;height:60px;display:flex;align-items:center;justify-content:space-between;}
        .logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
        .logo-mark{width:34px;height:34px;background:var(--navy);border-radius:7px;display:flex;align-items:center;justify-content:center;}
        .logo-text{font-size:15px;font-weight:700;color:var(--navy);}
        .logo-sub{font-size:11px;color:var(--gray-400);font-weight:400;display:block;line-height:1;}
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
        .terms{font-size:11px;color:var(--gray-400);text-align:center;margin-top:16px;line-height:1.6;}
        .terms a{color:var(--gray-600);}
        .divider{display:flex;align-items:center;gap:12px;margin:20px 0;}
        .divider-line{flex:1;height:1px;background:var(--gray-200);}
        .divider-text{font-size:12px;color:var(--gray-400);}
        .auth-switch{text-align:center;font-size:14px;color:var(--gray-600);}
        .auth-switch a{color:var(--blue);font-weight:600;text-decoration:none;}
      `}</style>

      <nav className="auth-nav">
        <a href="/" className="logo">
          <div className="logo-mark">
              <img src="https://rkfkccefwlarscfjmncz.supabase.co/storage/v1/object/public/assets/Wht_M_Solid_Blue_Sq_Clear_Background.png" alt="Mainspring M" style={{width:36,height:36,borderRadius:8,display:'block'}} />
            </div>
          <div>
            <div className="logo-text">Builder Maturity</div>
            <span className="logo-sub">The Mainspring Group</span>
          </div>
        </a>
        <a href="/login" style={{fontSize:'13px',fontWeight:500,padding:'7px 16px',borderRadius:'7px',border:'1px solid var(--gray-200)',background:'var(--white)',color:'var(--gray-700)',textDecoration:'none'}}>
          Sign In
        </a>
      </nav>

      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-eyebrow">Get Started</div>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Start your Builder Maturity assessment in minutes.</p>

          {error && <div className="error-box">{error}</div>}

          <div className="field">
            <label>Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="John Smith"
            />
          </div>

          <div className="field">
            <label>Work email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignup()}
              placeholder="At least 8 characters"
            />
          </div>

          <button
            className="btn-navy"
            onClick={handleSignup}
            disabled={loading || !email || !password || !fullName}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="terms">
            By creating an account you agree to our{' '}
            <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
          </p>

          <div className="divider">
            <div className="divider-line"/>
            <span className="divider-text">already have an account?</span>
            <div className="divider-line"/>
          </div>

          <p className="auth-switch">
            <a href="/login">Sign in instead</a>
          </p>
        </div>
      </div>
    </>
  )
}
