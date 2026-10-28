# Plan de Implementación: Réplica Visual 1:1 RP Hypertrophy App + Branding Repyntra Peak Signal

**Fecha:** 2026-10-27
**Rama:** `feat/repyntra-rp-restructure`
**Referencias:**
- RP Hypertrophy App (`https://rpstrength.com/pages/hypertrophy-app`): capturas de referencia en `scratch/rp-ref/{add-set.png, templates.png, feedback.png, builder-0..4.png}`
- Branding oficial Repyntra ("Peak Signal"): `C:\Dev\gainslab-gpt6-sync-ui\artifacts\branding\repyntra\` y `C:\Dev\gainslab-gpt6-sync-ui\kmp\androidApp\src\main\kotlin\com\gabsvm\gainslab\android\brand\RepyntraWordmark.kt`

---

## Resumen de Objetivos

1. **Branding Real de Repyntra ("Peak Signal"):**
   - Reemplazar el matraz antiguo de GainsLab (que tenía fondo blanco damero incrustado) por el símbolo **Peak Signal** (dos polilíneas ascendentes paralelas) y el wordmark **Repyntra** (`Repy` en blanco/superficie + `ntra` en verde lima de acento `#C4F13A` / `text-primary-500`) proveniente de `C:\Dev\gainslab-gpt6-sync-ui`.
   - Regenerar todos los iconos PWA/Android (`public/assets/icons/icon-*.png` y `maskable-*.png`) y assets en `public/assets/branding/` a partir de los archivos limpios de `C:\Dev\gainslab-gpt6-sync-ui\artifacts\branding\repyntra\`.
   - Implementar [`Logo.tsx`](file:///C:/Dev/IronLog-React/components/ui/Logo.tsx) con SVG vectorial reactivo al tema que replica las coordenadas exactas de `RepyntraWordmark.kt`.

2. **Estructura Visual 1:1 con RP Hypertrophy App (conservando paleta oscura/lima y soporte bilingüe ES/EN):**
   - **Barra de navegación inferior (`Layout.tsx`):** 5 pestañas planas estilo RP (`Workout · Mesos · Templates · Exercises · More`), sin botón flotante central `+`, visible también en la pantalla `Workout`.
   - **Pestaña `More`:** Abre un panel/sheet limpio con acceso directo a `History`, `Stats`, `Nutrition` y `Profile / Settings` (además de herramientas del mesociclo).
   - **Cabecera `Workout` (`WEEK X DAY Y`):** En el tope izquierdo muestra `WEEK {week}` (blanco bold) + `DAY {day}` (gris bold) en la primera línea, y `{dayName} · {mesoName}` en la segunda línea. En el tope derecho muestra el botón de **Calendario** (abre el drawer de semanas/días del mesociclo) y el botón **`⋮`** (acciones de sesión/día). Sin el bloque gigante `"Tu sesión 0:00"`.
   - **Tarjetas de Ejercicio (`ExerciseCardExpanded.tsx`):**
     - Todas las tarjetas expandidas por defecto en `Workout` (`rounded-[8px]`, `border-border-subtle`, `bg-surface-raised`).
     - Tag rectangular superior izquierdo (`rounded-[4px]`, icono `|||` de 3 barras verticales + grupo muscular en mayúsculas).
     - Título del ejercicio + subtítulo de equipamiento a la izquierda; únicamente 2 iconos a la derecha: `History` y `⋮`.
     - Barra de nota fijada / rango objetivo debajo del título (`rounded-[4px]`, icono `SquarePen` a la izquierda + texto p.ej. `7-12 reps` + icono `Pin` a la derecha).
   - **Tabla de Series y Menú `⋮` por Serie (`ExerciseCardSets.tsx`, `SetRowStandard.tsx`):**
     - Cabecera de 3 columnas: `[⋮] | WEIGHT | REPS ⓘ | LOG` (`PESO | REPS ⓘ | LOG` en ES).
     - Filas planas con `border-b`, sin tarjetas redondeadas individuales, sin barra `OBJ:` superior, sin columna `ANT.` y sin barra inferior `- QUITAR SERIE / + AÑADIR SERIE`.
     - Botón `⋮` a la izquierda de cada fila que abre el menú contextual RP (`Set`: *Add set below*, *Skip set*, *Delete set*; `Set Type`: *Regular*, *Myorep*, *Myorep Match*, *Drop*, *Warmup*).
     - Cajas de entrada rectangulares (`rounded-[4px]`) centradas para `WEIGHT` y `REPS` (mostrando el objetivo/hint cuando está vacío) y checkbox cuadrado (`22x22px`, `rounded-[3px]`) a la derecha para `LOG`.
   - **Modal de Feedback (`FeedbackModal.tsx`):**
     - Vista única (sin wizard paso a paso) idéntica a `rp26-hype-app_feedback_v2.png` con las 4 secciones apiladas y botones rectangulares (`rounded-[4px]`):
       1. `Joint pain` (4 opciones)
       2. `<Muscle> soreness` (4 opciones)
       3. `<Muscle> pump` (3 opciones)
       4. `<Muscle> volume` (4 opciones)
     - Botones inferiores `Cancel` y `Save`, mapeando al contrato `{ soreness, performance, adjustment }` del motor de progresión existente.
   - **Pantallas `Templates` (`TemplateSelector.tsx`) y `Meso Builder` (`ProgramEditView.tsx`, `ProgramEditDays.tsx`):**
     - `Templates`: Cabecera `Templates` + `+`, buscador `Search`, barra `Filters`, y lista plana `border-b` con categoría en mayúsculas, nombre en blanco, badges rectangulares `X/WEEK` y chevron `>`.
     - `Meso Builder`: Selector horizontal segmentado de días (`Day 1 | Day 2 | ...`) arriba, lista plana de grupos musculares/ejercicios del día activo con drag handle `⋮⋮`, badge `|||`, ejercicio `⚡` y papelera `🗑️`, botón flotante `+` y CTA inferior de ancho completo.

---

## Tareas de Ejecución

### Tarea 1: Branding Repyntra "Peak Signal" & Regeneración de Iconos
- **Archivos:**
  - `public/assets/branding/*`
  - `public/assets/icons/*`
  - `components/ui/Logo.tsx`
- **Acciones:**
  - Copiar `repyntra-color-dark.{svg,png}`, `repyntra-color-light.{svg,png}`, `repyntra-foreground-transparent.{svg,png}`, `repyntra-monochrome-white.{svg,png}`, `repyntra-monochrome-black.{svg,png}`, `wordmark-dark.png`, `wordmark-light.png` desde `C:\Dev\gainslab-gpt6-sync-ui\artifacts\branding\repyntra\` hacia `public/assets/branding/`.
  - Actualizar `repyntra-icon.png` y `repyntra-lockup.png` y regenerar `public/assets/icons/icon-{48,72,96,128,192,256,512}.png` y `maskable-{192,512}.png` sin ningún fondo blanco residual.
  - Reescribir `components/ui/Logo.tsx` con el SVG vectorial Peak Signal (`RepyntraPeakDominant` + `RepyntraPeakCompanion`) y el wordmark tipográfico `Repy` + `ntra`.

### Tarea 2: Barra de Navegación Inferior 1:1 RP (5 Pestañas Planas) y Shell de Vistas
- **Archivos:**
  - `components/layout/Layout.tsx`
  - `components/app/AppViews.tsx`
  - `constants/translations.es.ts`
  - `constants/translations.en.ts`
- **Acciones:**
  - Actualizar `Layout.tsx` para mostrar 5 pestañas planas (`Workout`, `Mesos`, `Templates`, `Exercises`, `More`) sin botón flotante central `+`, visibles en las pantallas principales incluyendo `Workout`.
  - En `More`, abrir un menú/sheet limpio que permita navegar a `History`, `Stats`, `Nutrition`, y abrir `ProfileSheet` (ajustes/perfil), manteniendo compatibilidad con `currentView` (`'home' | 'workout' | 'mesos' | 'templates' | 'exercises' | 'history' | 'stats' | 'nutrition'`).

### Tarea 3: Cabecera `Workout` (`WEEK X DAY Y`), Drawer de Calendario y Vista `Mesos`
- **Archivos:**
  - `views/HomeViewImpl.tsx`
  - `views/home/HomeTopSection.tsx`
  - `views/home/HomeWeekDayList.tsx`
  - `views/workout/WorkoutMain.tsx`
  - `views/WorkoutViewImpl.tsx`
- **Acciones:**
  - Hacer que la vista principal de entrenamiento muestre la cabecera `WEEK X DAY Y` con subtítulo `{dayName} · {mesoName}`, botón de **Calendario** a la derecha (que abre el drawer/sheet con el selector de semanas `1..N + DELOAD` y la lista de días del mesociclo) y botón **`⋮`** con acciones de la sesión (Terminar entrenamiento, Añadir ejercicio, Reordenar, Saltar día, Guía, Reiniciar, etc.).
  - Eliminar el bloque gigante `"Tu sesión 0:00"` de `WorkoutMain.tsx`, manteniendo un indicador compacto cuando hay sesión en curso y acceso directo a finalizar sesión.
  - Hacer que cuando el usuario entra a `Workout` sin sesión activa, o bien vea directamente las tarjetas del día actual listas para registrar series (auto-iniciando/vinculando al registrar o mediante acción directa) o con la estructura exacta `WEEK X DAY Y` de RP.

### Tarea 4: `ExerciseCard`, `MuscleTag`, `SetRow` y Menú `⋮` por Serie (1:1 RP)
- **Archivos:**
  - `components/ui/MuscleTag.tsx`
  - `views/workout/useWorkoutViewState.ts`
  - `components/workout/SortableExerciseCardImpl.tsx`
  - `components/workout/exerciseCard/ExerciseCardExpanded.tsx`
  - `components/workout/ExerciseCardSets.tsx`
  - `components/workout/setRow/SetRowStandard.tsx`
  - `components/workout/setRow/SetRowActionMenu.tsx` (nuevo)
  - `components/workout/setRow/useSetRowState.tsx`
- **Acciones:**
  - `useWorkoutViewState.ts`: Inicializar todas las tarjetas expandidas por defecto (`collapsedCards` vacío `{}`).
  - `MuscleTag.tsx`: Badge rectangular `rounded-[4px]` con icono de 3 barras verticales `|||` + nombre en mayúsculas.
  - `ExerciseCardExpanded.tsx`: Cabecera con `MuscleTag` arriba a la izquierda, título + subtítulo de equipo a la izquierda, solo 2 botones a la derecha (`History` y `⋮`), y barra fijada de nota/rango de reps (`SquarePen` + rango/nota + `Pin`) debajo. Sin barra inferior `- QUITAR SERIE / + AÑADIR SERIE`.
  - `ExerciseCardSets.tsx` y `SetRowStandard.tsx`: Cabecera `[⋮] | WEIGHT | REPS ⓘ | LOG`. Filas planas con `border-b`. Botón `⋮` izquierdo con `SetRowActionMenu` (*Add set below*, *Skip set*, *Delete set*, y *Set Type*: *Regular*, *Myorep*, *Myorep Match*, *Drop*, *Warmup*). Inputs rectangulares `rounded-[4px]` centrados y checkbox cuadrado `rounded-[3px]` a la derecha.

### Tarea 5: `FeedbackModal` 1:1 RP (`components/ui/FeedbackModal.tsx`)
- **Archivos:**
  - `components/ui/FeedbackModal.tsx`
- **Acciones:**
  - Rediseñar `FeedbackModal.tsx` para mostrar en una sola vista por músculo las 4 secciones de `rp26-hype-app_feedback_v2.png` (`Joint pain`, `<Muscle> soreness`, `<Muscle> pump`, `<Muscle> volume`) con botones rectangulares `rounded-[4px]`, cabecera `Feedback` + `X`, y botones inferiores `Cancel` y `Save`.
  - Conservar el callback `onConfirm(feedback)` con `{ soreness, performance, adjustment }` para mantener intacta la lógica de autorregulación.

### Tarea 6: `Templates` y `Meso Builder` 1:1 RP (`TemplateSelector.tsx`, `ProgramEditView.tsx`, `ProgramEditDays.tsx`)
- **Archivos:**
  - `views/home/TemplateSelector.tsx`
  - `views/ProgramEditView.tsx`
  - `views/programEdit/ProgramEditDays.tsx`
- **Acciones:**
  - `TemplateSelector.tsx`: Cabecera `Templates` + botón `+`, input `Search`, barra `Filters`, y filas planas `border-b` con categoría en mayúsculas, título en blanco, badge rectangular `X/WEEK` y chevron `>` a la derecha.
  - `ProgramEditView.tsx` / `ProgramEditDays.tsx`: Barra segmentada horizontal de días (`Day 1 | Day 2 | ...`) arriba, lista plana de bloques musculares/ejercicios del día seleccionado (`⋮⋮` drag handle, `|||` muscle tag, `⚡` ejercicio, `🗑️` eliminar), botón flotante `+` abajo a la derecha y CTA inferior de ancho completo.

### Tarea 7: Auditoría Principal, Ajuste de Tests y Verificación Visual
- **Archivos:**
  - `tests/unit/homeHubOrder.spec.ts`
  - `tests/unit/setRowTargets.spec.ts`
  - `tests/unit/finishFlow.spec.ts`
  - `tests/navLabels.spec.ts`
  - `tests/visual/screens.visual.ts`
- **Acciones:**
  - Auditar cada archivo modificado por los subagentes y pulir cualquier detalle visual o de código directamente.
  - Actualizar y ejecutar los tests unitarios y visuales (`npm run lint`, `npm run build`, `npm run test:run`, `npm run test:visual`) e inspeccionar las capturas resultantes frente a las imágenes de referencia de RP.
