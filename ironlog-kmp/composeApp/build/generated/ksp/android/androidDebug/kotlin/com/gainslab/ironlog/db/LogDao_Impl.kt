package com.gainslab.ironlog.db

import androidx.room.EntityInsertAdapter
import androidx.room.RoomDatabase
import androidx.room.coroutines.createFlow
import androidx.room.util.getColumnIndexOrThrow
import androidx.room.util.performSuspending
import androidx.sqlite.SQLiteStatement
import javax.`annotation`.processing.Generated
import kotlin.Boolean
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
public class LogDao_Impl(
  __db: RoomDatabase,
) : LogDao {
  private val __db: RoomDatabase

  private val __insertAdapterOfLogEntity: EntityInsertAdapter<LogEntity>
  init {
    this.__db = __db
    this.__insertAdapterOfLogEntity = object : EntityInsertAdapter<LogEntity>() {
      protected override fun createQuery(): String =
          "INSERT OR REPLACE INTO `workout_logs` (`id`,`dayIdx`,`name`,`startTime`,`endTime`,`duration`,`skipped`,`mesoId`,`week`,`exercisesJson`,`note`) VALUES (?,?,?,?,?,?,?,?,?,?,?)"

      protected override fun bind(statement: SQLiteStatement, entity: LogEntity) {
        statement.bindLong(1, entity.id)
        statement.bindLong(2, entity.dayIdx.toLong())
        statement.bindText(3, entity.name)
        statement.bindLong(4, entity.startTime)
        statement.bindLong(5, entity.endTime)
        statement.bindLong(6, entity.duration)
        val _tmp: Int = if (entity.skipped) 1 else 0
        statement.bindLong(7, _tmp.toLong())
        statement.bindLong(8, entity.mesoId)
        statement.bindLong(9, entity.week.toLong())
        statement.bindText(10, entity.exercisesJson)
        val _tmpNote: String? = entity.note
        if (_tmpNote == null) {
          statement.bindNull(11)
        } else {
          statement.bindText(11, _tmpNote)
        }
      }
    }
  }

  public override suspend fun insertLog(log: LogEntity): Unit = performSuspending(__db, false, true)
      { _connection ->
    __insertAdapterOfLogEntity.insert(_connection, log)
  }

  public override fun getAllLogsFlow(): Flow<List<LogEntity>> {
    val _sql: String = "SELECT * FROM workout_logs ORDER BY startTime DESC"
    return createFlow(__db, false, arrayOf("workout_logs")) { _connection ->
      val _stmt: SQLiteStatement = _connection.prepare(_sql)
      try {
        val _cursorIndexOfId: Int = getColumnIndexOrThrow(_stmt, "id")
        val _cursorIndexOfDayIdx: Int = getColumnIndexOrThrow(_stmt, "dayIdx")
        val _cursorIndexOfName: Int = getColumnIndexOrThrow(_stmt, "name")
        val _cursorIndexOfStartTime: Int = getColumnIndexOrThrow(_stmt, "startTime")
        val _cursorIndexOfEndTime: Int = getColumnIndexOrThrow(_stmt, "endTime")
        val _cursorIndexOfDuration: Int = getColumnIndexOrThrow(_stmt, "duration")
        val _cursorIndexOfSkipped: Int = getColumnIndexOrThrow(_stmt, "skipped")
        val _cursorIndexOfMesoId: Int = getColumnIndexOrThrow(_stmt, "mesoId")
        val _cursorIndexOfWeek: Int = getColumnIndexOrThrow(_stmt, "week")
        val _cursorIndexOfExercisesJson: Int = getColumnIndexOrThrow(_stmt, "exercisesJson")
        val _cursorIndexOfNote: Int = getColumnIndexOrThrow(_stmt, "note")
        val _result: MutableList<LogEntity> = mutableListOf()
        while (_stmt.step()) {
          val _item: LogEntity
          val _tmpId: Long
          _tmpId = _stmt.getLong(_cursorIndexOfId)
          val _tmpDayIdx: Int
          _tmpDayIdx = _stmt.getLong(_cursorIndexOfDayIdx).toInt()
          val _tmpName: String
          _tmpName = _stmt.getText(_cursorIndexOfName)
          val _tmpStartTime: Long
          _tmpStartTime = _stmt.getLong(_cursorIndexOfStartTime)
          val _tmpEndTime: Long
          _tmpEndTime = _stmt.getLong(_cursorIndexOfEndTime)
          val _tmpDuration: Long
          _tmpDuration = _stmt.getLong(_cursorIndexOfDuration)
          val _tmpSkipped: Boolean
          val _tmp: Int
          _tmp = _stmt.getLong(_cursorIndexOfSkipped).toInt()
          _tmpSkipped = _tmp != 0
          val _tmpMesoId: Long
          _tmpMesoId = _stmt.getLong(_cursorIndexOfMesoId)
          val _tmpWeek: Int
          _tmpWeek = _stmt.getLong(_cursorIndexOfWeek).toInt()
          val _tmpExercisesJson: String
          _tmpExercisesJson = _stmt.getText(_cursorIndexOfExercisesJson)
          val _tmpNote: String?
          if (_stmt.isNull(_cursorIndexOfNote)) {
            _tmpNote = null
          } else {
            _tmpNote = _stmt.getText(_cursorIndexOfNote)
          }
          _item =
              LogEntity(_tmpId,_tmpDayIdx,_tmpName,_tmpStartTime,_tmpEndTime,_tmpDuration,_tmpSkipped,_tmpMesoId,_tmpWeek,_tmpExercisesJson,_tmpNote)
          _result.add(_item)
        }
        _result
      } finally {
        _stmt.close()
      }
    }
  }

  public override suspend fun getLogById(id: Long): LogEntity? {
    val _sql: String = "SELECT * FROM workout_logs WHERE id = ? LIMIT 1"
    return performSuspending(__db, true, false) { _connection ->
      val _stmt: SQLiteStatement = _connection.prepare(_sql)
      try {
        var _argIndex: Int = 1
        _stmt.bindLong(_argIndex, id)
        val _cursorIndexOfId: Int = getColumnIndexOrThrow(_stmt, "id")
        val _cursorIndexOfDayIdx: Int = getColumnIndexOrThrow(_stmt, "dayIdx")
        val _cursorIndexOfName: Int = getColumnIndexOrThrow(_stmt, "name")
        val _cursorIndexOfStartTime: Int = getColumnIndexOrThrow(_stmt, "startTime")
        val _cursorIndexOfEndTime: Int = getColumnIndexOrThrow(_stmt, "endTime")
        val _cursorIndexOfDuration: Int = getColumnIndexOrThrow(_stmt, "duration")
        val _cursorIndexOfSkipped: Int = getColumnIndexOrThrow(_stmt, "skipped")
        val _cursorIndexOfMesoId: Int = getColumnIndexOrThrow(_stmt, "mesoId")
        val _cursorIndexOfWeek: Int = getColumnIndexOrThrow(_stmt, "week")
        val _cursorIndexOfExercisesJson: Int = getColumnIndexOrThrow(_stmt, "exercisesJson")
        val _cursorIndexOfNote: Int = getColumnIndexOrThrow(_stmt, "note")
        val _result: LogEntity?
        if (_stmt.step()) {
          val _tmpId: Long
          _tmpId = _stmt.getLong(_cursorIndexOfId)
          val _tmpDayIdx: Int
          _tmpDayIdx = _stmt.getLong(_cursorIndexOfDayIdx).toInt()
          val _tmpName: String
          _tmpName = _stmt.getText(_cursorIndexOfName)
          val _tmpStartTime: Long
          _tmpStartTime = _stmt.getLong(_cursorIndexOfStartTime)
          val _tmpEndTime: Long
          _tmpEndTime = _stmt.getLong(_cursorIndexOfEndTime)
          val _tmpDuration: Long
          _tmpDuration = _stmt.getLong(_cursorIndexOfDuration)
          val _tmpSkipped: Boolean
          val _tmp: Int
          _tmp = _stmt.getLong(_cursorIndexOfSkipped).toInt()
          _tmpSkipped = _tmp != 0
          val _tmpMesoId: Long
          _tmpMesoId = _stmt.getLong(_cursorIndexOfMesoId)
          val _tmpWeek: Int
          _tmpWeek = _stmt.getLong(_cursorIndexOfWeek).toInt()
          val _tmpExercisesJson: String
          _tmpExercisesJson = _stmt.getText(_cursorIndexOfExercisesJson)
          val _tmpNote: String?
          if (_stmt.isNull(_cursorIndexOfNote)) {
            _tmpNote = null
          } else {
            _tmpNote = _stmt.getText(_cursorIndexOfNote)
          }
          _result =
              LogEntity(_tmpId,_tmpDayIdx,_tmpName,_tmpStartTime,_tmpEndTime,_tmpDuration,_tmpSkipped,_tmpMesoId,_tmpWeek,_tmpExercisesJson,_tmpNote)
        } else {
          _result = null
        }
        _result
      } finally {
        _stmt.close()
      }
    }
  }

  public override suspend fun getLogsByMesoId(mesoId: Long): List<LogEntity> {
    val _sql: String = "SELECT * FROM workout_logs WHERE mesoId = ? ORDER BY startTime ASC"
    return performSuspending(__db, true, false) { _connection ->
      val _stmt: SQLiteStatement = _connection.prepare(_sql)
      try {
        var _argIndex: Int = 1
        _stmt.bindLong(_argIndex, mesoId)
        val _cursorIndexOfId: Int = getColumnIndexOrThrow(_stmt, "id")
        val _cursorIndexOfDayIdx: Int = getColumnIndexOrThrow(_stmt, "dayIdx")
        val _cursorIndexOfName: Int = getColumnIndexOrThrow(_stmt, "name")
        val _cursorIndexOfStartTime: Int = getColumnIndexOrThrow(_stmt, "startTime")
        val _cursorIndexOfEndTime: Int = getColumnIndexOrThrow(_stmt, "endTime")
        val _cursorIndexOfDuration: Int = getColumnIndexOrThrow(_stmt, "duration")
        val _cursorIndexOfSkipped: Int = getColumnIndexOrThrow(_stmt, "skipped")
        val _cursorIndexOfMesoId: Int = getColumnIndexOrThrow(_stmt, "mesoId")
        val _cursorIndexOfWeek: Int = getColumnIndexOrThrow(_stmt, "week")
        val _cursorIndexOfExercisesJson: Int = getColumnIndexOrThrow(_stmt, "exercisesJson")
        val _cursorIndexOfNote: Int = getColumnIndexOrThrow(_stmt, "note")
        val _result: MutableList<LogEntity> = mutableListOf()
        while (_stmt.step()) {
          val _item: LogEntity
          val _tmpId: Long
          _tmpId = _stmt.getLong(_cursorIndexOfId)
          val _tmpDayIdx: Int
          _tmpDayIdx = _stmt.getLong(_cursorIndexOfDayIdx).toInt()
          val _tmpName: String
          _tmpName = _stmt.getText(_cursorIndexOfName)
          val _tmpStartTime: Long
          _tmpStartTime = _stmt.getLong(_cursorIndexOfStartTime)
          val _tmpEndTime: Long
          _tmpEndTime = _stmt.getLong(_cursorIndexOfEndTime)
          val _tmpDuration: Long
          _tmpDuration = _stmt.getLong(_cursorIndexOfDuration)
          val _tmpSkipped: Boolean
          val _tmp: Int
          _tmp = _stmt.getLong(_cursorIndexOfSkipped).toInt()
          _tmpSkipped = _tmp != 0
          val _tmpMesoId: Long
          _tmpMesoId = _stmt.getLong(_cursorIndexOfMesoId)
          val _tmpWeek: Int
          _tmpWeek = _stmt.getLong(_cursorIndexOfWeek).toInt()
          val _tmpExercisesJson: String
          _tmpExercisesJson = _stmt.getText(_cursorIndexOfExercisesJson)
          val _tmpNote: String?
          if (_stmt.isNull(_cursorIndexOfNote)) {
            _tmpNote = null
          } else {
            _tmpNote = _stmt.getText(_cursorIndexOfNote)
          }
          _item =
              LogEntity(_tmpId,_tmpDayIdx,_tmpName,_tmpStartTime,_tmpEndTime,_tmpDuration,_tmpSkipped,_tmpMesoId,_tmpWeek,_tmpExercisesJson,_tmpNote)
          _result.add(_item)
        }
        _result
      } finally {
        _stmt.close()
      }
    }
  }

  public override suspend fun deleteLogById(id: Long) {
    val _sql: String = "DELETE FROM workout_logs WHERE id = ?"
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

  public override suspend fun deleteAllLogs() {
    val _sql: String = "DELETE FROM workout_logs"
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
