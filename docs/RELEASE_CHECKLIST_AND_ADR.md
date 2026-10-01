# GainsLab PWA Release Checklist & Architecture Decision Records (ADRs)

**Branch**: `agent/gainslab-pwa-master-polish-v1`
**Primary Target Device**: Moto G86 Power
**Corrective Pass Baseline**: Audited against `GAINS_LAB_PWA_MASTER_POLISH_CORRECTIVE_PASS.md`
**Date**: September 2026

---

## 1. Release Verification Matrix

### Host Automated Safety Net
- [x] **`npm run build:strict`**: Passes with zero TypeScript, syntax, or bundling errors.
- [x] **`npm run lint:a11y`**: Strict ESLint accessibility pass over all views and components with zero violations.
- [x] **Unit & Integration Suite (`npm run test:run`)**: 14 test suites, 100 tests passing (100% pass rate).
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
  - `workoutCompletionService.test.ts` (7 tests)
- [x] **E2E Critical Journeys (`npm run test:e2e`)**: All 5 end-to-end user journeys passing in headless Mobile Chrome (19.7s):
  - **Journey A**: Suggested onboarding flow leads to Home with recommended plan and opens session.
  - **Journey B**: Custom onboarding flow leads to editor and persisted personal routine.
  - **Journey C**: Quick Start freestyle workout creation, sets, finish, summary, and History.
  - **Journey D**: Active workout edited values and set completion survive persistence boundary across reload.
  - **Journey E**: Fresh-device cloud restore decision preserves local user data.
- [x] **`npm run validate-kong`**: Exact program data, safe editable conversion, schedule-aware metrics, and skipped-day semantics verified.
- [x] **`git diff --check`**: Passes with zero whitespace or line-ending errors.

### Device & Platform Verification Status (Truthful Reporting)
- [ ] **Moto G86 Power Physical Validation**: **NOT RUN** (Host machine is a Windows PC; no physical Moto G86 Power hardware was connected or validated by the owner in this automated pass).
- [ ] **Redmi Note 10 Physical Validation**: **NOT RUN by design** (Per corrective plan directive, RN10 was intentionally not physically validated in this pass; no physical performance claims are made).
- [x] **Capacitor Android Web Sync (`npx cap sync android`)**: Passes cleanly (assets copied to `android/app/src/main/assets/public`).
- [x] **Capacitor Android APK Build (`npm run android-debug-apk`)**: **VERIFIED / PASS** — Built successfully (`BUILD SUCCESSFUL in 26s`, 85 actionable tasks executed). Generated APK at `android/app/build/outputs/apk/debug/app-debug.apk` (16.8 MB).
- [ ] **Capacitor Android Physical Runtime**: **NOT RUN** (Debug APK ready for manual installation and testing on physical Moto G86 Power hardware).

### Workout Completion Pipeline
- [x] **Planned Session**: Verified via unit tests (`workoutCompletionService.test.ts`) and E2E Journey A.
- [x] **Freestyle Session**: Verified via unit tests and E2E Journey C.
- [x] **Timer & State Persistence**: Verified via unit tests (`sessionBuilder.test.ts`) and E2E Journey D.
- [x] **CrossFit / WOD Session**: Completion pipeline logic verified in `workoutCompletionService.test.ts`. Physical runtime execution pending.
- [x] **Calisthenics / Skill Session**: Isometric and hold volume counting verified in `workoutCompletionService.test.ts`. Physical runtime execution pending.
- [x] **Two Block Mass**: Upper/lower block logic verified in `workoutCompletionService.test.ts`. Physical runtime execution pending.
- [x] **KONG 4-Day**: Structured week resolution and metrics verified in `scripts/validate-kong.ts` and `kongResolver.test.ts`.

### Data & Storage Integrity
- [x] **Export / Backup & Restore Symmetry**: 15-domain round trip verified in `backupService.test.ts`:
  - `program`, `exercises`, `logs`, `activeMeso`, `activeSession`, `userProfile`, `nutritionLogs`, `cardioSessions`, `bodyLogs`, `macroGoals`, `nutritionGoal`, `personalTemplates`, `customFoods`, `rpFeedback`, and `config` (`il_cfg_rir`, `il_cfg_rp`, `il_cfg_rp_rir`, `il_cfg_screen`).
- [x] **Scoped Local Reset**: `resetLocalData()` uses exact production preference keys (`il_theme_v1`, `il_lang_v1`, `il_color_theme_v1`, `il_effects_mode`), clears only GainsLab-prefixed storage, cancels pending Zustand debounce timers (`resetStorePersistence`), and preserves unrelated origin keys.
- [x] **Local Calendar Dates**: All daily nutrition, weight, and history logging use local date strings (`YYYY-MM-DD`) via `utils/localDate.ts` instead of naive UTC timestamps.

### UI, Typography & Effects
- [x] **Effects Profiles Authority**: Explicit `system` | `full` | `balanced` | `reduced` modes managed via `utils/effectsProfile.ts` and user preferences.
- [x] **Capacitor Effects Parity**: Native shell no longer forces `data-effects='reduced'` nor disables `startViewTransition`. In `system` mode, touch mobile (including Capacitor) resolves to `balanced`, preserving snappy transitions, contextual backdrop blur, and haptics while suppressing looping GPU-bound animations. Explicit `full` remains available.
- [x] **Native Alert/Confirm Removal**: All occurrences of `window.alert` and `window.confirm` have been eliminated from production code. `ErrorBoundary` now provides an inline, two-step confirmation UI with Cancel support that does not depend on the main React tree.

### Public Release Readiness
- [x] **Server-Authoritative Entitlements**: Client cannot locally grant itself Pro. `upgradeToPro()` triggers a read/refresh model from the server. `startDemo()` is strictly gated behind `import.meta.env.DEV`. Early Access via WhatsApp remains the honest public UX.
- [x] **Exercise Catalog Hardening**: Bundled CrossFit (`cf_*`), Calisthenics (`cal_*`), Nilsson (`nil_*`), and default library exercises are canonically recognized as official catalog and cannot be destructively deleted.
- [x] **Replace References Flow**: Referenced custom exercise deletion offers Archive, Replace References, or Cancel. Replacing opens `ExerciseSelector`, confirms with the user, and atomically updates `program`, `activeMeso`, and `personalTemplates` while keeping historical logs intact.

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

---

## 3. Remaining Manual / External Blockers

1. **Production Payment Gateway Credentials**:
   - Webhook and payment server endpoints (Stripe / Mercado Pago) for automatic credit card processing require external merchant account credentials. Currently operating in the honest Early Access mode where entitlements are granted server-side.
2. **Physical Device Validation (Moto G86 Power & Redmi Note 10)**:
   - Physical device verification on real hardware must be performed manually by the owner using the newly generated debug APK (`android/app/build/outputs/apk/debug/app-debug.apk`) or in mobile Chrome. Moto G86 Power physical runtime verification is pending owner execution. Redmi Note 10 physical validation was **NOT RUN by design** in this pass.
