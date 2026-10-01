# GainsLab PWA Release Checklist & Architecture Decision Records (ADRs)

**Branch**: `agent/gainslab-pwa-master-polish-v1`
**Primary Target Device**: Moto G86 Power
**Reference Redesign Baseline**: Audited against `GAINS_LAB_VISUAL_REFERENCE_REDESIGN_PASS.md`
**Source Package**: `docs/design-reference/gainslab-rediseno.zip` (6 reference screens)
**Date**: October 2026

---

## 1. Release Verification Matrix

### Host Automated Safety Net
- [x] **`npm run build:strict`**: Passes with zero TypeScript, syntax, or bundling errors.
- [x] **`npm run lint:a11y`**: Strict ESLint accessibility pass over all views and components with zero violations.
- [x] **Unit & Integration Suite (`npm run test:run`)**: 15 test suites, 107 tests passing (100% pass rate).
  - `backupService.test.ts` (6 tests) — includes full 15-domain round trip test
  - `effectsProfile.test.ts` (11 tests) — includes Capacitor system/full/reduced and prefers-reduced-motion authority
  - `entitlementService.test.ts` (13 tests) — includes server-authoritative resolution and production demo gating
  - `exerciseReferenceService.test.ts` (10 tests) — includes CrossFit, Calisthenics, Nilsson catalog protection and atomic reference replacement
  - `kongResolver.test.ts` (6 tests) — includes canonical KONG to personal routine conversion
  - `localDataReset.test.ts` (4 tests) — includes debounce timer race cancellation and native confirm/alert absence
  - `localDate.test.ts` (6 tests)
  - `nutritionCalculations.test.ts` (6 tests)
  - `onboardingOutcomes.test.ts` (4 tests)
  - `performanceFloor.test.ts` (5 tests)
  - `recommendationEngine.test.ts` (6 tests)
  - `sessionBuilder.test.ts` (6 tests)
  - `syncConflicts.test.ts` (10 tests) — includes pure `isMeaningfullyEmptyLocalState` classifier
  - `visualRedesignInteractions.test.ts` (7 tests) — covers superset contiguous reordering, KONG finish protection, rest timer ring SVG math, and active exercise progress
  - `workoutCompletionService.test.ts` (7 tests)
- [x] **E2E Critical Journeys (`npm run test:e2e`)**: All 5 end-to-end user journeys passing in headless Mobile Chrome:
  - **Journey A**: Suggested onboarding flow leads to Home with recommended plan and opens session.
  - **Journey B**: Custom onboarding flow leads to editor and persisted personal routine.
  - **Journey C**: Quick Start freestyle workout creation, sets, finish, summary, and History.
  - **Journey D**: Active workout edited values and set completion survive persistence boundary across reload.
  - **Journey E**: Fresh-device cloud restore decision preserves local user data.
- [x] **`npm run validate-kong`**: Exact program data, safe editable conversion, schedule-aware metrics, and skipped-day semantics verified.
- [x] **`git diff --check`**: Passes with zero whitespace or line-ending errors.

### Reference-Driven Visual Redesign Status
- [x] **Reference 1 (`01-entrenamiento-y-terminar.html`)**:
  - Compact task-oriented workout header (back, title + subtitle with week & remaining sets count, elapsed time pill, add exercise button, top "Terminar" `#tut-finish-btn`, and 3px linear progress bar).
  - Single visually dominant active exercise card with full logging table; secondary cards collapsed cleanly with set progress badges (`0/3`) and expand affordance.
  - Materially denser set rows: `# | Ant. | Weight | Reps | Complete` (or with RIR when enabled). Easy/OK/Hard no longer inflates completed set rows.
  - Dedicated Bodyweight layout (`# | Ant. | +kg | Reps | Complete`), Isometric layout with timer ring, and Cardio layout with speed/distance/time.
  - Redesigned Finish Session sheet: Duración & Series 2-column cards, notes textarea ("Cómo te has sentido hoy..."), and separate "Descartar sesión".
  - Canonical KONG definitions strictly protected: "Actualizar plantilla" is conditionally rendered only for personal custom routines (`!isKong && completedSets > 0`).
- [x] **Reference 2 (`02-home-proxima-sesion.html`)**:
  - Brand header with avatar initial, KONG program badge / guidelines chips, and settings shortcut.
  - Compact horizontal day selector (`D1`, `D2`, `D3`, `D4`) with "Hoy" badge.
  - Dominant Next Session hero card (`#tut-up-next`) featuring target muscle tags, session duration, and 3-exercise preview with prescription + "y N ejercicios más".
  - Primary full-width CTA ("Iniciar sesión D1") directly inside hero card, with secondary Freestyle button and WeekProgress below.
- [x] **Reference 3 (`03-perfil-y-ajustes.html`)**:
  - User avatar header with Pro badge and account email/tier.
  - 3-column stats summary card (Total sessions, Last 30 days, Body weight & height with quick edit modal).
  - Grouped navigation sections: Entrenamiento (Active meso shortcut, Program editor, Exercises catalog, RIR switch, Screen awake switch), Apariencia (Theme/color, Language), and Datos (Cloud sync status, Export & backup).
- [x] **Reference 4 (`04-descanso.html`)**:
  - Rest timer overlay featuring circular SVG progress ring (`radius=52, stroke=7`), large remaining time display, and total duration.
  - Next exercise preview card (with superset badge if applicable).
  - Quick delta adjustment buttons (-10s / +30s) and preset selectors (30s / 60s / 90s).
  - Primary full-width "Saltar descanso" CTA button.
  - Contextual rest effort feedback (Fácil / OK / Duro) shown cleanly when resting.
- [x] **Reference 5 (`05-ordenar-ejercicios.html`)**:
  - Superset grouping cards with purple accent bar (`border-l-[3px] border-l-[#7f77dd]`) and uppercase tag (`Superserie A`, `Superserie B`).
  - Coherent contiguous reordering of supersets: moving any exercise in a superset moves the linked group together.
  - Drag handle grip icon, exercise title, slot/muscle label, and progress badge (`0/3`).
  - Primary "Guardar orden" confirmation button.
- [x] **Reference 6 (`06-apariencia.html`)**:
  - Segmented theme selector: Oscuro, Claro, Auto (`Cpu` / `Smartphone`).
  - Accent color palette rendered as circular swatches with active selection ring & checkmark: Hipertrofia (`#c4f13a`), Ocean (`#378add`), Forest (`#1d9e75`), Royal (`#8f4fc9`), Sunset (`#d4631a`), Mono (`#5f6068`).
  - Segmented language selector: English / Español.
  - Compact 4-mode effects selector (Auto / Completo / Equilibrado / Reducido) with dynamic explanatory text.
- [x] **Obsolete Selector Hacks Cleanup**:
  - Removed old header flex/order/absolute positioning overrides from `views/product-polish.css`.
  - Removed obsolete child-index and bottom bar overrides from `views/product-polish.css`.
  - Removed brittle set-row child/sibling selector overrides from `views/workout-density-feedback.css`.

### Device & Platform Verification Status (Truthful Reporting)
- [ ] **Moto G86 Power Physical Validation**: **NOT RUN** (Host environment is a Windows development machine; no physical Moto G86 Power hardware was connected or validated by the owner in this automated pass).
- [ ] **Redmi Note 10 Physical Validation**: **NOT RUN by design** (Per corrective plan directive, RN10 was intentionally not physically validated in this pass; no physical performance claims are made).
- [x] **Capacitor Android Web Sync (`npx cap sync android`)**: Passes cleanly.
- [x] **Capacitor Android APK Build (`npm run android-debug-apk`)**: Verified; debug APK generated for physical installation.
- [ ] **Capacitor Android Physical Runtime**: **NOT RUN** (Debug APK ready for manual installation and testing on physical Moto G86 Power hardware).

### Workout Completion Pipeline
- [x] **Planned Session**: Verified via unit tests (`workoutCompletionService.test.ts`) and E2E Journey A.
- [x] **Freestyle Session**: Verified via unit tests and E2E Journey C.
- [x] **Timer & State Persistence**: Verified via unit tests (`sessionBuilder.test.ts`) and E2E Journey D.
- [x] **CrossFit / WOD Session**: Completion pipeline logic verified in `workoutCompletionService.test.ts`.
- [x] **Calisthenics / Skill Session**: Isometric and hold volume counting verified in `workoutCompletionService.test.ts`.
- [x] **Two Block Mass**: Upper/lower block logic verified in `workoutCompletionService.test.ts`.
- [x] **KONG 4-Day**: Structured week resolution and metrics verified in `scripts/validate-kong.ts` and `kongResolver.test.ts`.

### Data & Storage Integrity
- [x] **Export / Backup & Restore Symmetry**: 15-domain round trip verified in `backupService.test.ts`.
- [x] **Scoped Local Reset**: `resetLocalData()` uses exact production preference keys, clears only GainsLab-prefixed storage, cancels pending Zustand debounce timers (`resetStorePersistence`), and preserves unrelated origin keys.
- [x] **Local Calendar Dates**: All daily nutrition, weight, and history logging use local date strings (`YYYY-MM-DD`) via `utils/localDate.ts` instead of naive UTC timestamps.

### UI, Typography & Effects
- [x] **Effects Profiles Authority**: Explicit `system` | `full` | `balanced` | `reduced` modes managed via `utils/effectsProfile.ts` and user preferences.
- [x] **Capacitor Effects Parity**: Native shell resolves `system` to `balanced`, preserving snappy transitions, contextual backdrop blur, and haptics while suppressing looping GPU-bound animations. Explicit `full` remains available.
- [x] **Native Alert/Confirm Removal**: All occurrences of `window.alert` and `window.confirm` remain eliminated from production code.

---

## 2. Architecture Decision Records (ADRs)

### ADR-001: Server-Authoritative Entitlements & Honest Early Access
- **Context**: Finding D identified that client state could forge Pro access via `upgradeToPro()` or `startDemo()` without an authoritative Firestore backend response.
- **Decision**: Subscriptions are strictly server-authoritative. `upgradeToPro()` was redesigned to call `refreshSubscription()`, and `startDemo()` was gated behind `import.meta.env.DEV` and removed from production UI. An honest Early Access model via WhatsApp is used until payment server endpoints are integrated.
- **Consequences**: Zero risk of subscription tampering or false commerce claims in production client code.

### ADR-002: Unified KONG Editable Conversion (`convertKongToPersonalRoutine`)
- **Context**: Finding C identified that `Layout.tsx` and `App.tsx` had two separate, divergent KONG conversion flows, leading to inconsistent personal routine semantics depending on the UI entry point.
- **Decision**: Unified conversion into `convertKongToPersonalRoutine()` in `programs/engine/ProgramConversion.ts`. Resolves the current week with active substitutions, strips internal KONG metadata, rebuilds the plan, and creates a normalized 4-week personal mesocycle.
- **Consequences**: Both Home/plan actions and Layout/Quick Start produce identical, predictable personal routine state.

### ADR-003: Symmetric 15-Domain Backup & Reset Safety (`backupService.ts`, `localDataReset.ts`)
- **Context**: Finding G and Finding H noted missing config keys during restore, non-production preference keys during reset, and potential debounce timer races in `lib/store.ts`.
- **Decision**: Restores `il_cfg_rir`, `il_cfg_rp`, `il_cfg_rp_rir`, and `il_cfg_screen` to `localStorage`. `localDataReset.ts` uses exact keys (`il_theme_v1`, etc.) and leaves unrelated origin storage untouched. `resetStorePersistence()` cancels pending IndexedDB write timeouts before reset.
- **Consequences**: Complete symmetry between backup export, local reset, and restore across all 15 domains with zero persistence races.

### ADR-004: Adaptive Effects Authority & Moto G86 Target Alignment
- **Context**: Finding B identified that `index.tsx` was unconditionally setting `data-effects='reduced'` and clearing `startViewTransition` inside Capacitor, degrading visual fidelity on devices like the Moto G86 Power.
- **Decision**: Restored canonical effects authority to `AppContext` and `resolveEffectsMode()`. Removed blanket stripping from `native-performance.css`. In `system` mode, Capacitor resolves to `balanced`, preserving visual quality and transitions, while explicit `full` remains selectable.
- **Consequences**: Full visual polish and smooth animations are preserved on modern mobile hardware without degrading the native experience.

### ADR-005: Canonical Exercise Catalog Classification & Reference Replacement
- **Context**: Finding E and Finding F identified that CrossFit and Calisthenics exercises were misclassified as custom exercises, and referenced custom exercises lacked a UI flow for replacing references.
- **Decision**: Expanded `BUILTIN_EXERCISE_IDS` to include `CROSSFIT_EXERCISES`, `CALISTHENICS_EXERCISES`, and `NILSSON_BW_EXERCISES`. Added a complete "Replace references" flow in `ExercisesView.tsx` with `ExerciseSelector`, confirmation modal, and atomic multi-domain updating via `executeExerciseReplacement()`.
- **Consequences**: Official catalog exercises cannot be deleted; referenced custom exercises can be safely replaced across all active routines without mutating historical logs.

### ADR-006: Self-Contained ErrorBoundary Confirmation
- **Context**: Finding I noted that `ErrorBoundary` still called native `window.confirm()`.
- **Decision**: Replaced `window.confirm()` with an in-boundary two-step confirmation state (`confirmReset`) rendering styled HTML buttons directly within the ErrorBoundary, requiring zero external React component dependencies.
- **Consequences**: Complete removal of native alert/confirm dialogs across the entire application runtime.

### ADR-007: Reference-Driven Component Composition & Hack Elimination
- **Context**: Previous passes relied on CSS structure overrides (`views/product-polish.css` and `views/workout-density-feedback.css`) using `order`, `position: absolute`, and brittle sibling selectors to reshape old components.
- **Decision**: Replaced old DOM layouts with clean React component composition directly modeled after the 6 reference prototypes in `docs/design-reference/gainslab-rediseno.zip`. Removed all obsolete selector hacks.
- **Consequences**: True responsive layout, higher performance on mobile browsers, zero dependence on DOM order hacks, and full support for all accent colors and light/dark modes.

### ADR-008: Canonical KONG Immutability Protection in Finish Session
- **Context**: Reference screen `01-entrenamiento-y-terminar.html` includes an "Actualizar plantilla" toggle to persist set/weight changes into the program template.
- **Decision**: Canonical KONG programs (`isKong`) are strictly protected from structural and parameter mutations via this toggle. The "Actualizar plantilla" switch is conditionally rendered only when `!isKong && completedSets > 0`.
- **Consequences**: Guarantees that official KONG programs maintain canonical periodization integrity while allowing personal custom routines full flexibility.

### ADR-009: Deliberate Reference Deviations for Production Architectural Integrity
- **Context**: The provided HTML reference prototypes were static standalone mockups with hardcoded strings, simplified single-set inputs, Tabler webfonts, and no bottom navigation.
- **Decision**:
  1. Maintained GainsLab's existing bottom navigation (`Main navigation`) on Home/Workout/History/Stats/Nutri instead of removing it.
  2. Preserved the SVG `Icon` system instead of adding external Tabler font CDN links.
  3. Preserved all special set protocols (Warmup, Drop, Myorep, Top/Backoff, Giant, Cluster, EMOM, Rest-Pause, Time-Volume, AVT) in `SetRow.tsx`.
  4. Preserved light mode and all six color themes (`iron`, `ocean`, `forest`, `royal`, `sunset`, `monochrome`) via CSS variables.
- **Consequences**: Full fidelity to the reference's aesthetic and interaction design while preserving 100% of GainsLab's production capabilities.

---

## 3. Remaining Manual / External Blockers

1. **Production Payment Gateway Credentials**:
   - Webhook and payment server endpoints (Stripe / Mercado Pago) for automatic credit card processing require external merchant account credentials. Currently operating in the honest Early Access mode where entitlements are granted server-side.
2. **Physical Device Validation (Moto G86 Power & Redmi Note 10)**:
   - Physical device verification on real hardware must be performed manually by the owner using the generated debug APK (`android/app/build/outputs/apk/debug/app-debug.apk`) or in mobile Chrome. Moto G86 Power physical runtime verification is pending owner execution. Redmi Note 10 physical validation was **NOT RUN by design** in this pass.
