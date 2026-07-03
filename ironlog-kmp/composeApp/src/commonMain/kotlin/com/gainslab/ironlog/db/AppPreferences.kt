package com.gainslab.ironlog.db

import com.russhwolf.settings.Settings
import com.gainslab.ironlog.model.ActiveSession
import com.gainslab.ironlog.model.ColorTheme
import com.gainslab.ironlog.model.MesoCycle
import com.gainslab.ironlog.model.UserProfile
import com.gainslab.ironlog.model.ExerciseDef
import com.gainslab.ironlog.model.ProgramDay
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class AppPreferences(private val settings: Settings = Settings()) {
    
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
            Json.decodeFromString<ActiveSession>(json)
        } catch (e: Exception) {
            null
        }
    }
    
    fun setActiveSession(session: ActiveSession?) {
        if (session == null) {
            settings.remove("il_session_v16")
        } else {
            settings.putString("il_session_v16", Json.encodeToString(session))
        }
    }
    
    fun getActiveMeso(): MesoCycle? {
        val json = settings.getStringOrNull("il_meso_v16") ?: return null
        return try {
            Json.decodeFromString<MesoCycle>(json)
        } catch (e: Exception) {
            null
        }
    }
    
    fun setActiveMeso(meso: MesoCycle?) {
        if (meso == null) {
            settings.remove("il_meso_v16")
        } else {
            settings.putString("il_meso_v16", Json.encodeToString(meso))
        }
    }
    
    fun getUserProfile(): UserProfile? {
        val json = settings.getStringOrNull("il_profile_v1") ?: return null
        return try {
            Json.decodeFromString<UserProfile>(json)
        } catch (e: Exception) {
            null
        }
    }
    
    fun setUserProfile(profile: UserProfile?) {
        if (profile == null) {
            settings.remove("il_profile_v1")
        } else {
            settings.putString("il_profile_v1", Json.encodeToString(profile))
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

    fun getProgram(): List<ProgramDay> {
        val json = settings.getStringOrNull("il_program_v2") ?: return emptyList()
        return try {
            Json.decodeFromString(json)
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun setProgram(program: List<ProgramDay>) {
        settings.putString("il_program_v2", Json.encodeToString(program))
    }

    fun getExercises(): List<ExerciseDef>? {
        val json = settings.getStringOrNull("il_exercises_v3") ?: return null
        return try {
            Json.decodeFromString(json)
        } catch (e: Exception) {
            null
        }
    }

    fun setExercises(exercises: List<ExerciseDef>) {
        settings.putString("il_exercises_v3", Json.encodeToString(exercises))
    }
}
