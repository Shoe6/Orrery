import { DateTime } from 'luxon'
import { useEffect, useMemo, useState } from 'react'
import { GemiTerminal } from './GemiTerminal.tsx'
import { GeocentricOrrery3D } from './GeocentricOrrery3D'
import {
  type ActiveAspect,
  buildCelestialBodyStates,
  calculateActiveAspects,
  calculateNextEventHorizon,
  calculatePlanetVectors,
  toTelemetryStatement,
} from '../engines/planetaryVectors'
import { generateBriefing } from '../engines/narrativeGenerator'
import { calculateResonance } from '../engines/resonanceCalculator'
import { getSystemicResonance } from '../engines/frequencyCalculator'
import { EvolutionEngine } from '../engines/evolutionEngine'
import { EVOLUTION_LAYERS, getEvolutionPhase } from '../types'
import type { OriginProfile } from '../types'

const MILLIS_PER_DAY = 86_400_000
const MIN_OFFSET_DAYS = -16_500
const MAX_OFFSET_DAYS = 16_500
const TARGET_ZONE = 'America/New_York'

type DriveMode = 'relative' | 'absolute'

interface DashboardScreenProps {
  profiles: OriginProfile[]
  selectedProfile: OriginProfile | null
  onProfileSelected: (profileId: string) => void
  onOpenProfileManager: () => void
}

export function DashboardScreen({
  profiles,
  selectedProfile,
  onProfileSelected,
  onOpenProfileManager,
}: DashboardScreenProps) {
  const todayIso = useMemo(() => DateTime.now().setZone(TARGET_ZONE).toISODate() ?? '', [])
  const [driveMode, setDriveMode] = useState<DriveMode>('relative')
  const [timeOffsetDays, setTimeOffsetDays] = useState(0)
  const [targetDate, setTargetDate] = useState(todayIso)
  const [targetLat, setTargetLat] = useState(43.0398)
  const [targetLon, setTargetLon] = useState(-77.093)
  const [targetTime, setTargetTime] = useState(() => Date.now())
  const [eventClockTime, setEventClockTime] = useState(() => Date.now())
  const [isTelemetryCollapsed, setTelemetryCollapsed] = useState(false)
  const [isMetricsCollapsed, setMetricsCollapsed] = useState(false)

  const defaultProfile = useMemo<OriginProfile>(
    () => ({
      id: 'default-origin',
      name: 'Default Origin',
      birthDate: '1981-04-24',
      birthTime: '07:36',
      latitude: 43.0398,
      longitude: -77.093,
    }),
    [],
  )

  const activeProfile = selectedProfile ?? defaultProfile

  useEffect(() => {
    setTargetLat(activeProfile.latitude)
    setTargetLon(activeProfile.longitude)
  }, [activeProfile.id, activeProfile.latitude, activeProfile.longitude])

  const offsetMillis = Math.round(timeOffsetDays * MILLIS_PER_DAY)
  const absoluteTargetTime = useMemo(() => {
    const absoluteDateTime = DateTime.fromISO(targetDate, { zone: TARGET_ZONE }).startOf('day')
    return absoluteDateTime.isValid ? absoluteDateTime.toMillis() : Date.now()
  }, [targetDate])

  useEffect(() => {
    const isRealTimeNow = driveMode === 'relative' && Math.abs(timeOffsetDays) < 0.0001

    if (isRealTimeNow) {
      setTargetTime(Date.now())
      const id = window.setInterval(() => setTargetTime(Date.now()), 1000)
      return () => window.clearInterval(id)
    }

    if (driveMode === 'relative') {
      setTargetTime(Date.now() + offsetMillis)
      return
    }

    setTargetTime(absoluteTargetTime)
  }, [absoluteTargetTime, driveMode, offsetMillis, timeOffsetDays])

  useEffect(() => {
    setEventClockTime(targetTime)
  }, [targetTime])

  useEffect(() => {
    const id = window.setInterval(() => {
      setEventClockTime((previous) => previous + 1000)
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  EvolutionEngine.timeOffsetMillis = 0

  const displayDateTime =
    driveMode === 'absolute'
      ? DateTime.fromMillis(targetTime, { zone: 'utc' }).setZone(TARGET_ZONE)
      : DateTime.fromMillis(targetTime, { zone: 'utc' }).setZone(TARGET_ZONE)

  const absoluteOverrideProfile: OriginProfile = {
    ...activeProfile,
    latitude: targetLat,
    longitude: targetLon,
  }

  const celestialProfile = driveMode === 'absolute' ? absoluteOverrideProfile : activeProfile

  const currentLayer = EvolutionEngine.calculateLayer(targetTime, activeProfile)
  const moonRotationDegrees = EvolutionEngine.calculateMoonRotationDegrees(targetTime, celestialProfile)
  const moonPhaseName = EvolutionEngine.calculateMoonPhaseName(targetTime, celestialProfile)
  const zodiacSign = EvolutionEngine.getZodiacSign(targetTime, celestialProfile)
  const seasonName = EvolutionEngine.getSeason(targetTime, celestialProfile)

  const resonanceScores = calculateResonance(
    currentLayer,
    getEvolutionPhase(currentLayer),
    targetTime,
    celestialProfile,
  )
  const planetVectors = calculatePlanetVectors(targetTime)
  const activeBodies = buildCelestialBodyStates(targetTime, moonRotationDegrees)
  const activeAspects = calculateActiveAspects(activeBodies, 5)
  const telemetryVariables = activeAspects.map((aspect) => ({
    key: `${aspect.bodyA}-${aspect.type}-${aspect.bodyB}`,
    aspectType: aspect.type,
    text: toTelemetryStatement(aspect),
  }))

  const eventClockMoonRotation = EvolutionEngine.calculateMoonRotationDegrees(
    eventClockTime,
    celestialProfile,
  )
  const eventBodies = buildCelestialBodyStates(eventClockTime, eventClockMoonRotation)
  const eventHorizon = calculateNextEventHorizon(eventClockTime, eventBodies)
  const horizonRemainingMs = Math.max(0, Math.round(eventHorizon.eventTime - eventClockTime))

  const narrativeBriefing = generateBriefing(
    celestialProfile,
    currentLayer,
    zodiacSign,
    moonPhaseName,
    seasonName,
    activeAspects,
  )
  const rhythmForecast = getRhythmForecast(eventHorizon.aspectType)
  const systemicResonance = getSystemicResonance(activeAspects)

  return (
    <div className="dashboard-page">
      <GeocentricOrrery3D
        activeProfile={celestialProfile}
        layer={currentLayer}
        sign={zodiacSign}
        moonPhase={moonPhaseName}
        moonRotationDegrees={moonRotationDegrees}
        resonanceScores={resonanceScores}
        planetVectors={planetVectors}
        activeAspects={activeAspects}
      />

      <section className="macro-epoch-readout glass">
        <p className="macro-epoch-title">MACRO-EPOCH</p>
        <p className="macro-epoch-text">
          Transitional Phase: Late Pisces to Early Aquarius. Primary environmental wave:
          Decentralization, Information Systems, and Frequency.
        </p>
      </section>

      <section className={`hud-panel hud-left glass${isTelemetryCollapsed ? ' collapsed' : ''}`}>
        <div className="hud-panel-header">
          <h2>Telemetry Node</h2>
          <div className="hud-panel-actions">
            <button className="ghost-btn" onClick={onOpenProfileManager} type="button">
              Profiles
            </button>
            <button
              className="hud-toggle"
              onClick={() => setTelemetryCollapsed((value) => !value)}
              type="button"
            >
              {isTelemetryCollapsed ? 'Expand' : 'Collapse'}
            </button>
          </div>
        </div>

        {!isTelemetryCollapsed && (
          <>
            <section className="profile-select">
              <label htmlFor="profileSelect">Active Profile</label>
              <select
                id="profileSelect"
                value={selectedProfile?.id ?? ''}
                onChange={(event) => onProfileSelected(event.target.value)}
              >
                {profiles.length === 0 && <option value="">Default Origin (1981-04-24)</option>}
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} | {profile.birthDate}
                  </option>
                ))}
              </select>
            </section>

            <section className="briefing-card">
              <h3>Strategic Briefing</h3>
              <p className="layer-description">{describeLayer(currentLayer)}</p>
              <pre>{narrativeBriefing}</pre>
              <div className="telemetry-block">
                <h4>Active System Variables</h4>
                {telemetryVariables.length > 0 ? (
                  <ul>
                    {telemetryVariables.map((entry) => (
                      <li key={entry.key}>
                        <span className={`telemetry-badge ${badgeTone(entry.aspectType)}`}>
                          {badgeLabel(entry.aspectType)}
                        </span>{' '}
                        {entry.text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No major angular contacts inside 5-degree orb.</p>
                )}
              </div>

              <div className="resonance-readout">
                <h4>[ SYSTEMIC RESONANCE ]</h4>
                <p className="resonance-line">
                  <span className="resonance-label">Ambient Interference</span>
                  <span className="resonance-value">{systemicResonance.ambientHz.toFixed(2)} Hz</span>
                </p>
                <p className="resonance-state">{systemicResonance.variableState}</p>
                <p className="resonance-line">
                  <span className="resonance-label">Acoustic Countermeasure</span>
                  <span className="resonance-value">{systemicResonance.countermeasureHz}</span>
                </p>
                <p className="resonance-sub">{systemicResonance.countermeasureLabel}</p>
              </div>
            </section>
          </>
        )}
      </section>

      <section className={`hud-panel hud-right glass${isMetricsCollapsed ? ' collapsed' : ''}`}>
        <div className="hud-panel-header">
          <h2>Resonance Array</h2>
          <button
            className="hud-toggle"
            onClick={() => setMetricsCollapsed((value) => !value)}
            type="button"
          >
            {isMetricsCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>

        {!isMetricsCollapsed && (
          <div className="meters-panel">
            <ResonanceMeter label="SELF" score={resonanceScores.selfScore} styleName="self" />
            <ResonanceMeter label="MONEY" score={resonanceScores.moneyScore} styleName="money" />
            <ResonanceMeter
              label="RELATION"
              score={resonanceScores.relationshipScore}
              styleName="relation"
            />
            <EventHorizonTimer
              label={eventHorizon.label}
              remainingMs={horizonRemainingMs}
              rhythmForecast={rhythmForecast}
            />
            <RadarLegend />
          </div>
        )}
      </section>

      <GemiTerminal
        state={{
          layer: currentLayer,
          sign: zodiacSign,
          activeAspects,
          rhythmForecast,
          ambientFrequencyHz: systemicResonance.ambientHz,
          acousticCountermeasure: `${systemicResonance.countermeasureHz} — ${systemicResonance.countermeasureLabel}`,
        }}
      />

      <section className="hud-console glass">
        <div className="date-block">
          <p className="label">{driveMode === 'absolute' ? 'Target Date' : 'Current Date'}</p>
          <p className="timestamp">{displayDateTime.toFormat('ccc, LLL d, yyyy  h:mm a')}</p>
        </div>

        <div className="drive-mode-tabs">
          <button
            className={driveMode === 'relative' ? 'drive-tab active' : 'drive-tab'}
            onClick={() => setDriveMode('relative')}
            type="button"
          >
            Relative Offset
          </button>
          <button
            className={driveMode === 'absolute' ? 'drive-tab active' : 'drive-tab'}
            onClick={() => setDriveMode('absolute')}
            type="button"
          >
            Absolute Override
          </button>
        </div>

        {driveMode === 'relative' ? (
          <div className="console-offset">
            <p>Time Offset: {Math.round(timeOffsetDays)} days</p>
            <input
              type="range"
              min={MIN_OFFSET_DAYS}
              max={MAX_OFFSET_DAYS}
              step={1}
              value={timeOffsetDays}
              onChange={(event) => {
                const next = Number(event.target.value)
                setTimeOffsetDays(next)
                EvolutionEngine.timeOffsetMillis = Math.round(next * MILLIS_PER_DAY)
              }}
            />
          </div>
        ) : (
          <label className="target-date-field">
            Target Date
            <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
          </label>
        )}

        <div className="absolute-inputs">
          <label>
            Latitude
            <input
              type="number"
              step="0.0001"
              value={targetLat}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (!Number.isNaN(value)) setTargetLat(value)
              }}
            />
          </label>
          <label>
            Longitude
            <input
              type="number"
              step="0.0001"
              value={targetLon}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (!Number.isNaN(value)) setTargetLon(value)
              }}
            />
          </label>
        </div>

        <p className="celestial-status">{`${zodiacSign} Season | ${moonPhaseName} | ${seasonName}`}</p>
      </section>
    </div>
  )
}

function EventHorizonTimer({
  label,
  remainingMs,
  rhythmForecast,
}: {
  label: string
  remainingMs: number
  rhythmForecast: string
}) {
  const totalSeconds = Math.floor(remainingMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return (
    <div className="event-horizon-box">
      <p className="event-horizon-label">Event Horizon</p>
      <p className="event-horizon-name">{label}</p>
      <p className="event-horizon-timer">{`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}</p>
      <p className="event-horizon-rhythm-label">Law of Rhythm Forecast</p>
      <p className="event-horizon-rhythm-text">{rhythmForecast}</p>
    </div>
  )
}

function ResonanceMeter({
  label,
  score,
  styleName,
}: {
  label: string
  score: number
  styleName: 'self' | 'money' | 'relation'
}) {
  return (
    <div className="meter-row">
      <p>{`${label}  ${score}%`}</p>
      <div className="meter-track">
        <div className={`meter-fill ${styleName}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function RadarLegend() {
  return (
    <div className="radar-legend">
      <p className="radar-legend-title">Radar Legend</p>
      <ul>
        <li>
          <span className="legend-line legend-red" aria-hidden="true" />
          <span>Friction / Structural Tension (Square/Opposition)</span>
        </li>
        <li>
          <span className="legend-line legend-cyan" aria-hidden="true" />
          <span>Resonance / Momentum Flow (Trine/Sextile)</span>
        </li>
        <li>
          <span className="legend-line legend-white" aria-hidden="true" />
          <span>Conjunction / Peak Intensity</span>
        </li>
        <li>
          <span className="legend-dot legend-overlap" aria-hidden="true" />
          <span>Overlapping Colors = Grand Configurations (Complex Pressure Zones)</span>
        </li>
        <li>
          <span className="legend-dot legend-gold" aria-hidden="true" />
          <span>Gold Beacon = Origin Coordinate lock</span>
        </li>
      </ul>
    </div>
  )
}

function describeLayer(layer: (typeof EVOLUTION_LAYERS)[number]): string {
  switch (layer) {
    case 'VOID':
      return 'Clear the cache. Reset variables.'
    case 'OBSERVATION':
      return 'Collect signals quietly. Notice patterns.'
    case 'CRYSTALLIZATION':
      return 'Capture what matters. Distill key insights.'
    case 'SYNTAX':
      return 'Define structure. Name the moving parts.'
    case 'SYMMETRY':
      return 'Balance logic and intent. Align your system.'
    case 'REFINEMENT':
      return 'Reduce noise. Sharpen the mechanism.'
    case 'RESONANCE':
      return 'Tune energy and message for impact.'
    case 'EXECUTION':
      return 'Move with precision. Ship the action.'
    case 'COMPLETION':
      return 'Close the loop. Archive lessons forward.'
    default:
      return ''
  }
}

function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

function getRhythmForecast(
  aspectType: 'Conjunction' | 'Sextile' | 'Square' | 'Trine' | 'Opposition' | undefined,
): string {
  if (aspectType === 'Square' || aspectType === 'Opposition') {
    return 'Tide is pulling out. Lock in progress.'
  }

  if (aspectType === 'Trine' || aspectType === 'Sextile') {
    return 'Tide is coming in. Prepare for execution phase.'
  }

  return 'Rhythm is neutral. Keep your pace steady and stay ready for the next shift.'
}

function badgeLabel(type: ActiveAspect['type']): string {
  switch (type) {
    case 'Square':
    case 'Opposition':
      return '[ CALCINATION ]'
    case 'Trine':
    case 'Sextile':
      return '[ COAGULATION ]'
    case 'Conjunction':
      return '[ DISTILLATION ]'
  }
}

function badgeTone(type: ActiveAspect['type']): 'calcination' | 'coagulation' | 'distillation' {
  switch (type) {
    case 'Square':
    case 'Opposition':
      return 'calcination'
    case 'Trine':
    case 'Sextile':
      return 'coagulation'
    case 'Conjunction':
      return 'distillation'
  }
}
