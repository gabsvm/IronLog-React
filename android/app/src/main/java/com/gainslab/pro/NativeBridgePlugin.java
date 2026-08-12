package com.gainslab.pro;

import android.Manifest;
import android.app.ActivityManager;
import android.app.AlarmManager;
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

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

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
    private static final int TIMER_REQUEST_CODE = 8811;
    private static final int TIMER_NOTIFICATION_ID = 8812;
    private static final String PREFS = "gainslab_native_bridge";
    private static final String NOTIFICATION_PROMPTED = "notification_prompted";

    @Override
    public void load() {
        createNotificationChannel(getContext());
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

    private static void cancelAlarm(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;
        PendingIntent pendingIntent = timerPendingIntent(context, "GainsLab", "");
        alarmManager.cancel(pendingIntent);
        pendingIntent.cancel();
    }

    public static void onRestTimerFinished(Context context, String title, String body) {
        // If the app is foregrounded the JS timer owns sound/haptics, preventing
        // duplicate feedback. The native receiver is primarily a background path.
        if (isAppForeground()) return;

        vibrate(context, "success");
        ToneGenerator tone = new ToneGenerator(AudioManager.STREAM_NOTIFICATION, 90);
        tone.startTone(ToneGenerator.TONE_PROP_BEEP2, 450);
        new Handler(Looper.getMainLooper()).postDelayed(tone::release, 550);

        if (!canPostNotifications(context)) return;
        createNotificationChannel(context);

        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent contentIntent = null;
        if (launchIntent != null) {
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
            contentIntent = PendingIntent.getActivity(context, TIMER_REQUEST_CODE + 1, launchIntent, flags);
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, TIMER_CHANNEL)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
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
        return ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;
    }

    private static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null || manager.getNotificationChannel(TIMER_CHANNEL) != null) return;

        NotificationChannel channel = new NotificationChannel(
                TIMER_CHANNEL,
                "Rest timer",
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("GainsLab rest timer alerts");
        channel.enableVibration(true);
        manager.createNotificationChannel(channel);
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
