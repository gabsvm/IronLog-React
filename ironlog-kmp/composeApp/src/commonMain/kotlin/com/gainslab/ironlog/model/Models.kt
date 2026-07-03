package com.gainslab.ironlog.model

import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.descriptors.element
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonEncoder
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

// Custom serializer to handle string | { en: string, es: string }
object LocalizedTextSerializer : KSerializer<LocalizedText> {
    override val descriptor: SerialDescriptor = buildClassSerialDescriptor("LocalizedText") {
        element<String>("en", isOptional = true)
        element<String>("es", isOptional = true)
    }

    override fun deserialize(decoder: Decoder): LocalizedText {
        val input = decoder as? JsonDecoder ?: throw SerializationException("Only works with JSON")
        val element = input.decodeJsonElement()
        return if (element is JsonPrimitive) {
            val str = element.content
            LocalizedText(en = str, es = str)
        } else {
            val obj = element.jsonObject
            val en = obj["en"]?.jsonPrimitive?.content ?: ""
            val es = obj["es"]?.jsonPrimitive?.content ?: ""
            LocalizedText(en = en, es = es)
        }
    }

    override fun serialize(encoder: Encoder, value: LocalizedText) {
        val output = encoder as? JsonEncoder ?: throw SerializationException("Only works with JSON")
        val obj = buildJsonObject {
            put("en", value.en)
            put("es", value.es)
        }
        output.encodeJsonElement(obj)
    }
}

@Serializable(with = LocalizedTextSerializer::class)
data class LocalizedText(
    val en: String = "",
    val es: String = ""
) {
    fun get(lang: String): String = if (lang == "es") es else en
}

// Custom serializer to safely parse string | number as a Kotlin String
object StringValueSerializer : KSerializer<String> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("StringValue", PrimitiveKind.STRING)

    override fun deserialize(decoder: Decoder): String {
        val input = decoder as? JsonDecoder ?: throw SerializationException("Only works with JSON")
        val element = input.decodeJsonElement()
        return if (element is JsonPrimitive) {
            element.content
        } else {
            element.toString()
        }
    }

    override fun serialize(encoder: Encoder, value: String) {
        encoder.encodeString(value)
    }
}

@Serializable
enum class Lang {
    @SerialName("en") EN,
    @SerialName("es") ES
}

@Serializable
enum class Theme {
    @SerialName("light") LIGHT,
    @SerialName("dark") DARK,
    @SerialName("system") SYSTEM
}

@Serializable
enum class ColorTheme {
    @SerialName("iron") IRON,
    @SerialName("ocean") OCEAN,
    @SerialName("forest") FOREST,
    @SerialName("royal") ROYAL,
    @SerialName("sunset") SUNSET,
    @SerialName("monochrome") MONOCHROME
}

@Serializable
enum class MuscleGroup {
    CHEST, BACK, QUADS, HAMSTRINGS, GLUTES, CALVES, SHOULDERS, BICEPS, TRICEPS, TRAPS, ABS, FOREARMS, NECK, CARDIO
}

@Serializable
enum class CardioType {
    @SerialName("steady") STEADY,
    @SerialName("hiit") HIIT,
    @SerialName("tabata") TABATA
}

@Serializable
enum class SetType {
    @SerialName("regular") REGULAR,
    @SerialName("myorep") MYOREP,
    @SerialName("myorep_match") MYOREP_MATCH,
    @SerialName("cluster") CLUSTER,
    @SerialName("top") TOP,
    @SerialName("backoff") BACKOFF,
    @SerialName("giant") GIANT,
    @SerialName("warmup") WARMUP,
    @SerialName("avt_hop") AVT_HOP,
    @SerialName("emom") EMOM,
    @SerialName("drop") DROP,
    @SerialName("rest_pause") REST_PAUSE,
    @SerialName("time_volume") TIME_VOLUME,
    @SerialName("triple_add") TRIPLE_ADD
}

@Serializable
enum class WeightUnit {
    @SerialName("kg") KG,
    @SerialName("lb") LB,
    @SerialName("pl") PL
}

@Serializable
data class ExerciseDef(
    val id: String,
    val name: LocalizedText,
    val muscle: MuscleGroup,
    val instructions: LocalizedText? = null,
    val defaultCardioType: CardioType? = null,
    val videoId: String? = null,
    val isBodyweight: Boolean? = null,
    val isIsometric: Boolean? = null,
    val isometricTargetSecs: Int? = null,
    val skillFamily: String? = null,
    val skillLevel: Int? = null,
    val progressionNext: String? = null,
    val progressionPrev: String? = null,
    val defaultRestSeconds: Int? = null,
    val source: String? = null
)

@Serializable
data class WorkoutSet(
    val id: Int,
    @Serializable(with = StringValueSerializer::class)
    val weight: String = "",
    @Serializable(with = StringValueSerializer::class)
    val reps: String = "",
    @Serializable(with = StringValueSerializer::class)
    val rpe: String = "",
    val completed: Boolean = false,
    val type: SetType = SetType.REGULAR,
    val skipped: Boolean? = null,
    @Serializable(with = StringValueSerializer::class)
    val hintWeight: String? = null,
    @Serializable(with = StringValueSerializer::class)
    val hintReps: String? = null,
    @Serializable(with = StringValueSerializer::class)
    val prevWeight: String? = null,
    @Serializable(with = StringValueSerializer::class)
    val prevReps: String? = null,
    @Serializable(with = StringValueSerializer::class)
    val distance: String? = null,
    @Serializable(with = StringValueSerializer::class)
    val duration: String? = null,
    val workSeconds: Int? = null,
    val restSeconds: Int? = null,
    val avtRoundId: Int? = null,
    val isLastHop: Boolean? = null
)

@Serializable
data class SessionExercise(
    val id: String,
    val name: LocalizedText,
    val muscle: MuscleGroup,
    val instructions: LocalizedText? = null,
    val defaultCardioType: CardioType? = null,
    val videoId: String? = null,
    val isBodyweight: Boolean? = null,
    val isIsometric: Boolean? = null,
    val isometricTargetSecs: Int? = null,
    val skillFamily: String? = null,
    val skillLevel: Int? = null,
    val progressionNext: String? = null,
    val progressionPrev: String? = null,
    val defaultRestSeconds: Int? = null,
    val source: String? = null,
    
    // Session specific
    val instanceId: Int,
    val slotLabel: String? = null,
    val targetReps: String? = null,
    val note: String? = null,
    val sets: List<WorkoutSet> = emptyList(),
    val weightUnit: WeightUnit? = null,
    val plateWeight: Double? = null,
    val supersetId: String? = null,
    val isPlaceholder: Boolean? = null,
    val cardioType: CardioType? = null
)

@Serializable
data class ActiveSession(
    val id: Long,
    val dayIdx: Int,
    val name: String,
    val startTime: Long? = null,
    val endTime: Long? = null,
    val mesoId: Long,
    val week: Int,
    val exercises: List<SessionExercise> = emptyList(),
    val skipped: Boolean? = null,
    val note: String? = null
)

@Serializable
data class ProgramSlot(
    val muscle: MuscleGroup,
    val setTarget: Int,
    val reps: String? = null,
    val exerciseId: String? = null,
    val supersetId: String? = null,
    val setType: SetType? = null,
    val isAVT: Boolean? = null,
    val avtRounds: Int? = null,
    val avtStartReps: Int? = null,
    val label: String? = null,
    val notes: String? = null,
    val avtHops: String? = null,
    val restBetweenHopsSec: Int? = null,
    val restBetweenRoundsSec: Int? = null
)

@Serializable
data class ProgramDay(
    val id: String,
    val dayName: LocalizedText,
    val slots: List<ProgramSlot> = emptyList(),
    val notes: String? = null
)

@Serializable
data class GlobalTemplate(
    val id: String,
    val name: String,
    val title: LocalizedText,
    val description: LocalizedText,
    val isPro: Boolean,
    val program: List<ProgramDay> = emptyList(),
    val order: Int,
    val guidelineImages: List<String>? = null
)

@Serializable
data class MesoCycle(
    val id: Long,
    val name: String? = null,
    val mesoType: String,
    val week: Int,
    val plan: List<List<String?>> = emptyList(),
    val targetWeeks: Int? = null,
    val isDeload: Boolean? = null,
    val note: String? = null,
    val duration: Int
)

@Serializable
data class Log(
    val id: Long,
    val dayIdx: Int,
    val name: String,
    val startTime: Long,
    val endTime: Long,
    val duration: Long,
    val skipped: Boolean? = null,
    val mesoId: Long,
    val week: Int,
    val exercises: List<SessionExercise> = emptyList(),
    val note: String? = null
)

@Serializable
data class FeedbackEntry(
    val soreness: Int,
    val performance: Int,
    val adjustment: Int
)

@Serializable
data class TutorialState(
    val home: Boolean = false,
    val workout: Boolean = false,
    val history: Boolean = false,
    val stats: Boolean = false,
    val mesoSettings: Boolean = false,
    val nutrition: Boolean = false
)

@Serializable
enum class SubscriptionTier {
    @SerialName("free") FREE,
    @SerialName("monthly") MONTHLY,
    @SerialName("yearly") YEARLY,
    @SerialName("lifetime") LIFETIME,
    @SerialName("demo") DEMO
}

@Serializable
data class UserSubscription(
    val isPro: Boolean = false,
    val tier: SubscriptionTier = SubscriptionTier.FREE,
    val expiryDate: Long? = null
)

@Serializable
enum class ExperienceLevel {
    @SerialName("beginner") BEGINNER,
    @SerialName("intermediate") INTERMEDIATE,
    @SerialName("advanced") ADVANCED
}

@Serializable
enum class TrainingGoal {
    @SerialName("hypertrophy") HYPERTROPHY,
    @SerialName("strength") STRENGTH,
    @SerialName("endurance") ENDURANCE
}

@Serializable
enum class SessionDuration {
    @SerialName("short") SHORT,
    @SerialName("medium") MEDIUM,
    @SerialName("long") LONG
}

@Serializable
enum class Gender {
    @SerialName("male") MALE,
    @SerialName("female") FEMALE,
    @SerialName("other") OTHER
}

@Serializable
enum class ActivityLevel {
    @SerialName("sedentary") SEDENTARY,
    @SerialName("light") LIGHT,
    @SerialName("moderate") MODERATE,
    @SerialName("active") ACTIVE,
    @SerialName("very_active") VERY_ACTIVE
}

@Serializable
enum class NutritionGoalType {
    @SerialName("cut") CUT,
    @SerialName("maintain") MAINTAIN,
    @SerialName("bulk") BULK
}

@Serializable
data class UserProfile(
    val experience: ExperienceLevel = ExperienceLevel.BEGINNER,
    val daysPerWeek: Int = 3,
    val goal: TrainingGoal = TrainingGoal.HYPERTROPHY,
    val sessionDuration: SessionDuration = SessionDuration.MEDIUM,
    val subscription: UserSubscription? = null,
    val bodyWeight: Double? = null,
    val height: Double? = null,
    val bodyFat: Double? = null,
    val age: Int? = null,
    val gender: Gender? = null,
    val activityLevel: ActivityLevel? = null,
    val nutritionGoal: NutritionGoalType? = null
)

@Serializable
data class MacroGoals(
    val calories: Double,
    val protein: Double,
    val carbs: Double,
    val fats: Double
)

@Serializable
data class DailyNutrition(
    val id: String, // YYYY-MM-DD
    val calories: Double,
    val protein: Double,
    val carbs: Double,
    val fats: Double,
    val water: Double // in ml
)

@Serializable
data class BodyLog(
    val id: Long,
    val date: Long,
    val weight: Double,
    val bodyFat: Double? = null,
    val notes: String? = null
)

@Serializable
data class CustomFood(
    val id: String,
    val name: String,
    val calories: Double,
    val protein: Double,
    val carbs: Double,
    val fat: Double,
    val servingSize: String? = null,
    val isFavorite: Boolean? = null,
    val createdAt: Long
)

@Serializable
data class FoodEntry(
    val id: String,
    val name: String,
    val calories: Double,
    val protein: Double,
    val carbs: Double,
    val fat: Double,
    val mealType: String, // 'breakfast' | 'lunch' | 'dinner' | 'snack'
    val timestamp: Long
)

@Serializable
data class NutritionLog(
    val date: String,       // "YYYY-MM-DD"
    val entries: List<FoodEntry> = emptyList(),
    val waterMl: Double? = null
)

@Serializable
data class NutritionGoal(
    val calories: Double,
    val protein: Double,
    val carbs: Double,
    val fat: Double
)

@Serializable
enum class CardioActivityType {
    @SerialName("running") RUNNING,
    @SerialName("cycling") CYCLING,
    @SerialName("swimming") SWIMMING,
    @SerialName("walking") WALKING,
    @SerialName("rowing") ROWING,
    @SerialName("elliptical") ELLIPTICAL,
    @SerialName("jump_rope") JUMP_ROPE,
    @SerialName("hiit") HIIT,
    @SerialName("other") OTHER
}

@Serializable
data class CardioSession(
    val id: String,
    val date: String,           // "YYYY-MM-DD"
    val activityType: CardioActivityType,
    val durationMin: Double,
    val distanceKm: Double? = null,
    val caloriesBurned: Double? = null,
    val avgHeartRate: Double? = null,
    val notes: String? = null,
    val timestamp: Long
)
