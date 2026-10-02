# AUDIT FOLLOW-UP 4 — J1 insets fullscreen, J2 notificación viva, J3 APK release

Rama: `agent/gainslab-audit-fixes-v3` (sin ramas nuevas). Commits: `2db16fe`
(J1), `797912b` (J2). J3 no tiene commit propio (solo binarios ignorados +
este reporte).

## J1. Insets en pantallas completas

**Causa raíz.** `Sheet` con `variant="full"` aplicaba `pt-safe` solo al
header por defecto, y ese header no se renderiza cuando
`hideCloseButton && !title && !onBack`. `ExerciseSelector` usa
`hideCloseButton` y dibuja su propio header `h-16` sin inset: la X, el
buscador y el + quedaban bajo la barra de estado. Segundo problema: en los
consumidores que sí usan el header por defecto, `h-16` fijo + `pt-safe`
comprimía el contenido (box-border) y los botones desbordaban hacia arriba
(`profile-close` medía top 34.5 con inset 40).

**Fix central** (`components/ui/Sheet.tsx`): `pt-safe` en `Drawer.Content`
para `isFull` (todos los consumidores lo heredan y el fondo cubre la zona
de la barra de estado); el header por defecto pasa a `min-h-16` sin
`pt-safe`.

**Barrido y archivos corregidos** (patrón existente `pt-safe` /
`var(--safe-area-*)`, sin strings nuevos):

- `components/ui/ExerciseSelector.tsx`: footer del Virtuoso
  `pb-[calc(3rem+var(--safe-area-bottom))]`; contenedor de crear con inset
  inferior.
- `views/ExercisesView.tsx`: header `min-h-14 pt-safe`; FAB y espaciador
  del footer con inset inferior; vista crear con inset inferior.
- `views/ProgramEditView.tsx`: ambos headers (`h-14` → `min-h-14 pt-safe`).
- `components/settings/SettingsModal.tsx`: header con
  `pt-[calc(1.25rem+var(--safe-area-top))]` (el contenido ya tenía `pb-24`).
- `components/onboarding/Landing.tsx`: contenedor con inset superior
  (base + `md:`) e inferior en el pie.
- `components/onboarding/SetupWizard.tsx`: header sin el conflicto
  `pt-safe`+`py-4`, footer con inset inferior.
- `views/home/GuidelinesModal.tsx`: header con calc explícito (antes
  `p-4` + `pt-safe` competían por especificidad/orden).
- `views/StatsViewImpl.tsx`: picker de ejercicios (header + lista).
- `components/profile/ProfileSheet.tsx`: sin cambio directo, hereda el fix
  central (usa header por defecto).
- `views/HistoryView.tsx` (toast `bottom-24`) y diálogos centrados
  (`ConfirmModal`, validaciones): verificados, despejan sin cambios.

**Evidencia.** Nuevo `tests/e2e/insetsOverlays.spec.ts` (390x844 y caso
ancho 800x600; inyecta `--safe-area-inset-top:40px` /
`--safe-area-inset-bottom:24px` post-load): 5 tests. Sin el fix
(`git stash` + rebuild, cache `32c3a0c3cf97`) fallan 3 con violaciones
genuinas: selector-header control top 12.5, profile-close top 34.5,
program-back top 17.5 (esperado ≥ 39). Con el fix: 5/5.

## J2. Notificación nativa con cuenta regresiva en vivo

**Java** (`NativeBridgePlugin.java`):

- Canal nuevo `gainslab_rest_timer_live`, `IMPORTANCE_LOW`, sin sonido ni
  vibración ni badge. El canal HIGH `gainslab_rest_timer` sigue intacto
  para la alerta final.
- Notificación id `8813`: `setWhen(endAt)`, `setShowWhen(true)`,
  `setUsesChronometer(true)`, `setChronometerCountDown(true)` (minSdk 24,
  sin guard necesario), `setOngoing(true)`, `setOnlyAlertOnce(true)`,
  categoría `STOPWATCH`, visibilidad pública, `setTimeoutAfter(endAt - now
  + 5000)` con guard API 26+, `contentIntent` reutilizado (PendingIntent
  IMMUTABLE que abre la app). Solo se publica con
  `canPostNotifications()`.
- `scheduleRestTimerInternal` publica/actualiza la viva tras programar la
  alarma (mismo id: +30s/-10s la refrescan). `cancelAlarm()` la cancela.
  `onRestTimerFinished()` la cancela ANTES del chequeo de foreground.

**JS.** `scheduleNativeRestTimer(endAt, title, body, liveTitle?, liveBody?)`
(`utils/audio.ts`); `useTimer.ts` pasa `t.timer.resting` /
`t.timer.restingBody` sin tocar la clave del efecto
(`timer.active, timer.endAt, lang`). Textos en TRANSLATIONS es/en
(`resting`/`restingBody`).

**Tests.** `timerNotifications.test.ts`: aserción de schedule con textos
live + test nuevo de re-schedule al ajustar `endAt` (+30s). La lógica de
decisión (efecto de `useTimer`) queda cubierta por estos tests de
comportamiento real; lo puramente Android se verificó en dispositivo.

**Verificación en dispositivo** (Xiaomi M2101K7AG, Android 11, APK debug
construido con JDK 21, bridge invocado por CDP, oráculo `dumpsys
notification --noredact`):

- Viva publicada: `id=8813`, `channel=gainslab_rest_timer_live`,
  `importance=2` (LOW), `flags=0xa` (ongoing + onlyAlertOnce),
  `category=stopwatch`, `vis=PUBLIC`, `android.chronometerCountDown=true`,
  `android.showChronometer=true`, `android.showWhen=true`,
  `title=LIVE-REST`, `timeout` ≈ endAt+5s, contentIntent startActivity.
- Canal live: `mImportance=2`, `mSound=null`,
  `mVibrationEnabled=false`, `mShowBadge=false`.
- Cancel (`cancelRestTimer`, = saltar): registro 8813 desaparece.
- Fin natural (timer de 8s, equipo en Dozing): 8813 cancelada y alerta
  final `8812` publicada en el canal HIGH con título/cuerpo programados
  (`FIN-SHORT`/`BACK-SHORT`).

**No hecho ahora (idea futura):** botones de acción (+30s / Saltar) en la
notificación y Live Updates de Android 16.

## J3. APK release-test (R8)

Árbol limpio en `797912b`; `npm run build` (cache `00d8093b7015`) +
`npx cap sync android` + `assembleRelease` (JDK 21,
`JAVA_HOME=C:\jdk-21` — con JDK 17 falla `invalid source release: 21`).

Firmado con la MISMA keystore de debug anterior
(`%USERPROFILE%\.android\debug.keystore`, alias `androiddebugkey`): el
certificado SHA-256 `a4a85218…d853512` coincide con el APK release-test de
P7-6, así que `adb install -r` actualiza encima sin desinstalar.

| Artefacto | Ruta absoluta | Tamaño | SHA-256 |
|---|---|---|---|
| release-test (R8) | `C:\Dev\IronLog-React\apk-out\gainslab-release-test.apk` | 13.990.656 B | `2ADB27AD1CFD383494B47201BF401A7BAFE48F6A15B48F51878D10E9C5490C8F` |
| mapping | `C:\Dev\IronLog-React\apk-out\mapping.txt` | 5.479.020 B | `BCBE1E299DEB758F8A601CC4704F2D5685B843523D99A2599B3F55C18858A1F2` |

Común: commit `797912b`, `versionName 4.0.3-kong.6`, `versionCode 414`,
`com.gainslab.pro`, compileSdk 36 / targetSdk 36 / minSdk 24 (vía
`aapt dump badging`). Instalación:
`adb install -r apk-out/gainslab-release-test.apk` (Success sobre datos
existentes). Nada commiteado (ignorado). Instalado y abierto en el Xiaomi:
logcat sin `ClassNotFoundException`, `NoSuchMethodException`,
`Resources$NotFoundException` ni `FATAL` de `com.gainslab.pro` (los FATAL
visibles son `SecurityException WRITE_SETTINGS` de `com.android.shell`,
artefacto del equipo, no de la app).

## Resultado de los 4 comandos (rama final)

- `npm run build`: OK (precache 61: 7 critical + 54 lazy, cache
  `00d8093b7015`).
- `npm run test:run`: **51 archivos / 254 tests**, verde (nota: una corrida
  intermedia reportó "1 error" sin tests fallidos; no reprodujo en las dos
  corridas siguientes).
- `npm run lint:a11y`: 0 errores.
- `npx playwright test`: **25/25** (20 previos + 5 de J1).
- Extra: `npm run validate-android-env` OK (advierte JDK 17 por defecto;
  Gradle se corrió con JDK 21).

Reglas respetadas: sin tocar `programs/`, `syncService`, `syncHelpers`,
`workoutCompletionService`, `firestore.rules`; sin valores de `.env`
impresos ni commiteados; sin dependencias npm nuevas; sin ramas nuevas;
texto visible nuevo solo en TRANSLATIONS (J2); sin ternarios
`lang === 'es'` nuevos; sin binarios commiteados.

## Pendiente de verificar en dispositivo real

1. **Cuenta regresiva viva en lockscreen:** publicada y cancelada OK, pero
   no se observó visualmente el conteo en la pantalla de bloqueo.
2. **Alarma con pantalla bloqueada (J2):** fin con Dozing verificado
   (alerta final OK); falta bloqueo manual + exactitud del instante final.
3. **Edge-to-edge en Android 15/16 real:** lo verificado es API 30 + e2e
   simulado (J1) — falta gesture bar real con `targetSdk 36`.
4. **Gesto Atrás del sistema** desde workout/program/profile en equipo
   desbloqueado.
5. **Emulador API 35/36:** bloqueado (AEHD requiere admin); capturas
   pendientes.
