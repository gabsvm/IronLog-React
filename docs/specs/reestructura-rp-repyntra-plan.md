# Reestructura RP (B) + Repyntra Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar Home, Sesión, Programa y Biblioteca con la estructura de uso de RP Hypertrophy y renombrar la marca visible a Repyntra, sin tocar lógica ni datos.

**Architecture:** Solo cambia la capa de render. Los hooks de estado (`useHomeViewState`, `useWorkoutViewState`), motores y servicios quedan intactos; cada tarea consume sus interfaces actuales y produce componentes con las mismas props.

**Tech Stack:** React 18, TypeScript, Tailwind 3, Vitest, Playwright visual.

**Spec:** [reestructura-rp-repyntra.md](/C:/Dev/IronLog-React/docs/specs/reestructura-rp-repyntra.md)

## Global Constraints

- Nombre visible: `Repyntra`. No cambiar `appId` (`com.gainslab.pro`), paquete npm, claves de almacenamiento ni firmas.
- Espaciado en pantallas tocadas: lateral 16px, bloques 16px, filas 8px, radio tarjeta 24px, táctil ≥44px.
- Sin textos, imágenes ni plantillas de RP. Solo organización funcional.
- Sin commits salvo petición expresa del propietario.
- Cada tarea termina con sus tests en verde antes de pasar a la siguiente.

---

### Task 1: Renombre visible e identidad

**Files:**
- Modify: `index.html` (title, application-name, apple-mobile-web-app-title, lockup alt)
- Modify: `public/manifest.json` (name, short_name)
- Modify: `capacitor.config.ts` (solo `appName`)
- Modify: `components/ui/Logo.tsx:20-30` (src, alt, texto Repyntra)
- Create: `public/assets/branding/repyntra-icon.png` (copia de `C:\Dev\GainsLab\assets\Gainslab-icono.png`)
- Create: `public/assets/branding/repyntra-lockup.png` (símbolo + wordmark Repyntra, derivado de `C:\Dev\GainsLab\assets\GainsLab-logo-nombre.png` re-rotulado)
- Modify: referencias a `gainslab-icon-clean.png`/`logo-lockup.png` encontradas por barrido

**Interfaces:**
- Consumes: activos fuente en `C:\Dev\GainsLab\assets\` (solo lectura).
- Produces: `Logo` con la misma API (`className`, `size`, `showText`); sin cambios para sus consumidores.

- [ ] **Step 1: Barrido de marca visible**

Run: `search "GainsLab" en index.html, public/, components/, views/, constants/`
Expected: lista cerrada de superficies visibles a renombrar (excluir claves internas y `appId`).

- [ ] **Step 2: Copiar activos y re-rotular**

Copiar el icono fuente a `repyntra-icon.png`; generar tamaños 48/72/96/128/192/256/512 en `public/assets/icons/` desde él; crear `repyntra-lockup.png` con el mismo símbolo y texto "Repyntra".

- [ ] **Step 3: Aplicar renombre**

Editar los archivos de la lista de Files con el nombre `Repyntra`; en `Logo.tsx` mantener estructura y solo cambiar `src`, `alt` y el texto partido (`Rep` + `yntra` con acento en la segunda parte).

- [ ] **Step 4: Verificar**

Run: `npm run build` y abrir el resultado buscando "Repyntra" en título/logo.
Expected: build verde; barrido repetido sin "GainsLab" en superficies visibles.

### Task 2: Home como hub del mesociclo

**Files:**
- Modify: `views/home/HomeTopSection.tsx` (cabecera + selector de semana)
- Create: `views/home/HomeWeekDayList.tsx` (filas de día con estado)
- Modify: `views/HomeViewImpl.tsx` (nuevo orden de bloques; retirar hero dominante)
- Modify: `views/home/HomeHeroCard.tsx` (dejar de usarlo en Home o reducirlo a acción del día; no borrar hasta confirmar cero usos)
- Test: `tests/homeRecap.spec.ts`, `tests/navLabels.spec.ts`

**Interfaces:**
- Consumes: `HomeViewState` de `views/home/useHomeViewState.ts` sin cambios (meso, semana, `safeProgram`, `selectedDayIdx`, `startSession`, estados de día).
- Produces: `HomeWeekDayList({ state }: { state: HomeViewState })`; Home renderiza bloques en el orden del spec §3.1.

- [ ] **Step 1: Test del orden de bloques**

Añadir a `tests/homeRecap.spec.ts` (o spec nuevo `tests/homeHubOrder.spec.ts`) una aserción de orden: cabecera → selector de semana → lista de días → acción Entrenar → recap, usando los selectores/ids ya presentes (`tut-*`) o `data-testid` nuevos mínimos.

- [ ] **Step 2: Ejecutar y ver fallar**

Run: `npx vitest run tests/homeHubOrder.spec.ts`
Expected: FAIL porque el hero sigue dominando y no existe la lista de días.

- [ ] **Step 3: Implementar**

Crear `HomeWeekDayList` reutilizando el cálculo de estado de día de `HomeTopSection`/`HomeHeroCard` (hecho/hoy/pendiente, sets totales); mover el selector de semana a `HomeTopSection`; reordenar `HomeViewImpl` según §3.1 con `px-4 space-y-4 pb-28`; la acción Entrenar llama a `startSession(selectedDayIdx)` como hoy.

- [ ] **Step 4: Verificar**

Run: `npx vitest run tests/homeHubOrder.spec.ts tests/homeRecap.spec.ts tests/navLabels.spec.ts`
Expected: PASS. Revisión visual a 390px sin solapes ni hero dominante.

### Task 3: Sesión con objetivo visible y feedback de cierre

**Files:**
- Modify: `views/workout/WorkoutMain.tsx` (orden visual objetivo→entrada por set)
- Modify: `components/ui/FeedbackModal.tsx` (presentación por músculo ya trabajado; mismo guardado)
- Modify: `views/workout/WorkoutFinishSheet.tsx` (feedback como paso final antes del resumen)
- Test: `tests/setRowTargets.spec.ts`, `tests/finishFlow.spec.ts`

**Interfaces:**
- Consumes: `useWorkoutViewState` y `handleSaveFeedback` actuales, sin cambios de firma.
- Produces: misma sesión y mismo objeto de feedback guardado; solo cambia presentación/orden.

- [ ] **Step 1: Tests primero**

Extender `setRowTargets.spec.ts`: cada fila de set expone objetivo (peso×reps, RIR) junto a la entrada. Extender `finishFlow.spec.ts`: al terminar, el feedback por músculo precede al resumen y guardar feedback produce el mismo payload que hoy.

- [ ] **Step 2: Ejecutar y ver fallar lo nuevo**

Run: `npx vitest run tests/setRowTargets.spec.ts tests/finishFlow.spec.ts`
Expected: FAIL solo en las aserciones nuevas.

- [ ] **Step 3: Implementar mínimo**

Reordenar en `WorkoutMain` las celdas existentes (sin añadir campos ni estado); conectar `WorkoutFinishSheet` → `FeedbackModal` → resumen con las props actuales.

- [ ] **Step 4: Verificar**

Run: `npx vitest run tests/setRowTargets.spec.ts tests/finishFlow.spec.ts tests/restPill.spec.ts`
Expected: PASS.

### Task 4: Programa y Biblioteca en orden RP

**Files:**
- Modify: `components/programs/ProgramHub.tsx` (orden: plantillas → crear mesociclo → mi programa)
- Modify: `views/ExercisesView.tsx` (buscador fijo arriba; lista por músculo sin cambios de datos)
- Test: `tests/programBackNav.spec.ts`, `tests/navLabels.spec.ts`

**Interfaces:**
- Consumes: props actuales de `ProgramHub` y estado de `ExercisesView`.
- Produces: mismos destinos y callbacks; solo orden visual.

- [ ] **Step 1: Implementar orden**

Reordenar secciones existentes en `ProgramHub`; fijar el buscador de `ExercisesView` en la parte superior del scroll.

- [ ] **Step 2: Verificar**

Run: `npx vitest run tests/programBackNav.spec.ts tests/navLabels.spec.ts`
Expected: PASS; navegación atrás intacta.

### Task 5: Cierre y verificación completa

**Files:**
- Modify: `docs/specs/reestructura-rp-repyntra.md` (marcar criterios cumplidos)
- Test: suite completa y visual

- [ ] **Step 1: Gates del repo**

Run: `npm run lint`, `npm run build`, `npm run test:run`
Expected: todo verde. Si un test falla, comparar contra `main` sin cambios para separar regresión de fallo previo y dejarlo anotado.

- [ ] **Step 2: Visual**

Run: `npm run test:visual`
Expected: PASS o snapshots actualizados solo en pantallas del spec, revisados a 390px.

- [ ] **Step 3: Barrido final de marca y datos**

Run: `search "GainsLab"` en superficies visibles; arranque con datos existentes (meso/logs) y comprobar carga idéntica.
Expected: sin marca antigua visible; datos intactos (criterio §4.6 del spec).
