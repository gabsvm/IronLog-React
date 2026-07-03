package com.gainslab.ironlog.db

import androidx.room.RoomDatabase

expect fun getDatabaseBuilder(context: Any? = null): RoomDatabase.Builder<AppDatabase>
