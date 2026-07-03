package com.gainslab.ironlog.store

import com.gainslab.ironlog.db.AppPreferences
import com.gainslab.ironlog.db.LogDao
import com.gainslab.ironlog.db.BodyLogDao
import com.gainslab.ironlog.db.NutritionLogDao
import com.gainslab.ironlog.db.CardioLogDao
import com.gainslab.ironlog.model.*
import com.gainslab.ironlog.db.toEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AppState(
    val activeSession: ActiveSession? = null,
    val activeMeso: MesoCycle? = null,
    val isStoreLoading: Boolean = true,
    val hasSeenOnboarding: Boolean = false,
    val userProfile: UserProfile? = null,
    val colorTheme: ColorTheme = ColorTheme.IRON,
    val program: List<ProgramDay> = emptyList(),
    val exercises: List<ExerciseDef> = emptyList()
)

class AppStore(
    private val preferences: AppPreferences,
    private val logDao: LogDao,
    private val bodyLogDao: BodyLogDao,
    private val nutritionLogDao: NutritionLogDao,
    private val cardioLogDao: CardioLogDao
) {
    private val storeScope = CoroutineScope(Dispatchers.Default)

    private val _state = MutableStateFlow(AppState())
    val state: StateFlow<AppState> = _state.asStateFlow()

    // Database flows exposed as domain models
    val workoutLogs = logDao.getAllLogsFlow().map { list -> list.map { it.toDomain() } }
    val bodyLogs = bodyLogDao.getAllBodyLogsFlow().map { list -> list.map { it.toDomain() } }
    val nutritionLogs = nutritionLogDao.getAllNutritionLogsFlow().map { list -> list.map { it.toDomain() } }
    val cardioSessions = cardioLogDao.getAllCardioLogsFlow().map { list -> list.map { it.toDomain() } }

    // Sync
    val syncManager = SyncManager(this)

    init {
        storeScope.launch {
            val session = preferences.getActiveSession()
            val meso = preferences.getActiveMeso()
            val profile = preferences.getUserProfile()
            val onboarded = preferences.getHasSeenOnboarding()
            val theme = preferences.getColorTheme()
            val program = preferences.getProgram()
            
            var exercises = preferences.getExercises()
            if (exercises == null) {
                try {
                    exercises = kotlinx.serialization.json.Json.decodeFromString<List<ExerciseDef>>(StaticData.EXERCISES_JSON)
                    preferences.setExercises(exercises)
                } catch (e: Exception) {
                    exercises = emptyList()
                }
            }
            
            _state.update {
                it.copy(
                    activeSession = session,
                    activeMeso = meso,
                    userProfile = profile,
                    hasSeenOnboarding = onboarded,
                    colorTheme = theme,
                    program = program,
                    exercises = exercises,
                    isStoreLoading = false
                )
            }
        }
    }

    fun setActiveSession(session: ActiveSession?) {
        _state.update { it.copy(activeSession = session) }
        preferences.setActiveSession(session)
    }

    fun setActiveMeso(meso: MesoCycle?) {
        _state.update { it.copy(activeMeso = meso) }
        preferences.setActiveMeso(meso)
    }

    fun setUserProfile(profile: UserProfile?) {
        _state.update { it.copy(userProfile = profile) }
        preferences.setUserProfile(profile)
    }

    fun setHasSeenOnboarding(value: Boolean) {
        _state.update { it.copy(hasSeenOnboarding = value) }
        preferences.setHasSeenOnboarding(value)
    }

    fun setColorTheme(theme: ColorTheme) {
        _state.update { it.copy(colorTheme = theme) }
        preferences.setColorTheme(theme)
    }

    fun setProgram(program: List<ProgramDay>) {
        _state.update { it.copy(program = program) }
        preferences.setProgram(program)
    }

    fun setExercises(exercises: List<ExerciseDef>) {
        _state.update { it.copy(exercises = exercises) }
        preferences.setExercises(exercises)
    }

    // Database write operations
    fun saveWorkoutLog(log: Log) {
        storeScope.launch {
            logDao.insertLog(log.toEntity())
            syncManager.syncData()
        }
    }

    fun deleteWorkoutLog(id: Long) {
        storeScope.launch {
            logDao.deleteLogById(id)
        }
    }

    fun saveBodyLog(bodyLog: BodyLog) {
        storeScope.launch {
            bodyLogDao.insertBodyLog(bodyLog.toEntity())
        }
    }

    fun deleteBodyLog(id: Long) {
        storeScope.launch {
            bodyLogDao.deleteBodyLogById(id)
        }
    }

    fun saveNutritionLog(nutritionLog: NutritionLog) {
        storeScope.launch {
            nutritionLogDao.insertNutritionLog(nutritionLog.toEntity())
        }
    }

    fun deleteNutritionLog(date: String) {
        storeScope.launch {
            nutritionLogDao.deleteNutritionLogByDate(date)
        }
    }

    fun saveCardioSession(cardioSession: CardioSession) {
        storeScope.launch {
            cardioLogDao.insertCardioLog(cardioSession.toEntity())
        }
    }

    fun deleteCardioSession(id: String) {
        storeScope.launch {
            cardioLogDao.deleteCardioLogById(id)
        }
    }
}
