package com.gainslab.pro;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class RestTimerReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String title = intent != null ? intent.getStringExtra("title") : null;
        String body = intent != null ? intent.getStringExtra("body") : null;

        NativeBridgePlugin.onRestTimerFinished(
                context,
                title != null ? title : "GainsLab",
                body != null ? body : "Rest finished. Ready for the next set."
        );
    }
}
