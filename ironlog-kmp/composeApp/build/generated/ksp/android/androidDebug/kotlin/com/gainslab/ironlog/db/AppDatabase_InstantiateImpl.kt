package com.gainslab.ironlog.db

import kotlin.reflect.KClass

internal fun KClass<AppDatabase>.instantiateImpl(): AppDatabase =
    com.gainslab.ironlog.db.AppDatabase_Impl()
