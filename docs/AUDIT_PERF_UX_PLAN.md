# Plan de mejoras GainsLab (IronLog-React): performance, UX y UI/UX

| | |
|---|---|
| **Repo** | `gabsvm/IronLog-React` |
| **Rama auditada** | `agent/gainslab-pwa-master-polish-v1` |
| **Rama de trabajo sugerida** | `agent/gainslab-audit-fixes-v1` (creada desde la anterior) |
| **Tipo de auditoría** | Lectura estática de código (no se ejecutó ni se midió en dispositivo) |
| **Idioma de la app** | Español por defecto, inglés soportado |

**Leyenda de confianza**

- **[C]** Confirmado leyendo el código.
- **[V]** Probable, pero hay que verificarlo en dispositivo o con una medición antes de darlo por cierto.

---

## 0. Reglas para quien ejecute este plan (humano o agente)

1. Trabajar **por fases, en orden**. No empezar una fase si la anterior no pasa `npm run build`, `npm run test:run` y `npm run lint:a11y`.
2. **Leer cada archivo completo antes de editarlo.** Los fixes aplicados en lote ya revirtieron código correcto en otros proyectos. Al cerrar cada fase correr `git diff --stat` y confirmar que solo cambió lo que la fase declara.
3. **Un commit por tarea** con el ID del plan en el mensaje (por ejemplo `D1: flush de null en store`).
4. **No tocar lógica de negocio**: motor de programas KONG (`programs/`), merge de sync (`services/syncService`, `syncHelpers`), `workoutCompletionService`, ni reglas de Firestore.
5. **No abrir ni imprimir `.env`.** Ver tarea D5.
6. Todo texto nuevo visible al usuario va en `TRANSLATIONS` (`constants/`), en español e inglés. No agregar más ternarios `lang === 'es' ? … : …` inline.
7. No agregar dependencias salvo las que el plan nombra explícitamente.
8. Respetar los modos de efectos existentes (`data-effects="balanced|reduced"`) y `prefers-reduced-motion`.
9. Cada tarea trae **criterios de aceptación**. Si no se pueden cumplir, el agente debe detenerse y reportar en vez de improvisar.

---

## 1. Resumen y priorización

| ID | Sev. | Área | Archivo(s) principal(es) | Esfuerzo |
|---|---|---|---|---|
| D1 | P0 | Integridad de datos | `lib/store.ts` | S |
| D2 | P0 | Integridad de datos | `components/workout/SetRow.tsx` | S |
| D3 | P0 | UX de carga | `components/workout/SetRow.tsx` | S |
| D4 | P0 | Bug de timer | `components/workout/SetRow.tsx` (`HoldTimer`) | S |
| D5 | P0 | Seguridad | `.env`, `.gitignore` | S + manual |
| D6 | P1 | Datos / UX | `hooks/useWorkoutController.ts` | S |
| S1 | P0 | Offline / SW | `public/sw.js` | M |
| S2 | P0 | Actualizaciones | `public/sw.js`, `index.tsx`, `App.tsx` | M |
| S3 | P1 | Offline / SW | `public/sw.js`, `scripts/generate-sw-precache.mjs` | S |
| S4 | P2 | Sync | `public/sw.js`, `services/backgroundSync` | S (decisión) |
| R1 | P1 | Re-renders | `hooks/useWorkoutController.ts`, `views/WorkoutViewImpl.tsx` | M |
| R2 | P1 | Re-renders | `context/AppContext.tsx` | M |
| R3 | P1 | Re-renders | `RestTimerOverlay.tsx`, `Layout.tsx` | S |
| R4 | P1 | Re-renders | `components/layout/Layout.tsx` | S |
| R5 | P2 | Timer | `hooks/useTimer.ts` | M |
| R6 | P3 | Fluidez | `components/ui/RestTimerOverlay.tsx` | S |
| L1 | P1 | Carga | `index.html`, `index.tsx` | S |
| L2 | P2 | Carga | `components/layout/Layout.tsx` | S |
| L3 | P2 | Carga | `views/WorkoutViewImpl.tsx`, Home | S |
| L4 | P2 | Transiciones | `App.tsx` | M |
| L5 | P2 | CSS | `index.css`, `native-performance.css`, `tailwind.config.js` | M |
| L6 | P2 | Arranque | `index.html` | S |
| U1 | P0 | UX principal | `RestTimerOverlay.tsx` | M |
| U2 | P1 | Permisos | `hooks/useTimer.ts` | S |
| U3 | P1 | Navegación | `App.tsx`, `Layout.tsx` | M |
| U4 | P2 | UX | `WorkoutViewImpl.tsx`, `WarmupModal` | S |
| U5 | P1 | Textos y errores | `App.tsx`, `AppContext.tsx` | S |
| U6 | P1 | Recuperación | `index.tsx` (`ErrorBoundary`) | M |
| U7 | P2 | Gestos | `index.css`, `native-performance.css` | S |
| U8 | P2 | Gestos | `SetRow.tsx` | S |
| A1 | P1 | Accesibilidad | varios | M |
| A2 | P1 | Contraste | `Layout.tsx`, `SetRow.tsx`, `index.css` | M |
| A3 | P1 | Accesibilidad | `WorkoutViewImpl.tsx`, `SetRow.tsx`, `Layout.tsx` | S |
| A4 | P2 | Tema claro | `index.css` | M |
| A5 | P2 | i18n | `AppContext.tsx`, `index.html` | S |
| P1 | P1 | Plataforma | `android/`, `package.json` | L (rama aparte) |

Esfuerzo: S = menos de 2 h, M = medio día, L = más de 1 día.

---

## Fase 0: Preparación y baseline

**Objetivo:** poder demostrar mejoras con números.

1. Crear la rama de trabajo: `git checkout -b agent/gainslab-audit-fixes-v1 agent/gainslab-pwa-master-polish-v1`.
2. Correr y guardar la salida de: `npm ci`, `npm run build`, `npm run test:run`, `npm run lint:a11y`.
3. Anotar en `docs/AUDIT_BASELINE.md`:
   - Tamaño (gzip) de cada chunk que lista Vite, en especial `index-*.js`, `vendor-react`, `vendor-firebase-*`, `vendor-motion`.
   - Lighthouse móvil (modo PWA) sobre `npm run preview`: LCP, TBT, CLS, y si pasa "instalable" y "funciona offline".
   - Con React DevTools Profiler: cuántos componentes se re-renderizan al editar el peso de una serie y al completar una serie (con 4 ejercicios de 4 series).
4. **Habilitar el service worker bajo Playwright.** Hoy `index.tsx` no registra el SW si `navigator.webdriver` es `true`, así que no se puede testear offline en e2e. Agregar un flag explícito (por ejemplo `window.__E2E_ENABLE_SW__ === true` o `?sw=1`) que anule esa condición. Solo test, no producción.

**Aceptación:** existe `docs/AUDIT_BASELINE.md` con los números y el flag de SW para e2e funciona.

---

## Fase 1: Integridad de datos y bugs de carga de series (P0)

### D1: `flushStorePersistence` no escribe `null` [C]

**Archivo:** `lib/store.ts`

**Problema:** al terminar o descartar un workout, `setActiveSession(null)` programa un `db.set(..., null)` a 500 ms. Si la app pasa a segundo plano antes, `flushStorePersistence` cancela el timer y solo escribe si `activeSession !== null`. El `null` nunca llega a IndexedDB y al reabrir reaparece la sesión ya terminada (lo mismo con `activeMeso`).

**Cambio:**

- Llevar flags `sessionDirty` / `mesoDirty`: se ponen en `true` en cada `setActiveSession` / `setActiveMeso` y en `false` cuando se escribe.
- `flushStorePersistence` escribe cada valor **si su flag está sucio**, aunque sea `null`.
- No escribir nada mientras `isStoreLoading` sea `true`: antes de `_init` el estado es `null` y un flush temprano pisaría la sesión guardada.
- Verificar en `utils/db` que `db.set(key, null)` es válido. Si no, usar el método de borrado para `null`.

```ts
let sessionDirty = false;
let mesoDirty = false;

export const flushStorePersistence = () => {
  if (useStore.getState().isStoreLoading) return;
  if (sessionTimeout) { clearTimeout(sessionTimeout); sessionTimeout = null; }
  if (mesoTimeout) { clearTimeout(mesoTimeout); mesoTimeout = null; }
  const { activeSession, activeMeso } = useStore.getState();
  if (sessionDirty) { sessionDirty = false; void db.set('il_session_v16', activeSession); }
  if (mesoDirty) { mesoDirty = false; void db.set('il_meso_v16', activeMeso); }
};
```

**Aceptación / test (vitest + `fake-indexeddb`):**

- Setear una sesión, esperar el debounce, luego `setActiveSession(null)` y disparar `pagehide` antes de 500 ms. La clave `il_session_v16` debe quedar en `null` (o borrada).
- Un `pagehide` disparado **antes** de que `_init` termine no modifica lo guardado.
- `resetStorePersistence` sigue limpiando timers y flags.

### D2: swipe/check no confirma lo escrito en los inputs [C]

**Archivo:** `components/workout/SetRow.tsx`

**Problema:** peso, reps y RIR viven en estado local y solo se confirman en `onBlur`. Al completar con swipe (que no hace blur) con el teclado abierto, la serie se marca completada y se dispara el descanso antes de guardar el valor tipeado.

**Cambio:**

- Crear `flushPendingFields()` que compara `localWeight/localReps/localRpe` contra `set.*` y llama `onUpdate` por cada diferencia.
- Llamarla **antes** de `onToggleComplete` en: botón check (las 3 variantes de render), `onSwipeTouchEnd` y cualquier otro camino de completado.
- Opcional: reactivar `scheduleCommit` (hoy es código muerto) en `onChange` con 180 ms para que lo tipeado llegue al store sin esperar el blur.

**Aceptación / test (RTL):**

- Tipear `80` en peso sin blur y hacer click en el check: `onUpdate(…,'weight','80')` se llama **antes** que `onToggleComplete`.
- Mismo test simulando el swipe con eventos touch.

### D3: el blur del peso fuerza el foco a reps [C]

**Archivo:** `components/workout/SetRow.tsx` (`handleWeightBlur`)

**Problema:** al perder foco el peso, siempre se enfoca reps a los 80 ms, aunque el usuario haya tocado otra cosa. Abre el teclado y mueve el scroll sin que se pidiera.

**Cambio:**

- Quitar el auto-avance en `onBlur`.
- Avanzar a reps solo con `onKeyDown` de `Enter` (ya está `enterKeyHint="next"`).
- Si se mantiene algún auto-avance, condicionarlo a que `event.relatedTarget` sea `null` y que la tecla haya sido Enter/Next.

**Aceptación / test:** tocar el check o un input de otra fila después de editar el peso **no** mueve el foco a reps. Enter en peso sí enfoca reps.

### D4: `HoldTimer` dispara start y stop en un solo toque [V]

**Archivo:** `components/workout/SetRow.tsx` (`HoldTimer`)

**Problema:** los botones Play/Stop tienen `onTouchStart` **y** `onClick`. En táctil, `touchstart` inicia el timer, React re-renderiza el mismo `<button>` con el handler de Stop, y el click sintetizado posterior lo detiene en 0 s.

**Cambio:** dejar un solo evento (`onClick`, o `onPointerDown` con `preventDefault`). Eliminar `onTouchStart`.

**Aceptación:** en un dispositivo táctil (o con eventos `touchstart`+`click` simulados) Play inicia y el timer sigue corriendo hasta que se toca Stop.

### D5: `.env` commiteado en repo público [C]

**Responsabilidad:** parte manual del dueño del repo, parte del agente.

- **Manual (obligatorio):** abrir `.env` en local y **rotar toda clave secreta** que contenga (APIs de IA, claves de servidor, etc.). Las claves web de Firebase están pensadas para ser públicas, pero entonces `firestore.rules` debe ser estricto. Evaluar limpiar el historial (`git filter-repo` o BFG) y asumir que lo ya publicado está comprometido aunque se limpie.
- **Agente (sin leer el archivo):**
  1. `git rm --cached .env`.
  2. Verificar que `.gitignore` incluya `.env` y `.env.*` excepto `.env.example`.
  3. Agregar un paso `scripts/check-no-secrets.mjs` (o equivalente) al script `verify` que falle si `.env` está trackeado.

**Aceptación:** `git ls-files .env` no devuelve nada y `npm run verify` falla si alguien lo vuelve a agregar.

### D6: falsos PR si el índice de 1RM no cargó [V]

**Archivo:** `hooks/useWorkoutController.ts`

**Problema:** `historicalBest1RM` empieza vacío y se llena de forma asíncrona con el worker. Si el usuario termina antes (o el worker falla), `detectPRs` compara contra `0` y marca confeti falso.

**Cambio:** exponer un estado `historicalReady`. En `detectPRs`, si no está listo, **no** declarar PR, o esperar al worker con un timeout corto antes de decidir.

**Aceptación / test:** con `historicalReady = false`, `detectPRs()` devuelve `false`. Con datos listos, mantiene el comportamiento actual.

---

## Fase 2: Service worker y flujo de actualización

### S1: fallback offline roto y navegación sin timeout [C]

**Archivo:** `public/sw.js` (`networkFirst`)

**Problemas:**

- `return cache.match(request) || cache.match('/index.html') || …`: `cache.match()` devuelve una **Promise**, siempre truthy, por lo que los fallbacks nunca se usan. Si la URL no está en cache (por ejemplo el atajo `/?action=start&source=shortcut`, que tiene query), el navegador muestra error offline.
- Sin timeout: con señal mala en el gimnasio, la app espera a que falle la red.

**Cambio (recomendado):** tratar las navegaciones como **app shell cache-first**.

```js
const shellHandler = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cached =
    (await cache.match(request, { ignoreSearch: true })) ||
    (await cache.match('/index.html')) ||
    (await cache.match('/'));
  const network = fetch(request)
    .then((res) => { if (shouldCacheResponse(res)) cache.put('/index.html', res.clone()); return res; })
    .catch(() => null);
  return cached || (await network) || (await cache.match('/offline.html')) || Response.error();
};
```

Usar `await` en cada `cache.match`. No usar `AbortController` sobre requests de navegación (el modo `navigate` se reescribe en `fetch(request, init)`); si se quiere timeout, usar `Promise.race`.

**Aceptación / e2e (Playwright con el flag de SW):**

1. Cargar la app online una vez para instalar el SW.
2. `context.setOffline(true)`.
3. Navegar a `/` y a `/?action=start&source=shortcut`: ambas cargan la app, no la página de error del navegador.

### S2: actualizaciones forzadas que recargan en pleno workout [C]

**Archivos:** `public/sw.js`, `index.tsx`, `App.tsx`

**Problema:** `sw.js` llama `self.skipWaiting()` en `install` y `clients.claim()` en `activate`. Entonces nunca hay un SW en espera, el banner de "Nueva versión" de `App.tsx` no tiene sentido, y el `controllerchange` de `index.tsx` hace `window.location.reload()` sin consentimiento, incluso con una sesión activa. Además `activate` borra la cache anterior, así que una pestaña abierta con la versión vieja falla al cargar chunks lazy.

**Cambio:**

1. Quitar `self.skipWaiting()` de `install`. Dejarlo solo en el handler del mensaje `SKIP_WAITING`.
2. En `index.tsx`, recargar en `controllerchange` **solo si** el usuario tocó "Actualizar" (flag) **y** no hay `activeSession` en `useStore`. Si hay sesión activa, diferir la recarga hasta que termine o muestre un aviso claro.
3. Capturar `vite:preloadError`: `window.addEventListener('vite:preloadError', (e) => { e.preventDefault(); /* mostrar banner de actualizar */ })` para no dejar la UI en blanco cuando falla un chunk viejo.
4. Opcional: conservar la cache de la versión anterior durante una generación para dar margen a pestañas abiertas.

**Aceptación:** con una sesión activa y un SW nuevo disponible, no hay recarga automática, aparece el banner, y tocar "Actualizar" con sesión activa pide confirmar o espera al final del workout.

### S3: precache frágil y crecimiento de cache [C]

**Archivos:** `public/sw.js`, `scripts/generate-sw-precache.mjs`

- `cache.addAll(PRECACHE_URLS)` es atómico: si **una** URL falla (por ejemplo `/offline.html` faltante), no se cachea nada y solo hay un `console.warn`. Separar en "shell crítico" (obligatorio, falla la instalación si no está) y "opcional" (`Promise.allSettled` con `cache.add`).
- `staleWhileRevalidate` cachea **todo** GET same-origin sin límite. Acotar a `/assets/*` (hasheados), fuentes e iconos, con un tope de entradas.
- Verificar que existan en la raíz `/icon-192.png`, `/icon-512.png` y `/offline.html` (el manifest apunta a `assets/icons/...` y el SW a rutas absolutas).

**Aceptación:** una URL opcional inexistente no impide que el SW se instale. La cache no crece con respuestas ajenas a la app.

### S4: Background Sync que no sincroniza con la app cerrada (decisión) [C]

**Archivos:** `public/sw.js`, `services/backgroundSync`

`sync` y `periodicsync` solo hacen `postMessage` a ventanas abiertas. Si no hay ventana, no pasa nada. Elegir una de dos:

- **(a)** Aceptarlo: mantener el flush al volver a primer plano (ya existe en `AppContext`) y quitar el registro de `periodicsync` o documentar que es "mejor esfuerzo".
- **(b)** Mover el flush de la cola al SW leyendo IndexedDB (más trabajo, más riesgo).

**Aceptación:** decisión escrita en `docs/` y el código coincide con ella (sin registrar capacidades que no cumplen su función).

---

## Fase 3: Rendimiento de renders durante el workout

**Meta global de la fase:** al editar un input o completar una serie, **solo** se re-renderiza esa fila (y lo mínimo imprescindible). Medir con el Profiler contra el baseline de la Fase 0.

### R1: handlers inestables anulan `React.memo` de las tarjetas [C]

**Archivos:** `hooks/useWorkoutController.ts`, `views/WorkoutViewImpl.tsx`

**Problema:**

- El hook devuelve un objeto nuevo en cada render, y `handleSetComplete` y `handleReorder` en `WorkoutViewImpl` dependen de `ctrl`.
- `handleSetComplete` además depende de `sessionExercises`, que cambia en cada edición. Resultado: las props de `SortableExerciseCard` cambian y todas las tarjetas se re-renderizan.
- `toggleSetComplete` calcula el descanso y el superset con el `sessionExercises` del closure (posible estado viejo si hay doble toque rápido).

**Cambio:**

- En `toggleSetComplete`, leer `useStore.getState().activeSession` y `activeMeso` dentro de la función en vez de cerrar sobre ellos. Dependencias: solo `setActiveSession` y `setRestTimer`.
- En `WorkoutViewImpl`, desestructurar los callbacks del hook y usarlos en las dependencias (no `ctrl`).
- `handleSetComplete` y la lógica de "avanzar al siguiente ejercicio" leen el estado actual desde `useStore.getState()`.
- Opcional: `useMemo` del objeto devuelto por el hook para las partes de UI.

**Aceptación / test:** test de render-count (por ejemplo con `React.Profiler`): editar el peso de la serie 1 del ejercicio A **no** re-renderiza las tarjetas B, C y D.

### R2: `localLastUpdated` fuerza re-render global cada 3 s [C]

**Archivo:** `context/AppContext.tsx`

**Problema:** el debounce "A" (cada 3 s tras cualquier cambio de `activeSession`) llama `setLocalLastUpdated(now)`. Ese estado está en `contextValue` y se persiste con `usePersistedState(..., 0)` (debounce 0), así que cada cambio recrea el contexto grande y escribe a IndexedDB. Todos los consumidores de `useApp()` se re-renderizan durante el entrenamiento.

**Cambio:**

- Sacar `localLastUpdated` (y `localSectionSyncMeta`) de `contextValue`: guardarlos en una `ref` y exponerlos con un getter o un contexto separado "SyncMeta".
- Persistir con debounce de 1000 ms o más.

**Aceptación:** durante un workout, la actualización de `localLastUpdated` no re-renderiza `WorkoutView`, `Layout` ni `RestTimerOverlay`.

### R3: consumidores que usan el contexto grande sin necesitarlo [C]

**Archivos:** `components/ui/RestTimerOverlay.tsx`, `components/layout/Layout.tsx`, `hooks/useWorkoutController.ts`

- `RestTimerOverlay` usa `useApp()` solo para `lang`: cambiar a `useAppPreferences()`.
- `Layout` usa `useApp()` para `isOnline`, `syncStatus`, `setProgram`: crear un contexto/selector "sync status" separado y usar `setProgram` solo donde haga falta.
- Revisar el resto de `useApp()` en `views/` y `components/` y migrar los que solo usan preferencias/config (ya existen `useAppPreferences`, `useAppConfig`, `useTutorial`).

**Aceptación:** un cambio en `logs` o `syncStatus` no re-renderiza componentes que no los usan (verificar con el Profiler).

### R4: `NavBtn` definido dentro de `Layout` [C]

**Archivo:** `components/layout/Layout.tsx`

**Problema:** al ser un componente declarado dentro de otro, cambia de identidad en cada render: React desmonta y vuelve a montar los botones del nav cada vez que `Layout` se re-renderiza (online/sync/sesión), perdiendo transiciones y foco.

**Cambio:** mover `NavBtn` fuera del componente, tipado con props (`id`, `label`, `icon`, `isActive`, `onSelect`) y envolverlo en `React.memo`. Agregar `aria-current="page"` (ver A3).

**Aceptación:** al cambiar `isOnline`, los botones del nav no se desmontan (test de montaje/desmontaje o inspección con el Profiler).

### R5: efectos secundarios dentro del updater de `setTimer` [C]

**Archivo:** `hooks/useTimer.ts`

**Problema:** `handleTick` ejecuta sonido, hápticos, `Notification`, `document.title` y `postMessage` dentro de `setTimer(prev => …)`. Los updaters deben ser puros: con `StrictMode` (activo en `index.tsx`) y en modo concurrente pueden ejecutarse más de una vez.

**Cambio:** mantener el último estado en una `ref`, calcular el siguiente estado fuera del updater, ejecutar los efectos **una sola vez** cuando se detecta el cruce a 0, y después llamar `setTimer` con un valor plano.

**Aceptación / test:** con `StrictMode`, al llegar a 0 el sonido/notificación se disparan exactamente una vez.

### R6: anillo del timer entrecortado [C]

**Archivo:** `components/ui/RestTimerOverlay.tsx` (`CircularTimer`)

El estado avanza cada 1 s y la transición dura 200 ms, por lo que el anillo "salta". Cambio mínimo: `transition: stroke-dashoffset 1s linear`. Cambio mejor: una animación CSS de `stroke-dashoffset` por la duración total con `animation-delay` negativo igual al tiempo transcurrido (cero re-renders por segundo).

**Aceptación:** el anillo se mueve de forma continua (revisión visual).

---

## Fase 4: Carga, arranque y CSS

### L1: Google Fonts bloquea el render y rompe el "offline-first" [C]

**Archivos:** `index.html`, `index.tsx`

- Instalar `@fontsource-variable/inter` (única dependencia nueva permitida en este plan) e importarlo en `index.tsx`.
- Quitar los `<link>` a `fonts.googleapis.com` / `fonts.gstatic.com` de `index.html` y los hosts de fuentes de `sw.js`.
- Definir el stack en Tailwind (`fontFamily.sans`) con fallbacks de sistema.

**Aceptación:** `npm run build` no referencia hosts externos de fuentes. Lighthouse ya no marca "render-blocking resources" por fuentes. Offline, el texto sigue con Inter.

### L2: `ProfileSheet` y `QuickStartSheet` se cargan en el bundle inicial [C]

**Archivo:** `components/layout/Layout.tsx`

Pasarlos a `React.lazy` con `Suspense fallback={null}` y precargarlos en idle (`lib/idle.ts`).

**Aceptación:** el tamaño del chunk de entrada baja respecto al baseline y abrir el perfil no muestra parpadeo.

### L3: precarga de módulos que se abren al tocar [V]

**Archivos:** `views/WorkoutViewImpl.tsx`, `views/HomeViewImpl.tsx`

- `WorkoutSortableList` está en `lazy` con `fallback={null}`: la pantalla principal puede aparecer vacía. Precargarlo (junto con `SortableExerciseCardImpl`) en idle desde Home.
- `ExerciseSelector`, `WarmupModal`, `ExerciseDetailModal`: precargar en idle cuando se monta `WorkoutView`.

**Aceptación:** al abrir el workout, la lista aparece sin fallback vacío en una red lenta simulada.

### L4: View Transitions + `startTransition` [V]

**Archivo:** `App.tsx` (`withTransition`, `setView`)

El callback de `startViewTransition` debe aplicar el cambio de DOM de forma síncrona. Con `startTransition` el render se difiere y la animación puede no capturar el cambio.

**Cambio:**

- Precargar el chunk de la vista destino antes de iniciar la transición.
- Dentro del callback usar `flushSync(() => setViewState(newView))`.

**Aceptación:** la transición entre pestañas anima de forma consistente en Chrome Android y no deja pantalla en blanco al ir a una vista aún no cargada.

### L5: selectores CSS caros y blur en PWA [C]

**Archivos:** `index.css`, `native-performance.css`, `tailwind.config.js`

- Reemplazar `[class*='blur-[']`, `[class*="bg-red-"]`, `[class*='transition-all']` por variantes explícitas. Ejemplo con plugin de Tailwind: `addVariant('effects-reduced', '[data-effects="reduced"] &')` y usar `effects-reduced:backdrop-blur-none` donde aplique.
- Corregir la regla muerta `svg[width='152']` (el anillo hoy usa 170).
- En el PWA, usar la detección de gama baja (`resolveEffectsMode` ya considera `deviceMemory`/`hardwareConcurrency`) para que dispositivos modestos arranquen en `reduced` sin pasar por Ajustes.

**Aceptación:** sin selectores de subcadena sobre `class` en los CSS globales. Misma apariencia visual en modo `balanced`.

### L6: limpieza de `index.html` [C]

**Archivo:** `index.html`

- `window.onerror` muestra un overlay a pantalla completa ante **cualquier** error global (incluidos errores no críticos o `Script error.`). Limitarlo a fallos de arranque (antes del primer montaje de React) y usar `textContent` en vez de `innerHTML` para no inyectar el mensaje como HTML.
- Registrar `unhandledrejection` solo en consola.
- Quitar el CSS heredado que no se usa (`.glass`, `.dark .glass`, `.scroll-container`, `.animate-slideUp`) si está duplicado en `index.css`.

**Aceptación:** un error transitorio posterior al arranque no tapa la app.

---

## Fase 5: Experiencia de usuario

### U1: el descanso debe ser una "píldora", no un modal [C]

**Archivo:** `components/ui/RestTimerOverlay.tsx`

**Problema:** tras cada serie se abre una hoja inferior con fondo oscuro y blur a pantalla casi completa. Hay que minimizarla para cargar la serie siguiente. Declara `aria-modal="false"` pero captura los toques.

**Cambio:**

- Estado por defecto: **píldora flotante no modal** sobre el nav (tiempo restante, −10 s, +30 s, saltar). No bloquea la pantalla ni usa `backdrop-blur`.
- Tocar la píldora expande el panel actual (anillo, "siguiente", presets y calificación de esfuerzo).
- Mantener la calificación Fácil/OK/Duro accesible desde la píldora expandida cuando `showRIR`/`rpEnabled` estén activos.
- Reemplazar la heurística de tres `useEffect` interdependientes (`minimized`, `autoMinimized`, `keyboardOffset`) por un estado simple: `compact | expanded`, y subir la píldora con `visualViewport` solo para evitar el teclado.
- Opción en Ajustes: "Descanso: compacto / completo" (por defecto compacto).

**Aceptación:** tras completar una serie se puede tocar el input de la siguiente **sin ningún toque extra** para cerrar nada. Se mantiene el aviso sonoro/háptico al terminar.

### U2: permiso de notificaciones al abrir la app [C]

**Archivo:** `hooks/useTimer.ts`

- Quitar `Notification.requestPermission()` del montaje. Pedirlo la primera vez que el usuario inicia un descanso (con un texto previo que explique para qué) o desde un interruptor en Ajustes.
- En web, mostrar la notificación del sistema **solo si** `document.visibilityState !== 'visible'`.
- Nota para el equipo: en PWA móvil el worker se congela con la pantalla bloqueada, así que el aviso en segundo plano no es confiable. Documentarlo. En Capacitor ya existe la alarma nativa.

**Aceptación:** al instalar y abrir la app no aparece ningún diálogo de permisos. Con la app visible no hay notificación del sistema duplicada.

### U3: pila de historial inflada [C]

**Archivos:** `App.tsx`, `components/layout/Layout.tsx`

**Problema:** `App.tsx` hace `replaceState('#home')` al montar y luego el efecto de `[view, showSettings]` hace `pushState('#home')` de inmediato, y cada cambio de pestaña añade otra entrada. "Atrás" recorre todas las pestañas visitadas y hacen falta varios toques para salir. Además hay dos listeners de `popstate` (App y Layout).

**Cambio:**

- Pestañas del nav (home/history/nutrition/stats): `replaceState`.
- Pantallas de profundidad 2 (workout, program, exercises) y hojas (ajustes, perfil): `pushState`.
- No hacer `pushState` en el primer montaje.
- Unificar el manejo de `popstate` en un solo lugar.

**Aceptación / e2e:** abrir la app, cambiar entre 4 pestañas y presionar Atrás una vez sale de la app (o vuelve a la pestaña inicial), no recorre pestañas.

### U4: botón de calentamiento sin peso cargado [C]

**Archivos:** `views/WorkoutViewImpl.tsx`, `components/ui/WarmupModal`

El tutorial pide cargar el peso de la serie 1 *antes* de tocar el botón. Mejor: deshabilitar el botón (o mostrar una pista en línea) cuando `sets[0].weight` esté vacío, y quitar esa advertencia del tutorial.

**Aceptación:** sin peso en la serie 1, el botón comunica por qué no está disponible. Con peso, abre el modal con valores correctos.

### U5: textos técnicos y errores mudos [C]

**Archivos:** `App.tsx`, `context/AppContext.tsx`

- El diálogo "Sincronización Nube" lista claves internas (`activeMeso, nutritionLogs, …`). Mapear cada `DirtySyncSection` a una etiqueta legible en `TRANSLATIONS` (es/en).
- `executeForceSync` solo hace `console.error` en el error: mostrar un aviso de éxito y de fallo (toast o mensaje en línea).
- Traducir el título "Set Types" del tutorial y la etiqueta `aria-label="Previous"` del botón volver del workout (ver A3).
- Pedir confirmación o mostrar "Deshacer" al usar "Saltar sesión" (`handleSkipSession`).

**Aceptación:** ningún identificador interno visible en la UI. Un fallo de sincronización forzada se muestra al usuario.

### U6: `ErrorBoundary` sin salida segura [C]

**Archivo:** `index.tsx`

- Agregar un botón **"Exportar copia de seguridad"** antes de "Reiniciar datos". Debe funcionar sin depender del árbol de React ya roto: volcar las claves de IndexedDB (`il_*`) y `localStorage` a un `.json` descargable.
- Textos en el idioma del usuario (`navigator.language` / `il_lang_v1`), no mezcla "Reload App / Recargar".
- `minHeight: '100vh'` → `100dvh`.
- Mostrar el detalle técnico plegado por defecto.

**Aceptación:** ante un error crítico se puede descargar un backup antes de cualquier reset destructivo.

### U7: gestos del navegador y toques [C]

**Archivos:** `index.css`, `native-performance.css`

- `overscroll-behavior: contain` en `html`, `body` y `.scroll-container` para evitar que un tirón recargue el PWA instalado en medio del workout (hoy solo está en `native-shell`).
- `touch-action: manipulation` global en `button, [role='button'], a, input, select, textarea` (hoy solo en `native-shell`).

**Aceptación:** en Chrome Android (PWA instalada) tirar hacia abajo en las listas no dispara recarga.

### U8: swipe-para-completar demasiado fácil de activar [V]

**Archivo:** `components/workout/SetRow.tsx`

- Ignorar swipes que empiecen a menos de ~24 px del borde izquierdo (conflicto con el gesto de "atrás" de Android/iOS).
- Exigir que el movimiento sea claramente horizontal antes de mostrar el progreso (la condición actual solo cancela si domina el vertical **y** `|dx| < 15`).
- Usar `transform` vía `ref` en vez de `setSwipePct` en cada `touchmove`.
- Dar una alternativa accesible (el botón check ya existe: mantener su `aria-label`, ver A3).
- Aviso al completar un isométrico con cuenta regresiva (háptico/sonido cuando llega a 0).

**Aceptación:** scroll vertical con el dedo en diagonal no completa series. El gesto desde el borde izquierdo no las completa.

---

## Fase 6: UI y accesibilidad

### A1: áreas táctiles [C]

Objetivo: 44×44 px de área efectiva para controles de uso frecuente.

- Check de serie: 34 → 44 px (o 34 px visibles con `::after` de 44 px).
- Badge de tipo de serie: 28 px → área de 44 px.
- Botones del header del workout (`h-8 w-8`, "Terminar" `h-8`) y volver (`h-9`): a 44 px.
- Botón reset del `HoldTimer` (`w-7`).

**Aceptación:** inspección de DOM/Playwright: `getBoundingClientRect` ≥ 44 en los controles listados (el área puede venir del pseudo-elemento).

### A2: contraste y tamaño de texto [C/V]

- Nav inactivo `text-zinc-600` sobre `surface-base` da ≈ 2,5–2,6:1 (mínimo AA: 4,5:1). Usar el token `text-muted` (verificar ≥ 4,5:1) para texto.
- Evitar texto de 9–10 px para información. Piso recomendado: 11–12 px (etiquetas en mayúsculas pueden quedar en 11 px).
- Revisar `text-zinc-500` en descripciones (`text-[10px]`).

**Aceptación:** auditoría con axe/Lighthouse sin fallos de contraste en las vistas Home, Workout, History y Stats (modo oscuro).

### A3: nombres accesibles y semántica [C]

- Botón volver del workout: `aria-label` traducido ("Volver" / "Back") en lugar de `"Previous"`.
- Interruptores (`div`/`button` en "Aplicar a todas las series" y "Actualizar rutina"): usar `role="switch"` + `aria-checked` y que sean operables con teclado.
- Nav: `aria-current="page"` en el botón activo.
- Inputs de serie: `aria-label` ("Peso", "Repeticiones", "RIR") además del placeholder.
- Badge de tipo de serie: `aria-label` ("Serie 2, cambiar tipo").
- Check de serie: etiqueta constante ("Completar serie") + `aria-pressed`, sin cambiar el texto según el estado.
- Íconos decorativos: `aria-hidden="true"` (puede centralizarse en `Icon`).
- Banners de actualización/sync: `role="status"` con `aria-live="polite"`.

**Aceptación:** `npm run lint:a11y` sin errores nuevos. Prueba con lector de pantalla (TalkBack) en el flujo "completar una serie".

### A4: modo claro con acentos ilegibles [V]

**Archivo:** `index.css`

El tema claro solo remapea neutros con `!important`. Los acentos `text-primary-300/400` (lima) sobre fondo blanco tienen contraste muy bajo (~1,3:1).

**Cambio:** crear un token `--accent-text` (oscuro: `primary-400`; claro: `primary-900`, ≈ 6,6:1 sobre blanco) y reemplazar los usos de `text-primary-*` como **color de texto**. Migrar gradualmente los colores hexadecimales arbitrarios (`bg-[#17171b]`, etc.) a tokens para dejar de depender de reglas `!important` por clase.

**Aceptación:** capturas de Home y Workout en modo claro con texto de acento legible (≥ 4,5:1).

### A5: idioma [C]

- Actualizar `document.documentElement.lang` cuando cambia `lang` (hoy `index.html` fija `es`).
- Unificar `description`/`manifest` en un idioma coherente.
- Migrar gradualmente los ternarios inline de `lang` a `TRANSLATIONS` (empezar por `App.tsx`, `Layout.tsx`, `WorkoutViewImpl.tsx`, `SetRow.tsx`).

**Aceptación:** `lang` del `<html>` coincide con el idioma elegido.

---

## Fase 7: Plataforma Android (rama aparte, riesgo alto)

### P1: Capacitor 5 y `targetSdkVersion 33` [C]

`android/variables.gradle` tiene `targetSdkVersion = 33`, `compileSdkVersion = 33`. Con `@capacitor/* ^5.7` no se puede subir a SDK 35 o superior de forma soportada, y Google Play exige un target reciente (verificar el requisito vigente en la documentación oficial antes de planificar). Android 15 fuerza edge-to-edge: Capacitor 5 no inyecta los insets de las barras del sistema en CSS.

**Plan (en una rama separada, `agent/capacitor-upgrade`):**

1. Leer la guía oficial de actualización de Capacitor y subir a una versión mayor que soporte el target requerido (`npx cap migrate`).
2. Actualizar `variables.gradle` (SDK, AGP/Gradle, JDK) y plugins.
3. Probar edge-to-edge: `env(safe-area-inset-*)` con barras del sistema, `pt-safe`/`pb-safe`, teclado (`visualViewport`).
4. Regresión completa de: rest timer nativo (`scheduleNativeRestTimer`), hápticos, wake lock, back físico/gesto.

**Aceptación:** build release firmable, sin regresiones en el checklist manual y los insets correctos en Android 15+.

---

## Plan de pruebas

**Unitarias / componentes (vitest + RTL + `fake-indexeddb`)**

- D1: flush de `null` y no-flush antes de `_init`.
- D2: orden `onUpdate` → `onToggleComplete` (click y swipe).
- D3: el foco no salta a reps al tocar otro control. Enter sí avanza.
- D4: `HoldTimer` no se detiene tras `touchstart` + `click`.
- D6: `detectPRs` sin índice listo → `false`.
- R1: render-count de tarjetas al editar un input.
- R4: `NavBtn` no se desmonta al cambiar `isOnline`.
- R5: un solo disparo de feedback bajo `StrictMode`.

**E2E (Playwright, con el flag de SW de la Fase 0)**

- Offline: cargar `/` y `/?action=start&source=shortcut` sin red tras la primera visita (S1).
- Actualización: con sesión activa, un SW nuevo no recarga solo (S2).
- Historial: 4 cambios de pestaña + Atrás (U3).
- Flujo completo: iniciar sesión → cargar 3 series → descanso en píldora sin bloquear → terminar → resumen.

**Chequeo manual en dispositivo (gama media Android, PWA instalada y APK Capacitor)**

- [ ] Completar series con swipe y con check mientras el teclado está abierto: se guarda lo tipeado.
- [ ] Isométrico: Play inicia y cuenta; Stop guarda los segundos.
- [ ] Terminar un workout y bloquear el teléfono enseguida: al reabrir no reaparece la sesión.
- [ ] Modo avión: abrir la app desde el ícono y desde el atajo "Start Workout".
- [ ] Tirar hacia abajo en listas: no recarga.
- [ ] Modo claro: acentos legibles.
- [ ] TalkBack: completar una serie con teclado numérico.
- [ ] Android 15: barras del sistema sin tapar contenido (tras P1).

---

## Métricas objetivo

| Métrica | Baseline (Fase 0) | Objetivo |
|---|---|---|
| Re-renders al editar un input | medir | solo la fila editada |
| Re-renders cada 3 s durante el workout | medir | 0 componentes fuera del dato modificado |
| Bundle de entrada (gzip) | medir | menor que el baseline |
| LCP móvil (Lighthouse, 4x CPU slowdown) | medir | mejora tras L1 y L2 |
| Recursos que bloquean el render | fuentes externas | 0 |
| Toques extra para seguir cargando tras una serie | ≥ 1 (cerrar el descanso) | 0 |
| Controles frecuentes < 44 px | varios | 0 |
| Contraste del nav inactivo | ≈ 2,5:1 | ≥ 4,5:1 |

---

## Riesgos y rollback

- **S1/S2 (service worker):** un SW mal desplegado puede dejar clientes con la app rota. Probar en `preview` con "Update on reload" desactivado. Desplegar primero a un entorno de prueba. Mantener la opción de "desregistrar SW" en Ajustes o por URL de emergencia.
- **R1/R2:** cambios sutiles de memoización. Cubrir con tests de render-count y revisar manualmente el flujo de superseries, EMOM y drop sets.
- **U1:** cambia el flujo central del entrenamiento. Dejar el modo "completo" como opción para quien lo prefiera.
- **P1:** hacerlo en rama aparte y no mezclarlo con el resto.
- **Rollback:** un commit por tarea permite `git revert` puntual.

---

## Apéndice A: alcance de la auditoría

**Revisado:** `App.tsx`, `index.tsx`, `index.html`, `index.css`, `native-performance.css`, `vite.config.ts`, `package.json`, `public/sw.js`, `public/manifest.json`, `lib/store.ts`, `context/AppContext.tsx`, `context/TimerContext.tsx`, `hooks/useTimer.ts`, `hooks/useWorkoutController.ts`, `views/WorkoutViewImpl.tsx`, `views/HomeView.tsx`, `components/workout/SetRow.tsx`, `components/ui/RestTimerOverlay.tsx`, `components/ui/Icon.tsx`, `components/layout/Layout.tsx`, `android/variables.gradle`.

**No revisado (conviene una segunda pasada):** `HistoryView`, `StatsViewImpl`, `NutriView`, `ProgramEditView`, `SessionSummaryView`, `Sheet` (vaul), `CommandPalette`, `SortableExerciseCardImpl`, `services/syncService`, `scripts/generate-sw-precache.mjs`, `tailwind.config.js`, `firestore.rules`, tests existentes, `ironlog-kmp/`.

## Apéndice B: lo que está bien (no tocar sin necesidad)

- Chunking manual y filtro de `modulePreload` en `vite.config.ts`.
- Persistencia con debounce y flush en `visibilitychange` / `pagehide` (salvo D1).
- Timers basados en timestamp, worker de 1 Hz y alarma nativa en Android.
- Estado local en `SetRow` con hints y swipe (salvo D2–D4, U8).
- `HomeSkeleton` en lugar de spinner durante la carga inicial.
- Modos de efectos `balanced/reduced` y soporte de `prefers-reduced-motion`.
- Mapa estático de iconos con tree-shaking en `Icon.tsx`.
- Virtualización del historial con `react-virtuoso`.
