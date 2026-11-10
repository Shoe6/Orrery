package com.orerry.app

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.UUID
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.roundToLong
import kotlin.math.sin
import kotlinx.coroutines.delay

private const val MILLIS_PER_DAY = 86_400_000L
private const val MIN_OFFSET_DAYS = -16_500f
private const val MAX_OFFSET_DAYS = 16_500f

private val uiZone: ZoneId = ZoneId.of("America/New_York")
private val dateFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("EEE, MMM d, yyyy  h:mm a")

@Composable
fun DashboardScreen(
    profiles: List<OriginProfile> = emptyList(),
    selectedProfile: OriginProfile? = null,
    onProfileSelected: (OriginProfile) -> Unit = {},
    onOpenProfileManager: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var timeOffsetDays by rememberSaveable { mutableFloatStateOf(0f) }
    val defaultProfile = remember {
        OriginProfile(
            id = UUID(0L, 0L),
            name = "Default Origin",
            birthDate = LocalDate.of(1981, 4, 24),
            birthTime = LocalTime.of(7, 36),
            latitude = 43.0398,
            longitude = -77.0930
        )
    }
    val activeProfile = selectedProfile ?: defaultProfile

    val nowMillis by produceState(initialValue = System.currentTimeMillis()) {
        while (true) {
            value = System.currentTimeMillis()
            delay(1_000L)
        }
    }

    val offsetMillis = (timeOffsetDays * MILLIS_PER_DAY).roundToLong()
    EvolutionEngine.timeOffsetMillis = offsetMillis

    val adjustedMillis = nowMillis + offsetMillis
    val adjustedDateTime = Instant.ofEpochMilli(adjustedMillis).atZone(uiZone)
    val currentLayer = EvolutionEngine.calculateLayer(nowMillis, activeProfile)
    val moonRotationDegrees = EvolutionEngine.calculateMoonRotationDegrees(nowMillis, activeProfile)
    val moonPhaseName = EvolutionEngine.calculateMoonPhaseName(nowMillis, activeProfile)
    val zodiacSign = EvolutionEngine.getZodiacSign(nowMillis, activeProfile)
    val seasonName = EvolutionEngine.getSeason(nowMillis, activeProfile)
    val celestialStatus = "$zodiacSign Season | $moonPhaseName | $seasonName"
    val layerDescription = currentLayer.description()
    val resonanceScores = calculateResonance(
        layer = currentLayer,
        phase = currentLayer.phase,
        targetTime = nowMillis,
        profile = activeProfile
    )
    val narrativeBriefing = generateBriefing(
        profile = activeProfile,
        layer = currentLayer,
        sign = zodiacSign,
        moonPhase = moonPhaseName,
        season = seasonName
    )

    val iceCyan = Color(0xFFBDF7FF)
    val glowCyan = Color(0xFF64F4FF)
    val silver = Color(0xFFD9E4EA)
    val deepCharcoal = Color(0xFF080B10)
    val pitchBlack = Color(0xFF010203)

    val glowStyle = TextStyle(
        fontFamily = FontFamily.Monospace,
        color = iceCyan,
        shadow = Shadow(
            color = glowCyan.copy(alpha = 0.7f),
            blurRadius = 16f
        )
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(deepCharcoal, pitchBlack)
                )
            )
            .padding(horizontal = 24.dp, vertical = 28.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            TopAppBar(
                title = {
                    Text(
                        text = "Evolution Dashboard",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontFamily = FontFamily.Monospace,
                            color = silver
                        )
                    )
                },
                actions = {
                    TextButton(onClick = onOpenProfileManager) {
                        Text("Profiles", color = iceCyan, fontFamily = FontFamily.Monospace)
                    }
                }
            )
            ProfileSelector(
                profiles = profiles,
                selectedProfile = selectedProfile,
                onProfileSelected = onProfileSelected,
                modifier = Modifier.fillMaxWidth(),
                silver = silver,
                iceCyan = iceCyan
            )
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = "Current Date",
                color = silver.copy(alpha = 0.88f),
                style = MaterialTheme.typography.labelLarge.copy(
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.4.sp
                )
            )
            Text(
                text = adjustedDateTime.format(dateFormatter),
                textAlign = TextAlign.Center,
                style = glowStyle.copy(
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = 0.5.sp
                ),
                modifier = Modifier.padding(top = 8.dp)
            )

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(320.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        GeometricOrrery(
                            currentLayer = currentLayer,
                            moonRotationDegrees = moonRotationDegrees,
                            moonPhaseName = moonPhaseName,
                            modifier = Modifier.fillMaxSize(),
                            iceCyan = iceCyan,
                            glowCyan = glowCyan,
                            silver = silver
                        )

                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = currentLayer.name,
                                textAlign = TextAlign.Center,
                                style = glowStyle.copy(
                                    fontSize = 44.sp,
                                    lineHeight = 50.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 2.sp
                                )
                            )
                            Text(
                                text = currentLayer.phase.name,
                                textAlign = TextAlign.Center,
                                style = glowStyle.copy(
                                    fontSize = 21.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = silver,
                                    shadow = Shadow(
                                        color = Color.Transparent,
                                        blurRadius = 0f
                                    ),
                                    letterSpacing = 1.2.sp
                                ),
                                modifier = Modifier.padding(top = 6.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(14.dp))

                    ResonanceMeters(
                        scores = resonanceScores,
                        modifier = Modifier
                            .weight(0.72f)
                            .padding(end = 4.dp),
                        iceCyan = iceCyan,
                        glowCyan = glowCyan,
                        silver = silver
                    )
                }
                Text(
                    text = layerDescription,
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.bodyLarge.copy(
                        color = silver.copy(alpha = 0.95f),
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 0.2.sp
                    ),
                    modifier = Modifier.padding(top = 20.dp)
                )

                BriefingCard(
                    briefing = narrativeBriefing,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(170.dp)
                        .padding(top = 14.dp),
                    silver = silver,
                    iceCyan = iceCyan
                )
            }

            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Time Offset: ${timeOffsetDays.roundToLong()} days",
                    color = silver,
                    style = MaterialTheme.typography.labelLarge.copy(
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )
                )
                Spacer(modifier = Modifier.height(12.dp))
                Slider(
                    value = timeOffsetDays,
                    onValueChange = { newValue ->
                        timeOffsetDays = newValue
                        EvolutionEngine.timeOffsetMillis =
                            (newValue * MILLIS_PER_DAY).roundToLong()
                    },
                    valueRange = MIN_OFFSET_DAYS..MAX_OFFSET_DAYS,
                    colors = SliderDefaults.colors(
                        thumbColor = iceCyan,
                        activeTrackColor = glowCyan,
                        inactiveTrackColor = silver.copy(alpha = 0.25f),
                        activeTickColor = Color.Transparent,
                        inactiveTickColor = Color.Transparent
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(14.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0x19141A20))
                        .padding(horizontal = 10.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = celestialStatus,
                        color = silver.copy(alpha = 0.94f),
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 0.6.sp
                        ),
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
            }
        }
    }
}

@Composable
private fun ProfileSelector(
    profiles: List<OriginProfile>,
    selectedProfile: OriginProfile?,
    onProfileSelected: (OriginProfile) -> Unit,
    modifier: Modifier = Modifier,
    silver: Color,
    iceCyan: Color
) {
    var expanded by remember { mutableStateOf(false) }

    Column(modifier = modifier) {
        Text(
            text = "Active Profile",
            style = MaterialTheme.typography.labelSmall.copy(
                color = silver.copy(alpha = 0.86f),
                fontFamily = FontFamily.Monospace,
                letterSpacing = 0.8.sp
            )
        )
        Box {
            Text(
                text = selectedProfile?.name ?: "Default Origin (1981-04-24)",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = iceCyan,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 0.4.sp
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0x19141A20))
                    .clickable { expanded = true }
                    .padding(horizontal = 12.dp, vertical = 10.dp)
            )

            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                profiles.forEach { profile ->
                    DropdownMenuItem(
                        text = {
                            Text(
                                text = "${profile.name} | ${profile.birthDate}",
                                fontFamily = FontFamily.Monospace
                            )
                        },
                        onClick = {
                            onProfileSelected(profile)
                            expanded = false
                        }
                    )
                }
                if (profiles.isEmpty()) {
                    DropdownMenuItem(
                        text = { Text("No saved profiles", fontFamily = FontFamily.Monospace) },
                        onClick = { expanded = false }
                    )
                }
            }
        }
    }
}

@Composable
private fun BriefingCard(
    briefing: String,
    modifier: Modifier = Modifier,
    silver: Color,
    iceCyan: Color
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .background(Color(0x22141A20))
            .padding(10.dp)
    ) {
        Text(
            text = "Strategic Briefing",
            style = MaterialTheme.typography.labelLarge.copy(
                color = iceCyan,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 0.8.sp
            )
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = briefing,
            style = MaterialTheme.typography.bodySmall.copy(
                color = silver.copy(alpha = 0.96f),
                fontFamily = FontFamily.Monospace,
                lineHeight = 18.sp
            ),
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(scrollState)
        )
    }
}

@Composable
private fun ResonanceMeters(
    scores: ResonanceScores,
    modifier: Modifier = Modifier,
    iceCyan: Color,
    glowCyan: Color,
    silver: Color
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.Center
    ) {
        ResonanceMeterRow(
            label = "SELF",
            score = scores.selfScore,
            activeColor = iceCyan,
            glowColor = glowCyan,
            silver = silver
        )
        Spacer(modifier = Modifier.height(14.dp))
        ResonanceMeterRow(
            label = "MONEY",
            score = scores.moneyScore,
            activeColor = glowCyan,
            glowColor = glowCyan,
            silver = silver
        )
        Spacer(modifier = Modifier.height(14.dp))
        ResonanceMeterRow(
            label = "RELATION",
            score = scores.relationshipScore,
            activeColor = silver,
            glowColor = glowCyan,
            silver = silver
        )
    }
}

@Composable
private fun ResonanceMeterRow(
    label: String,
    score: Int,
    activeColor: Color,
    glowColor: Color,
    silver: Color
) {
    val progress by animateFloatAsState(
        targetValue = score / 100f,
        animationSpec = tween(durationMillis = 450),
        label = "${label.lowercase()}Progress"
    )

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = "$label  $score%",
            style = MaterialTheme.typography.labelMedium.copy(
                color = silver,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 1.sp
            )
        )
        Spacer(modifier = Modifier.height(6.dp))
        LinearProgressIndicator(
            progress = { progress },
            color = activeColor,
            trackColor = silver.copy(alpha = 0.18f),
            modifier = Modifier
                .fillMaxWidth()
                .height(9.dp)
                .background(glowColor.copy(alpha = 0.15f))
        )
    }
}

@Composable
private fun GeometricOrrery(
    currentLayer: EvolutionLayer,
    moonRotationDegrees: Float,
    moonPhaseName: String,
    modifier: Modifier = Modifier,
    ringSize: Dp = 280.dp,
    iceCyan: Color,
    glowCyan: Color,
    silver: Color
) {
    val layerIndex = EvolutionLayer.values().indexOf(currentLayer)
    val nonagonTargetRotation = layerIndex * 40f

    val nonagonRotation by animateFloatAsState(
        targetValue = nonagonTargetRotation,
        animationSpec = tween(durationMillis = 650),
        label = "nonagonRotation"
    )
    val moonRotation by animateFloatAsState(
        targetValue = moonRotationDegrees,
        animationSpec = tween(durationMillis = 500),
        label = "moonRotation"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(ringSize)
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val cx = size.width / 2f
            val cy = size.height / 2f
            val center = androidx.compose.ui.geometry.Offset(cx, cy)
            val nonagonRadius = min(size.width, size.height) * 0.24f
            val outerRingRadius = nonagonRadius * 1.42f

            rotate(degrees = moonRotation, pivot = center) {
                drawCircle(
                    color = silver.copy(alpha = 0.55f),
                    radius = outerRingRadius,
                    center = center,
                    style = Stroke(width = 2.5f)
                )
                drawCircle(
                    color = silver.copy(alpha = 0.9f),
                    radius = 5f,
                    center = androidx.compose.ui.geometry.Offset(cx, cy - outerRingRadius)
                )
            }

            rotate(degrees = nonagonRotation, pivot = center) {
                val nonagon = Path().apply {
                    for (i in 0 until 9) {
                        val angle = (2.0 * PI * i / 9.0) - PI / 2.0
                        val x = cx + (cos(angle) * nonagonRadius).toFloat()
                        val y = cy + (sin(angle) * nonagonRadius).toFloat()
                        if (i == 0) moveTo(x, y) else lineTo(x, y)
                    }
                    close()
                }
                drawPath(path = nonagon, color = glowCyan.copy(alpha = 0.22f), style = Stroke(width = 18f))
                drawPath(path = nonagon, color = iceCyan.copy(alpha = 0.12f))
                drawPath(path = nonagon, color = iceCyan, style = Stroke(width = 3.5f))
            }
        }

        Text(
            text = "Moon: $moonPhaseName",
            style = MaterialTheme.typography.labelSmall.copy(
                color = silver.copy(alpha = 0.88f),
                fontFamily = FontFamily.Monospace,
                letterSpacing = 0.6.sp
            ),
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(top = 18.dp, end = 10.dp)
        )
    }
}

private fun EvolutionLayer.description(): String {
    return when (this) {
        EvolutionLayer.VOID -> "Clear the cache. Reset variables."
        EvolutionLayer.OBSERVATION -> "Collect signals quietly. Notice patterns."
        EvolutionLayer.CRYSTALLIZATION -> "Capture what matters. Distill key insights."
        EvolutionLayer.SYNTAX -> "Define structure. Name the moving parts."
        EvolutionLayer.SYMMETRY -> "Balance logic and intent. Align your system."
        EvolutionLayer.REFINEMENT -> "Reduce noise. Sharpen the mechanism."
        EvolutionLayer.RESONANCE -> "Tune energy and message for impact."
        EvolutionLayer.EXECUTION -> "Move with precision. Ship the action."
        EvolutionLayer.COMPLETION -> "Close the loop. Archive lessons forward."
    }
}
