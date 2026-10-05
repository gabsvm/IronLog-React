package com.gainslab.pro;

import android.Manifest;
import android.app.ActivityManager;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.graphics.drawable.Icon;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.os.Build;
import android.provider.Settings;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;

import java.lang.ref.WeakReference;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
        name = "NativeBridge",
        permissions = {
                @Permission(alias = "notifications", strings = {Manifest.permission.POST_NOTIFICATIONS})
        }
)
public class NativeBridgePlugin extends Plugin {
    private static final String TIMER_ACTION = "com.gainslab.pro.REST_TIMER_FINISHED";
    private static final String TIMER_CHANNEL = "gainslab_rest_timer";
    private static final String TIMER_LIVE_CHANNEL = "gainslab_rest_timer_live";
    private static final int TIMER_REQUEST_CODE = 8811;
    private static final int TIMER_NOTIFICATION_ID = 8812;
    private static final int TIMER_LIVE_NOTIFICATION_ID = 8813;
    private static final String PREFS = "gainslab_native_bridge";
    private static final String NOTIFICATION_PROMPTED = "notification_prompted";
    // Q9: rest-stream state for notification actions. endAt/texts let the
    // action receiver reschedule natively with frozen JS; epoch + commands
    // sync the JS timer exactly once (see consumePendingTimerCommands).
    private static final String KEY_END_AT = "rest_end_at";
    private static final String KEY_FINAL_TITLE = "rest_final_title";
    private static final String KEY_FINAL_BODY = "rest_final_body";
    private static final String KEY_LIVE_TITLE = "rest_live_title";
    private static final String KEY_LIVE_BODY = "rest_live_body";
    private static final String KEY_REST_EPOCH = "rest_epoch";
    private static final String KEY_NEXT_COMMAND_ID = "rest_next_command_id";
    private static final String KEY_CMD_PREFIX = "rest_cmd_";
    private static final int ACTION_ADD_30_REQUEST_CODE = 8821;
    private static final int ACTION_SKIP_REQUEST_CODE = 8822;
    private static final String TIMER_COMMAND_EVENT = "restTimerCommand";

    // Q13: weekly workout reminders. Inexact alarms (setAndAllowWhileIdle) are
    // plenty; no exact-alarm permission involved.
    private static final String REMINDER_ACTION = "com.gainslab.pro.WORKOUT_REMINDER";
    private static final String REMINDER_CHANNEL = "gainslab_workout_reminder";
    private static final int REMINDER_REQUEST_CODE = 8831;
    private static final int REMINDER_NOTIFICATION_ID = 8832;
    private static final String KEY_REM_ENABLED = "rem_enabled";
    private static final String KEY_REM_DAYS = "rem_days_csv";
    private static final String KEY_REM_HOUR = "rem_hour";
    private static final String KEY_REM_MINUTE = "rem_minute";
    private static final String KEY_TRAINED_DATE = "rem_trained_date";

    // Weak link to the live plugin so the action receiver can emit JS events
    // when the bridge is alive; commands always wait in prefs as backup.
    private static WeakReference<NativeBridgePlugin> liveInstance = new WeakReference<>(null);

    @Override
    public void load() {
        liveInstance = new WeakReference<>(this);
        createNotificationChannel(getContext());
    }

    /** Q9: best-effort live event; prefs stay the source of truth. */
    static void emitTimerCommand(String action, int id, long endAt, int epoch) {
        NativeBridgePlugin plugin = liveInstance.get();
        if (plugin == null) return;
        try {
            JSObject command = new JSObject();
            command.put("id", id);
            command.put("action", action);
            command.put("endAt", endAt);
            JSObject data = new JSObject();
            data.put("epoch", epoch);
            data.put("command", command);
            plugin.notifyListeners(TIMER_COMMAND_EVENT, data, false);
        } catch (Exception ignored) {
            // Listener delivery is best-effort; the command waits in prefs.
        }
    }

    @PluginMethod
    public void haptic(PluginCall call) {
        String type = call.getString("type", "light");
        vibrate(getContext(), type);
        call.resolve();
    }

    @PluginMethod
    public void scheduleRestTimer(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && getPermissionState("notifications") != PermissionState.GRANTED
                && !notificationPermissionWasPrompted()) {
            markNotificationPermissionPrompted();
            requestPermissionForAlias("notifications", call, "scheduleRestTimerAfterPermission");
            return;
        }
        scheduleRestTimerInternal(call);
    }

    private boolean notificationPermissionWasPrompted() {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        return prefs.getBoolean(NOTIFICATION_PROMPTED, false);
    }

    private void markNotificationPermissionPrompted() {
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(NOTIFICATION_PROMPTED, true)
                .apply();
    }

    @PermissionCallback
    private void scheduleRestTimerAfterPermission(PluginCall call) {
        // The alarm itself does not require notification permission. If the user
        // declines, native tone/haptics can still fire in the background and we
        // simply skip posting the notification card.
        scheduleRestTimerInternal(call);
    }

    private void scheduleRestTimerInternal(PluginCall call) {
        Long endAt = call.getLong("endAt");
        if (endAt == null || endAt <= System.currentTimeMillis()) {
            cancelAlarm(getContext());
            call.resolve();
            return;
        }

        String title = call.getString("title", "GainsLab");
        String body = call.getString("body", "Rest finished. Ready for the next set.");
        Context context = getContext();
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            call.resolve();
            return;
        }

        programAlarm(context, alarmManager, endAt, title, body);

        String liveTitle = call.getString("liveTitle", title);
        String liveBody = call.getString("liveBody", body);

        // Q9: persist everything the action receiver needs to reschedule with
        // frozen JS, and start a fresh command stream for this rest.
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int epoch = prefs.getInt(KEY_REST_EPOCH, 0) + 1;
        SharedPreferences.Editor editor = prefs.edit()
                .putLong(KEY_END_AT, endAt)
                .putString(KEY_FINAL_TITLE, title)
                .putString(KEY_FINAL_BODY, body)
                .putString(KEY_LIVE_TITLE, liveTitle)
                .putString(KEY_LIVE_BODY, liveBody)
                .putInt(KEY_REST_EPOCH, epoch)
                .putInt(KEY_NEXT_COMMAND_ID, 1);
        for (String key : prefs.getAll().keySet()) {
            if (key.startsWith(KEY_CMD_PREFIX)) editor.remove(key);
        }
        editor.apply();

        // Publish (or update, same id) the ongoing live countdown. Adjusting
        // the rest (+30s/-10s) re-schedules with a new endAt and refreshes it.
        postLiveTimerNotification(context, endAt, liveTitle, liveBody);

        call.resolve();
    }

    /** Q9: extracted so notification actions reschedule exactly like the plugin path. */
    static void programAlarm(Context context, AlarmManager alarmManager, long endAt, String title, String body) {
        PendingIntent pendingIntent = timerPendingIntent(context, title, body);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
                // Best-effort fallback that requires no restricted exact-alarm permission.
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endAt, pendingIntent);
            } else {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endAt, pendingIntent);
            }
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, endAt, pendingIntent);
        }
    }

    /** Q9: +30s from the notification, fully native (works with frozen JS). */
    static void rescheduleFromAction(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        long endAt = prefs.getLong(KEY_END_AT, 0);
        if (endAt <= System.currentTimeMillis()) {
            cancelAlarm(context);
            return;
        }
        long newEndAt = endAt + 30000L;
        prefs.edit().putLong(KEY_END_AT, newEndAt).apply();

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            programAlarm(
                    context,
                    alarmManager,
                    newEndAt,
                    prefs.getString(KEY_FINAL_TITLE, "GainsLab"),
                    prefs.getString(KEY_FINAL_BODY, "Rest finished. Ready for the next set."));
        }
        postLiveTimerNotification(
                context,
                newEndAt,
                prefs.getString(KEY_LIVE_TITLE, "GainsLab"),
                prefs.getString(KEY_LIVE_BODY, ""));
        appendTimerCommand(context, "add30", newEndAt);
    }

    /** Q9: skip from the notification, fully native (works with frozen JS). */
    static void skipFromAction(Context context) {
        cancelAlarm(context);
        appendTimerCommand(context, "skip", 0L);
    }

    /** Q9: appends a sequenced command for the JS timer + live-emits when possible. */
    static void appendTimerCommand(Context context, String action, long endAt) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int id = prefs.getInt(KEY_NEXT_COMMAND_ID, 1);
        int epoch = prefs.getInt(KEY_REST_EPOCH, 0);
        prefs.edit()
                .putString(KEY_CMD_PREFIX + id, action + ":" + endAt)
                .putInt(KEY_NEXT_COMMAND_ID, id + 1)
                .apply();
        emitTimerCommand(action, id, endAt, epoch);
    }

    /**
     * Q9: JS drains the pending command stream (id, action, endAt, epoch).
     * Only the ids read here are deleted, so a command written concurrently
     * by a later tap survives for the next drain.
     */
    @PluginMethod
    public void consumePendingTimerCommands(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int epoch = prefs.getInt(KEY_REST_EPOCH, 0);
        TreeMap<Integer, String> ordered = new TreeMap<>();
        List<String> malformedKeys = new ArrayList<>();
        for (Map.Entry<String, ?> entry : prefs.getAll().entrySet()) {
            String key = entry.getKey();
            if (!key.startsWith(KEY_CMD_PREFIX)) continue;
            try {
                ordered.put(Integer.parseInt(key.substring(KEY_CMD_PREFIX.length())), String.valueOf(entry.getValue()));
            } catch (NumberFormatException ignored) {
                malformedKeys.add(key);
            }
        }
        List<JSObject> commands = new ArrayList<>();
        SharedPreferences.Editor editor = prefs.edit();
        for (String malformed : malformedKeys) editor.remove(malformed);
        for (Map.Entry<Integer, String> entry : ordered.entrySet()) {
            int id = entry.getKey();
            editor.remove(KEY_CMD_PREFIX + id);
            if (id <= 0) continue;
            String raw = entry.getValue();
            int sep = raw.indexOf(':');
            if (sep <= 0) continue;
            String action = raw.substring(0, sep);
            if (!action.equals("add30") && !action.equals("skip")) continue;
            long endAt;
            try {
                endAt = Long.parseLong(raw.substring(sep + 1));
            } catch (NumberFormatException e) {
                continue;
            }
            JSObject command = new JSObject();
            command.put("id", id);
            command.put("action", action);
            command.put("endAt", endAt);
            commands.add(command);
        }
        editor.apply();
        JSObject ret = new JSObject();
        ret.put("epoch", epoch);
        ret.put("commands", new JSArray(commands));
        call.resolve(ret);
    }

    @PluginMethod
    public void cancelRestTimer(PluginCall call) {
        cancelAlarm(getContext());
        call.resolve();
    }

    /**
     * Q13: persist the reminder config (days are JS getDay() numbers) and
     * schedule the next occurrence with an inexact alarm.
     */
    @PluginMethod
    public void scheduleWorkoutReminder(PluginCall call) {
        JSArray daysArray = call.getArray("days", new JSArray());
        StringBuilder csv = new StringBuilder();
        for (int i = 0; i < daysArray.length(); i++) {
            try {
                int day = daysArray.getInt(i);
                if (day < 0 || day > 6) continue;
                if (csv.length() > 0) csv.append(',');
                csv.append(day);
            } catch (Exception ignored) {
                // Skip malformed entries; an empty set cancels below.
            }
        }
        Integer hourObj = call.getInt("hour");
        Integer minuteObj = call.getInt("minute");
        int hour = hourObj != null ? hourObj : 18;
        int minute = minuteObj != null ? minuteObj : 0;

        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putBoolean(KEY_REM_ENABLED, true)
                .putString(KEY_REM_DAYS, csv.toString())
                .putInt(KEY_REM_HOUR, hour)
                .putInt(KEY_REM_MINUTE, minute)
                .apply();
        scheduleNextWorkoutReminder(getContext());
        call.resolve();
    }

    /** Q13: disable reminders and drop any pending reminder alarm. */
    @PluginMethod
    public void cancelWorkoutReminder(PluginCall call) {
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putBoolean(KEY_REM_ENABLED, false)
                .apply();
        cancelReminderAlarm(getContext());
        call.resolve();
    }

    /** Q13: JS calls this when a session finishes; today's reminder is skipped. */
    @PluginMethod
    public void markWorkoutDone(PluginCall call) {
        String date = call.getString("date", "");
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putString(KEY_TRAINED_DATE, date != null ? date : "")
                .apply();
        call.resolve();
    }

    /**
     * Q17: consume the widget launch action (cold start via onCreate, warm via
     * onNewIntent). Empty string when nothing is pending: each tap runs once.
     */
    @PluginMethod
    public void getLaunchAction(PluginCall call) {
        String action = MainActivity.consumeLaunchAction();
        JSObject result = new JSObject();
        result.put("action", action != null ? action : "");
        call.resolve(result);
    }

    /**
     * T3: hand a shared/opened CSV to the web layer exactly once. Read off the
     * main thread with a 10 MB cap; { available:false } when nothing is pending.
     */
    @PluginMethod
    public void consumeSharedFile(PluginCall call) {
        Uri uri = MainActivity.consumeSharedUri();
        if (uri == null) {
            JSObject none = new JSObject();
            none.put("available", false);
            call.resolve(none);
            return;
        }
        new Thread(() -> {
            JSObject result = new JSObject();
            result.put("available", true);
            try (java.io.InputStream in = getContext().getContentResolver().openInputStream(uri)) {
                if (in == null) throw new java.io.IOException("no stream");
                java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
                byte[] buf = new byte[16384];
                int total = 0;
                int n;
                while ((n = in.read(buf)) != -1) {
                    total += n;
                    if (total > SHARED_FILE_MAX_BYTES) throw new java.io.IOException("too large");
                    out.write(buf, 0, n);
                }
                result.put("name", displayName(uri));
                result.put("text", new String(out.toByteArray(), java.nio.charset.StandardCharsets.UTF_8));
            } catch (Exception e) {
                result.put("error", "read");
            }
            call.resolve(result);
        }).start();
    }

    private static final int SHARED_FILE_MAX_BYTES = 10 * 1024 * 1024;

    private String displayName(Uri uri) {
        try (Cursor cursor = getContext().getContentResolver().query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                String name = cursor.getString(0);
                if (name != null && !name.isEmpty()) return name;
            }
        } catch (Exception ignored) {
            // Fall back below.
        }
        String last = uri.getLastPathSegment();
        return last != null ? last : "shared.csv";
    }

    /**
     * U8: share a file from the web layer (backups, CSV, session image). The
     * Android WebView supports neither Web Share with files nor <a download>
     * blobs, so the bytes come here (base64), go to cache/shared and leave
     * through the system share sheet via the app FileProvider.
     */
    @PluginMethod
    public void shareFile(PluginCall call) {
        String filename = call.getString("filename", "gainslab-file");
        String mime = call.getString("mime", "application/octet-stream");
        String data = call.getString("base64", null);
        String title = call.getString("title", "GainsLab");
        if (data == null) {
            call.reject("missing data");
            return;
        }
        try {
            String safeName = filename.replaceAll("[^A-Za-z0-9._-]", "_");
            java.io.File dir = new java.io.File(getContext().getCacheDir(), "shared");
            if (!dir.exists() && !dir.mkdirs()) throw new java.io.IOException("no dir");
            java.io.File file = new java.io.File(dir, safeName);
            byte[] bytes = android.util.Base64.decode(data, android.util.Base64.DEFAULT);
            try (java.io.FileOutputStream out = new java.io.FileOutputStream(file)) {
                out.write(bytes);
            }
            Uri uri = androidx.core.content.FileProvider.getUriForFile(
                    getContext(), getContext().getPackageName() + ".fileprovider", file);
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType(mime);
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.putExtra(Intent.EXTRA_TITLE, safeName);
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(send, title);
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            if (getActivity() != null) {
                getActivity().startActivity(chooser);
            } else {
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(chooser);
            }
            JSObject result = new JSObject();
            result.put("shared", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("share failed", e);
        }
    }

    /** Q17: store the next-session title and refresh installed widgets. */
    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        String title = call.getString("title", "");
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putString(StartWorkoutWidgetProvider.KEY_WIDGET_TITLE, title != null ? title : "")
                .apply();
        StartWorkoutWidgetProvider.refreshAll(getContext());
        call.resolve();
    }

    /**
     * Q13: schedule the next reminder strictly in the future (mirrors the JS
     * computeNextReminder: scan today + 7 days, local time). Static so the
     * reminder and boot receivers can chain without a live bridge.
     */
    static void scheduleNextWorkoutReminder(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        boolean enabled = prefs.getBoolean(KEY_REM_ENABLED, false);
        String daysCsv = prefs.getString(KEY_REM_DAYS, "");
        int hour = prefs.getInt(KEY_REM_HOUR, 18);
        int minute = prefs.getInt(KEY_REM_MINUTE, 0);
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (!enabled || daysCsv == null || daysCsv.isEmpty() || alarmManager == null) {
            cancelReminderAlarm(context);
            return;
        }
        // JS getDay() (0=Sunday..6=Saturday) -> Calendar DAY_OF_WEEK (1..7).
        boolean[] wanted = new boolean[8];
        for (String part : daysCsv.split(",")) {
            try {
                int jsDay = Integer.parseInt(part.trim());
                if (jsDay >= 0 && jsDay <= 6) wanted[jsDay + 1] = true;
            } catch (NumberFormatException ignored) {
            }
        }
        long now = System.currentTimeMillis();
        Long trigger = null;
        Calendar base = Calendar.getInstance();
        for (int offset = 0; offset < 8; offset++) {
            Calendar candidate = (Calendar) base.clone();
            candidate.add(Calendar.DAY_OF_YEAR, offset);
            candidate.set(Calendar.HOUR_OF_DAY, hour);
            candidate.set(Calendar.MINUTE, minute);
            candidate.set(Calendar.SECOND, 0);
            candidate.set(Calendar.MILLISECOND, 0);
            if (candidate.getTimeInMillis() <= now) continue;
            if (wanted[candidate.get(Calendar.DAY_OF_WEEK)]) {
                trigger = candidate.getTimeInMillis();
                break;
            }
        }
        if (trigger == null) {
            cancelReminderAlarm(context);
            return;
        }
        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, reminderPendingIntent(context));
    }

    private static PendingIntent reminderPendingIntent(Context context) {
        Intent intent = new Intent(context, WorkoutReminderReceiver.class);
        intent.setAction(REMINDER_ACTION);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(context, REMINDER_REQUEST_CODE, intent, flags);
    }

    private static void cancelReminderAlarm(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;
        PendingIntent pendingIntent = reminderPendingIntent(context);
        alarmManager.cancel(pendingIntent);
        pendingIntent.cancel();
    }

    /**
     * Q13: reminder alarm fired. Chains the next occurrence FIRST so today's
     * notification (or a skip) can never break the weekly chain, then posts
     * unless JS already marked today as trained.
     */
    public static void onWorkoutReminderFired(Context context) {
        scheduleNextWorkoutReminder(context);

        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String trained = prefs.getString(KEY_TRAINED_DATE, "");
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        if (trained != null && trained.equals(today)) return;

        postReminderNotification(context);
    }

    private static void postReminderNotification(Context context) {
        if (!canPostNotifications(context)) return;
        createNotificationChannel(context);

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(context, REMINDER_CHANNEL);
        } else {
            builder = new Notification.Builder(context)
                    .setPriority(Notification.PRIORITY_DEFAULT);
        }
        builder.setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(context.getString(R.string.reminder_title))
                .setContentText(context.getString(R.string.reminder_body))
                .setCategory(Notification.CATEGORY_REMINDER)
                .setAutoCancel(true)
                .setOnlyAlertOnce(true);
        PendingIntent contentIntent = launchContentIntent(context);
        if (contentIntent != null) builder.setContentIntent(contentIntent);

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(REMINDER_NOTIFICATION_ID, builder.build());
    }

    /**
     * Q8: exact-alarm state for the JS settings row. Below API 31 there is no
     * user-facing toggle, so it reports granted. sdkInt lets JS hide the row
     * where the permission concept does not exist.
     */
    @PluginMethod
    public void canScheduleExactAlarms(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("sdkInt", Build.VERSION.SDK_INT);
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            ret.put("granted", true);
        } else {
            AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            ret.put("granted", alarmManager != null && alarmManager.canScheduleExactAlarms());
        }
        call.resolve(ret);
    }

    /**
     * Q8: opens the system "Alarms & reminders" screen for this app (Android
     * 12+ special app access; there is no runtime prompt API). Falls back to
     * the app-details settings page when the vendor ROM lacks the screen.
     */
    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        Context context = getContext();
        try {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            intent.setData(Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (ActivityNotFoundException e) {
            try {
                Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                fallback.setData(Uri.parse("package:" + context.getPackageName()));
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(fallback);
            } catch (ActivityNotFoundException e2) {
                call.reject("SETTINGS_UNAVAILABLE");
                return;
            }
        }
        call.resolve();
    }

    private static PendingIntent timerPendingIntent(Context context, String title, String body) {
        Intent intent = new Intent(context, RestTimerReceiver.class);
        intent.setAction(TIMER_ACTION);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(context, TIMER_REQUEST_CODE, intent, flags);
    }

    private static void cancelAlarm(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;
        PendingIntent pendingIntent = timerPendingIntent(context, "GainsLab", "");
        alarmManager.cancel(pendingIntent);
        pendingIntent.cancel();
        cancelLiveTimerNotification(context);
    }

    public static void onRestTimerFinished(Context context, String title, String body) {
        // Always dismiss the live countdown first, even when foregrounded, so
        // no ongoing notification is left hanging after the rest ends.
        cancelLiveTimerNotification(context);

        // If the app is foregrounded the JS timer owns sound/haptics, preventing
        // duplicate feedback. The native receiver is primarily a background path.
        if (isAppForeground()) return;

        vibrate(context, "success");
        ToneGenerator tone = new ToneGenerator(AudioManager.STREAM_NOTIFICATION, 90);
        tone.startTone(ToneGenerator.TONE_PROP_BEEP2, 450);
        new Handler(Looper.getMainLooper()).postDelayed(tone::release, 550);

        if (!canPostNotifications(context)) return;
        createNotificationChannel(context);

        PendingIntent contentIntent = launchContentIntent(context);

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(context, TIMER_CHANNEL);
        } else {
            builder = new Notification.Builder(context)
                    .setPriority(Notification.PRIORITY_HIGH);
        }

        builder.setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setCategory(Notification.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setOnlyAlertOnce(true);
        if (contentIntent != null) builder.setContentIntent(contentIntent);

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(TIMER_NOTIFICATION_ID, builder.build());
    }

    private static PendingIntent launchContentIntent(Context context) {
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent == null) return null;
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, TIMER_REQUEST_CODE + 1, launchIntent, flags);
    }

    private static void postLiveTimerNotification(Context context, long endAt, String liveTitle, String liveBody) {
        if (!canPostNotifications(context)) return;
        createNotificationChannel(context);

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(context, TIMER_LIVE_CHANNEL);
        } else {
            builder = new Notification.Builder(context)
                    .setPriority(Notification.PRIORITY_LOW);
        }

        builder.setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(liveTitle)
                .setContentText(liveBody)
                .setWhen(endAt)
                .setShowWhen(true)
                .setUsesChronometer(true)
                .setChronometerCountDown(true)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setCategory(Notification.CATEGORY_STOPWATCH)
                .setVisibility(Notification.VISIBILITY_PUBLIC);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Safety net: auto-dismiss shortly after the rest ends even if the
            // app died before cancelling (API 26+ only).
            builder.setTimeoutAfter(Math.max(1000L, endAt - System.currentTimeMillis() + 5000L));
        }
        PendingIntent contentIntent = launchContentIntent(context);
        if (contentIntent != null) builder.setContentIntent(contentIntent);

        // Q9: +30s / skip actions, handled by the receiver below (no Activity
        // trampoline: the receiver does the work directly). Explicit intents
        // to a non-exported receiver + immutable PendingIntents.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent addIntent = new Intent(context, RestTimerActionReceiver.class);
            addIntent.setAction(RestTimerActionReceiver.ACTION_ADD_30);
            PendingIntent addPending = PendingIntent.getBroadcast(
                    context, ACTION_ADD_30_REQUEST_CODE, addIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            builder.addAction(new Notification.Action.Builder(
                    Icon.createWithResource(context, android.R.drawable.ic_input_add),
                    context.getString(R.string.rest_action_add_30),
                    addPending).build());

            Intent skipIntent = new Intent(context, RestTimerActionReceiver.class);
            skipIntent.setAction(RestTimerActionReceiver.ACTION_SKIP);
            PendingIntent skipPending = PendingIntent.getBroadcast(
                    context, ACTION_SKIP_REQUEST_CODE, skipIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            builder.addAction(new Notification.Action.Builder(
                    Icon.createWithResource(context, android.R.drawable.ic_media_next),
                    context.getString(R.string.rest_action_skip),
                    skipPending).build());
        }

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(TIMER_LIVE_NOTIFICATION_ID, builder.build());
    }

    private static void cancelLiveTimerNotification(Context context) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.cancel(TIMER_LIVE_NOTIFICATION_ID);
    }

    private static boolean isAppForeground() {
        ActivityManager.RunningAppProcessInfo info = new ActivityManager.RunningAppProcessInfo();
        ActivityManager.getMyMemoryState(info);
        return info.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
                || info.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_VISIBLE;
    }

    private static boolean canPostNotifications(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return true;
        return context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;
    }

    private static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        if (manager.getNotificationChannel(TIMER_CHANNEL) == null) {
            NotificationChannel channel = new NotificationChannel(
                    TIMER_CHANNEL,
                    "Rest timer",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("GainsLab rest timer alerts");
            channel.enableVibration(true);
            manager.createNotificationChannel(channel);
        }

        if (manager.getNotificationChannel(TIMER_LIVE_CHANNEL) == null) {
            NotificationChannel liveChannel = new NotificationChannel(
                    TIMER_LIVE_CHANNEL,
                    "Rest timer (live)",
                    NotificationManager.IMPORTANCE_LOW
            );
            liveChannel.setDescription("Live rest countdown while a rest is running");
            liveChannel.enableVibration(false);
            liveChannel.setSound(null, null);
            liveChannel.setShowBadge(false);
            manager.createNotificationChannel(liveChannel);
        }

        if (manager.getNotificationChannel(REMINDER_CHANNEL) == null) {
            NotificationChannel reminderChannel = new NotificationChannel(
                    REMINDER_CHANNEL,
                    context.getString(R.string.reminder_channel_name),
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            reminderChannel.setDescription(context.getString(R.string.reminder_channel_desc));
            manager.createNotificationChannel(reminderChannel);
        }
    }

    private static void vibrate(Context context, String type) {
        Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null || !vibrator.hasVibrator()) return;

        long[] pattern;
        switch (type) {
            case "medium":
                pattern = new long[]{0, 32};
                break;
            case "heavy":
                pattern = new long[]{0, 55};
                break;
            case "success":
                pattern = new long[]{0, 28, 42, 28, 42, 38};
                break;
            case "warning":
                pattern = new long[]{0, 70, 45, 90};
                break;
            case "light":
            default:
                pattern = new long[]{0, 14};
                break;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1));
        } else {
            //noinspection deprecation
            vibrator.vibrate(pattern, -1);
        }
    }
}
