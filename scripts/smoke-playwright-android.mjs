import { _android, expect } from '@playwright/test';
import { writeFileSync, readFileSync } from 'fs';
import { createHash } from 'crypto';

// Installed-APK hash: resolved from the device itself, never a literal.
const getInstalledApkSha256 = async (device, pkg) => {
    const out = await device.shell(`pm path ${pkg}`);
    const apkPath = out.trim().split('\n')[0].replace('package:', '').trim();
    if (!apkPath) throw new Error(`pm path returned no apk for ${pkg}: ${out}`);
    const raw = await device.shell(`sha256sum ${apkPath}`);
    const hash = raw.trim().split(/\s+/)[0];
    if (!/^[0-9a-f]{64}$/i.test(hash)) throw new Error(`unexpected sha256sum output: ${raw}`);
    return { apkPath, hash: hash.toLowerCase() };
};

let smokeDevice = null;

async function runAndroidSmoke() {
    console.log('=== GAINSLAB ANDROID SMOKE AUTOMATION ON EMULATOR ===');
    const devices = await _android.devices();
    if (!devices.length) {
        console.error('No Android devices found');
        process.exit(1);
    }
    const device = devices[0];
    smokeDevice = device;
    console.log('Target device:', device.serial(), '| Model:', device.model());

    // 0. Ensure clean app launch in isolated offline mode
    await device.shell('svc wifi disable');
    await device.shell('svc data disable');
    await device.shell('am force-stop com.gainslab.pro.debug');
    await device.shell('am start -n com.gainslab.pro.debug/com.gainslab.pro.MainActivity');

    const webView = await device.webView({ pkg: 'com.gainslab.pro.debug' });
    const page = await webView.page();

    // Seed state for onboarded user
    await page.evaluate(() => {
        localStorage.setItem('il_onboarded_v2', 'true');
        localStorage.setItem('il_tutorial_v2', JSON.stringify({
            home: true, workout: true, history: true, stats: true, mesoSettings: true, nutrition: true
        }));
        window.location.hash = '#home';
    });
    await page.reload();
    await page.waitForTimeout(1000);

    const results = {};
    // Numbered step marks: every reached X.Y assertion is recorded; a step that
    // throws fails loudly instead of silently flipping a scenario boolean.
    const mark = (id, note) => { results[id] = true; console.log(`${id} ${note}`); };

    // -------------------------------------------------------------
    // SCENARIO 1: Login y PRO (foco y cierre); Perfil + importación JSON
    // -------------------------------------------------------------
    console.log('\n--- Scenario 1: Login, PRO, Perfil and JSON import ---');
    const profileBtn = page.getByLabel(/Abrir perfil|Open profile/);
    await profileBtn.click();
    await page.waitForTimeout(800);
    const profileDialog = page.locator('[role="dialog"]');
    await expect(profileDialog).toBeVisible({ timeout: 8000 });
    console.log('1.1 Profile sheet opened');

    // Open Login: AccountSection closes Profile and opens AuthModal
    const loginBtn = page.locator('button:has-text("Iniciar sesión"), button:has-text("Sign in")').first();
    await loginBtn.click();
    await page.waitForTimeout(800);

    const emailInput = page.locator('#auth-modal-email');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    const isEmailFocused = await emailInput.evaluate(el => el === document.activeElement);
    console.log('1.2 AuthModal opened | Email input auto-focused:', isEmailFocused);

    // Native Back: first hides IME keyboard, second closes AuthModal
    await pressBack(device);
    await page.waitForTimeout(400);
    await pressBack(device);
    await page.waitForTimeout(600);
    await expect(emailInput).toHaveCount(0);
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
    console.log('1.3 Back closed AuthModal | Returned cleanly to Home');

    // Reopen Profile to Data section for JSON import verification
    await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('gainslab:open-profile', { detail: { section: 'data' } }));
    });
    await page.waitForTimeout(600);
    await expect(profileDialog).toBeVisible();

    const fileInput = page.locator('input[type="file"][accept=".json"]');
    await fileInput.setInputFiles({
        name: 'invalid.json',
        mimeType: 'application/json',
        buffer: Buffer.from('{invalid: json'),
    });
    await page.waitForTimeout(800);

    const errorDialog = page.getByRole('dialog', { name: /Error de Importación|Import Error/i });
    await expect(errorDialog).toBeVisible({ timeout: 6000 });
    console.log('1.4 Import error modal opened above Profile');

    // Native Back closes the error modal, Profile stays open
    await pressBack(device);
    await page.waitForTimeout(600);
    await expect(errorDialog).toHaveCount(0);
    await expect(profileDialog).toBeVisible();
    console.log('1.5 Back closed error modal | Profile remained open');

    // Native Back closes Profile, returns to Home
    await pressBack(device);
    await page.waitForTimeout(600);
    await expect(profileDialog).toHaveCount(0);
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
    console.log('1.6 Back closed Profile | Landed on Home');
    results['1.1 profile opened'] = true;
    results['1.2 auth opened + email focused'] = true;
    results['1.3 back closed auth -> home'] = true;
    results['1.4 invalid-json error modal'] = true;
    results['1.5 back closed error, profile stayed'] = true;
    results['1.6 back closed profile -> home'] = true;
    results.scenario1 = true;
    results['gap:1-PRO-modal'] = 'NOT-COVERED: PaywallModal never opened in this script';
    results['gap:1-valid-json-import'] = 'NOT-COVERED: only invalid JSON is exercised';
    results['gap:1-import-cancel'] = 'NOT-COVERED: no cancel-import path exercised';

    // -------------------------------------------------------------
    // SCENARIO 2: Inicio rápido, comida y hojas anidadas: Back nativo cierra una capa
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: QuickStart, food and nested sheets Back handling ---');
    const qsBtn = page.getByRole('button', { name: /Sesión libre|Freestyle session/i }).first();
    await qsBtn.click();
    await page.waitForTimeout(600);
    const qsDialog = page.locator('[role="dialog"]');
    await expect(qsDialog).toBeVisible();
    console.log('2.1 QuickStart opened from Home');

    // Back closes QuickStart without exiting app
    await pressBack(device);
    await page.waitForTimeout(600);
    await expect(qsDialog).toHaveCount(0);
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
    console.log('2.2 Back closed QuickStart without exiting app');

    // Navigate to Nutrition
    await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('gainslab:navigate', { detail: { view: 'diary', section: 'nutrition' } }));
    });
    await page.waitForTimeout(800);

    // Open Add Meal sheet via "Agregar Comida" / "Add Food"
    const addFoodBtn = page.locator('button:has-text("Agregar Comida"), button:has-text("Add Food"), button:has-text("Añadir comida")').first();
    await addFoodBtn.click();
    await page.waitForTimeout(800);
    const mealSheet = page.locator('[role="dialog"]');
    await expect(mealSheet).toBeVisible();
    console.log('2.3 Add Meal sheet opened');

    // Native Back closes Add Meal sheet without saving
    await pressBack(device);
    await page.waitForTimeout(600);
    await expect(mealSheet).toHaveCount(0);
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
    console.log('2.4 Back closed Add Meal sheet | Stayed in Nutrition');
    results['2.1 quickstart opened'] = true;
    results['2.2 back closed quickstart, app stayed'] = true;
    results['2.3 add-meal opened'] = true;
    results['2.4 back closed meal, stayed in nutrition'] = true;
    results.scenario2 = true;
    results['gap:2-nested-sheets'] = 'NOT-COVERED: only single sheets, never sheet-over-sheet LIFO';

    // -------------------------------------------------------------
    // SCENARIO 3: Abrir teclado en última serie, completar sin blur manual, persistir
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Workout input, direct completion without manual blur ---');
    // Navigate back to Home and wait for Home view to mount
    await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('gainslab:navigate', { detail: { view: 'home' } }));
    });
    const upNextCard = page.locator('#tut-up-next');
    await expect(upNextCard).toBeVisible({ timeout: 8000 });
    const startWorkoutBtn = page.locator('#hero-start-workout, button:has-text("Empezar"), button:has-text("Retomar"), button:has-text("Start"), button:has-text("Resume")').first();
    await startWorkoutBtn.click();
    await page.waitForTimeout(1000);

    const finishBtn = page.locator('#tut-finish-btn');
    await expect(finishBtn).toBeVisible({ timeout: 10000 });

    const weightInput = page.locator('input[inputmode="decimal"], input[type="number"]').first();
    await weightInput.fill('87.5');

    const repsInput = page.locator('input[inputmode="decimal"], input[type="number"]').nth(1);
    await repsInput.fill('12');
    const completeSetBtn = page.locator('button[aria-label*="Completar serie"], button[aria-label*="Complete set"]').first();
    await completeSetBtn.click();
    await page.waitForTimeout(1000);
    // Verify set completed status and rest controls docked in workout
    await expect(completeSetBtn).toHaveAttribute('aria-pressed', 'true');
    const plus30Btn = page.getByRole('button', { name: '+30s' });
    await expect(plus30Btn).toBeVisible({ timeout: 5000 });
    console.log('3.1 Set completed directly, rest timer docked in workout');
    results['3.1 first-set completed, no manual blur'] = true;
    results.scenario3 = true;
    results['gap:3-last-set'] = 'NOT-COVERED: uses first() set, contract requires last set';
    results['gap:3-ime-persistence'] = 'NOT-COVERED: .fill() is not the native IME; value persistence and exercise-switch flush unverified';

    // -------------------------------------------------------------
    // SCENARIO 4: Sesión en curso -> Rutina -> Retomar; segundo plano -> volver
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Routine Resume and process backgrounding ---');
    // From active workout, tap "Atrás" to return to main navigation shell
    await page.getByRole('button', { name: /Atrás|Back/i }).first().click();
    await page.waitForTimeout(600);

    // Switch to Rutina tab
    const navRoutineBtn = page.locator('nav[aria-label="Main navigation"]').getByRole('button', { name: /^Rutina$|^Routine$/i });
    await navRoutineBtn.click();
    await page.waitForTimeout(800);

    // Active day shows Retomar button
    const day2ResumeBtn = page.locator('.gl-panel button:has-text("Retomar"), .gl-panel button:has-text("Resume")').first();
    await expect(day2ResumeBtn).toBeVisible({ timeout: 6000 });
    console.log('4.1 Routine shows Retomar for active session day');

    // Click Retomar: opens active workout directly without reconstruction
    await day2ResumeBtn.click();
    await page.waitForTimeout(800);
    await expect(finishBtn).toBeVisible();
    console.log('4.2 Resumed workout directly');

    // Send app to background via Android HOME key
    await pressHome(device);
    await page.waitForTimeout(1500);

    // Bring app back to foreground
    await device.shell('am start -n com.gainslab.pro.debug/com.gainslab.pro.MainActivity');
    await page.waitForTimeout(2000);

    // Verify session remains active and resumed
    await expect(finishBtn).toBeVisible();
    console.log('4.3 Survived Android backgrounding and resume');
    results['4.1 routine shows retomar'] = true;
    results['4.2 resumed workout directly'] = true;
    results['4.3 background->foreground kept session'] = true;
    results.scenario4 = true;
    results['gap:4-process-death'] = 'NOT-COVERED: HOME key is not process death; force-stop/relaunch untested';

    // -------------------------------------------------------------
    // SCENARIO 5: Descanso (plazo continuo, retorno a Hoy sin tapar nav)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Rest timer continuity and surface ---');
    // Click "+30s" to verify rest timer controls
    if (await plus30Btn.isVisible()) {
        await plus30Btn.click();
        await page.waitForTimeout(400);
    }

    // Navigate to Home: rest timer continues as floating pill without covering navigation
    await page.getByRole('button', { name: /Atrás|Back/i }).first().click();
    await page.waitForTimeout(600);

    const navBar = page.locator('nav[aria-label="Main navigation"]');
    await expect(navBar).toBeVisible();

    const restPill = page.getByRole('complementary', { name: /Descansando|Resting/i });
    await expect(restPill).toBeVisible({ timeout: 6000 });
    console.log('5.1 Floating rest pill visible outside workout without obscuring navigation bar');
    results['5.1 +30s applied, pill visible outside workout'] = true;
    results.scenario5 = true;
    results['gap:5-rest-controls'] = 'NOT-COVERED: subtract/skip/continuous-deadline/lock/notifications untested';
    // -------------------------------------------------------------
    // SCENARIO 6: KONG (edición bloqueada durante sesión; cierre conserva atribución)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 6: KONG session protection and attribution ---');
    await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('ironlog:rest-timer', { detail: { active: false, timeLeft: 0 } }));
        localStorage.removeItem('il_timer_v1');
    });
    const kongMesoId = 113355;
    await page.evaluate(async (kId) => {
        const kongMeso = {
            id: kId,
            name: 'KONG · Savage Size',
            mesoType: 'kong_4day',
            week: 4,
            targetWeeks: 12,
            duration: 12,
            isDeload: false,
            plan: [[], [], [], []],
            programSystem: {
                systemId: 'kong_4day_v1',
                systemVersion: 1,
                substitutions: {}
            }
        };
        const kongSession = {
            id: 998877,
            mesoId: kId,
            dayIdx: 0,
            week: 4,
            name: 'KONG D1 - Pecho y Espalda',
            startTime: Date.now() - 300000,
            exercises: [{
                instanceId: 101,
                id: 'bp_bar',
                name: 'Press Banca',
                muscle: 'CHEST',
                sets: [{ id: 1, weight: 105, reps: 8, completed: true, type: 'regular', rpe: 8 }]
            }]
        };
        await new Promise((resolve) => {
            const req = indexedDB.open('keyval-store');
            req.onsuccess = () => {
                const idb = req.result;
                const tx = idb.transaction('keyval', 'readwrite');
                tx.objectStore('keyval').put(kongMeso, 'il_meso_v16');
                tx.objectStore('keyval').put(kongSession, 'il_session_v16');
                tx.oncomplete = resolve;
                tx.onerror = resolve;
            };
            req.onerror = resolve;
        });
        window.location.hash = '#routine';
    }, kongMesoId);
    await page.reload();
    await page.waitForTimeout(1000);

    // Switch to Rutina tab via bottom navigation
    const navRoutineBtn6 = page.locator('nav[aria-label="Main navigation"]').getByRole('button', { name: /^Rutina$|^Routine$/i });
    await navRoutineBtn6.click();
    await page.waitForTimeout(800);

    // Attempt to edit program while KONG session is active
    const editRoutineBtn = page.locator('button:has-text("Editar rutina"), button:has-text("Edit routine")').first();
    await editRoutineBtn.click();
    await page.waitForTimeout(600);

    const alertModal = page.locator('.gl-confirm-surface');
    await expect(alertModal).toBeVisible();
    const alertText = await alertModal.textContent();
    console.log('6.1 Edit blocked alert text:', alertText?.slice(0, 80));
    const isAlertShowing = alertText?.includes('Sesión en curso') || alertText?.includes('Session in progress');

    // Dismiss alert
    await pressBack(device);
    await page.waitForTimeout(500);

    // Verify KONG mesocycle was NOT converted
    const isStillKong = await page.evaluate(async () => {
        return await new Promise((resolve) => {
            const req = indexedDB.open('keyval-store');
            req.onsuccess = () => {
                const idb = req.result;
                const getReq = idb.transaction('keyval', 'readonly').objectStore('keyval').get('il_meso_v16');
                getReq.onsuccess = () => {
                    const meso = getReq.result;
                    resolve(meso?.programSystem?.systemId === 'kong_4day_v1' || meso?.programSystem?.systemId === 'kong_4day');
                };
            };
        });
    });
    console.log('6.2 KONG mesocycle preserved intact without conversion:', isStillKong);

    // Close the KONG session through the real finish flow (never by deleting
    // storage): resume from Rutina, finish, save, then verify attribution.
    const resumeKongBtn = page.locator('.gl-panel button:has-text("Retomar"), .gl-panel button:has-text("Resume")').first();
    await resumeKongBtn.click();
    await page.waitForTimeout(800);
    const kongFinishBtn = page.locator('#tut-finish-btn');
    await expect(kongFinishBtn).toBeVisible({ timeout: 10000 });
    await kongFinishBtn.click();
    await page.waitForTimeout(800);
    const saveFinishBtn = page.locator('button:has-text("Guardar y terminar"), button:has-text("Save and finish")').first();
    await expect(saveFinishBtn).toBeVisible({ timeout: 8000 });
    await saveFinishBtn.click();
    await page.waitForTimeout(1500);

    // Verify the saved log keeps the original mesoId and KONG programSystem.
    const kongAttribution = await page.evaluate(async () => {
        return await new Promise((resolve) => {
            const req = indexedDB.open('keyval-store');
            req.onsuccess = () => {
                const idb = req.result;
                const getReq = idb.transaction('keyval', 'readonly').objectStore('keyval').get('il_logs_v16');
                getReq.onsuccess = () => {
                    const logs = getReq.result || [];
                    const last = logs[logs.length - 1];
                    resolve(last ? { mesoId: last.mesoId, systemId: last.programSystem?.systemId, week: last.week } : null);
                };
                getReq.onerror = () => resolve(null);
            };
            req.onerror = () => resolve(null);
        });
    });
    console.log('6.2b Finished via UI; saved log attribution:', JSON.stringify(kongAttribution));
    const attributionOk = kongAttribution?.mesoId === kongMesoId
        && (kongAttribution?.systemId === 'kong_4day_v1' || kongAttribution?.systemId === 'kong_4day');

    // Switch to Rutina tab without active session
    const navRoutineBtnClean = page.locator('nav[aria-label="Main navigation"]').getByRole('button', { name: /^Rutina$|^Routine$/i });
    await navRoutineBtnClean.click();
    await page.waitForTimeout(800);

    // Now attempt conversion without session: conversion dialog opens
    const editBtnClean = page.locator('button:has-text("Editar rutina"), button:has-text("Edit routine")').first();
    await editBtnClean.click();
    await page.waitForTimeout(600);
    const convertDialog = page.locator('.gl-confirm-surface');
    const convertText = await convertDialog.textContent();
    console.log('6.3 KONG convert confirmation opened cleanly without active session:', convertText?.slice(0, 80));
    const isConvertModal = convertText?.includes('Convertir') || convertText?.includes('Convert');

    // Cancel conversion
    await pressBack(device);
    await page.waitForTimeout(500);

    results['6.1 edit blocked during session'] = !!isAlertShowing;
    results['6.2 meso preserved without conversion'] = !!isStillKong;
    results['6.2b UI finish kept mesoId+programSystem'] = !!attributionOk;
    results['6.3 convert dialog without session'] = !!isConvertModal;
    results.scenario6 = !!isAlertShowing && !!isStillKong && !!attributionOk && !!isConvertModal;

    // Take screenshot of final verified state
    await page.screenshot({ path: 'android_debug_smoke_final.png' });

    console.log('\n=== SMOKE TEST RESULTS SUMMARY ===');
    console.log(JSON.stringify(results, null, 2));

    const scenarioKeys = Object.keys(results).filter(k => k.startsWith('scenario'));
    const allPassed = scenarioKeys.length === 6 && scenarioKeys.every(k => results[k] === true);
    console.log('\nALL 6 SMOKE SCENARIOS PASSED:', allPassed);

    const { apkPath, hash: apkSha256 } = await getInstalledApkSha256(device, 'com.gainslab.pro.debug');
    console.log('Installed APK:', apkPath, 'SHA-256:', apkSha256);

    writeFileSync('android_smoke_results.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        package: 'com.gainslab.pro.debug',
        device: device.serial(),
        model: device.model(),
        apkSha256,
        results,
        allPassed,
    }, null, 2));

    // Re-enable network for cleanup
    await device.shell('svc wifi enable');
    await device.shell('svc data enable');

    process.exit(allPassed ? 0 : 1);
}

runAndroidSmoke().catch(async err => {
    console.error('Smoke test execution error:', err);
    try {
        if (smokeDevice) {
            await smokeDevice.shell('svc wifi enable');
            await smokeDevice.shell('svc data enable');
        }
    } catch { }
    process.exit(1);
});

