# Reporte de Seguimiento Post-Auditoría 2: G1–G7 (GainsLab)

| Metadato | Detalle |
|---|---|
| **Fecha** | 2026-10-01 |
| **Rama** | `agent/gainslab-audit-fixes-v3` (desde `origin/agent/gainslab-audit-fixes-v2`) |
| **Alcance** | Corrección de los problemas G1–G7 detectados por revisión independiente de la rama v2 + correcciones a `docs/AUDIT_FOLLOWUP_REPORT.md` |
| **Fase 7 (Capacitor/Android)** | No realizada (excluida; G9 compila APK debug sin tocar versiones) |

Estado final verificado: **unit 52 archivos / 251 tests**, **e2e 17/17**,
build con **precache 61 assets (7 critical + 54 lazy)**, lint:a11y 0 errores.
Detalle y evidencia por tarea abajo.

---

## G1. LazyViewBoundary solo captura errores de chunk (commit `9818fac`)

**Problema:** capturaba CUALQUIER error de render ("no se pudo cargar" + solo
Recargar), ocultando errores reales y bloqueando el ErrorBoundary raíz de
index.tsx (backup + reinicio). Con sesión corrupta: loop de recarga sin salida.

**Cambios** (`components/ui/LazyViewBoundary.tsx`): `getDerivedStateFromError`
guarda el error; en `render()`, si NO es error de chunk (fragmentos "Failed to
fetch dynamically imported module", "Importing a module script failed",
"Loading chunk", "error loading dynamically imported module") se relanza para
que lo maneje el boundary padre. Solo chunk muestra mensaje + Reintentar.

**Tests** (`tests/unit/lazyViewBoundary.test.tsx`, 3/3, comportamiento real):
(a) hijo `React.lazy` que rechaza con error de chunk → mensaje + Reintentar, sin
ErrorBoundary raíz; (b) hijo que lanza `Error` común dentro del `ErrorBoundary`
real de index.tsx → se ve "ERROR CRÍTICO" + "Exportar copia de seguridad";
(c) `resetKey` resetea el fallback local.

## G2. Píldora: altura medida + padding compensado + chips 44px (commit `a194525`)

**Problema:** la píldora compacta con RIR (~130px + 80px de flotación) tapaba las
últimas series y "Añadir ejercicio" (la lista terminaba en 48px + 24px).

**Cambios:**
- `components/ui/RestTimerOverlay.tsx`: mide la píldora con ResizeObserver y
  expone `--rest-pill-height` en documentElement mientras está montada ('0px'
  si no: inactiva, expandida o desmontada).
- `views/WorkoutViewImpl.tsx`: `#tut-exercise-list` usa
  `padding-bottom: calc(3rem + var(--rest-pill-height, 0px) + 16px)` — CSS puro,
  sin suscripciones React (evita re-renders por tick del timer).
- Chips Fácil/OK/Duro (compacto y expandido): `h-9` → `min-h-[44px]`.

**Tests:** `tests/unit/restPillHeight.test.tsx` (3/3: RO observa el `aside`,
la var sigue la altura medida, 0px al desactivar/expandir/desmontar) y
`tests/e2e/restPillHeight.spec.ts` (4 ejercicios + RIR: scroll al final deja
"Añadir ejercicio" fully sobre la píldora, var == altura real ±1px, chips
≥44px medidos).

## G3. Historial sin flag isPopping (commit `859a24d`)

**Problema:** `isPopping.current` quedaba en `true` cuando un popstate no
cambiaba view/settings (cerrar perfil con Atrás) → la siguiente navegación no
hacía pushState → un Atrás posterior desde el workout sacaba de la app.

**Cambios** (`App.tsx`): eliminado `isPopping` (0 referencias restantes). El
efecto de historial compara `window.history.state` con `{view, settings}` y
solo escribe si difieren (pestañas: replaceState; workout/program/exercises/
settings: pushState). Tras un pop, el entry del browser ya coincide con el
render, así que se escribe solo en navegación genuina.

**Tests:** `tests/e2e/profileBackNav.spec.ts` (abrir perfil → Atrás → iniciar
workout → Atrás → Home dentro de la app, URL intacta). Control negativo:
con el código viejo (stash) el test FALLA (sale de la app); con el fix pasa.
`flatHistory.spec.ts` sigue verde.

## G4. Infra e2e (commit `5db9d18`)

**Problema:** `test:e2e` corría sobre dist posiblemente viejo (mordió en G2: el
e2e medía 36px hasta reconstruir) y el timeout de 30s era menor que la espera
SW de 45s del spec offline.

**Cambios:** `package.json`: `"pretest:e2e": "npm run build"` y
`"verify:full": "npm run verify && npm run test:e2e"`;
`playwright.config.ts`: timeout 30s → 60s; `test.setTimeout(120000)` en
`offlineShell.spec.ts` y `swUpdate.spec.ts`.

**Verificación:** `npm run test:e2e -- <spec>` muestra `pretest:e2e` +
`Precaching 61` antes de correr; specs SW verdes con los nuevos timeouts.

## G5. Service Worker critical/lazy + waitUntil + ConfirmModal (commit `63a95f0`)

**Problema:** un solo asset fallido volteaba todo el install; la revalidación
podía cortarse al suspender el worker; el banner de update usaba
`window.confirm` nativo.

**Cambios:**
- `scripts/generate-sw-precache.mjs`: separa CRITICAL (/, /index.html,
  /manifest.json + assets referenciados por dist/index.html y sus imports
  estáticos transitivos; dinámicos `import(` excluidos por construcción) de
  LAZY (resto). Helpers exportados (`extractHtmlAssetRefs`,
  `extractStaticImportRefs`, `splitCriticalLazy`) con `main()` protegido.
  Valida marcadores y falla si el set crítico queda vacío.
- `public/sw.js`: marcadores `__BUILD_CRITICAL_URLS__`/`__BUILD_LAZY_URLS__`;
  el install falla solo si falla CRITICAL; LAZY con `Promise.allSettled` + 1
  reintento, logueo y fallback al runtime cache; `trimCache` sigue sin tocar
  precacheados (CRITICAL + LAZY + OPTIONAL); `shellHandler` y
  `staleWhileRevalidate` reciben el evento y usan
  `event.waitUntil(networkPromise)` en la rama cacheada.
- `App.tsx`: banner reemplaza `window.confirm` por `ConfirmModal` lazy en
  Suspense (`title=updateConfirmTitle` — nueva clave es/en —,
  `description=updateConfirmActiveWorkout`, confirm=Actualizar, cancel=Cancelar).
  `tests/e2e/swUpdate.spec.ts` actualizado al flujo modal (cancelar no recarga,
  aceptar sí).

**Build real:** `Precaching 61 build assets (7 critical + 54 lazy)`; críticos =
entry js/css + vendor-react/icons/firebase-*. **Tests:**
`swPrecacheSplit.test.ts` (4/4: refs HTML, estáticos vs dinámicos minificados,
split con fixture, rechazo sin refs), `swOffline.test.ts` extendido a 8/8 (LAZY
fallido NO aborta + exatamente 2 intentos; CRITICAL sí aborta — preexistente —;
`waitUntil` invocado en navegación y en asset estático, con revalidación a
"fresh asset"). `offlineShell` sigue verde.

## G6. Aviso único de notificaciones tras el primer descanso (commit `3a14a36`)

**Problema:** el permiso solo se pedía desde Ajustes → casi nadie lo activaba.

**Cambios:**
- `hooks/useTimer.ts`: al completar naturalmente un descanso (rama que apaga el
  timer; los skips nunca llegan ahí — producen el mismo estado terminal por
  otra vía), dispara `ironlog:rest-completed`.
- `components/ui/RestTimerOverlay.tsx`: escucha el evento y muestra UNA vez un
  aviso no bloqueante (`role="status"`, sin backdrop) con Activar / Ahora no.
  Solo web (`!Capacitor.isNativePlatform()`), solo si `Notification.permission
  === 'default'` y sin flag `il_notif_prompted` (se setea al mostrar, así
  "Ahora no" no lo repite). "Activar" llama
  `requestTimerNotificationPermission()` desde el click (gesto de usuario). El
  aviso vive fuera del ciclo del timer (sobrevive a la desactivación).
- Nuevas claves TRANSLATIONS es/en: `notifPromptTitle`, `notifPromptEnable`,
  `notifPromptLater`. Botones `min-h-[44px]`.

**Tests (comportamiento real):** `restNotifPrompt.test.tsx` 5/5 (aparece + flag;
"Ahora no" lo entierra; "Activar" pide permiso; nativo no muestra; granted/
denied no muestran) + 1 en `timerNotifications.test.ts` (el `useTimer` real
anuncia el evento al completar y calla ante skip).

## G7. Overflow a 390x844 y 360x800 (commit `aaddd35`)

**Riesgo:** los 32 cambios `text-[10px]` → `text-xs` de F7 podían desbordar
textos en pantallas chicas.

**Test** (`tests/e2e/overflow.spec.ts`, 2/2 viewports): con perfil de ejemplo
(sesión freestyle de 4 ejercicios + RIR + píldora visible), verifica en Home,
Workout, History, Stats y Settings (las 4 tabs) que: documento y contenedores
(`#tut-exercise-list`, `main`, `#root`, diálogos) tienen `scrollWidth ≤
clientWidth + 1`, y que ningún `button`/`a`/`label`/etiqueta de nav tiene texto
recortado por overflow (excluyendo `text-overflow: ellipsis` intencional y
nodos ocultos/vacíos).

**Resultado:** sin desbordes ni recortes en ninguna vista/viewport → **cero
cambios de clases necesarios**; el piso tipográfico queda intacto. Nota honesta:
History/Stats se verificaron en estado vacío (sembrar IndexedDB con logs queda
fuera de alcance); el riesgo F7 cubierto es el de layout/texto, verificado.

---

## Correcciones a `docs/AUDIT_FOLLOWUP_REPORT.md` (aplicadas en G8)

| # | Línea original (F5/F4) | Corrección verificada |
|---|---|---|
| 1 | F5: modales "envueltos en `<Suspense>` **y render condicional cuando están abiertos**" | Solo se agregó Suspense: SYNC CONFLICT (`App.tsx:857`) y FORCE SYNC (`App.tsx:914`) se montan **siempre** con `isOpen` por props, sin `{cond && …}` (a diferencia del FEEDBACK modal, que sí es condicional). |
| 2 | F4: "`controllerIdentity` (identidades estables de `handleSetUpdate`/`toggleSetComplete`/**`handleSetComplete`**…)" | El test cubre solo `handleSetUpdate` + `toggleSetComplete`: `handleSetComplete` no es parte del controller, es un `useCallback` local de `views/WorkoutViewImpl.tsx:253`. |

## Resultado de los 4 comandos (rama v3, 2026-10-01)

- `npm run build`: OK — `Precaching 61 build assets (7 critical + 54 lazy,
  cache 6aab38f2c17c)`.
- `npm run test:run`: **52 archivos / 251 tests**, todo verde.
- `npm run lint:a11y`: 0 errores.
- `npx playwright test`: **17/17** (5 criticalJourneys + finishFlow 2 + resto
  F2/F8/G2/G3/G5/G7).

Reglas respetadas: sin tocar `programs/`, `syncService`, `syncHelpers`,
`workoutCompletionService`, `firestore.rules`; sin abrir `.env` (el archivo
`env` copiado por el dueño quedó ignorado vía `/env` en `.gitignore`);
sin dependencias nuevas (Capacitor sin tocar, por G9-solo-debug); texto nuevo
en TRANSLATIONS; sin ternarios `lang === 'es'` nuevos.

## Pendiente de verificar en dispositivo real

Hereda todo lo de `AUDIT_FOLLOWUP_REPORT.md` §Pendiente, más lo nuevo de G1–G7:

1. **G1:** chunk corrupto real (build truncado) → mensaje local + Reintentar;
   crash real por estado corrupto → backup exportable (probar con sesión
   sembrada inválida).
2. **G2:** píldora + teclado IME real (offset, dock bajo header, padding
   compensado con alturas reales de dispositivo).
3. **G3:** botón Atrás físico/gestos Android en el flujo perfil → workout.
4. **G5:** install con asset LAZY fallando en red móvil (reintento + runtime
   cache); modal de update con sesión activa en Chrome Android.
5. **G6:** aviso post-descanso en PWA instalada (permiso default), tap Activar
   con gesto real, y silencio total en el APK nativo.
6. **G7:** 360x800 físico (densidad real, fuentes del sistema) y
   History/Stats CON datos (gráficos + listas largas).
7. **G9:** instalación y smoke test del APK en el celular del dueño.

## Bloqueos

Ninguno: las 7 tareas se verificaron con tests de comportamiento real. Deuda
consciente heredada: ternarios `lang === 'es'` históricos (~50 archivos) y
Fase 7 Capacitor sin hacer (el APK G9 es solo-debug sobre Capacitor 5 / SDK
actuales).
