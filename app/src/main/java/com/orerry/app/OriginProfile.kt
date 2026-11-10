package com.orerry.app

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

@Entity(tableName = "origin_profiles")
data class OriginProfile(
    @PrimaryKey
    val id: UUID = UUID.randomUUID(),
    val name: String,
    val birthDate: LocalDate,
    val birthTime: LocalTime,
    val latitude: Double,
    val longitude: Double
)
