import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const java = readFileSync('android/app/src/main/java/com/gainslab/pro/NativeBridgePlugin.java', 'utf8');
const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
const boot = readFileSync('android/app/src/main/java/com/gainslab/pro/WorkoutReminderBootReceiver.java', 'utf8');
const action = readFileSync('android/app/src/main/java/com/gainslab/pro/RestTimerActionReceiver.java', 'utf8');
const vector = readFileSync('android/app/src/main/res/drawable/ic_stat_rest_timer.xml', 'utf8');

describe('native rest implementation contracts (source-level)', () => {
    it('persists native deadline, duration and source; exposes restore through the registered bridge', () => {
        expect(java).toContain('public void getRestTimerState(PluginCall call)');
        expect(java).toContain('.putLong(KEY_END_AT, endAt)');
        expect(java).toContain('.putInt(KEY_REST_DURATION, durationSeconds)');
        expect(java).toContain('.putInt(KEY_SOURCE_EXERCISE, sourceExercise)');
        expect(java).toContain('.putInt(KEY_SOURCE_SET, sourceSet)');
        expect(java).toContain('state.put("epoch"');
        expect(java).toContain('markRestInactive(context)');
    });
    it('rejects stale alarm delivery following a +30 action or skip', () => {
        expect(java).toContain('if (expectedEndAt <= 0 || expectedEndAt > System.currentTimeMillis() + 1500L) return;');
        expect(java).toContain('static void rescheduleFromAction(Context context)');
        expect(java).toContain('static void skipFromAction(Context context)');
        expect(action).toContain('NativeBridgePlugin.rescheduleFromAction');
        expect(action).toContain('NativeBridgePlugin.skipFromAction');
    });
    it('maintains delivery over reboot and respects notification/exact alarm permissions', () => {
        expect(manifest).toContain('android.permission.RECEIVE_BOOT_COMPLETED');
        expect(manifest).toContain('android.permission.SCHEDULE_EXACT_ALARM');
        expect(manifest).toContain('android.permission.POST_NOTIFICATIONS');
        expect(boot).toContain('NativeBridgePlugin.restoreRestAfterBoot(context)');
        expect(java).toContain('alarmManager.setAndAllowWhileIdle(');
        expect(java).toContain('alarmManager.setExactAndAllowWhileIdle(');
    });
    it('updates the same ongoing Android notification without resetting alarm or epoch', () => {
        const start = java.indexOf('public void updateRestTimerContent(PluginCall call)');
        const end = java.indexOf('public void cancelRestTimer(PluginCall call)', start);
        const update = java.slice(start, end);
        expect(start).toBeGreaterThan(0);
        expect(end).toBeGreaterThan(start);
        expect(update).toContain('currentEndAt != expectedEndAt');
        expect(update).toContain('KEY_LIVE_TITLE');
        expect(update).toContain('KEY_LIVE_BODY');
        expect(update).toContain('KEY_REST_SKIP_LABEL');
        expect(update).toContain('postLiveTimerNotification(context, currentEndAt, title, body)');
        expect(update).not.toContain('programAlarm(');
        expect(update).not.toContain('KEY_REST_EPOCH');
        expect(java).toContain('manager.notify(TIMER_LIVE_NOTIFICATION_ID, builder.build())');
        expect(java).toContain('.setOnlyAlertOnce(true)');
        expect(java).toContain('KEY_REST_SKIP_LABEL, context.getString(R.string.rest_action_skip)');
    });

    it('uses a monochrome status icon and only requests Live Updates on Android 16+', () => {
        expect(vector).toContain('android:fillColor="#FFFFFFFF"');
        expect(java).toContain('.setSmallIcon(R.drawable.ic_stat_rest_timer)');
        expect(manifest).toContain('android.permission.POST_PROMOTED_NOTIFICATIONS');
        expect(java).toContain('if (Build.VERSION.SDK_INT >= 36');
        expect(java).toContain('android.requestPromotedOngoing');
        expect(java).toContain('.setUsesChronometer(true)');
        expect(java).toContain('.setChronometerCountDown(true)');
    });
});
