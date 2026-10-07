// lib/summitSurvey.ts
// Epcon Franchise Builder Summit (Oct 26–27, 2026) — company survey definition,
// calculations and validation. Answers are stored as a flat map of string values.

import { z } from 'zod'

export const SURVEY_EVENT = 'epcon-fall-2026'
export const SURVEY_DUE = 'Friday, October 16'

export type SurveyData = Record<string, string>

export const SECTIONS = [
  { title: 'Company profile', optional: false },
  { title: 'Volume and revenue', optional: false },
  { title: 'Land and production', optional: false },
  { title: 'Systems', optional: false },
  { title: 'P&L snapshot', optional: true },
  { title: 'Market and competition', optional: false },
  { title: 'Looking ahead', optional: false },
] as const

export const DAY_BASIS = ['Calendar days', 'Business days'] as const

export const FORCES = [
  { key: 'mkt_rate_land', label: 'Finding and entitling land', sub: 'Locating, entitling and closing on lots.' },
  { key: 'mkt_rate_trades', label: 'Securing trades and suppliers', sub: 'Getting reliable labor and materials at fair prices.' },
  { key: 'mkt_rate_rivals', label: 'Competing with other 55+ builders', sub: 'Winning buyers who are also shopping your competitors.' },
  { key: 'mkt_rate_subs', label: 'Beating the alternatives', sub: 'Winning buyers away from resale, 55+ rentals or staying put.' },
  { key: 'mkt_rate_buyers', label: 'Holding price with buyers', sub: 'Selling without heavy discounts or incentives.' },
] as const

export const PNL_LINES = [
  { key: 'pnl_revenue', label: 'Total revenue' },
  { key: 'pnl_cogs', label: 'Total cost of goods sold' },
  { key: 'calc_gm', label: 'Total gross margin', calc: true },
  { key: 'pnl_indirect', label: 'Indirect construction costs' },
  { key: 'pnl_finance', label: 'Finance costs' },
  { key: 'pnl_sales', label: 'Sales, marketing and commissions' },
  { key: 'pnl_ga', label: 'General and administrative' },
  { key: 'pnl_other', label: 'Other' },
  { key: 'calc_noi', label: 'Net operating income', calc: true },
] as const

const PNL_EXPENSES = ['pnl_indirect', 'pnl_finance', 'pnl_sales', 'pnl_ga', 'pnl_other'] as const

/** Every stored or calculated field, in survey order — drives the admin view and CSV export. */
export const FIELDS: { key: string; label: string; section: number }[] = [
  { key: 'co_company', label: 'Company name', section: 0 },
  { key: 'co_respondent', label: 'Respondent name and role', section: 0 },
  { key: 'co_founded', label: 'Year founded', section: 0 },
  { key: 'co_franchise_year', label: 'Year became Epcon franchisee', section: 0 },
  { key: 'co_markets', label: 'Markets served', section: 0 },
  { key: 'co_comm_epcon', label: 'Active Epcon communities', section: 0 },
  { key: 'co_comm_other', label: 'Active communities, other product lines', section: 0 },
  { key: 'co_emp_field', label: 'Employees: field / construction', section: 0 },
  { key: 'co_emp_sales', label: 'Employees: sales', section: 0 },
  { key: 'co_emp_office', label: 'Employees: office / admin', section: 0 },
  { key: 'co_sales_model', label: 'Who sells your homes', section: 0 },

  { key: 'vol_closings_2025', label: 'Closings 2025 (homes)', section: 1 },
  { key: 'vol_closings_2026', label: 'Closings 2026 projected (homes)', section: 1 },
  { key: 'vol_revenue_2025', label: 'Gross revenue 2025 ($M)', section: 1 },
  { key: 'vol_revenue_2026', label: 'Gross revenue 2026 projected ($M)', section: 1 },
  { key: 'calc_asp', label: 'Average sale price ($K)', section: 1 },
  { key: 'vol_options_pct', label: 'Options and upgrades (% of price)', section: 1 },
  { key: 'vol_backlog_homes', label: 'Current backlog (homes)', section: 1 },
  { key: 'calc_backlog_value', label: 'Backlog value ($M)', section: 1 },
  { key: 'vol_sales_pace', label: 'Net sales per community per month', section: 1 },
  { key: 'vol_cancel_pct', label: 'Cancellation rate (%)', section: 1 },

  { key: 'land_owned', label: 'Lots owned', section: 2 },
  { key: 'land_optioned', label: 'Lots under option', section: 2 },
  { key: 'land_finished', label: 'Finished lots on hand', section: 2 },
  { key: 'land_months_supply', label: 'Months of lot supply', section: 2 },
  { key: 'prod_soft_days', label: 'Soft Cycle: avg days contract to construction start', section: 2 },
  { key: 'prod_soft_basis', label: 'Soft Cycle day type', section: 2 },
  { key: 'prod_build_days', label: 'Production Cycle: avg days construction start to completion', section: 2 },
  { key: 'prod_build_basis', label: 'Production Cycle day type', section: 2 },
  { key: 'prod_wip', label: 'Homes under construction now', section: 2 },
  { key: 'prod_spec_pct', label: 'Spec starts (% of starts)', section: 2 },
  { key: 'prod_warranty', label: 'Warranty requests per home (first year)', section: 2 },

  { key: 'sys_erp', label: 'Accounting / ERP', section: 3 },
  { key: 'sys_scheduling', label: 'Scheduling', section: 3 },
  { key: 'sys_crm', label: 'CRM / sales', section: 3 },
  { key: 'sys_purchasing', label: 'Purchasing / estimating', section: 3 },
  { key: 'sys_warranty', label: 'Warranty / customer care', section: 3 },
  { key: 'sys_csat_method', label: 'Customer satisfaction measurement', section: 3 },
  { key: 'sys_csat_score', label: 'Latest customer satisfaction score', section: 3 },

  { key: 'pnl_choice', label: 'P&L: share or skip', section: 4 },
  { key: 'pnl_period', label: 'P&L period', section: 4 },
  ...PNL_LINES.map(l => ({ key: l.key, label: `${l.label} ($K)`, section: 4 })),
  ...PNL_LINES.filter(l => l.key !== 'pnl_revenue').map(l => ({ key: `pct_${l.key}`, label: `${l.label} (% of revenue)`, section: 4 })),
  { key: 'pnl_source', label: 'P&L source', section: 4 },

  { key: 'mkt_comp_1', label: 'Competitor 1', section: 5 },
  { key: 'mkt_comp_2', label: 'Competitor 2', section: 5 },
  { key: 'mkt_comp_3', label: 'Competitor 3', section: 5 },
  { key: 'mkt_comp_4', label: 'Competitor 4', section: 5 },
  { key: 'mkt_comp_5', label: 'Competitor 5', section: 5 },
  { key: 'mkt_buyer_age', label: 'Typical buyer age range', section: 5 },
  { key: 'mkt_buyer_origin', label: 'Where buyers move from', section: 5 },
  { key: 'mkt_cash_pct', label: 'Cash buyers (%)', section: 5 },
  { key: 'mkt_epcon_share', label: 'Epcon share of local 55+ new-home sales (%)', section: 5 },
  ...FORCES.map(f => ({ key: f.key, label: `${f.label} (1 = extremely hard, 6 = extremely easy)`, section: 5 })),
  { key: 'mkt_challenge', label: 'Biggest market challenge, next 12 months', section: 5 },

  { key: 'ahead_challenge', label: 'Biggest operational challenge', section: 6 },
  { key: 'ahead_focus', label: 'Area for the review team to dig into', section: 6 },
  { key: 'ahead_worth', label: 'What would make the two days worth it', section: 6 },
]

/** Parse a loosely typed number ("1,250", "$525", " 12.5 "). */
export function num(v: string | undefined | null): number | null {
  if (v == null) return null
  const s = String(v).replace(/[$,%\s]/g, '')
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export function fmt(n: number, digits = 0): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export interface SurveyCalcs {
  aspCalc: number | null      // $K, from 2026 revenue ÷ 2026 closings
  asp: number | null          // $K, override if entered, else calculated
  aspOverridden: boolean
  backlogValueCalc: number | null // $M, backlog homes × ASP
  backlogValue: number | null
  backlogOverridden: boolean
  gm: number | null           // $K
  noi: number | null          // $K
  pct: Record<string, number | null> // P&L line → % of revenue
}

export function calculate(d: SurveyData): SurveyCalcs {
  const cl26 = num(d.vol_closings_2026)
  const rev26 = num(d.vol_revenue_2026)
  const aspCalc = cl26 && rev26 ? Math.round((rev26 * 1000) / cl26) : null
  const aspOverridden = d.vol_asp !== undefined
  const asp = aspOverridden ? num(d.vol_asp) : aspCalc

  const homes = num(d.vol_backlog_homes)
  const backlogValueCalc = homes != null && asp != null ? Math.round((homes * asp) / 100) / 10 : null
  const backlogOverridden = d.vol_backlog_value !== undefined
  const backlogValue = backlogOverridden ? num(d.vol_backlog_value) : backlogValueCalc

  const rev = num(d.pnl_revenue)
  const cogs = num(d.pnl_cogs)
  const gm = rev != null && cogs != null ? rev - cogs : null
  const anyExpense = PNL_EXPENSES.some(k => num(d[k]) != null)
  const expenses = PNL_EXPENSES.reduce((sum, k) => sum + (num(d[k]) ?? 0), 0)
  const noi = gm != null && anyExpense ? gm - expenses : null

  const values: Record<string, number | null> = {
    pnl_revenue: rev, pnl_cogs: cogs, calc_gm: gm, calc_noi: noi,
    ...Object.fromEntries(PNL_EXPENSES.map(k => [k, num(d[k])])),
  }
  const pct: Record<string, number | null> = {}
  for (const l of PNL_LINES) {
    const v = values[l.key]
    pct[l.key] = rev && v != null ? (v / rev) * 100 : null
  }

  return { aspCalc, asp, aspOverridden, backlogValueCalc, backlogValue, backlogOverridden, gm, noi, pct }
}

/** Flatten stored answers + calculated values into one row (admin view and CSV). */
export function toRow(d: SurveyData): Record<string, string> {
  const c = calculate(d)
  const row: Record<string, string> = { ...d }
  row.calc_asp = c.asp != null ? String(c.asp) + (c.aspOverridden ? ' (entered)' : '') : ''
  row.calc_backlog_value = c.backlogValue != null ? String(c.backlogValue) + (c.backlogOverridden ? ' (entered)' : '') : ''
  row.calc_gm = c.gm != null ? String(c.gm) : ''
  row.calc_noi = c.noi != null ? String(c.noi) : ''
  for (const l of PNL_LINES) {
    if (l.key === 'pnl_revenue') continue
    const p = c.pct[l.key]
    row[`pct_${l.key}`] = p != null ? p.toFixed(1) : ''
  }
  if (d.pnl_choice === 'skip') {
    for (const l of PNL_LINES) { row[l.key] = ''; row[`pct_${l.key}`] = '' }
    row.pnl_period = ''
    row.pnl_source = ''
  }
  return row
}

const SECTION_KEYS: string[][] = SECTIONS.map((_, i) =>
  FIELDS.filter(f => f.section === i && !f.key.startsWith('calc_') && !f.key.startsWith('pct_')).map(f => f.key)
)
SECTION_KEYS[1].push('vol_asp', 'vol_backlog_value')

/** A section counts as started once any of its answers is filled in. */
export function sectionStarted(d: SurveyData, section: number): boolean {
  return SECTION_KEYS[section].some(k => (d[k] ?? '').trim() !== '')
}

export const SurveyPayload = z.object({
  data: z
    .record(z.string().regex(/^[a-z0-9_]{1,40}$/), z.string().max(4000))
    .refine(o => Object.keys(o).length <= 200, 'Too many fields'),
  submit: z.boolean().optional(),
})

export function adminEmails(): string[] {
  return (process.env.SURVEY_ADMIN_EMAILS || 'mattc@themainspringgroup.com')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
}
