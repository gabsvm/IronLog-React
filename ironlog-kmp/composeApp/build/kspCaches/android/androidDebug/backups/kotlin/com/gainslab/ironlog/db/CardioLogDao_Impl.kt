package com.gainslab.ironlog.db

import androidx.room.EntityInsertAdapter
import androidx.room.RoomDatabase
import androidx.room.coroutines.createFlow
import androidx.room.util.getColumnIndexOrThrow
import androidx.room.util.performSuspending
import androidx.sqlite.SQLiteStatement
import javax.`annotation`.processing.Generated
import kotlin.Double
import kotlin.Int
import kotlin.Long
import kotlin.String
import kotlin.Suppress
import kotlin.Unit
import kotlin.collections.List
import kotlin.collections.MutableList
import kotlin.collections.mutableListOf
import kotlin.reflect.KClass
import kotlinx.coroutines.flow.Flow

@Generated(value = ["androidx.room.RoomProcessor"])
@Suppress(names = ["UNCHECKED_CAST", "DEPRECATION", "REDUNDANT_PROJECTION", "REMOVAL"])
public class CardioLogDao_Impl(
  __db: RoomDatabase,
) : CardioLogDao {
  private val __db: RoomDatabase

  private val __insertAdapterOfCardioLogEntity: EntityInsertAdapter<CardioLogEntity>
  init {
    this.__db = __db
    this.__insertAdapterOfCardioLogEntity = object : EntityInsertAdapter<CardioLogEntity>() {
      protected override fun createQuery(): String =
          "INSERT OR REPLACE INTO `cardio_logs` (`id`,`date`,`activityType`,`durationMin`,`distanceKm`,`caloriesBurned`,`avgHeartRate`,`notes`,`timestamp`) VALUES (?,?,?,?,?,?,?,?,?)"

      protected override fun bind(statement: SQLiteStatement, entity: CardioLogEntity) {
        statement.bindText(1, entity.id)
        statement.bindText(2, entity.date)
        statement.bindText(3, entity.activityType)
        statement.bindDouble(4, entity.durationMin)
        val _tmpDistanceKm: Double? = entity.distanceKm
        if (_tmpDistanceKm == null) {
          statement.bindNull(5)
        } else {
          statement.bindDouble(5, _tmpDistanceKm)
        }
        val _tmpCaloriesBurned: Double? = entity.caloriesBurned
        if (_tmpCaloriesBurned == null) {
          statement.bindNull(6)
        } else {
          statement.bindDouble(6, _tmpCaloriesBurned)
        }
        val _tmpAvgHeartRate: Double? = entity.avgHeartRate
        if (_tmpAvgHeartRate == null) {
          statement.bindNull(7)
        } else {
          statement.bindDouble(7, _tmpAvgHeartRate)
        }
        val _tmpNotes: String? = entity.notes
        if (_tmpNotes == null) {
          statement.bindNull(8)
        } else {
          statement.bindText(8, _tmpNotes)
        }
        statement.bindLong(9, entity.timestamp)
      }
    }
  }

  public override suspend fun insertCardioLog(log: CardioLogEntity): Unit = performSuspending(__db,
      false, true) { _connection ->
    __insertAdapterOfCardioLogEntity.insert(_connection, log)
  }

  public override fun getAllCardioLogsFlow(): Flow<List<CardioLogEntity>> {
    val _sql: String = "SELECT * FROM cardio_logs ORDER BY date DESC, timestamp DESC"
    return createFlow(__db, false, arrayOf("cardio_logs")) { _connection ->
      val _stmt: SQLiteStatement = _connection.prepare(_sql)
      try {
        val _cursorIndexOfId: Int = getColumnIndexOrThrow(_stmt, "id")
        val _cursorIndexOfDate: Int = getColumnIndexOrThrow(_stmt, "date")
        val _cursorIndexOfActivityType: Int = getColumnIndexOrThrow(_stmt, "activityType")
        val _cursorIndexOfDurationMin: Int = getColumnIndexOrThrow(_stmt, "durationMin")
        val _cursorIndexOfDistanceKm: Int = getColumnIndexOrThrow(_stmt, "distanceKm")
        val _cursorIndexOfCaloriesBurned: Int = getColumnIndexOrThrow(_stmt, "caloriesBurned")
        val _cursorIndexOfAvgHeartRate: Int = getColumnIndexOrThrow(_stmt, "avgHeartRate")
        val _cursorIndexOfNotes: Int = getColumnIndexOrThrow(_stmt, "notes")
        val _cursorIndexOfTimestamp: Int = getColumnIndexOrThrow(_stmt, "timestamp")
        val _result: MutableList<CardioLogEntity> = mutableListOf()
        while (_stmt.step()) {
          val _item: CardioLogEntity
          val _tmpId: String
          _tmpId = _stmt.getText(_cursorIndexOfId)
          val _tmpDate: String
          _tmpDate = _stmt.getText(_cursorIndexOfDate)
          val _tmpActivityType: String
          _tmpActivityType = _stmt.getText(_cursorIndexOfActivityType)
          val _tmpDurationMin: Double
          _tmpDurationMin = _stmt.getDouble(_cursorIndexOfDurationMin)
          val _tmpDistanceKm: Double?
          if (_stmt.isNull(_cursorIndexOfDistanceKm)) {
            _tmpDistanceKm = null
          } else {
            _tmpDistanceKm = _stmt.getDouble(_cursorIndexOfDistanceKm)
          }
          val _tmpCaloriesBurned: Double?
          if (_stmt.isNull(_cursorIndexOfCaloriesBurned)) {
            _tmpCaloriesBurned = null
          } else {
            _tmpCaloriesBurned = _stmt.getDouble(_cursorIndexOfCaloriesBurned)
          }
          val _tmpAvgHeartRate: Double?
          if (_stmt.isNull(_cursorIndexOfAvgHeartRate)) {
            _tmpAvgHeartRate = null
          } else {
            _tmpAvgHeartRate = _stmt.getDouble(_cursorIndexOfAvgHeartRate)
          }
          val _tmpNotes: String?
          if (_stmt.isNull(_cursorIndexOfNotes)) {
            _tmpNotes = null
          } else {
            _tmpNotes = _stmt.getText(_cursorIndexOfNotes)
          }
          val _tmpTimestamp: Long
          _tmpTimestamp = _stmt.getLong(_cursorIndexOfTimestamp)
          _item =
              CardioLogEntity(_tmpId,_tmpDate,_tmpActivityType,_tmpDurationMin,_tmpDistanceKm,_tmpCaloriesBurned,_tmpAvgHeartRate,_tmpNotes,_tmpTimestamp)
          _result.add(_item)
        }
        _result
      } finally {
        _stmt.close()
      }
    }
  }

  public override suspend fun deleteCardioLogById(id: String) {
    val _sql: String = "DELETE FROM cardio_logs WHERE id = ?"
    return performSuspending(__db, false, true) { _connection ->
      val _stmt: SQLiteStatement = _connection.prepare(_sql)
      try {
        var _argIndex: Int = 1
        _stmt.bindText(_argIndex, id)
        _stmt.step()
      } finally {
        _stmt.close()
      }
    }
  }

  public override suspend fun deleteAllCardioLogs() {
    val _sql: String = "DELETE FROM cardio_logs"
    return performSuspending(__db, false, true) { _connection ->
      val _stmt: SQLiteStatement = _connection.prepare(_sql)
      try {
        _stmt.step()
      } finally {
        _stmt.close()
      }
    }
  }

  public companion object {
    public fun getRequiredConverters(): List<KClass<*>> = emptyList()
  }
}
