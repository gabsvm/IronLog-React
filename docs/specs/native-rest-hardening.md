# GainsLab · Rest timer Android hardening (Q21)
 
Implementation on `agent/gainslab-audit-fixes-v3` (2026-10-13). No production promotion as part of this change.

## Ownership and restoration

- `NativeBridgePlugin.java` owns the OS alarm (`AlarmManager.RTC_WAKEUP`) and a `SharedPreferences` snapshot with `endAt`, `duration`, source exercise/set and command epoch. The JS timer never cancels this state as a side effect of mounting.
- `getRestTimerState` returns the authoritative native snapshot. `useTimer.ts` drains pending commands **before** snapshot reconciliation on startup, notification-action events and foreground resume.
- Native `+30s` and `Skip` remain entirely functional with frozen JavaScript. JS-originated changes alone issue native schedule/cancel requests; native-originated state updates never schedule again. A late snapshot cannot overwrite a fresh JS manual rest.
- The native expiry receiver checks the persisted deadline. Stale/retired alarm broadcasts cannot emit a false completion after an extension or skip.
- `WorkoutReminderBootReceiver` now also restores a still-future rest alarm following `BOOT_COMPLETED`; expired rests are cleared without firing late.
- No foreground service / wake lock is introduced for the rest countdown. Native chronometer handles display, OS alarm handles the wakeup, one 1Hz worker drives only the visible JS display.

## Notifications and look

- Dedicated transparent monochrome Android status icon `ic_stat_rest_timer.xml` replaces the colored launcher in timer/reminder notifications.
- Native ongoing notification shows Android-managed countdown and +30s/Skip actions; a completion alert appears separately only when the app is backgrounded.
- On Android 16 (SDK 36+), meaningful rests with at least 90 seconds remaining request **promoted ongoing** visibility with `android.requestPromotedOngoing`; Android/OEM/user settings determine actual promotion. This uses the existing **standard** notification plus system chronometer (not a stale `ProgressStyle` bar). Required non-runtime permission `POST_PROMOTED_NOTIFICATIONS` is present.
- In-app compact pill, full sheet, confirmation prompts and Profile alarm setting now use Premium Expressive surfaces, accessible text sizes and reduced-motion support. Behavior is unchanged in browsers/PWA; web background notifications remain best-effort.

## Tests and exclusions

- `tests/unit/nativeRestState.test.tsx`: native restore, +30s, Skip, old snapshot/brand-new rest race, manual schedule.
- `tests/unit/nativeRestContract.test.ts`: NativeBridge receiver, manifest, boot wiring, Android16 promotion, icon and OS-alarm fallback source contracts.
- Existing `timerCommands` and `timerNotifications` suites still verify queued-command idempotency, web fallbacks and native scheduling.
- `npm run verify`: **PASS**. Android `npx cap sync android` and Gradle `:app:assembleDebug` with JDK 21 and SDK 36: **PASS** (debug APK only, not signed production release).
- Native app version incremented to `versionCode 419` and `versionName 4.0.3-kong.11`.

## Required physical Android acceptance

1. Enable notifications/exact alarms; start 60/90/120s rest; lock phone; verify countdown, alert and vibration at expiry.
2. While locked: press +30 twice, reopen, confirm the new deadline and that exactly one finish sound occurs. Repeat with Skip; confirm no later alert.
3. Kill the app *process* while rest is active (not system Force Stop); reopen and confirm remaining time/series were restored. Distinguish swiping away, process reclaim, and Force Stop: Android Force Stop suppresses scheduled alarms until next launch.
4. Reboot with a still-future rest and verify the receiver re-chains an OS alarm.
5. Revoke exact alarm permission and notification permission independently; check degraded behavior and Profile explanations without crashes.
6. On Android 16 test the optional Live Update chip and non-promoted fallback; test normal Android 15.
7. Test dark/light themes, keyboard focus, small widths, reduced motion, and battery saver. Verify the native and web/PWA outcomes separately.

**No guarantee** of sub-second alarms without exact-alarm permission or after a user Force Stops the app; this is controlled by Android. On some Motorola devices, battery restrictions can further delay background work. Never claim Chrome E2E substitutes for physical-device alarm tests.
