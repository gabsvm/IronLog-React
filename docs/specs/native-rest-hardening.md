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


## Final automated validation evidence

- `npm run verify`: exit 0, **142 test files / 796 tests passed / 1 skipped**; lint/a11y, TypeScript, Vite, KONG and bundle checks clean.
- Chromium Playwright functional Expressive checks: **7 / 7 passed**, both themes and 320px checks.
- Chromium full E2E: **48 / 48 passed**, including rest pill, touch targets, insets and session lifecycle.
- Native Capacitor `npx cap sync android` + Gradle `:app:assembleDebug`: **BUILD SUCCESSFUL** with Java 21, SDK 36 and native version 419. Result was an unsigned-for-release *debug* APK; no release-signing credentials used and no APK published.
- Gradle `:app:testDebugUnitTest`: exit 0. This does **not** exercise physical Android `AlarmManager`/Doze behavior.
- Follow-up native alert fix: Android notification channel handles the completion tone/vibration when permission is granted; `fallbackRestFeedback` plays a tone/vibration only if the system notification cannot be posted. A fresh rest cancels any leftover completion alert to avoid `setOnlyAlertOnce` suppressing subsequent sessions.
- Known exclusions: exact-alarm physical timing/Doze, Android 16 OEM Live Update eligibility, hardware-specific vibration, battery saver, process reclaim, restart, real notification permissions, signed-release installation.

No changes to Production were made in this native hardening pass. Preview builds contain the React/CSS changes; an Android release must be built and distributed separately to deliver the Java/manifest code.


## Android 15 contextual ongoing notification (2026-10-13)

- The existing ongoing notification continues to use **one** `TIMER_LIVE_NOTIFICATION_ID`, `setUsesChronometer(true)`, `setChronometerCountDown(true)`, `setOngoing(true)`, `setOnlyAlertOnce(true)` and the existing LOW-importance channel. This works on Android 15 without Android 16 Live Updates.
- `resolveRestNotificationContent` in `restTimerLogic.ts` reuses `resolveRestNextAction`, which already handles next working set, the next exercise and supersets. It adds **actual next set ordinal and the current exercise's set count** (e.g. `Descansando · Press banca` / `Próxima serie: 3 de 4`). No guessing from set IDs or previous exercise names. Long user-custom names are capped.
- The **first** native `scheduleRestTimer` receives the resolved texts (or original generic fallback) so context is correct even when initial Android notification registration precedes React effects.
- For later exercise / set changes, `updateRestTimerContent` updates the exact same OS notification and persists texts in `SharedPreferences`, guarded by the expected deadline. It never modifies `AlarmManager`, command epoch, completion alert, vibration or timer duration. The in-app rest overlay effect depends on exercise context, not `timeLeft`, avoiding per-second bridge calls.
- An active native rest keeps its last context through a WebView reboot while the active workout store is rehydrating. A `+30 s` native action retains the persisted text without an active WebView and refreshes the native chronometer.
- The notification action label uses **GainsLab's selected language** rather than Android's system locale (`Omitir` in Spanish; `Skip` in English); Android's Spanish resource fallback is also `Omitir`.
- **Android version:** `versionCode 420`, `versionName 4.0.3-kong.12`. The web Preview changes alone cannot install these native modifications; a new Capacitor Android build is required.

### Additional automated checks

- `tests/unit/restNotificationContent.test.ts`: next 3/4, next exercise, supersets, duplicated exercise names, manual rest, English/Spanish, empty histories, long custom names.
- `tests/unit/restTimerPill.test.tsx`: in-place update on real set completion; no bridge call per second; app-language skip label.
- `tests/unit/nativeRestContract.test.ts`: native update method only mutates notification text and preserves scheduled alarm, command epoch, same notification ID and alert-once semantics.
- Physical-device acceptance remains necessary: lock the Moto g86 Power on Android 15, start a rest on set 2 of 4, verify the displayed contextual text, extend +30s from the drawer twice, complete the next set, switch exercises, then verify there are no duplicate cards/sounds or incorrect older text. Check both Spanish and English app languages with Android set to either language.

**Deployment scope:** only the existing feature branch is updated. No Production promotion and no signed-release APK is published by this implementation.


### Validation results for contextual notification (2026-10-13)

- `npm run verify`: **PASS**, 143 Vitest files, **805 tests passed**, 1 skipped. Includes TypeScript, lint, accessibility, KONG and bundle budget.
- Dedicated notification suite: **29/29 PASS**, including first native scheduling, next-set content, same-ID update and no update on every 1-second tick.
- Chromium E2E suite: **48/48 PASS**, including real session, timer/pill, notification prompt layout and mobile insets.
- Capacitor `npx cap sync android`, Android Gradle `:app:assembleDebug :app:testDebugUnitTest`: **BUILD SUCCESSFUL** on JDK 21 and Android SDK 36. APK manifest verified `com.gainslab.pro`, version **420** (`4.0.3-kong.12`), minSdk 24, targetSdk 36.
- This is a source/debug-build validation: Android 15 notification drawer behavior, system locale, phone lock, exact alarm latency and OEM battery policies still require a **physical Moto g86 Power installation**.
- Production remains on the previously approved `14163f1` release. Preview is for web behavior; it cannot deliver a modified Java/AndroidManifest to already installed Capacitor apps.
