'use client'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import {
  SECTIONS, FORCES, PNL_LINES, DAY_BASIS, SURVEY_DUE,
  calculate, fmt, sectionStarted, type SurveyData,
} from '@/lib/summitSurvey'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:#F3F5F8}
.sv{min-height:100vh;font-family:'Inter',system-ui,sans-serif;color:#0f1f3d;background:#F3F5F8}
.sv h1,.sv h2{font-family:'DM Serif Display',Georgia,serif;font-weight:400;letter-spacing:-0.01em}
.sv button{font-family:inherit}
.lbl{display:block;font-weight:600;font-size:15px;line-height:1.35;color:#0f1f3d;margin-bottom:6px}
.hint{font-size:13px;line-height:1.45;color:#56606D;margin-top:5px}
.th{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#56606D}
.fld{width:100%;min-height:44px;padding:10px 12px;border:1px solid #C3CAD3;border-radius:8px;font:inherit;font-size:15px;color:#0f1f3d;background:#fff}
.fld:focus{outline:2px solid #A33F16;outline-offset:1px;border-color:#A33F16}
textarea.fld{resize:vertical;min-height:88px}
.sfx{display:flex;align-items:stretch}
.sfx .fld{border-top-right-radius:0;border-bottom-right-radius:0;min-width:0}
.sfx>span{display:flex;align-items:center;padding:0 12px;border:1px solid #C3CAD3;border-left:0;border-radius:0 8px 8px 0;background:#EEF1F4;color:#56606D;font-size:14px;white-space:nowrap}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px 24px}
.card{background:#fff;border:1px solid #DCE1E7;border-radius:14px}
.tag{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;border-radius:999px;padding:3px 8px}
.tag-opt{color:#56606D;background:#EEF1F4}
.tag-auto{color:#A33F16;background:#FBEFE9;margin-left:6px;padding:2px 7px}
.choice{display:flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border:1px solid #C3CAD3;border-radius:8px;font-size:15px;cursor:pointer;background:#fff}
.linkbtn{border:0;background:none;padding:0;font:inherit;color:#A33F16;text-decoration:underline;cursor:pointer}
.btn{min-height:44px;padding:0 22px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer}
.btn-dark{border:0;background:#0f1f3d;color:#fff}
.btn-accent{border:0;background:#A33F16;color:#fff}
.btn-ghost{border:1px solid #C3CAD3;background:#fff;color:#0f1f3d}
.btn:disabled{opacity:.6;cursor:not-allowed}
.pill{min-height:44px;padding:0 18px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;color:#0f1f3d}
.rate{width:44px;height:44px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer}
@media (max-width:640px){.sv-main{padding:24px 18px!important}.sv-intro{padding:22px 20px!important}}
`

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 10) return 'just now'
  if (s < 60) return `${s} sec ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function SurveyClient({
  initialData, initialStatus, initialSavedAt, displayName, displayCompany,
}: {
  initialData: SurveyData
  initialStatus: 'in_progress' | 'submitted'
  initialSavedAt: string | null
  displayName: string
  displayCompany: string
}) {
  const [d, setD] = useState<SurveyData>(initialData)
  const [sec, setSec] = useState(0)
  const [status, setStatus] = useState(initialStatus)
  const [saveState, setSaveState] = useState<SaveState>(initialSavedAt ? 'saved' : 'idle')
  const [savedAt, setSavedAt] = useState<string | null>(initialSavedAt)
  const [showDone, setShowDone] = useState(false)
  const [, tick] = useState(0)

  const dataRef = useRef(d)
  const dirty = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mainRef = useRef<HTMLElement | null>(null)

  const save = useCallback(async (submit = false) => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    dirty.current = false
    setSaveState('saving')
    try {
      const res = await fetch('/api/summit-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataRef.current, submit }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const json = await res.json()
      setStatus(json.status)
      setSavedAt(json.savedAt)
      setSaveState('saved')
      return true
    } catch {
      dirty.current = true
      setSaveState('error')
      return false
    }
  }, [])

  // Autosave 1.2s after the last change.
  useEffect(() => {
    dataRef.current = d
    if (!dirty.current) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { save(false) }, 1200)
  }, [d, save])

  // Keep "Saved x min ago" fresh, and warn before leaving with unsaved changes.
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 30000)
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault() } }
    window.addEventListener('beforeunload', warn)
    return () => { clearInterval(t); window.removeEventListener('beforeunload', warn) }
  }, [])

  const set = (k: string, v: string) => { dirty.current = true; setD(prev => ({ ...prev, [k]: v })) }
  const unset = (k: string) => { dirty.current = true; setD(prev => { const n = { ...prev }; delete n[k]; return n }) }
  const val = (k: string) => d[k] ?? ''

  const go = (i: number) => {
    if (dirty.current) save(false)
    setSec(i)
    setShowDone(false)
    mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function submit() {
    const ok = await save(true)
    if (ok) setShowDone(true)
  }

  const c = calculate(d)

  // ---- small render helpers (plain functions, so inputs keep focus) ----
  const text = (k: string, opts: { id?: string; placeholder?: string; numeric?: boolean; label?: string } = {}) => (
    <input
      id={opts.id ?? k}
      className="fld"
      value={val(k)}
      onChange={e => set(k, e.target.value)}
      placeholder={opts.placeholder}
      inputMode={opts.numeric ? 'decimal' : undefined}
      aria-label={opts.label}
    />
  )
  const withSuffix = (k: string, suffix: string, opts: { id?: string; placeholder?: string; label?: string } = {}) => (
    <div className="sfx">{text(k, { ...opts, numeric: true })}<span>{suffix}</span></div>
  )
  const area = (k: string) => <textarea id={k} className="fld" rows={3} value={val(k)} onChange={e => set(k, e.target.value)} />
  const select = (k: string, options: readonly string[], opts: { label?: string; placeholder?: string; style?: CSSProperties } = {}) => (
    <select id={k} className="fld" value={val(k)} onChange={e => set(k, e.target.value)} aria-label={opts.label} style={opts.style}>
      <option value="">{opts.placeholder ?? 'Select…'}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
  const field = (k: string, label: string, control: ReactNode, hint?: string) => (
    <div key={k}>
      <label className="lbl" htmlFor={k}>{label}</label>
      {control}
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
  const heading = (n: number, title: string, intro: string, optional = false) => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="th">Section {n}</span>
        {optional && <span className="tag tag-opt">Optional</span>}
      </div>
      <h2 style={{ fontSize: 30, margin: '6px 0 6px' }}>{title}</h2>
      <p style={{ margin: 0, color: '#56606D', fontSize: 15, lineHeight: 1.55, maxWidth: 680 }}>{intro}</p>
    </div>
  )
  const choiceStyle = (on: boolean): CSSProperties =>
    on ? { border: '2px solid #A33F16', background: '#FBEFE9' } : { border: '1px solid #C3CAD3', background: '#fff' }

  const saveLabel =
    saveState === 'saving' ? 'Saving…' :
    saveState === 'error' ? 'Not saved — check your connection' :
    saveState === 'saved' ? `Saved ${timeAgo(savedAt)}` : 'Not started'

  const pct = Math.round(((sec + 1) / SECTIONS.length) * 100)
  const isLast = sec === SECTIONS.length - 1

  return (
    <div className="sv">
      <style>{CSS}</style>

      <header style={{ background: '#0f1f3d', color: '#fff' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '14px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff', textDecoration: 'none' }}>
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="#F0A27E" strokeWidth="2" aria-hidden="true"><rect x="3" y="15" width="6" height="10" /><rect x="11" y="9" width="6" height="16" /><rect x="19" y="3" width="6" height="22" /></svg>
              <span style={{ fontWeight: 700, fontSize: 17 }}>BuilderMaturity</span>
            </Link>
            <span style={{ fontSize: 13, color: '#B9C2CE', paddingLeft: 12, borderLeft: '1px solid #3A4656' }}>Epcon Franchise Builder Summit</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#B9C2CE', flexWrap: 'wrap' }}>
            <span role="status" aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: 6, color: saveState === 'error' ? '#FCA5A5' : '#B9C2CE' }}>
              {saveState === 'saved' && <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#8FD3A8" strokeWidth="2" aria-hidden="true"><path d="M3 8.5l3 3 7-7" /></svg>}
              {saveLabel}
            </span>
            <span>{displayName}{displayCompany ? ` · ${displayCompany}` : ''}</span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 24px 64px' }}>

        <section className="card sv-intro" style={{ padding: '28px 32px', display: 'flex', flexWrap: 'wrap', gap: '24px 40px', justifyContent: 'space-between' }}>
          <div style={{ flex: '999 1 480px', minWidth: 0 }}>
            <div className="th" style={{ color: '#A33F16' }}>Pre-summit prep · Step 2 of 2</div>
            <h1 style={{ fontSize: 38, lineHeight: 1.1, margin: '8px 0 12px' }}>Company Survey</h1>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: '#3B4552', maxWidth: 640 }}>
              This survey gives your review team the basic facts of your operation, so the Day 1 review starts with real questions instead of introductions. Rounded figures and best estimates are fine. We are not looking for audit-level detail.
            </p>
          </div>
          <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, lineHeight: 1.5 }}>
            <div><strong>30–40 minutes.</strong> Progress saves as you go.</div>
            <div><strong>Due {SURVEY_DUE}.</strong></div>
            <div><strong>Shared with summit attendees.</strong> Your answers are discussed in the room and go no further. Your BuilderMaturity results stay private.</div>
          </div>
        </section>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, marginTop: 28, alignItems: 'flex-start' }}>

          <nav aria-label="Survey sections" className="card" style={{ flex: '1 1 240px', maxWidth: 300, minWidth: 0, padding: '20px 14px' }}>
            <div style={{ padding: '0 10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#56606D', marginBottom: 8 }}>
                <span>Section {sec + 1} of {SECTIONS.length}</span><span>{pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: '#E6EAEE', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: '#A33F16', borderRadius: 3 }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {SECTIONS.map((s, i) => {
                const on = i === sec
                const started = sectionStarted(d, i) || (i === 4 && d.pnl_choice === 'skip')
                return (
                  <button key={s.title} type="button" onClick={() => go(i)} aria-current={on ? 'step' : undefined}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 44, padding: '8px 10px', border: 0, borderRadius: 8, fontSize: 15, cursor: 'pointer', textAlign: 'left', background: on ? '#FBEFE9' : 'transparent', color: on ? '#0f1f3d' : '#3B4552', fontWeight: on ? 600 : 400 }}>
                    <span style={{ flex: '0 0 26px', height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, background: on ? '#A33F16' : started ? '#0f1f3d' : '#EEF1F4', color: on || started ? '#fff' : '#56606D' }}>
                      {started && !on ? '✓' : i + 1}
                    </span>
                    <span style={{ flex: '1 1 auto' }}>{s.title}</span>
                    {s.optional && <span className="tag tag-opt">Optional</span>}
                  </button>
                )
              })}
            </div>
          </nav>

          <main ref={mainRef} className="card sv-main" style={{ flex: '999 1 560px', minWidth: 0, padding: '32px 36px 28px', scrollMarginTop: 16 }}>

            {showDone ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 0' }}>
                <h2 style={{ fontSize: 32, margin: 0 }}>Thank you — your survey is in.</h2>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: '#3B4552', maxWidth: 620 }}>
                  Your review team will use it to prepare for your presenting round. You can come back and update any answer before the summit; changes save automatically.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => go(0)}>Review my answers</button>
                  <Link href="/dashboard" className="btn btn-dark" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>Go to my dashboard</Link>
                </div>
              </div>
            ) : (
              <>
                {sec === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    {heading(1, 'Company profile', 'Who you are and how the company is set up.')}
                    <div className="grid">
                      {field('co_company', 'Company name', text('co_company'))}
                      {field('co_respondent', 'Your name and role', text('co_respondent'))}
                      {field('co_founded', 'Year founded', text('co_founded', { placeholder: 'e.g., 1998', numeric: true }))}
                      {field('co_franchise_year', 'Year you became an Epcon franchisee', text('co_franchise_year', { placeholder: 'e.g., 2015', numeric: true }))}
                    </div>
                    {field('co_markets', 'Markets served', text('co_markets', { placeholder: 'Metro areas or counties' }))}
                    <div className="grid">
                      {field('co_comm_epcon', 'Active Epcon communities', text('co_comm_epcon', { numeric: true }))}
                      {field('co_comm_other', 'Active communities, other product lines', text('co_comm_other', { numeric: true, placeholder: '0 if none' }))}
                    </div>
                    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                      <legend className="lbl">Employees (full-time equivalents)</legend>
                      <div className="grid" style={{ marginTop: 4 }}>
                        {[['co_emp_field', 'Field / construction'], ['co_emp_sales', 'Sales'], ['co_emp_office', 'Office / admin']].map(([k, l]) => (
                          <div key={k}><label className="hint" htmlFor={k} style={{ display: 'block', margin: '0 0 6px' }}>{l}</label>{text(k, { numeric: true })}</div>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                      <legend className="lbl">Who sells your homes?</legend>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                        {['In-house agents', 'Outside brokers', 'Both'].map(o => (
                          <label key={o} className="choice" style={choiceStyle(val('co_sales_model') === o)}>
                            <input type="radio" name="co_sales_model" checked={val('co_sales_model') === o} onChange={() => set('co_sales_model', o)} /> {o}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                )}

                {sec === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    {heading(2, 'Volume and revenue', 'Round freely. A best estimate is more useful than a blank.')}
                    <div style={{ border: '1px solid #DCE1E7', borderRadius: 10, overflowX: 'auto' }}>
                      <div style={{ minWidth: 480 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px,1.3fr) minmax(0,1fr) minmax(0,1fr)', gap: 16, padding: '12px 18px', background: '#F6F8FA', borderBottom: '1px solid #DCE1E7' }}>
                          <span className="th" /><span className="th">2025 actual</span><span className="th">2026 projected</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px,1.3fr) minmax(0,1fr) minmax(0,1fr)', gap: 16, padding: '14px 18px', alignItems: 'center', borderBottom: '1px solid #EDF0F3' }}>
                          <span style={{ fontWeight: 600, fontSize: 15 }}>Closings</span>
                          {withSuffix('vol_closings_2025', 'homes', { label: 'Closings 2025' })}
                          {withSuffix('vol_closings_2026', 'homes', { label: 'Closings 2026 projected' })}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px,1.3fr) minmax(0,1fr) minmax(0,1fr)', gap: 16, padding: '14px 18px', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: 15 }}>Gross revenue</span>
                          {withSuffix('vol_revenue_2025', '$M', { label: 'Gross revenue 2025' })}
                          {withSuffix('vol_revenue_2026', '$M', { label: 'Gross revenue 2026 projected' })}
                        </div>
                      </div>
                    </div>
                    <div className="grid">
                      <div>
                        <label className="lbl" htmlFor="vol_asp">Average sale price <span className="tag tag-auto">Auto</span></label>
                        <div className="sfx">
                          <input id="vol_asp" className="fld" inputMode="decimal" placeholder="Fills in from 2026 numbers"
                            value={c.aspOverridden ? val('vol_asp') : c.aspCalc != null ? fmt(c.aspCalc) : ''}
                            onChange={e => set('vol_asp', e.target.value)} />
                          <span>$K</span>
                        </div>
                        {c.aspOverridden
                          ? <div className="hint">You entered your own figure. <button type="button" className="linkbtn" onClick={() => unset('vol_asp')}>Use calculated value</button></div>
                          : <div className="hint">2026 revenue ÷ 2026 closings. Type over it to change.</div>}
                      </div>
                      {field('vol_options_pct', 'Options and upgrades', withSuffix('vol_options_pct', '% of price'))}
                      {field('vol_backlog_homes', 'Current backlog', withSuffix('vol_backlog_homes', 'homes'))}
                      <div>
                        <label className="lbl" htmlFor="vol_backlog_value">Backlog value <span className="tag tag-auto">Auto</span></label>
                        <div className="sfx">
                          <input id="vol_backlog_value" className="fld" inputMode="decimal" placeholder="Fills in from backlog × price"
                            value={c.backlogOverridden ? val('vol_backlog_value') : c.backlogValueCalc != null ? fmt(c.backlogValueCalc, 1) : ''}
                            onChange={e => set('vol_backlog_value', e.target.value)} />
                          <span>$M</span>
                        </div>
                        {c.backlogOverridden
                          ? <div className="hint">You entered your own figure. <button type="button" className="linkbtn" onClick={() => unset('vol_backlog_value')}>Use calculated value</button></div>
                          : <div className="hint">Backlog homes × average sale price. Type over it to change.</div>}
                      </div>
                      {field('vol_sales_pace', 'Net sales per community', withSuffix('vol_sales_pace', 'per month'))}
                      {field('vol_cancel_pct', 'Cancellation rate', withSuffix('vol_cancel_pct', '%'))}
                    </div>
                  </div>
                )}

                {sec === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    {heading(3, 'Land and production', 'Your lot position and how homes move through construction.')}
                    <div>
                      <div className="th" style={{ marginBottom: 12 }}>Lot position</div>
                      <div className="grid">
                        {field('land_owned', 'Lots owned', text('land_owned', { numeric: true }))}
                        {field('land_optioned', 'Lots under option', text('land_optioned', { numeric: true }))}
                        {field('land_finished', 'Finished lots on hand', text('land_finished', { numeric: true }))}
                        {field('land_months_supply', 'Months of lot supply', withSuffix('land_months_supply', 'months'), 'At your current sales pace.')}
                      </div>
                    </div>
                    <div>
                      <div className="th" style={{ marginBottom: 12 }}>Production</div>
                      <div className="grid">
                        {[['prod_soft_days', 'prod_soft_basis', 'Soft Cycle: avg days from contract to construction start', 'Soft Cycle day type'],
                          ['prod_build_days', 'prod_build_basis', 'Production Cycle: avg days from construction start to house completion', 'Production Cycle day type']].map(([k, b, l, bl]) => (
                          <div key={k}>
                            <label className="lbl" htmlFor={k}>{l}</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input id={k} className="fld" inputMode="numeric" value={val(k)} onChange={e => set(k, e.target.value)} style={{ flex: '1 1 90px', minWidth: 0 }} />
                              {select(b, DAY_BASIS, { label: bl, placeholder: 'Day type…', style: { flex: '1 1 150px', width: 'auto', minWidth: 0 } })}
                            </div>
                          </div>
                        ))}
                        {field('prod_wip', 'Homes under construction now', text('prod_wip', { numeric: true }))}
                        {field('prod_spec_pct', 'Spec starts', withSuffix('prod_spec_pct', '% of starts'))}
                        {field('prod_warranty', 'Warranty requests per home', text('prod_warranty', { numeric: true }), 'First year after closing.')}
                      </div>
                    </div>
                  </div>
                )}

                {sec === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    {heading(4, 'Systems', 'Just the tools you use. Your BuilderMaturity assessment already covers how your processes run.')}
                    <div className="grid">
                      {field('sys_erp', 'Accounting / ERP', text('sys_erp', { placeholder: 'e.g., MarkSystems' }))}
                      {field('sys_scheduling', 'Scheduling', text('sys_scheduling'))}
                      {field('sys_crm', 'CRM / sales', text('sys_crm'))}
                      {field('sys_purchasing', 'Purchasing / estimating', text('sys_purchasing'))}
                      {field('sys_warranty', 'Warranty / customer care', text('sys_warranty'))}
                    </div>
                    <div className="grid">
                      {field('sys_csat_method', 'How do you measure customer satisfaction?', select('sys_csat_method', ['Third-party survey', 'Internal survey', 'Informal / not measured']))}
                      {field('sys_csat_score', 'Latest score, if any', text('sys_csat_score', { placeholder: 'e.g., 92% would recommend' }))}
                    </div>
                  </div>
                )}

                {sec === 4 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    {heading(5, 'P&L snapshot', 'A high-level P&L. Rounded figures in thousands are fine; percentages of revenue are calculated for you. These figures are used in your peer review and may come up in the group discussion. They are not shared outside the summit. Without them, the profitability part of your review is skipped.', true)}
                    <div role="radiogroup" aria-label="Share your P&L snapshot?" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
                      {[['share', 'Share for the peer review', 'Enter the figures below. Your review team uses them to discuss profitability.'],
                        ['skip', 'Skip this section', 'No problem. Your review covers the other areas only.']].map(([k, t, s]) => {
                        const on = val('pnl_choice') === k
                        return (
                          <button key={k} type="button" role="radio" aria-checked={on} onClick={() => set('pnl_choice', k)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, textAlign: 'left', padding: '18px 20px', borderRadius: 10, color: '#0f1f3d', cursor: 'pointer', border: on ? '2px solid #A33F16' : '2px solid #DCE1E7', background: on ? '#FBEFE9' : '#fff' }}>
                            <span style={{ fontWeight: 700, fontSize: 16 }}>{t}</span>
                            <span style={{ fontSize: 14, color: '#3B4552', lineHeight: 1.45 }}>{s}</span>
                          </button>
                        )
                      })}
                    </div>
                    {val('pnl_choice') !== 'skip' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                          <legend className="lbl">Which period are you reporting?</legend>
                          <div role="radiogroup" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                            {[['fy2025', 'Full year 2025'], ['ytd2026', 'Q1–Q3 2026 (year to date)']].map(([k, l]) => {
                              const on = val('pnl_period') === k
                              return <button key={k} type="button" role="radio" aria-checked={on} className="pill" onClick={() => set('pnl_period', k)} style={choiceStyle(on)}>{l}</button>
                            })}
                          </div>
                        </fieldset>
                        <div style={{ border: '1px solid #DCE1E7', borderRadius: 10, overflowX: 'auto' }}>
                          <div style={{ minWidth: 460 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 170px 90px', gap: 16, padding: '10px 18px', background: '#F6F8FA', borderBottom: '1px solid #DCE1E7' }}>
                              <span className="th" /><span className="th">Amount</span><span className="th" style={{ textAlign: 'right' }}>% of rev.</span>
                            </div>
                            {PNL_LINES.map((l, i) => {
                              const isCalc = 'calc' in l && l.calc
                              const calcVal = l.key === 'calc_gm' ? c.gm : l.key === 'calc_noi' ? c.noi : null
                              const p = l.key === 'pnl_revenue' ? (c.pct.pnl_revenue != null ? 100 : null) : c.pct[l.key]
                              return (
                                <div key={l.key} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 170px 90px', gap: 16, alignItems: 'center', padding: '10px 18px', borderBottom: i < PNL_LINES.length - 1 ? '1px solid #EDF0F3' : undefined, background: isCalc ? '#F6F8FA' : undefined }}>
                                  <label htmlFor={l.key} style={{ fontSize: 15, fontWeight: isCalc ? 700 : 500 }}>{l.label}</label>
                                  {isCalc ? (
                                    <div id={l.key} style={{ minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '0 12px', borderRadius: 8, background: '#EEF1F4', fontWeight: 700, fontSize: 15 }}>
                                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: '#A33F16' }}>Calc</span>
                                      {calcVal != null ? `$${fmt(calcVal)}K` : '—'}
                                    </div>
                                  ) : (
                                    <div className="sfx">
                                      <input id={l.key} className="fld" inputMode="decimal" style={{ textAlign: 'right' }} value={val(l.key)} onChange={e => set(l.key, e.target.value)} />
                                      <span>$K</span>
                                    </div>
                                  )}
                                  <span style={{ textAlign: 'right', fontSize: 15, color: '#3B4552', fontVariantNumeric: 'tabular-nums' }}>{p != null ? `${p.toFixed(1)}%` : '—'}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        <div className="grid">
                          {field('pnl_source', 'Source of the numbers', select('pnl_source', ['Internal financials', 'CPA-reviewed', 'Audited', 'Best estimate']))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {sec === 5 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    {heading(6, 'Market and competition', 'Your local market. This sets up the Day 2 session on market forces.')}
                    <div>
                      <div className="lbl">Top competitors in your 55+ niche</div>
                      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
                        {[1, 2, 3, 4, 5].map(n => <div key={n}>{text(`mkt_comp_${n}`, { placeholder: `${n}.`, label: `Competitor ${n}` })}</div>)}
                      </div>
                    </div>
                    <div className="grid">
                      {field('mkt_buyer_age', 'Typical buyer age range', text('mkt_buyer_age', { placeholder: 'e.g., 62–75' }))}
                      {field('mkt_buyer_origin', 'Where buyers move from', select('mkt_buyer_origin', ['Mostly within 10 miles', 'Same metro, 10+ miles', 'Out of state / relocating', 'Mixed']))}
                      {field('mkt_cash_pct', 'Cash buyers', withSuffix('mkt_cash_pct', '%'))}
                      {field('mkt_epcon_share', 'Epcon share of local 55+ new-home sales', withSuffix('mkt_epcon_share', '% est.'))}
                    </div>
                    <div>
                      <div className="lbl" style={{ marginBottom: 2 }}>In your market, how hard or easy is each of these?</div>
                      <div className="hint" style={{ margin: '0 0 14px' }}>Rate from 1 (extremely hard) to 6 (extremely easy).</div>
                      <div style={{ border: '1px solid #DCE1E7', borderRadius: 10 }}>
                        {FORCES.map((f, fi) => (
                          <div key={f.key} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px 24px', padding: '16px 18px', borderBottom: fi < FORCES.length - 1 ? '1px solid #EDF0F3' : undefined }}>
                            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 15 }}>{f.label}</div>
                              <div className="hint" style={{ marginTop: 2 }}>{f.sub}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 0 auto', width: 294 }}>
                              <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, lineHeight: 1.2, color: '#6B7480', whiteSpace: 'nowrap' }}>
                                <span>Extremely hard</span><span>Extremely easy</span>
                              </div>
                              <div role="radiogroup" aria-label={f.label} style={{ display: 'flex', gap: 6 }}>
                                {[1, 2, 3, 4, 5, 6].map(n => {
                                  const on = val(f.key) === String(n)
                                  return (
                                    <button key={n} type="button" role="radio" aria-checked={on} className="rate"
                                      aria-label={`${f.label}: ${n} of 6${n === 1 ? ', extremely hard' : n === 6 ? ', extremely easy' : ''}`}
                                      onClick={() => set(f.key, String(n))}
                                      style={on ? { border: '2px solid #A33F16', background: '#A33F16', color: '#fff' } : { border: '1px solid #C3CAD3', background: '#fff', color: '#0f1f3d' }}>
                                      {n}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {field('mkt_challenge', 'Biggest market challenge in the next 12 months', area('mkt_challenge'))}
                  </div>
                )}

                {sec === 6 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                    {heading(7, 'Looking ahead', 'What you want out of the two days.')}
                    {field('ahead_challenge', 'Your biggest operational challenge right now', area('ahead_challenge'))}
                    {field('ahead_focus', 'The one area you most want your review team to dig into', area('ahead_focus'))}
                    {field('ahead_worth', 'What would make these two days worth your time?', area('ahead_worth'))}
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 36, paddingTop: 22, borderTop: '1px solid #E6EAEE' }}>
                  <div>
                    {sec > 0 && <button type="button" className="btn btn-ghost" onClick={() => go(sec - 1)}>Back</button>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#56606D' }}>
                      {status === 'submitted' ? 'Submitted. Changes still save automatically.' : 'You can leave and come back anytime.'}
                    </span>
                    {!isLast && <button type="button" className="btn btn-dark" onClick={() => go(sec + 1)}>Save and continue</button>}
                    {isLast && (
                      <button type="button" className="btn btn-accent" onClick={submit} disabled={saveState === 'saving'}>
                        {status === 'submitted' ? 'Save updates' : 'Submit survey'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
