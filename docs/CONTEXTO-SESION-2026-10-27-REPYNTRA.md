# Contexto de sesión — Repyntra 1:1 RP Hypertrophy + Branding Peak Signal (2026-10-27)

Resumen para retomar este trabajo sin releer toda la conversación. Rama de trabajo:
`feat/repyntra-rp-restructure` (el propietario decidió **dejar la rama como está**:
sin merge a `main` y sin PR por ahora).

## 1. Qué se pidió en la re-auditoría

1. **Copia visual y estructural 1:1 de RP Hypertrophy App (`https://rpstrength.com/pages/hypertrophy-app`):**
   - Copiar estructura, espaciados, localización de cada elemento, cabeceras, etiquetas musculares, tarjetas de ejercicio expandidas, tabla de sets de 3 columnas (`[⋮] | WEIGHT | REPS ⓘ | LOG`), menú flotante por set, `FeedbackModal` de 4 secciones simultáneas en una sola vista, pantalla `Templates` y constructor `Meso Builder`, conservando nuestra paleta (`#050506` dark / `#C4F13A` lima / tokens semánticos) y soporte bilingüe ES/EN.
2. **Branding oficial "Peak Signal" desde `C:\Dev\gainslab-gpt6-sync-ui`:**
   - Reemplazar el logo viejo (matraz de GainsLab con fondo ajedrezado blanco) por el símbolo oficial **Peak Signal** (doble polilínea ascendente gris + lima con remate circular) y wordmark **Repyntra** (`Repy` blanco/oscuro + `ntra` lima) proveniente de `C:\Dev\gainslab-gpt6-sync-ui\artifacts\branding\repyntra\`.
3. **Ejecución con subagentes + auditoría del agente principal:**
   - Plan completo documentado en `docs/specs/reestructura-rp-1a1-repyntra-plan.md`.
   - Ejecución paralela por 5 subagentes especializados con dominios de archivos disjuntos y auditoría/pulido final del agente principal.

Documentos de la feature:
- Spec inicial: `docs/specs/reestructura-rp-repyntra.md`
- Plan inicial: `docs/specs/reestructura-rp-repyntra-plan.md`
- Plan de re-auditoría 1:1 RP + Peak Signal: `docs/specs/reestructura-rp-1a1-repyntra-plan.md`

## 2. Qué se implementó (5 subagentes + auditoría y pulido del agente principal)

- **Subagente 1 — Branding "Peak Signal" & Iconografía (`components/ui/Logo.tsx`, `public/assets/branding/`, `public/assets/icons/`):**
  - Copiados todos los activos vectoriales y PNG desde `C:\Dev\gainslab-gpt6-sync-ui\artifacts\branding\repyntra\` a `public/assets/branding/` (`repyntra-color-dark.svg/png`, `repyntra-color-light.svg/png`, `repyntra-mono-white.svg`, `repyntra-mono-black.svg`, `repyntra-wordmark-dark.svg/png`, `repyntra-wordmark-light.svg/png`).
  - Sobrescritos `public/assets/branding/repyntra-icon.png` (transparente) y `repyntra-lockup.png`.
  - Regenerados `public/assets/icons/icon-{48,72,96,128,192,256,512}.png` y `maskable-{192,512}.png` desde `repyntra-color-dark.png`.
  - Reescrito `components/ui/Logo.tsx` con SVG inline reactivo al tema (`viewBox="-6 -6 112 112"` para no recortar los remates redondos) + wordmark tipográfico `Repy` + `ntra`.

- **Subagente 2 — Barra Inferior 1:1 RP (5 tabs planos), `More` Sheet, Cabecera `WEEK X DAY Y` y Hub de Mesociclo (`components/layout/Layout.tsx`, `components/app/AppViews.tsx`, `views/HomeViewImpl.tsx`, `views/home/HomeTopSection.tsx`, `views/home/HomeWeekDayList.tsx`, `views/workout/WorkoutMain.tsx`):**
  - Barra inferior plana de 5 pestañas idénticas a RP: `Entreno/Workout`, `Mesos`, `Plantillas/Templates`, `Ejercicios/Exercises`, `Más/More` (sin botón central flotante elevado).
  - Drawer `More` con acceso directo a `Historial`, `Estadísticas`, `Nutrición` y `Perfil y Ajustes`.
  - Cabecera superior en `HomeTopSection.tsx` y `WorkoutMain.tsx` con jerarquía `SEMANA X` (blanco) + `DÍA Y` (gris) en una sola línea (`whitespace-nowrap`), subtítulo `<Día> · <Mesociclo>`, icono `Calendar` (abre drawer de semanas y días) y menú `⋮`.

- **Subagente 3 — `ExerciseCard` 1:1 RP, `MuscleTag`, `SetRow` de 3 columnas y `SetRowActionMenu` (`components/ui/MuscleTag.tsx`, `components/workout/SortableExerciseCardImpl.tsx`, `components/workout/exerciseCard/ExerciseCardExpanded.tsx`, `components/workout/ExerciseCardSets.tsx`, `components/workout/setRow/SetRowStandard.tsx`, `components/workout/setRow/SetRowActionMenu.tsx`):**
  - Nuevo componente `MuscleTag.tsx` con pill rectangular `rounded-[4px]` y barra triple vertical `|||` coloreada por grupo muscular.
  - Todas las tarjetas de ejercicio se muestran expandidas simultáneamente en la sesión activa, con título + subtítulo de equipamiento, iconos `History` y `⋮` a la derecha, y banner ámbar de nota fijada (`8-12 reps` + recomendación de progresión + icono `Pin`).
  - Tabla de sets 1:1 RP de 3 columnas (`[⋮] | PESO/WEIGHT | REPS ⓘ | LOG`) con inputs rectangulares oscuros, menú flotante por set (`Add set above`, `Add set below`, `Skip set`, `Delete set` + selector `Regular / Warmup / Dropset / Failure`), checkbox cuadrado `LOG` (`rounded-[4px]`) y botón inferior `+ Add a Set` de ancho completo.

- **Subagente 4 — `FeedbackModal` 1:1 RP en una sola pantalla (`components/ui/FeedbackModal.tsx`):**
  - Modal en una sola vista con las 4 secciones simultáneas de RP para el músculo activo y tabs superiores cuando hay varios músculos:
    1. `Joint pain` (`NONE`, `LOW`, `MODERATE`, `A LOT`)
    2. `<Músculo> soreness` (`NONE`, `A LITTLE`, `SOME`, `A LOT`)
    3. `<Músculo> pump` (`LOW`, `MODERATE`, `AMAZING`)
    4. `<Músculo> volume` (`EASY`, `PRETTY GOOD`, `PUSHED LIMITS`, `TOO MUCH`)
  - Mapeo íntegro al payload `{ soreness, pump, workload, pain: { hasPain, location, severity } }` esperado por el motor de progresión.

- **Subagente 5 — `Templates` 1:1 RP y `Meso Builder` (`views/home/TemplateSelector.tsx`, `views/ProgramEditView.tsx`, `views/programEdit/ProgramEditDays.tsx`):**
  - `TemplateSelector.tsx` rediseñado como lista vertical limpia 1:1 con RP: buscador superior, pills de filtro (`ALL / EMPHASIS / SEX / FREQUENCY`), filas con título, subtítulo en mayúsculas y badge rectangular `X/WEEK` a la derecha junto al chevron.
  - `ProgramEditView.tsx` y `ProgramEditDays.tsx` con selector horizontal de días (`Mon..Sun` / `Day 1..N`), cabecera del día con acciones, slots con `MuscleTag`, selector de ejercicio y botón ancho `+ Add a muscle group`.

## 3. Verificación (auditoría final del agente principal, con evidencia)

- `npm run lint` → **exit 0** (0 errores, 0 warnings)
- `npm run build` → **exit 0** (TypeScript + Vite production bundle + SW precache)
- `npm run test:run` → **145/145 archivos pasados (810/810 tests)**, incluyendo todos los guardrails arquitectónicos (`i18nRatchet.test.ts`, `lightModeContrast.test.ts`, `textSizeFloor.test.tsx`, `progressionUI.test.tsx`, `warmupEligibility.test.tsx`, `accessibleSemantics.test.tsx`, `finishFlow.spec.ts`, `homeHubOrder.spec.ts`).
- `npx playwright test --config playwright.visual.config.ts` → **23/23 tests visuales y de contraste WCAG AA pasados** (dark & light) con baselines actualizadas e inspeccionadas visualmente (`home-dark.png`, `workout-dark.png`, `workout-menu-dark.png`, `workout-light.png`).

---

## 4. Fase 2 — Unificación Total 1:1 RP Hypertrophy App (Sin "Popurrí")

Spec técnica de la Fase 2: `docs/specs/reestructura-rp-fase2-unificacion-plan.md`.

### A. Fix de Ejercicios Bodyweight e Isométricos + Mojibake + `MuscleTag`
- **`SetRowBodyweight.tsx` y `SetRowIsometric.tsx`:** Reescritos 1:1 con `SetRowStandard.tsx` (`[⋮] | +KG | REPS | LOG` e `[⋮] | +KG | SEG | LOG`, checkbox cuadrado `rounded-[3px]`, `SetRowActionMenu`, sin el pill viejo `OBJ: 84k x 7` ni el botón redondo `(✓)`).
- **`useSetRowState.tsx`:** Corregido el mojibake `'â€”'` por `'—'` en los placeholders de recomendaciones vacías.
- **`utils/muscle.ts` (`resolveMuscleLabel`):** Añadido mapeo de etiquetas de slot KONG (`TRUNK` -> `Abdomen` / `Abs / Core`, `PUSH`, `PULL`, `LEGS`, `ARMS`, `UPPER`, `LOWER`) conservando etiquetas personalizadas (`slotLabel`).
- **`components/ui/MuscleTag.tsx` y `components/workout/MuscleTag.tsx`:** Unificados con colorización semántica por grupo muscular (rojo pecho, ámbar espalda, violeta hombros, azul piernas, cian brazos, verde abdomen/core).

### B. Tokens Globales, Navegación y Modales de Entrenamiento
- **`index.css` y `styles/app-polish.css`:** Radios globales reducidos a geometría técnica RP (`--shape-card-radius: 8px`, `--shape-segment-radius: 6px`, `--shape-hero-radius: 8px`), eliminados los tintes oliva de `html.dark .tonal-1..4` en favor de superficies neutras (`#17171a` / `#1f1f24`), y `.seg-reference` ajustado con `grid-auto-flow: column; grid-auto-columns: 1fr` para soportar N segmentos.
- **`Layout.tsx`, `Sheet.tsx`, `Button.tsx`, `ConfirmModal.tsx`:** Barra inferior de 5 pestañas plana estilo RP (sin óvalo flotante Material-3), drawer `More` con filas técnicas `rounded-[6px]`, y modales/sheets con bordes rectos `rounded-[8px]` / `rounded-t-[12px]`.
- **Overlays de Workout:** `RestTimerActive.tsx`, `WorkoutFinishSheet.tsx`, `SessionSummaryView.tsx`, `WarmupModal.tsx`, `ReorderExercisesSheet.tsx` y `FreestyleSessionModal.tsx` rediseñados al lenguaje 1:1 RP.

### C. Biblioteca de Ejercicios, Historial, Estadísticas, Nutrición y Perfil
- **Exercises (`ExercisesView`, `ExercisesListMode`, `ExercisesEditMode`, `ExerciseSelector`, `ExerciseDetailModal`):** Cabecera condensada uppercase, buscador `rounded-[6px]`, chips de filtro `rounded-[4px]` y filas con `MuscleTag` (`|||`).
- **History & Stats (`HistoryView`, `HistoryDetailView`, `StatsViewImpl`, `StatsHeader`, `StatsOverviewTab`, `StatsProgressTab`, `StatsVolumeTab`, `StatsWidgets`, `RepMaxTable`, `PremiumTrendCard`, `WeeklyReportCard`):** Segmented controls planos `rounded-[6px]`, tarjetas técnicas `#17171a` `rounded-[8px]` y tablas densas tabular-nums.
- **Nutri & Profile (`NutriView`, `TodayTab`, `BodyTab`, `HistoryTab`, `WaterTracker`, `AddMealModal`, `AddCardioModal`, `LogWeightModal`, `ProfileSheet`, `BodyMetricsModal`, `CsvImportSheet`, `DriveBackupCard`, `HealthConnectCard` y `components/profile/sections/*`):** Unificados con tarjetas `rounded-[8px]` `bg-surface-raised`, inputs `rounded-[6px]` y controles `rounded-[4px]`.

