package com.gainslab.ironlog.di

import com.gainslab.ironlog.db.AppDatabase
import com.gainslab.ironlog.db.createDatabase
import com.gainslab.ironlog.db.getDatabaseBuilder
import com.russhwolf.settings.Settings
import com.russhwolf.settings.SharedPreferencesSettings
import org.koin.core.module.Module
import org.koin.dsl.module

actual val platformModule: Module = module {
    single<Settings> {
        val context: android.content.Context = get()
        val sharedPrefs = context.getSharedPreferences("${context.packageName}_preferences", android.content.Context.MODE_PRIVATE)
        SharedPreferencesSettings(sharedPrefs)
    }

    single<AppDatabase> {
        val context: android.content.Context = get()
        val builder = getDatabaseBuilder(context)
        createDatabase(builder)
    }
}
