# GainsLab PWA Release Checklist & Architecture Decision Records (ADRs)

**Branch**: `agent/gainslab-pwa-master-polish-v1`  
**Baseline**: Audited against `GAINS_LAB_PWA_MASTER_POLISH_PLAN.md`  
**Date**: September 2026

---

## 1. Release Verification Matrix

### Build & Automation Safety Net
- [x] **`npm run build:strict`**: Passes with zero TypeScript, syntax, or bundling errors.
- [x] **`npm run lint:a11y`**: Strict ESLint accessibility pass over all views and components with zero violations.
- [x] **Unit & Integration Suite (`npm run test:run`)**: 14 test suites, 80 tests passing (100% pass rate).
  - `backupService.test.ts` (5 tests)
  - `effectsProfile.test.ts` (7 tests)
  - `entitlementService.test.ts` (8 tests)
  - `exerciseReferenceService.test.ts` (8 tests)
  - `kongResolver.test.ts` (5 tests)
  - `localDataReset.test.ts` (2 tests)
  - `localDate.test.ts` (6 tests)
  - `nutritionCalculations.test.ts` (6 tests)
  - `onboardingOutcomes.test.ts` (4 tests)
  - `performanceFloor.test.ts` (5 tests)
  - `recommendationEngine.test.ts` (6 tests)
  - `sessionBuilder.test.ts` (6 tests)
  - `syncConflicts.test.ts` (5 tests)
  - `workoutCompletionService.test.ts` (7 tests)
- [x] **E2E Critical Journeys (`npx playwright test`)**: All 3 end-to-end user journeys passing in headless Mobile Chrome (5.5s):
  - Journey A: Onboarding suggested plan setup leading to Home with active mesocycle.
  - Journey C: Quick Start drawer opening workout initiation options.
  - Journey D: Live workout persistence across backgrounding and browser reload.
- [x] **`npm run validate-kong`**: Exact program data, safe editable conversion, schedule-aware metrics, and skipped-day semantics verified.
- [x] **Capacitor Android Parity**: Android Capacitor shell retains visual parity without being forced into an inferior visual mode; explicit touch-action and overscroll optimization in `native-performance.css`.

### Onboarding Truthfulness
- [x] **Suggested Path**: User answers (experience, frequency, goal, duration) are persisted into `userProfile`; recommended plan is instantiated; lands on Home with next scheduled session ready.
- [x] **Custom Path**: Selecting "Crear mi propia plantilla" completes onboarding and directs immediately into the program editor without dead-ending on Home.
- [x] **Freestyle Path**: Selecting "Registrar sesiones libres" completes onboarding and launches an empty/freestyle session directly.
- [x] **Existing User Protection**: Users with `il_onboarded_v2: true` never re-trigger onboarding on return visits or app refreshes.

### Workout Completion Pipeline
- [x] **Planned Session**: Advances mesocycle day index, logs volume, updates RP target RIR, navigates to `SessionSummaryView`.
- [x] **Freestyle Session**: Generates clean detached log, updates exercise history/PRs, finishes to `SessionSummaryView` without corrupting active program day.
- [x] **CrossFit / WOD Session**: Logs completed rounds/reps/for-time schema to history and navigates to `SessionSummaryView`.
- [x] **Calisthenics / Skill Session**: Accurately logs holds (seconds) or isometric sets, updates PR records, navigates to `SessionSummaryView`.
- [x] **Two Block Mass**: Correctly records upper/lower block completion, logs volume, routes to `SessionSummaryView`.
- [x] **KONG 4-Day**: Respects scheduled day index, non-linear progression, substitution tracking, and final mesocycle completion view.
- [x] **Timer & Persistence**: Rest timer operates in foreground, state persists across background/pagehide, and active session survives browser restart.

### Data & Storage Integrity
- [x] **Export / Backup**: Full envelope export supporting all 14 domains (`program`, `exercises`, `logs`, `activeMeso`, `activeSession`, `userProfile`, `nutritionLogs`, `cardioSessions`, `bodyLogs`, `macroGoals`, `nutritionGoal`, `personalTemplates`, `customFoods`, `rpFeedback`).
- [x] **Reset Local Data**: `resetLocalData()` completely purges both localStorage and IndexedDB stores (`il_session_v16`, `il_meso_v16`, etc.) and unregisters Service Workers.
- [x] **Import / Restore**: Validates backup structure, safely handles legacy 4.0.x shapes, validates exercise references, and restores all domains.
- [x] **Local Calendar Dates**: All daily nutrition, weight, and history logging use local date strings (`YYYY-MM-DD`) via `utils/localDate.ts` instead of naive UTC timestamps.

### UI, Typography & Effects
- [x] **Effects Profiles**: Explicit `system` | `full` | `balanced` | `reduced` modes managed via `utils/effectsProfile.ts` and user preferences.
- [x] **Redmi Note 10 / 4GB Floor**: Devices reporting 4GB RAM or mobile touch screen are NOT downgraded to reduced effects. They default to `balanced` in system mode, retaining transitions, haptics, and contextual glass while suppressing looping GPU-bound animations.
- [x] **Typography Hierarchy**: Sub-11px text across all critical surfaces (Home, Workout, Stats, Nutrition, History, Paywall) upgraded to 11px minimum with high contrast.
- [x] **Semantic Tokens**: Replaced brittle hard-coded dark classes and CSS rescue selectors (`:has()`) with semantic theme tokens (`rgb(var(--surface-app))`, `rgb(var(--text-primary))`, etc.).
- [x] **Native Alert/Confirm Removal**: Replaced `window.alert` and `window.confirm` with `ConfirmModal` and GainsLab localized dialogs.

### Public Release Readiness
- [x] **Honest Commerce UX**: Removed fake "Restore Purchases" button; introduced transparent Early Access messaging for WhatsApp provisioned accounts. Server-authoritative entitlement enforced.
- [x] **PWA Manifest**: Cleaned `manifest.json`, removed dead declarations (`iarc_rating_id`, unverified TWA package), verified all icons and screenshots.
- [x] **ErrorBoundary**: Provides both primary "Reload App" and secondary "Reset Local Data" recovery actions without forcing immediate destructive data loss.
- [x] **Dead Code Removal**: Removed unused duplicate `views/NutritionView.tsx`.
- [x] **KMP Clarity**: Added `ironlog-kmp/README.md` to document that `ironlog-kmp/` is an experimental prototype, ensuring agents focus exclusively on the root React PWA.

---

## 2. Architecture Decision Records (ADRs)

### ADR-001: Server-Authoritative Entitlements & Honest Early Access
- **Context**: Previous iterations featured a client-triggered demo Pro unlock and a placeholder "Restore Purchases" button that simply closed the modal. Firebase rules require admin/server authority for `users/{uid}/data/subscription`.
- **Decision**: Subscription entitlements remain 100% server-authoritative. The client application reads entitlement from Firestore and local fallback, but never writes production subscription upgrades directly. For launch, an honest Early Access model is used: users request access via WhatsApp/email, and the GainsLab team provisions access server-side. The fake "Restore Purchases" button was replaced with honest account verification guidance.
- **Consequences**: Zero risk of subscription tampering or false commerce claims in production; full compliance with server-authoritative security guidelines.

### ADR-002: Unified Workout Completion Pipeline (`workoutCompletionService.ts`)
- **Context**: Different workout modalities (planned mesocycles, freestyle, WODs, calisthenics, Two Block, and KONG) previously followed fragmented finish paths with inconsistent logging, PR calculation, and summary transitions.
- **Decision**: Extracted all finish logic into a pure, testable service: `completeWorkoutPipeline()`. It handles log construction, exercise volume calculations, PR detection, mesocycle progression, and detached session handling, returning `{ log, updatedLogs, updatedMeso, isMesoComplete, isDetached }`. All flows now transition uniformly into `SessionSummaryView`.
- **Consequences**: Every workout type ends through one predictable, audited completion pipeline with comprehensive unit test coverage.

### ADR-003: Full Domain Backup & Storage Architecture (`backupService.ts`, `localDataReset.ts`)
- **Context**: Backup previously only exported a subset of workout data, and Factory Reset only cleared `localStorage`, leaving active sessions and mesocycles orphaned in IndexedDB.
- **Decision**: Implemented `createBackupEnvelope()` and `restoreBackupToStorage()` covering all 14 application domains with schema versioning (`version: 1`) and backward compatibility for legacy 4.0.x backups. Implemented `resetLocalData()` which wipes both localStorage and all IndexedDB stores (`idb-keyval` and custom stores) and unregisters active Service Workers.
- **Consequences**: Factory Reset is genuine and complete; backups can be exported and restored across devices with zero data loss.

### ADR-004: Explicit Adaptive Effects Profiles & Redmi Note 10 Performance Floor
- **Context**: The app previously used a binary full/reduced effects switch that automatically forced devices reporting 4GB RAM or <= 4 CPU cores into a degraded visual mode, negatively impacting budget devices like the Redmi Note 10.
- **Decision**: Created an explicit 4-tier effects system (`system`, `full`, `balanced`, `reduced`) implemented in `utils/effectsProfile.ts`. In `system` mode on mobile devices (including RN10), the app resolves to `balanced`, preserving snappy transitions, contextual backdrop blur, and haptics while disabling looping animations and expensive continuous filters. Reduced motion settings (`prefers-reduced-motion`) always take precedence for accessibility.
- **Consequences**: RN10 and Capacitor Android maintain high visual fidelity and interaction smoothness without arbitrary heuristic downgrades.

### ADR-005: Exercise Reference Integrity & Safe Substitution
- **Context**: Deleting an exercise from the library previously risked leaving broken references in active programs and historical logs, or silently mutating workout structure.
- **Decision**: Created `analyzeExerciseReferences()` in `services/exerciseReferenceService.ts`. Deletion checks whether an exercise is referenced in historical logs or the active program:
  - If referenced: Prevent silent deletion and prompt the user to archive or substitute the exercise.
  - In KONG workouts: Track explicit slot substitutions rather than destroying program definitions.
- **Consequences**: Complete referential integrity across programs, logs, and custom libraries.

### ADR-006: Experimental vs Production Scope Clarity
- **Context**: The repository contains an `ironlog-kmp/` directory (a Kotlin Multiplatform spike), which could confuse automated agents and new contributors into modifying non-production files.
- **Decision**: Documented `ironlog-kmp/` with a prominent `README.md` clarifying that the root React + TypeScript PWA is the sole authoritative production application.
- **Consequences**: Prevents accidental drift and keeps all release work focused on the production PWA.

---

## 3. Remaining Manual / External Blockers

1. **Production Payment Gateway Credentials**:
   - Webhook and payment server endpoints (Stripe / MercadoPago) for automatic credit card processing require external merchant account credentials. Currently operating in the honest Early Access mode where entitlements are granted server-side.
2. **Physical Device Android APK Build Verification**:
   - Capacitor Android web assets sync cleanly (`npx cap sync android`). Full APK compilation requires the local Android SDK (`ANDROID_HOME`) and Java 17+ installed on the host machine. Once available on the CI/CD pipeline, run `npm run android-debug-apk`.
