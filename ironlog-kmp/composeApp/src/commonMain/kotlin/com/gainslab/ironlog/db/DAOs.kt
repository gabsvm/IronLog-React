package com.gainslab.ironlog.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface LogDao {
    @Query("SELECT * FROM workout_logs ORDER BY startTime DESC")
    fun getAllLogsFlow(): Flow<List<LogEntity>>

    @Query("SELECT * FROM workout_logs WHERE id = :id LIMIT 1")
    suspend fun getLogById(id: Long): LogEntity?

    @Query("SELECT * FROM workout_logs WHERE mesoId = :mesoId ORDER BY startTime ASC")
    suspend fun getLogsByMesoId(mesoId: Long): List<LogEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(log: LogEntity)

    @Query("DELETE FROM workout_logs WHERE id = :id")
    suspend fun deleteLogById(id: Long)

    @Query("DELETE FROM workout_logs")
    suspend fun deleteAllLogs()
}

@Dao
interface BodyLogDao {
    @Query("SELECT * FROM body_logs ORDER BY date DESC")
    fun getAllBodyLogsFlow(): Flow<List<BodyLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBodyLog(log: BodyLogEntity)

    @Query("DELETE FROM body_logs WHERE id = :id")
    suspend fun deleteBodyLogById(id: Long)

    @Query("DELETE FROM body_logs")
    suspend fun deleteAllBodyLogs()
}

@Dao
interface NutritionLogDao {
    @Query("SELECT * FROM nutrition_logs ORDER BY date DESC")
    fun getAllNutritionLogsFlow(): Flow<List<NutritionLogEntity>>

    @Query("SELECT * FROM nutrition_logs WHERE date = :date LIMIT 1")
    suspend fun getNutritionLogByDate(date: String): NutritionLogEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNutritionLog(log: NutritionLogEntity)

    @Query("DELETE FROM nutrition_logs WHERE date = :date")
    suspend fun deleteNutritionLogByDate(date: String)

    @Query("DELETE FROM nutrition_logs")
    suspend fun deleteAllNutritionLogs()
}

@Dao
interface CardioLogDao {
    @Query("SELECT * FROM cardio_logs ORDER BY date DESC, timestamp DESC")
    fun getAllCardioLogsFlow(): Flow<List<CardioLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCardioLog(log: CardioLogEntity)

    @Query("DELETE FROM cardio_logs WHERE id = :id")
    suspend fun deleteCardioLogById(id: String)

    @Query("DELETE FROM cardio_logs")
    suspend fun deleteAllCardioLogs()
}
