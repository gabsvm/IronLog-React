package com.gainslab.ironlog.db

import com.russhwolf.settings.Settings
import com.gainslab.ironlog.model.ActiveSession
import com.gainslab.ironlog.model.ColorTheme
import com.gainslab.ironlog.model.MesoCycle
import com.gainslab.ironlog.model.UserProfile
import com.gainslab.ironlog.model.ExerciseDef
import com.gainslab.ironlog.model.ProgramDay
import com.gainslab.ironlog.model.CustomFood
import com.gainslab.ironlog.model.MacroGoals
import com.gainslab.ironlog.model.NutritionGoal
import com.gainslab.ironlog.model.GlobalTemplate
import com.gainslab.ironlog.model.AppSettings
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class AppPreferences(private val settings: Settings = Settings()) {
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }
    
    fun getHasSeenOnboarding(): Boolean {
        return settings.getBoolean("il_onboarded_v2", false)
    }
    
    fun setHasSeenOnboarding(value: Boolean) {
        settings.putBoolean("il_onboarded_v2", value)
    }
    
    fun getLastSyncTimestamp(): Long {
        return settings.getLong("il_last_sync_ts", 0L)
    }
    
    fun setLastSyncTimestamp(value: Long) {
        settings.putLong("il_last_sync_ts", value)
    }
    
    fun getActiveSession(): ActiveSession? {
        val json = settings.getStringOrNull("il_session_v16") ?: return null
        return try {
            this.json.decodeFromString<ActiveSession>(json)
        } catch (e: Exception) {
            null
        }
    }
    
    fun setActiveSession(session: ActiveSession?) {
        if (session == null) {
            settings.remove("il_session_v16")
        } else {
            settings.putString("il_session_v16", json.encodeToString(session))
        }
    }
    
    fun getActiveMeso(): MesoCycle? {
        val json = settings.getStringOrNull("il_meso_v16") ?: return null
        return try {
            this.json.decodeFromString<MesoCycle>(json)
        } catch (e: Exception) {
            null
        }
    }
    
    fun setActiveMeso(meso: MesoCycle?) {
        if (meso == null) {
            settings.remove("il_meso_v16")
        } else {
            settings.putString("il_meso_v16", json.encodeToString(meso))
        }
    }
    
    fun getUserProfile(): UserProfile? {
        val json = settings.getStringOrNull("il_profile_v1") ?: return null
        return try {
            this.json.decodeFromString<UserProfile>(json)
        } catch (e: Exception) {
            null
        }
    }
    
    fun setUserProfile(profile: UserProfile?) {
        if (profile == null) {
            settings.remove("il_profile_v1")
        } else {
            settings.putString("il_profile_v1", json.encodeToString(profile))
        }
    }

    fun getColorTheme(): ColorTheme {
        val str = settings.getStringOrNull("il_color_theme") ?: return ColorTheme.IRON
        return try {
            ColorTheme.valueOf(str)
        } catch (e: Exception) {
            ColorTheme.IRON
        }
    }
    
    fun setColorTheme(theme: ColorTheme) {
        settings.putString("il_color_theme", theme.name)
    }

    fun getAppSettings(): AppSettings = getValue("il_app_settings_v1") ?: AppSettings()

    fun setAppSettings(value: AppSettings) = setValue("il_app_settings_v1", value)

    fun getProgram(): List<ProgramDay> {
        val json = settings.getStringOrNull("il_program_v2") ?: return emptyList()
        return try {
            this.json.decodeFromString(json)
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun setProgram(program: List<ProgramDay>) {
        settings.putString("il_program_v2", json.encodeToString(program))
    }

    fun getExercises(): List<ExerciseDef>? {
        val json = settings.getStringOrNull("il_exercises_v3") ?: return null
        return try {
            this.json.decodeFromString(json)
        } catch (e: Exception) {
            null
        }
    }

    fun setExercises(exercises: List<ExerciseDef>) {
        settings.putString("il_exercises_v3", json.encodeToString(exercises))
    }

    fun getNutritionGoal(): NutritionGoal? = getValue("il_nutrition_goal_v1")

    fun setNutritionGoal(value: NutritionGoal?) = setValue("il_nutrition_goal_v1", value)

    fun getMacroGoals(): MacroGoals? = getValue("il_macro_goals_v1")

    fun setMacroGoals(value: MacroGoals?) = setValue("il_macro_goals_v1", value)

    fun getCustomFoods(): List<CustomFood> = getValue("il_custom_foods_v1") ?: emptyList()

    fun setCustomFoods(value: List<CustomFood>) = setValue("il_custom_foods_v1", value)

    fun getPersonalTemplates(): List<GlobalTemplate> = getValue("il_personal_templates_v1") ?: emptyList()

    fun setPersonalTemplates(value: List<GlobalTemplate>) = setValue("il_personal_templates_v1", value)

    fun getGlobalTemplates(): List<GlobalTemplate> = getValue("il_global_templates_v1") ?: emptyList()

    fun setGlobalTemplates(value: List<GlobalTemplate>) = setValue("il_global_templates_v1", value)

    private inline fun <reified T> getValue(key: String): T? {
        val raw = settings.getStringOrNull(key) ?: return null
        return runCatching { json.decodeFromString<T>(raw) }.getOrNull()
    }

    private inline fun <reified T> setValue(key: String, value: T?) {
        if (value == null) settings.remove(key) else settings.putString(key, json.encodeToString(value))
    }
}
