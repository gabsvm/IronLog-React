# Strong Workout Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La pantalla de entrenamiento en curso de IronLog se ve y se recorre como la de Strong (v6.2.7): una lista continua y plana con todos los ejercicios y series visibles, sin perder ninguna función actual (protocolos, superseries, RIR, cardio, isométricos, descanso).

**Architecture:** Cambios solo de presentación/composición en la capa de workout. `WorkoutMain` deja el modelo "ejercicio enfocado + rail" y pasa a lista apilada; la tarjeta expandida adopta una variante plana estilo Strong (banda de 48dp, sin radio); filas y header de series se aplanan; el header de sesión se simplifica. El estado (`useWorkoutViewState`, `useWorkoutController`) no cambia de contrato salvo lo indicado. Sin modo nuevo ni flags: corte limpio, el diseño anterior desaparece de esta pantalla.

**Tech Stack:** React + Vite + Tailwind (tokens en `index.css`), TypeScript, Vitest (`npm run test:run`), Playwright (`npm run test:e2e`, config visual `playwright.visual.config.ts`).

**Spec:** Análisis de paridad de esta sesión (2026-10-26). Evidencia Strong: APK `C:/Dev/apk-analysis/strong/input/Strong.apk` (v6.2.7, SHA-256 `ea0700cca9c387d82a23ad5d0c1af52e0c4847bafeca6710cf34dbeefcf9e3f1`), layouts `res/layout/activity_log_workout.xml`, `set_group_list_item.xml` (banda 48dp), `set_headers_item.xml` (36dp), `exercise_set_item.xml`, `add_set_button_view_holder.xml` (48dp), `view_holder_add_exercise.xml`, `keyboard_log_workout.xml` (teclado 220dp), `workout_info_view.xml`; colores `strong2__blue_100 #35A7FF`, `strong2__green_100 #2ECD70`. Evidencia IronLog actual: captura `C:/Dev/gainslab-active-workout-screen.png`. Nota: el spec previo `docs/specs/design-preview-implementation-plan.md` ("un ejercicio enfocado") queda **reemplazado** por este plan en lo que respecta a la pantalla de entrenamiento en curso.

## Global Constraints

- Alcance exclusivo: entrenamiento en curso (`views/workout/`, `views/WorkoutViewImpl.tsx`, `components/workout/`, tokens que solo esta pantalla consume). No tocar Home, History, Stats, Nutri, Programas.
- Viewport de paridad: móvil 360–430px. Desktop sigue usable (columna centrada `max-w-3xl`), sin layout propio nuevo.
- No eliminar funcionalidad: protocolos especiales (EMOM, myoreps, cluster, drop, rest-pause, Tabata/HIIT, top/back-off), superseries/linking, RIR opcional, cardio, bodyweight, isométrico, warmup, reorder, reemplazar, detalle de ejercicio, rest timer. Si algo no cabe en la banda plana, vive en el menú `⋮` existente (`ExerciseCardMenu`), no se borra.
- i18n: todo texto visible usa las claves existentes (`t.*`, `TRANSLATIONS`); nada hardcodeado en un idioma.
- Accesibilidad: targets ≥44px, inputs ≥16px, foco visible; no regresionar `npm run lint:a11y`.
- Sin dependencias nuevas. Sin cambios en persistencia, tipos de datos (`types.ts`) ni en `useWorkoutController` salvo lo que una tarea nombre explícitamente.
- El acento de marca NO cambia (lima `--primary-500`); la paridad es estructural (layout, densidad, jerarquía), no de identidad. El verde de completado sigue siendo el acento.
- Cada tarea: tests primero (TDD), commit propio con el mensaje indicado.

## Review Focus

1. Sesión con 1 solo ejercicio: la lista apilada no debe dejar huecos ni perder el botón Finish (test en Task 1).
2. Ejercicio sin series working (solo warmup): no debe contar como "completo" ni disparar el CTA siguiente (test en Task 1).
3. Linking de superseries a mitad de lista: todas las tarjetas visibles y el target clickeable sin scroll forzado (test en Task 1).
4. Set activo (`isNextSet`) en el tercer ejercicio: debe seguir resaltado y con scroll-into-view al completar el anterior (test en Task 2).
5. Tema claro (`html.light`): la variante plana no puede depender de colores dark hardcodeados (test visual en Task 6).

---

### Task 1: Lista apilada continua en `WorkoutMain`

**Files:**
- Modify: `views/workout/WorkoutMain.tsx` (líneas 18–261 aprox.)
- Modify: `tests/e2e/weightUnits.spec.ts:35` (espera `h3` count 1 → pasa a contar todos)
- Test: `tests/e2e/strongParity.spec.ts` (crear, siguiendo el patrón de fixtures de `tests/e2e/weightUnits.spec.ts`)

**Interfaces:**
- Consumes: `WorkoutViewState` sin cambios (`views/workout/useWorkoutViewState.ts`); `SortableExerciseCard` con prop `isExpanded: boolean` (existente).
- Produces: DOM con **todos** los ejercicios visibles a la vez; `activeExerciseId` solo marca resaltado/scroll, ya no visibilidad. `WorkoutExerciseRail` deja de usarse en esta vista (el archivo no se borra en esta tarea).

- [ ] **Step 1: Write the failing test** — `strongParity.spec.ts`: iniciar sesión con ≥2 ejercicios; assert: ambos `h3` visibles sin tocar el rail; todas las filas de serie del segundo ejercicio visibles; no existe `[aria-label="exerciseNav"]` (rail) en viewport móvil.
- [ ] **Step 2: Run it** — `npx playwright test tests/e2e/strongParity.spec.ts` → Expected: FAIL (segundo ejercicio `hidden`).
- [ ] **Step 3: Implement** — En `WorkoutMain`: eliminar `WorkoutExerciseRail` y el wrapper grid `lg:grid-cols-[248px_1fr]`; quitar la lógica `isVisible/isExpanded ? focused : hidden`; renderizar cada `SortableExerciseCard` con `isExpanded={true}` (en modo linking, `isExpanded` sigue siendo el source, targets visibles como hoy); contenedor `mx-auto w-full max-w-3xl space-y-0 px-0 sm:px-3`. El CTA "siguiente ejercicio" (`goNext`) pasa a hacer `scrollIntoView` sobre `#exercise-card-<instanceId>` sin cambiar expansión; añadir ese `id` al wrapper. Conservar `WorkoutRestDock`, banner de linking y botón final "Añadir ejercicio" (se aplana en Task 4).
- [ ] **Step 4: Run tests** — `strongParity.spec.ts` PASS; actualizar `weightUnits.spec.ts:35` al nuevo conteo; `npx playwright test tests/e2e/reorderDrag.spec.ts tests/e2e/exerciseDetailScroll.spec.ts tests/e2e/restPillHeight.spec.ts` PASS (ajustar solo asserts de visibilidad/conteo, no de comportamiento).
- [ ] **Step 5: Commit** — `git commit -m "feat(workout): stacked continuous exercise list, drop focused/rail model"`

### Task 2: Header de sesión estilo Strong

**Files:**
- Modify: `views/workout/WorkoutMain.tsx` (bloque header, ~líneas 86–141)
- Test: `tests/e2e/strongParity.spec.ts` (extender)

**Interfaces:**
- Consumes: `WorkoutTimer`, `activeSession.name/startTime`, `setShowFinishModal`, `onBack`, `onOpenReorder`, `setAddingExercise`.
- Produces: header de una fila sin barra de progreso; stats de sesión bajo el título (duración ya la da `WorkoutTimer`; volumen/series de `completedWorkingSets/totalWorkingSets`, ya calculados en el state).

- [ ] **Step 1: Write the failing test** — assert: no existe `[role="progressbar"]`; el botón Finish es visible con 0 series completadas y con todas; se ve el texto de stats `X/Y` series (o volumen) bajo el título.
- [ ] **Step 2: Run it** → Expected: FAIL (existe progressbar).
- [ ] **Step 3: Implement** — Quitar el `div[role=progressbar]`; Finish deja de alternar `gl-primary/gl-quiet`: clase única de texto `text-[15px] font-semibold text-[rgb(var(--accent-text))]` (como "Save" de Strong), `min-h-[44px]`. Quitar el botón `+` del header (duplicado: queda el de fin de lista). Mantener back y reorder. Bajo el título, línea `text-xs text-muted tabular-nums`: `WorkoutTimer` + ` · {completedWorkingSets}/{totalWorkingSets}` usando la clave existente de series (`t.timer.ofWord` o la que ya use el rail; no crear clave nueva si existe equivalente).
- [ ] **Step 4: Run tests** — `strongParity.spec.ts` + `tests/e2e/finishFlow.spec.ts` PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(workout): Strong-style session header, drop progress bar"`

### Task 3: Tarjeta plana con banda de ejercicio 48dp + chip de descanso

**Files:**
- Modify: `components/workout/exerciseCard/ExerciseCardExpanded.tsx` (líneas 10–270)
- Modify: `index.css` (junto a `.card-reference`, ~línea 295)
- Test: `tests/e2e/strongParity.spec.ts` (extender)

**Interfaces:**
- Consumes: `ex.defaultRestSeconds?: number` (`types.ts:53`), `startManualRest(duration)` y `manualRestPreset` ya exportados por `useWorkoutViewState` (líneas 420/450) — `WorkoutMain` debe pasarlos: añadir prop opcional `onStartRest?: (seconds: number) => void` a `SortableExerciseCard` → `ExerciseCardExpanded` (seguir la cadena de props existente, sin context nuevo).
- Produces: clase `.card-strong` (fondo `rgb(var(--surface-base))`, borde `0.5px solid rgb(var(--border-subtle))`, `border-radius: 0`); banda de ejercicio `min-h-[48px] px-4 flex items-center bg-surface-raised`; chip de descanso reutilizable dentro de la banda.

- [ ] **Step 1: Write the failing test** — assert: el contenedor de la tarjeta tiene `border-radius: 0px` computado; existe un botón chip con texto de duración (`1:30` para `defaultRestSeconds=90`) junto al nombre; al pulsarlo aparece el rest dock/overlay existente.
- [ ] **Step 2: Run it** → Expected: FAIL (radio 24px, sin chip).
- [ ] **Step 3: Implement** — Añadir `.card-strong` en `index.css` y usarla en vez de `card-reference` en `ExerciseCardExpanded`. Reestructurar el header de la tarjeta a banda única de 48dp: nombre `text-[17px] font-semibold` (botón a detalle, igual que hoy), chip de descanso `h-[28px] min-w-[40px] px-2 rounded-md bg-surface-elevated text-[13px] font-bold tabular-nums` con icono `Timer` y label formateado `m:ss` desde `ex.defaultRestSeconds ?? manualRestPreset ?? 90`; click → `onStartRest(seconds)`. Warmup `Zap` y menú `⋮` se quedan en la banda (44px de target con `after:-inset`). `heroMetric`, banners de protocolo y `ExerciseVolumeLine` se mantienen **debajo** de la banda, sin cambios. Nota del ejercicio (`ex.notes`, `types.ts:143`): si existe, línea `text-xs text-muted px-4 pb-2` bajo la banda, solo lectura.
- [ ] **Step 4: Run tests** — `strongParity.spec.ts` PASS; `npm run test:run` PASS (sin regresión en `densityProgression` ni set-row).
- [ ] **Step 5: Commit** — `git commit -m "feat(workout): flat exercise band with rest chip (Strong parity)"`

### Task 4: Header y filas de serie planas + "Add set" único

**Files:**
- Modify: `components/workout/ExerciseCardSets.tsx` (líneas 40–144)
- Modify: `components/workout/setRow/useSetRowState.tsx` (líneas 307–330, clases de input/fila/check)
- Modify: `components/workout/exerciseCard/ExerciseCardExpanded.tsx` (footer quitar/añadir, ~líneas 245–262)
- Test: `tests/e2e/strongParity.spec.ts` (extender)

**Interfaces:**
- Consumes: props actuales de `ExerciseCardSets`/`SetRow` sin cambios de firma.
- Produces: header de series de 36dp (`h-9`) con fondo `bg-surface-raised` y mismos textos (`#`, previous, peso+unidad, reps, RIR si aplica); inputs sin fondo de tarjeta (fondo transparente/`bg-surface-app`, radio `10px`, divisor inferior); un solo botón "Add set" centrado de 48dp.

- [ ] **Step 1: Write the failing test** — assert: header de series mide 36px (`h-9`); existe exactamente un botón por ejercicio con el texto de `t.addSetBtn`, centrado y de ≥44px; **no** existe botón `t.removeSetBtn` visible (la acción sigue en el menú/sistema actual: swipe y undo existentes no se tocan).
- [ ] **Step 2: Run it** → Expected: FAIL (footer doble quitar/añadir).
- [ ] **Step 3: Implement** — En `ExerciseCardSets`: aplicar `h-9 bg-surface-raised px-2.5` al header (mantener las 4 variantes cardio/isométrico/bodyweight/estándar y sus grids). En `useSetRowState`: `inputBaseClass` pasa a fondo `bg-surface-app` radio `10px` sin borde salvo foco; fila sin `bg-surface-raised` (transparente, `border-b border-border-subtle`); completada mantiene tinte de acento y check relleno; `isNextSet` mantiene borde de acento. No tocar lógica de commit, swipe, badge de tipo ni placeholders. En `ExerciseCardExpanded`: reemplazar el footer doble por un único botón centrado `w-full min-h-[48px] text-sm font-semibold text-[rgb(var(--accent-text))]` → `onAddSet(ex.instanceId)`; "quitar serie" queda accesible como hoy vía swipe/undo (verificar que `handleRemoveLastSet` sigue referenciado; si queda huérfano, moverlo al `ExerciseCardMenu`, no borrar la capacidad). Aplanar también el botón final "Añadir ejercicio" de `WorkoutMain` al mismo estilo 48dp sin borde dashed.
- [ ] **Step 4: Run tests** — `strongParity.spec.ts`, `tests/e2e/weightUnits.spec.ts`, `npm run test:run` PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(workout): flat set rows, 36dp header, single Add set"`

### Task 5: Teclado numérico propio al editar peso/reps

**Files:**
- Create: `components/workout/SetKeypad.tsx`
- Modify: `components/workout/setRow/SetRowStandard.tsx` (y variantes `SetRowBodyweight.tsx`/`SetRowIsometric.tsx` solo si comparten el patrón de input)
- Modify: `components/workout/setRow/useSetRowState.tsx` (foco/commit existentes)
- Test: `tests/e2e/strongParity.spec.ts` (extender)

**Interfaces:**
- Produces: `SetKeypad: React.FC<{ value: string; onChange(v: string): void; onNext(): void; onDone(): void; visible: boolean }>` — panel fijo inferior `h-[220px]` aprox., teclas 1–9, `,`/`.`, 0, borrar, siguiente/hecho; `inputMode` se conserva como fallback.
- Consumes: `scheduleCommit`, `setLocalWeight/setLocalReps`, `weightRef/repsRef`, `activeFieldRef` existentes. El teclado escribe sobre el mismo estado local; no crea un segundo sistema de commit.

- [ ] **Step 1: Write the failing test** — assert: al enfocar el input de peso en viewport móvil aparece `[data-testid="set-keypad"]`; pulsar `2`,`0` deja el input en `20`; "siguiente" mueve el foco a reps; "hecho" cierra el teclado y el valor persiste tras completar otro set.
- [ ] **Step 2: Run it** → Expected: FAIL (no existe keypad).
- [ ] **Step 3: Implement** — `SetKeypad` controlado y sin estado de negocio; en `SetRowStandard`, al enfocar un campo se muestra el keypad para ese campo (`activeFieldRef`), `readOnly` en el input mientras el keypad está visible en coarse pointers (`matchMedia('(pointer: coarse)')`) para que no salte el teclado del sistema; en desktop no se muestra nunca. Respetar `prefers-reduced-motion` y safe-area inferior. No bloquear el scroll de la lista salvo sobre el panel.
- [ ] **Step 4: Run tests** — `strongParity.spec.ts` PASS en viewport móvil y desktop (keypad ausente en desktop); `npm run test:run` PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(workout): in-app numeric keypad for set entry"`

### Task 6: Limpieza, tema claro y verificación visual

**Files:**
- Modify/Delete: `components/workout/WorkoutExerciseRail.tsx` (solo si queda sin referencias)
- Modify: `tests/visual/screens.visual.ts` (añadir pantalla de entrenamiento a la suite visual si ya cubre otras vistas; si no, screenshot Playwright en `strongParity.spec.ts`)
- Modify: `docs/specs/design-preview-implementation-plan.md` (nota de reemplazo, 2 líneas)

**Interfaces:**
- Consumes: todo lo anterior. No produce API nueva.

- [ ] **Step 1: Check orphans** — Con Serena `find_referencing_symbols` sobre `WorkoutExerciseRail` y `handleRemoveLastSet`: si no quedan referencias fuera de su propio archivo, borrar el archivo huérfano; si las hay, dejarlo y anotarlo en el commit.
- [ ] **Step 2: Visual check** — Captura móvil 390px en tema dark y `html.light`: lista apilada, bandas 48dp, header sin progressbar, chip de descanso visible. Comparar lado a lado con `C:/Dev/gainslab-active-workout-screen.png` y con la anatomía Strong de la Spec. Sin overflow horizontal (`tests/e2e/overflow.spec.ts` PASS).
- [ ] **Step 3: Full gate** — `npm run verify` PASS y `npx playwright test tests/e2e/strongParity.spec.ts tests/e2e/finishFlow.spec.ts tests/e2e/restPillHeight.spec.ts` PASS.
- [ ] **Step 4: Commit** — `git commit -m "chore(workout): remove orphaned rail, visual parity check"`

## Self-Review (hecha al escribir)

- Spec coverage: lista continua (T1), header sin progreso + stats (T2), banda plana + chip + notas (T3), filas/header/Add set (T4), teclado (T5), limpieza/tema claro (T6). Finish screen de Strong queda fuera a propósito: IronLog ya tiene `WorkoutFinishSheet` equivalente y el pedido es la sección en curso.
- Consistencia: `startManualRest`/`manualRestPreset` verificados en `useWorkoutViewState.ts:299/420/450`; `ex.defaultRestSeconds` en `types.ts:53`; `ex.notes` en `types.ts:143`. Ninguna tarea inventa campos.
- Sin placeholders: cada paso nombra archivo, símbolo y assert concreto.
