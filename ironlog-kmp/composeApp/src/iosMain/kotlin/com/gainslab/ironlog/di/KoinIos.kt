package com.gainslab.ironlog.di

import com.gainslab.ironlog.db.AppDatabase
import com.gainslab.ironlog.db.createDatabase
import com.gainslab.ironlog.db.getDatabaseBuilder
import com.russhwolf.settings.NSUserDefaultsSettings
import com.russhwolf.settings.Settings
import org.koin.core.module.Module
import org.koin.dsl.module
import platform.Foundation.NSUserDefaults

actual val platformModule: Module = module {
    single<Settings> {
        val userDefaults = NSUserDefaults.standardUserDefaults
        NSUserDefaultsSettings(userDefaults)
    }

    single<AppDatabase> {
        val builder = getDatabaseBuilder()
        createDatabase(builder)
    }
}
