'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UserProfile { id: string; email: string; full_name: string | null; company_name: string | null; title: string | null }
interface Assessment { id: string; company_name: string; overall_score: number; maturity_level: string | null; maturity_level_key: string | null; domain_scores: Record<string, { pct: number; answered: number; total: number }>; completed_at: string; created_at: string }
interface Subscription { plan_type: 'annual' | 'onetime'; status: string; current_period_end: string | null; assessments_used: number; assessments_limit: number | null }

function getScoreColor(pct: number): string { if (pct < 25) return '#dc2626'; if (pct < 50) return '#f59e0b'; if (pct < 75) return '#3b82f6'; return '#16a34a' }
function getLevelBadgeStyle(key: string | null) { if (key === '3') return { bg: '#dcfce7', color: '#15803d' }; if (key === '2') return { bg: '#dbeafe', color: '#1d4ed8' }; if (key === '1') return { bg: '#fef3c7', color: '#92400e' }; if (key === '0') return { bg: '#f3f4f6', color: '#374151' }; return { bg: '#fee2e2', color: '#991b1b' } }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }

const domainIcons: Record<string,string> = { org:'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', customer:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', trade:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0', internal:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', builder_rep:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', systems:'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18' }
const domainOrder = ['org','customer','trade','internal','builder_rep','systems']
const domainNames: Record<string,string> = { org:'Org Structure', customer:'Customer Experience', trade:'Trade Partner', internal:'Internal Operations', builder_rep:'Builder Rep', systems:'Supporting Systems' }

function LoadingScreen() { return ( <div style={{minHeight:'100vh',background:'#f9fafb',display:'flex',alignItems:'center',justifyContent:'center'}}> <div style={{textAlign:'center'}}> <div style={{width:40,height:40,border:'3px solid #e5e7eb',borderTop:'3px solid #1d4ed8',borderRadius:'50%',margin:'0 auto'}} /> <p style={{color:'#6b7280',fontSize:14,marginTop:16}}>Loading...</p> </div> </div> ) }

function DashboardInner() {
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
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', authUser.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single()
      const { data: asmts } = await supabase.from('assessments').select('id, company_name, overall_score, maturity_level, maturity_level_key, domain_scores, completed_at, created_at').eq('user_id', authUser.id).eq('status', 'complete').order('created_at', { ascending: false }).limit(20)
      setUser(profile || { id: authUser.id, email: authUser.email || '', full_name: null, company_name: null, title: null })
      setSubscription(sub || null)
      setAssessments(asmts || [])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSignOut() { setSigningOut(true); const supabase = createClient(); await supabase.auth.signOut(); router.push('/') }
  function handleStartAssessment() { router.push(subscription ? '/assessment' : '/pricing') }

  if (loading) return <LoadingScreen />

  const hasSubscription = !!subscription
  const isAnnual = subscription?.plan_type === 'annual'
  const isOnetime = subscription?.plan_type === 'onetime'
  const onetimeUsed = isOnetime && (subscription?.assessments_used ?? 0) >= (subscription?.assessments_limit ?? 1)
  const canStartNew = hasSubscription && !onetimeUsed
  const expiryDate = subscription?.current_period_end ? new Date(subscription.current_period_end) : null
  const isExpiringSoon = expiryDate ? (expiryDate.getTime() - Date.now()) < 7*24*60*60*1000 && expiryDate > new Date() : false
  const latestAssessment = assessments[0] || null

  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',fontFamily:"'Inter',sans-serif"}}>
      <nav style={{background:'#fff',borderBottom:'1px solid #e5e7eb',padding:'0 24px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50}}>
        <a href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <img src="https://rkfkccefwlarscfjmncz.supabase.co/storage/v1/object/public/assets/Wht%20M%20Solid%20Blue%20Sq%20Clear%20Background.png" alt="Mainspring M" style={{width:36,height:36,borderRadius:8,display:'block'}} />
          <div><span style={{fontSize:15,fontWeight:700,color:'#0f1f3d',display:'block',lineHeight:1.2}}>Builder Maturity</span><span style={{fontSize:10,color:'#9ca3af',display:'block',lineHeight:1}}>by The Mainspring Group</span></div>
        </a>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <a href="/account" style={{fontSize:13,fontWeight:500,padding:'7px 16px',borderRadius:7,border:'1px solid #e5e7eb',background:'#fff',color:'#374151',textDecoration:'none'}}>Account</a>
          <button onClick={handleSignOut} disabled={signingOut} style={{fontSize:13,fontWeight:500,padding:'7px 16px',borderRadius:7,border:'1px solid #e5e7eb',background:'#fff',color:'#374151',cursor:'pointer'}}>{signingOut ? 'Signing out...' : 'Sign out'}</button>
        </div>
      </nav>
      <main style={{maxWidth:960,margin:'0 auto',padding:'32px 24px 80px'}}>
        {showPaymentBanner && ( <div style={{background:'#dcfce7',border:'1px solid #86efac',borderRadius:10,padding:'12px 16px',display:'flex',alignItems:'center',gap:10,marginBottom:20,fontSize:14,color:'#15803d',fontWeight:500}}> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> <span>Payment successful! Your subscription is now active.</span> <button onClick={() => setShowPaymentBanner(false)} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'#15803d',display:'flex',alignItems:'center'}}> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> </button> </div> )}
        {isExpiringSoon && ( <div style={{background:'#fef3c7',border:'1px solid #fcd34d',borderRadius:10,padding:'12px 16px',display:'flex',alignItems:'center',gap:10,marginBottom:20,fontSize:14,color:'#92400e',fontWeight:500}}> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> <span>Your subscription expires on {expiryDate ? formatDate(expiryDate.toISOString()) : ''}. <a href="/account" style={{color:'#92400e',fontWeight:600}}>Renew now</a></span> </div> )}
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24,gap:16,flexWrap:'wrap'}}>
          <div>
            <h1 style={{fontSize:26,fontWeight:700,color:'#0f1f3d',lineHeight:1.2,margin:0,fontFamily:"'DM Serif Display',serif"}}>{user?.full_name ? `Welcome back, ${user.full_name.split(' ')[0]}.` : 'Your Dashboard'}</h1>
            {user?.company_name && <p style={{fontSize:14,color:'#6b7280',marginTop:4}}>{user.company_name}</p>}
          </div>
          <button onClick={handleStartAssessment} disabled={!canStartNew && hasSubscription} style={{display:'inline-flex',alignItems:'center',background:canStartNew?'#0f1f3d':'#9ca3af',color:'#fff',border:'none',borderRadius:9,padding:'11px 22px',fontSize:14,fontWeight:600,cursor:canStartNew?'pointer':'not-allowed',whiteSpace:'nowrap'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:8}}><circle cx="12" cy="12" r="10"/><polyline points="12 8 16 12 12 16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            {!hasSubscription ? 'Get Access' : onetimeUsed ? 'Assessment Used' : 'Start New Assessment'}
          </button>
        </div>
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28,gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:40,height:40,borderRadius:10,background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={hasSubscription?'#1d4ed8':'#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {hasSubscription ? <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> : <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>}
              </svg>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:'#111827'}}>{!hasSubscription?'No active plan':isAnnual?'Annual Subscription':'Single Assessment'}</div>
              <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>{!hasSubscription?'Purchase a plan to start your assessment':isAnnual&&expiryDate?`Renews ${formatDate(expiryDate.toISOString())}`:isAnnual?'Active - unlimited assessments':!onetimeUsed?'Assessment available':'Assessment has been used'}</div>
            </div>
          </div>
          {!hasSubscription ? <a href="/pricing" style={{fontSize:13,fontWeight:500,padding:'7px 16px',borderRadius:7,border:'1px solid #e5e7eb',background:'#fff',color:'#374151',textDecoration:'none',whiteSpace:'nowrap'}}>View Plans</a> : <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:11,fontWeight:700,letterSpacing:'0.04em',textTransform:'uppercase',padding:'4px 10px',borderRadius:20,background:onetimeUsed?'#fee2e2':'#dcfce7',color:onetimeUsed?'#991b1b':'#15803d'}}>{onetimeUsed?'Used':'Active'}</span>{onetimeUsed && <a href="/pricing" style={{fontSize:13,fontWeight:600,padding:'6px 14px',borderRadius:7,background:'#0f1f3d',color:'#fff',textDecoration:'none',whiteSpace:'nowrap'}}>Buy Another</a>}</div>}
        </div>
        {!hasSubscription && ( <div style={{background:'#0f1f3d',borderRadius:16,padding:'40px',display:'flex',alignItems:'center',gap:40,marginBottom:32,flexWrap:'wrap'}}> <div style={{flex:1,minWidth:280}}> <div style={{display:'inline-block',background:'rgba(245,158,11,.15)',color:'#f59e0b',fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',padding:'4px 12px',borderRadius:20,marginBottom:14,border:'1px solid rgba(245,158,11,.3)'}}>Get Started</div> <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:24,color:'#fff',lineHeight:1.2,marginBottom:12}}>Measure where your business stands today</h2> <p style={{fontSize:14,color:'rgba(255,255,255,0.65)',lineHeight:1.7,marginBottom:24}}>The Homebuilding Maturity Assessment covers 53 items across 6 operational domains. Get your score, maturity level, and AI-powered roadmap in under 30 minutes.</p> <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}> <a href="/pricing" style={{background:'#f59e0b',color:'#0f1f3d',border:'none',borderRadius:9,padding:'11px 24px',fontSize:14,fontWeight:700,textDecoration:'none',display:'inline-block'}}>See Pricing</a> <span style={{fontSize:12,color:'rgba(255,255,255,0.45)'}}>From $149 one-time</span> </div> </div> <div style={{display:'flex',gap:32,flexWrap:'wrap'}}> {[{label:'53',desc:'Scored questions'},{label:'6',desc:'Operational domains'},{label:'5',desc:'Maturity levels'}].map(s=>( <div key={s.label} style={{textAlign:'center'}}><div style={{fontSize:32,fontWeight:700,color:'#fff',fontFamily:"'DM Serif Display',serif"}}>{s.label}</div><div style={{fontSize:11,color:'rgba(255,255,255,0.45)',marginTop:2}}>{s.desc}</div></div> ))} </div> </div> )}
        {latestAssessment && ( <> <h2 style={{fontSize:16,fontWeight:700,color:'#111827',marginBottom:12}}>Latest Assessment</h2> <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:14,padding:'28px',display:'flex',gap:32,cursor:'pointer',marginBottom:28}} onClick={()=>router.push(`/results/${latestAssessment.id}`)}> <div style={{flex:1}}> <div style={{fontSize:12,color:'#9ca3af',marginBottom:8}}>{latestAssessment.company_name} &middot; {formatDate(latestAssessment.completed_at||latestAssessment.created_at)}</div> <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}> {latestAssessment.maturity_level && <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.04em',textTransform:'uppercase',padding:'4px 10px',borderRadius:20,background:getLevelBadgeStyle(latestAssessment.maturity_level_key).bg,color:getLevelBadgeStyle(latestAssessment.maturity_level_key).color}}>{latestAssessment.maturity_level}</span>} <span style={{fontSize:14,color:'#6b7280'}}>{latestAssessment.overall_score}% overall</span> </div> <div style={{display:'flex',flexDirection:'column',gap:8}}> {domainOrder.map(key=>{const d=latestAssessment.domain_scores?.[key];if(!d)return null;return( <div key={key} style={{display:'flex',alignItems:'center',gap:8}}> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d={domainIcons[key]}/></svg> <span style={{fontSize:12,color:'#374151',width:140,flexShrink:0,fontWeight:500}}>{domainNames[key]}</span> <div style={{flex:1,height:6,background:'#f3f4f6',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',borderRadius:3,width:`${d.pct}%`,background:getScoreColor(d.pct)}}/></div> <span style={{fontSize:11,fontWeight:700,width:36,textAlign:'right',flexShrink:0,color:getScoreColor(d.pct)}}>{d.pct}%</span> </div> )})} </div> </div> <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,minWidth:140}}> <div style={{width:120,height:120,borderRadius:'50%',border:`5px solid ${getScoreColor(latestAssessment.overall_score)}40`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#f9fafb'}}> <span style={{fontSize:36,fontWeight:700,fontFamily:"'DM Serif Display',serif",lineHeight:1,color:getScoreColor(latestAssessment.overall_score)}}>{latestAssessment.overall_score}</span> <span style={{fontSize:10,color:'#9ca3af',marginTop:2}}>out of 100</span> </div> <a href={`/results/${latestAssessment.id}`} style={{fontSize:13,fontWeight:600,color:'#1d4ed8',textDecoration:'none',padding:'8px 16px',border:'1px solid #dbeafe',borderRadius:8,background:'#eff6ff',whiteSpace:'nowrap'}} onClick={e=>e.stopPropagation()}>View Full Report</a> </div> </div> </> )}
        {assessments.length > 1 && ( <> <h2 style={{fontSize:16,fontWeight:700,color:'#111827',marginBottom:12}}>Assessment History</h2> <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden',marginBottom:28}}> <div style={{display:'flex',padding:'10px 20px',background:'#f9fafb',borderBottom:'1px solid #e5e7eb',fontSize:11,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:'#6b7280',gap:8}}> <span style={{flex:2}}>Date</span><span style={{flex:2}}>Company</span><span style={{flex:1,textAlign:'center'}}>Score</span><span style={{flex:2}}>Maturity Level</span><span style={{flex:1}}></span> </div> {assessments.slice(1).map(a=>( <div key={a.id} style={{display:'flex',alignItems:'center',padding:'12px 20px',borderBottom:'1px solid #f3f4f6',gap:8}}> <span style={{flex:2,color:'#6b7280',fontSize:13}}>{formatDate(a.completed_at||a.created_at)}</span> <span style={{flex:2,fontSize:13,fontWeight:500,color:'#111827'}}>{a.company_name}</span> <span style={{flex:1,textAlign:'center'}}><span style={{fontSize:12,fontWeight:700,padding:'2px 8px',borderRadius:20,display:'inline-block',color:getScoreColor(a.overall_score),background:getScoreColor(a.overall_score)+'18'}}>{a.overall_score}%</span></span> <span style={{flex:2}}>{a.maturity_level&&<span style={{fontSize:10,fontWeight:700,letterSpacing:'0.04em',textTransform:'uppercase',padding:'3px 8px',borderRadius:20,background:getLevelBadgeStyle(a.maturity_level_key).bg,color:getLevelBadgeStyle(a.maturity_level_key).color}}>{a.maturity_level}</span>}</span> <span style={{flex:1,textAlign:'right'}}><a href={`/results/${a.id}`} style={{fontSize:13,fontWeight:600,color:'#1d4ed8',textDecoration:'none'}}>View</a></span> </div> ))} </div> </> )}
        {assessments.length === 0 && hasSubscription && ( <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:14,padding:'48px 32px',textAlign:'center',marginTop:24}}> <div style={{width:60,height:60,background:'#f3f4f6',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}> <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg> </div> <h3 style={{fontSize:18,fontWeight:700,color:'#111827',marginBottom:8}}>No assessments yet</h3> <p style={{fontSize:14,color:'#6b7280',maxWidth:420,margin:'0 auto 24px',lineHeight:1.6}}>Take your first Operational Maturity Assessment to see where your business stands.</p> <button onClick={()=>router.push('/assessment')} style={{display:'inline-flex',alignItems:'center',background:'#0f1f3d',color:'#fff',border:'none',borderRadius:9,padding:'11px 22px',fontSize:14,fontWeight:600,cursor:'pointer'}}>Start Assessment</button> </div> )}
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <DashboardInner />
    </Suspense>
  )
}
