import Anthropic from '@anthropic-ai/sdk'
import { calculateScores, getLevelFromScore, type DomainScore } from './scoring'
import { LEVEL_NAMES, getDomainsFor } from './maturityData'
import { describeProfile, readProfile } from './profile'

// Single source of truth for the recommendations engine.
// Used by /api/complete-assessment (first run) and /api/regenerate-recommendations (re-runs).

export const RECOMMENDATIONS_MODEL = 'claude-sonnet-5'

export interface CompanyInfo {
  company: string
  name: string
  title: string
  volume: string
  state: string
}

type DomainScores = ReturnType<typeof calculateScores>['domainScores']

function getNextLevel(currentLevel: string): string | null {
  const progression: Record<string, string> = { '-1': '0', '0': '1', '1': '2', '2': '3' }
  return progression[currentLevel] ?? null
}

export function identifyPriorityDomains(domainScores: DomainScores) {
  const scored = Object.values(domainScores).filter(d => d.answered > 0)
  const avg = scored.reduce((sum, d) => sum + d.pct, 0) / scored.length
  const sorted = [...scored].sort((a, b) => a.pct - b.pct)
  const spread = sorted[sorted.length - 1].pct - sorted[0].pct
  const isClustered = spread <= 15

  const priorityDomains = isClustered
    ? sorted.slice(0, 3)
    : sorted.filter(d => d.pct < 37.5 || d.pct < avg - 15).slice(0, 2)

  // Two focus domains within 10 points - parallel priorities (different teams, same timeframe)
  const twoDomainsClose = priorityDomains.length >= 2 &&
    (priorityDomains[1].pct - priorityDomains[0].pct) <= 10

  return { focusDomains: priorityDomains, isClustered, twoDomainsClose, avg: Math.round(avg) }
}

function describeVolume(volume: string): string {
  const n = parseInt(volume.replace(/[^0-9]/g, ''), 10)
  if (isNaN(n)) return 'Volume not stated \u2014 assume a small builder and keep recommendations lean.'
  if (n <= 10) return 'Small builder (roughly 1\u201310 homes/year). The owner is likely doing several jobs personally. Recommend low-cost, low-overhead moves: simple templates, one accountable person, no enterprise software purchases. Every action must be doable by a team of a handful of people.'
  if (n <= 50) return 'Mid-size builder (roughly 11\u201350 homes/year). Enough volume to justify defined roles, a purchasing function, and a real system of record, but still lean. Recommend process discipline and adoption of tools they likely already own before buying new ones.'
  if (n <= 200) return 'Growing production builder (roughly 51\u2013200 homes/year). Scale is creating pain wherever process is person-dependent. Recommend system-driven workflows, unit-price purchasing, trade partner scorecards, and clear owner/manager separation.'
  return 'Large production builder (200+ homes/year). Recommendations should assume dedicated department heads, an ERP, and the ability to fund integration and reporting work. Focus on consistency across divisions and management by exception.'
}

export function buildRecommendationsPrompt(
  companyInfo: CompanyInfo,
  domainScores: DomainScores,
  overall: number,
  answers: Record<string, string | null | undefined>
) {
  const DOMAINS = getDomainsFor(answers)
  const profile = readProfile(answers)
  const level = getLevelFromScore(overall)
  const sorted = Object.values(domainScores).filter(d => d.answered > 0).sort((a, b) => a.pct - b.pct)
  const highest = sorted[sorted.length - 1]
  const { focusDomains, isClustered, twoDomainsClose, avg } = identifyPriorityDomains(domainScores)
  const isFocus = (d: DomainScore) => !!focusDomains.find(f => f.domainKey === d.domainKey)

  // ---- Full response record: every answered item, with the exact description they chose ----
  let fullRecord = ''
  DOMAINS.forEach(domain => {
    const ds = domainScores[domain.key]
    if (!ds || ds.answered === 0) return
    fullRecord += `\n\n## ${domain.name} \u2014 ${ds.pct}% (${getLevelFromScore(ds.pct).name})${isFocus(ds) ? '  [FOCUS DOMAIN]' : ''}`
    domain.questions.forEach(q => {
      const ans = answers[q.id]
      if (ans === null || ans === undefined || ans === 'na') return
      fullRecord += `\n- ${q.label} -> Level ${ans} (${LEVEL_NAMES[ans]}): "${q.levels[ans]}"`
    })
  })

  // ---- Gap analysis for focus domains: current vs next level, full text, lowest first ----
  let gapAnalysis = ''
  DOMAINS.forEach(domain => {
    const ds = domainScores[domain.key]
    if (!ds || ds.answered === 0 || !isFocus(ds)) return

    const isPrimary = focusDomains[0].domainKey === ds.domainKey
    gapAnalysis += `\n\n### ${domain.name} \u2014 ${ds.pct}% (${getLevelFromScore(ds.pct).name})`
    gapAnalysis += twoDomainsClose ? ' <- PARALLEL PRIORITY' : isPrimary ? ' <- PRIMARY FOCUS' : ' <- SECONDARY (address after primary is moving)'

    const scoreMap: Record<string, number> = { '-1': 0, '0': 1, '1': 2, '2': 3, '3': 4 }
    const items = domain.questions
      .map(q => ({ q, ans: answers[q.id] }))
      .filter((x): x is { q: typeof x.q; ans: string } => typeof x.ans === 'string' && x.ans !== 'na')
      .sort((a, b) => (scoreMap[a.ans] ?? 0) - (scoreMap[b.ans] ?? 0))

    items.forEach(({ q, ans }) => {
      const next = getNextLevel(ans)
      if (!next) return
      gapAnalysis += `\n\n**${q.label}** (Level ${ans} ${LEVEL_NAMES[ans]} -> Level ${next} ${LEVEL_NAMES[next]})`
      gapAnalysis += `\nNow: ${q.levels[ans]}`
      gapAnalysis += `\nNext: ${q.levels[next]}`
    })
  })

  const domainSummary = sorted
    .map(d => `- ${d.domainName}: ${d.pct}% (${getLevelFromScore(d.pct).name})`)
    .join('\n')

  const focusContext = isClustered
    ? `All domains are within a narrow range (avg ${avg}%). No single domain is dramatically worse \u2014 focus on raising the floor across all areas.`
    : twoDomainsClose
    ? `Two domains are essentially tied at the bottom and should be treated as PARALLEL priorities: ${focusDomains.map(d => `${d.domainName} at ${d.pct}%`).join(' and ')}. These likely involve different teams so both can be worked simultaneously in the next 90 days.`
    : `One domain is clearly the primary focus: ${focusDomains[0]?.domainName} at ${focusDomains[0]?.pct}%. ${focusDomains.length > 1 ? `${focusDomains[1]?.domainName} at ${focusDomains[1]?.pct}% should be addressed after the primary is moving (days 90\u2013180).` : ''}`

  const domainSectionInstructions = focusDomains.map((fd, i) => {
    const timing = twoDomainsClose
      ? 'Next 90 Days'
      : i === 0
      ? 'First 90 Days'
      : `Days 90\u2013180 (after ${focusDomains[0].domainName} is moving)`

    return `
<h4>${twoDomainsClose ? 'Priority' : i === 0 ? 'Your #1 Priority' : 'Also Needs Attention'}: ${fd.domainName}</h4>
[One focused paragraph, 4\u20136 sentences. Name the 2\u20133 specific items where they scored lowest and say plainly what is happening today in their business because of it (missed closings, margin leakage, owner as bottleneck, trades that don't show, buyers who call the super \u2014 whatever the answers actually imply). Then describe what the next level looks like in practice. Connect it to money, time, or risk. Write like an advisor who has walked their jobsites, not a report generator.]

<h4>${fd.domainName} \u2014 Action Plan (${timing})</h4>
[4\u20135 numbered actions, most impactful first. Each action is one to two sentences and MUST include: the specific practice or artifact to put in place (e.g. a written trade partner onboarding packet, a unit-price catalog for the top 10 cost codes, a two-week look-ahead schedule sent every Friday), the role that owns it, and a concrete first step they can take this week. Actions must be sized to this builder's volume. Do not write "document your process" or "assign an owner" as an action on its own \u2014 say what to document and what the owner does with it. Format as a numbered list with <br/> between items.]

<h4>You'll Know You're There When... (${fd.domainName})</h4>
[3\u20134 observable milestones, each starting with "You'll know you're there when...". Each must be something the CEO could verify by walking into the office or onto a jobsite \u2014 a report that exists, a call that no longer happens, a meeting that runs without them. Derive from the "Next" descriptions but make them concrete and specific to this company's answers. No generic statements about "operating proactively."]`
  }).join('\n')

  const watchDomains = sorted.filter(d =>
    d.pct < overall - 10 && !isFocus(d) && d.domainKey !== highest?.domainKey
  )

  const watchInstructions = watchDomains.map(d => `
<h4>Also Watch: ${d.domainName} (${d.pct}%)</h4>
[One paragraph, 3\u20134 sentences. Name the 1\u20132 specific items dragging this domain down and give one concrete near-term action with an owner. This is a heads-up, not a full plan.]`).join('\n')

  return `You are a senior operations advisor to residential homebuilders, writing the recommendations section of a maturity assessment report for a CEO who paid for this and will judge the whole product by how specific and useful it is. Generic advice is a failure. Every sentence must be traceable to something in their actual answers below.

COMPANY
- ${companyInfo.company} \u2014 ${companyInfo.volume || 'volume not stated'} homes/year, ${companyInfo.state || 'location not stated'}
- Respondent: ${companyInfo.name}, ${companyInfo.title}
- Overall: ${overall}% \u2014 ${level.name} ("${level.sentiment}")
- Sizing guidance: ${describeVolume(companyInfo.volume)}
${describeProfile(profile)}

DOMAIN SCORES (lowest to highest)
${domainSummary}

${focusContext}
Strongest domain: ${highest?.domainName} at ${highest?.pct}%

====================
COMPLETE RESPONSE RECORD
Every item they answered, with the exact description they selected. Read all of it before writing. Look for contradictions between domains (for example a strong purchasing team but no trade partner onboarding, or a customer portal but no field documentation feeding it) \u2014 those contradictions are usually the most valuable insight in the report and should be called out by name.
${fullRecord}

====================
GAP ANALYSIS \u2014 FOCUS DOMAINS
Current level vs. the next level up, lowest-scoring items first. Use this as the backbone of the action plans. Translate into plain, practical language; never paste these descriptions verbatim.
${gapAnalysis}
====================

WRITE THE FOLLOWING SECTIONS, IN THIS ORDER, USING EXACTLY THESE HEADINGS. Output valid HTML using only <h4>, <p>, <strong>, and <br/> tags. No markdown, no preamble, no closing remarks.

<h4>Where You Stand</h4>
[3\u20134 sentences. Name their level and what it means day to day in a business their size. Name the single biggest operational constraint holding them back and where in their answers it shows up. If there is a striking contradiction in the response record, name it here. Be direct; do not flatter.]

<h4>Quick Wins (Next 30 Days)</h4>
[3 actions that cost little or nothing, can be done in the next month by the people they already have, and produce a visible result. Draw from the lowest-scoring items anywhere in the record, not only the focus domains. Each item: what to do, who does it, what changes as a result. Numbered list with <br/> between items.]
${domainSectionInstructions}

<h4>Protect Your Strength: ${highest?.domainName}</h4>
[2\u20133 sentences. Name specifically what they are doing well, based on their actual answers in that domain, and one concrete way that strength can be used to pull up a weaker domain.]
${watchInstructions}

<h4>Before Your Next Assessment</h4>
[2\u20133 sentences. Their reassessment is in six months. Tell them which two or three items, if moved up one level, would raise their overall score the most, and what score range that would put them in. Be specific about the item names.]

RULES
- Reference their answers by item name ("Trade Partner Onboarding", "Scheduling and Capacity Management"), not by number.
- Use the maturity level names (Anchor, Typical, Strategic Implementer, Adaptive Innovator, Guiding Star) where they help.
- Never write filler like "document your current process", "assign an owner", or "set a clear target" without saying exactly what to document, who the owner is, and what the target is.
- A builder can realistically execute a handful of things in six months. Prioritize ruthlessly; do not pad.
- Tone: direct, practical, respectful. Written for a homebuilder CEO by someone who has run a builder's operations.`
}

/**
 * Streams recommendations from the model. Calls onDelta with each text chunk as it arrives and
 * resolves with the full text. Throws on API failure or if the output isn't in the expected format.
 * Callers are responsible for persisting the result.
 */
export async function streamRecommendations(
  companyInfo: CompanyInfo,
  answers: Record<string, string | null | undefined>,
  onDelta: (text: string) => void
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[recommendations] ANTHROPIC_API_KEY is not set')
    throw new Error('ANTHROPIC_API_KEY missing')
  }

  const clean = Object.fromEntries(Object.entries(answers).filter(([, v]) => v !== null && v !== undefined)) as Record<string, string>
  const { domainScores, overall } = calculateScores(clean, getDomainsFor(clean))
  const prompt = buildRecommendationsPrompt(companyInfo, domainScores, overall, answers)

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const system = 'You write the recommendations section of an operational maturity report for a homebuilder CEO. Respond with the report content only: raw HTML fragments using <h4>, <p>, <strong> and <br/> tags. No Markdown, no code fences, no preamble or sign-off.'

  // Up to two attempts. If the first returns no visible text (for example the model spent its whole
  // budget thinking, or stopped early), retry once with thinking explicitly off and log why.
  let full = ''
  let lastInfo = ''
  for (let attempt = 1; attempt <= 2 && !full.trim(); attempt++) {
    full = ''
    try {
      const stream = anthropic.messages.stream({
        model: RECOMMENDATIONS_MODEL,
        max_tokens: 8000,
        ...(attempt === 2 ? { thinking: { type: 'disabled' as const } } : {}),
        system,
        messages: [{ role: 'user', content: prompt }],
      })
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          full += event.delta.text
          onDelta(event.delta.text)
        }
      }
      const final = await stream.finalMessage()
      if (!full.trim()) {
        // Fall back to any text blocks in the final message, in case deltas were missed.
        full = final.content.map(b => (b.type === 'text' ? b.text : '')).join('')
        if (full.trim()) onDelta(full)
      }
      lastInfo = `stop=${final.stop_reason}, blocks=${final.content.map(b => b.type).join('+') || 'none'}, out_tokens=${final.usage?.output_tokens}`
      if (!full.trim()) console.error(`[recommendations] attempt ${attempt} returned no text (${RECOMMENDATIONS_MODEL}): ${lastInfo}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[recommendations] attempt ${attempt} failed (${RECOMMENDATIONS_MODEL}):`, msg)
      if (attempt === 2 || full.trim()) throw new Error(msg)
      lastInfo = msg
    }
  }

  full = normalizeToHtml(full)
  if (!full) {
    console.error('[recommendations] model returned no text after retry:', lastInfo)
    throw new Error(`AI_EMPTY: ${lastInfo}`)
  }
  if (!full.includes('<h4>')) {
    console.error('[recommendations] unexpected output format. First 400 chars:', full.slice(0, 400))
    throw new Error('AI_BAD_FORMAT')
  }
  return full
}

/**
 * The model is asked for <h4>/<p> HTML, but if it answers in Markdown (headings, bold,
 * numbered lists, code fences) convert that to the same HTML so the report still renders.
 */
export function normalizeToHtml(raw: string): string {
  let text = raw.trim()
  if (!text) return ''
  // Strip ```html fences if present
  text = text.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/, '').trim()
  if (text.includes('<h4>')) return text

  const lines = text.split(/\r?\n/)
  const out: string[] = []
  let para: string[] = []
  const flush = () => {
    if (para.length === 0) return
    const inline = para
      .map(l => l.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'))
      .join('<br/>')
    out.push(`<p>${inline}</p>`)
    para = []
  }
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) { flush(); continue }
    const heading = line.match(/^#{1,6}\s+(.+?)\s*#*$/)
    if (heading) { flush(); out.push(`<h4>${heading[1].replace(/\*\*/g, '')}</h4>`); continue }
    // A short bold-only line is a heading too ("**Where You Stand**")
    const boldHeading = line.match(/^\*\*(.{3,80})\*\*:?$/)
    if (boldHeading) { flush(); out.push(`<h4>${boldHeading[1]}</h4>`); continue }
    // Bullets -> numbered-style lines inside one paragraph
    const bullet = line.match(/^[-*\u2022]\s+(.+)$/)
    para.push(bullet ? bullet[1] : line)
  }
  flush()
  return out.join('\n')
}
