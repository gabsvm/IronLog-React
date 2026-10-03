# Serie N — Reporte de seguimiento 8 (N0–N7)

Rama: `agent/gainslab-audit-fixes-v3`. Tag de retorno: `pre-n-series` (pusheado a origin).
Sin ramas nuevas, sin GitHub Actions, sin `firebase deploy`, sin binarios commiteados.

## Commits

| ID | Commit | Descripción |
|----|--------|-------------|
| N1 | `df45641` | Poda de firmas viejas del caché de stats |
| N2 | `9580a35` | Tests deterministas (guard scrollIntoView + timeouts de carga) |
| N3 | `d01ea3f` | Borrado de cuenta en app + diálogo + borradores legales |
| N4 | `c5a0e37` | Reglas Firestore endurecidas + tests en emulador |
| N5 | `31336fb` | App Check opcional con chunk lazy propio |
| N6 | `9bc4215` | Unificar Tú/Ajustes en una hoja, eliminar SettingsModal |
| N7 | (este reporte) | APK release-test + reporte |

## N0 — Preparación

- Árbol limpio verificado; `git tag pre-n-series && git push origin pre-n-series` (tag presente en origin).
- Baseline anotado: unit 327/327, Playwright 37/37.

## N1 — Poda del caché de stats (`df45641`)

- `services/statsCache.ts`: nueva `pruneStaleSignatureKeys(currentSignature)`; compara por prefijo
  exacto (`${prefix}${currentSignature}:`), sin `split` (la firma contiene `:`).
- Llamada desde `views/StatsView.tsx` al cambiar la firma; una sola pasada por firma (memoria de
  módulo), con try/catch. Nunca toca `il_stats_scope_v2` ni `il_stats_selected_exercise_v1`.
- Test `tests/unit/statsCacheSignaturePrune.test.ts` (fake-indexeddb): 5/5 — poda multi-firma,
  firmas con `:`, preservación de claves scope/selected, idempotencia por firma, fallo de IDB no rompe.
- Fail-proof: el test falla sin `pruneStaleSignatureKeys` (claves viejas presentes). Gates: 332/332.

## N2 — Tests intermitentes (`9580a35`)

- Causa real: `TutorialOverlay` llamaba `scrollIntoView` sin guard (falta en jsdom/WebViews viejos)
  y timeouts de precarga idle demasiado cortos bajo carga paralela.
- Fix: guard de `scrollIntoView` en producción + timeouts de `lazySheets`/`modulePreload` a 15 s/30 s
  (tolerancia de carga, sin debilitar aserciones).
- 5 corridas COMPLETAS consecutivas de `npm run test:run`, todas verdes (334/327 base + nuevos):

| Corrida | Resultado |
|---------|-----------|
| 1 | 334 passed (334) |
| 2 | 334 passed (334) |
| 3 | 334 passed (334) |
| 4 | 334 passed (334) |
| 5 | 334 passed (334) |

## N3 — Borrado de cuenta (`d01ea3f`)

- `services/accountDeletion.ts` + `AuthContext.deleteAccount(password)`. Orden verificado por tests:
  reauth (EmailAuthProvider) → borra `users/{uid}/data/*` excepto `subscription` → borra
  `users/{uid}` → `deleteUser` → limpieza local (offlineSyncQueue, dirtySyncState, cloudSyncCache del
  uid, `window._lastSyncedId`, auth/suscripción) → logout. Datos locales de entrenamiento solo con
  casilla explícita (via `services/localDataReset.ts`).
- Errores con mensajes en TRANSLATIONS es/en: contraseña incorrecta, requires-recent-login, offline,
  fallo parcial con reintento.
- UI en ProfileSheet (solo sesión, no invitados): fila destructiva → `DeleteAccountDialog`
  (`role="alertdialog"`): qué se borra (énfasis en pérdida de Pro si `isPro`), casilla datos locales,
  contraseña + palabra ELIMINAR/DELETE; botón habilitado solo con ambas.
- Borradores legales (NO publicados, NO en `public/`): `docs/legal-drafts/privacy-policy.es.md`,
  `privacy-policy.en.md`, `account-deletion.es.md/en.md`, con `[CONTACTO_A_COMPLETAR]` y aviso de borrador.
- Tests: orden exacto con Firebase inyectado (9), errores/offline (6), limpieza local (2),
  RTL del diálogo (2). `deleteUser` no se llama si falla Firestore; `subscription` intacta.
- E2E contra emuladores Auth+Firestore: no implementado (ver "No verificado").

## N4 — Reglas Firestore endurecidas (`c5a0e37`)

### Inventario verificado en código

- Rutas usadas: `users/{uid}`, `users/{uid}/data/history`, `users/{uid}/data/subscription`
  (solo lectura cliente), `global_templates`, `global_exercises`. Sin otras rutas.
- Claves de `users/{uid}` (18, salen del modelo/sync): email, lastSeen, uid, lastUpdated, program,
  activeMeso, activeSession, config, exercises, rpFeedback, nutritionLogs, cardioSessions, bodyLogs,
  customFoods, personalTemplates, nutritionGoal, macroGoals, userProfile, sectionSyncMeta.
- Tipos: lastUpdated/lastSeen number; email string|null; program/exercises/personalTemplates y
  nutritionLogs/cardioSessions/bodyLogs/customFoods list; activeMeso/activeSession (o null),
  config, rpFeedback, nutritionGoal/macroGoals/userProfile (o null), sectionSyncMeta map.
- Topes ≥2x sobre recortes de syncService: nutritionLogs/cardioSessions ≤ 120, bodyLogs/customFoods ≤ 200.
- `data/history`: solo `logs` list. `data/subscription`: lectura dueño, write/delete denegados
  (incluso admin cliente). Otros nombres de doc: denegados.
- Admin transición: `token.admin == true || (token.email == 'gabsvm@gmail.com' && email_verified)`,
  con comentario: verificar el correo o fijar el claim ANTES de desplegar.
- `global_templates`/`global_exercises`: lectura pública, escritura solo admin.
- Denegación explícita final `match /{document=**}`.

### Tests y herramienta

- `tests/rules/firestore.rules.test.ts` + `npm run test:rules` (emulador, puerto 8085 en
  `firebase.json` porque el 8080 lo ocupa Steam; JDK 21 requerido: hay que poner `C:\jdk-21\bin`
  en PATH además de JAVA_HOME). 11/11 en emulador, incluyendo payload real de
  `syncService.uploadStateNow` y borrado dueño (compat N3).
- Fail-proof: reglas viejas vía `git stash` fallan 5/11.
- Reglas NO desplegadas. Manual del dueño: `docs/FIREBASE_MANUAL_STEPS.md`
  (emulador → admin → desplegar → probar borrado → App Check sin Enforce).

## N5 — App Check opcional (`31336fb`)

- `lib/appCheck.ts`: si existe `VITE_FIREBASE_APPCHECK_SITE_KEY`, import dinámico de
  `firebase/app-check` (chunk propio `vendor-firebase-appcheck`) + ReCaptchaV3Provider con
  auto-refresh, una sola vez (WeakMap). Sin la variable: cero cambios de comportamiento.
- Debug token solo DEV detrás de `VITE_FIREBASE_APPCHECK_DEBUG`. Nunca rompe init.
- Nombres en `.env.example` (sin valores); procedimiento en `FIREBASE_MANUAL_STEPS.md`
  (registrar app, dominios incl. localhost, métricas días, Enforce después; aviso de riesgo).
- `tests/unit/appCheck.test.ts` 4/4 (SDK inyectado). Gates: 357/357.

## N6 — Hoja unificada Tú/Ajustes (`9bc4215`)

### Inventario antes → después

Antes: `ProfileSheet` (filas de perfil) + `SettingsModal` (4 pestañas: Cuenta/Entreno/Visual/Datos)
con controles repetidos. Después: una sola hoja en 7 secciones — Cuenta, Tu cuerpo, Entrenamiento,
Apariencia, Datos, Avanzado (plegable: diagnóstico sync, créditos NH 85%, admin), Zona peligrosa.
Lo repetido quedó una sola vez; "Gestionar plantillas" en Entrenamiento; "Eliminar cuenta" (N3) en Cuenta.

Verificación programática (verde): `tests/e2e/profileSettingsInventory.spec.ts` con
`tests/e2e/inventory/profile-settings.before.json` (labels de perfil + 4 pestañas) y
`profile-settings.after.json` (32 etiquetas unificadas): cada etiqueta antigua aparece exactamente
una vez. `tests/unit/unifiedSheet.test.tsx` + `tests/unit/noSettingsRefs.test.ts`
(cero refs a `SettingsModal`/`showSettings`).

### Cambios

- `SettingsModal.tsx` eliminado; `showSettings` y `settings` del historial eliminados
  (`App.tsx`, `Layout.tsx`); entradas (paleta, tutorial, nav) abren la hoja con un solo pushState;
  Atrás la cierra. Traducciones `you.*` es/en, mayúsculas consistentes. Clases huérfanas limpiadas.
- E2E adaptados: `insetsOverlays`, `overflow`, `visualPolish`; mocks `lazySheets`/`deleteAccountSheet`
  actualizados.
- Fix extra en el mismo commit: `TutorialOverlay` crasheaba (`step.title` undefined) cuando la lista
  de pasos se achicaba bajo el índice vivo (paso condicional de HomeView). Clamp `safeIndex` en todas
  las lecturas + guard de lista vacía. Test shrink en `tutorialOverlayScroll.test.tsx`: ROJO sin el fix
  (1 failed, verificado con `git stash` de solo ese archivo), VERDE con el fix.
- Anomalía transitoria durante N6: 1 corrida completa con un fallo + unhandled del TutorialOverlay por
  esta causa; tras el clamp, 2 corridas completas 363/363 con exit 0.
- Gates N6: unit 363/363, build, lint:a11y, Playwright 40/40.

## N7 — APK release de prueba

- `npm run build && npx cap sync android` + `assembleRelease` (JDK 21, `JAVA_HOME=C:\jdk-21`),
  firmado con la misma keystore de debug de siempre (vars `GAINS_LAB_*`, valores no impresos).
- `BUILD SUCCESSFUL`. Artefactos (ignorados por git, NO commiteados):
  - `C:\Dev\IronLog-React\apk-out\gainslab-release-test.apk` — 14.000.961 bytes
  - SHA-256: `6B4ECDA348A50CE2511FF0390CB38FAC050A97C5CBC1EB8B3975C2196BDC7BD8`
  - Commit fuente: `9bc4215` — versionName `4.0.3-kong.6`, versionCode `414`
  - compileSdk 36 / targetSdk 36 / minSdk 24 (via `aapt dump badging`)
  - mapping: `C:\Dev\IronLog-React\apk-out\mapping.txt`
- Instalación: `adb install -r apk-out/gainslab-release-test.apk`
- Sin dispositivo conectado (`adb devices` vacío): instalación y logcat pendientes (ver abajo).

## Gates finales (árbol `9bc4215` + este reporte)

- `npm run build`: OK (61 assets precacheados, 7 critical + 54 lazy).
- `npm run test:run`: 363/363 (73 archivos), 5 corridas consecutivas exit 0.
- `npm run lint:a11y`: limpio.
- `npx playwright test`: 40/40.
- `npm run test:rules`: 11/11 (emulador, JDK 21 en PATH).

## No verificado / pendiente en dispositivo real

- Instalación del APK + `adb logcat` sin ClassNotFoundException/FATAL (sin dispositivo).
- Reglas N4 desplegadas + claim admin real (decisión del dueño, manual pendiente).
- App Check con site key real + métricas antes de Enforce.
- Borrado de cuenta contra emuladores Auth+Firestore e2e (solo unit+RTL verificados).
- Alarma nativa, edge-to-edge en Android 15/16 reales (heredado de reportes previos).

## Bloqueos

Ninguno requirió `git revert`. Dificultades resueltas: puerto 8080 ocupado por Steam (→ 8085),
ERESOLVE rules-unit-testing (→ v3), `java` 17 en PATH para el emulador (→ anteponer JDK 21),
crash TutorialOverlay por shrink de pasos (→ clamp + test).
