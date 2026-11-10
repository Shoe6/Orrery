package com.orerry.app

import java.time.Instant
import java.time.LocalDate
import java.time.MonthDay
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.temporal.ChronoUnit
import kotlin.math.roundToLong

/**
 * Core temporal engine for computing the active evolution layer from a fixed origin point.
 *
 * Origin Point: April 24, 1981, 7:36 AM in Newark, NY time.
 * Note: Newark coordinates are intentionally not used yet, but this zone choice prepares
 * the logic for future localization work.
 */
object EvolutionEngine {

    private val originZone: ZoneId = ZoneId.of("America/New_York")
    private val originDateTime: ZonedDateTime = ZonedDateTime.of(
        1981, 4, 24,
        7, 36, 0, 0,
        originZone
    )
    private val originDate: LocalDate = originDateTime.toLocalDate()
    private val originInstant: Instant = originDateTime.toInstant()

    private const val MILLIS_PER_DAY = 86_400_000.0
    private const val SYNODIC_MONTH_DAYS = 29.53059
    private val fireSigns = setOf("Aries", "Leo", "Sagittarius")
    private val earthSigns = setOf("Taurus", "Virgo", "Capricorn")

    /**
     * Time shift in milliseconds applied to [targetTime].
     *
     * Positive values fast-forward time, negative values rewind time.
     */
    var timeOffsetMillis: Long = 0L

    /**
     * Calculates the active [EvolutionLayer] for a given timestamp.
     *
     * @param targetTime Epoch milliseconds (usually current time from System.currentTimeMillis()).
     * @param profile Optional dynamic profile telemetry for origin time and geographic offsets.
     * @return Current layer in the 9-day cycle.
     */
    fun calculateLayer(targetTime: Long, profile: OriginProfile? = null): EvolutionLayer {
        val profileTelemetryOffset = profile?.let(::calculateGeoTemporalOffsetMillis) ?: 0L
        val adjustedInstant = Instant.ofEpochMilli(targetTime + timeOffsetMillis + profileTelemetryOffset)
        val profileOriginInstant = profile?.let {
            ZonedDateTime.of(it.birthDate, it.birthTime, originZone).toInstant()
        } ?: originInstant

        val daysSinceOrigin = ChronoUnit.DAYS.between(profileOriginInstant, adjustedInstant)
        val layerCount = EvolutionLayer.values().size.toLong()
        val cycleIndex = Math.floorMod(daysSinceOrigin, layerCount).toInt()

        return EvolutionLayer.values()[cycleIndex]
    }

    /**
     * Calculates moon ring rotation in degrees using a precise synodic month.
     *
     * The cycle length is 29.53059 days.
     */
    fun calculateMoonRotationDegrees(targetTime: Long, profile: OriginProfile? = null): Float {
        val moonAgeDays = calculateMoonAgeDays(targetTime, profile)
        val cycleProgress = moonAgeDays / SYNODIC_MONTH_DAYS
        return (cycleProgress * 360.0).toFloat()
    }

    /**
     * Determines a simple moon phase name from the current synodic cycle position.
     */
    fun calculateMoonPhaseName(targetTime: Long, profile: OriginProfile? = null): String {
        val cycleFraction = calculateMoonAgeDays(targetTime, profile) / SYNODIC_MONTH_DAYS

        return when {
            cycleFraction < 0.125 || cycleFraction >= 0.875 -> "New"
            cycleFraction < 0.375 -> "Waxing"
            cycleFraction < 0.625 -> "Full"
            else -> "Waning"
        }
    }

    /**
     * Returns tropical zodiac sign based on standard date ranges.
     */
    fun getZodiacSign(targetTime: Long, profile: OriginProfile? = null): String {
        val adjustedInstant = resolveAdjustedInstant(targetTime, profile)
        val date = adjustedInstant
            .atZone(originZone)
            .toLocalDate()
        val monthDay = MonthDay.from(date)

        return when {
            monthDay >= MonthDay.of(3, 21) && monthDay <= MonthDay.of(4, 19) -> "Aries"
            monthDay >= MonthDay.of(4, 20) && monthDay <= MonthDay.of(5, 20) -> "Taurus"
            monthDay >= MonthDay.of(5, 21) && monthDay <= MonthDay.of(6, 20) -> "Gemini"
            monthDay >= MonthDay.of(6, 21) && monthDay <= MonthDay.of(7, 22) -> "Cancer"
            monthDay >= MonthDay.of(7, 23) && monthDay <= MonthDay.of(8, 22) -> "Leo"
            monthDay >= MonthDay.of(8, 23) && monthDay <= MonthDay.of(9, 22) -> "Virgo"
            monthDay >= MonthDay.of(9, 23) && monthDay <= MonthDay.of(10, 22) -> "Libra"
            monthDay >= MonthDay.of(10, 23) && monthDay <= MonthDay.of(11, 21) -> "Scorpio"
            monthDay >= MonthDay.of(11, 22) && monthDay <= MonthDay.of(12, 21) -> "Sagittarius"
            monthDay >= MonthDay.of(12, 22) || monthDay <= MonthDay.of(1, 19) -> "Capricorn"
            monthDay >= MonthDay.of(1, 20) && monthDay <= MonthDay.of(2, 18) -> "Aquarius"
            else -> "Pisces"
        }
    }

    /**
     * Returns northern-hemisphere season using equinox and solstice boundaries.
     */
    fun getSeason(targetTime: Long, profile: OriginProfile? = null): String {
        val adjustedInstant = resolveAdjustedInstant(targetTime, profile)
        val date = adjustedInstant
            .atZone(originZone)
            .toLocalDate()
        val monthDay = MonthDay.from(date)

        return when {
            monthDay >= MonthDay.of(3, 20) && monthDay < MonthDay.of(6, 21) -> "Spring"
            monthDay >= MonthDay.of(6, 21) && monthDay < MonthDay.of(9, 22) -> "Summer"
            monthDay >= MonthDay.of(9, 22) && monthDay < MonthDay.of(12, 21) -> "Autumn"
            else -> "Winter"
        }
    }

    fun isFireSign(sign: String): Boolean = sign in fireSigns

    fun isEarthSign(sign: String): Boolean = sign in earthSigns

    private fun calculateMoonAgeDays(targetTime: Long, profile: OriginProfile?): Double {
        val adjustedInstant = resolveAdjustedInstant(targetTime, profile)
        val moonReferenceInstant = profile?.let {
            ZonedDateTime.of(it.birthDate, it.birthTime, originZone).toInstant()
        } ?: originInstant
        val millisSinceOrigin = adjustedInstant.toEpochMilli() - moonReferenceInstant.toEpochMilli()
        val daysSinceOrigin = millisSinceOrigin / MILLIS_PER_DAY
        return positiveModulo(daysSinceOrigin, SYNODIC_MONTH_DAYS)
    }

    private fun positiveModulo(value: Double, modulus: Double): Double {
        val raw = value % modulus
        return if (raw < 0) raw + modulus else raw
    }

    private fun resolveAdjustedInstant(targetTime: Long, profile: OriginProfile?): Instant {
        val geoTelemetryOffset = profile?.let(::calculateGeoTemporalOffsetMillis) ?: 0L
        val adjustedMillis = targetTime + timeOffsetMillis + geoTelemetryOffset
        return Instant.ofEpochMilli(adjustedMillis)
    }

    // Longitude drives local-solar-time drift; latitude adds a smaller hemispheric correction.
    private fun calculateGeoTemporalOffsetMillis(profile: OriginProfile): Long {
        val longitudeOffset = (profile.longitude / 360.0) * MILLIS_PER_DAY
        val latitudeOffset = (profile.latitude / 180.0) * (MILLIS_PER_DAY * 0.10)
        return (longitudeOffset + latitudeOffset).roundToLong()
    }
}

enum class EvolutionPhase {
    INTAKE,
    LOGIC,
    MANIFESTATION
}

enum class EvolutionLayer(val phase: EvolutionPhase) {
    VOID(EvolutionPhase.INTAKE),
    OBSERVATION(EvolutionPhase.INTAKE),
    CRYSTALLIZATION(EvolutionPhase.INTAKE),

    SYNTAX(EvolutionPhase.LOGIC),
    SYMMETRY(EvolutionPhase.LOGIC),
    REFINEMENT(EvolutionPhase.LOGIC),

    RESONANCE(EvolutionPhase.MANIFESTATION),
    EXECUTION(EvolutionPhase.MANIFESTATION),
    COMPLETION(EvolutionPhase.MANIFESTATION)
}
