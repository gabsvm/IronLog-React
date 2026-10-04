package com.gainslab.pro;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Q13: weekly workout reminder alarm target (explicit intents only). */
public class WorkoutReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        NativeBridgePlugin.onWorkoutReminderFired(context);
    }
}
