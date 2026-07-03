package com.gainslab.ironlog.db

import androidx.room.InvalidationTracker
import androidx.room.RoomOpenDelegate
import androidx.room.migration.AutoMigrationSpec
import androidx.room.migration.Migration
import androidx.room.util.TableInfo
import androidx.room.util.TableInfo.Companion.read
import androidx.room.util.dropFtsSyncTriggers
import androidx.sqlite.SQLiteConnection
import androidx.sqlite.execSQL
import javax.`annotation`.processing.Generated
import kotlin.Any
import kotlin.Lazy
import kotlin.String
import kotlin.Suppress
import kotlin.collections.List
import kotlin.collections.Map
import kotlin.collections.MutableList
import kotlin.collections.MutableMap
import kotlin.collections.MutableSet
import kotlin.collections.Set
import kotlin.collections.mutableListOf
import kotlin.collections.mutableMapOf
import kotlin.collections.mutableSetOf
import kotlin.reflect.KClass

@Generated(value = ["androidx.room.RoomProcessor"])
@Suppress(names = ["UNCHECKED_CAST", "DEPRECATION", "REDUNDANT_PROJECTION", "REMOVAL"])
public class AppDatabase_Impl : AppDatabase() {
  private val _logDao: Lazy<LogDao> = lazy {
    LogDao_Impl(this)
  }


  private val _bodyLogDao: Lazy<BodyLogDao> = lazy {
    BodyLogDao_Impl(this)
  }


  private val _nutritionLogDao: Lazy<NutritionLogDao> = lazy {
    NutritionLogDao_Impl(this)
  }


  private val _cardioLogDao: Lazy<CardioLogDao> = lazy {
    CardioLogDao_Impl(this)
  }


  protected override fun createOpenDelegate(): RoomOpenDelegate {
    val _openDelegate: RoomOpenDelegate = object : RoomOpenDelegate(1,
        "834e0662a2b80b52cea8cb2a02735317", "09dd49e202414f37835df8c61528720b") {
      public override fun createAllTables(connection: SQLiteConnection) {
        connection.execSQL("CREATE TABLE IF NOT EXISTS `workout_logs` (`id` INTEGER NOT NULL, `dayIdx` INTEGER NOT NULL, `name` TEXT NOT NULL, `startTime` INTEGER NOT NULL, `endTime` INTEGER NOT NULL, `duration` INTEGER NOT NULL, `skipped` INTEGER NOT NULL, `mesoId` INTEGER NOT NULL, `week` INTEGER NOT NULL, `exercisesJson` TEXT NOT NULL, `note` TEXT, PRIMARY KEY(`id`))")
        connection.execSQL("CREATE TABLE IF NOT EXISTS `body_logs` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `date` INTEGER NOT NULL, `weight` REAL NOT NULL, `bodyFat` REAL, `notes` TEXT)")
        connection.execSQL("CREATE TABLE IF NOT EXISTS `nutrition_logs` (`date` TEXT NOT NULL, `entriesJson` TEXT NOT NULL, `waterMl` REAL, PRIMARY KEY(`date`))")
        connection.execSQL("CREATE TABLE IF NOT EXISTS `cardio_logs` (`id` TEXT NOT NULL, `date` TEXT NOT NULL, `activityType` TEXT NOT NULL, `durationMin` REAL NOT NULL, `distanceKm` REAL, `caloriesBurned` REAL, `avgHeartRate` REAL, `notes` TEXT, `timestamp` INTEGER NOT NULL, PRIMARY KEY(`id`))")
        connection.execSQL("CREATE TABLE IF NOT EXISTS room_master_table (id INTEGER PRIMARY KEY,identity_hash TEXT)")
        connection.execSQL("INSERT OR REPLACE INTO room_master_table (id,identity_hash) VALUES(42, '834e0662a2b80b52cea8cb2a02735317')")
      }

      public override fun dropAllTables(connection: SQLiteConnection) {
        connection.execSQL("DROP TABLE IF EXISTS `workout_logs`")
        connection.execSQL("DROP TABLE IF EXISTS `body_logs`")
        connection.execSQL("DROP TABLE IF EXISTS `nutrition_logs`")
        connection.execSQL("DROP TABLE IF EXISTS `cardio_logs`")
      }

      public override fun onCreate(connection: SQLiteConnection) {
      }

      public override fun onOpen(connection: SQLiteConnection) {
        internalInitInvalidationTracker(connection)
      }

      public override fun onPreMigrate(connection: SQLiteConnection) {
        dropFtsSyncTriggers(connection)
      }

      public override fun onPostMigrate(connection: SQLiteConnection) {
      }

      public override fun onValidateSchema(connection: SQLiteConnection):
          RoomOpenDelegate.ValidationResult {
        val _columnsWorkoutLogs: MutableMap<String, TableInfo.Column> = mutableMapOf()
        _columnsWorkoutLogs.put("id", TableInfo.Column("id", "INTEGER", true, 1, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsWorkoutLogs.put("dayIdx", TableInfo.Column("dayIdx", "INTEGER", true, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsWorkoutLogs.put("name", TableInfo.Column("name", "TEXT", true, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsWorkoutLogs.put("startTime", TableInfo.Column("startTime", "INTEGER", true, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsWorkoutLogs.put("endTime", TableInfo.Column("endTime", "INTEGER", true, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsWorkoutLogs.put("duration", TableInfo.Column("duration", "INTEGER", true, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsWorkoutLogs.put("skipped", TableInfo.Column("skipped", "INTEGER", true, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsWorkoutLogs.put("mesoId", TableInfo.Column("mesoId", "INTEGER", true, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsWorkoutLogs.put("week", TableInfo.Column("week", "INTEGER", true, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsWorkoutLogs.put("exercisesJson", TableInfo.Column("exercisesJson", "TEXT", true, 0,
            null, TableInfo.CREATED_FROM_ENTITY))
        _columnsWorkoutLogs.put("note", TableInfo.Column("note", "TEXT", false, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        val _foreignKeysWorkoutLogs: MutableSet<TableInfo.ForeignKey> = mutableSetOf()
        val _indicesWorkoutLogs: MutableSet<TableInfo.Index> = mutableSetOf()
        val _infoWorkoutLogs: TableInfo = TableInfo("workout_logs", _columnsWorkoutLogs,
            _foreignKeysWorkoutLogs, _indicesWorkoutLogs)
        val _existingWorkoutLogs: TableInfo = read(connection, "workout_logs")
        if (!_infoWorkoutLogs.equals(_existingWorkoutLogs)) {
          return RoomOpenDelegate.ValidationResult(false, """
              |workout_logs(com.gainslab.ironlog.db.LogEntity).
              | Expected:
              |""".trimMargin() + _infoWorkoutLogs + """
              |
              | Found:
              |""".trimMargin() + _existingWorkoutLogs)
        }
        val _columnsBodyLogs: MutableMap<String, TableInfo.Column> = mutableMapOf()
        _columnsBodyLogs.put("id", TableInfo.Column("id", "INTEGER", true, 1, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsBodyLogs.put("date", TableInfo.Column("date", "INTEGER", true, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsBodyLogs.put("weight", TableInfo.Column("weight", "REAL", true, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsBodyLogs.put("bodyFat", TableInfo.Column("bodyFat", "REAL", false, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsBodyLogs.put("notes", TableInfo.Column("notes", "TEXT", false, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        val _foreignKeysBodyLogs: MutableSet<TableInfo.ForeignKey> = mutableSetOf()
        val _indicesBodyLogs: MutableSet<TableInfo.Index> = mutableSetOf()
        val _infoBodyLogs: TableInfo = TableInfo("body_logs", _columnsBodyLogs,
            _foreignKeysBodyLogs, _indicesBodyLogs)
        val _existingBodyLogs: TableInfo = read(connection, "body_logs")
        if (!_infoBodyLogs.equals(_existingBodyLogs)) {
          return RoomOpenDelegate.ValidationResult(false, """
              |body_logs(com.gainslab.ironlog.db.BodyLogEntity).
              | Expected:
              |""".trimMargin() + _infoBodyLogs + """
              |
              | Found:
              |""".trimMargin() + _existingBodyLogs)
        }
        val _columnsNutritionLogs: MutableMap<String, TableInfo.Column> = mutableMapOf()
        _columnsNutritionLogs.put("date", TableInfo.Column("date", "TEXT", true, 1, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsNutritionLogs.put("entriesJson", TableInfo.Column("entriesJson", "TEXT", true, 0,
            null, TableInfo.CREATED_FROM_ENTITY))
        _columnsNutritionLogs.put("waterMl", TableInfo.Column("waterMl", "REAL", false, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        val _foreignKeysNutritionLogs: MutableSet<TableInfo.ForeignKey> = mutableSetOf()
        val _indicesNutritionLogs: MutableSet<TableInfo.Index> = mutableSetOf()
        val _infoNutritionLogs: TableInfo = TableInfo("nutrition_logs", _columnsNutritionLogs,
            _foreignKeysNutritionLogs, _indicesNutritionLogs)
        val _existingNutritionLogs: TableInfo = read(connection, "nutrition_logs")
        if (!_infoNutritionLogs.equals(_existingNutritionLogs)) {
          return RoomOpenDelegate.ValidationResult(false, """
              |nutrition_logs(com.gainslab.ironlog.db.NutritionLogEntity).
              | Expected:
              |""".trimMargin() + _infoNutritionLogs + """
              |
              | Found:
              |""".trimMargin() + _existingNutritionLogs)
        }
        val _columnsCardioLogs: MutableMap<String, TableInfo.Column> = mutableMapOf()
        _columnsCardioLogs.put("id", TableInfo.Column("id", "TEXT", true, 1, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsCardioLogs.put("date", TableInfo.Column("date", "TEXT", true, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsCardioLogs.put("activityType", TableInfo.Column("activityType", "TEXT", true, 0,
            null, TableInfo.CREATED_FROM_ENTITY))
        _columnsCardioLogs.put("durationMin", TableInfo.Column("durationMin", "REAL", true, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsCardioLogs.put("distanceKm", TableInfo.Column("distanceKm", "REAL", false, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsCardioLogs.put("caloriesBurned", TableInfo.Column("caloriesBurned", "REAL", false,
            0, null, TableInfo.CREATED_FROM_ENTITY))
        _columnsCardioLogs.put("avgHeartRate", TableInfo.Column("avgHeartRate", "REAL", false, 0,
            null, TableInfo.CREATED_FROM_ENTITY))
        _columnsCardioLogs.put("notes", TableInfo.Column("notes", "TEXT", false, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        _columnsCardioLogs.put("timestamp", TableInfo.Column("timestamp", "INTEGER", true, 0, null,
            TableInfo.CREATED_FROM_ENTITY))
        val _foreignKeysCardioLogs: MutableSet<TableInfo.ForeignKey> = mutableSetOf()
        val _indicesCardioLogs: MutableSet<TableInfo.Index> = mutableSetOf()
        val _infoCardioLogs: TableInfo = TableInfo("cardio_logs", _columnsCardioLogs,
            _foreignKeysCardioLogs, _indicesCardioLogs)
        val _existingCardioLogs: TableInfo = read(connection, "cardio_logs")
        if (!_infoCardioLogs.equals(_existingCardioLogs)) {
          return RoomOpenDelegate.ValidationResult(false, """
              |cardio_logs(com.gainslab.ironlog.db.CardioLogEntity).
              | Expected:
              |""".trimMargin() + _infoCardioLogs + """
              |
              | Found:
              |""".trimMargin() + _existingCardioLogs)
        }
        return RoomOpenDelegate.ValidationResult(true, null)
      }
    }
    return _openDelegate
  }

  protected override fun createInvalidationTracker(): InvalidationTracker {
    val _shadowTablesMap: MutableMap<String, String> = mutableMapOf()
    val _viewTables: MutableMap<String, Set<String>> = mutableMapOf()
    return InvalidationTracker(this, _shadowTablesMap, _viewTables, "workout_logs", "body_logs",
        "nutrition_logs", "cardio_logs")
  }

  public override fun clearAllTables() {
    super.performClear(false, "workout_logs", "body_logs", "nutrition_logs", "cardio_logs")
  }

  protected override fun getRequiredTypeConverterClasses():
      Map<KClass<out Any>, List<KClass<out Any>>> {
    val _typeConvertersMap: MutableMap<KClass<out Any>, List<KClass<out Any>>> = mutableMapOf()
    _typeConvertersMap.put(LogDao::class, LogDao_Impl.getRequiredConverters())
    _typeConvertersMap.put(BodyLogDao::class, BodyLogDao_Impl.getRequiredConverters())
    _typeConvertersMap.put(NutritionLogDao::class, NutritionLogDao_Impl.getRequiredConverters())
    _typeConvertersMap.put(CardioLogDao::class, CardioLogDao_Impl.getRequiredConverters())
    return _typeConvertersMap
  }

  public override fun getRequiredAutoMigrationSpecClasses(): Set<KClass<out AutoMigrationSpec>> {
    val _autoMigrationSpecsSet: MutableSet<KClass<out AutoMigrationSpec>> = mutableSetOf()
    return _autoMigrationSpecsSet
  }

  public override
      fun createAutoMigrations(autoMigrationSpecs: Map<KClass<out AutoMigrationSpec>, AutoMigrationSpec>):
      List<Migration> {
    val _autoMigrations: MutableList<Migration> = mutableListOf()
    return _autoMigrations
  }

  public override fun logDao(): LogDao = _logDao.value

  public override fun bodyLogDao(): BodyLogDao = _bodyLogDao.value

  public override fun nutritionLogDao(): NutritionLogDao = _nutritionLogDao.value

  public override fun cardioLogDao(): CardioLogDao = _cardioLogDao.value
}
