package com.gainslab.pro;

import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeBridge")
public class NativeBridgePlugin extends Plugin {

    @PluginMethod
    public void haptic(PluginCall call) {
        String type = call.getString("type", "light");
        Vibrator vibrator = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);

        if (vibrator == null || !vibrator.hasVibrator()) {
            call.resolve();
            return;
        }

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

        call.resolve();
    }
}
