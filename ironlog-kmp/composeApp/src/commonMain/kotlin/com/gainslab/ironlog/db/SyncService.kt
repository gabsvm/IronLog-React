package com.gainslab.ironlog.db

import com.gainslab.ironlog.model.*
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.auth.auth
import dev.gitlive.firebase.firestore.firestore
import kotlinx.serialization.Serializable

object SyncService {
    private val auth by lazy { Firebase.auth }
    private val firestore by lazy { Firebase.firestore }

    val currentUserId: String?
        get() = auth.currentUser?.uid

    val currentUserEmail: String?
        get() = auth.currentUser?.email

    suspend fun uploadUserIdentity() {
        val uid = currentUserId ?: return
        val email = currentUserEmail ?: return
        try {
            val userDoc = firestore.document("users/$uid")
            val data = mapOf(
                "email" to email,
                "lastSeen" to System.currentTimeMillis(),
                "uid" to uid
            )
            userDoc.set(data, merge = true)
            println("👤 Identity Synced: $email")
        } catch (e: Exception) {
            println("❌ Identity Sync Failed: ${e.message}")
        }
    }

    suspend fun uploadSessionOnly(session: ActiveSession?, lastUpdated: Long) {
        val uid = currentUserId ?: return
        try {
            val userDoc = firestore.document("users/$uid")
            val data = mapOf(
                "activeSession" to session,
                "lastUpdated" to lastUpdated
            )
            userDoc.update(data)
        } catch (e: Exception) {
            // Ignore not-found if doc doesn't exist
        }
    }

    suspend fun uploadState(
        program: List<ProgramDay>,
        activeMeso: MesoCycle?,
        activeSession: ActiveSession?,
        exercises: List<ExerciseDef>,
        nutritionLogs: List<NutritionLog>,
        cardioSessions: List<CardioSession>,
        bodyLogs: List<BodyLog>,
        customFoods: List<CustomFood>,
        nutritionGoal: NutritionGoal?,
        macroGoals: MacroGoals?,
        userProfile: UserProfile?,
        personalTemplates: List<GlobalTemplate>,
        appSettings: AppSettings,
        lastUpdated: Long,
        logs: List<Log>
    ) {
        val uid = currentUserId ?: return
        try {
            val userDoc = firestore.document("users/$uid")
            val mainData = CloudUserData(
                program = program,
                activeMeso = activeMeso,
                activeSession = activeSession,
                exercises = exercises,
                nutritionLogs = nutritionLogs.takeLast(60),
                cardioSessions = cardioSessions.takeLast(60),
                bodyLogs = bodyLogs.takeLast(100),
                customFoods = customFoods.takeLast(100),
                nutritionGoal = nutritionGoal,
                macroGoals = macroGoals,
                userProfile = userProfile,
                personalTemplates = personalTemplates,
                appSettings = appSettings,
                lastUpdated = lastUpdated,
                email = currentUserEmail
            )
            
            // Set the main document
            userDoc.set(mainData, merge = true)

            // Save history logs to subcollection
            if (logs.isNotEmpty()) {
                val historyDoc = firestore.document("users/$uid/data/history")
                val historyData = CloudHistoryData(logs = logs.take(200)) // Keep last 200 logs
                historyDoc.set(historyData)
            }
            println("☁️ Cloud Sync: Upload Complete (User: $uid)")
        } catch (e: Exception) {
            println("❌ Cloud Sync Upload Failed: ${e.message}")
            throw e
        }
    }

    suspend fun downloadState(): CloudStateData? {
        val uid = currentUserId ?: return null
        return try {
            val userDoc = firestore.document("users/$uid")
            val userSnap = userDoc.get()
            if (userSnap.exists) {
                val data = userSnap.data<CloudUserData>()
                
                val historyDoc = firestore.document("users/$uid/data/history")
                val historySnap = historyDoc.get()
                val logs = if (historySnap.exists) {
                    historySnap.data<CloudHistoryData>().logs
                } else {
                    emptyList()
                }
                
                CloudStateData(
                    program = data.program,
                    activeMeso = data.activeMeso,
                    activeSession = data.activeSession,
                    exercises = data.exercises,
                    nutritionLogs = data.nutritionLogs,
                    cardioSessions = data.cardioSessions,
                    nutritionGoal = data.nutritionGoal,
                    macroGoals = data.macroGoals,
                    bodyLogs = data.bodyLogs,
                    customFoods = data.customFoods,
                    userProfile = data.userProfile,
                    personalTemplates = data.personalTemplates,
                    appSettings = data.appSettings.copy(
                        showRir = data.config?.showRIR ?: data.appSettings.showRir,
                        keepScreenOn = data.config?.keepScreenOn ?: data.appSettings.keepScreenOn
                    ),
                    logs = logs,
                    lastUpdated = data.lastUpdated
                )
            } else {
                null
            }
        } catch (e: Exception) {
            println("❌ Cloud Sync Download Failed: ${e.message}")
            null
        }
    }

    /** Public template catalog shared with the PWA's global_templates collection. */
    suspend fun downloadGlobalTemplates(): List<GlobalTemplate> {
        return try {
            firestore.collection("global_templates").get().documents
                .map { it.data<GlobalTemplate>() }
                .sortedBy { it.order }
        } catch (e: Exception) {
            println("Global template download failed: ${e.message}")
            emptyList()
        }
    }
}

@Serializable
data class CloudUserData(
    val program: List<ProgramDay> = emptyList(),
    val activeMeso: MesoCycle? = null,
    val activeSession: ActiveSession? = null,
    val exercises: List<ExerciseDef> = emptyList(),
    val nutritionLogs: List<NutritionLog> = emptyList(),
    val cardioSessions: List<CardioSession> = emptyList(),
    val bodyLogs: List<BodyLog> = emptyList(),
    val customFoods: List<CustomFood> = emptyList(),
    val nutritionGoal: NutritionGoal? = null,
    val macroGoals: MacroGoals? = null,
    val userProfile: UserProfile? = null,
    val personalTemplates: List<GlobalTemplate> = emptyList(),
    val appSettings: AppSettings = AppSettings(),
    // The existing PWA stores these two values under `config`. Keep this
    // compatibility bridge until both clients write the same shape.
    val config: CloudConfig? = null,
    val lastUpdated: Long = 0L,
    val email: String? = null
)

@Serializable
data class CloudHistoryData(
    val logs: List<Log> = emptyList()
)

@Serializable
data class CloudStateData(
    val program: List<ProgramDay> = emptyList(),
    val activeMeso: MesoCycle? = null,
    val activeSession: ActiveSession? = null,
    val exercises: List<ExerciseDef> = emptyList(),
    val nutritionLogs: List<NutritionLog> = emptyList(),
    val cardioSessions: List<CardioSession> = emptyList(),
    val nutritionGoal: NutritionGoal? = null,
    val macroGoals: MacroGoals? = null,
    val bodyLogs: List<BodyLog> = emptyList(),
    val customFoods: List<CustomFood> = emptyList(),
    val userProfile: UserProfile? = null,
    val personalTemplates: List<GlobalTemplate> = emptyList(),
    val appSettings: AppSettings = AppSettings(),
    val logs: List<Log> = emptyList(),
    val lastUpdated: Long = 0L
)

@Serializable
data class CloudConfig(
    val showRIR: Boolean? = null,
    val keepScreenOn: Boolean? = null
)
