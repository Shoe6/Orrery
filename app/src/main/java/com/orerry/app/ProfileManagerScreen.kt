package com.orerry.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter

@Composable
fun ProfileManagerScreen(
    profiles: List<OriginProfile>,
    onSaveProfile: (OriginProfile) -> Unit,
    onDeleteProfile: (OriginProfile) -> Unit,
    onBack: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var name by remember { mutableStateOf("") }
    var birthDate by remember { mutableStateOf("1981-04-24") }
    var birthTime by remember { mutableStateOf("07:36") }
    var latitude by remember { mutableStateOf("43.0398") }
    var longitude by remember { mutableStateOf("-77.0930") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val dateFormat = remember { DateTimeFormatter.ISO_LOCAL_DATE }
    val timeFormat = remember { DateTimeFormatter.ofPattern("HH:mm") }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF090D12), Color(0xFF020305))))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        TopAppBar(
            title = {
                Text(
                    text = "Origin Profile Registry",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color(0xFFBDF7FF),
                    fontFamily = FontFamily.Monospace
                )
            },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(
                        imageVector = Icons.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = Color(0xFFD9E4EA)
                    )
                }
            }
        )

        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Name") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = birthDate,
            onValueChange = { birthDate = it },
            label = { Text("Birth Date (yyyy-MM-dd)") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = birthTime,
            onValueChange = { birthTime = it },
            label = { Text("Birth Time (HH:mm)") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            OutlinedTextField(
                value = latitude,
                onValueChange = { latitude = it },
                label = { Text("Latitude") },
                singleLine = true,
                modifier = Modifier.weight(1f)
            )
            OutlinedTextField(
                value = longitude,
                onValueChange = { longitude = it },
                label = { Text("Longitude") },
                singleLine = true,
                modifier = Modifier.weight(1f)
            )
        }

        Button(
            onClick = {
                val parsed = runCatching {
                    OriginProfile(
                        name = name.trim(),
                        birthDate = LocalDate.parse(birthDate.trim(), dateFormat),
                        birthTime = LocalTime.parse(birthTime.trim(), timeFormat),
                        latitude = latitude.trim().toDouble(),
                        longitude = longitude.trim().toDouble()
                    )
                }

                parsed.onSuccess {
                    onSaveProfile(it)
                    errorMessage = null
                    name = ""
                }.onFailure {
                    errorMessage = "Invalid input. Use ISO date, 24h time, and numeric coordinates."
                }
            },
            enabled = name.isNotBlank(),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Save")
        }

        if (errorMessage != null) {
            Text(
                text = errorMessage ?: "",
                color = Color(0xFFFF8A8A),
                style = MaterialTheme.typography.bodySmall
            )
        }

        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = "Saved Profiles",
            style = MaterialTheme.typography.titleMedium,
            color = Color(0xFFD9E4EA),
            fontFamily = FontFamily.Monospace
        )

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(profiles, key = { it.id }) { profile ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(profile.name, style = MaterialTheme.typography.titleSmall)
                            Text(
                                text = "${profile.birthDate} ${profile.birthTime} | ${profile.latitude}, ${profile.longitude}",
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                        Button(onClick = { onDeleteProfile(profile) }) {
                            Text("Delete")
                        }
                    }
                }
            }
        }
    }
}
