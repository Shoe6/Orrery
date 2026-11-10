package com.orerry.app

fun generateBriefing(
    profile: OriginProfile,
    layer: EvolutionLayer,
    sign: String,
    moonPhase: String,
    season: String
): String {
    val layerNumber = EvolutionLayer.values().indexOf(layer) + 1

    val stateLine = when (layer.phase) {
        EvolutionPhase.INTAKE -> "Intake phase active. System requires sensory reduction and data buffering."
        EvolutionPhase.LOGIC -> "Logic phase active. Architecture throughput is stable and optimization-ready."
        EvolutionPhase.MANIFESTATION -> "Manifestation phase active. Output channels are online with elevated transmission potential."
    }

    val environmentLine = buildEnvironmentLine(sign, moonPhase, season, layer.phase)
    val directiveLine = buildDirective(layer)

    return "STATE:\nProfile ${profile.name} is on layer $layerNumber (${layer.name}). " +
        "Origin telemetry: date=${profile.birthDate}, time=${profile.birthTime}, " +
        "lat=${"%.4f".format(profile.latitude)}, lon=${"%.4f".format(profile.longitude)}. " +
        "$stateLine\n\n" +
        "ENVIRONMENT:\nSign=$sign, Moon=$moonPhase, Season=$season. $environmentLine\n\n" +
        "DIRECTIVE:\n$directiveLine"
}

private fun buildEnvironmentLine(
    sign: String,
    moonPhase: String,
    season: String,
    phase: EvolutionPhase
): String {
    val signFriction = when (sign) {
        "Aries", "Leo", "Sagittarius" -> "Combustive vector detected: ignition momentum rises and impatience drag increases."
        "Taurus", "Virgo", "Capricorn" -> "Grounded vector detected: structural coherence rises while velocity decreases."
        else -> "Neutral vector detected: mixed momentum with moderate directional noise."
    }

    val moonVector = when (moonPhase) {
        "New" -> "Low-visibility cycle; external noise floor is reduced."
        "Waxing" -> "Acceleration cycle; build pressure and stage output."
        "Full" -> "Peak-amplitude cycle; high signal and high interference coexist."
        else -> "Decay cycle; close loops and recover computational margin."
    }

    val seasonalLoad = when (season) {
        "Spring" -> "Spring load: expansion bias and high branching opportunities."
        "Summer" -> "Summer load: sustained throughput with thermal saturation risk."
        "Autumn" -> "Autumn load: consolidation bias and pruning efficiency."
        else -> "Winter load: low external demand and high recalibration efficiency."
    }

    val phaseFriction = when (phase) {
        EvolutionPhase.INTAKE -> "Current phase responds best to low-input conditions."
        EvolutionPhase.LOGIC -> "Current phase responds best to deterministic constraints."
        EvolutionPhase.MANIFESTATION -> "Current phase responds best to controlled release cycles."
    }

    return "$signFriction $moonVector $seasonalLoad $phaseFriction"
}

private fun buildDirective(layer: EvolutionLayer): String {
    return when (layer) {
        EvolutionLayer.VOID,
        EvolutionLayer.OBSERVATION,
        EvolutionLayer.CRYSTALLIZATION -> "STASIS protocol: reduce social output, collect telemetry, and queue unresolved tasks without execution."

        EvolutionLayer.SYNTAX,
        EvolutionLayer.SYMMETRY,
        EvolutionLayer.REFINEMENT -> "ARCHITECTURE protocol: prioritize coding, structuring, refactoring, and constraint-tight implementation."

        EvolutionLayer.RESONANCE,
        EvolutionLayer.EXECUTION -> "IGNITION protocol: launch selected tasks, increase cadence, and maintain strict rollback checkpoints."

        EvolutionLayer.COMPLETION -> "RHETORIC protocol: transmit final outputs, document outcomes, and close communication loops."
    }
}
