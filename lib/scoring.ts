import { DOMAINS, LEVEL_SCORES } from './maturityData'

export interface MaturityLevel {
  key: string
  name: string
  sentiment: string
}

export interface DomainScore {
  pct: number
  answered: number
  total: number
  domainKey: string
  domainName: string
}

export interface ScoreResult {
  domainScores: Record<string, DomainScore>
  overall: number
  maturityLevel: MaturityLevel
  insufficientData: boolean
  answeredDomainCount: number
}

export function getLevelFromScore(pct: number): MaturityLevel {
  if (pct < 12.5) return { key: '-1', name: 'Anchor', sentiment: 'Shoot from the hip' }
  if (pct < 37.5) return { key: '0', name: 'Typical', sentiment: 'Re-Active' }
  if (pct < 62.5) return { key: '1', name: 'Strategic Implementer', sentiment: 'Pro-Active' }
  if (pct < 87.5) return { key: '2', name: 'Adaptive Innovator', sentiment: 'Management by Exception' }
  return { key: '3', name: 'Guiding Star', sentiment: 'Digitally Optimized' }
}

export function calculateScores(answers: Record<string, string | null>): ScoreResult {
  const domainScores: Record<string, DomainScore> = {}
  let answeredDomainCount = 0

  DOMAINS.forEach(domain => {
    const domainAnswers = domain.questions
      .map(q => answers[q.id])
      .filter(a => a !== undefined && a !== null && a !== 'na') as string[]

    if (domainAnswers.length === 0) {
      domainScores[domain.key] = {
        pct: 0,
        answered: 0,
        total: domain.questions.length,
        domainKey: domain.key,
        domainName: domain.name,
      }
      return
    }

    answeredDomainCount++
    const sum = domainAnswers.reduce((acc, a) => acc + (LEVEL_SCORES[a] ?? 0), 0)
    const pct = Math.round(sum / domainAnswers.length)
    domainScores[domain.key] = {
      pct,
      answered: domainAnswers.length,
      total: domain.questions.length,
      domainKey: domain.key,
      domainName: domain.name,
    }
  })

  const domainPcts = Object.values(domainScores)
    .filter(d => d.answered > 0)
    .map(d => d.pct)

  const overall =
    domainPcts.length > 0
      ? Math.round(domainPcts.reduce((a, b) => a + b, 0) / domainPcts.length)
      : 0

  const safeOverall = isNaN(overall) ? 0 : overall
  const insufficientData = answeredDomainCount < 4
  const maturityLevel = getLevelFromScore(safeOverall)

  return { domainScores, overall: safeOverall, maturityLevel, insufficientData, answeredDomainCount }
}
