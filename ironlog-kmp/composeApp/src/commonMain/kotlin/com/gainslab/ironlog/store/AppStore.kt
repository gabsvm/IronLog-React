package com.gainslab.ironlog.store

import com.gainslab.ironlog.db.AppPreferences
import com.gainslab.ironlog.db.LogDao
import com.gainslab.ironlog.db.BodyLogDao
import com.gainslab.ironlog.db.NutritionLogDao
import com.gainslab.ironlog.db.CardioLogDao
import com.gainslab.ironlog.db.CloudStateData
import com.gainslab.ironlog.db.SyncService
import com.gainslab.ironlog.model.*
import com.gainslab.ironlog.db.toEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

data class AppState(
    val activeSession: ActiveSession? = null,
    val activeMeso: MesoCycle? = null,
    val isStoreLoading: Boolean = true,
    val hasSeenOnboarding: Boolean = false,
    val userProfile: UserProfile? = null,
    val colorTheme: ColorTheme = ColorTheme.IRON,
    val program: List<ProgramDay> = emptyList(),
    val exercises: List<ExerciseDef> = emptyList(),
    val customFoods: List<CustomFood> = emptyList(),
    val nutritionGoal: NutritionGoal? = null,
    val macroGoals: MacroGoals? = null,
    val personalTemplates: List<GlobalTemplate> = emptyList(),
    val globalTemplates: List<GlobalTemplate> = emptyList(),
    val appSettings: AppSettings = AppSettings()
)

class AppStore(
    private val preferences: AppPreferences,
    private val logDao: LogDao,
    private val bodyLogDao: BodyLogDao,
    private val nutritionLogDao: NutritionLogDao,
    private val cardioLogDao: CardioLogDao
) {
    private val storeScope = CoroutineScope(Dispatchers.Default)
    private var isApplyingCloudSnapshot = false
    private var activeSessionPersistJob: Job? = null

    private val _state = MutableStateFlow(AppState())
    val state: StateFlow<AppState> = _state.asStateFlow()

    // Database flows exposed as domain models
    val workoutLogs = logDao.getAllLogsFlow().map { list -> list.map { it.toDomain() } }
    val bodyLogs = bodyLogDao.getAllBodyLogsFlow().map { list -> list.map { it.toDomain() } }
    val nutritionLogs = nutritionLogDao.getAllNutritionLogsFlow().map { list -> list.map { it.toDomain() } }
    val cardioSessions = cardioLogDao.getAllCardioLogsFlow().map { list -> list.map { it.toDomain() } }

    init {
        storeScope.launch {
            val session = preferences.getActiveSession()
            val meso = preferences.getActiveMeso()
            val profile = preferences.getUserProfile()
            val onboarded = preferences.getHasSeenOnboarding()
            val theme = preferences.getColorTheme()
            val program = preferences.getProgram()
            val customFoods = preferences.getCustomFoods()
            val nutritionGoal = preferences.getNutritionGoal()
            val macroGoals = preferences.getMacroGoals()
            val personalTemplates = preferences.getPersonalTemplates()
            val globalTemplates = preferences.getGlobalTemplates()
            val appSettings = preferences.getAppSettings()
            
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
                    customFoods = customFoods,
                    nutritionGoal = nutritionGoal,
                    macroGoals = macroGoals,
                    personalTemplates = personalTemplates,
                    globalTemplates = globalTemplates,
                    appSettings = appSettings,
                    isStoreLoading = false
                )
            }
            refreshGlobalTemplates()
        }
    }

    fun setActiveSession(session: ActiveSession?) {
        _state.update { it.copy(activeSession = session) }
        activeSessionPersistJob?.cancel()
        if (session == null) {
            preferences.setActiveSession(null)
            requestCloudSync()
        } else {
            // Weight/reps are typed one character at a time. Persisting and
            // uploading the full account for every keystroke makes the active
            // workout feel slow, especially on modest Android devices.
            activeSessionPersistJob = storeScope.launch {
                delay(600)
                preferences.setActiveSession(session)
                requestCloudSync()
            }
        }
    }

    fun setActiveMeso(meso: MesoCycle?) {
        _state.update { it.copy(activeMeso = meso) }
        preferences.setActiveMeso(meso)
        requestCloudSync()
    }

    fun setUserProfile(profile: UserProfile?) {
        _state.update { it.copy(userProfile = profile) }
        preferences.setUserProfile(profile)
        requestCloudSync()
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
        requestCloudSync()
    }

    fun setExercises(exercises: List<ExerciseDef>) {
        _state.update { it.copy(exercises = exercises) }
        preferences.setExercises(exercises)
        requestCloudSync()
    }

    fun setCustomFoods(customFoods: List<CustomFood>) {
        _state.update { it.copy(customFoods = customFoods) }
        preferences.setCustomFoods(customFoods)
        requestCloudSync()
    }

    fun setNutritionGoal(nutritionGoal: NutritionGoal?) {
        _state.update { it.copy(nutritionGoal = nutritionGoal) }
        preferences.setNutritionGoal(nutritionGoal)
        requestCloudSync()
    }

    fun setMacroGoals(macroGoals: MacroGoals?) {
        _state.update { it.copy(macroGoals = macroGoals) }
        preferences.setMacroGoals(macroGoals)
        requestCloudSync()
    }

    fun setPersonalTemplates(templates: List<GlobalTemplate>) {
        _state.update { it.copy(personalTemplates = templates) }
        preferences.setPersonalTemplates(templates)
        requestCloudSync()
    }

    fun setAppSettings(settings: AppSettings) {
        _state.update { it.copy(appSettings = settings) }
        preferences.setAppSettings(settings)
        requestCloudSync()
    }

    fun refreshGlobalTemplates() {
        storeScope.launch {
            val templates = SyncService.downloadGlobalTemplates()
            if (templates.isNotEmpty()) {
                _state.update { it.copy(globalTemplates = templates) }
                preferences.setGlobalTemplates(templates)
            }
        }
    }

    fun saveCurrentProgramAsPersonalTemplate(name: String) {
        val current = state.value
        if (current.program.isEmpty()) return
        val id = "personal_${System.currentTimeMillis()}"
        setPersonalTemplates(current.personalTemplates + GlobalTemplate(
            id = id,
            name = id,
            title = LocalizedText(name, name),
            description = LocalizedText("Rutina privada guardada desde Android.", "Rutina privada guardada desde Android."),
            isPro = false,
            program = current.program,
            order = current.personalTemplates.size,
            scope = "personal"
        ))
    }

    // Database write operations
    fun saveWorkoutLog(log: Log) {
        storeScope.launch {
            logDao.insertLog(log.toEntity())
            requestCloudSync()
        }
    }

    fun deleteWorkoutLog(id: Long) {
        storeScope.launch {
            logDao.deleteLogById(id)
            requestCloudSync()
        }
    }

    fun saveBodyLog(bodyLog: BodyLog) {
        storeScope.launch {
            bodyLogDao.insertBodyLog(bodyLog.toEntity())
            requestCloudSync()
        }
    }

    fun deleteBodyLog(id: Long) {
        storeScope.launch {
            bodyLogDao.deleteBodyLogById(id)
            requestCloudSync()
        }
    }

    fun saveNutritionLog(nutritionLog: NutritionLog) {
        storeScope.launch {
            nutritionLogDao.insertNutritionLog(nutritionLog.toEntity())
            requestCloudSync()
        }
    }

    fun deleteNutritionLog(date: String) {
        storeScope.launch {
            nutritionLogDao.deleteNutritionLogByDate(date)
            requestCloudSync()
        }
    }

    fun saveCardioSession(cardioSession: CardioSession) {
        storeScope.launch {
            cardioLogDao.insertCardioLog(cardioSession.toEntity())
            requestCloudSync()
        }
    }

    fun deleteCardioSession(id: String) {
        storeScope.launch {
            cardioLogDao.deleteCardioLogById(id)
            requestCloudSync()
        }
    }

    /**
     * Applies a cloud snapshot only after the caller has made an explicit
     * conflict decision. Existing local data is replaced as one coherent
     * transaction-like operation, so a PWA account never gets partially
     * imported into the Android app.
     */
    fun replaceFromCloud(snapshot: CloudStateData) {
        storeScope.launch { restoreFromCloud(snapshot) }
    }

    /**
     * Replaces the local state with a cloud snapshot and waits until Room and
     * preferences are both updated. This is used immediately after a manual
     * sign-in, so the workout shown next is the one from the PWA.
     */
    suspend fun restoreFromCloud(snapshot: CloudStateData) {
        isApplyingCloudSnapshot = true
        try {
            _state.update {
                it.copy(
                    program = snapshot.program,
                    activeMeso = snapshot.activeMeso,
                    activeSession = snapshot.activeSession,
                    exercises = snapshot.exercises,
                    userProfile = snapshot.userProfile,
                    nutritionGoal = snapshot.nutritionGoal,
                    macroGoals = snapshot.macroGoals,
                    customFoods = snapshot.customFoods,
                    personalTemplates = snapshot.personalTemplates,
                    appSettings = snapshot.appSettings
                )
            }
            preferences.setProgram(snapshot.program)
            preferences.setActiveMeso(snapshot.activeMeso)
            preferences.setActiveSession(snapshot.activeSession)
            preferences.setExercises(snapshot.exercises)
            preferences.setUserProfile(snapshot.userProfile)
            preferences.setNutritionGoal(snapshot.nutritionGoal)
            preferences.setMacroGoals(snapshot.macroGoals)
            preferences.setCustomFoods(snapshot.customFoods)
            preferences.setPersonalTemplates(snapshot.personalTemplates)
            preferences.setAppSettings(snapshot.appSettings)

            logDao.deleteAllLogs()
            snapshot.logs.forEach { logDao.insertLog(it.toEntity()) }
            nutritionLogDao.deleteAllNutritionLogs()
            snapshot.nutritionLogs.forEach { nutritionLogDao.insertNutritionLog(it.toEntity()) }
            cardioLogDao.deleteAllCardioLogs()
            snapshot.cardioSessions.forEach { cardioLogDao.insertCardioLog(it.toEntity()) }
            bodyLogDao.deleteAllBodyLogs()
            snapshot.bodyLogs.forEach { bodyLogDao.insertBodyLog(it.toEntity()) }
            preferences.setLastSyncTimestamp(snapshot.lastUpdated)
            preferences.setHasSeenOnboarding(true)
        } finally {
            isApplyingCloudSnapshot = false
        }
    }

    suspend fun uploadToCloud() {
        val snapshot = state.value
        SyncService.uploadState(
            program = snapshot.program,
            activeMeso = snapshot.activeMeso,
            activeSession = snapshot.activeSession,
            exercises = snapshot.exercises,
            nutritionLogs = nutritionLogs.first(),
            cardioSessions = cardioSessions.first(),
            bodyLogs = bodyLogs.first(),
            customFoods = snapshot.customFoods,
            nutritionGoal = snapshot.nutritionGoal,
            macroGoals = snapshot.macroGoals,
            userProfile = snapshot.userProfile,
            personalTemplates = snapshot.personalTemplates,
            appSettings = snapshot.appSettings,
            lastUpdated = System.currentTimeMillis(),
            logs = workoutLogs.first()
        )
        preferences.setLastSyncTimestamp(System.currentTimeMillis())
    }

    /** Best-effort cloud sync after a local change. Data remains available locally if offline. */
    private fun requestCloudSync() {
        if (isApplyingCloudSnapshot || SyncService.currentUserId == null) return
        storeScope.launch {
            runCatching { uploadToCloud() }
        }
    }

    suspend fun exportLocalBackup(): String {
        val current = state.value
        val snapshot = CloudStateData(
            program = current.program,
            activeMeso = current.activeMeso,
            activeSession = current.activeSession,
            exercises = current.exercises,
            nutritionLogs = nutritionLogs.first(),
            cardioSessions = cardioSessions.first(),
            nutritionGoal = current.nutritionGoal,
            macroGoals = current.macroGoals,
            bodyLogs = bodyLogs.first(),
            customFoods = current.customFoods,
            userProfile = current.userProfile,
            personalTemplates = current.personalTemplates,
            appSettings = current.appSettings,
            logs = workoutLogs.first(),
            lastUpdated = System.currentTimeMillis()
        )
        return Json { encodeDefaults = true }.encodeToString(snapshot)
    }

    fun importLocalBackup(raw: String): Result<Unit> = runCatching {
        val snapshot = Json { ignoreUnknownKeys = true }.decodeFromString<CloudStateData>(raw)
        replaceFromCloud(snapshot)
    }
}
