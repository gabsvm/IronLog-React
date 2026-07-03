package com.gainslab.ironlog.db

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.gainslab.ironlog.model.BodyLog
import com.gainslab.ironlog.model.CardioActivityType
import com.gainslab.ironlog.model.CardioSession
import com.gainslab.ironlog.model.FoodEntry
import com.gainslab.ironlog.model.Log
import com.gainslab.ironlog.model.NutritionLog
import com.gainslab.ironlog.model.SessionExercise
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Entity(tableName = "workout_logs")
data class LogEntity(
    @PrimaryKey val id: Long,
    val dayIdx: Int,
    val name: String,
    val startTime: Long,
    val endTime: Long,
    val duration: Long,
    val skipped: Boolean,
    val mesoId: Long,
    val week: Int,
    val exercisesJson: String,
    val note: String?
) {
    fun toDomain(): Log = Log(
        id = id,
        dayIdx = dayIdx,
        name = name,
        startTime = startTime,
        endTime = endTime,
        duration = duration,
        skipped = skipped,
        mesoId = mesoId,
        week = week,
        exercises = Json.decodeFromString<List<SessionExercise>>(exercisesJson),
        note = note
    )
}

fun Log.toEntity(): LogEntity = LogEntity(
    id = id,
    dayIdx = dayIdx,
    name = name,
    startTime = startTime,
    endTime = endTime,
    duration = duration,
    skipped = skipped ?: false,
    mesoId = mesoId,
    week = week,
    exercisesJson = Json.encodeToString(exercises),
    note = note
)

@Entity(tableName = "body_logs")
data class BodyLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val date: Long,
    val weight: Double,
    val bodyFat: Double?,
    val notes: String?
) {
    fun toDomain(): BodyLog = BodyLog(
        id = id,
        date = date,
        weight = weight,
        bodyFat = bodyFat,
        notes = notes
    )
}

fun BodyLog.toEntity(): BodyLogEntity = BodyLogEntity(
    id = if (id == 0L) 0L else id, // Let Room auto-generate if 0
    date = date,
    weight = weight,
    bodyFat = bodyFat,
    notes = notes
)

@Entity(tableName = "nutrition_logs")
data class NutritionLogEntity(
    @PrimaryKey val date: String, // YYYY-MM-DD
    val entriesJson: String,
    val waterMl: Double?
) {
    fun toDomain(): NutritionLog = NutritionLog(
        date = date,
        entries = Json.decodeFromString<List<FoodEntry>>(entriesJson),
        waterMl = waterMl
    )
}

fun NutritionLog.toEntity(): NutritionLogEntity = NutritionLogEntity(
    date = date,
    entriesJson = Json.encodeToString(entries),
    waterMl = waterMl
)

@Entity(tableName = "cardio_logs")
data class CardioLogEntity(
    @PrimaryKey val id: String,
    val date: String,
    val activityType: String,
    val durationMin: Double,
    val distanceKm: Double?,
    val caloriesBurned: Double?,
    val avgHeartRate: Double?,
    val notes: String?,
    val timestamp: Long
) {
    fun toDomain(): CardioSession = CardioSession(
        id = id,
        date = date,
        activityType = CardioActivityType.valueOf(activityType),
        durationMin = durationMin,
        distanceKm = distanceKm,
        caloriesBurned = caloriesBurned,
        avgHeartRate = avgHeartRate,
        notes = notes,
        timestamp = timestamp
    )
}

fun CardioSession.toEntity(): CardioLogEntity = CardioLogEntity(
    id = id,
    date = date,
    activityType = activityType.name,
    durationMin = durationMin,
    distanceKm = distanceKm,
    caloriesBurned = caloriesBurned,
    avgHeartRate = avgHeartRate,
    notes = notes,
    timestamp = timestamp
)
