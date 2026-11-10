package com.orerry.app

import androidx.room.TypeConverter
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

class OriginTypeConverters {
    @TypeConverter
    fun uuidToString(value: UUID): String = value.toString()

    @TypeConverter
    fun stringToUuid(value: String): UUID = UUID.fromString(value)

    @TypeConverter
    fun localDateToEpochDay(value: LocalDate): Long = value.toEpochDay()

    @TypeConverter
    fun epochDayToLocalDate(value: Long): LocalDate = LocalDate.ofEpochDay(value)

    @TypeConverter
    fun localTimeToSecondOfDay(value: LocalTime): Int = value.toSecondOfDay()

    @TypeConverter
    fun secondOfDayToLocalTime(value: Int): LocalTime = LocalTime.ofSecondOfDay(value.toLong())
}
