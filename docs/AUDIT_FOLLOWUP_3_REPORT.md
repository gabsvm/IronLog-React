# Reporte de Seguimiento Post-Auditoría 3: H1–H3 + Fase 7 (GainsLab)

| Metadato | Detalle |
|---|---|
| **Fecha** | 2026-10-02 |
| **Rama** | `agent/gainslab-audit-fixes-v3` (todo en la misma rama; sin ramas nuevas) |
| **Alcance** | Cierre de H1–H3 + Fase 7 completa (Capacitor 8, SDK 36, edge-to-edge, R8) + 2 APK de prueba |
| **Tag de retorno** | `pre-phase7` → `5d36876` (pusheado a origin) |

Estado final verificado: **unit 51 archivos / 253 tests**, **e2e 20/20**,
build con **precache 61 assets (7 critical + 54 lazy)**, lint:a11y 0 errores,
**2 APK** (debug + release R8) con hashes abajo.

---

## Parte A: H1–H3

### H1. Aviso de notificaciones sobre la píldora + autocierre (commit `afc2c5c`)

**Problema:** el aviso (`bottom-24` fijo) tapaba los botones −10s/+30s/saltar
del siguiente descanso y no se cerraba solo.

**Cambios** (`components/ui/RestTimerOverlay.tsx`): el aviso se posiciona con
`bottom: calc(var(--safe-area-bottom) + 80px + var(--rest-pill-height, 0px) + 16px)`
(sobre la píldora real, medida; P7-4 agregó el inset), contenedor exterior
`pointer-events-none` (interior `pointer-events-auto`) y autocierre a los 10 s
(el flag `il_notif_prompted` ya estaba seteado al mostrarlo: no vuelve).

**Tests:** `restNotifPrompt.test.tsx` +1 (fake timers: visible a 9.999 s,
ausente a los 10 s, flag intacto, no reaparece; 6/6) y
`restPillHeight.spec.ts` +1 e2e (píldora real visible + evento real
`ironlog:rest-completed` → boundingBox del aviso fully sobre la píldora).

### H2. Historial sin replaceState en cada cambio de vista (commit `cd02a2a`)

**Problema:** el efecto con deps `[setView]` re-ejecutaba
`replaceState({view:'home',...})` en cada cambio de vista, pisando la entrada
real (Atrás desde program/workout caía en Home; se perdía `profile:true`).

**Cambios** (`App.tsx`): seed inicial en un efecto `[]` (una sola vez) y
listener `popstate` en otro efecto `[]` (no usa `setView`).

**Tests:** nuevo `tests/e2e/programBackNav.spec.ts` (Stats → paleta →
"Editar mi programa" → Atrás → Stats, URL `#stats`). Control negativo: con
`App.tsx` pre-fix (stash) el spec FALLA; con el fix pasa. `flatHistory` y
`profileBackNav` siguen verdes (3/3 juntos).

### H3. workoutProfiler eliminado por redundante (commit `5d36876`)

El archivo solo tenía aserciones de milisegundos (`actualDuration`) + checks
de store. Quitar tiempos dejaba conteos de "visits" del Profiler, que disparan
también en bailout memoizado (hallazgo documentado en el propio test) — o sea,
sin señal. Los dos escenarios (editar peso, completar serie) ya están cubiertos
con conteos de renders deterministas contra controller + store reales en
`workoutRenderIsolation.test.tsx`. Se eliminó el archivo (`git rm`) en vez de
dejar un test sin aserciones con sentido.

---

## Parte B: Fase 7

### P7-0. Preparación (commit `27103ec`, tag `pre-phase7`)

- 4 comandos base en verde antes de empezar (build / 51→52…253 tests / lint / 19 e2e).
- Tag `pre-phase7` → `5d36876`, pusheado.
- Toolchain: Node 26.4.0 (ok, ≥22); JDK 17 era el único → instalado
  Temurin **JDK 21.0.12.1** en `C:\jdk-21` (descarga Adoptium, 205 MB);
  SDK ya tenía `platforms/android-36` + `build-tools/36.0.0`.
- `scripts/validate-android-env.mjs` extendido: Firebase (igual) + JDK
  (mínimo 17, recomendado 21) + platform/build-tools 36 con comandos de
  instalación exactos si faltan. Pasa con JDK 21 y con 17 (warning).

### P7-1. Capacitor por majors (commits `27a9a69`, `129cedd`, `ea61616`)

Guías web inaccesibles (`capacitorjs.com` timeout) → se usó `npx cap migrate`
+ la matriz oficial extraída del template (`android-template.tar.gz`) y de
`node_modules/@capacitor/cli/dist/tasks/migrate.js`.

| Salto | Paquetes | SDK/min | Gradle/AGP/Java | Notas |
|---|---|---|---|---|
| 5.7.8 → **6** (`27a9a69`) | `^6.0.0` | 34 / 22 | 8.9 / 8.7.2 / 17 | `compileSdkVersion`→`compileSdk`; APK debug ok con JDK 17 |
| 6 → **7** (`129cedd`) | `^7.0.0` | 35 / 23 | 8.11.1 / 8.7.2 / 21 | manifest +`navigation`; APK debug ok con JDK 21 |
| 7 → **8.5.2** (`ea61616`) | `^8.0.0` | 36 / 24 | 8.14.3 / 8.13.0 / 21 | manifest +`density`; androidx oficiales (ver abajo) |

**Bug del migrador (los 3 saltos):** `cap migrate` falla con
`TypeError: Invalid Version: ext {...}` al parsear `variables.gradle`,
pero ESCRIBE los cambios antes de fallar (verificado por diff en cada salto).
En P7-1c el fallo dejó las versiones androidx viejas (cordova 10.1.1 →
`kotlin-stdlib-jdk7/8:1.6.21` vs stdlib 1.8.10 → `checkDebugDuplicateClasses`
FAILED). Fix: copiar los valores exactos del template oficial Cap 8
(activity 1.11.0, appcompat 1.7.1, coordinator 1.3.0, core 1.17.0, fragment
1.8.9, splash 1.2.0, webkit 1.14.0, junit-ext 1.3.0, espresso 3.7.0, cordova
14.0.1). Tras eso: BUILD SUCCESSFUL, stdlib resuelto uniformemente a 2.0.21.
Cada salto compiló `assembleDebug` antes de commitear (rama siempre verde).

`@capacitor/assets` 3.0.5 = última publicada → sin cambios.

### P7-2. Matriz verificada (commit `48dce9e`, vacío de verificación)

`cap migrate` ya había aplicado toda la matriz en P7-1c; P7-2 la verificó
archivo por archivo contra el template oficial:

| Archivo | Estado |
|---|---|
| `android/variables.gradle` | idéntico al template Cap 8 (SDK 36/36, minSdk 24, androidx oficiales) |
| `android/build.gradle` | AGP 8.13.0, google-services 4.4.4 |
| `android/app/build.gradle` | `compileSdk =`, `namespace =`, v414 / 4.0.3-kong.6 |
| `gradle-wrapper.properties` | 8.14.3 (+jar + scripts actualizados) |
| `capacitor.build.gradle` | Java 21 |
| Kotlin | sin plugin/fuentes Kotlin en el proyecto (N/A; `kotlinVersion 2.2.20` del migrador aplica al plugin Kotlin); stdlib transitivo → 2.0.21 uniforme |

### P7-3. Auditoría targetSdk 33→36 (commit `a2554b4`)

Código nativo propio leído completo: `AndroidManifest.xml`,
`MainActivity.java`, `NativeBridgePlugin.java`, `RestTimerReceiver.java`.

| Cambio de comportamiento | Decisión | Archivo | Verificación |
|---|---|---|---|
| Alarma exacta (31+): sin permiso declarado, `canScheduleExactAlarms()` siempre false | Declarar `SCHEDULE_EXACT_ALARM` (revocable; NO `USE_EXACT_ALARM`); el chequeo runtime + fallback a `setAndAllowWhileIdle` ya existían | manifest, `NativeBridgePlugin.java:108-117` | `aapt dump badging`: permiso presente; merged manifest ok |
| `POST_NOTIFICATIONS` (33+) | Ya declarado + pedido en runtime vía alias Capacitor en el primer descanso + canal `gainslab_rest_timer` creado en `load()` | manifest, plugin | compilación + instalación ok; prompt real pendiente en dispositivo |
| Receivers / PendingIntent (31+) | Receiver `exported=false` explícito ✓; ambos PendingIntent con `FLAG_IMMUTABLE` ✓; sin registros dinámicos; intents explícitos | manifest, plugin | revisión de código |
| Foreground services | No hay ninguno | — | revisión de código |
| Back predictivo (33–36) | Eliminado el override deprecado `onBackPressed()`; callback en `OnBackPressedDispatcher` (misma lógica: `goBack()` si hay historia web, sino fall-through); `android:enableOnBackInvokedCallback="true"` explícito | `MainActivity.java`, manifest | compilación ok; gesto real pendiente (bloqueo input adb, ver P7-4) |
| Alineación 16 KB / `.so` | El APK no contiene ningún `.so` | — | listado del zip del APK: 0 `.so` → N/A |

**Tests web:** `timerNotifications.test.ts` +3 (9/9): en nativo, descanso activo
con `endAt` futuro programa la alarma con (endAt, finished, getBack);
inactivo/expirado la cancela (el mount cancela la stale — comportamiento real
verificado); en web nunca toca el bridge.

### P7-4. Edge-to-edge (commit `f667f72`)

Doc oficial: `node_modules/@capacitor/core/system-bars.md` (bundled con core)
+ implementación nativa (`SystemBars.java:266-269` inyecta
`--safe-area-inset-top/right/bottom/left` en documentElement).

- **Nada que quitar:** el repo no usaba `adjustMarginsForEdgeToEdge` ni
  `StatusBar.setOverlaysWebView` (grep: 0 hits).
- `capacitor.config.ts`: `SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover' }`.
- `MainActivity`: `EdgeToEdge.enable(this)` (androidx.activity 1.11).
- `index.css`: `--safe-area-top/bottom` = `var(--safe-area-inset-*, env(..., 0px))`
  (plugin primero, env fallback; el fallback 20px solo afectaba navegadores sin
  `env()`); nuevos utilitarios **`.top-safe`/`.bottom-safe`** — `top-safe` se
  usaba en 2 banners de `App.tsx` pero NO EXISTÍA (no-op; ahora fija los
  banners arriba + inset).
- Componentes migrados al patrón (15 archivos): header/contenido `Layout`,
  píldora (`bottom` + dock con teclado), aviso notif (H1), padding de lista
  workout (+ inset), toast skip, `ProgramHub`, `CommandPalette`,
  `TutorialOverlay`, `TemplateSelector`, `SessionSummaryView`,
  `ux-navigation.css`. Sheets (`Sheet.tsx`) y modales ya usaban
  `pt-safe`/`pb-safe` → heredan el fix.
- **E2E** `tests/e2e/insets.spec.ts` (390x844, top 40 / bottom 24 inyectados
  post-load como hace el plugin): botones del nav, header del workout
  (atrás/terminar) y píldora fuera de las zonas simuladas. Nota: la Inyección
  debe ser post-load (`addInitScript` corre con `documentElement` null).
- Regresión: restPillHeight/overflow/criticalJourneys/finishFlow 11/11.

**Emulador: BLOQUEADO (2 intentos).** `medium_phone` (API 36) existe pero el
emulador exige aceleración y el driver AEHD no está instalado; su
`silent_install.bat` pide UAC de administrador (no disponible en esta sesión);
`HypervisorPlatform`/WHPX tampoco se puede consultar sin elevación.
Comando exacto pendiente (como Admin):
`"%ANDROID_HOME%\extras\google\Android_Emulator_Hypervisor_Driver\silent_install.bat"`.
Sin AVD API ≤34 (solo hay images 35/36).

**Dispositivo físico (en su lugar):** Xiaomi M2101K7AG, Android 11 (SDK 30),
conectado por adb. Verificado de verdad:
- Install + launch (debug y release R8) sin crashes; logcat SIN
  `ClassNotFoundException`/`NoSuchMethodException`/`Resources$NotFoundException`/`FATAL`
  de `com.gainslab.pro` (los 2 `NoSuchMethod` del log son de procesos MIUI del
  sistema, no de la app).
- **SystemBars inyecta valores reales: `--safe-area-inset-top: 33px`,
  `--safe-area-inset-bottom: 47px`, y `--safe-area-top/bottom` los resuelven**
  (leído por CDP sobre el WebView del dispositivo).
- Onboarding completo hasta Home vía DOM real (wizard 4 pasos + rutina
  sugerida); Home screenshot `apk-out/screens/03-home.png` (261 KB, contenido
  verificado por muestreo de píxeles).
- Límites honestos: el teléfono está BLOQUEADO (keyguard + sin inyección de
  input por ajustes MIUI) → `visibilityState=hidden`, rAF/timers congelados:
  las transiciones de vista/sheets no se pudieron ejercer ni capturar
  (Workout/píldora/Settings visuales quedan pendientes); gesto Atrás nativo
  pendiente. Las transiciones SÍ pasan en los 20 e2e Chromium.

### P7-5. R8 / release (commit `6037388`)

- `android/app/build.gradle`: `minifyEnabled true`, `shrinkResources true`
  (ya usaba `proguard-android-optimize.txt` + `proguard-rules.pro`).
- Reglas (`proguard-rules.pro`): keep de clases `@CapacitorPlugin` + métodos
  `@PluginMethod`/`@PermissionCallback` (invocación reflexiva) con
  `-keepattributes *Annotation*`; keep de `MainActivity`,
  `RestTimerReceiver`, `NativeBridgePlugin` (entry points de manifest/registro);
  keep de `@JavascriptInterface` (ninguno hoy; a futuro); `SourceFile` +
  `LineNumberTable` para trazas legibles. Por qué: sin estas reglas R8 puede
  renombrar/eliminar miembros que solo se tocan por reflexión o desde JS.
- Verificación: `mapping.txt` muestra las 3 clases mapeadas a sí mismas;
  release firmada con debug key (`apksigner` ok, cert Android Debug);
  instalada + abierta en el Xiaomi, logcat limpio (ver P7-4).
- `mapping.txt` guardado en `apk-out/` (SHA abajo). No existe
  `android/key.properties` (verificado solo-existencia) → no hay `.aab`.

### P7-6. Binarios (sin commit: solo archivos ignorados)

Árbol limpio en `6037388`; `npm run build` (cache `32c3a0c3cf97`) +
`npx cap sync android` + `assembleDebug assembleRelease` (JDK 21).

| APK | Ruta absoluta | Tamaño | SHA-256 |
|---|---|---|---|
| debug | `C:\Dev\IronLog-React\apk-out\gainslab-debug.apk` | 17.580.930 B | `B5BDF01F8F3D1E1118105CDBFC295142FE732F4CC982C84832826957B80B1D65` |
| release-test (R8) | `C:\Dev\IronLog-React\apk-out\gainslab-release-test.apk` | 13.989.584 B | `59583717B5C5B3AE7A5D475DFD3CC964E0D4A1A2660943BC0DBEDA6D32A10013` |

Común: commit `6037388`, `versionName 4.0.3-kong.6`, `versionCode 414`,
`com.gainslab.pro`, compileSdk 36 / targetSdk 36 / minSdk 24 (vía
`aapt dump badging`). Instalación:
`adb install -r apk-out/gainslab-debug.apk` (o `gainslab-release-test.apk`).
`apk-out/mapping.txt` (5.472.895 B, SHA-256
`AC37B9DBE4D71F8134B321FB67DA02378B4ED31BB481193BC2FC17F8B96A9AC5`).
Nada commiteado (todo ignorado). La release-test quedó instalada en el
Xiaomi del dueño.

---

## Resultado de los 4 comandos (rama final)

- `npm run build`: OK — `Precaching 61 build assets (7 critical + 54 lazy, cache 32c3a0c3cf97)`.
- `npm run test:run`: **51 archivos / 253 tests**, todo verde.
- `npm run lint:a11y`: 0 errores.
- `npx playwright test`: **20/20** (19 previos + insets P7-4).
- Extra: `npm run validate-android-env` OK (Capacitor 8 / SDK 36).

Reglas respetadas: sin tocar `programs/`, `syncService`, `syncHelpers`,
`workoutCompletionService`, `firestore.rules`; sin valores de `.env` impresos
ni commiteados; sin dependencias npm nuevas (solo subas de versión Capacitor);
sin ramas nuevas (todo en `agent/gainslab-audit-fixes-v3` + tag `pre-phase7`);
texto visible nuevo: ninguno (P7-4 no agregó strings).

## Pendiente de verificar en dispositivo real

1. **Alarma nativa con pantalla bloqueada:** descanso corriendo + bloquear +
   esperar el fin (tono/vibración/notif; exactitud SCHEDULE_EXACT_ALARM vs
   fallback; permiso revocado desde ajustes).
2. **Edge-to-edge en Android 15/16 real:** gesture bar + status bar con
   `targetSdk 36` forzado (lo verificado es API 30 + vars reales + e2e
   simulado); captura de Workout/píldora/Settings.
3. **Gesto Atrás:** del sistema (predictivo) desde workout/program/profile en
   dispositivo desbloqueado.
4. **Release con R8 en uso real:** sesión completa de 50+ series, rest timer
   nativo,rotación, modo avión intermitente; logcat extendido.
5. **Emulador API 36/34:** una vez instalado AEHD como admin (comando en P7-4).
6. **Notificaciones:** prompt web (G6/H1) en Chrome Android + PWA instalada;
   permiso nativo pedido desde el primer descanso.

## Bloqueos

1. **Emulador sin aceleración** (P7-4): AEHD sin instalar, requiere admin →
   comando exacto documentado arriba; se usó el Xiaomi físico como sustituto.
2. **Teléfono bloqueado + MIUI sin inyección de input** (P7-4/P7-5): sin taps
   adb ni desbloqueo; capturas negras si la pantalla duerme
   (`svc power stayon usb` la despierta transitoriamente). Todo lo interactivo
   profundo queda pendiente con el teléfono desbloqueado.
3. `capacitorjs.com` inaccesible (timeout) → guías suplidas con `cap migrate`
   + template oficial + `system-bars.md` bundled (fuentes citadas por ruta).
