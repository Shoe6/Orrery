package com.orerry.app

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ProfileDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(profile: OriginProfile)

    @Delete
    suspend fun delete(profile: OriginProfile)

    @Query("SELECT * FROM origin_profiles ORDER BY name ASC")
    fun getAllProfiles(): Flow<List<OriginProfile>>
}
