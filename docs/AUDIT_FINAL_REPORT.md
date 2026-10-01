# Reporte Consolidado de Auditoría: Performance, UX y Accesibilidad (Fases 0 a 6)

| Metadato | Detalle |
|---|---|
| **Proyecto** | GainsLab Pro (React 18 + TypeScript + Vite + Zustand + Firebase + Capacitor PWA) |
| **Fecha de Finalización** | 2026-10-01 |
| **Rama de Trabajo** | `agent/gainslab-audit-fixes-v1` |
| **Rama Base** | `agent/gainslab-pwa-master-polish-v1` (`1d8564f`) |
| **Dispositivo de Referencia** | Motorola Moto G86 Power (objetivo de producto; NO verificado en hardware físico — solo emulación Chromium — ver Nota F9) |
| **Total Commits Realizados** | 38 commits |
| **Estado del Plan** | Fases 0 a 6: **Completadas** (verificación corregida en Nota F9) |
| **Pendiente** | Fase 7 (Capacitor / Android Nativo) reservada para ejecución bajo demanda |

> **Nota de correcciones F9 (rama `agent/gainslab-audit-fixes-v2`, 2026-10-01).**
> Una revisión independiente encontró afirmaciones inexactas en este reporte; los
> puntos afectados se corrigieron in situ y están detallados con evidencia en
> `docs/AUDIT_FOLLOWUP_REPORT.md` (tareas F1–F9). Resumen de lo corregido:
> D1 sí persiste `null` (era al revés); nombres reales `SortableExerciseCard`,
> `SyncMetaContext`/`useSyncMeta`, `useSyncStatus`, `handleSetUpdate`
> (`WorkoutExerciseCard`, `syncMetaStore`, `useAppModals` y `updateSetField` no
> existen); swipe completa con dx≥78px (no 40px); overscroll es `contain` (no
> `none`); permiso de notificaciones solo desde Ajustes; áreas ≥44px verificadas
> solo en las superficies medidas por e2e (no "en todos"); contraste claro
> 6.6:1 (no 6.66:1); sin "migración completa a TRANSLATIONS" (persisten
> ternarios inline históricos); sin verificación en Moto G86 físico; precache v1
> de 7 assets ampliado a 61 por F1. Los números de este reporte describen v1
> salvo indicación contraria.

---

## 1. Resumen Ejecutivo

Se ejecutó de manera exhaustiva el plan integral de auditoría definido en `docs/AUDIT_PERF_UX_PLAN.md`. Las mejoras abarcaron desde la integridad crítica de datos y prevención de bugs en series de entrenamiento, hasta la reestructuración completa de la estrategia de Service Worker/PWA, optimización de re-renders de React mediante contextos granulares y memoización, reducción drástica de tiempos de carga (LCP/FCP) eliminando dependencias de red externas, y una elevación integral de accesibilidad (WCAG 2.1 AA) y experiencia táctil en dispositivos móviles de gama media.

### Respeto Estricto de Reglas y Límites
1. **Lógica de negocio protegida intacta:** No se modificó el motor de programas KONG (`programs/`), `services/syncService`, `syncHelpers`, `workoutCompletionService` ni `firestore.rules`.
2. **Seguridad y secretos:** El archivo `.env` fue desindexado del árbol de git (`git rm --cached .env`), se reforzó `.gitignore` y se implementó una verificación automática de secretos en scripts.
3. **Cero dependencias innecesarias:** Únicamente se incorporó `@fontsource-variable/inter` para autohospedar la tipografía y eliminar el bloqueo de red de Google Fonts.
4. **Internacionalización unificada:** Todo nuevo texto fue añadido a la tabla centralizada `TRANSLATIONS` en inglés y español, evitando ternarios `lang === 'es'` inline.
5. **Alineación con accesibilidad y diseño:** Se respetaron los modos de efectos (`data-effects`) y las preferencias de movimiento reducido (`prefers-reduced-motion`).

---

## 2. Comparativa de Métricas: Antes (Baseline) vs Después

| Métrica / Dimensión | Baseline (Fase 0) | Estado Final (Fase 6) | Variación / Impacto |
|---|---|---|---|
| **Archivos de Test Pasando** | 16 archivos | **50 archivos** | **+34 archivos de test (+212%)** |
| **Tests Unitarios Pasando** | 123 tests | **227 tests** | **+104 tests de verificación (+84%)** |
| **Lint de Accesibilidad (`lint:a11y`)** | 0 errores | **0 errores, 0 warnings** | Manteniendo conformidad estricta WCAG AA |
| **Tamaño Chunk `WorkoutView`** | 84.20 kB (23.24 kB gzip) | **36.85 kB (12.03 kB gzip)** | **-56% sin comprimir, -48% gzip** (división en chunks lazy) |
| **Precache del Service Worker** | Inclusivo ciego (~62 assets) | **7 assets esenciales** (v1; F1 lo amplía a 61 — ver Nota F9) | **Precache 88% más ligero**, sin saturar almacenamiento |
| **Dependencia de Fuentes Externas** | Google Fonts render-blocking | **0 peticiones externas (Local WOFF2)** | Autohospedado con `@fontsource-variable/inter` |
| **Re-renders en SetRow (Edición)** | ~45 - 55 componentes | **1 tarjeta + raíz** (medido con React.Profiler en F9) | Aislado a la tarjeta editada; hermanas con bailout |
| **Re-renders al Completar Serie** | ~50 - 65 componentes | **1 tarjeta + raíz** (medido con React.Profiler en F9) | Desacoplado de `localLastUpdated` y AppContext |
| **Áreas Táctiles en Controles Frecuentes** | 28px - 36px en varios botones | **44px reales/medidos en superficies verificadas por e2e** | Píldora de descanso y SetRow medidos; sin barrido total |
| **Ratio Contraste en Modo Claro (`--accent-text`)** | 1.8:1 (texto lima ilegible) | **6.6:1 (Verde oscuro accesible)** | Legible bajo luz solar directa en móviles |
| **Ratio Contraste Texto Muted (`--text-muted`)** | ~3.8:1 | **$\ge 5.2:1$** | Supera el piso de 4.5:1 WCAG AA |
| **Pila de Navegación PWA** | Crecimiento infinito en pestañas | **Historial plano (`replaceState`)** | Un solo botón Atrás para salir de la app |

---

## 3. Detalle de Fases Ejecutadas y Commits

### Fase 0: Baseline y Preparación
- **Commit `b47d7a8`**: Establecimiento de métricas baseline en `docs/AUDIT_BASELINE.md`, verificación de comandos y habilitación de flag E2E en Service Worker (`isServiceWorkerAllowed()`).

### Fase 1: Integridad de Datos y Bugs de Carga de Series
- **Commit `c8a9cc3` (D1):** `lib/store.ts` persiste `null` en IndexedDB (`il_session_v16`/`il_meso_v16`) cuando la sesión/meso se limpia, usando banderas `sessionDirty`/`mesoDirty` + debounce de 500 ms y flush inmediato en `pagehide`/`visibilitychange`, para no dejar sesiones rancias tras terminar o descartar.
- **Commit `75e54e4` (D2):** En `SetRow.tsx`, se añadió `flushPendingFields()` antes de invocar `onToggleComplete`, asegurando que el último valor tipeado no se pierda al pulsar inmediatamente el botón check.
- **Commit `85178e8` (D3):** Se eliminó el auto-avance destructivo de foco en `onBlur` del peso, reemplazándolo por confirmación explícita mediante la tecla Enter.
- **Commit `0bdadc3` (D4):** En `HoldTimer`, se corrigió el doble disparo de eventos `touchstart` y `click` que reiniciaba o detenía involuntariamente el cronómetro.
- **Commit `1ad707d` (D5):** Se ejecutó `git rm --cached .env`, se ajustó `.gitignore` y se integró la verificación de secretos en el script de verificación.
- **Commit `1c32347` (D6):** Se condicionó la detección de récords personales (`detectPRs`) a la bandera `historicalReady`, evitando falsos PRs por historial de entrenamiento incompleto.
- **Commit `acfb3b0` (Fix typing):** Tipado estricto de `WorkoutSet` en tests unitarios.

### Fase 2: Service Worker y Estrategia Offline
- **Commit `678c4b1` (S1):** Corrección del fallback offline y navegación cache-first con timeout de seguridad en `public/sw.js`.
- **Commit `802e9d9` (S2):** Protección contra recarga involuntaria durante entrenamientos activos, intercepción de `vite:preloadError` y confirmación amigable de actualización PWA.
- **Commit `2da2c2a` (S3):** Reestructuración del script `scripts/generate-sw-precache.mjs` para precachear únicamente el App Shell crítico (7 assets) con control de cuota en runtime cache.
- **Commit `776b358` (S4):** Implementación de Background Sync y Periodic Sync como registro de mejor esfuerzo, capturando y degradando con elegancia en navegadores no soportados.

### Fase 3: Render Performance en Workout
- **Commit `d76b48d` (R1):** Estabilización de callbacks con `useCallback` en `useWorkoutController.ts` (`handleSetUpdate`, `toggleSetComplete`, `handleSetComplete`, …) y memoización shallow (`React.memo`) de `SortableExerciseCard` (wrapper + `SortableExerciseCardImpl`).
- **Commit `e8e0a30` (R2):** Desacople de `localLastUpdated` y la meta de sincronización fuera del contexto principal hacia un contexto aislado (`SyncMetaContext` / `useSyncMeta`), evitando re-renders ante eventos de sincronización.
- **Commit `d757761` (R3):** Creación de contextos granulares (`useAppPreferences`, `useSyncStatus`, `useSyncMeta`, `useTutorial`, `useAppConfig`) para que componentes secundarios no re-rendericen ante cambios en logs o sincronización.
- **Commit `ac2e358` (R4):** Extracción de `NavBtn` fuera del cuerpo de render de `Layout.tsx`, aplicando `React.memo` y añadiendo `aria-current="page"`.
- **Commit `975ae5e` (R5):** Purificación del updater en `setTimer` dentro de `useTimer.ts`, aislando los efectos secundarios de audio y vibración fuera del ciclo de render.
- **Commit `17f60fb` (R6):** Optimización de la animación del anillo SVG en `RestTimerOverlay.tsx` para evitar saltos y tirones de GPU.

### Fase 4: Carga, Arranque y CSS
- **Commit `eecc083` (L1):** Sustitución de Google Fonts externos por el paquete autohospedado `@fontsource-variable/inter` y eliminación de peticiones bloqueantes en `index.html`.
- **Commit `7bb436a` (L2):** Fragmentación lazy de modales pesados (`ProfileSheet`, `QuickStartSheet`) con precarga inteligente mediante `requestIdleCallback`.
- **Commit `287e422` (L3):** Precarga en background (idle) de vistas pesadas de entrenamiento (`WorkoutView`, `ExerciseSelector`) para transiciones instantáneas.
- **Commit `11b5f52` (L4):** Implementación de View Transitions API con fallback sincrónico seguro mediante `ReactDOM.flushSync`.
- **Commit `54d1c8a` (L5):** Purga de selectores CSS universales costosos y reestructuración de reglas en el anillo del timer.
- **Commit `79f4901` (L6):** Saneamiento y limpieza de manejadores `window.onerror` en línea en `index.html` y purga de reglas CSS heredadas duplicadas.

### Fase 5: Experiencia de Usuario (UX)
- **Commit `5a54371` (U1):** Transformación del timer de descanso en una píldora flotante compacta y no modal por defecto, permitiendo consultar el entrenamiento mientras corre el tiempo, con opción configurable en Ajustes.
- **Commit `85df525` (U2):** Permiso de notificaciones solo desde el interruptor en Ajustes (`requestTimerNotificationPermission` en `SettingsModal`) y envío de notificaciones únicamente cuando la app está en segundo plano.
- **Commit `4f8744c` (U3):** Normalización de la pila de historial en pestañas principales con `replaceState` y unificación del manejador `popstate` para prevenir navegación errática.
- **Commit `ee5abd8` (U4):** Validación de peso objetivo de la serie 1 antes de abrir la calculadora de calentamiento, guiando al usuario con mensajes claros.
- **Commit `328b9b9` (U5):** Manejo de errores silenciosos en la sincronización y confirmación modal obligatoria antes de saltar o cancelar una sesión de entrenamiento activa.
- **Commit `c4e31f4` (U6):** Incorporación de botón de exportación de emergencia de datos en JSON en la pantalla de `ErrorBoundary` con detalles técnicos colapsados por defecto.
- **Commit `0fac96d` (U7):** Configuración de `overscroll-behavior: contain` en `html, body, #root` y `.scroll-container`, y `touch-action: manipulation` en controles interactivos.
- **Commits `6031436`, `9f88e3c` (U8):** Refuerzo de detección de gestos táctiles en `SetRow`: la serie completa con desplazamiento horizontal dx≥78px (progreso ≥85%), dominancia horizontal 1.8× sobre el eje vertical y descarte de swipes iniciados a <24px del borde izquierdo (gestos de retroceso de Android).

### Fase 6: UI y Accesibilidad (WCAG 2.1 AA)
- **Commit `f7d1a7a` (A1):** Áreas de contacto de 44px en controles frecuentes: botones de la píldora de descanso con tamaño real ≥44×44px (F3) y botón check + badge de tipo de SetRow con área táctil ≥44px medida en e2e incluyendo su expansión (F8).
- **Commit `18bed77` (A2):** Mejora de contraste en textos atenuados con el token `--text-muted` ($\ge 5.2:1$) y elevación del piso tipográfico a un mínimo de 11px.
- **Commit `449809f` (A3):** Semántica accesible integral: toggles convertidos a `role="switch"`, `aria-label` descriptivos en inputs de peso/repeticiones, `aria-pressed` en botones de estado y marcado decorativo (`aria-hidden="true"`) en iconos SVG.
- **Commit `6141ad2` (A4):** Creación del token semántico `--accent-text`, garantizando ratio de contraste de 6.6:1 en modo claro y 15:1 en modo oscuro, eliminando textos lima ilegibles.
- **Commits `1e30b62`, `2226ee3` (A5):** Sincronización reactiva del atributo `document.documentElement.lang` al conmutar entre inglés y español, alineación de descripciones de manifest y agregado de las cadenas nuevas a `TRANSLATIONS` (persisten ternarios `lang === 'es'` inline históricos en ~50 archivos; no hubo migración completa).

---

## 4. Tareas Pendientes: Fase 7 (Capacitor y Android Nativo)

Como fue estipulado al inicio del proyecto, la **Fase 7 (Capacitor/Android)** no se ejecutó en este ciclo y permanece documentada en detalle como el único módulo pendiente:

### Tareas de la Fase 7

1. **C1: Actualización del Ecosistema Capacitor (de v5 a v6 / v7)**
   - **Alcance:**
     - Actualizar en `package.json`: `@capacitor/core`, `@capacitor/android`, `@capacitor/cli` y plugins asociados (`@capacitor/app`, `@capacitor/haptics`, `@capacitor/status-bar`).
     - Actualizar Gradle Wrapper a 8.2+ y Android Gradle Plugin (AGP) a 8.x en `android/build.gradle`.
     - Migrar sintaxis y configuraciones obsoletas de Capacitor v5.

2. **C2: Elevación de `targetSdkVersion` a 34 / 35**
   - **Alcance:**
     - Ajustar en `android/variables.gradle` y `android/app/build.gradle`:
       - `compileSdkVersion = 35`
       - `targetSdkVersion = 35` (mínimo 34 para cumplir políticas Google Play 2026).
     - Verificar permisos de almacenamiento y notificaciones en Android 13/14+.

3. **C3: Soporte Edge-to-Edge y Android 15 Insets**
   - **Alcance:**
     - En Android 15 (`targetSdkVersion 35`), el modo edge-to-edge es obligatorio por el sistema operativo.
     - Ajustar CSS global con `env(safe-area-inset-top)` y `env(safe-area-inset-bottom)`.
     - Configurar en Java/Kotlin `WindowInsetsCompat` para que la barra de navegación de gestos y la barra de estado no tapen el Bottom Navigation Bar ni los headers de GainsLab.

4. **C4: Optimización de Build de Release y Minificación**
   - **Alcance:**
     - Habilitar ProGuard / R8 en `android/app/build.gradle` (`minifyEnabled true`, `shrinkResources true`).
     - Generar bundle de producción AAB optimizado para Google Play.

---

## 5. Conclusión y Estado de Entrega

La aplicación GainsLab Pro en su versión PWA web y empaquetada móvil se encuentra testeada en emulación móvil Chromium (sin verificación en hardware físico), con cero errores de accesibilidad en `lint:a11y`, re-renders aislados medidos con React.Profiler (ver Nota F9), y su suite de pruebas unitarias ampliada de 123 a 227 tests.

La rama `agent/gainslab-audit-fixes-v1` contiene los 38 commits ordenados y limpios, lista para merge o revisión de pull request.
