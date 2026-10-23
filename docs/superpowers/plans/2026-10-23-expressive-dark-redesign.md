# Expressive Dark Redesign (Concepto 01) Implementation Plan

> **Goal:** Apply the "Concepto 01 · Expressive Dark" visual design system across GainsLab (Home, Workout, Stats, Shell navigation), honoring the dark OLED aesthetic, neon lime accents, 5-destination navigation with central FAB, and verified against all test suites.

- **Architecture:** Architectural
- **Target Branch:** `agent/gainslab-audit-fixes-v3`
- **Design Baseline:** Uploaded mockup `CONCEPTO 01 · EXPRESSIVE DARK` (Home / Workout / Stats).

---

## Proposed Changes

### 1. Design Tokens & Core Theme
- **Files:** `index.css`, `styles/app-polish.css`, `tailwind.config.js`
- Define tokens for:
  - Deep OLED background: `#0A0C0E`
  - Elevated surfaces: `#12151B`, `#181C24`, `#1F242D`
  - Expressive Lime accent: `#D4FC38` / `#C6F432` with high-contrast dark foreground `#0A0C0E`
  - Secondary accents: Purple (`#A855F7`), Teal (`#14B8A6`), Cyan (`#06B6D4`), Wine Red (`#3A1818`, border `#7F1D1D`)
  - Glow effects: `glow-lime`, `glow-chart`
  - Pill and card border radii (`rounded-2xl`, `rounded-3xl`, `rounded-full`).

### 2. Shell & 5-Destination Navigation with Center FAB
- **Files:** `components/layout/navigation.ts`, `components/layout/Layout.tsx`
- Implement 5 destinations:
  1. `Entrenar` (Dumbbell icon -> `home`)
  2. `Historial` (List icon -> `diary`, section `sessions`)
  3. `(+)` Central elevated neon lime circular FAB (triggers `QuickStartSheet` / Freestyle session)
  4. `Dieta` (Utensils icon -> `diary`, section `nutrition`)
  5. `Stats` (BarChart / TrendingUp icon -> `progress`)
- Top Bar: "GainsLab" bold title, Cloud sync status pill, "GS" user avatar circle.

### 3. Screen 1 — "Tu entrenamiento" (Home View)
- **Files:** `views/home/HomeTopSection.tsx`, `views/home/HomeHeroCard.tsx`, `views/HomeViewImpl.tsx`
- Header: "Tu entrenamiento", Subtitle: "Disciplina hoy, resultados mañana.".
- Active Meso Pill/Card: `KONG · BLOQUE 1`, `Hipertrofia · 12 semanas`, lime icon badge, right chevron.
- Horizontal pill carousel day selector (`Día 1 Piernas`, `Día 2 Torso` [lime pill active], etc.).
- Active Day Hero Card:
  - Dark container with rounded-3xl corners and subtle glow.
  - Header: "Día 2 · Torso", arrow button.
  - Chips row: `6 ejercicios`, `19 series`, `55 min`.
  - Exercise preview rows with squircle dark container for icons, name, muscle, and 3-dots menu.
  - Big CTA: Full width neon lime pill button `▶ Empezar entrenamiento`.

### 4. Screen 2 — "Torso · Semana 3" (Workout In-Session View)
- **Files:** `views/WorkoutView.tsx`, `views/workout/WorkoutViewImpl.tsx`, `components/workout/SortableExerciseCardImpl.tsx`, `components/workout/RestTimerOverlay.tsx`
- In-workout top bar: Back arrow, "Torso · Semana 3", subtitle "Día 2 de 4 · KONG", 3-dots menu.
- Summary 2-card row:
  - Left card: circular stopwatch icon, "Tiempo total", large formatted time.
  - Right card: "Progreso", "11 / 19 series", rounded lime progress bar.
- Series dots row: small circles with checkmark for completed series, dark dots for pending.
- Exercise Card:
  - Icon squircle, exercise title, muscle, and 3-dots menu.
  - Sets table: headers `Serie | Peso (kg) | Reps | RIR | [Check]`.
  - Dark rounded inputs, circular lime checkmarks when completed.
  - "+ Agregar serie" outline pill button.
- Floating Rest Timer Dock:
  - Dark pill capsule with circular mini progress wheel, big timer display `01:30`, `− 30s` / `+ 30s` adjustment pills, circular lime Play/Pause button.
- Bottom finish button:
  - Full width dark wine/crimson rounded button `⏹ Terminar entrenamiento`.

### 5. Screen 3 — "Tu progreso" (Stats View)
- **Files:** `views/StatsView.tsx`, `views/StatsViewImpl.tsx`, `views/stats/StatsOverviewTab.tsx`, `components/stats/ProgressChart.tsx`
- Segmented filter pills: `Resumen` (active lime pill) | `Progreso` | `Volumen`.
- Monthly stats 3-card row:
  - Purple dumbbell: Sessions this month.
  - Teal layers: Total sets.
  - Cyan clock: Time training.
- "Progreso de fuerza" chart card:
  - Bar chart icon, "Progreso de fuerza", exercise dropdown.
  - Glowing lime line chart with soft lime gradient area underneath, tooltip with weight.
- "Distribución de volumen" donut chart card:
  - Donut chart on left with total series in center.
  - Color-coded muscle breakdown legend on right with percentages.

---

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` to verify type safety.
- Run `npm run lint` to verify code formatting and styling integrity.
- Run `npm run test:run` to ensure all 151 test suites and 835 unit tests pass.
- Run `npm run validate-kong` to ensure KONG program engine validation passes.
- Run `npm run bundle:report` to confirm bundle size stays within strict gzip budgets.
