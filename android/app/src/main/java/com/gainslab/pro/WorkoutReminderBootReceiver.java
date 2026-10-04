package com.gainslab.pro;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Q13: re-chains the workout reminder after a reboot (in-memory alarms do not
 * survive restarts; the config lives in SharedPreferences).
 */
public class WorkoutReminderBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null && Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            NativeBridgePlugin.scheduleNextWorkoutReminder(context);
        }
    }
}
