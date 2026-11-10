import { DateTime } from 'luxon'

export type CelestialBodyName = 'Sol' | 'Moon' | 'Mercury' | 'Venus' | 'Mars'

export interface PlanetVector {
  name: Exclude<CelestialBodyName, 'Moon'>
  degree: number
  distance: number
  inclination: number
}

export interface CelestialBodyState {
  name: CelestialBodyName
  degree: number
  distance: number
  inclination: number
  angularVelocityDegPerMs: number
}

export type AspectType = 'Conjunction' | 'Sextile' | 'Square' | 'Trine' | 'Opposition'

export interface ActiveAspect {
  bodyA: CelestialBodyName
  bodyB: CelestialBodyName
  type: AspectType
  exactAngle: 0 | 60 | 90 | 120 | 180
  separation: number
  orbDelta: number
}

export interface EventHorizon {
  eventTime: number
  deltaMs: number
  label: string
  kind: 'aspect' | 'sign-change'
  aspectType?: AspectType
}

const MILLIS_PER_DAY = 86_400_000
const EPOCH_2000_UTC = DateTime.fromISO('2000-01-01T12:00:00Z', { zone: 'utc' }).toMillis()
const SYNODIC_MONTH_DAYS = 29.53059

const ASPECT_DEFINITIONS: ReadonlyArray<{ type: AspectType; angle: 0 | 60 | 90 | 120 | 180 }> = [
  { type: 'Conjunction', angle: 0 },
  { type: 'Sextile', angle: 60 },
  { type: 'Square', angle: 90 },
  { type: 'Trine', angle: 120 },
  { type: 'Opposition', angle: 180 },
]

const PLANET_ORBIT_DATA: ReadonlyArray<{
  name: Exclude<CelestialBodyName, 'Moon'>
  orbitalPeriodDays: number
  distance: number
  phaseOffset: number
}> = [
  { name: 'Sol', orbitalPeriodDays: 365.256, distance: 1.95, phaseOffset: 0 },
  { name: 'Mercury', orbitalPeriodDays: 87.969, distance: 2.45, phaseOffset: 19 },
  { name: 'Venus', orbitalPeriodDays: 224.701, distance: 2.9, phaseOffset: 37 },
  { name: 'Mars', orbitalPeriodDays: 686.98, distance: 3.35, phaseOffset: 73 },
]

export function calculatePlanetVectors(targetTime: number): PlanetVector[] {
  const daysSinceEpoch = (targetTime - EPOCH_2000_UTC) / MILLIS_PER_DAY

  return PLANET_ORBIT_DATA.map((planet) =>
    buildVector(
      planet.name,
      daysSinceEpoch,
      planet.orbitalPeriodDays,
      planet.distance,
      planet.phaseOffset,
    ),
  )
}

export function buildCelestialBodyStates(
  targetTime: number,
  moonRotationDegrees: number,
): CelestialBodyState[] {
  const planetVectors = calculatePlanetVectors(targetTime)
  const planetStates: CelestialBodyState[] = planetVectors.map((vector) => {
    const orbit = PLANET_ORBIT_DATA.find((planet) => planet.name === vector.name)
    const periodDays = orbit?.orbitalPeriodDays ?? 365.256
    return {
      ...vector,
      angularVelocityDegPerMs: 360 / (periodDays * MILLIS_PER_DAY),
    }
  })

  const moonState: CelestialBodyState = {
    name: 'Moon',
    degree: normalizeDegrees(moonRotationDegrees),
    distance: 1.75,
    inclination: Math.sin((moonRotationDegrees * Math.PI) / 180) * 0.16,
    angularVelocityDegPerMs: 360 / (SYNODIC_MONTH_DAYS * MILLIS_PER_DAY),
  }

  return [...planetStates, moonState]
}

export function calculateActiveAspects(
  bodies: CelestialBodyState[],
  orbDegrees = 5,
): ActiveAspect[] {
  const aspects: ActiveAspect[] = []

  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const bodyA = bodies[i]
      const bodyB = bodies[j]
      const separation = shortestSeparation(bodyA.degree, bodyB.degree)

      let bestMatch: ActiveAspect | null = null

      for (const aspect of ASPECT_DEFINITIONS) {
        const orbDelta = Math.abs(separation - aspect.angle)
        if (orbDelta <= orbDegrees) {
          if (!bestMatch || orbDelta < bestMatch.orbDelta) {
            bestMatch = {
              bodyA: bodyA.name,
              bodyB: bodyB.name,
              type: aspect.type,
              exactAngle: aspect.angle,
              separation,
              orbDelta,
            }
          }
        }
      }

      if (bestMatch) {
        aspects.push(bestMatch)
      }
    }
  }

  return aspects.sort((a, b) => a.orbDelta - b.orbDelta)
}

export function calculateNextEventHorizon(
  targetTime: number,
  bodies: CelestialBodyState[],
): EventHorizon {
  const candidates: EventHorizon[] = []

  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const bodyA = bodies[i]
      const bodyB = bodies[j]
      const relSpeed = bodyB.angularVelocityDegPerMs - bodyA.angularVelocityDegPerMs

      if (Math.abs(relSpeed) < 1e-12) {
        continue
      }

      const currentSignedDiff = normalizeDegrees(bodyB.degree - bodyA.degree)

      for (const aspect of ASPECT_DEFINITIONS) {
        const targets =
          aspect.angle === 0 || aspect.angle === 180
            ? [aspect.angle]
            : [aspect.angle, 360 - aspect.angle]

        for (const target of targets) {
          const delta =
            relSpeed > 0
              ? normalizeDegrees(target - currentSignedDiff)
              : normalizeDegrees(currentSignedDiff - target)
          const deltaMs = delta / Math.abs(relSpeed)

          if (deltaMs > 0) {
            candidates.push({
              eventTime: targetTime + deltaMs,
              deltaMs,
              label: `${bodyA.name} ${aspect.type} ${bodyB.name}`,
              kind: 'aspect',
              aspectType: aspect.type,
            })
          }
        }
      }
    }
  }

  const sol = bodies.find((body) => body.name === 'Sol')
  if (sol && sol.angularVelocityDegPerMs > 0) {
    const nextBoundary = Math.ceil((sol.degree + 1e-6) / 30) * 30
    const normalizedBoundary = nextBoundary >= 360 ? nextBoundary - 360 : nextBoundary
    const delta = normalizeDegrees(normalizedBoundary - sol.degree)
    const safeDelta = delta === 0 ? 30 : delta
    const deltaMs = safeDelta / sol.angularVelocityDegPerMs
    candidates.push({
      eventTime: targetTime + deltaMs,
      deltaMs,
      label: 'Solar Sign Boundary Shift',
      kind: 'sign-change',
      aspectType: undefined,
    })
  }

  const next = candidates.reduce<EventHorizon | null>((closest, candidate) => {
    if (!closest || candidate.deltaMs < closest.deltaMs) {
      return candidate
    }
    return closest
  }, null)

  return (
    next ?? {
      eventTime: targetTime,
      deltaMs: 0,
      label: 'No upcoming event horizon',
      kind: 'sign-change',
      aspectType: undefined,
    }
  )
}

export function toTelemetryStatement(aspect: ActiveAspect): string {
  const prefix = `${aspect.bodyA} ${aspect.type} ${aspect.bodyB}`

  switch (aspect.type) {
    case 'Square':
      return `${prefix}: Friction is high. Expect tension, fast reactions, or disagreements. Slow down and think before responding.`
    case 'Opposition':
      return `${prefix}: Push-pull energy is strong. You may feel split between two priorities. Pick one clear priority and stay steady.`
    case 'Trine':
      return `${prefix}: Smooth energy and easy momentum. Great time for planning, writing, and productive conversations.`
    case 'Sextile':
      return `${prefix}: Helpful openings are available. Reach out, collaborate, and take the small win.`
    case 'Conjunction':
      return `${prefix}: Intense focus point. This theme is front and center right now, so use it intentionally.`
  }
}

function buildVector(
  name: PlanetVector['name'],
  daysSinceEpoch: number,
  orbitalPeriodDays: number,
  distance: number,
  phaseOffset: number,
): PlanetVector {
  const degree = normalizeDegrees((daysSinceEpoch / orbitalPeriodDays) * 360 + phaseOffset)
  const inclination = name === 'Sol' ? 0 : Math.sin((degree * Math.PI) / 180) * 0.26

  return {
    name,
    degree,
    distance,
    inclination,
  }
}

function normalizeDegrees(degrees: number): number {
  const normalized = degrees % 360
  return normalized < 0 ? normalized + 360 : normalized
}

function shortestSeparation(degreeA: number, degreeB: number): number {
  const diff = Math.abs(normalizeDegrees(degreeA - degreeB))
  return diff > 180 ? 360 - diff : diff
}
