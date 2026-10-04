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
import android.net.Uri;
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
import java.util.ArrayList;
import java.util.List;
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
