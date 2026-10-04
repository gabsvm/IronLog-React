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
| Q6 | (este commit) | hecho |

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
