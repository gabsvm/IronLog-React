# Serie Q — Reporte de seguimiento 9 (Q0–Q22)

Rama: `agent/gainslab-audit-fixes-v3`. Tag de retorno: `pre-q-series` (pusheado a origin).
Sin ramas nuevas, sin GitHub Actions, sin `firebase deploy`, sin binarios commiteados.
Estado persistente: se actualiza y pushea al cerrar CADA tarea.

## Commits

| ID | Commit | Estado |
|----|--------|--------|
| Q0 | `a4de001` | hecho |
| Q1 | `8d398f9` | hecho |
| Q2 | `e87cf66` | hecho |
| Q3 | `b84b403` | hecho |
| Q4 | `5b3fe9b` | hecho |
| Q5 | `ae7f307` | hecho |
| Q6 | `a48cf99` | hecho |
| Q7 | `6d7fc49` | hecho |
| Q8 | `0ca31a1` | hecho |
| Q9 | `6833d94` | hecho |
| Q10 | `40fc801` | hecho |
| Q11 | `268d020` | hecho |
| Q12 | `93ee29b` | hecho |
| Q13 | `e5cf440` | hecho |
| Q14 | `0a8c0c2` | hecho |
| Q15 | `9b0ab48` | hecho |
| Q16 | `e61ea87`, `905a67c` | hecho |
| Q17 | `01a75c2` | hecho |
| Q18 | `f8956b5` | hecho |
| Q19 | `fd5f4f1` | hecho |
| Q20 | `efbe58c` | hecho |
| Q21 | (ver `git log --grep Q21`) | hecho (flag OFF por defecto) |
| Q22 | (ver `git log --grep Q22`) | ver sección Q22 |

## Q0 — Preparación

- Árbol limpio verificado; `git tag pre-q-series && git push origin pre-q-series`.
- Baseline (4 comandos, árbol `2861a69`): `npm run build` OK (61 assets, 7 critical + 54 lazy);
  `npm run test:run` 363/363; `npm run lint:a11y` limpio; `npx playwright test` 40/40.

## Q1 — Infra de integración con emuladores (Auth + Firestore)

- `firebase.json`: emulador de Auth en 127.0.0.1:9099 (libre) junto a Firestore 8085.
- `lib/firebaseLoader.ts`: `shouldUseFirebaseEmulator(env, {isDev, mode})` exportada — activa solo con
  `VITE_FIREBASE_EMULATOR=1` Y (DEV o modo test). Conecta Auth/Firestore a los hosts de
  `VITE_FIREBASE_EMULATOR_AUTH/_FIRESTORE` y usa `memoryLocalCache` (Node sin IndexedDB).
  Sin literales de hosts en el código: si falta el host, warn y sigue a live.
- `vitest.integration.config.ts` (entorno node, `test.env` con flag + hosts + proyecto demo) y
  `npm run test:integration` (`emulators:exec --project demo-q1-integration --only auth,firestore`).
- Tests: `tests/integration/authFirestore.test.ts` (registro real en Auth emulator, write/read
  `users/{uid}` y `data/history` bajo las reglas REALES, otro usuario denegado) y
  `tests/integration/syncRoundTrip.test.ts` (`uploadState` → `downloadState` preserva secciones).
  Stubs: `fake-indexeddb/auto` + `window.dispatchEvent/localStorage` (sin `navigator`: es read-only
  en Node y el nativo ya no tiene serviceWorker).
- Prod-safety: `tests/unit/emulatorProdGuard.test.ts` — 4 casos del gate + scan de `dist/assets/*.js`
  que falla si aparece `127.0.0.1:9099/8085` o `localhost:9099/8085` (requiere `dist/`, skip si falta).
- Evidencia: `test:integration` 5/5 en emuladores. Fail-proof: con el loader en stash, los 2 archivos
  fallan (`beforeAll` → `auth/api-key-not-valid` porque el SDK pega a live con la demo key).
- Gates: build OK, `test:run` 368/368, lint limpio. `.env.example` con las 3 vars nuevas (sin valores).
- No verificado: nada pendiente; emuladores ejecutables en esta máquina (JDK 21 en PATH).

## Q2 — Borrado de cuenta sin listado de colección

- `services/accountDeletion.ts`: eliminado el `getDocs(users/{uid}/data)` + batch (denegado por las
  reglas endurecidas, que solo permiten leer `data/history` por path). Ahora borra directo
  `data/history` y luego `users/{uid}` con `deleteDoc`; `subscription` no se toca porque nunca se
  referencia. Interfaz `AccountDeletionFirebase` reducida a `doc`/`deleteDoc`. Orden intacto:
  reauth → datos → users/{uid} → deleteUser → (limpieza local + logout en AuthContext, sin cambios).
- Unit `tests/unit/accountDeletion.test.ts` actualizado: secuencia exacta con los 2 deletes directos,
  `subscription` ausente del trace, wipe roto ⇒ no `deleteUser`, wrong-password/recent-login/offline
  intactos.
- Integración `tests/integration/accountDeletion.test.ts` (flujo REAL contra emuladores): borrado
  completo deja sin users/{uid}, sin history, sin usuario Auth y con `subscription` intacta
  (sembrada/leída por contexto admin rules-disabled); contraseña incorrecta no borra nada; reintento
  tras wipe parcial es idempotente.
- Reglas: nuevo caso 12 — el dueño NO puede listar `users/{uid}/data` (comportamiento esperado
  documentado en el test); el borrado directo de history sigue permitido (caso existente).
- Evidencia: `test:integration` 8/8, `test:rules` 12/12. Fail-proof: con el servicio viejo en stash,
  integración da 2 failed (el `getDocs` es denegado por las reglas reales).
- Gates: build OK, `test:run` 368/368, lint limpio.
- No verificado: borrado con cuenta real en producción (manual del dueño, pendiente).

## Q3 — Reglas: validar solo lo que cambia en update

- `firestore.rules`: `allow create` mantiene `keys().hasOnly(userAllowedKeys())` sobre el documento
  final; nuevo `allow update: if isOwner(uid) && userUpdateOk()` donde `userUpdateOk()` valida
  `diff(resource.data).affectedKeys().hasOnly(...)` y los tipos/caps solo sobre claves afectadas
  (claves borradas pasan). `userAllowedKeys()` extraída como función compartida.
- Nuevo caso de reglas: doc existente con campos heredados (`legacyField`, `legacyCount`, creado con
  reglas deshabilitadas) acepta updates de claves permitidas, rechaza tocar el campo heredado,
  rechaza claves nuevas y tipos inválidos/caps excedidos, y conserva el legado intacto.
- `docs/FIREBASE_MANUAL_STEPS.md` §3: paso previo de comparar claves reales de `users/{uid}` con la
  lista permitida antes de desplegar. Reglas NO desplegadas.
- Evidencia: `test:rules` 13/13 (12 previos + Q3). Fail-proof: con reglas viejas en stash, el caso Q3
  falla y los otros 12 pasan. Rescate intermedio: el rewrite había borrado los `match /global_*`
  (1 fail) — restaurados y verificado por diff que no falta ningún bloque.
- Gates: build OK, `test:run` 368/368, lint limpio.
- No verificado: despliegue en producción (manual del dueño).

## Q4 — Un solo inicializador de Firebase, fuera del camino crítico

- `lib/firebase.ts` eliminado (`git rm`): cero importadores en el código — todo ya usaba
  `lib/firebaseLoader.ts`. Sin re-export (sin razón para conservarlo).
- Caché: `selectFirestoreCacheKind({useEmulator, isNativePlatform})` exportada y pura — web
  persistente multi-tab, nativo memoria (la app persiste su estado y cola offline en su propia
  capa; decisión heredada documentada), emulador/test memoria. Sin evidencia de rotura de cola
  offline o borrado (integración 8/8 lo cubre).
- Causa raíz del firebase crítico: NO era un import estático en código (verificado con probe de
  Rollup: cero static importers) sino los helpers tslib (`__assign/__rest/__spreadArray`), que
  Rollup metía dentro de `vendor-firebase-auth` y el entry importaba estáticamente (muerto para
  el resto del chunk). Fix: chunk propio `vendor-tslib` (772 B) en `manualChunks`.
- Antes/después (build real): precache 7 critical + 54 lazy → 5 critical + 57 lazy; los 5 chunks
  `vendor-firebase-*` pasan a LAZY; entry 312.103 B → 312.294 B (+191 B, despreciable).
- Tests `tests/unit/firebaseInit.test.ts` (4): casos del selector de caché; `lib/firebase.ts`
  ausente + loader sin imports estáticos de firebase (solo `import type` + dinámicos); fixture del
  `splitCriticalLazy` real (estático→critical, dinámico→lazy); scan del `dist/` real que falla si
  algún `vendor-firebase-*` queda crítico.
- Evidencia: `test:run` 372/372, `test:integration` 8/8, Playwright 40/40
  (en puerto 5199 aislado: el 5173 lo ocupa otro proyecto de la máquina y `reuseExistingServer`
  enganchaba esa app; proceso ajeno no tocado). Fail-proof: sin la regla tslib (stash + rebuild),
  el test de dist real falla (1 failed); con ella, 4/4.
- No verificado: nada; comportamiento nativo/memoria cubierto por tests de decisión + integración.

## Q5 — Registro local de errores

- `utils/errorLog.ts` (nuevo): buffer circular de 50 en IndexedDB (`il_error_log_v1`, via `utils/db`)
  con ts, mensaje, stack ≤ 2 KB, origen (boundary / window.onerror / unhandledrejection / chunk),
  vista (de `history.state`), versión (`APP_VERSION`) y plataforma. Redacción: emails → `[email]`,
  `password/token/...=` → `[redacted]`. Escrituras serializadas con promise chain (un test expuso
  lost-update en ráfagas). Todo best-effort: jamás lanza.
- Captura: `ErrorBoundary.componentDidCatch` (index.tsx, incluye componentStack),
  `LazyViewBoundary` (chunk vs boundary según `isChunkLoadError`), y
  `registerGlobalErrorListeners()` tras el montaje con `addEventListener` (convive con el
  `window.onerror` del overlay de arranque de index.html; ignora ruido ResizeObserver/Script error).
- UI: `components/profile/ErrorLogCard.tsx` montado en Avanzado (cuenta, Copiar diagnóstico con
  fallback execCommand, Borrar). `buildDiagnosticsText`: versión, sync, últimos 10 errores.
  Textos `you.errorLog*` es/en.
- Tests (12): tope 50 + descarte del más viejo, concurrencia sin pérdidas, truncado, redacción,
  metadata, never-throw con IDB roto, clear, blob de diagnóstico, listeners globales (captura +
  unregister), card RTL (cuenta/copiar/borrar), boundary→log con source chunk.
- Evidencia: `test:run` 384/384, build OK, lint limpio. Fail-proof: sin el wiring en
  LazyViewBoundary (stash), el test de captura falla. Incidencia: una edición con PowerShell
  corrompió ProfileSheet (BOM + mojibake) — restaurado por git y rehecho con Node UTF-8, diff final
  mínimo (+2 líneas).
- No verificado: captura en dispositivo real con errores nativos (solo web/jsdom).

## Q6 — Respaldos automáticos, recordatorio y almacenamiento persistente

- `services/autoBackup.ts` (nuevo): `ensureStoragePersisted`/`getStoragePersistStatus` (on/off/
  unsupported, never-throw); `maybeCreateAutoBackup` (máx 1/24 h, rota últimos 3 en
  `il_auto_backup_v1` con `createBackupEnvelope`); `restoreAutoBackup` (valida + restaura con el
  servicio existente); `exportCurrentBackup` (Web Share con archivo si `canShare`, si no descarga;
  sella `il_last_backup_at`); `shouldShowBackupReminder` pura (export ≥ 14 d o nunca + sesiones
  posteriores + no descartado después).
- App.tsx: `handleExport` delega al export compartido; `onFinish` dispara `maybeCreateAutoBackup`
  fire-and-forget con los logs frescos (sin tocar workoutCompletionService).
- UI: `StoragePersistRow` (Avanzado/diagnóstico), `AutoBackupList` (Datos: fechas + Restaurar con
  ConfirmModal propio + reload), `BackupReminderBanner` (top de Home, autocontenido: exporta con el
  estado de useApp/store, descarta con sello). Textos `you.*` es/en.
- Fix real expuesto por e2e: los botones dentro del `<details>` cerrado conservan cajas fantasma en
  Chromium (content-visibility interno) y rompían insetsOverlays ("profile sheet", control 29).
  Regla global en index.css `details:not([open]) > :not(summary) { display: none; }` (visual idéntica,
  sin condicionales que romperían el test de inventario). Spec regenera `after.json` (incluye
  etiquetas Q5+Q6).
- Tests (23): throttle 24 h, rotación 3, restauración ida-vuelta, regla del recordatorio (6 casos),
  share/descarga/fallback-cancel, persist on/off/unsupported, RTL de las 3 UI (lista+confirm+cancel,
  activar, banner visible/oculto/exportar/descartar).
- Evidencia: `test:run` 407/407, build OK, lint limpio, Playwright 40/40 (puerto 5199 aislado).
  Fail-proof: sin el módulo (movido aside) los tests no colectan (dependencia real); módulo nuevo,
  comportamientos con aserciones exactas.
- No verificado: Web Share real en Android (solo mocks + descarga); persistencia efectiva en
  dispositivo.

## Q7 — Admin por claim

- `constants/admin.ts` (nuevo): `ADMIN_EMAIL` único + `isAdminIdentity({adminClaim, email,
  emailVerified})` pura, idéntica a la regla `isAdmin()` de firestore.rules.
- `AuthContext` expone `isAdmin`: resuelto en `onAuthStateChanged` vía
  `user.getIdTokenResult()` (claim `admin` + email/verificación), `false` si falla o sin usuario;
  `login` fuerza `getIdToken(true)`; `logout`/`deleteAccount`/invitado lo limpian.
- `ProfileSheet` usa `isAdmin` del contexto; eliminada la comparación fija (era la única en el
  cliente; `AdminControlPanel` solo recibe el email como dato de auditoría). Verificado por grep:
  `gabsvm` solo vive en `constants/admin.ts` (+ reglas y tests).
- Mocks de `useAuth` en unifiedSheet/deleteAccountSheet/lazySheets agregan `isAdmin` (unifiedSheet
  lo maneja por estado; el caso admin lo activa explícitamente).
- Tests `tests/unit/adminClaim.test.tsx` (6): regla pura (5 combos incl. claim verdadero con email
  no verificado) + provider real con 4 identidades (claim / email verificado / email sin verificar
  / común) + refresh forzado en login.
- Evidencia: `test:run` 413/413, build OK, lint limpio. Fail-proof: sin el cambio en AuthContext
  (stash), 5/6 fallan (solo pasa la regla pura).
- No verificado: claim real fijado por el dueño en producción (manual pendiente).

## Q8 — Permiso de alarmas exactas (Android 14+)

- Java (`NativeBridgePlugin`): `canScheduleExactAlarms()` → `{granted, sdkInt}` (true si API < 31,
  si no `AlarmManager.canScheduleExactAlarms()`); `openExactAlarmSettings()` →
  `ACTION_REQUEST_SCHEDULE_EXACT_ALARM` con URI del paquete + fallback a detalles de la app.
  Sin cambios de manifiesto (SCHEDULE_EXACT_ALARM ya declarado; sin USE_EXACT_ALARM).
- `utils/audio.ts`: `getExactAlarmState()` (null fuera de Android nativo, never-throw, valida forma),
  `openExactAlarmSettings()`, y regla pura `shouldShowExactAlarmNotice` (nativo + android + API ≥ 31
  + no concedido + no mostrado).
- UI: `ExactAlarmRow` en Entrenamiento (solo Android API ≥ 31; estado + Activar; refresca con
  visibilitychange/focus al volver de Ajustes) y aviso único en `RestTimerOverlay` tras el primer
  descanso natural (`ironlog:rest-completed`, flag `il_exact_alarm_noticed`, auto-cierre 10 s,
  gemelo nativo del prompt web — nunca co-muestran). Textos `you.exactAlarm*` + `exactAlarmNotice*`
  es/en.
- Tests (14): wrappers con puente simulado (web/ios null, android passthrough, errores/malformados,
  open noop en web), regla pura (6 combos), fila (oculta/estados/enable/refresh), overlay real (una
  sola vez + flag, descartar sin rearmar, oculta con grant/API vieja).
- Evidencia: `assembleDebug` BUILD SUCCESSFUL; `test:run` 427/427; build OK; lint limpio.
  Fail-proof: sin el wiring del overlay (stash), 2/3 del notice fallan. Nota: 1 de 3 corridas
  completas reportó "2 errors" transitorios con exit 0 y 427/427 (ruido paralelo; archivos Q8
  limpios en 2/2 aisladas).
- No verificado: pantalla real de "Alarmas y recordatorios" y toggle en dispositivo (sin dispositivo).

## Q9 — Acciones +30 s / Saltar en la notificación del descanso

- Nativo: `RestTimerActionReceiver` nuevo (intents explícitos, `exported=false`, sin trampolín —
  hace el trabajo directo). La notificación viva suma 2 acciones IMMUTABLE (+30 s / Saltar, textos
  en values + values-es nuevo). Al programar se persiste endAt + textos + se abre un stream por
  descanso (epoch++, `next_command_id=1`, limpia `rest_cmd_*` viejos). +30 s: endAt+30 s nativo,
  reprograma la alarma (código extraído a `programAlarm`, idéntico al path plugin) y refresca la
  viva; tap vencido cancela sin comando. Skip: cancela todo. Cada acción agrega comando secuencial
  `id:action:endAt` en prefs + `notifyListeners("restTimerCommand")` best-effort vía WeakReference
  al plugin vivo. `consumePendingTimerCommands()` drena ordenado por id y borra solo lo leído.
- JS: `TimerCommand{Stream,Payload}` + `consumePendingTimerCommands`/`subscribeTimerCommands` en
  audio.ts (validados, noop en web). `applyTimerCommands(cmds, epoch, set)` en useTimer: cursor
  `{epoch,lastId}` en localStorage (epoch nueva lo resetea), ordena por id, idempotente; add30 adopta
  endAt nativo (+30 duración, ignora si inactivo), skip espeja la píldora. Efecto en useTimer: drena
  al montar y al volver (visibility/focus) + eventos en vivo.
- Tests (11): apply (add30/skip/inactivo/fuera de orden/epoch/malformados/idempotencia + cursor),
  wrappers (web null, passthrough, malformados, unsubscribe), hook real (drain al montar, re-drain
  al foreground, nada en web).
- Evidencia: `assembleDebug` OK; receiver en manifiesto fusionado (aapt: enabled, exported=0, sin
  filter); `test:run` 438/438; build; lint. Fail-proof: sin useTimer (stash) 8/11 fallan. Incidencia:
  timerNotifications mockeaba audio sin los exports nuevos (3 fails en suite completa) — mock
  extendido con defaults idle, aserciones intactas.
- Android 16 Live Updates: NO implementado (idea documentada). Motivo: ProgressStyle/ongoing
  promovido exige ramas solo-API-36 + verificación visual real; sin dispositivo, enviar esas llamadas
  a ciegas arriesga notificaciones rotas en Android 16.
- No verificado: taps reales en la notificación, reprogramación nativa y eventos en vivo en
  dispositivo (sin dispositivo).

## Q10 — android:allowBackup=false

- Manifiesto: `android:allowBackup="false"` en `<application>` con comentario de decisión y
  reversión (volver a `true`; API 31+ evaluaría `dataExtractionRules`, pre-31 `fullBackupContent`).
  Motivo: restaurar un snapshot del WebView en otro teléfono es impredecible; la copia es explícita
  (snapshots + export Q6) y nube (Pro).
- Lint (`:app:lintDebug`) BUILD SUCCESSFUL sin findings AllowBackup/DataExtraction/FullBackupContent:
  no exige reglas vacías. Incidencias resueltas: mi primer comentario rompía el XML (dentro del tag)
  y values-es de Q9 disparaba 4 MissingTranslation (agregados app_name/title/package/scheme en es).
- Tests `tests/unit/androidManifest.test.ts` (2): fuente con `allowBackup="false"` + manifiesto
  fusionado vía aapt (`0x0`) cuando hay APK y SDK (skipIf si no).
- Evidencia: aapt merged `A: android:allowBackup(0x01010280)=(type 0x12)0x0`; `test:run` 440/440;
  build; lint limpio. Fail-proof: con manifiesto viejo en stash, el test de fuente falla (el de aapt
  valida el artefacto ya compilado, como corresponde).
- No verificado: comportamiento de restauración en dispositivo real (solo manifiesto + lint).

## Q11 — Unidades kg/lb de punta a punta

- Principio: lo guardado SIEMPRE es kg canónico; la unidad solo cambia presentación y entrada.
  Cambiar de unidad no reescribe ningún dato (verificado por e2e contra IndexedDB).
- Nuevo `utils/units.ts` (puro): `KG_PER_LB` exacto, `toDisplay` (0.1), `fromDisplay` (4
  decimales, identidad total en kg para no alterar commits), `formatWeight` (coma en es, punto
  en en, sin agrupar — misma convención que `formatSets` de M2), `PROGRESSION_STEP` 2.5/5,
  `roundToPlates` (totales 2.5 kg / 5 lb), `platesFor`, `unitLabel` (KG/LBS), `resolveWeightUnit`.
- `plateMath`: juego lb 45/35/25/10/5/2.5 + barra 45 por defecto en lb; firma kg idéntica.
- Preferencia `weightUnit` en config: átomo `il_cfg_weight_unit` ('kg'), `setConfig`, dirty
  tracking, subida (2 payloads) y bajada (2 ramas, solo acepta kg/lb). Reglas: sin cambios
  (config se valida como `map`).
- Selector en ProfileSheet → Entrenamiento (segmentado KG/LBS, `you.weightUnit` es/en).
- Conectados: SetRow (inputs/previos/hints/placeholders + guardia de cambio de unidad con
  flush bajo la unidad vieja y skip del blur posterior), tarjetas (header, historicalBest,
  overload `+2,5 kg / +5 lb`), rest `resolveRestNextAction` (4.º parámetro), ProgressChart
  (etiqueta + dataset + tooltips), PRs/e1RM, rationale y volumen de Stats, resumen de sesión,
  History (cards + detalle), WeeklyRecapCard (prop; hoy no se renderiza en ningún lado —
  import muerto en HomeViewImpl, queda para Q16), BodyTab, LogWeightModal, GoalSetupModal
  (TDEE siempre en kg), BodyMetricsModal (prop `unit`), WarmupModal (prop `unit`, no contexto).
- Notas: decimales en es ahora usan coma vía `formatWeight` (precedente M2); enteros y rutas
  golden byte-idénticos. CSV de History queda en kg canónico con su header `Weight(kg)`:
  Q12 es dueño de las unidades en CSV. Archivos CRLF normalizados a LF al editar (diff limpio).
- Tests: `units` (10, incl. 135 lb ↔ kg y 100 idas y vueltas sin deriva), `plateMath` (3),
  `setRowUnits` (4: golden kg, lb commit 63.5029, guardia de cambio, vacío), `statsUnits` (3:
  PRs 220.5/257 lbs, chart `Est. 1RM (lbs)|257.2,264.6`, golden kg), `restNextActionUnits` (2).
  E2E `weightUnits.spec.ts`: selector → LBS → tarjeta/input en lb → tipeo 135 → IndexedDB
  guarda 61.235 → vuelta a KG muestra 61.235.
- Fail-proof: con sources en stash, fallan plateMath(2)/setRow(2)/restAction(1)/stats(2) lb;
  `units.test.ts` falló antes de existir el módulo (TDD). Goldens kg pasan en ambos árboles.
- Evidencia: build OK (entry 324.37 kB / gzip 102.81), `test:run` 462/462 (93 ficheros),
  `lint:a11y` limpio, Playwright 41/41 en puerto aislado 5199 (5173 lo ocupa otro proyecto).
- WarmupModal recibe `unit` por prop desde WorkoutViewImpl (evita romper `warmupEligibility`).
- No verificado: uso real con discos lb en gimnasio; validación visual del selector en el APK.

## Q12 — Importar / exportar CSV

- Nuevo `utils/csv.ts`: parser RFC 4180 propio (comillas, comas, multilínea, CRLF, BOM) +
  escritor con comillas mínimas.
- Nuevo `services/trainingCsv.ts`: detección Hevy/Strong por encabezados documentados;
  parseo a sesiones (tipos warmup/drop, RPE, notas, pesos a kg canónicos — Hevy trae
  weight_kg/weight_lbs, Strong usa la unidad que el usuario confirma en la UI); matching por
  nombre normalizado (insensible a mayúsculas/acentos, en+es); `buildImportLogs` con mesoId
  reservado -100 (fuera de "Este plan", dentro de "Todo el historial"), sets completados,
  `importKey` (`fuente:inicio:título:ExxS`) e `importedFrom` (campos nuevos en `Log`, tolerados
  por backup/sync/reglas que no recortan campos); idempotencia por clave (IndexedDB
  `il_csv_import_keys_v1` + claves en los logs); export `buildTrainingCsv` (una fila por serie
  completada, header `Weight(kg|lb)` con la unidad elegida, decimales con punto, fecha en-CA).
- Columna RIR del export: lleva el campo `rpe` tal cual (misma etiqueta que la UI del workout,
  que rotula RIR el input de esfuerzo). Decisión documentada.
- UI: botones Exportar/Importar CSV en Datos (ProfileSheet) + `CsvImportSheet` (resumen:
  formato, sesiones, series, rango, nuevas, ya-importadas, filas omitidas; auto-mapeados solo
  lectura; no reconocidos con Crear-nuevo+músculo o Mapear-a-existente; selector de unidad
  para Strong con re-parseo). Import deshabilitado hasta mapear todo. Textos `t.csv` es/en.
- `utils/shareFile.ts` extraído de `services/autoBackup.ts` (mismo comportamiento, tests Q6
  verdes) y reutilizado por el export CSV. El export CSV no estampa `il_last_backup_at`
  (es parcial; el recordatorio Q6 sigue pidiendo el backup completo). El exportador viejo de
  History queda en kg canónico (declarado en su header).
- Strong sin columna de unidad: la UI pregunta la unidad del archivo (defecto = unidad actual).
- Fixtures sintéticos `tests/e2e/fixtures/hevy-sample.csv` + `strong-sample.csv` según los
  encabezados documentados. PENDIENTE: validar con un export real del dueño (formatos reales
  pueden traer columnas extra o fechas distintas; el parser ignora columnas desconocidas y
  omite filas con fecha inválida contándolas).
- Tests: `csv` (5), `trainingCsv` (14: detección, Hevy kg/lb, Strong kg/lb, filas malas,
  normalización, matching en+es, build mesoId/key/errores, split fresh, store de claves,
  export kg/lb con escaping y filtros), `csvImportSheet` (5: preview, validación+mapping
  create/existing, toggle Strong, nothing-new). E2E `trainingCsv.spec.ts`: import Hevy con
  mapeo → aparece en History → reimport idempotente → import Strong en lb con mapeo →
  export descarga CSV con header/unidad y 61.235. Fixtures se re-fechan en runtime (cuentas
  gratis solo ven 7 días de History).
- Fail-proof: `csv.test.ts` falló antes del módulo (TDD); sin el cableado (stash+build) el
  e2e falla (no existe el input CSV); con el fix, todo verde.
- Evidencia: build OK, `test:run` 486/486 (96 ficheros), `lint:a11y` limpio, Playwright 42/42
  en puerto aislado 5199.
- No verificado: exports reales de Hevy/Strong del dueño; Web Share del CSV en dispositivo.

## Q13 — Recordatorios de entrenamiento (nativo Android)

- JS `utils/reminders.ts`: config local `il_cfg_reminders_v1` (nunca se sincroniza: las
  alarmas son por dispositivo), `computeNextReminder` (estrictamente futuro, hora local,
  barrido hoy+7), marcador `il_trained_day_v1` con fecha local (nunca UTC), `syncReminderSchedule`
  y `notifyWorkoutDone` (solo hablan al bridge en Android nativo; best-effort con catch).
- UI: `ReminderSettingsRow` (toggle + 7 chips Lun–Dom + `<input type="time">`, textos
  `t.reminders` es/en) en ProfileSheet → Entrenamiento, solo Android nativo (oculto en
  web/PWA). Icono `Bell` agregado al mapa (import estático).
- `App.tsx` onFinish llama `notifyWorkoutDone()` (junto al snapshot Q6): estampa el día
  local y avisa al bridge.
- Nativo: `schedule/cancelWorkoutReminder` + `markWorkoutDone` en NativeBridgePlugin;
  cómputo del próximo disparo en Java (espejo del JS, días getDay→Calendar); alarma con
  `setAndAllowWhileIdle` (inexacta a propósito, sin permiso de alarma exacta);
  `WorkoutReminderReceiver` (no exportado) re-encadena PRIMERO y luego notifica salvo día
  entrenado; canal propio `gainslab_workout_reminder` IMPORTANCE_DEFAULT; tap abre la app
  (contentIntent existente); `WorkoutReminderBootReceiver` (exportado, BOOT_COMPLETED) +
  permiso RECEIVE_BOOT_COMPLETED (normal). Textos del canal/notificación en values y values-es.
- Tests: `reminders` (8: cálculo hoy/pasado/wrap/exacto-nulo/días inválidos, fecha local,
  persistencia+fallback, sync nativo/web, marker+bridge), `reminderSettingsRow` (4: toggle,
  chips por getDay, hora, en). E2E: `finishFlow` ahora exige `il_trained_day_v1` == hoy local
  tras terminar.
- Fail-proof: `reminders.test.ts` falló antes del módulo (TDD); sin la llamada en App.tsx
  (stash) el test de finish falla en el marcador; con ella pasa.
- Evidencia: `assembleDebug` + `:app:lintDebug` BUILD SUCCESSFUL (solo 2 warnings InlinedApi
  preexistentes de Q8/Q9); aapt confirma receivers (Reminder exported=0x0, Boot
  exported=true), intent-filter BOOT_COMPLETED y permiso RECEIVE_BOOT_COMPLETED.
  `assembleRelease` no corre sin las vars de firma (tema de Q22, no del código).
  Web: build OK, `test:run` 498/498 (98 ficheros), `lint:a11y` limpio, Playwright 42/42.
- No verificado: disparo real, skip por día entrenado, reboot y tap en dispositivo
  (`adb devices` vacío).

## Q14 — Biblioteca de ejercicios (búsqueda + fusión sin reescribir)

- `types.ts`: `aliases?: string[]` y `mergedInto?: string` en `ExerciseDef`.
- Nuevo `constants/exerciseAliases.ts`: mapa curado en↔es (banca, sentadilla,
  peso muerto, remo, militar, curl, fondos, dominadas, extensiones, hip thrust…).
- Nuevo `utils/exerciseLibrary.ts` (puro): `normalizeExerciseName` (minúsculas,
  sin acentos, sin puntuación), `exerciseSearchNames` (nombre en+es + alias
  propios + curados), `matchesExerciseQuery`, `resolveExerciseId` (cadenas +
  guardia de ciclos), `exerciseIdGroup` (canónico primero), `isSelectorVisible`,
  `mergeExercises` (rechaza self/desconocido/ciclos, apunta al canónico),
  `unmergeExercise`, `suggestDuplicatePairs` (mismo nombre > alias compartido,
  built-in como destino) y `aggregateExerciseFrequency`.
- Lecturas fusionadas (nunca se reescriben logs): `getLastLogForExercise`
  (+SessionBuilder, Workout add/replace) acepta biblioteca y matchea el grupo;
  `exerciseHistoryIndex` canonicaliza con firma de merges en la clave de caché
  (+tarjeta workout vía prop `library`, +detección de PRs); worker
  CALCULATE_CHART acepta `string | string[]` (best-of global, sumas agregadas);
  Stats PRs/insight/picker/conteos usan el grupo (PR usa el nombre del
  sobreviviente solo si hubo remapeo); ExerciseDetailModal pasa el grupo;
  `matchParsedExerciseNames` usa nombres+alias compartidos (re-exporta el
  normalize para no romper imports).
- UI: ExerciseSelector y ExercisesView buscan en ambos idiomas + alias;
  fusionados ocultos en selector y en map-to de CSV; ExercisesView muestra
  badge "Fusionado", botón fusionar/desfusionar por fila, tira de sugerencias
  (máx 3, un tap → confirmación) y confirmación con `t.merge` es/en;
  merge/unmerge invalidan el caché de charts (`invalidateChartCache` nuevo).
- Reglas: `exercises` se valida como `is list` (create y update) → los campos
  nuevos pasan; sync sube/baja `exercises` wholesale → no se pierden.
- Prop `library` (no `useApp`) en SortableExerciseCard: el primer intento con
  contexto rompía el aislamiento de renders R1 (2 fallos); con prop, verde.
- Barrido de lectores por id: recommendationEngine solo recomienda desde el
  perfil; el resto son lookups de definición o de sesión, no de historial.
- Tests: `exerciseLibrary` (12: normalización, ambos idiomas, alias, cadenas,
  grupos, merge/unmerge, sugerencias, canónico primero, agregación,
  visibilidad), `exerciseMergeReads` (7: last-log, índice+recaché, best-1RM,
  matching alias, worker grupo+single+volumen, invalidación),
  `statsMerge` (2: agregado bajo sobreviviente 700 kg/1 opción/PR única vs
  legado 400 kg/2 opciones/2 PRs), `exercisesMergeUI` (4: flujo merge,
  unmerge, sugerencias, búsqueda). Total suite 523/523 (102 ficheros).
- Fail-proof: con sources en stash, 13/13 tests de comportamiento nuevos
  fallan (7 mergeReads + 2 statsMerge + 4 mergeUI); `exerciseLibrary` falló
  antes de existir el módulo (TDD).
- Evidencia: build OK, `test:run` 523/523, `lint:a11y` limpio, Playwright
  42/42 en puerto aislado 5199 (5173 lo ocupa otro proyecto y
  `reuseExistingServer` testeaba la app ajena: 42/42 rojos ahí).
- Nota: `statsMerge` necesitó `waitFor` en el conteo del picker (el efecto de
  overview re-corre al fijar selección y parpadea `t.loading` bajo carga).
- No verificado: UX real de fusión con biblioteca grande del dueño; nombres
  de alias regionales fuera del mapa curado.

## Q15 — Progresión y reporte semanal

- Aclaración de premisa: `utils/recommendationEngine.ts` es un recomendador de
  PROGRAMAS (plantilla según días/objetivo/tiempo), no de progresión por
  ejercicio. Se mantuvo intacto (goldens nuevos) y se extendió el módulo con
  la progresión; la regla real estaba inline en `SortableExerciseCardImpl`
  (`overloadSuggest`: up-or-nothing con `parseInt` del rango).
- Nuevo `recommendProgression` (puro, en recommendationEngine): tabla
  up/hold/down sobre las series de trabajo de la última sesión. Up = todo en
  el tope del rango con RIR ≤ objetivo (dato del campo `rpe`, que la app
  rotula RIR; sin RIR vale solo reps, como antes); down = todo bajo el piso
  (−5 %); hold = resto (+1 rep). Nulos legacy intactos (vacío, incompletas,
  peso 0, reps inválidas, sin rango → step). Paso por unidad Q11 (2,5 kg/5 lb).
- `formatProgressionReason` + `t.progression` es/en: "Llegaste a 12 reps con
  RIR 2: +2,5 kg" (coma localizada), hold/down en ambos idiomas. El hero de la
  tarjeta ahora muestra el motivo con icono/tono por acción (reemplaza el
  ternario `lang==='es'` viejo). Rango vía `parseTargetReps` ("8-12"→tope 12;
  antes `parseInt` usaba 8 como objetivo único).
- Nuevo `utils/weeklyReport.ts` (puro): `buildWeeklyReport` (coordenadas
  meso/semana, alcance plan; sesiones hechas/planificadas, series por músculo
  con zonas MV/MEV/MAV/MRV — mismos umbrales que `getVolumeZone` —, cambio %
  vs semana previa, bajo MEV / sobre MRV, descarga por semana final o
  tendencia de feedback desfavorable: ≥2 ajustes negativos o performance
  promedio ≤2; nunca si ya hay descarga; CARDIO y saltados fuera) y
  `filterWeekPRs` (PRs con fecha dentro del rango logueado de la semana).
- UI: `WeeklyReportCard` arriba de Stats → Resumen (solo con meso activo):
  3 métricas, filas por músculo con badge de zona, líneas bajo/sobre,
  banner de descarga, estado vacío. Nombres de músculo con sets en el mismo
  nodo ("Espalda 4") para no romper los `getByText` exactos existentes; stat
  boxes con flex (el e2e del heatmap cuenta `div.grid-cols-3`).
- Tests: `progression` (19: 7 goldens recommendProgram + 8 tabla + 4 formato),
  `weeklyReport` (10: conteos/zonas/%/MRV/ignorados/sin baseline/descarga
  final/feedback/ya-descargando/vacío + 2 PRs), `progressionUI` (4: líneas
  up/hold/down + nulo legacy), `weeklyReportUI` (3: tarjeta/descarga/vacío).
  Suite 559/559 (106 ficheros), aserciones existentes intactas.
- Fail-proof: sin el fix (stash) fallan 18 (12 progression + 3 progressionUI
  + 3 weeklyReportUI); el nulo legacy pasa en ambos (diseñado así);
  `weeklyReport` falló antes del módulo (TDD).
- Incidentes: statsScopeControl rompió 2 veces por duplicación de textos
  (spans de músculo, luego nodo directo en línea Bajo MEV) — resuelto del
  lado del componente; heatmapGrid e2e rompió por `grid-cols-3` — flex.
- Evidencia: build OK, `test:run` 559/559, `lint:a11y` limpio, Playwright
  42/42 en puerto aislado 5199.
- No verificado: RIR objetivo distinto de 2 en uso real; feedback con keys
  numéricas vs string en datos viejos (el código acepta ambas).

## Q16 — Home (resumen semanal, última sesión, racha)

- Nuevo `utils/homeSummary.ts` (puro): `weekProgress` (días distintos
  entrenados vs planificados; reentrenar un día no infla), `lastSessionSummary`
  (fecha, duración, volumen con `getSetLoadVolume`, PRs con la regla del
  recap: >1 % sobre el mejor e1RM previo, una vez por ejercicio, sin contar
  estrenos) y `streakWeeks` (semanas completas consecutivas; la semana actual
  en curso no la rompe: se cuenta desde la última completa hacia atrás).
- Nuevo `views/home/HomeRecapStrip.tsx` bajo la hero card: "Esta semana" con
  done/planned + barra, racha con llama, última sesión (fecha local, duración,
  volumen localizado, chip ×PRs) y estado vacío amistoso. Textos
  `t.homeRecap` es/en. Compacto (una tarjeta, sin scroll extra).
- `WeeklyRecapCard` (import muerto desde Q11, "Last 7 Days" por calendario)
  eliminado: el strip lo reemplaza con semántica del plan. `ActivityHeatmap`
  sigue importado sin renderizar (fuera de alcance, no se tocó).
- Etiqueta "Saltar sesión" (K8) intacta y verificada en el e2e.
- Tests: `homeSummary` (10: conteos, última sesión/volumen/PRs/estrenos,
  racha completa/en curso/cortada/nuevo meso), `homeRecapStrip` (3: tarjeta,
  vacío, en), e2e `homeRecap.spec.ts` (strip bajo la hero con seeds, skip
  con aria-label, sin ErrorBoundary). Suite 572/572 (108 ficheros).
- Fail-proof: `homeSummary` falló antes del módulo (TDD); sin el cableado
  (stash+build) el e2e falla en `toBeVisible`; con él pasa.
- Evidencia: build OK, `test:run` 572/572, `lint:a11y` limpio, Playwright
  43/43 en puerto aislado 5199.
- No verificado: formato de fecha/volumen en locales distintos de es-AR.

## Q17 — Widget Android "Iniciar entreno"

- Nativo: `StartWorkoutWidgetProvider` (AppWidgetProvider) + layout
  `widget_start_workout` (RemoteViews-safe) + fondo + `widget_start_workout_info`
  (2×1, sin updates periódicos) + strings es/en (título, tap, descripción).
  Registrado en el manifiesto (exported=true + APPWIDGET_UPDATE + meta-data,
  como exige el sistema). Tap = PendingIntent IMMUTABLE explícito a
  MainActivity con extra `start` (sin trampolines).
- `MainActivity`: captura el extra en onCreate (frío) y onNewIntent
  (singleTask en caliente); `consumeLaunchAction()` lo entrega una sola vez.
- Plugin: `getLaunchAction` ("" si no hay nada pendiente) y
  `updateWidgetData({title})` (guarda en prefs + refresca widgets).
- JS: `useWidgetLaunchAction(enabled, onStart)` (montaje + visibilitychange);
  `runStartAction` extraído del efecto del atajo PWA a `useCallback`
  compartido (mismo flujo resume/meso/quick-start, sin cambios); Home publica
  el nombre del próximo día vía `updateWidgetData` (no-op en web).
- Tests: `widgetBridge` (4: web nulo, consumo único, payloads malos,
  título) y `widgetLaunchAction` (3: frío corre una vez, caliente en resume,
  hidden/desconocido/deshabilitado ignorados). Suite 579/579 (110 ficheros).
- Fail-proof: sin el código (stash) los tests nuevos fallan
  (`getNativeLaunchAction is not a function`).
- Evidencia: `assembleDebug` + `:app:lintDebug` BUILD SUCCESSFUL con JDK 21
  (el JDK por defecto falla con `invalid source release: 21`); solo los 2
  warnings InlinedApi preexistentes; aapt confirma receiver exported=true,
  intent-filter APPWIDGET_UPDATE y meta-data del provider. Web: build OK,
  `test:run` 579/579, `lint:a11y` limpio, Playwright 43/43 (puerto 5199).
- No verificado: tap real, instalación del widget, título actualizado y
  arranque frío/caliente en dispositivo (`adb devices` vacío).

## Q18 — Partir monolitos (sin cambios de comportamiento)

- `App.tsx` 49.381 → ~15,7 KB: historial/popstate a
  `hooks/useAppHistory.ts` (4,5 KB; `withTransition`/`VIEW_DEPTH`
  re-exportados desde App para no tocar importadores), atajo PWA + widget a
  `hooks/useShortcutLaunch.ts` (4,0 KB; `runStartAction` movido verbatim),
  vistas + ciclo de sesión a `components/app/AppViews.tsx` (10,7 KB),
  onboarding a `AppOnboarding.tsx` (2,4 KB), banners a `AppBanners.tsx`
  (6,1 KB), modales a `AppModals.tsx` (13,9 KB), spinners a `AppLoading.tsx`.
  `ConfirmModal`/`SessionBuilder` re-agregados tras el split (fallo
  detectado por tsc, no por tests). AppContext intacto.
- `ProfileSheet.tsx` 59.809 → orquestador 3,6 KB + 7 secciones en
  `components/profile/sections/` (Account 8,3 / Body 3,6 / Training 17,9 /
  Appearance 9,1 / Data 10,4 / Advanced 4,8 / Danger 1,1 KB) +
  `useSyncStatusText` + `ColorPill` extraído del cuerpo del componente.
  Contenido movido verbatim; `aria-label="Download"/"Delete"` en inglés
  eliminados (el nombre accesible ahora coincide con el texto visible
  traducido).
- Ningún archivo resultante pasa de 20 KB (máximo: TrainingSection 17,9 KB).
  Ningún test modificado (cero cambios en tests/): la suite existente es el
  contrato de "sin cambios de comportamiento".
- Chunk de entrada: pre-Q18 (stash) `index-DMSjlxVl.js` 340,37 kB
  (gzip 108,41) → post-Q18 `index-B5TXjf1T.js` 342,38 kB (gzip 109,64):
  +0,59 % raw / +1,13 % gzip, dentro del ≤2 %.
- Evidencia: build OK (tsc + vite + precache: 5 critical + 58 lazy),
  `test:run` 579/579 (110 ficheros, sin editar), `lint:a11y` limpio,
  Playwright 43/43 en puerto aislado 5199 (5173 ocupado por otro proyecto;
  config temporal eliminada tras la corrida).
- No verificado: nada pendiente propio de Q18; el flujo de atajo/widget se
  ejercita en e2e (offlineShell con `?action=start`) y siguió verde.
- CORRECCIÓN POSTERIOR (hallada en Q19): el Playwright 43/43 de Q18 corrió
  contra un dist construido ANTES del splice (el último build previo era el
  de la medición basal con el código en stash). El renombre de aria-labels
  ("Download"→t.export, "Delete"→t.factoryReset) rompía
  profileSettingsInventory contra el dist correcto; se arregló el spec en Q19
  (mapeo RENAMED) y ahora corre contra dist recién construido.

## Q19 — i18n con trinquete (510 → 194 ternarias, −62 %)

- `scripts/count-lang-ternaries.mjs`: cuenta `lang === 'es'` (comillas
  simples/dobles, cualquier espaciado) en .ts/.tsx/.js/.jsx/.mjs/.cjs,
  excluyendo node_modules, dist, android, tests, scripts, coverage,
  apk-out, ironlog-kmp y *.test/*.spec. Salida JSON {count, files}.
- Línea base `tests/i18n-baseline.json`: 510 → **194** (−62 %, meta ≥60 %).
  28 ficheros migrados (workout, Home, Stats, Layout, nutrición +
  ProgramHub y ExercisesView para alcanzar la meta): ProgramHub 55→3,
  StatsViewImpl 35→1, FreestyleSessionModal 35→8, AddFoodModal 23→5,
  GoalSetupModal 22→0, RestTimerOverlay 16→0, QuickStartSheet 13→0,
  HomeViewImpl 12→0, TemplateSelector 12→0, StatsView 9→0,
  SortableExerciseCardImpl 10→0, ExerciseProtocolBanners 9→0,
  TwoBlockMassModal 8→4, PlanActionsSheet 8→0, LogWeightModal 7→0,
  SkillProgressionBadge 7→4, ReorderExercisesSheet 5→0,
  ExerciseCardMenu 5→0, WorkoutViewImpl 4→0, ExerciseCardSets 4→0,
  ActivityHeatmap 3→0, RestPresetSheet 3→0, NextSessionCard 2→0,
  Layout 2→0, SetRow 2→0, WaterTracker 1→0, WorkoutView 1→0.
  BodyTab/NutriView/HomeRecapStrip no se tocaron: sus 6 ocurrencias son
  lógica de locale (`'es-AR'`/`'en-US'`) sin texto visible.
- 27 bloques nuevos en TRANSLATIONS (es+en, planos, uno por archivo) +
  extensión del bloque `timer` (8 claves); paridad total de claves.
  Reutilización donde el string era idéntico: t.save/cancel/back/notes/
  currentPlan/resting/effortEasy/effortHard/completeWeekConfirm,
  t.statsView.pill* en StatsView, t.cardMenu.unlink/link en
  SortableExerciseCardImpl; `item[lang]` en StatsView; ternarias con ambas
  ramas iguales ('Manual', 'Gym', 'Kcal', 'Prot', 'Carb', 'min') → literal.
- Ternarias que QUEDAN a propósito (25 en ficheros migrados): selección de
  datos ya bilingües (`x.name.es/.en`, 21) y fallbacks de datos de programa
  (blockName/blockGoal/dayName de ProgramHub, 3) y 1 locale de fecha
  (StatsViewImpl). El resto (169) vive en ficheros no migrados
  (SetupWizard 26, ProgramDetailView 22, FeedbackModal 15, ...).
- Micro-correcciones documentadas (cambian render): 'Mas opciones'→
  'Más opciones' (SortableExerciseCardImpl L608); HomeViewImpl 'de'→'of'
  en inglés (estaba hardcodeado 'de' en ambos idiomas); tutorialExtra
  nuevo (setTypesTitle es 'Tipos de serie', antes hardcoded "Set Types"
  en ambos; simplificados los `||` defensivos muertos); deps exhaustive-deps
  (`s` en StatsViewImpl, `sw.customPlan` en StatsView quitando `lang`).
- Tests: `i18nRatchet` (falla si count > baseline), `translationsParity`
  (claves es/en idénticas, recursivo, arrays por longitud),
  `i18nRender` (5 componentes × es/en con strings exactos + ausencia de
  "undefined"). Fail-proof: con components/views en stash el conteo vuelve
  a 510 y el trinquete falla (`510 > 194`).
- Auditoría de valores (script temporal, eliminado): 765 literales de las
  líneas eliminadas (git diff) — 748 presentes en TRANSLATIONS o como
  literales invariantes, 17 artefactos de composición de templates
  verificados a mano (noMatch, replaceDesc {old}/{new}, rel1rm, showAll,
  blockWord, searchPlaceholder escapado), 1 fix documentado ('Mas opciones').
- profileSettingsInventory fallaba (determinista): las aria "Download" y
  "Delete" del inventario N6 fueron renombradas por Q18 (a t.export y
  t.factoryReset) y Q18 corrió Playwright contra un dist viejo, tapando el
  fallo. Fix: mapeo RENAMED en el spec (vieja ausente + exactamente una
  de las formas nuevas es/en presente). 3/3 verde.
- Evidencia: build OK (tsc + vite + precache 5 critical + 58 lazy),
  `test:run` 592/592 (113 ficheros: 579 + ratchet 2 + paridad 1 + render
  10), `lint:a11y` limpio, Playwright 43/43 (puerto aislado 5199).
  Una corrida completa mostró 1 unhandled rejection en
  statsScopeControl (worker mock under load) con 582/582 en verde;
  re-corridas limpias: flake de carga paralela, misma familia que los
  timing flakes conocidos.
- No verificado: render visual en es/en en dispositivo real; el resto de
  ficheros con ternarias (fuera de la meta) sigue pendiente de migración.

## Q20 — Presupuesto de bundle + lazy de 3 componentes (entrada −5,4 % gzip)

- `scripts/bundle-report.mjs`: gzip real por chunk (zlib de Node),
  partición crítico/lazy reutilizada de `splitCriticalLazy` del precache,
  escribe `docs/BUNDLE_REPORT.md`; `bundle-budget.json` = tamaño medido
  + 5 % (entryJsGzip 126073, criticalTotalGzip 203940);
  `npm run bundle:report` integrado en `verify` (exit 1 si excede).
- Visualizador (`npx vite-bundle-visualizer`, sin instalar; mide pre-minify,
  orden relativo válido). Top-5 gzip del entry: translations.ts 33,4,
  vaul 16,4, HomeViewImpl 7,2, AppContext 6,9, @capacitor/core 5,8 KB.
- Lazy aplicado (barato + seguro, patrón React.lazy existente):
  RestTimerOverlay en App.tsx (el motor corre en TimerProvider; el overlay
  es display + prompts de un solo uso con degradación elegante),
  TutorialOverlay y TemplateSelector en HomeViewImpl (ambos render-gated).
  Rechazados con motivo: translations (split por idioma invasivo), vaul
  (exigiría lazy de ProfileSheet + sheets de home), kong4Day (uso síncrono
  en el render de Layout; programs/ intocable).
- Antes/después: entry 355,68→337,33 KB raw (−7,2 %),
  117,25→110,97 KB gzip (−5,4 %); critical 189,68→183,39 KB;
  lazy 696,51→704,64 KB (+3 chunks precacheados como LAZY en sw.js:
  RestTimerOverlay 16,3, TemplateSelector 6,9, TutorialOverlay 3,7 KB raw;
  offline intacto). Presupuesto sin cambios (más holgura).
- Fail-proof: stash de App.tsx+HomeViewImpl → rebuild → entry vuelve a
  117,25 KB exacto / 63 assets (determinista); mutación del script
  (`> budget` + 1e6) → el test over-budget falla; restaurado 7/7.
- Supuesto mojibake en BUNDLE_REPORT.md investigado: bytes E2 80 94 =
  em-dash UTF-8 válido (verificado con Node); artefacto de display de
  PowerShell, no un bug. Sin cambios.
- Tests: `tests/unit/bundleReport.test.ts` (7: findEntryChunk,
  analyzeDist sobre fixture con gzip reales, CLI en subproceso dentro/
  fuera de presupuesto, budget ausente, --write-budget = +5 % exacto).
- Evidencia: build OK (precache 5 critical + 61 lazy), `test:run`
  599/599 (114 ficheros: 592 + 7 bundle), `lint:a11y` limpio, `verify`
  verde (WITHIN BUDGET), Playwright 43/43 (puerto aislado 5199).
- No verificado: tiempos de carga en dispositivo real; resto del top-5
  sin optimizar (documentado arriba).

## Q21 — Historial en la nube por sesión (flag `VITE_CLOUD_LOGS_V2`, APAGADO por defecto)

Retomado tras corte de cuota del agente anterior: el módulo y 43 tests unitarios estaban
escritos sin commit; faltaba cablear syncService, reglas, borrado de cuenta, integración y
reporte. Al cerrarlo se encontraron y corrigieron 3 defectos del diseño inicial (abajo).

- `services/cloudLogsV2.ts` (puro / IO inyectada): `planSessionUpload` (incremental por
  índice id→{u,h}; hash FNV-1a sin `updatedAt`), `mergeSessionLogs` (unión por id, gana el
  `updatedAt` mayor, lápidas ganan a ediciones más viejas, empate = local, lápidas >90 días
  ignoradas), `ensureSessionLogsMigrated` (data/history legado ∪ docs V2 ∪ locales →
  `logs/{id}` en lotes ≤400 → recién entonces `historyFormat: 2`; idempotente, reanudable,
  NO borra data/history), `uploadSessionLogsV2`, `downloadSessionLogsV2` (pull completo sin
  caché; delta `updatedAt > cursor − 24 h` con caché; GC best-effort de lápidas vencidas),
  `adoptSessionLogsV2`, `deleteAllSessionLogsV2`. `services/cloudLogsIndex.ts`: índice,
  cursor y marca en IndexedDB por uid. `types.ts`: `Log.updatedAt?`.
- `services/cloudLogsV2Flag.ts`: chequeo del flag aislado; syncService y accountDeletion
  cargan V2 con import dinámico → chunk lazy `cloudLogsV2` (2,7 KB gzip). Entrada
  110,97 → 111,37 KB gzip (+0,4 %; con import estático era +2,3 %).
- `syncService`: flag ON → `uploadStateNow` commitea el doc principal y luego sube sesiones V2
  (ya no escribe data/history); `downloadState` hace delta sobre `cloudSyncCache`;
  `adoptCloudLogs` (no-op con flag OFF). `AppContext`: llama `adoptCloudLogs` en los 2 sitios
  donde aplica logs de la nube (dispositivo vacío y "aceptar datos de la nube").
- Reglas: `historyFormat` (int) en la lista permitida (create y update);
  `match /users/{uid}/logs/{logId}`: lectura/listado y borrado solo dueño; create/update con
  `keys().hasOnly(sessionDocAllowedKeys())`, `updatedAt is number`, `id` number|string,
  `deleted == true` si existe, `exercises` list, `startTime/endTime` number. El cliente
  proyecta cada doc a `SESSION_DOC_KEYS` (misma lista; un test compara ambas) para que un
  campo heredado desconocido en un log viejo no deje la migración denegada para siempre
  (solo afecta a la copia en la nube; lo local no se toca).
- Borrado de cuenta: con flag ON lista y borra `logs/` en lotes ANTES de data/history y
  users/{uid}; si falla, `deleteUser` no se llama. Flag OFF: idéntico a Q2.
- Defectos encontrados y corregidos al cerrar (cada uno con test que falla sin el fix):
  1. **Pérdida de sesiones de otro dispositivo**: download/migración sembraban el índice con
     ids remotos; si el usuario rechazaba "datos más nuevos en la nube", la siguiente subida
     los convertía en lápidas. Fix: entradas `r` (solo remotas) nunca se lapidan hasta que el
     id aparece en local o la app lo adopta (`adoptSessionLogsV2`). Tests: 3 unitarios +
     integración "a declined merge loses nothing". El test previo de dos dispositivos se
     ajustó para llamar a la adopción donde la app aplica los logs (sus aserciones no cambian).
  2. **Sesiones invisibles a pulls delta**: altas selladas con `endTime` (sesión terminada
     offline o importada por CSV con fecha vieja) quedaban bajo el cursor de otros
     dispositivos. Detectado por la integración real con emuladores. Fix: altas selladas con
     `max(now, endTime)` + solape de 24 h en el delta (tolerancia a reloj desfasado; el merge
     es idempotente). Test de regresión falla sin el fix (pierde la sesión #2).
  3. **Re-subida perpetua**: un log adoptado conserva su `updatedAt` viejo; tras editarlo,
     `stamp !== índice` lo re-subía en cada sync. Fix: solo un sello explícito MÁS NUEVO es
     cambio. Test de regresión falla sin el fix.
- Tests: `cloudLogsV2` unit 50 (planificador, merge, migración, upload/download con Firestore
  falso, dos dispositivos, regresiones, paridad reglas↔cliente); `accountDeletion` +3 (orden
  con logs, fallo sin deleteUser, flag OFF no lista); reglas +3 (historyFormat, logs dueño vs
  extraños, claves/tipos/lápidas falsas) → 16/16; integración +4 (migración real con flag ON
  y legado intacto + download por syncService; golden flag OFF sin `logs/` ni historyFormat;
  dos dispositivos con rechazo/aceptación/delta/incremental; borrado de cuenta con logs) → 12/12.
- Evidencia: build OK (5 critical + 62 lazy), `test:run` 652/652 (115 ficheros),
  `lint:a11y` limpio, `bundle:report` WITHIN BUDGET, `test:rules` 16/16,
  `test:integration` 12/12, Playwright 43/43.
- Limitaciones documentadas: el flag es de build (todos los dispositivos deben usar un build
  con el mismo valor; un build viejo sin flag seguiría leyendo data/history, que deja de
  actualizarse). Si el flag se apaga tras usarlo, `logs/` queda en la nube y el borrado de
  cuenta con flag OFF no lo toca. Una sesión borrada en un dispositivo ANTES de que su primer
  pull adopte los logs no se propaga (preferimos no perder datos a borrar de más).
- No verificado: con datos reales de producción (reglas no desplegadas; no se usa Firebase real).

## Q22 — Cierre

- `docs/README.md`: índice de docs/ (pasos del dueño, reportes AUDIT_*, BUNDLE_REPORT,
  legal-drafts, design-reference).
- `docs/MANUAL_STEPS_9.md`: admin, desplegar reglas Q3+Q21 (con el chequeo previo de claves),
  flags (`VITE_CLOUD_LOGS_V2` con orden seguro y vuelta atrás; App Check), APK con
  `adb install -r`, alarmas exactas, notificaciones, acciones del descanso, recordatorios,
  widget, validar importadores con exports reales de Hevy/Strong, respaldos y borrado con
  cuenta de prueba.
- `.env.example`: agregada `VITE_CLOUD_LOGS_V2=` (sin valor), que faltaba desde Q21.
- APK release de prueba (`npm run build && npx cap sync android`, `assembleRelease` con R8,
  JDK 21 en `C:\jdk-21`; vars `GAINS_LAB_*` apuntando a la keystore de debug de siempre,
  `%USERPROFILE%\.android\debug.keystore`, valores no impresos):
  - Ruta: `apk-out/gainslab-release-test.apk` (+ `apk-out/mapping.txt`, 5,5 MB); ignorados por git.
  - Tamaño: 14 045 657 bytes (13,4 MB).
  - SHA-256: `B690831F50D09649CD89238B403A5C373263D5C1BEDCA823E1677ED5AB00B0CF`
  - Commit de código: `9719b37` (Q21; el commit Q22 solo agrega docs y `.env.example`).
  - aapt: `com.gainslab.pro`, versionName `4.0.3-kong.6`, versionCode 414,
    compileSdk 36, targetSdk 36, minSdk 24.
  - Firma: certificado SHA-256 `A4:A8:52:18:…:7D:85:35:12` = keystore de debug (comparado
    con `apksigner verify --print-certs` vs `keytool -list`), así que `adb install -r` actualiza
    sin desinstalar.
  - Manifiesto fusionado (aapt): `allowBackup=0x0`, `SCHEDULE_EXACT_ALARM`,
    `RECEIVE_BOOT_COMPLETED`, receivers RestTimer/RestTimerAction/WorkoutReminder/
    WorkoutReminderBoot y `StartWorkoutWidgetProvider` (APPWIDGET_UPDATE + metadatos).
  - `adb devices`: vacío → instalación y logcat (ClassNotFoundException / FATAL de
    com.gainslab.pro) **pendientes en dispositivo real**. Comando: `adb install -r apk-out/gainslab-release-test.apk`.

## Criterios de finalización

| # | Criterio | Estado |
|---|----------|--------|
| 1 | build, test:run ×3, lint:a11y, Playwright, test:rules; test:integration | build OK; `test:run` 652/652 en 3 corridas consecutivas; lint limpio; Playwright 43/43; `test:rules` 16/16; `test:integration` 12/12 |
| 2 | Q1–Q21 con commits y tests de comportamiento | Todas hechas (tabla de commits); ninguna revertida |
| 3 | Borrado y reglas | Sin getDocs de `data/` (Q2); flujo real contra emuladores; updates toleran claves heredadas (Q3) |
| 4 | Un solo inicializador, Firebase fuera del arranque | Q4 (`lib/firebase.ts` eliminado; vendor-firebase LAZY); V2 de Q21 también lazy |
| 5 | APK firmado con la keystore de debug | Sí, datos arriba |
| 6 | Reporte completo + MANUAL_STEPS_9 | Este archivo + `docs/MANUAL_STEPS_9.md` |
| 7 | Todo pusheado, tag, sin ramas nuevas ni Actions, árbol limpio | Tag `pre-q-series` en origin; sin `.github/workflows`; solo `.env.example` en el índice (sin .env, keystores, APK ni local.properties) |

Pendiente solo en dispositivo real / servicios externos (por diseño): todo lo listado en
`docs/MANUAL_STEPS_9.md` (despliegue de reglas, flag V2, permisos, widget, notificaciones,
recordatorios, importadores con exports reales, instalación del APK y logcat).
