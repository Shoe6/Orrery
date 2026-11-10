import { Billboard, Html, Line, OrbitControls, Stars, Text } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useMemo, useState } from 'react'
import { AdditiveBlending, Color, DoubleSide, Vector3 } from 'three'
import type { ActiveAspect, CelestialBodyName } from '../engines/planetaryVectors'
import type { PlanetVector } from '../engines/planetaryVectors'
import type { ResonanceScores } from '../engines/resonanceCalculator'
import { EvolutionLayer } from '../types'
import type { EvolutionLayer as EvolutionLayerType, OriginProfile } from '../types'

const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const

const ZODIAC_GLYPHS: Record<(typeof ZODIAC_SIGNS)[number], string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
}

const PLANET_GLYPHS: Record<'Sol' | 'Moon' | 'Mercury' | 'Venus' | 'Mars', string> = {
  Sol: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
}

const PLANET_RULE_BY_SIGN: Record<string, PlanetVector['name'] | 'Moon' | null> = {
  Aries: 'Mars',
  Taurus: 'Venus',
  Gemini: 'Mercury',
  Cancer: 'Moon',
  Leo: 'Sol',
  Virgo: 'Mercury',
  Libra: 'Venus',
  Scorpio: 'Mars',
  Sagittarius: null,
  Capricorn: null,
  Aquarius: null,
  Pisces: null,
}

interface GeocentricOrrery3DProps {
  activeProfile: OriginProfile
  layer: EvolutionLayerType
  sign: string
  moonPhase: string
  moonRotationDegrees: number
  planetVectors: PlanetVector[]
  resonanceScores: ResonanceScores
  activeAspects: ActiveAspect[]
}

export function GeocentricOrrery3D({
  activeProfile,
  layer,
  sign,
  moonPhase,
  moonRotationDegrees,
  planetVectors,
  resonanceScores,
  activeAspects,
}: GeocentricOrrery3DProps) {
  return (
    <div className="geocentric-shell">
      <Canvas camera={{ position: [0, 2.2, 8.4], fov: 42 }}>
        <color attach="background" args={['#05080c']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 6, 5]} intensity={2.3} color="#8df8ff" />
        <pointLight position={[-6, -2, -5]} intensity={1.25} color="#ffd788" />

        <Stars radius={70} depth={32} count={1300} factor={2.6} saturation={0} fade speed={0.3} />

        <EarthCore profile={activeProfile} />
        <ConcentricRings
          latitude={activeProfile.latitude}
          longitude={activeProfile.longitude}
          moonRotationDegrees={moonRotationDegrees}
        />
        <ZodiacRing sign={sign} />
        <PlanetaryVectors
          sign={sign}
          moonRotationDegrees={moonRotationDegrees}
          planetVectors={planetVectors}
          activeAspects={activeAspects}
        />
        <ResonanceGeometry layer={layer} resonanceScores={resonanceScores} />

        <OrbitControls
          enableRotate
          enableZoom
          enablePan={false}
          minDistance={5.6}
          maxDistance={10}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          autoRotate={false}
        />
      </Canvas>

      <div className="orerry-hud">
        <span>{`${sign} Season`}</span>
        <span>{`Moon ${moonPhase}`}</span>
      </div>
    </div>
  )
}

function EarthCore({ profile }: { profile: OriginProfile }) {
  const lat = profile.latitude
  const lon = profile.longitude

  // Rotate Earth on Y so user's longitude faces the camera (+Z direction)
  const earthYRotation = degToRad(90 - lon)

  const markerPos = useMemo(() => latLonToCartesian(lat, lon, 1.056), [lat, lon])
  const beamEnd = useMemo(() => latLonToCartesian(lat, lon, 1.52), [lat, lon])

  const graticule = useMemo(
    () => ({
      latLines: [-60, -30, 0, 30, 60].map((latVal) => ({
        latVal,
        points: createLatParallel(latVal, 1.008),
      })),
      lonLines: Array.from({ length: 12 }, (_, i) => -180 + i * 30).map((lonVal) => ({
        lonVal,
        points: createLonMeridian(lonVal, 1.008),
      })),
    }),
    [],
  )

  return (
    <group rotation={[0, earthYRotation, 0]}>
      {/* Solid sphere */}
      <mesh>
        <sphereGeometry args={[1, 64, 48]} />
        <meshStandardMaterial
          color="#0a1820"
          emissive="#051218"
          emissiveIntensity={0.5}
          metalness={0.12}
          roughness={0.85}
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Latitude parallels at 30° intervals */}
      {graticule.latLines.map(({ latVal, points }) => (
        <Line
          key={`lat-${latVal}`}
          points={points}
          color="#7dfbff"
          lineWidth={latVal === 0 ? 1.3 : 0.92}
          transparent
          opacity={latVal === 0 ? 0.78 : 0.56}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      ))}

      {/* Longitude meridians at 30° intervals */}
      {graticule.lonLines.map(({ lonVal, points }) => (
        <Line
          key={`lon-${lonVal}`}
          points={points}
          color="#7dfbff"
          lineWidth={0.82}
          transparent
          opacity={0.52}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      ))}

      {/* Origin beacon — gold core */}
      <mesh position={markerPos}>
        <sphereGeometry args={[0.055, 20, 20]} />
        <meshBasicMaterial color="#ffd788" />
      </mesh>

      {/* Inner amber glow */}
      <mesh position={markerPos}>
        <sphereGeometry args={[0.11, 20, 20]} />
        <meshBasicMaterial color="#ffaa22" transparent opacity={0.42} blending={AdditiveBlending} />
      </mesh>

      {/* Outer diffuse halo */}
      <mesh position={markerPos}>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshBasicMaterial color="#ff7700" transparent opacity={0.12} blending={AdditiveBlending} />
      </mesh>

      {/* Radial beam from core to just above surface */}
      <Line
        points={[[0, 0, 0], beamEnd]}
        color="#ffd788"
        lineWidth={1.1}
        transparent
        opacity={0.58}
        blending={AdditiveBlending}
        depthWrite={false}
        depthTest={false}
      />

      {/* Light source at marker for surface illumination */}
      <pointLight position={markerPos} intensity={1.8} color="#ffcc44" distance={2.5} decay={2} />
    </group>
  )
}

function ConcentricRings({
  latitude,
  longitude,
  moonRotationDegrees,
}: {
  latitude: number
  longitude: number
  moonRotationDegrees: number
}) {
  const ringARotation: [number, number, number] = [
    degToRad(90 - latitude),
    degToRad(longitude),
    degToRad(moonRotationDegrees * 0.18),
  ]
  const ringBRotation: [number, number, number] = [
    degToRad(latitude * 0.45),
    degToRad(-longitude * 0.85),
    degToRad(moonRotationDegrees * 0.36),
  ]
  const ringCRotation: [number, number, number] = [
    degToRad(22.5 + latitude * 0.2),
    degToRad(longitude * 0.35),
    degToRad(-moonRotationDegrees * 0.54),
  ]

  return (
    <group>
      <mesh rotation={ringARotation}>
        <torusGeometry args={[1.95, 0.012, 18, 190]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={2}
          transparent
          opacity={0.52}
          blending={AdditiveBlending}
          depthWrite={false}
          metalness={0.1}
          roughness={0.2}
        />
      </mesh>
      <mesh rotation={ringBRotation}>
        <torusGeometry args={[2.5, 0.011, 16, 190]} />
        <meshStandardMaterial
          color="#7b68ee"
          emissive="#7b68ee"
          emissiveIntensity={1.2}
          transparent
          opacity={0.44}
          blending={AdditiveBlending}
          depthWrite={false}
          metalness={0.08}
          roughness={0.25}
        />
      </mesh>
      <mesh rotation={ringCRotation}>
        <torusGeometry args={[3.05, 0.01, 16, 210]} />
        <meshBasicMaterial color="#94fbff" transparent opacity={0.22} />
      </mesh>
    </group>
  )
}

function ZodiacRing({ sign }: { sign: string }) {
  const signIndex = Math.max(0, ZODIAC_SIGNS.indexOf(sign as (typeof ZODIAC_SIGNS)[number]))
  const sectorDegrees = 360 / ZODIAC_SIGNS.length

  // Active sign sector is rotated to the Vernal Equinox direction (+X axis).
  const ringRotation = degToRad(-signIndex * sectorDegrees)

  const sectorPoints = useMemo(() => {
    const points: [number, number, number][] = []
    const outerRadius = 3.5
    const start = -sectorDegrees / 2
    const end = sectorDegrees / 2
    for (let d = start; d <= end; d += 2) {
      const angle = degToRad(d)
      points.push([Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius, 0])
    }
    return points
  }, [sectorDegrees])

  return (
    <group rotation={[Math.PI / 2, 0, ringRotation]}>
      <mesh>
        <ringGeometry args={[3.35, 3.7, 128, 1]} />
        <meshBasicMaterial color="#6cf6ff" transparent opacity={0.22} side={DoubleSide} />
      </mesh>

      {Array.from({ length: 12 }, (_, i) => {
        const angle = degToRad(i * sectorDegrees)
        return (
          <group key={ZODIAC_SIGNS[i]}>
            <Line
              points={[
                [Math.cos(angle) * 3.35, Math.sin(angle) * 3.35, 0],
                [Math.cos(angle) * 3.72, Math.sin(angle) * 3.72, 0],
              ]}
              color="#8ff8ff"
              lineWidth={1}
              transparent
              opacity={0.4}
            />
            <Billboard position={[Math.cos(angle) * 3.94, Math.sin(angle) * 3.94, 0]}>
              <Text
                fontSize={0.22}
                color={i === signIndex ? '#ffe3a1' : '#b9f6ff'}
                anchorX="center"
                anchorY="middle"
              >
                {ZODIAC_GLYPHS[ZODIAC_SIGNS[i]]}
              </Text>
            </Billboard>
          </group>
        )
      })}

      <Line
        points={sectorPoints}
        color="#ffd788"
        lineWidth={1.8}
        transparent
        opacity={0.92}
        blending={AdditiveBlending}
      />
    </group>
  )
}

function PlanetaryVectors({
  sign,
  moonRotationDegrees,
  planetVectors,
  activeAspects,
}: {
  sign: string
  moonRotationDegrees: number
  planetVectors: PlanetVector[]
  activeAspects: ActiveAspect[]
}) {
  const activeRuler = PLANET_RULE_BY_SIGN[sign] ?? null
  const [hoveredAspectKey, setHoveredAspectKey] = useState<string | null>(null)
  const moonAngle = degToRad(moonRotationDegrees)
  const moonEndpoint = new Vector3(Math.cos(moonAngle) * 1.75, 0.12, Math.sin(moonAngle) * 1.75)

  const vectorsWithMoon = [
    ...planetVectors,
    {
      name: 'Moon' as const,
      degree: moonRotationDegrees,
      distance: 1.75,
      inclination: 0.12,
      endpoint: moonEndpoint,
    },
  ]

  const endpointLookup = new Map<CelestialBodyName, Vector3>()
  vectorsWithMoon.forEach((vector) => {
    const endpoint =
      'endpoint' in vector
        ? vector.endpoint
        : new Vector3(
            Math.cos(degToRad(vector.degree)) * vector.distance,
            vector.inclination,
            Math.sin(degToRad(vector.degree)) * vector.distance,
          )
    endpointLookup.set(vector.name, endpoint)
  })

  return (
    <group>
      {vectorsWithMoon.map((vector) => {
        const endpoint =
          'endpoint' in vector
            ? vector.endpoint
            : new Vector3(
                Math.cos(degToRad(vector.degree)) * vector.distance,
                vector.inclination,
                Math.sin(degToRad(vector.degree)) * vector.distance,
              )

        const isActive = vector.name === activeRuler || vector.name === 'Sol'
        const color = isActive ? new Color('#ffe3a1') : new Color('#6ff7ff')

        return (
          <group key={vector.name}>
            <Line
              points={[[0, 0, 0], endpoint.toArray()]}
              color={color}
              lineWidth={isActive ? 1.95 : 1.3}
              transparent
              opacity={isActive ? 0.98 : 0.68}
            />
            <mesh position={endpoint.toArray()}>
              <sphereGeometry args={[isActive ? 0.058 : 0.04, 14, 14]} />
              <meshBasicMaterial
                color={isActive ? '#ffe9bb' : '#7bf6ff'}
                transparent
                opacity={isActive ? 0.92 : 0.74}
              />
            </mesh>
            <Billboard position={endpoint.clone().multiplyScalar(1.06).toArray()}>
              <Text
                fontSize={0.22}
                color={isActive ? '#ffe3a1' : '#c8fbff'}
                anchorX="center"
                anchorY="middle"
              >
                {PLANET_GLYPHS[vector.name]}
              </Text>
            </Billboard>
          </group>
        )
      })}

      {activeAspects.map((aspect) => {
        const start = endpointLookup.get(aspect.bodyA)
        const end = endpointLookup.get(aspect.bodyB)

        if (!start || !end) {
          return null
        }

        const aspectKey = `${aspect.bodyA}-${aspect.type}-${aspect.bodyB}`
        const midpoint = start.clone().add(end).multiplyScalar(0.5).add(new Vector3(0, 0.08, 0))
        const tooltipTone = aspectTooltipTone(aspect.type)

        return (
          <group key={aspectKey}>
            <Line
              points={[start.toArray(), end.toArray()]}
              color={aspectColor(aspect.type)}
              lineWidth={2.2}
              transparent
              opacity={0.88}
              blending={AdditiveBlending}
              depthWrite={false}
              depthTest={false}
              onPointerOver={(event) => {
                event.stopPropagation()
                setHoveredAspectKey(aspectKey)
              }}
              onPointerOut={(event) => {
                event.stopPropagation()
                setHoveredAspectKey((current) => (current === aspectKey ? null : current))
              }}
            />
            {hoveredAspectKey === aspectKey && (
              <Html position={midpoint.toArray()} center distanceFactor={8.2}>
                <div className={`aspect-tooltip ${tooltipTone}`}>{aspectTooltipText(aspect.type)}</div>
              </Html>
            )}
          </group>
        )
      })}
    </group>
  )
}

function ResonanceGeometry({
  layer,
  resonanceScores,
}: {
  layer: EvolutionLayerType
  resonanceScores: ResonanceScores
}) {
  const peak = Math.max(resonanceScores.selfScore, resonanceScores.moneyScore, resonanceScores.relationshipScore)

  if (peak <= 85) {
    return null
  }

  const shapeSides =
    layer === EvolutionLayer.VOID
      ? 9
      : resonanceScores.selfScore > 85
        ? 3
        : resonanceScores.moneyScore > 85
          ? 6
          : 5

  const basePoints = createRegularPolygon(shapeSides, 1.45).map(
    ([x, y, z]) => [x, y, z] as [number, number, number],
  )
  const points = [...basePoints, basePoints[0]]
  const color = resonanceScores.selfScore > 85 ? '#f6fcff' : '#74f9ff'

  return (
    <group rotation={[Math.PI / 2.7, Math.PI / 5.2, 0]}>
      <Line
        points={points}
        color={color}
        lineWidth={2.1}
        transparent
        opacity={0.86}
        blending={AdditiveBlending}
        depthWrite={false}
        depthTest={false}
      />
    </group>
  )
}

function createRegularPolygon(sides: number, radius: number): [number, number, number][] {
  const points: [number, number, number][] = []
  for (let i = 0; i < sides; i += 1) {
    const angle = ((Math.PI * 2) / sides) * i - Math.PI / 2
    points.push([Math.cos(angle) * radius, Math.sin(angle) * radius, 0])
  }
  return points
}

function latLonToCartesian(lat: number, lon: number, radius: number): [number, number, number] {
  const φ = degToRad(lat)
  const λ = degToRad(lon)
  return [
    radius * Math.cos(φ) * Math.cos(λ),
    radius * Math.sin(φ),
    radius * Math.cos(φ) * Math.sin(λ),
  ]
}

function createLatParallel(lat: number, radius: number): [number, number, number][] {
  const φ = degToRad(lat)
  const points: [number, number, number][] = []
  for (let lon = -180; lon <= 180; lon += 5) {
    const λ = degToRad(lon)
    points.push([
      radius * Math.cos(φ) * Math.cos(λ),
      radius * Math.sin(φ),
      radius * Math.cos(φ) * Math.sin(λ),
    ])
  }
  return points
}

function createLonMeridian(lon: number, radius: number): [number, number, number][] {
  const λ = degToRad(lon)
  const points: [number, number, number][] = []
  for (let lat = -90; lat <= 90; lat += 5) {
    const φ = degToRad(lat)
    points.push([
      radius * Math.cos(φ) * Math.cos(λ),
      radius * Math.sin(φ),
      radius * Math.cos(φ) * Math.sin(λ),
    ])
  }
  return points
}

function degToRad(value: number): number {
  return (value * Math.PI) / 180
}

function aspectColor(type: ActiveAspect['type']): string {
  switch (type) {
    case 'Conjunction':
      return '#f2f7ff'
    case 'Sextile':
      return '#76ffd7'
    case 'Trine':
      return '#5affea'
    case 'Square':
      return '#ff5d5d'
    case 'Opposition':
      return '#ff3f52'
  }
}

function aspectTooltipText(type: ActiveAspect['type']): string {
  switch (type) {
    case 'Square':
    case 'Opposition':
      return '[Tetrahedron/Cube] Friction / Calcination'
    case 'Trine':
    case 'Sextile':
      return '[Octahedron] Flow / Coagulation'
    case 'Conjunction':
      return '[Sphere] Intensity / Distillation'
  }
}

function aspectTooltipTone(type: ActiveAspect['type']): 'friction' | 'flow' | 'intensity' {
  switch (type) {
    case 'Square':
    case 'Opposition':
      return 'friction'
    case 'Trine':
    case 'Sextile':
      return 'flow'
    case 'Conjunction':
      return 'intensity'
  }
}
