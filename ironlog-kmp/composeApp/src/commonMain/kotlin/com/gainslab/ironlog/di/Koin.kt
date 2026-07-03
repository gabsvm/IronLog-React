package com.gainslab.ironlog.di

import com.gainslab.ironlog.db.AppDatabase
import com.gainslab.ironlog.db.AppPreferences
import com.gainslab.ironlog.store.AppStore
import org.koin.core.context.startKoin
import org.koin.core.module.Module
import org.koin.dsl.KoinAppDeclaration
import org.koin.dsl.module

expect val platformModule: Module

fun initKoin(appDeclaration: KoinAppDeclaration? = null) {
    startKoin {
        appDeclaration?.invoke(this)
        modules(commonModule, platformModule)
    }
}

val commonModule = module {
    single<AppPreferences> { AppPreferences(get()) }
    
    // Bind DAOs from the platform-specific AppDatabase instance
    single { get<AppDatabase>().logDao() }
    single { get<AppDatabase>().bodyLogDao() }
    single { get<AppDatabase>().nutritionLogDao() }
    single { get<AppDatabase>().cardioLogDao() }
    
    // Bind AppStore
    single { AppStore(get(), get(), get(), get(), get()) }
}
