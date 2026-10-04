package com.gainslab.pro;

import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import androidx.activity.EdgeToEdge;
import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    /** Q17: widget tap target. The JS side consumes it once via getLaunchAction. */
    public static final String EXTRA_LAUNCH_ACTION = "com.gainslab.pro.LAUNCH_ACTION";
    private static String pendingLaunchAction = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Capacitor custom plugins must be registered before BridgeActivity builds
        // the bridge so they are available as soon as the web bundle starts.
        registerPlugin(NativeBridgePlugin.class);
        super.onCreate(savedInstanceState);
        captureLaunchAction(getIntent());
        // Android 15+ enforces edge-to-edge; the web layout honors the
        // SystemBars insets (see system-bars.md insetsHandling=css).
        EdgeToEdge.enable(this);

        // Predictive-back compatible back handling (no deprecated onBackPressed
        // override): App.tsx stores view changes in window.history, so route
        // Back through WebView.goBack() — firing the same popstate path used by
        // browser/PWA navigation — instead of abruptly closing the activity
        // from an inner screen.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = bridge != null ? bridge.getWebView() : null;
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                    return;
                }
                // No web history left: fall through to the default behavior by
                // momentarily disabling this callback and re-dispatching.
                setEnabled(false);
                MainActivity.this.getOnBackPressedDispatcher().onBackPressed();
                setEnabled(true);
            }
        });

        WebView webView = bridge != null ? bridge.getWebView() : null;
        if (webView != null) {
            webView.setBackgroundColor(Color.BLACK);
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);

            // Keep the renderer important even when the Activity is briefly not
            // visible (checking a message between sets, locking the screen, etc.).
            // Android can still reclaim the process under real pressure, and the
            // session is persisted, but we avoid voluntarily waiving its priority.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                webView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
            }
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        // singleTask: widget taps while the app is alive land here.
        super.onNewIntent(intent);
        setIntent(intent);
        captureLaunchAction(intent);
    }

    private static synchronized void captureLaunchAction(Intent intent) {
        if (intent == null) return;
        String action = intent.getStringExtra(EXTRA_LAUNCH_ACTION);
        if (action != null && !action.isEmpty()) pendingLaunchAction = action;
    }

    /** Q17: consumed once by NativeBridge.getLaunchAction (cold or warm start). */
    static synchronized String consumeLaunchAction() {
        String action = pendingLaunchAction;
        pendingLaunchAction = null;
        return action;
    }
}
