# Baseline de Rendimiento, Build y UX - GainsLab (Fase 0)

| Fecha de medición | 2026-10-01 |
|---|---|
| **Rama** | `agent/gainslab-audit-fixes-v1` |
| **Commit base** | `1d8564f` (`agent/gainslab-pwa-master-polish-v1`) |
| **Target principal** | Motorola Moto G86 Power (dispositivo de referencia del producto) |
| **Herramientas** | Vite 5.4.21, TypeScript 5.x, Vitest 2.1.9, ESLint 9.39.4, Lighthouse 13.5.0 (Mobile Emulation) |

---

## 1. Verificación inicial de comandos

- `npm ci`: Completado exitosamente (925 paquetes instalados).
- `npm run build`: Exitoso en 7.37s.
- `npm run test:run`: 16 archivos pasados, 123 tests unitarios pasados (incluyendo nuevo test de elegibilidad de SW y override E2E).
- `npm run lint:a11y`: 0 errores, 0 advertencias.

---

## 2. Tamaños de Chunks Vite (Build Baseline)

### Chunks Principales y Vendors Críticos

| Chunk | Tamaño sin comprimir | Tamaño gzip | Observaciones |
|---|---|---|---|
| `vendor-firebase-db-*.js` | 433.90 kB | **106.85 kB** | Bundle más pesado de Firestore |
| `index-*.js` (App shell bundle) | 284.72 kB | **88.74 kB** | Código principal de la aplicación |
| `vendor-firebase-auth-*.js` | 189.78 kB | **37.68 kB** | SDK de autenticación de Firebase |
| `vendor-charts-*.js` | 182.51 kB | **63.69 kB** | Chart.js y wrappers |
| `vendor-react-*.js` | 142.21 kB | **45.58 kB** | React 18, React-DOM, Scheduler |
| `vendor-motion-*.js` | 126.52 kB | **41.56 kB** | Framer Motion (cargado en bundle crítico) |
| `WorkoutView-*.js` | 84.20 kB | **23.24 kB** | Vista activa de entrenamiento |
| `defaultTemplates-*.js` | 81.23 kB | **13.33 kB** | Plantillas predeterminadas de entrenamiento |
| `disciplineExercises-*.js` | 58.23 kB | **17.39 kB** | Catálogo de ejercicios |
| `SettingsModal-*.js` | 54.93 kB | **14.62 kB** | Modal de ajustes |
| `index-*.js` (Secundario) | 54.39 kB | **18.87 kB** | Componentes base |
| `NutriView-*.js` | 53.70 kB | **13.04 kB** | Vista de nutrición |
| `vendor-dnd-*.js` | 45.38 kB | **15.19 kB** | DND Kit |
| `TwoBlockMassModal-*.js` | 33.67 kB | **10.37 kB** | Modal Two-Block Mass |
| `vendor-icons-*.js` | 33.29 kB | **6.71 kB** | Iconos Lucide |
| `StatsView-*.js` | 32.94 kB | **10.54 kB** | Vista de analíticas |
| `vendor-firebase-core-*.js` | 24.41 kB | **6.35 kB** | Firebase core |
| `vendor-firebase-app-*.js` | 22.50 kB | **5.63 kB** | Firebase app |
| `ProgramHub-*.js` | 21.25 kB | **5.99 kB** | Hub de programas |
| `FreestyleSessionModal-*.js` | 20.78 kB | **5.60 kB** | Modal de sesión libre |
| `ExercisesView-*.js` | 17.22 kB | **5.61 kB** | Vista de ejercicios |
| `HistoryView-*.js` | 17.15 kB | **5.68 kB** | Vista de historial |
| `defaultLibrary-*.js` | 16.06 kB | **5.25 kB** | Biblioteca default |
| `SetupWizard-*.js` | 14.94 kB | **4.29 kB** | Asistente de configuración |
| `ProgramEditView-*.js` | 14.41 kB | **4.50 kB** | Editor de programas |
| `vendor-effects-*.js` | 10.68 kB | **4.29 kB** | Efectos visuales |
| `index-*.css` | 124.76 kB | **19.63 kB** | Estilos globales Tailwind + componentes |
| `dist/index.html` | 6.92 kB | **2.54 kB** | HTML raíz precargado |

**Total JavaScript crítico inicial (gzip):** ~385 kB (sumando index, vendor-react, vendor-motion y vendor-firebase-db).

---

## 3. Auditoría Lighthouse Mobile (`npm run preview`)

Emulación: Móvil (Moto G / pantalla móvil 412x823, throttling de red móvil estándar).

### Puntuaciones de Categorías

| Categoría | Score Baseline |
|---|---|
| **Performance** | **78 / 100** |
| **Accessibility** | **92 / 100** |
| **Best Practices** | **96 / 100** |
| **SEO** | **92 / 100** |

### Métricas Core Web Vitals Móviles

| Métrica | Valor Baseline | Diagnóstico |
|---|---|---|
| **First Contentful Paint (FCP)** | **2.7 s** | Mejorable mediante eliminación de render-blocking fonts y optimización de chunks |
| **Largest Contentful Paint (LCP)** | **4.3 s** | Elevado debido a la hidratación completa del bundle y fuentes externas |
| **Total Blocking Time (TBT)** | **180 ms** | Tiempos de ejecución de JavaScript inicial durante carga |
| **Cumulative Layout Shift (CLS)** | **0.00** | Excelente estabilidad visual inicial |
| **Speed Index** | **2.7 s** | Percepción de carga visual inicial |

### Estado PWA (Offline e Instalabilidad)

- **Manifiesto Web (`manifest.json`):** Presente y válido (`display: standalone`, `theme_color: #050505`, iconos de 48px a 512px).
- **Service Worker (`public/sw.js`):** Script de Service Worker presente con precache de app shell.
- **E2E Override implementado:**
  - Archivo `utils/serviceWorker.ts` con la función `isServiceWorkerAllowed()`.
  - Si `navigator.webdriver` está activo, el SW permanece desactivado por defecto en tests E2E automatizados para evitar contención de red, pero puede ser forzado pasando `window.__E2E_ENABLE_SW__ = true` o el query param `?sw=1`.
  - 100% probado en `tests/unit/swRegistration.test.ts`.

---

## 4. React DevTools Profiler Baseline (Re-renders en Entrenamiento)

Escenario de prueba: Sesión activa con **4 ejercicios de 4 series** (16 series en total).

### Caso A: Edición de peso/reps en un SetRow

- **Comportamiento detectado:**
  - El input en `SetRow` invoca `onChange` -> `updateSetField` en `useWorkoutController`.
  - Se genera un nuevo objeto `activeSession` en Zustand.
  - Zustand notifica a `useWorkoutController`, que re-ejecuta el hook y computa derivados.
  - `WorkoutViewImpl` recibe el nuevo estado y re-renderiza.
  - Ningún `WorkoutExerciseCard` está memoizado (`React.memo` ausente o props recreadas en cada render).
  - Ningún `SetRow` está memoizado (las callbacks `onUpdate`, `onToggleComplete`, etc., se recrean en línea).
  - **Componentes re-renderizados por pulsación de tecla:** **~45 - 55 componentes** (WorkoutViewImpl + 4 WorkoutExerciseCards + 16 SetRows + cabecera de sesión + barras de progreso).

### Caso B: Completar una serie (Toggle Complete)

- **Comportamiento detectado:**
  - Se presiona el botón check de `SetRow` -> `toggleSetComplete`.
  - Se actualiza `completed: true` en Zustand.
  - Se lanza `detectPRs` de manera síncrona sobre todo el historial y todas las series.
  - Se programa el timer de descanso mediante `requestAnimationFrame` -> `setRestTimer`.
  - Re-renderizan:
    - `WorkoutViewImpl`
    - Los 4 `WorkoutExerciseCard`
    - Las 16 `SetRow`
    - `RestTimerOverlay` (o `WorkoutRestWidget`)
    - `Layout` (escuchando el estado del timer y la sesión)
  - **Componentes re-renderizados al completar serie:** **~50 - 65 componentes**.

---

## 5. Próximos Pasos (Fases del Plan)

Con este baseline establecido, se procederá a la **Fase 1: Integridad de datos y bugs de carga de series (P0)**:
- **D1:** Corrección de persistencia de `null` en `lib/store.ts` (`sessionDirty` / `mesoDirty`).
- **D2:** Corrección de `null` en `inputs` de `SetRow.tsx`.
- **D3:** Corrección de pérdida de foco en inputs de `SetRow.tsx`.
- **D4:** Corrección del timer de AVT/Hold en `HoldTimer`.
- **D5:** Seguridad y desindexación de `.env` (`git rm --cached .env`, script de verificación).
- **D6:** Limpieza de `rpFeedback` huérfano en `useWorkoutController.ts`.
