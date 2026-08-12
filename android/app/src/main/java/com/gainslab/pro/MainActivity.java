package com.gainslab.pro;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Capacitor custom plugins must be registered before BridgeActivity builds
        // the bridge so they are available as soon as the web bundle starts.
        registerPlugin(NativeBridgePlugin.class);
        super.onCreate(savedInstanceState);

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
    public void onBackPressed() {
        WebView webView = bridge != null ? bridge.getWebView() : null;
        // App.tsx stores view changes in window.history. WebView.goBack() therefore
        // fires the same popstate path used by browser/PWA navigation instead of
        // abruptly closing the activity from an inner screen.
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }
}
