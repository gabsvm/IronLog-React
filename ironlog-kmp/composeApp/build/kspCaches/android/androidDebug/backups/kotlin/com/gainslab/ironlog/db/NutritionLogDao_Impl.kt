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
public class NutritionLogDao_Impl(
  __db: RoomDatabase,
) : NutritionLogDao {
  private val __db: RoomDatabase

  private val __insertAdapterOfNutritionLogEntity: EntityInsertAdapter<NutritionLogEntity>
  init {
    this.__db = __db
    this.__insertAdapterOfNutritionLogEntity = object : EntityInsertAdapter<NutritionLogEntity>() {
      protected override fun createQuery(): String =
          "INSERT OR REPLACE INTO `nutrition_logs` (`date`,`entriesJson`,`waterMl`) VALUES (?,?,?)"

      protected override fun bind(statement: SQLiteStatement, entity: NutritionLogEntity) {
        statement.bindText(1, entity.date)
        statement.bindText(2, entity.entriesJson)
        val _tmpWaterMl: Double? = entity.waterMl
        if (_tmpWaterMl == null) {
          statement.bindNull(3)
        } else {
          statement.bindDouble(3, _tmpWaterMl)
        }
      }
    }
  }

  public override suspend fun insertNutritionLog(log: NutritionLogEntity): Unit =
      performSuspending(__db, false, true) { _connection ->
    __insertAdapterOfNutritionLogEntity.insert(_connection, log)
  }

  public override fun getAllNutritionLogsFlow(): Flow<List<NutritionLogEntity>> {
    val _sql: String = "SELECT * FROM nutrition_logs ORDER BY date DESC"
    return createFlow(__db, false, arrayOf("nutrition_logs")) { _connection ->
      val _stmt: SQLiteStatement = _connection.prepare(_sql)
      try {
        val _cursorIndexOfDate: Int = getColumnIndexOrThrow(_stmt, "date")
        val _cursorIndexOfEntriesJson: Int = getColumnIndexOrThrow(_stmt, "entriesJson")
        val _cursorIndexOfWaterMl: Int = getColumnIndexOrThrow(_stmt, "waterMl")
        val _result: MutableList<NutritionLogEntity> = mutableListOf()
        while (_stmt.step()) {
          val _item: NutritionLogEntity
          val _tmpDate: String
          _tmpDate = _stmt.getText(_cursorIndexOfDate)
          val _tmpEntriesJson: String
          _tmpEntriesJson = _stmt.getText(_cursorIndexOfEntriesJson)
          val _tmpWaterMl: Double?
          if (_stmt.isNull(_cursorIndexOfWaterMl)) {
            _tmpWaterMl = null
          } else {
            _tmpWaterMl = _stmt.getDouble(_cursorIndexOfWaterMl)
          }
          _item = NutritionLogEntity(_tmpDate,_tmpEntriesJson,_tmpWaterMl)
          _result.add(_item)
        }
        _result
      } finally {
        _stmt.close()
      }
    }
  }

  public override suspend fun getNutritionLogByDate(date: String): NutritionLogEntity? {
    val _sql: String = "SELECT * FROM nutrition_logs WHERE date = ? LIMIT 1"
    return performSuspending(__db, true, false) { _connection ->
      val _stmt: SQLiteStatement = _connection.prepare(_sql)
      try {
        var _argIndex: Int = 1
        _stmt.bindText(_argIndex, date)
        val _cursorIndexOfDate: Int = getColumnIndexOrThrow(_stmt, "date")
        val _cursorIndexOfEntriesJson: Int = getColumnIndexOrThrow(_stmt, "entriesJson")
        val _cursorIndexOfWaterMl: Int = getColumnIndexOrThrow(_stmt, "waterMl")
        val _result: NutritionLogEntity?
        if (_stmt.step()) {
          val _tmpDate: String
          _tmpDate = _stmt.getText(_cursorIndexOfDate)
          val _tmpEntriesJson: String
          _tmpEntriesJson = _stmt.getText(_cursorIndexOfEntriesJson)
          val _tmpWaterMl: Double?
          if (_stmt.isNull(_cursorIndexOfWaterMl)) {
            _tmpWaterMl = null
          } else {
            _tmpWaterMl = _stmt.getDouble(_cursorIndexOfWaterMl)
          }
          _result = NutritionLogEntity(_tmpDate,_tmpEntriesJson,_tmpWaterMl)
        } else {
          _result = null
        }
        _result
      } finally {
        _stmt.close()
      }
    }
  }

  public override suspend fun deleteNutritionLogByDate(date: String) {
    val _sql: String = "DELETE FROM nutrition_logs WHERE date = ?"
    return performSuspending(__db, false, true) { _connection ->
      val _stmt: SQLiteStatement = _connection.prepare(_sql)
      try {
        var _argIndex: Int = 1
        _stmt.bindText(_argIndex, date)
        _stmt.step()
      } finally {
        _stmt.close()
      }
    }
  }

  public override suspend fun deleteAllNutritionLogs() {
    val _sql: String = "DELETE FROM nutrition_logs"
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
