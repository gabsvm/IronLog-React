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
public class BodyLogDao_Impl(
  __db: RoomDatabase,
) : BodyLogDao {
  private val __db: RoomDatabase

  private val __insertAdapterOfBodyLogEntity: EntityInsertAdapter<BodyLogEntity>
  init {
    this.__db = __db
    this.__insertAdapterOfBodyLogEntity = object : EntityInsertAdapter<BodyLogEntity>() {
      protected override fun createQuery(): String =
          "INSERT OR REPLACE INTO `body_logs` (`id`,`date`,`weight`,`bodyFat`,`notes`) VALUES (nullif(?, 0),?,?,?,?)"

      protected override fun bind(statement: SQLiteStatement, entity: BodyLogEntity) {
        statement.bindLong(1, entity.id)
        statement.bindLong(2, entity.date)
        statement.bindDouble(3, entity.weight)
        val _tmpBodyFat: Double? = entity.bodyFat
        if (_tmpBodyFat == null) {
          statement.bindNull(4)
        } else {
          statement.bindDouble(4, _tmpBodyFat)
        }
        val _tmpNotes: String? = entity.notes
        if (_tmpNotes == null) {
          statement.bindNull(5)
        } else {
          statement.bindText(5, _tmpNotes)
        }
      }
    }
  }

  public override suspend fun insertBodyLog(log: BodyLogEntity): Unit = performSuspending(__db,
      false, true) { _connection ->
    __insertAdapterOfBodyLogEntity.insert(_connection, log)
  }

  public override fun getAllBodyLogsFlow(): Flow<List<BodyLogEntity>> {
    val _sql: String = "SELECT * FROM body_logs ORDER BY date DESC"
    return createFlow(__db, false, arrayOf("body_logs")) { _connection ->
      val _stmt: SQLiteStatement = _connection.prepare(_sql)
      try {
        val _cursorIndexOfId: Int = getColumnIndexOrThrow(_stmt, "id")
        val _cursorIndexOfDate: Int = getColumnIndexOrThrow(_stmt, "date")
        val _cursorIndexOfWeight: Int = getColumnIndexOrThrow(_stmt, "weight")
        val _cursorIndexOfBodyFat: Int = getColumnIndexOrThrow(_stmt, "bodyFat")
        val _cursorIndexOfNotes: Int = getColumnIndexOrThrow(_stmt, "notes")
        val _result: MutableList<BodyLogEntity> = mutableListOf()
        while (_stmt.step()) {
          val _item: BodyLogEntity
          val _tmpId: Long
          _tmpId = _stmt.getLong(_cursorIndexOfId)
          val _tmpDate: Long
          _tmpDate = _stmt.getLong(_cursorIndexOfDate)
          val _tmpWeight: Double
          _tmpWeight = _stmt.getDouble(_cursorIndexOfWeight)
          val _tmpBodyFat: Double?
          if (_stmt.isNull(_cursorIndexOfBodyFat)) {
            _tmpBodyFat = null
          } else {
            _tmpBodyFat = _stmt.getDouble(_cursorIndexOfBodyFat)
          }
          val _tmpNotes: String?
          if (_stmt.isNull(_cursorIndexOfNotes)) {
            _tmpNotes = null
          } else {
            _tmpNotes = _stmt.getText(_cursorIndexOfNotes)
          }
          _item = BodyLogEntity(_tmpId,_tmpDate,_tmpWeight,_tmpBodyFat,_tmpNotes)
          _result.add(_item)
        }
        _result
      } finally {
        _stmt.close()
      }
    }
  }

  public override suspend fun deleteBodyLogById(id: Long) {
    val _sql: String = "DELETE FROM body_logs WHERE id = ?"
    return performSuspending(__db, false, true) { _connection ->
      val _stmt: SQLiteStatement = _connection.prepare(_sql)
      try {
        var _argIndex: Int = 1
        _stmt.bindLong(_argIndex, id)
        _stmt.step()
      } finally {
        _stmt.close()
      }
    }
  }

  public override suspend fun deleteAllBodyLogs() {
    val _sql: String = "DELETE FROM body_logs"
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
