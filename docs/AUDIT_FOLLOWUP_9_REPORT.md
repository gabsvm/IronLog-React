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
| Q13 | (este commit) | hecho |

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
