# Plan de Implementación — Fase 2: Unificación Visual 1:1 RP Hypertrophy en Toda la App

**Fecha:** 2026-10-27
**Rama:** `feat/repyntra-rp-restructure`
**Objetivo:** Eliminar el efecto "popurrí" unificando el 100% de las pantallas, modales, timers y tipos de ejercicios (Bodyweight, Isométricos, Cardio) bajo el sistema de diseño técnico 1:1 de **RP Hypertrophy App**, manteniendo nuestra paleta (`#050506` / `#17171a` / `#C4F13A` lima) y todas las pruebas unitarias y visuales en verde.

---

## 1. Diagnóstico de Problemas Detectados

### A. Por qué ejercicios como "Dominadas" y "Elevación de Rodillas" salían con el estilo viejo
1. **Bifurcación en `components/workout/SetRow.tsx`:**
   - `SetRow.tsx` delega en 3 componentes según el tipo de ejercicio:
     - `SetRowStandard.tsx` (actualizado a 1:1 RP en Fase 1).
     - `SetRowBodyweight.tsx` (`state.isBodyweight && !state.isCardio`) → **quedó con el diseño viejo** (`OBJ: 84k x 7` arriba, badge circular `1`, columna previa `+84k`, inputs `rounded-[9px]` con borde verde y botón circular `✓`).
     - `SetRowIsometric.tsx` (`state.isIsometric`) → **quedó con el diseño viejo**.
2. **Mojibake `'â€”'` en `components/workout/setRow/useSetRowState.tsx`:**
   - En las líneas 340, 346 y 355 de `useSetRowState.tsx`, el guion largo `'—'` estaba mal codificado como `'â€”'`.
3. **Etiqueta `||| TRUNK` sin traducir y `MuscleTag` duplicado:**
   - En `ExerciseCardExpanded.tsx`, `resolveMuscleLabel(ex.slotLabel || ex.muscle)` recibía `slotLabel: "TRUNK"` en días KONG, que no estaba mapeado en `utils/muscle.ts`.
   - Existía un archivo antiguo `components/workout/MuscleTag.tsx` (sin el icono `|||`) usado todavía por `ExerciseDetailModal.tsx` y `ExerciseCardCollapsed.tsx`.

### B. Por qué el resto de secciones parecía un "popurrí"
1. **Tokens heredados "Material 3 Expressive" en `index.css` y `styles/app-polish.css`:**
   - `--shape-card-radius: 24px`, `--shape-segment-radius: 18px`, `--shape-hero-radius: 30px`, `.premium-form-input` (`border-radius: 16px`), `.premium-filter-pill` (`border-radius: 9999px`) y `.btn-primary-reference` (`border-radius: 9999px`) generaban tarjetas infladas y botones píldora.
   - Clases `.tonal-1..4`, `.premium-theme-quiet` y `.premium-profile .card-reference` mezclaban verde lima en los fondos de las tarjetas creando manchas verde oliva que chocan con las superficies limpias `#17171a` (`bg-surface-raised`) de RP.
2. **Barra de navegación inferior (`Layout.tsx`) y `More` Sheet:**
   - `NavBtn` aún tenía la píldora ovalada Material 3 (`bg-primary-500/20 rounded-full h-8`) alrededor del icono activo, en lugar del estilo plano de RP (icono + texto iluminados en color acento, sin burbuja de fondo).
3. **Vistas secundarias y modales con diseño anterior:**
   - `RestTimerActive.tsx` (píldora flotante `rounded-full` verde oliva en vez de barra técnica `rounded-[8px]` con botones `rounded-[4px]`).
   - `HomeRecapStrip.tsx`, `HomeEmptyState.tsx`, `HomeMesoSettingsModal.tsx`, `PlanActionsSheet.tsx`, `QuickStartSheet.tsx`.
   - `ExercisesListMode.tsx`, `ExercisesEditMode.tsx`, `ExerciseSelector.tsx`, `ExerciseDetailModal.tsx`.
   - `HistoryView.tsx`, `HistoryDetailView.tsx`, `HistoryEditExercise.tsx`.
   - `StatsViewImpl.tsx`, `StatsHeader.tsx`, `StatsOverviewTab.tsx`, `StatsProgressTab.tsx`, `StatsVolumeTab.tsx`, `PremiumTrendCard.tsx`.
   - `NutriView.tsx` (donde además `.seg-reference` apilaba las 3 pestañas `Hoy / Cuerpo / Tendencias` verticalmente), `TodayTab.tsx`, `BodyTab.tsx`, `HistoryTab.tsx`.
   - `ProfileSheet.tsx` y sus 7 secciones (`AccountSection`, `BodySection`, `TrainingSection`, `AppearanceSection`, `DataSection`, `AdvancedSection`, `DangerSection`).
   - `WorkoutFinishSheet.tsx`, `SessionSummaryView.tsx`, `WarmupModal.tsx`, `ReorderExercisesSheet.tsx`, `FreestyleSessionModal.tsx`, `ProgramHub.tsx` (`HubPanels.tsx`, `ProgramDetailView.tsx`).

---

## 2. Reglas del Sistema de Diseño 1:1 RP Hypertrophy (Guía Canónica)

1. **Geometría y Radios:**
   - Contenedores / Tarjetas: `rounded-[8px]` (`--shape-card-radius: 8px`), borde `1px solid rgb(var(--border-subtle))`, superficie `bg-surface-raised` (`#17171a` en dark) sin tintes oliva en modo oscuro.
   - Botones, Inputs, Selectores Segmentados, Filtros: `rounded-[4px]` o `rounded-[6px]` (`--shape-segment-radius: 6px`). Cero `rounded-full` en botones de acción o filtros (solo avatares o indicadores circulares de progreso).
   - Modales y Bottom Sheets (`Sheet.tsx`): esquinas superiores `rounded-t-[12px]`, modales centrados `rounded-[8px]`, cabecera con título en mayúsculas/negrita y divisor `border-b border-border-subtle`.
2. **Tipografía y Jerarquía:**
   - Cabeceras de vista: estilo RP `text-[20px] sm:text-[22px] font-black uppercase tracking-tight text-white`.
   - Subtítulos y cabeceras de tabla/sección: `text-[11px] font-bold uppercase tracking-wider text-zinc-400`.
3. **Etiquetas Musculares (`MuscleTag`):**
   - Unificar `components/ui/MuscleTag.tsx` y `components/workout/MuscleTag.tsx` con el diseño RP (`rounded-[4px]` + icono de 3 barras verticales `|||` + paleta semántica por grupo muscular: pecho, espalda, piernas, hombros, brazos, abdomen/core, cardio).

---

## 3. Plan de Ejecución en 6 Dominios Disjuntos (Subagentes + Auditoría Principal)

### Tarea 1: Unificación de `SetRow` (Bodyweight, Isométrico, Standard), `MuscleTag` por Color y Overlays de Entreno
- **Archivos:**
  - `components/workout/setRow/SetRowBodyweight.tsx`
  - `components/workout/setRow/SetRowIsometric.tsx`
  - `components/workout/setRow/SetRowStandard.tsx`
  - `components/workout/setRow/useSetRowState.tsx`
  - `components/ui/MuscleTag.tsx`
  - `components/workout/MuscleTag.tsx`
  - `utils/muscle.ts`
  - `components/workout/exerciseCard/ExerciseCardExpanded.tsx`
  - `components/workout/exerciseCard/ExerciseCardCollapsed.tsx`
  - `components/ui/restTimer/RestTimerActive.tsx`
  - `views/workout/WorkoutFinishSheet.tsx`
  - `views/SessionSummaryView.tsx`
  - `components/ui/WarmupModal.tsx`
  - `components/workout/ReorderExercisesSheet.tsx`
  - `components/workout/FreestyleSessionModal.tsx`
- **Cambios:**
  - Reescribir `SetRowBodyweight.tsx` y `SetRowIsometric.tsx` con la misma estructura 1:1 RP que `SetRowStandard.tsx`: botón `[⋮]` (`SetRowActionMenu`) a la izquierda, cajas rectangulares oscuras `rounded-[6px]` (`bg-surface-app border border-border-subtle`) para `+KG` y `REPS` (o `HoldTimer` en isométricos), y casilla cuadrada `LOG` (`rounded-[4px]`) a la derecha. Mantener `<span data-testid="set-target" className="sr-only text-[11px]">` para compatibilidad con tests.
  - Corregir `'â€”'` por `'—'` en `useSetRowState.tsx`.
  - En `utils/muscle.ts`, traducir etiquetas de bloque (`TRUNK` → `Abdomen`/`Core`, `PUSH` → `Empuje`/`Push`, `PULL` → `Tirón`/`Pull`, `LEGS` → `Piernas`/`Legs`, `ARMS` → `Brazos`/`Arms`) y en `ExerciseCardExpanded.tsx` priorizar `ex.muscle` sobre `ex.slotLabel` para el `MuscleTag`.
  - Dotar a `MuscleTag.tsx` de colores distintivos estilo RP por grupo muscular y re-exportarlo desde `components/workout/MuscleTag.tsx`.
  - Rediseñar `RestTimerActive.tsx` (barra compacta `rounded-[8px]` con fondo `bg-surface-base border border-border-subtle` y botones `-10s`, `+30s`, `Skip` en `rounded-[4px]`, y vista expandida limpia).
  - Adaptar `WorkoutFinishSheet.tsx`, `SessionSummaryView.tsx`, `WarmupModal.tsx`, `ReorderExercisesSheet.tsx` y `FreestyleSessionModal.tsx` a tarjetas `rounded-[8px]` y botones `rounded-[6px]`.

### Tarea 2: Tokens Globales (`index.css`, `app-polish.css`), Shell (`Layout.tsx`, `Sheet.tsx`, `Button.tsx`) y Home/Mesos Hub
- **Archivos:**
  - `index.css`
  - `styles/app-polish.css`
  - `components/layout/Layout.tsx`
  - `components/ui/Sheet.tsx`
  - `components/ui/Button.tsx`
  - `components/ui/ConfirmModal.tsx`
  - `views/home/HomeRecapStrip.tsx`
  - `views/home/HomeEmptyState.tsx`
  - `views/home/HomeMesoSettingsModal.tsx`
  - `components/home/PlanActionsSheet.tsx`
  - `components/home/QuickStartSheet.tsx`
  - `components/programs/hub/HubPanels.tsx`
  - `components/programs/ProgramDetailView.tsx`
- **Cambios:**
  - En `index.css` y `styles/app-polish.css`:
    - Cambiar `--shape-card-radius: 8px;`, `--shape-segment-radius: 6px;`, `--shape-hero-radius: 8px;`.
    - Cambiar `.btn-primary-reference`, `.premium-form-input` y `.premium-filter-pill` a bordes técnicos (`border-radius: 6px` y `4px` respectivamente).
    - En `html.dark`, hacer que `.tonal-1..4`, `.premium-theme-quiet` y `.premium-profile .card-reference` usen `rgb(var(--surface-raised))` neutro sin tinte verde oliva (manteniendo intactos los colores de `html.light .tonal-1..4` que valida el test WCAG AA en modo claro).
  - En `Layout.tsx`: quitar la burbuja ovalada Material 3 de `NavBtn` y usar estilo RP plano (icono + etiqueta activos en acento lima con indicador superior sutil), y estilizar el drawer `More` con filas `rounded-[6px]` y bordes `border-border-subtle`.
  - En `HomeRecapStrip.tsx`, `HomeEmptyState.tsx`, `HomeMesoSettingsModal.tsx`, `PlanActionsSheet.tsx`, `QuickStartSheet.tsx` y `HubPanels.tsx`: llevar todas las tarjetas a `rounded-[8px]`, cabeceras en mayúsculas estilo RP y botones `rounded-[6px]`.

### Tarea 3: Biblioteca de Ejercicios (`ExercisesView`), Selector (`ExerciseSelector`) y Detalle (`ExerciseDetailModal`)
- **Archivos:**
  - `views/ExercisesView.tsx`
  - `views/exercises/ExercisesListMode.tsx`
  - `views/exercises/ExercisesEditMode.tsx`
  - `views/exercises/ExercisesDialogs.tsx`
  - `views/exercises/useExercisesViewState.tsx`
  - `components/ui/ExerciseSelector.tsx`
  - `components/ui/ExerciseDetailModal.tsx`
- **Cambios:**
  - Rediseñar `ExercisesListMode.tsx` y `useExercisesViewState.tsx` (`Row`) al estilo 1:1 de la pestaña `Exercises` de RP:
    - Cabecera con buscador `rounded-[6px]`, chips rectangulares `rounded-[4px]` (`ALL / CUSTOM / ARCHIVED` y filtros por grupo muscular en mayúsculas).
    - Lista de ejercicios con filas técnicas (`rounded-[6px]`, `bg-surface-raised border border-border-subtle`), mostrando `MuscleTag` (`||| MÚSCULO`) arriba, nombre del ejercicio en negrita (`text-[15px] font-bold`), subtítulo de tipo/equipamiento y acciones limpias a la derecha.
    - Botón de crear ejercicio `+` en `rounded-[8px]`.
  - Unificar `ExerciseSelector.tsx` (usado al añadir/reemplazar ejercicio en entreno y en Meso Builder) con el mismo estilo de filas `rounded-[6px]` y `MuscleTag`.
  - Rediseñar `ExerciseDetailModal.tsx` con cabecera técnica RP, `MuscleTag` con `|||`, pestañas rectangulares `rounded-[4px]` y tablas de historial/récords limpias.

### Tarea 4: Historial (`HistoryView`, `HistoryDetailView`, `HistoryEditExercise`) y Estadísticas (`StatsView`)
- **Archivos:**
  - `views/HistoryView.tsx`
  - `views/history/HistoryDetailView.tsx`
  - `views/history/HistoryEditExercise.tsx`
  - `views/StatsView.tsx`
  - `views/StatsViewImpl.tsx`
  - `views/stats/StatsHeader.tsx`
  - `views/stats/StatsOverviewTab.tsx`
  - `views/stats/StatsProgressTab.tsx`
  - `views/stats/StatsVolumeTab.tsx`
  - `views/stats/StatsWidgets.tsx`
  - `views/stats/RepMaxTable.tsx`
  - `components/stats/PremiumTrendCard.tsx`
  - `components/stats/StatsScopeSelector.tsx`
  - `components/stats/WeeklyReportCard.tsx`
- **Cambios:**
  - `HistoryView.tsx`: cabecera `HISTORIAL` en `font-black uppercase`, botón `CSV` rectangular `rounded-[4px]`, buscador `rounded-[6px]`, y tarjetas de sesión completada con bordes `rounded-[8px]`, badge rectangular de fecha/semana (`SEMANA X` / fecha), duración y tabla compacta de ejercicios × mejor serie.
  - `HistoryDetailView.tsx` y `HistoryEditExercise.tsx`: cabecera superior estilo RP, celdas de resumen `rounded-[6px]`, tarjetas de ejercicio con `MuscleTag` (`|||`) y filas de series estilo tabla RP.
  - `StatsView.tsx` y sub-vistas: barras de pestañas (`RESUMEN | PROGRESO | VOLUMEN` y `ESTE PLAN | TODO EL HISTORIAL`) con diseño técnico rectangular `rounded-[6px]` (botones `rounded-[4px]`), tarjetas de gráficos y métricas en `bg-surface-raised border border-border-subtle rounded-[8px]` sin el tinte verde oliva en dark mode.

### Tarea 5: Nutrición (`NutriView`) y Perfil / Ajustes (`ProfileSheet`)
- **Archivos:**
  - `views/NutriView.tsx`
  - `views/nutri/TodayTab.tsx`
  - `views/nutri/BodyTab.tsx`
  - `views/nutri/HistoryTab.tsx`
  - `views/nutri/WaterTracker.tsx`
  - `components/nutrition/AddMealModal.tsx`
  - `components/nutrition/AddCardioModal.tsx`
  - `components/nutrition/LogWeightModal.tsx`
  - `components/profile/ProfileSheet.tsx`
  - `components/profile/sections/AccountSection.tsx`
  - `components/profile/sections/BodySection.tsx`
  - `components/profile/sections/TrainingSection.tsx`
  - `components/profile/sections/AppearanceSection.tsx`
  - `components/profile/sections/DataSection.tsx`
  - `components/profile/sections/AdvancedSection.tsx`
  - `components/profile/sections/DangerSection.tsx`
- **Cambios:**
  - `NutriView.tsx`: corregir el selector `.seg-reference` para que las 3 pestañas (`HOY | CUERPO | TENDENCIAS`) se muestren en una fila horizontal de 3 columnas (`grid-cols-3`) con botones rectangulares `rounded-[4px]`, y llevar todas las tarjetas de macros, agua, peso y comidas a `rounded-[8px]` sobre `bg-surface-raised` con botones `rounded-[6px]`.
  - `ProfileSheet.tsx` y sus 7 secciones: eliminar el estilo burbuja y el tinte oliva de `.premium-profile`, rediseñar el banner `INSTALAR APP` como tarjeta técnica compacta `rounded-[8px]` con borde lima sutil, y estandarizar todas las tarjetas, selectores de unidad (`KG / LB`), tema y botones a `rounded-[6px]` / `rounded-[8px]`.

### Tarea 6: Auditoría Integral, Suite Unitaria (810 tests) y Regeneración de Capturas Visuales (Playwright)
- Verificar `npm run lint`, `npm run build`, `npm run test:run` (145 suites / 810 tests) y `npx playwright test --config playwright.visual.config.ts --update-snapshots` (23/23 tests).
- Inspeccionar visualmente todas las capturas (`home`, `workout`, `history`, `stats`, `nutrition`, `profile` en dark y light) para confirmar que toda la aplicación comparte el mismo lenguaje visual 1:1 de RP Hypertrophy.
