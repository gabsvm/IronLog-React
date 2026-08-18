package com.gainslab.pro;

import android.Manifest;
import android.app.ActivityManager;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;

import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
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
    private static final String TIMER_PROGRESS_CHANNEL = "gainslab_rest_timer_progress";
    private static final int TIMER_REQUEST_CODE = 8811;
    private static final int TIMER_NOTIFICATION_ID = 8812;
    private static final int TIMER_PROGRESS_NOTIFICATION_ID = 8813;
    private static final String PREFS = "gainslab_native_bridge";
    private static final String NOTIFICATION_PROMPTED = "notification_prompted";

    @Override
    public void load() {
        createNotificationChannels(getContext());
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
        // simply skip posting both notification cards.
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
        String progressTitle = call.getString("progressTitle", "Rest in progress");
        String progressBody = call.getString("progressBody", "Ready for the next set.");
        Context context = getContext();
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            call.resolve();
            return;
        }

        PendingIntent pendingIntent = timerPendingIntent(context, title, body);
        long triggerAt = endAt;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
                // Best-effort fallback that requires no restricted exact-alarm permission.
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent);
            } else {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent);
            }
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent);
        }

        showRestTimerProgress(context, triggerAt, progressTitle, progressBody);
        call.resolve();
    }

    @PluginMethod
    public void cancelRestTimer(PluginCall call) {
        cancelAlarm(getContext());
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

    private static PendingIntent appLaunchPendingIntent(Context context) {
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent == null) return null;
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, TIMER_REQUEST_CODE + 1, launchIntent, flags);
    }

    private static void cancelAlarm(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            PendingIntent pendingIntent = timerPendingIntent(context, "GainsLab", "");
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();
        }
        cancelProgressNotification(context);
    }

    private static void showRestTimerProgress(Context context, long endAt, String title, String body) {
        if (!canPostNotifications(context)) return;
        createNotificationChannels(context);

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(context, TIMER_PROGRESS_CHANNEL);
        } else {
            builder = new Notification.Builder(context)
                    .setPriority(Notification.PRIORITY_LOW);
        }

        builder.setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setCategory(Notification.CATEGORY_PROGRESS)
                .setOngoing(true)
                .setAutoCancel(false)
                .setOnlyAlertOnce(true)
                .setShowWhen(true)
                .setWhen(endAt)
                .setUsesChronometer(true)
                .setDefaults(0)
                .setSound(null);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            builder.setChronometerCountDown(true);
        }

        PendingIntent contentIntent = appLaunchPendingIntent(context);
        if (contentIntent != null) builder.setContentIntent(contentIntent);

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(TIMER_PROGRESS_NOTIFICATION_ID, builder.build());
    }

    private static void cancelProgressNotification(Context context) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.cancel(TIMER_PROGRESS_NOTIFICATION_ID);
    }

    public static void onRestTimerFinished(Context context, String title, String body) {
        // The low-priority lock-screen countdown should disappear regardless of
        // foreground state. If the app is foregrounded the JS timer owns final
        // sound/haptics, preventing duplicate feedback.
        cancelProgressNotification(context);
        if (isAppForeground()) return;

        vibrate(context, "success");
        ToneGenerator tone = new ToneGenerator(AudioManager.STREAM_NOTIFICATION, 90);
        tone.startTone(ToneGenerator.TONE_PROP_BEEP2, 450);
        new Handler(Looper.getMainLooper()).postDelayed(tone::release, 550);

        if (!canPostNotifications(context)) return;
        createNotificationChannels(context);

        PendingIntent contentIntent = appLaunchPendingIntent(context);

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

    private static void createNotificationChannels(Context context) {
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

        if (manager.getNotificationChannel(TIMER_PROGRESS_CHANNEL) == null) {
            NotificationChannel progressChannel = new NotificationChannel(
                    TIMER_PROGRESS_CHANNEL,
                    "Rest timer progress",
                    NotificationManager.IMPORTANCE_LOW
            );
            progressChannel.setDescription("Ongoing GainsLab rest countdown");
            progressChannel.enableVibration(false);
            progressChannel.setSound(null, null);
            manager.createNotificationChannel(progressChannel);
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
