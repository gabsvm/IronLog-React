# Reporte de Seguimiento Post-Auditoría: F1–F9 (GainsLab)

| Metadato | Detalle |
|---|---|
| **Fecha** | 2026-10-01 |
| **Rama** | `agent/gainslab-audit-fixes-v2` (desde `origin/agent/gainslab-audit-fixes-v1`) |
| **Alcance** | Corrección de los problemas F1–F9 detectados por revisión independiente + corrección de `docs/AUDIT_FINAL_REPORT.md` |
| **Fase 7 (Capacitor/Android)** | No realizada (excluida por pedido) |

Criterios de finalización: los 4 comandos (`npm run build`, `npm run test:run`,
`npm run lint:a11y`, `npx playwright test`) pasan; existen e2e de offline+atajo,
actualización diferida e historial plano; cada tarea F1–F9 tiene commit(s) con
criterio verificado; todo pusheado con `git status` limpio.

Estado final verificado: **unit 48 archivos / 232 tests** (2 corridas
consecutivas), **e2e 13/13**, build con **precache de 61 assets**, lint:a11y 0
errores. Detalle y evidencia por tarea abajo.

---

## F1. Regresión offline (commit `01cff28`)

**Problema:** el precache cubría solo el shell sincrónico; las vistas lazy no
funcionaban offline hasta abrirlas con red.

**Cambios:**
- `scripts/generate-sw-precache.mjs` precachea todos los `.js`/`.css` y fuentes
  `.woff2` de `dist/assets/` (61 assets; build actual: cache `e5a0e30c7a41`).
- `public/sw.js`: `trimCache` nunca borra entradas precacheadas; `cache.match`
  con `ignoreSearch` + `ignoreVary` (el `Vary: Origin` del servidor impedía el
  match offline de chunks no-cors — verificado: sin esto el boot offline daba
  504 en chunks precacheados).
- `App.tsx`: vistas lazy envueltas en `LazyViewBoundary`
  (`components/ui/LazyViewBoundary.tsx`) con mensaje y botón "Reintentar".
- `tests/unit/swOffline.test.ts`: reescrito para cargar el `public/sw.js` real
  en `vm` (self/caches/fetch simulados). Verifica: `/?action=start&source=shortcut`
  sirve el shell cacheado; sin cache ni red cae en `offline.html`; `trimCache`
  no borra precacheados; assets críticos que fallan voltean el install.
- `tests/e2e/offlineShell.spec.ts`: carga online, `setOffline(true)`, abre el
  atajo, History y Stats sin ErrorBoundary.

**Evidencia:** build `[pwa] Precaching 61 build assets`; e2e offline 1/1.

## F2. Pantalla en blanco al terminar/descartar (commit `b551db2`)

**Problema:** `onFinish`/`onDiscard` limpiaban la sesión antes de cambiar la
vista (asíncrona) → `view==='workout'` sin sesión = `Layout` vacío.

**Cambios:** `setView(view, after)` atómico con `flushSync` en `App.tsx`;
`targetViewRef` solo-intención (ya no se pisa en cada render, lo que cancelaba
transiciones async). E2e `tests/e2e/finishFlow.spec.ts` con MutationObserver:
`#root` nunca queda sin contenido significativo entre terminar/descartar y el
resumen/home. Control negativo: reintroducir el bug hace fallar el e2e.

**Evidencia:** finishFlow 2/2.

## F3. Píldora de descanso (commit `8e39c4f`)

**Problema:** botones compactos <44px reales; chips de esfuerzo ocultos en modo
compacto; la píldora tapaba el input con teclado abierto.

**Cambios** (`components/ui/RestTimerOverlay.tsx`): botones −10s/+30s/saltar con
tamaño real ≥44×44px (`min-h/w-[44px]`); chips Fácil/OK/Duro + "siguiente"
visibles en modo compacto con `showRIR`/`rpEnabled`; con `keyboardOffset > 120`
la píldora se ancla debajo del header del workout en vez de sobre el teclado.
E2e `tests/e2e/restPill.spec.ts` mide `getBoundingClientRect` ≥44 en los tres
botones; unit `tests/unit/restTimerPill.test.tsx` 6/6.

**Evidencia:** restPill e2e 1/1; botones compactos medían <44px antes del fix.

## F4. Contextos (commit `9c85f00`)

**Problema:** `isOnline` y `syncStatus` seguían en el `contextValue` de `useApp()`,
re-renderizando consumidores ante cada cambio de red/sync.

**Cambios** (`context/AppContext.tsx`): quitados de `AppContextType` y del
`contextValue`; `ProfileSheet`/`SettingsModal` y demás consumidores migrados a
`useSyncStatus` (`SyncStatusContext`). `handleSetComplete` documentado como
local a la vista (no migrado al controller: no hay estado compartido que lo
pida). Tests: `controllerIdentity.test.tsx` (identidades estables de
`handleSetUpdate`/`toggleSetComplete`/`handleSetComplete` ante cambios de
sesión y sync, con controller real) + `syncMetaDecoupling`.

**Evidencia:** suites F4 en verde dentro del run global 232/232.

## F5. Suspense faltante (commit `d14368e`)

**Problema:** los `ConfirmModal` lazy de "SYNC CONFLICT" y "FORCE SYNC" se
renderizaban sin `<Suspense>` (suspensión sin boundary = pantalla rota).

**Cambios** (`App.tsx`): ambos envueltos en `<Suspense fallback={null}>` y
render condicional cuando están abiertos. Auditoría repo-wide: 27 `React.lazy`
revisados, todos con Suspense o render condicional. Sin otros casos.

**Evidencia:** revisión manual completa; e2e journeys (que abren sync/conflict
paths) 5/5.

## F6. Deshacer salto vs avance de semana KONG (commit `1e8facf`)

**Problema:** saltar el último día pendiente avanzaba la semana; deshacer borraba
el log pero dejaba la semana avanzada.

**Cambios:** snapshot `SkippedWeekSnapshot` (`mesoId`, `week`, `isDeload`) al
saltar; al deshacer, `shouldRestoreWeekAfterUndoSkip` restaura la semana si
avanzó por ese salto. Motor KONG (`programs/`) intacto: el fix vive en la capa
de vista. Test `tests/unit/undoSkipWeek.test.ts` 6/6.

**Evidencia:** undoSkipWeek 6/6.

## F7. Residuales (commit `6b7d0a0`)

- Tipografía: 32 operaciones en 15 archivos (`text-[10px]/text-[9px]` con
  zinc-500/600 → `text-xs text-muted`), incluyendo descripciones de tipos de
  serie en `WorkoutViewImpl`. ~70 micro-labels intencionales conservados.
- `HoldTimer`: reutiliza `playTimerFinishSound` de `utils/audio` (sin
  `AudioContext` propio) y Play/Stop ≥44px.
- `popstate` en `App.tsx` también usa `flushSync` (mismo race que F2).
- Notificaciones: permiso solo desde el interruptor en Ajustes
  (`requestTimerNotificationPermission`, único caller `SettingsModal:446`);
  eliminado el auto-pedido al iniciar descansos.
- `logs.txt` (122 KB, logcat sin secretos): `git rm` + `.gitignore`. `.claude/`
  revisado (sin secretos). `.vercel/` (linkage local de Vercel CLI) agregado a
  `.gitignore` en F8.

**Evidencia:** gates verdes; `timerNotifications.test.ts` cubre Settings-only.

## F8. Tests reales (commit `a0c4991`)

Auditoría completa de `tests/unit` (48 archivos): cada test tautológico, que
comparaba clases CSS o re-implementaba lógica inline, se eliminó (si un e2e lo
supersede) o se reescribió contra comportamiento real.

**Eliminados (7):** `touchTargetSizes` → `setRowTargets.spec.ts` (mide áreas
reales; encontró y se corrigió un badge de 42px con `-inset-[6px]`);
`swPrecache` (crítico-fallido movido a `swOffline`); `historyStack` →
`flatHistory.spec.ts`; `swUpdateFlow` → `swUpdate.spec.ts`;
`contrastAndTextSize` → `cssFoundations.spec.ts` + `textSizeFloor.test.tsx`;
`touchGestures` → `cssFoundations.spec.ts`; `fontStack` → `cssFoundations.spec.ts`.

**Reescritos a comportamiento real (5):** `htmlLangSync` (AppProvider real +
`setLang` → `documentElement.lang`; paridad total de claves es/en),
`modulePreload` (render real de Home/WorkoutView + callbacks idle capturados +
imports dinámicos reales), `indexHtmlCleanup` (ejecuta el `<script>` real de
index.html: onerror/overlay/timeout-15s/unhandledrejection),
`onboardingOutcomes` (maneja el `SetupWizard` real: merge preserva stats,
custom/freestyle/suggested), `lightModeContrast` (parsea los tokens reales de
index.css y calcula contraste sobre ellos). Nuevos: `scheduleWhenIdle.test.ts`
(primitiva idle) y `workoutProfiler.test.tsx` (F9). `workoutRenderIsolation`
usa controller + store reales.

**Nuevos e2e F8 (4):**
- `swUpdate.spec.ts`: banner de update sin recarga con sesión activa; dismiss
  del confirm no recarga; `SKIP_WAITING` externo dispara `ironlog:update-deferred`
  sin recargar; aceptar recarga. (Requiere boot bajo control del SW por el guard
  `hadControllerOnLoad` de index.tsx.)
- `flatHistory.spec.ts`: 4 pestañas no agregan entradas (`history.length`
  invariante); un solo Atrás vuelve al inicio.
- `setRowTargets.spec.ts`: check + badge ≥44px reales.
- `cssFoundations.spec.ts`: overscroll `contain` computado en html/body/#root,
  `touch-action: manipulation` en botones, piso 11px + token muted computados,
  0 requests a Google Fonts, `Inter Variable` cargada.

**Evidencia:** unit 48/232 (2 corridas), e2e 13/13.

## F9. Reporte honesto (este commit)

- Creado este `docs/AUDIT_FOLLOWUP_REPORT.md`.
- Corregido `docs/AUDIT_FINAL_REPORT.md` (ver tabla abajo).
- Medición Profiler antes/después (§Medición).
- Lighthouse mobile final + chunks finales (§Lighthouse, §Chunks).

---

## Correcciones a `docs/AUDIT_FINAL_REPORT.md`

| # | Afirmación original | Realidad verificada | Evidencia |
|---|---|---|---|
| 1 | D1: "corregido para **no** persistir `null`" | **Sí persiste `null`**: `db.set('il_session_v16', activeSession)` con dirty-flags + flush en pagehide | `lib/store.ts:86-94`, `storePersistence.test.ts` |
| 2 | Memoización de `WorkoutExerciseCard` con "comparación personalizada" | Nombre real: `SortableExerciseCard` (wrapper + `SortableExerciseCardImpl`); `React.memo` **shallow**, sin comparador | `components/workout/SortableExerciseCard.tsx:25`, `...Impl.tsx:44,729` |
| 3 | Desacople hacia `syncMetaStore` | Nombre real: `SyncMetaContext` + `useSyncMeta` | `context/AppContext.tsx:101,119,925` |
| 4 | Contextos granulares incl. `useAppModals` | `useAppModals` **no existe**; reales: `useAppPreferences`, `useSyncStatus`, `useSyncMeta`, `useTutorial`, `useAppConfig` | grep repo: 0 hits |
| 5 | Handler `updateSetField` | Nombre real: `handleSetUpdate` | `hooks/useWorkoutController.ts:120` |
| 6 | Re-renders "cada 3 segundos" por `localLastUpdated` | Sin timer: se actualiza en eventos de sync | `context/AppContext.tsx:588,633,665,685,732,758` |
| 7 | Swipe "umbral horizontal de 40px" | Umbral efectivo **dx≥78px** (`pct=(dx-10)/80≥85%`), dominancia 1.8×, descarte <24px del borde | `components/workout/SetRow.tsx:355-356,380-396` |
| 8 | `overscroll-behavior-y: none` global | `overscroll-behavior: contain` en html/body/#root + `.scroll-container` | `index.css:156,228`, `cssFoundations.spec.ts` |
| 9 | Permiso notif "ante el primer descanso o en ajustes" | **Solo desde Ajustes** | único caller `SettingsModal.tsx:446` |
| 10 | "≥44px en todos" | Verificado solo en superficies medidas: píldora (real) + check/badge SetRow (medidos e2e) | `restPill.spec.ts`, `setRowTargets.spec.ts` |
| 11 | Contraste claro 6.66:1 | **6.6:1** (77,101,12 vs blanco) | cálculo §Contrastes |
| 12 | "Migración completa a TRANSLATIONS" | Falso: ternarios `lang === 'es'` inline en **~50 archivos** fuente | grep repo |
| 13 | "100% Completadas y Verificadas" + verificado "en Moto G86 Power" | Sin verificación en hardware físico; este follow-up (F1–F9) existió porque v1 tenía gaps | este reporte |
| 14 | Precache "7 assets esenciales" como estado final | Cierto en v1; **F1 lo amplía a 61** (shell + vistas lazy + CSS + fonts) | build `[pwa] Precaching 61 build assets` |

Verificados como **correctos** y conservados: chunk WorkoutView 36.85 kB
(build actual: 36.84 kB / 12.02 gzip), contraste oscuro 15:1 (medido 15.19),
muted ≥5.2:1 (medido 5.63/5.81), `role="switch"` (2 usos reales), historial
plano con `replaceState`.

### Contrastes (recalculados sobre tokens reales de `index.css`)

- `--accent-text` dark (200,244,90) vs `--surface-base` (14,14,16): **15.19:1**
- `--accent-text` light (77,101,12) vs blanco: **6.60:1**
- `--text-muted` (138,138,146) vs surface-base: **5.63:1**; vs body `#09090b`: **5.81:1**

---

## Medición de re-renders: antes vs después

Escenario baseline (`docs/AUDIT_BASELINE.md` §4): sesión de 4 ejercicios × 4
series. Metodología "antes": estimación DevTools pre-fix. Metodología
"después": `tests/unit/workoutProfiler.test.tsx` (React.Profiler sobre
controller + store + tarjetas reales, mismo escenario 4×4).

| Caso | Antes (baseline) | Después (Profiler) |
|---|---|---|
| A: editar peso/reps | ~45–55 componentes por tecla | **1 tarjeta renderiza (~1.8 ms)**; hermanas solo bailout (~0.2 ms c/u, sin render de subárbol); raíz lista (~2.6 ms) |
| B: completar serie | ~50–65 componentes | **1 tarjeta renderiza (~1.6 ms)**; hermanas bailout (~0.2 ms); raíz (~2.1 ms) |

Hallazgo metodológico: `Profiler.onRender` dispara incluso cuando un subárbol
memoizado hace bailout (verificado con repro mínimo: 1 hit con `actual`
0.03 ms vs `base` 0.31 ms y 0 re-renders del hijo). Por eso la señal de
aislamiento es `actualDuration`, no el conteo de hits; el conteo determinista
de renders vive en `workoutRenderIsolation.test.tsx` (tarjeta B: exactamente 1
render). Los números de arriba son de jsdom en máquina de desarrollo, no del
Moto: sirven como comparación relativa antes/después, no como presupuesto de
frame en dispositivo.

---

## Lighthouse mobile final

Condiciones (mismas clase que baseline §3): Lighthouse **13.5.0**, emulación
móvil por defecto (Moto G + throttling Slow 4G), `npm run preview` sobre
`dist/`, Chromium headless. Dos corridas consecutivas:

| Métrica | Baseline | Corrida 1 (fría) | Corrida 2 (tibia) |
|---|---|---|---|
| Performance | 78 | **80** | **91** |
| Accessibility | 92 | 92 | 92 |
| Best Practices | 96 | **100** | **100** |
| SEO | 92 | 92 | 92 |
| FCP | 2.7 s | 2.7 s | 2.5 s |
| LCP | 4.3 s | 4.5 s | 3.0 s |
| TBT | 180 ms | **20 ms** | **20 ms** |
| CLS | 0.00 | 0 | 0 |
| Speed Index | 2.7 s | 2.7 s | 2.5 s |
| TTI | — | 5.2 s | 4.3 s |

Lectura honesta: TBT colapsó (180→20 ms, estable en ambas corridas) y Best
Practices llegó a 100. La varianza entre corridas (LCP 4.5→3.0, perf 80→91) es
esperable en emulación sobre desktop: la primera es fría (instalación del SW)
y la segunda se sirve del precache — lo que a su vez confirma el valor del
precache F1 para visitantes recurrentes. Oportunidades restantes (corrida 1):
`unused-javascript` (~450 ms) y `unminified-javascript` (~300 ms), ambos en
chunks vendor (Firebase) fuera del alcance permitido. Sin verificación en
hardware físico (ver §Pendiente).

---

## Tamaños de chunk finales (build v2)

Build `vite` + precache 61 assets (cache `e5a0e30c7a41`). Principales (resto <
22 kB en §detalle):

| Chunk | Sin comprimir | gzip | vs Baseline |
|---|---|---|---|
| `vendor-firebase-db` | 433.90 kB | 106.85 kB | = |
| `index` (shell) | 290.26 kB | 91.89 kB | +5.5 kB (código F1–F9) |
| `vendor-firebase-auth` | 189.78 kB | 37.68 kB | = |
| `vendor-charts` | 182.51 kB | 63.69 kB | = |
| `vendor-react` | 142.21 kB | 45.58 kB | = |
| `vendor-motion` | 126.52 kB | 41.56 kB | = |
| `index` CSS | 129.75 kB | 20.87 kB | +5 kB |
| `defaultTemplates` | 81.23 kB | 13.33 kB | = |
| `disciplineExercises` | 58.23 kB | 17.39 kB | = |
| `SettingsModal` | 57.07 kB | 15.06 kB | +2.1 kB |
| `index` (secundario) | 54.39 kB | 18.87 kB | = |
| `NutriView` | 53.64 kB | 13.04 kB | ≈ |
| `SortableExerciseCardImpl` | 50.01 kB | 12.88 kB | (split de WorkoutView) |
| `vendor-dnd` | 45.38 kB | 15.19 kB | = |
| `WorkoutView` | 36.84 kB | 12.02 kB | split confirmado (era 84.20) |
| `vendor-icons` | 35.62 kB | 7.14 kB | +2.3 kB |
| `StatsView` | 32.94 kB | 10.55 kB | = |
| Resto (vistas/modales lazy) | <22 kB c/u | — | = |

JS crítico inicial (gzip, index + react + motion + firebase-db): ~385 kB →
**~390 kB** (+1%: código F1–F9; vendors intactos, cero dependencias nuevas).
Fuentes Inter woff2 precacheadas: latin 48.26 kB + latin-ext 85.07 kB (+5
subsets menores).

---

## Inventario de tests

- **Unit:** 48 archivos / 232 tests (`npm run test:run`), 2 corridas verdes
  consecutivas. Incluye suites F1–F9 citadas arriba.
- **E2E:** 13/13 (`npx playwright test`, Mobile Chrome): 5 criticalJourneys +
  finishFlow (F2, 2) + offlineShell (F1) + restPill (F3) + setRowTargets,
  flatHistory, swUpdate, cssFoundations (F8, 4).
- **Lint a11y:** 0 errores (`npm run lint:a11y`).
- **Reglas respetadas:** sin tocar `programs/`, `syncService`, `syncHelpers`,
  `workoutCompletionService`, `firestore.rules`; sin `.env` abierto; sin
  dependencias nuevas (Lighthouse 13.5.0 se ejecutó vía `npx` con Chromium de
  Playwright, sin agregarlo al proyecto); texto visible nuevo en TRANSLATIONS.

---

## Pendiente de verificar en dispositivo real

Nada de este reporte se midió en hardware físico. Antes de declarar victoria en
el Moto G86 Power (o cualquier gama media), falta verificar en dispositivo:

1. **Lighthouse/Perf real:** TBT/LCP/TTI con CPU y red móviles de verdad; los
   20 ms de TBT en desktop-emulación no predicen el Moto.
2. **Offline real:** modo avión con SW instalado; atajo `?action=start`, History
   y Stats sin red (e2e solo cubre `setOffline` de Chromium).
3. **Update diferida real:** redeploy con sesión activa; banner, confirm y
   `update-deferred` en Chrome Android.
4. **Touch real:** 44px percibidos, swipe dx≥78px con dedos, píldora vs teclado
   con IME real, overscroll/pull-to-refresh del navegador.
5. **Notificaciones:** permiso desde Ajustes + aviso de descanso con app en
   segundo plano (Android suspende workers agresivamente).
6. **F7 Fase 7:** todo lo Capacitor/Android sigue pendiente por diseño.
7. **Batería/memoria:** sesiones largas (50+ series) sin jank ni GC pauses en
   4 GB RAM.

## Bloqueos

Ninguno bloqueó tareas: los dos intentos fallidos intermedios (thresholds de
timing absolutos en el test Profiler bajo carga; `networkidle` de Playwright
que nunca settle por conexiones Firebase persistentes) se resolvieron cambiando
el enfoque (asserts relativos; espera por `document.fonts.ready`), no
documentando deuda. Deuda consciente: ternarios `lang === 'es'` históricos
(~50 archivos) no migrados — fuera del alcance F1–F9.
