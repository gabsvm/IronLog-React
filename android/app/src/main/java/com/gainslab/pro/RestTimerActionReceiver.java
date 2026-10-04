package com.gainslab.pro;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Q9: handles the live rest notification actions (+30s / skip). Runs fully
 * native so taps work even when the JS WebView is frozen: the endAt/texts
 * persisted at schedule time are the source of truth. No Activity trampoline
 * (this receiver does the work directly) and no exported surface (explicit
 * intents only, see the manifest).
 */
public class RestTimerActionReceiver extends BroadcastReceiver {
    public static final String ACTION_ADD_30 = "com.gainslab.pro.REST_ADD_30";
    public static final String ACTION_SKIP = "com.gainslab.pro.REST_SKIP";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;
        String action = intent.getAction();
        if (ACTION_ADD_30.equals(action)) {
            NativeBridgePlugin.rescheduleFromAction(context.getApplicationContext());
        } else if (ACTION_SKIP.equals(action)) {
            NativeBridgePlugin.skipFromAction(context.getApplicationContext());
        }
    }
}
