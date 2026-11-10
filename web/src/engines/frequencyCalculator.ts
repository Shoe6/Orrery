import type { ActiveAspect } from './planetaryVectors'

/** Earth carrier wave harmonic baseline — audible octave anchor */
const BASELINE_HZ = 432.0

/**
 * φ − 1 ≈ 0.618 Hz per harmonic aspect (Golden Ratio conjugate).
 * Applied as a scalar step pulling the carrier toward the 528 Hz resonance field
 * for every Trine or Sextile in the active geometry.
 */
const PHI_HARMONIC_STEP = 0.618

export interface SystemicResonance {
  ambientHz: number
  variableState: string
  countermeasureHz: string
  countermeasureLabel: string
}

/**
 * Iterates through every active aspect and applies interference shifts to the
 * 432 Hz carrier wave, returning a precise two-decimal ambient frequency float.
 *
 * Shift rules per aspect:
 *   Square      → +13.5 Hz  (dissonant friction, mechanical tension)
 *   Opposition  → −10.5 Hz  (destructive interference, polar drain)
 *   Trine       → +φ−1 Hz   (harmonic pull toward 528 Hz resonance field)
 *   Sextile     → +φ−1 Hz   (cooperative harmonic flow)
 *   Conjunction → +22.0 Hz  (amplification spike, concentrated intensity)
 */
export function calculateSystemicFrequency(activeAspects: ActiveAspect[]): number {
  let freq = BASELINE_HZ

  for (const aspect of activeAspects) {
    switch (aspect.type) {
      case 'Square':
        freq += 13.5
        break
      case 'Opposition':
        freq -= 10.5
        break
      case 'Trine':
      case 'Sextile':
        freq += PHI_HARMONIC_STEP
        break
      case 'Conjunction':
        freq += 22.0
        break
    }
  }

  return parseFloat(freq.toFixed(2))
}

function getVariableState(ambientHz: number): string {
  if (ambientHz > 440) return 'High Tension / Calcination'
  if (ambientHz < 430) return 'Low Energy / Stagnation'
  return 'Harmonic / Coagulation'
}

function getCountermeasure(ambientHz: number): { hz: string; label: string } {
  if (ambientHz > 440) {
    return {
      hz: '396 Hz',
      label: 'Solfeggio UT + Brown Noise — dampen systemic friction',
    }
  }

  if (ambientHz < 430) {
    return {
      hz: '417 Hz',
      label: 'Solfeggio RE — break crystalline loops, facilitate change',
    }
  }

  return {
    hz: '528 Hz / 852 Hz',
    label: 'Alpha/Gamma binaural — amplify flow state',
  }
}

/** Primary export — returns the full resonance readout for UI and API injection. */
export function getSystemicResonance(activeAspects: ActiveAspect[]): SystemicResonance {
  const ambientHz = calculateSystemicFrequency(activeAspects)
  const countermeasure = getCountermeasure(ambientHz)

  return {
    ambientHz,
    variableState: getVariableState(ambientHz),
    countermeasureHz: countermeasure.hz,
    countermeasureLabel: countermeasure.label,
  }
}
