package com.gainslab.pro

import android.content.Intent
import android.os.Build
import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.records.metadata.Metadata
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId

/**
 * U9: Health Connect bridge. Reads body weight (import into body logs) and
 * writes finished workouts as strength-training exercise sessions. Every
 * call is opt-in from the web layer; nothing runs in the background.
 *
 * The client library needs API 26+ (Health Connect itself ships on 28+ /
 * as a system module on 34+), so every entry point checks [available].
 */
@CapacitorPlugin(name = "HealthConnect")
class HealthConnectPlugin : Plugin() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private val permissions: Set<String> by lazy {
        setOf(
            HealthPermission.getReadPermission(WeightRecord::class),
            HealthPermission.getWritePermission(ExerciseSessionRecord::class),
        )
    }

    private fun status(): String {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return "unsupported"
        return when (HealthConnectClient.getSdkStatus(context)) {
            HealthConnectClient.SDK_AVAILABLE -> "available"
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "update_required"
            else -> "unsupported"
        }
    }

    private fun available() = status() == "available"

    private fun client() = HealthConnectClient.getOrCreate(context)

    override fun handleOnDestroy() {
        scope.cancel()
        super.handleOnDestroy()
    }

    @PluginMethod
    fun getStatus(call: PluginCall) {
        val state = status()
        if (state != "available") {
            call.resolve(JSObject().put("status", state).put("granted", false))
            return
        }
        scope.launch {
            try {
                val granted = client().permissionController.getGrantedPermissions()
                call.resolve(JSObject().put("status", state).put("granted", granted.containsAll(permissions)))
            } catch (e: Exception) {
                call.reject("status failed", e)
            }
        }
    }

    @PluginMethod
    fun requestAccess(call: PluginCall) {
        if (!available()) {
            call.resolve(JSObject().put("granted", false))
            return
        }
        val contract = PermissionController.createRequestPermissionResultContract()
        startActivityForResult(call, contract.createIntent(context, permissions), "onPermissionsResult")
    }

    @ActivityCallback
    private fun onPermissionsResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val contract = PermissionController.createRequestPermissionResultContract()
        val granted = contract.parseResult(result.resultCode, result.data)
        call.resolve(JSObject().put("granted", granted.containsAll(permissions)))
    }

    /** Opens the Play Store / settings page when Health Connect needs an update. */
    @PluginMethod
    fun openHealthConnect(call: PluginCall) {
        try {
            val intent = Intent("androidx.health.ACTION_HEALTH_CONNECT_SETTINGS")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            call.resolve()
        } catch (e: Exception) {
            call.reject("cannot open Health Connect", e)
        }
    }

    @PluginMethod
    fun readWeights(call: PluginCall) {
        if (!available()) {
            call.reject("unavailable")
            return
        }
        val since = call.getLong("sinceMs") ?: 0L
        scope.launch {
            try {
                val out = JSArray()
                var pageToken: String? = null
                do {
                    val response = client().readRecords(
                        ReadRecordsRequest(
                            recordType = WeightRecord::class,
                            timeRangeFilter = TimeRangeFilter.after(Instant.ofEpochMilli(since)),
                            pageSize = 1000,
                            pageToken = pageToken,
                        ),
                    )
                    for (record in response.records) {
                        out.put(
                            JSObject()
                                .put("time", record.time.toEpochMilli())
                                .put("kg", record.weight.inKilograms)
                                .put("origin", record.metadata.dataOrigin.packageName),
                        )
                    }
                    pageToken = response.pageToken
                } while (pageToken != null && out.length() < 5000)
                call.resolve(JSObject().put("records", out))
            } catch (e: SecurityException) {
                call.reject("permission denied", "PERMISSION", e)
            } catch (e: Exception) {
                call.reject("read failed", e)
            }
        }
    }

    /**
     * Writes one session. `clientRecordId` makes it idempotent: exporting the
     * same workout twice updates the record instead of duplicating it.
     */
    @PluginMethod
    fun writeWorkout(call: PluginCall) {
        if (!available()) {
            call.reject("unavailable")
            return
        }
        val id = call.getString("id")
        val start = call.getLong("startMs")
        val end = call.getLong("endMs")
        if (id.isNullOrBlank() || start == null || end == null || end <= start) {
            call.reject("invalid workout")
            return
        }
        val title = call.getString("title")
        val notes = call.getString("notes")
        val version = call.getLong("version") ?: end
        scope.launch {
            try {
                val zone = ZoneId.systemDefault().rules
                val startInstant = Instant.ofEpochMilli(start)
                val endInstant = Instant.ofEpochMilli(end)
                val record = ExerciseSessionRecord(
                    startTime = startInstant,
                    startZoneOffset = zone.getOffset(startInstant),
                    endTime = endInstant,
                    endZoneOffset = zone.getOffset(endInstant),
                    metadata = Metadata.manualEntry(clientRecordId = "gainslab-$id", clientRecordVersion = version),
                    exerciseType = ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING,
                    title = title,
                    notes = notes,
                )
                client().insertRecords(listOf(record))
                call.resolve(JSObject().put("written", true))
            } catch (e: SecurityException) {
                call.reject("permission denied", "PERMISSION", e)
            } catch (e: Exception) {
                call.reject("write failed", e)
            }
        }
    }
}
