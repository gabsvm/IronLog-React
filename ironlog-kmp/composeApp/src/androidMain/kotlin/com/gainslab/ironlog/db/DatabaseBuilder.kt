package com.gainslab.ironlog.db

import android.content.Context
import androidx.room.Room
import androidx.room.RoomDatabase

actual fun getDatabaseBuilder(context: Any?): RoomDatabase.Builder<AppDatabase> {
    val appContext = (context as? Context) ?: throw IllegalArgumentException("Android context required")
    val dbFile = appContext.getDatabasePath("ironlog.db")
    return Room.databaseBuilder<AppDatabase>(
        context = appContext,
        name = dbFile.absolutePath
    )
}
