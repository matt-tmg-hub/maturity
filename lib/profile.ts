// Short, unscored company profile asked at the end of the assessment.
// Homes per year is stored in the existing homes_per_year column (companyInfo.volume).
// Buyer segments and software are stored inside the answers JSON under the P.* keys below;
// scoring only reads question IDs from the domain lists, so these never affect scores.

export const PROFILE_KEYS = { buyer: 'P.buyer', software: 'P.software' } as const

export const VOLUME_OPTIONS = ['1-10', '11-25', '26-50', '51-100', '101-250', '251-500', '500+']

export const BUYER_OPTIONS: { value: string; label: string }[] = [
  { value: 'entry', label: 'First-time / entry-level' },
  { value: 'moveup', label: 'Move-up' },
  { value: 'luxury', label: 'Luxury / semi-custom' },
  { value: 'active_adult', label: 'Active adult (55+)' },
  { value: 'rental', label: 'Build-for-rent' },
]

export const SOFTWARE_OPTIONS: { value: string; label: string }[] = [
  { value: 'marksystems', label: 'MarkSystems' },
  { value: 'hyphen', label: 'Hyphen (BuildPro / SupplyPro)' },
  { value: 'buildertrend', label: 'Buildertrend' },
  { value: 'other_erp', label: 'Another construction ERP' },
  { value: 'spreadsheets', label: 'Mostly spreadsheets and accounting software' },
]

export interface Profile {
  buyer: string[]
  software: string
}

export function readProfile(answers?: Record<string, unknown> | null): Profile {
  const a = answers || {}
  const buyerRaw = typeof a[PROFILE_KEYS.buyer] === 'string' ? (a[PROFILE_KEYS.buyer] as string) : ''
  const software = typeof a[PROFILE_KEYS.software] === 'string' ? (a[PROFILE_KEYS.software] as string) : ''
  return {
    buyer: buyerRaw.split(',').map(s => s.trim()).filter(v => BUYER_OPTIONS.some(o => o.value === v)),
    software: SOFTWARE_OPTIONS.some(o => o.value === software) ? software : '',
  }
}

/** Profile values as answer entries (empty values are omitted). */
export function profileToAnswers(p: Profile): Record<string, string> {
  const out: Record<string, string> = {}
  if (p.buyer.length) out[PROFILE_KEYS.buyer] = p.buyer.join(',')
  if (p.software) out[PROFILE_KEYS.software] = p.software
  return out
}

/** True for answer keys that hold profile data rather than scored responses. */
export function isProfileKey(key: string): boolean {
  return key.startsWith('P.')
}

const BUYER_GUIDANCE: Record<string, string> = {
  entry: 'entry-level buyers value price and simplicity; spec cuts they will not notice are fair game',
  moveup: 'move-up buyers expect visible quality and choice; protect finishes and options they see',
  luxury: 'luxury buyers notice and value finish and flexibility; savings should come from process, supply chain, and structure rather than visible spec',
  active_adult: 'active-adult buyers value single-level convenience, accessibility, and service; protect warranty and communication',
  rental: 'build-for-rent owners value durability and low maintenance cost over finish choices',
}

export function describeProfile(p: Profile): string {
  const lines: string[] = []
  if (p.buyer.length) {
    const labels = p.buyer.map(v => BUYER_OPTIONS.find(o => o.value === v)?.label).filter(Boolean).join(', ')
    const guide = p.buyer.map(v => BUYER_GUIDANCE[v]).filter(Boolean).join('; ')
    lines.push(`- Buyer segments: ${labels}. When recommending cost reduction or spec changes, fit them to these buyers (${guide}). What one segment loves, another may hate.`)
  }
  if (p.software) {
    const label = SOFTWARE_OPTIONS.find(o => o.value === p.software)?.label
    lines.push(`- Main operating software: ${label}. Prefer getting more out of this platform before recommending new software.`)
  }
  return lines.join('\n')
}
