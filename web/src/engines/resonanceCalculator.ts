import { DateTime } from 'luxon'
import { EvolutionLayer, EvolutionPhase } from '../types'
import type { OriginProfile } from '../types'
import { EvolutionEngine } from './evolutionEngine'

export interface ResonanceScores {
  selfScore: number
  moneyScore: number
  relationshipScore: number
}

export function calculateResonance(
  layer: EvolutionLayer,
  phase: EvolutionPhase,
  targetTime: number = Date.now(),
  profile: OriginProfile | null = null,
): ResonanceScores {
  let base: ResonanceScores

  switch (phase) {
    case EvolutionPhase.INTAKE:
      base = intakeScores(layer)
      break
    case EvolutionPhase.LOGIC:
      base = logicScores(layer)
      break
    case EvolutionPhase.MANIFESTATION:
      base = manifestationScores(layer)
      break
  }

  const zodiacSign = EvolutionEngine.getZodiacSign(targetTime, profile)
  const withCelestialMultiplier = applyCelestialMultiplier(base, zodiacSign)

  const adjustedNow = targetTime + EvolutionEngine.timeOffsetMillis
  const zoned = DateTime.fromMillis(adjustedNow, { zone: 'utc' }).setZone('America/New_York')
  const isWeekOfPower = zoned.month === 4 && zoned.day >= 19 && zoned.day <= 25

  if (isWeekOfPower) {
    return {
      selfScore: boostScore(withCelestialMultiplier.selfScore),
      moneyScore: boostScore(withCelestialMultiplier.moneyScore),
      relationshipScore: boostScore(withCelestialMultiplier.relationshipScore),
    }
  }

  return withCelestialMultiplier
}

function applyCelestialMultiplier(scores: ResonanceScores, zodiacSign: string): ResonanceScores {
  const selfMultiplier = EvolutionEngine.isEarthSign(zodiacSign) ? 1.1 : 1.0
  const moneyMultiplier = EvolutionEngine.isFireSign(zodiacSign) ? 1.1 : 1.0

  return {
    selfScore: clamp(Math.trunc(scores.selfScore * selfMultiplier), 0, 100),
    moneyScore: clamp(Math.trunc(scores.moneyScore * moneyMultiplier), 0, 100),
    relationshipScore: clamp(scores.relationshipScore, 0, 100),
  }
}

function intakeScores(layer: EvolutionLayer): ResonanceScores {
  switch (layer) {
    case EvolutionLayer.VOID:
      return { selfScore: 100, moneyScore: 35, relationshipScore: 20 }
    case EvolutionLayer.OBSERVATION:
      return { selfScore: 92, moneyScore: 42, relationshipScore: 30 }
    case EvolutionLayer.CRYSTALLIZATION:
      return { selfScore: 84, moneyScore: 50, relationshipScore: 40 }
    default:
      return { selfScore: 85, moneyScore: 45, relationshipScore: 30 }
  }
}

function logicScores(layer: EvolutionLayer): ResonanceScores {
  switch (layer) {
    case EvolutionLayer.SYNTAX:
      return { selfScore: 60, moneyScore: 82, relationshipScore: 55 }
    case EvolutionLayer.SYMMETRY:
      return { selfScore: 60, moneyScore: 90, relationshipScore: 58 }
    case EvolutionLayer.REFINEMENT:
      return { selfScore: 60, moneyScore: 100, relationshipScore: 62 }
    default:
      return { selfScore: 60, moneyScore: 88, relationshipScore: 58 }
  }
}

function manifestationScores(layer: EvolutionLayer): ResonanceScores {
  switch (layer) {
    case EvolutionLayer.RESONANCE:
      return { selfScore: 70, moneyScore: 72, relationshipScore: 82 }
    case EvolutionLayer.EXECUTION:
      return { selfScore: 74, moneyScore: 84, relationshipScore: 90 }
    case EvolutionLayer.COMPLETION:
      return { selfScore: 78, moneyScore: 95, relationshipScore: 100 }
    default:
      return { selfScore: 72, moneyScore: 80, relationshipScore: 88 }
  }
}

function boostScore(value: number): number {
  return clamp(value + 15, 0, 100)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
