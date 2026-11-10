export interface OriginProfile {
  id: string
  name: string
  birthDate: string
  birthTime: string
  latitude: number
  longitude: number
}

export const EvolutionPhase = {
  INTAKE: 'INTAKE',
  LOGIC: 'LOGIC',
  MANIFESTATION: 'MANIFESTATION',
} as const

export type EvolutionPhase = (typeof EvolutionPhase)[keyof typeof EvolutionPhase]

export const EvolutionLayer = {
  VOID: 'VOID',
  OBSERVATION: 'OBSERVATION',
  CRYSTALLIZATION: 'CRYSTALLIZATION',
  SYNTAX: 'SYNTAX',
  SYMMETRY: 'SYMMETRY',
  REFINEMENT: 'REFINEMENT',
  RESONANCE: 'RESONANCE',
  EXECUTION: 'EXECUTION',
  COMPLETION: 'COMPLETION',
} as const

export type EvolutionLayer = (typeof EvolutionLayer)[keyof typeof EvolutionLayer]

export const EVOLUTION_LAYERS: EvolutionLayer[] = [
  EvolutionLayer.VOID,
  EvolutionLayer.OBSERVATION,
  EvolutionLayer.CRYSTALLIZATION,
  EvolutionLayer.SYNTAX,
  EvolutionLayer.SYMMETRY,
  EvolutionLayer.REFINEMENT,
  EvolutionLayer.RESONANCE,
  EvolutionLayer.EXECUTION,
  EvolutionLayer.COMPLETION,
]

export function getEvolutionPhase(layer: EvolutionLayer): EvolutionPhase {
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
