import { DateTime } from 'luxon'
import { EVOLUTION_LAYERS } from '../types'
import type { EvolutionLayer, OriginProfile } from '../types'

const ORIGIN_ZONE = 'America/New_York'
const MILLIS_PER_DAY = 86_400_000
const SYNODIC_MONTH_DAYS = 29.53059

const ORIGIN_DATE_TIME = DateTime.fromObject(
  { year: 1981, month: 4, day: 24, hour: 7, minute: 36, second: 0, millisecond: 0 },
  { zone: ORIGIN_ZONE },
)
const ORIGIN_INSTANT_MILLIS = ORIGIN_DATE_TIME.toMillis()
const FIRE_SIGNS = new Set(['Aries', 'Leo', 'Sagittarius'])
const EARTH_SIGNS = new Set(['Taurus', 'Virgo', 'Capricorn'])

export const EvolutionEngine = {
  timeOffsetMillis: 0,

  calculateLayer(targetTime: number, profile: OriginProfile | null = null): EvolutionLayer {
    const profileTelemetryOffset = profile ? this.calculateGeoTemporalOffsetMillis(profile) : 0
    const adjustedMillis = targetTime + this.timeOffsetMillis + profileTelemetryOffset
    const profileOriginMillis = profile ? this.profileOriginMillis(profile) : ORIGIN_INSTANT_MILLIS
    const daysSinceOrigin = Math.trunc((adjustedMillis - profileOriginMillis) / MILLIS_PER_DAY)
    const cycleIndex = floorMod(daysSinceOrigin, EVOLUTION_LAYERS.length)

    return EVOLUTION_LAYERS[cycleIndex]
  },

  calculateMoonRotationDegrees(targetTime: number, profile: OriginProfile | null = null): number {
    const moonAgeDays = this.calculateMoonAgeDays(targetTime, profile)
    const cycleProgress = moonAgeDays / SYNODIC_MONTH_DAYS
    return cycleProgress * 360.0
  },

  calculateMoonPhaseName(targetTime: number, profile: OriginProfile | null = null): string {
    const cycleFraction = this.calculateMoonAgeDays(targetTime, profile) / SYNODIC_MONTH_DAYS

    if (cycleFraction < 0.125 || cycleFraction >= 0.875) return 'New'
    if (cycleFraction < 0.375) return 'Waxing'
    if (cycleFraction < 0.625) return 'Full'
    return 'Waning'
  },

  getZodiacSign(targetTime: number, profile: OriginProfile | null = null): string {
    const adjustedDate = this.resolveAdjustedDateTime(targetTime, profile).setZone(ORIGIN_ZONE)
    const monthDay = adjustedDate.month * 100 + adjustedDate.day

    if (monthDay >= 321 && monthDay <= 419) return 'Aries'
    if (monthDay >= 420 && monthDay <= 520) return 'Taurus'
    if (monthDay >= 521 && monthDay <= 620) return 'Gemini'
    if (monthDay >= 621 && monthDay <= 722) return 'Cancer'
    if (monthDay >= 723 && monthDay <= 822) return 'Leo'
    if (monthDay >= 823 && monthDay <= 922) return 'Virgo'
    if (monthDay >= 923 && monthDay <= 1022) return 'Libra'
    if (monthDay >= 1023 && monthDay <= 1121) return 'Scorpio'
    if (monthDay >= 1122 && monthDay <= 1221) return 'Sagittarius'
    if (monthDay >= 1222 || monthDay <= 119) return 'Capricorn'
    if (monthDay >= 120 && monthDay <= 218) return 'Aquarius'
    return 'Pisces'
  },

  getSeason(targetTime: number, profile: OriginProfile | null = null): string {
    const adjustedDate = this.resolveAdjustedDateTime(targetTime, profile).setZone(ORIGIN_ZONE)
    const monthDay = adjustedDate.month * 100 + adjustedDate.day

    if (monthDay >= 320 && monthDay < 621) return 'Spring'
    if (monthDay >= 621 && monthDay < 922) return 'Summer'
    if (monthDay >= 922 && monthDay < 1221) return 'Autumn'
    return 'Winter'
  },

  isFireSign(sign: string): boolean {
    return FIRE_SIGNS.has(sign)
  },

  isEarthSign(sign: string): boolean {
    return EARTH_SIGNS.has(sign)
  },

  calculateMoonAgeDays(targetTime: number, profile: OriginProfile | null): number {
    const adjustedMillis = this.resolveAdjustedDateTime(targetTime, profile).toMillis()
    const moonReferenceMillis = profile ? this.profileOriginMillis(profile) : ORIGIN_INSTANT_MILLIS
    const daysSinceOrigin = (adjustedMillis - moonReferenceMillis) / MILLIS_PER_DAY
    return positiveModulo(daysSinceOrigin, SYNODIC_MONTH_DAYS)
  },

  resolveAdjustedDateTime(targetTime: number, profile: OriginProfile | null): DateTime {
    const geoTelemetryOffset = profile ? this.calculateGeoTemporalOffsetMillis(profile) : 0
    const adjustedMillis = targetTime + this.timeOffsetMillis + geoTelemetryOffset
    return DateTime.fromMillis(adjustedMillis, { zone: 'utc' })
  },

  calculateGeoTemporalOffsetMillis(profile: OriginProfile): number {
    const longitudeOffset = (profile.longitude / 360.0) * MILLIS_PER_DAY
    const latitudeOffset = (profile.latitude / 180.0) * (MILLIS_PER_DAY * 0.1)
    return Math.round(longitudeOffset + latitudeOffset)
  },

  profileOriginMillis(profile: OriginProfile): number {
    const [year, month, day] = profile.birthDate.split('-').map(Number)
    const [hour, minute] = profile.birthTime.split(':').map(Number)
    return DateTime.fromObject(
      { year, month, day, hour, minute, second: 0, millisecond: 0 },
      { zone: ORIGIN_ZONE },
    ).toMillis()
  },
}

function floorMod(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus
}

function positiveModulo(value: number, modulus: number): number {
  const raw = value % modulus
  return raw < 0 ? raw + modulus : raw
}
