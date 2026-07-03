package com.gainslab.ironlog.db

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [
        LogEntity::class,
        BodyLogEntity::class,
        NutritionLogEntity::class,
        CardioLogEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun logDao(): LogDao
    abstract fun bodyLogDao(): BodyLogDao
    abstract fun nutritionLogDao(): NutritionLogDao
    abstract fun cardioLogDao(): CardioLogDao
}

fun createDatabase(builder: RoomDatabase.Builder<AppDatabase>): AppDatabase {
    return builder
        .setDriver(androidx.sqlite.driver.bundled.BundledSQLiteDriver())
        .setQueryCoroutineContext(kotlinx.coroutines.Dispatchers.IO)
        .build()
}
