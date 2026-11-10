import { EVOLUTION_LAYERS, EvolutionLayer, EvolutionPhase } from '../types'
import type { ActiveAspect } from './planetaryVectors'
import type { OriginProfile } from '../types'

export function generateBriefing(
  profile: OriginProfile,
  layer: EvolutionLayer,
  sign: string,
  moonPhase: string,
  season: string,
  activeAspects: ActiveAspect[],
): string {
  const layerNumber = EVOLUTION_LAYERS.indexOf(layer) + 1

  let stateLine: string
  switch (getEvolutionPhase(layer)) {
    case EvolutionPhase.INTAKE:
      stateLine =
        'You are in a recharge phase. Pull back, rest, and gather information instead of forcing action.'
      break
    case EvolutionPhase.LOGIC:
      stateLine =
        'You are in a planning phase. Organize your priorities and make simple, practical decisions.'
      break
    case EvolutionPhase.MANIFESTATION:
      stateLine = 'You are in an action phase. Start what matters, move fast, and finish cleanly.'
      break
  }

  const environmentLine = buildEnvironmentLine(sign, moonPhase, season, getEvolutionPhase(layer))
  const directiveLine = buildDirective(layer, activeAspects)

  return (
    `STATE:\n${profile.name} is on layer ${layerNumber} (${layer}). ` +
    `${stateLine}\n\n` +
    `ENVIRONMENT:\n${sign} season. ${moonPhase} moon. ${season}. ${environmentLine}\n\n` +
    `DIRECTIVE:\n${directiveLine}`
  )
}

function buildEnvironmentLine(
  sign: string,
  moonPhase: string,
  season: string,
  phase: EvolutionPhase,
): string {
  let signFriction: string
  switch (sign) {
    case 'Aries':
    case 'Leo':
    case 'Sagittarius':
      signFriction = 'The pace is high and confidence is strong, but impatience can cause mistakes.'
      break
    case 'Taurus':
    case 'Virgo':
    case 'Capricorn':
      signFriction = 'The energy is steady and grounded. Good for practical work and follow-through.'
      break
    default:
      signFriction = 'Energy is building, but the environment is quiet. Good time to plan behind the scenes.'
      break
  }

  let moonVector: string
  switch (moonPhase) {
    case 'New':
      moonVector = 'Keep things simple and private. Start small and set your direction.'
      break
    case 'Waxing':
      moonVector = 'Momentum is rising. Build habits and move one step at a time.'
      break
    case 'Full':
      moonVector = 'Emotions and attention run high. Great visibility, but avoid overreacting.'
      break
    default:
      moonVector = 'Slow down and close loose ends. Wrap up what you already started.'
      break
  }

  let seasonalLoad: string
  switch (season) {
    case 'Spring':
      seasonalLoad = 'Spring favors fresh starts and trying new approaches.'
      break
    case 'Summer':
      seasonalLoad = 'Summer supports big output, but pace yourself to avoid burnout.'
      break
    case 'Autumn':
      seasonalLoad = 'Autumn is best for refining plans and cutting what is not working.'
      break
    default:
      seasonalLoad = 'Winter is ideal for rest, reflection, and resetting your priorities.'
      break
  }

  let phaseFriction: string
  switch (phase) {
    case EvolutionPhase.INTAKE:
      phaseFriction = 'This phase works best when you reduce noise and protect your energy.'
      break
    case EvolutionPhase.LOGIC:
      phaseFriction = 'This phase rewards clear structure, routines, and realistic planning.'
      break
    case EvolutionPhase.MANIFESTATION:
      phaseFriction = 'This phase favors focused action and visible progress.'
      break
  }

  return `${signFriction} ${moonVector} ${seasonalLoad} ${phaseFriction}`
}

function buildDirective(layer: EvolutionLayer, activeAspects: ActiveAspect[]): string {
  const hasFriction = activeAspects.some(
    (aspect) => aspect.type === 'Square' || aspect.type === 'Opposition',
  )
  const hasResonance = activeAspects.some(
    (aspect) => aspect.type === 'Trine' || aspect.type === 'Sextile',
  )
  const hasConjunction = activeAspects.some((aspect) => aspect.type === 'Conjunction')

  const alchemicalProtocol = hasFriction
    ? 'Calcination: Systemic friction detected. Do not force expansion. Use this heat to stress-test your existing architecture and burn off inefficiencies.'
    : hasResonance
      ? 'Coagulation: Systemic resonance detected. Frictionless environment. Network, build, and execute outward expansion.'
      : hasConjunction
        ? 'Distillation: Intensity is concentrated in one theme. Keep your focus tight and avoid distractions.'
        : 'Rhythm Check: Energy is mixed. Keep momentum steady and make practical, low-risk moves.'

  let layerDirective: string
  switch (layer) {
    case EvolutionLayer.VOID:
    case EvolutionLayer.OBSERVATION:
    case EvolutionLayer.CRYSTALLIZATION:
      layerDirective = 'Focus on yourself today. Hold off on big social events or launching new projects.'
      break

    case EvolutionLayer.SYNTAX:
    case EvolutionLayer.SYMMETRY:
    case EvolutionLayer.REFINEMENT:
      layerDirective =
        'Use this window to organize, plan, and clean up details before making a major move.'
      break

    case EvolutionLayer.RESONANCE:
    case EvolutionLayer.EXECUTION:
      layerDirective =
        'Take action now. Start the important task, keep momentum, and avoid overthinking.'
      break

    case EvolutionLayer.COMPLETION:
      layerDirective = 'Close the loop: finish what is open, communicate clearly, and lock in the result.'
      break
  }

  return `${layerDirective} ${alchemicalProtocol}`
}

function getEvolutionPhase(layer: EvolutionLayer): EvolutionPhase {
  switch (layer) {
    case EvolutionLayer.VOID:
    case EvolutionLayer.OBSERVATION:
    case EvolutionLayer.CRYSTALLIZATION:
      return EvolutionPhase.INTAKE
    case EvolutionLayer.SYNTAX:
    case EvolutionLayer.SYMMETRY:
    case EvolutionLayer.REFINEMENT:
      return EvolutionPhase.LOGIC
    case EvolutionLayer.RESONANCE:
    case EvolutionLayer.EXECUTION:
    case EvolutionLayer.COMPLETION:
      return EvolutionPhase.MANIFESTATION
  }
}
