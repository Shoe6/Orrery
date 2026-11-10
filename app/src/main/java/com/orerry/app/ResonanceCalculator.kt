package com.orerry.app

import java.time.Instant
import java.time.ZoneId

/**
 * Aggregated resonance output for the three life channels.
 */
data class ResonanceScores(
    val selfScore: Int,
    val moneyScore: Int,
    val relationshipScore: Int
)

/**
 * Computes resonance scores from the current evolution state.
 *
 * Scores are returned as percentages in the 0..100 range.
 */
fun calculateResonance(
    layer: EvolutionLayer,
    phase: EvolutionPhase,
    targetTime: Long = System.currentTimeMillis(),
    profile: OriginProfile? = null
): ResonanceScores {
    val base = when (phase) {
        EvolutionPhase.INTAKE -> intakeScores(layer)
        EvolutionPhase.LOGIC -> logicScores(layer)
        EvolutionPhase.MANIFESTATION -> manifestationScores(layer)
    }

    val zodiacSign = EvolutionEngine.getZodiacSign(targetTime, profile)
    val withCelestialMultiplier = applyCelestialMultiplier(base, zodiacSign)

    val adjustedNow = targetTime + EvolutionEngine.timeOffsetMillis
    val isWeekOfPower = Instant.ofEpochMilli(adjustedNow)
        .atZone(ZoneId.of("America/New_York"))
        .let { zoned -> zoned.monthValue == 4 && zoned.dayOfMonth in 19..25 }

    return if (isWeekOfPower) {
        ResonanceScores(
            selfScore = boostScore(withCelestialMultiplier.selfScore),
            moneyScore = boostScore(withCelestialMultiplier.moneyScore),
            relationshipScore = boostScore(withCelestialMultiplier.relationshipScore)
        )
    } else {
        withCelestialMultiplier
    }
}

private fun applyCelestialMultiplier(scores: ResonanceScores, zodiacSign: String): ResonanceScores {
    val selfMultiplier = if (EvolutionEngine.isEarthSign(zodiacSign)) 1.10 else 1.0
    val moneyMultiplier = if (EvolutionEngine.isFireSign(zodiacSign)) 1.10 else 1.0

    return ResonanceScores(
        selfScore = (scores.selfScore * selfMultiplier).toInt().coerceIn(0, 100),
        moneyScore = (scores.moneyScore * moneyMultiplier).toInt().coerceIn(0, 100),
        relationshipScore = scores.relationshipScore.coerceIn(0, 100)
    )
}

private fun intakeScores(layer: EvolutionLayer): ResonanceScores {
    return when (layer) {
        EvolutionLayer.VOID -> ResonanceScores(selfScore = 100, moneyScore = 35, relationshipScore = 20)
        EvolutionLayer.OBSERVATION -> ResonanceScores(selfScore = 92, moneyScore = 42, relationshipScore = 30)
        EvolutionLayer.CRYSTALLIZATION -> ResonanceScores(selfScore = 84, moneyScore = 50, relationshipScore = 40)
        else -> ResonanceScores(selfScore = 85, moneyScore = 45, relationshipScore = 30)
    }
}

private fun logicScores(layer: EvolutionLayer): ResonanceScores {
    return when (layer) {
        EvolutionLayer.SYNTAX -> ResonanceScores(selfScore = 60, moneyScore = 82, relationshipScore = 55)
        EvolutionLayer.SYMMETRY -> ResonanceScores(selfScore = 60, moneyScore = 90, relationshipScore = 58)
        EvolutionLayer.REFINEMENT -> ResonanceScores(selfScore = 60, moneyScore = 100, relationshipScore = 62)
        else -> ResonanceScores(selfScore = 60, moneyScore = 88, relationshipScore = 58)
    }
}

private fun manifestationScores(layer: EvolutionLayer): ResonanceScores {
    return when (layer) {
        EvolutionLayer.RESONANCE -> ResonanceScores(selfScore = 70, moneyScore = 72, relationshipScore = 82)
        EvolutionLayer.EXECUTION -> ResonanceScores(selfScore = 74, moneyScore = 84, relationshipScore = 90)
        EvolutionLayer.COMPLETION -> ResonanceScores(selfScore = 78, moneyScore = 95, relationshipScore = 100)
        else -> ResonanceScores(selfScore = 72, moneyScore = 80, relationshipScore = 88)
    }
}

private fun boostScore(value: Int): Int {
    return (value + 15).coerceIn(0, 100)
}
