package com.gainslab.pro;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

/**
 * Q17: "Start workout" home-screen widget. A tap opens MainActivity with the
 * start launch action (consumed once by the JS side, same flow as the PWA
 * ?action=start shortcut). The subtitle shows the next session name written
 * by the JS side via updateWidgetData, or the default hint when unknown.
 */
public class StartWorkoutWidgetProvider extends AppWidgetProvider {
    static final String PREFS = "gainslab_native_bridge";
    static final String KEY_WIDGET_TITLE = "widget_next_title";
    private static final int WIDGET_TAP_REQUEST_CODE = 8841;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            updateWidget(context, manager, id);
        }
    }

    /** Refresh every installed instance (called after updateWidgetData). */
    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        if (manager == null) return;
        ComponentName self = new ComponentName(context, StartWorkoutWidgetProvider.class);
        for (int id : manager.getAppWidgetIds(self)) {
            updateWidget(context, manager, id);
        }
    }

    private static void updateWidget(Context context, AppWidgetManager manager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String title = prefs.getString(KEY_WIDGET_TITLE, "");
        if (title == null || title.isEmpty()) {
            title = context.getString(R.string.widget_title_default);
        }

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_start_workout);
        views.setTextViewText(R.id.widget_next_title, title);

        // Explicit MainActivity intent (no trampoline receiver): singleTask
        // routes warm taps to onNewIntent, cold taps to onCreate.
        Intent launch = new Intent(context, MainActivity.class);
        launch.setAction(Intent.ACTION_MAIN);
        launch.addCategory(Intent.CATEGORY_LAUNCHER);
        launch.putExtra(MainActivity.EXTRA_LAUNCH_ACTION, "start");
        PendingIntent tap = PendingIntent.getActivity(
                context,
                WIDGET_TAP_REQUEST_CODE,
                launch,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_root, tap);

        manager.updateAppWidget(appWidgetId, views);
    }
}
