# GainsLab PWA — Master Product Polish Plan

> Repository: \`gabsvm/IronLog-React\`  
> Baseline audited: \`main\` @ \`eec57454c7cebee6553340e1ad41f283a8b21931\`  
> Product version at audit: \`4.0.3\`  
> Primary target: PWA / browser-installed app  
> Secondary target: Capacitor Android shell using the same React product  
> Performance floor: Redmi Note 10 class hardware, 4 GB RAM  
> Implementation orchestrator: Luna / Codex using this file as the source of truth

---

## 0. Product direction

GainsLab is already feature-rich enough. This effort is **not a feature expansion** and **not a rewrite**.

The goal is to turn the current React/PWA product into a polished, internally coherent, reliable and shareable product that can be sent by link to testers, users, gyms, coaches, partners or sponsors without exposing prototype-quality flows.

The product direction is:

- **PWA = universal distribution surface.**
- **Capacitor Android = enhanced installed shell**, not a visually degraded fork.
- Preserve the current GainsLab identity: OLED/dark surfaces, RP-lime accent, compact high-density training UI, strong numerical hierarchy, glass/elevation where useful, haptics and short purposeful motion.
- Do **not** flatten the UI merely to accommodate lower-end hardware.
- Redmi Note 10 / 4 GB is the minimum performance validation target, not a reason to pre-disable the visual system.
- The workout runtime is the most valuable and mature part of the product. Protect it first.

### North-star feeling

GainsLab should feel like a **premium performance tool**, not a dashboard and not a game:

- immediate;
- tactile;
- readable under gym conditions;
- visually rich without decorative noise;
- calm between interactions;
- highly responsive when logging sets;
- trustworthy with user data;
- consistent across planned, freestyle, KONG, WOD and calisthenics sessions.

---

# 1. Non-negotiable guardrails

These rules apply to every phase.

1. **No rewrite.** Evolve the current React/PWA architecture.
2. **No feature creep.** Do not add new training systems, social features, AI features, coaches, challenges, feeds, or unrelated product modules during this plan.
3. **No branch-per-phase.** Use one implementation branch and checkpoint commits.
4. **Do not break existing persisted data.** Any storage/schema change must be migrated or backward-compatible.
5. **Do not weaken offline behavior.**
6. **Do not reduce workout touch targets to gain density.**
7. **Do not remove existing KONG, Two Block Mass, CrossFit, calisthenics, nutrition, history or stats capability unless the item is proven dead/duplicate legacy code and not part of the live runtime.**
8. **Do not silently substitute exercises when user intent can be validated earlier.**
9. **Do not use native \`alert()\` / \`confirm()\` for production flows after P1.**
10. **Do not use DOM querying / MutationObserver / click interception as a new integration technique.**
11. **Do not globally force reduced effects based only on 4 GB RAM, hardwareConcurrency <= 4, or Capacitor.**
12. Honor \`prefers-reduced-motion\`.
13. Every destructive action needs explicit confirmation; recoverable actions should prefer Undo where practical.
14. Every implementation checkpoint must keep:
    - \`npm run build:strict\` passing;
    - TypeScript clean;
    - no new a11y lint errors;
    - app booting with old persisted data;
    - active workout resumable after reload/background.

---

# 2. Current strengths that must be preserved

Do not redesign these away:

- Bottom navigation model: **Train / History / + / Diet / Stats**.
- Central Quick Start action and sheets.
- Virtualized History and exercise lists.
- Current workout runtime and set-density improvements.
- Timestamp-based rest timer.
- Timer Worker architecture.
- Native Android timer bridge / AlarmManager support.
- IndexedDB-first persistence.
- Session persistence on visibility/pagehide.
- Section-aware sync metadata and dirty tracking.
- Lazy loading of secondary views.
- Lazy Firebase loading.
- Chart/Stats worker strategy.
- \`content-visibility\` / containment optimizations.
- unified \`Sheet\` primitive built on Vaul.
- haptic feedback.
- theme tokens and primary accent system.
- safe-area handling.
- light/dark support.
- existing \`prefers-reduced-motion\` support.

---

# 3. Implementation branch and commit discipline

Create a single branch:

\`agent/gainslab-pwa-master-polish-v1\`

Do not make a new branch for every phase.

Use the following checkpoint commit structure. Small supporting commits are allowed, but these checkpoint boundaries must remain recognizable:

1. \`test: establish GainsLab critical-flow safety net\`
2. \`fix: harden local dates reset and backup restore\`
3. \`fix: make onboarding outcomes truthful and persistent\`
4. \`fix: harden entitlements exercise deletion and PWA actions\`
5. \`refactor: unify workout completion pipeline\`
6. \`refactor: clarify program and exercise management flows\`
7. \`refactor: simplify settings stats profile and modal navigation\`
8. \`refactor: remove DOM hacks and legacy runtime ambiguity\`
9. \`feat: add explicit adaptive effects profiles\`
10. \`style: unify GainsLab product surfaces typography and motion\`
11. \`perf: validate and tune Redmi Note 10 performance floor\`
12. \`chore: harden public PWA release and remove prototype commerce\`
13. \`test: complete release regression coverage\`
14. \`docs: record release checklist and architecture decisions\`

Do not squash away useful checkpoint boundaries until final review.

---

# 4. PHASE P0 — Correctness and trust

P0 is mandatory before major visual changes. The purpose is to make GainsLab safe to polish aggressively.

## P0.1 — Add a test harness before large refactors

Add Vitest + React Testing Library where appropriate, and Playwright for critical journeys.

Minimum unit/integration coverage:

- \`recommendProgram()\`
- \`SessionBuilder.buildFromProgramDay()\`
- local date helpers
- backup serialization/deserialization
- reset storage service
- exercise reference analysis
- KONG resolver/progression invariants
- sync section conflict helpers where logic can be extracted into pure functions
- nutrition calculations/streak behavior
- workout completion decision helpers after they are extracted

Minimum E2E journeys:

### Journey A — Suggested onboarding
Landing → setup → recommended plan → first planned workout → finish → summary → home.

### Journey B — Custom onboarding
Landing → setup → “Create my own template” → blank program editor → create routine → save/start → home.

### Journey C — Freestyle
Quick Start → freestyle → add exercise → log sets → timer → finish → summary → history.

### Journey D — Persistence
Start workout → change weights/reps → reload/background simulation → session returns intact.

### Journey E — Fresh-device restore
Seed persisted/cloud-compatible state → login/fresh local state → restore path correctly applies state.

Do not require GitHub Actions for this plan. The suite must be runnable locally with package scripts.

Add scripts such as:

- \`test\`
- \`test:run\`
- \`test:e2e\`
- \`verify\` = strict build + unit tests

Do not make Playwright mandatory for every tiny local edit if it causes excessive iteration cost; make it mandatory at checkpoints.

---

## P0.2 — Fix local-calendar dates

Current nutrition date generation uses UTC via \`toISOString().split('T')[0]\`, which can roll the day at ~21:00 in Argentina.

Create one shared local calendar utility, e.g.:

- \`utils/localDate.ts\`

It must provide deterministic local-calendar helpers such as:

- today local \`YYYY-MM-DD\`
- date-to-local-key
- add/subtract local days without UTC rollover bugs
- parse local date key safely

Replace UTC-derived “today” usage in nutrition and any other user-facing daily logs found during audit.

### Acceptance

- At 22:00 Argentina local time, Today still represents the local date.
- Streak calculations remain correct across month/year boundaries.
- Tests explicitly cover UTC-negative timezone behavior.

---

## P0.3 — Implement a real full local reset

Replace every “factory reset” path that only calls \`localStorage.clear()\`.

Create one canonical service, e.g.:

\`services/localDataReset.ts\`

It must clear GainsLab-owned:

- IndexedDB keys;
- Zustand persisted workout/meso keys;
- offline sync queue;
- dirty sync metadata;
- cloud sync cache;
- relevant localStorage migration/preferences keys;
- safe runtime caches owned by the app when appropriate.

Do not indiscriminately clear unrelated browser-origin data unless necessary.

Both Settings and ErrorBoundary recovery must call the same canonical reset path.

### Acceptance

After factory reset + reload:

- no workout history;
- no active session;
- no mesocycle;
- no nutrition/body/cardio data;
- no personal templates;
- no custom exercises;
- onboarding state is reset as designed;
- stale sync queue does not resurrect data unexpectedly.

---

## P0.4 — Make backup/export and restore symmetric

Introduce a versioned backup schema.

Suggested envelope:

\`\`\`ts
{
  schema: 'gainslab-backup',
  version: 1,
  exportedAt: number,
  appVersion: string,
  state: { ... }
}
\`\`\`

Export and import the same supported domains:

- program
- exercises
- logs
- activeMeso
- activeSession
- userProfile
- nutritionLogs
- cardioSessions
- bodyLogs
- macroGoals
- nutritionGoal
- personalTemplates
- customFoods
- relevant RP/config state where safe and intended

Create validation/migration code. Do not directly trust arbitrary imported JSON.

Old exports from 4.0.3 should be accepted where feasible through a compatibility parser.

### UX

- invalid backup → visible localized error, not console-only;
- valid backup → review/confirm;
- restore → success state;
- document what is not included, if anything.

### Acceptance

Export → reset → import restores all exported domains, not only workout data.

---

## P0.5 — Make onboarding truthful

Fix all three onboarding outcome paths.

### Persist answers

The setup wizard must persist relevant answers to \`userProfile\` instead of using a disposable internal profile only.

At minimum preserve:

- experience;
- training days/week;
- goal;
- preferred session duration;

without deleting existing body-profile fields.

### Suggested plan

Apply recommendation, create active plan, finish onboarding and land on Home with the recommended session clearly ready.

### Custom plan

“Create my own template” must:

1. finish onboarding;
2. open a genuinely blank/new program editor flow;
3. not silently leave the user on Home.

### Freestyle

“Log freestyle sessions” must:

1. finish onboarding;
2. open/start the freestyle flow directly.

Do not force the user to rediscover the + button immediately after selecting this outcome.

### Generating state

Remove the fixed 1500 ms fake wait or reduce it to a brief intentional transition. Never imply remote AI analysis when the result is deterministic local logic.

Use wording equivalent to “Recommended based on your preferences”.

---

## P0.6 — Resolve subscription/demo authority

Current client logic attempts subscription writes while Firestore rules state subscription is server-write-only.

Choose one coherent model:

### Production rule

Subscription/entitlement is server-authoritative.

Client may read entitlement but must not self-upgrade persisted production entitlement.

For demo access, use one of:

- server-created demo entitlement; or
- explicitly local demo mode that does not pretend to be a server subscription.

Do not relax Firestore security simply to make client-side demo writes pass.

Remove/deprecate client paths that imply the app can write production Pro subscription documents.

Add testable entitlement helpers so Free / Demo / Pro behavior is deterministic.

---

## P0.7 — Safe exercise deletion / archiving

Do not allow deleting an exercise while silently leaving routine references that later fall back to another same-muscle exercise.

Before destructive removal, inspect references in:

- current program;
- active mesocycle plan;
- personal templates;
- relevant editable program structures.

Preferred model:

- unused custom exercise → delete;
- referenced custom exercise → Archive or Replace References;
- built-in/global exercise → not destructively deleted by normal users.

Historical workout logs should remain immutable and render their stored exercise snapshot even if a catalog exercise is archived.

Remove silent same-muscle substitution as the normal recovery path for preventable user deletions. Keep defensive runtime fallback only for corrupted/legacy data.

---

## P0.8 — PWA manifest truthfulness

Audit and either implement or remove unsupported manifest declarations.

Current declarations include action/deep-entry concepts such as:

- \`?action=start\`
- share target
- JSON file handler
- custom protocol
- note-taking
- widget endpoints

At minimum implement the genuinely useful:

### Start Workout shortcut

\`/?action=start&source=shortcut\`

must route to the appropriate action:

- resume active workout if one exists;
- otherwise open scheduled/Quick Start flow.

If share target, protocol, widgets or note-taking are not real supported features, remove them rather than advertise dead capabilities.

If JSON file handling remains, use correct MIME semantics and wire it to the real import path.

---

# 5. PHASE P1 — UX coherence

P1 removes “prototype logic” and aligns every major flow with a clear mental model.

## P1.1 — One workout completion pipeline

Planned sessions already produce a Session Summary. Detached sessions currently do not.

Create a single completion service/controller for:

- planned;
- freestyle;
- WOD;
- calisthenics;
- Two Block;
- structured programs.

The pipeline should:

1. freeze current session snapshot;
2. compute end time/duration;
3. persist log;
4. apply program progression only when applicable;
5. clear active session;
6. stop rest timer;
7. produce summary model;
8. navigate to Session Summary.

Session Summary adapts by session type.

Do not duplicate finish logic in \`App.tsx\` and \`WorkoutView.tsx\`.

### Celebration policy

Avoid double-confetti.

Use escalating feedback:

- normal completion → restrained completion motion;
- PR → PR celebration;
- milestone / mesocycle complete → larger celebration.

---

## P1.2 — Clarify Program Editor mental model

Separate these concepts:

### Edit current routine
- edits persist predictably;
- visible “Saved” / autosave status;
- back returns naturally;
- no misleading “Start” semantics when already editing an active routine.

### Create new routine
- explicit new draft;
- name;
- days;
- slots/exercises;
- validation;
- save template and/or start routine.

Before start:

- validate unresolved slots;
- show exact missing exercises;
- let user fix them.

Do not silently choose a same-muscle fallback for a routine the user just created.

KONG conversion remains explicit and must use GainsLab modal/sheet UI, not browser confirm.

---

## P1.3 — Rebuild Exercise Management using proven picker infrastructure

Bring \`ExercisesView\` up to the quality of \`ExerciseSelector\`.

Required:

- search;
- muscle filter chips;
- source/category filtering where useful;
- virtualized list;
- custom/global/built-in distinction;
- proper empty states;
- create flow;
- detail flow;
- archive/delete rules from P0;
- no nested interactive element inside a button.

Do not duplicate two independent exercise-search implementations if shared primitives can be extracted.

---

## P1.4 — Reorganize Settings

Keep the current feature set but improve information architecture.

Recommended groups:

### Account
- identity/login
- entitlement
- install status
- cloud/sync state

### Training
- RIR/RPE presentation
- keep-screen-on
- relevant workout behavior

### Appearance
- dark/light/system
- accent
- effects/motion profile
- language

### Data
- backup/export
- restore/import
- sync diagnostics
- reset

Profile body metrics should not be buried as generic account settings. Profile may open a dedicated edit sheet.

Keep advanced sync diagnostics accessible but visually secondary.

---

## P1.5 — Make Stats navigation semantically honest

Current segmented control behaves like anchor navigation while looking/acting like tabs.

Choose one coherent design. Preferred:

### Real mobile tabs

- Overview
- Progress
- Volume

Only mount/render the expensive panel needed for the active tab where practical.

Preserve scope controls and existing calculations.

Correct ARIA semantics to match actual behavior.

---

## P1.6 — Refine Profile

Profile remains a user summary surface:

- identity / tier;
- body;
- sessions;
- recent activity;
- current plan.

“Edit” should open the exact body/profile edit surface instead of forcing the user to hunt through Settings.

Avoid duplicating the same summary controls in multiple locations.

---

## P1.7 — Replace native browser dialogs

Remove production UX dependence on:

- \`window.alert\`
- \`window.confirm\`

Use:

- \`ConfirmModal\`
- \`Sheet\`
- toast/banner/inline errors

for:

- KONG conversion;
- active-session blockers;
- install help;
- destructive actions;
- recoverable errors.

All user-facing messages must support ES/EN.

---

## P1.8 — Remove DOM integration hacks

Replace runtime behavior based on:

- MutationObserver label rewriting;
- \`querySelector\` to locate another React component;
- synthetic \`.click()\`;
- click-capture interception based on CSS selectors;

with explicit props/events/state.

This is necessary before visual class structures are heavily changed.

Do not introduce new selector-dependent behavior.

---

## P1.9 — Clarify “Repeat”

Use distinct concepts:

- **Repeat historical session** = clone historical exercise structure into a new detached/repeat session.
- **Train this programmed day again** = rebuild the current programmed day from current plan definition.

Do not label both simply “Repeat” while executing different logic.

---

# 6. PHASE P2 — Visual polish and perceived quality

Only begin after P0 is complete and the P1 architecture no longer depends on DOM/CSS hacks.

## P2.1 — Explicit effects profile

Replace automatic binary full/reduced behavior with an explicit profile.

Suggested persisted setting:

\`effectsMode: 'system' | 'full' | 'balanced' | 'reduced'\`

### System
Honor accessibility and choose a sane default, but do not reduce merely because deviceMemory reports 4.

### Full
Use full GainsLab presentation.

### Balanced
Recommended default for workout-heavy mobile use:
- transitions and haptics retained;
- short contextual blur/glass retained;
- looping decorative animation disabled;
- expensive continuous filters avoided during workout scroll.

### Reduced
Accessibility/minimal motion.

Rules:

- \`prefers-reduced-motion\` always wins for motion safety.
- \`saveData\` may influence network/media behavior, not automatically erase UI animation.
- \`hardwareConcurrency <= 4\` alone must not force reduced.
- \`deviceMemory <= 4\` alone must not force reduced.
- Capacitor must not automatically force reduced.

---

## P2.2 — Capacitor visual parity

Remove the assumption:

> native shell = cheap visual mode

Capacitor Android should use the same visual product, with targeted native/performance overrides only when measured.

Keep native-specific optimizations that demonstrably matter:

- WebView overscroll behavior;
- touch-action;
- renderer priority;
- timer bridge;
- avoid redundant Service Worker;
- targeted removal of pathological filters only if profiling justifies them.

Do not globally remove every backdrop blur / animation / view transition solely because the shell is native.

---

## P2.3 — Motion language

Create a small motion vocabulary.

Examples:

- tap: 90–140 ms;
- state change: 160–220 ms;
- sheet/navigation: spring or 220–320 ms;
- completion: one-shot, not looped.

Use motion to communicate cause/effect.

### Home
- weekly progress updates;
- next-session transition;
- completion state.

### Workout
- set completion spring/check;
- progress increment;
- timer entry;
- reordering elevation;
- exercise replacement transition.

### Nutrition
- macro progress response;
- meal insert/remove;
- Undo feedback.

### Stats
- counter transition;
- chart reveal only when entering relevant panel.

Avoid decorative infinite bouncing/pulsing except explicit loading states.

---

## P2.4 — Typography and density pass

Keep GainsLab compact, but reduce overuse of 8–10 px text.

Practical targets:

- critical metadata: ~11 px minimum;
- body/supporting text: 13–14 px;
- primary controls: >= 13 px;
- primary workout numbers: remain large and tabular.

Do not solve readability by making every card taller. Density should come from layout hierarchy, not tiny text.

---

## P2.5 — Tokenize remaining legacy surfaces

Gradually replace hard-coded dark-only surfaces and CSS rescue selectors with product tokens.

Prioritize live product files:

- Home
- Workout
- History
- Stats
- Nutrition
- Profile
- Settings
- Program editor
- Exercise manager
- Session Summary
- onboarding/auth

Goal: reduce dependence on selectors such as exact hard-coded background classes and \`:has()\`-based hiding.

Do not attempt a risky one-shot Tailwind/design-system rewrite.

---

## P2.6 — Home visual polish

Preserve Home’s hierarchy:

1. current plan / week context;
2. session timeline;
3. selected/next session;
4. primary action.

Remove hidden legacy sections from the component composition instead of rendering and hiding with CSS.

Keep secondary actions in Quick Start / Plan Actions sheets.

---

## P2.7 — Workout polish

Do not radically redesign set logging.

Improve:

- hierarchy of active vs completed sets;
- completion feedback;
- previous-performance hint legibility;
- sticky/header metrics;
- rest timer surface;
- reorder affordance;
- keyboard/IME stability;
- finish affordance.

Keep large touch targets.

Avoid expensive looping effects during live logging.

---

## P2.8 — Session Summary polish

Make Summary a signature product moment.

Adaptive sections may include:

- duration;
- total volume;
- exercises;
- sets;
- PRs;
- plan/week progression when applicable;
- next scheduled context;
- relevant session-type metrics.

All session types must arrive here after finish.

Celebration intensity depends on actual achievement.

---

## P2.9 — History / Stats / Nutrition polish

### History
- clearer filter/search surface;
- Undo for deletion if deletion remains;
- retain virtualization.

### Stats
- real tabs;
- lazy chart rendering;
- strong empty states;
- scope clearly visible.

### Nutrition
- local date correctness from P0;
- macro/meal interactions;
- keep Undo;
- TDEE labeled as estimated.

---

# 7. PHASE P2 performance floor — Redmi Note 10

The RN10 / 4 GB class device is the required minimum manual performance target.

Do not preemptively downgrade visuals. Profile first.

## Required RN10 scenarios

### Cold start
- first load;
- installed PWA reopen;
- cached/offline reopen.

### Heavy workout
- 10 exercises;
- ~50 sets;
- weight/reps editing;
- keyboard open/close;
- rest timer active;
- reorder sheet;
- exercise selector;
- finish + summary.

### Home
- plan active;
- horizontal timeline;
- sheets;
- profile.

### Stats
- switch all tabs;
- scroll charts;
- change scope.

### Nutrition
- add/edit/delete food;
- water;
- body tab;
- history.

## Performance expectations

Do not set fake laboratory numbers that cannot be measured consistently on real Android, but enforce these qualitative gates:

- taps should feel immediate;
- no repeated multi-frame stalls during ordinary set logging;
- keyboard open/close must not destroy layout;
- workout scroll remains stable with heavy sessions;
- no persistent animation saturating the GPU;
- no memory blow-up from mounting hidden charts/panels;
- active session survives background/reload.

Where profiling identifies a bottleneck, optimize the component responsible rather than globally disabling the visual language.

---

# 8. PHASE P3 — Public-product readiness

## P3.1 — Honest commerce / entitlement UX

Current WhatsApp-based pricing and “Restore Purchases” behavior must not pretend to be a complete store flow.

Choose one launch state:

### A. Early access / private beta
- no fake purchase restoration;
- clear “Request Pro access” / “Early access” CTA;
- admin/server entitlement remains authoritative.

### B. Paid release
- real payment provider;
- server/webhook-owned entitlement;
- real restore/account-state behavior.

Never implement client-authoritative Pro activation.

---

## P3.2 — PWA install and deep entry

Make install messaging coherent:

- installed state recognized;
- Android install instructions localized;
- iOS instructions localized;
- Start Workout shortcut works;
- no dead manifest declarations.

PWA update banner remains explicit and non-destructive.

---

## P3.3 — Error and recovery UX

Users should not need DevTools.

Provide clear localized UI for:

- invalid backup;
- sync unavailable;
- auth unavailable;
- offline state;
- cloud conflict;
- exercise reference problem;
- failed import;
- failed global/admin write.

ErrorBoundary should offer safe recovery actions without pretending localStorage-only reset is sufficient.

---

## P3.4 — Accessibility release pass

Verify:

- focus-visible;
- logical focus order;
- Sheet title/description;
- no nested buttons;
- correct tab semantics;
- icon-only controls labeled;
- text scale/readability;
- contrast in all accent themes;
- reduced-motion behavior;
- keyboard support for desktop PWA;
- touch targets on mobile.

---

## P3.5 — Repository cleanup

After runtime parity is verified:

- remove dead duplicate view implementations;
- remove obsolete CSS patches superseded by tokenized components;
- remove unused imports/state;
- document why \`ironlog-kmp/\` remains in the repository if it remains;
- prevent agents from confusing the KMP experiment with the production React/PWA path.

Do not delete KMP or historical implementation code merely for aesthetics without confirming repository intent.

---

# 9. Architecture improvements to prefer during implementation

The goal is not a giant architecture rewrite, but these extractions are encouraged when they reduce current duplication.

Suggested services/helpers:

- \`utils/localDate.ts\`
- \`services/backupService.ts\`
- \`services/localDataReset.ts\`
- \`services/workoutCompletionService.ts\` or equivalent controller
- \`services/exerciseReferenceService.ts\`
- \`utils/deepLinkAction.ts\`
- pure sync-conflict helpers where possible

Suggested shared product primitives:

- Search + filter toolbar for exercise surfaces
- dedicated Body/Profile edit sheet
- localized app message/toast primitive
- effect-profile helper
- semantic segmented-control/tabs primitive

Do not add abstractions unless at least two real call sites benefit or the abstraction isolates risky business logic for testing.

---

# 10. Data migration rules

Any change to stored config/profile state must be backward-compatible.

For new settings:

- missing key → safe default;
- old persisted objects → merge with default shape;
- never require users to factory-reset after an update.

For backup:

- backup version is explicit;
- parser validates before applying;
- legacy 4.0.x shape is migrated where possible;
- unknown future version fails safely with a user-facing message.

For exercise archival:

- old logs remain readable;
- old program references are detected;
- no silent destructive migration.

---

# 11. Release verification matrix

Before declaring this plan complete, verify all of the following.

## Build
- [ ] \`npm run build:strict\`
- [ ] unit/integration tests
- [ ] Playwright critical journeys
- [ ] \`npm run validate-kong\`
- [ ] Capacitor Android sync/build validation when environment permits

## Onboarding
- [ ] suggested path
- [ ] custom path
- [ ] freestyle path
- [ ] existing user does not re-run onboarding

## Workout
- [ ] planned session
- [ ] freestyle
- [ ] WOD
- [ ] calisthenics
- [ ] Two Block
- [ ] KONG
- [ ] timer foreground
- [ ] background/resume
- [ ] reorder
- [ ] replace/add exercise
- [ ] discard
- [ ] finish → summary

## Data
- [ ] export
- [ ] reset
- [ ] import
- [ ] old backup compatibility
- [ ] local persistence
- [ ] offline queue
- [ ] fresh-device restore
- [ ] cloud conflict

## UI
- [ ] dark
- [ ] light
- [ ] all accent themes
- [ ] full effects
- [ ] balanced effects
- [ ] reduced effects
- [ ] Spanish
- [ ] English

## Hardware
- [ ] Redmi Note 10 / 4 GB class baseline
- [ ] newer Android (e.g. G86-class) full visual mode
- [ ] desktop browser PWA

---

# 12. Definition of Done

The master polish is complete only when:

1. A new user can understand and execute every onboarding choice without a dead end.
2. Every workout type ends through one coherent completion/summary pipeline.
3. Factory Reset actually removes GainsLab local state.
4. Export/import is a real full supported backup round-trip.
5. Daily nutrition/date behavior uses local calendar dates.
6. Exercise deletion cannot silently corrupt or mutate routine intent.
7. Subscription state is not client-authoritative.
8. Manifest capabilities are real or removed.
9. Exercise management has modern search/filter UX.
10. Program creation/editing has a clear mental model.
11. Settings/Profile/Stats navigation has correct semantics.
12. No production journey relies on browser \`alert/confirm\`.
13. Product behavior no longer depends on brittle DOM-query/MutationObserver integration.
14. Redmi Note 10 class hardware can use a visually rich mode without automatic “4 GB = reduced” downgrade.
15. Capacitor no longer globally looks worse just because it is native.
16. Critical flows have automated regression coverage.
17. \`npm run build:strict\` and verification suite pass.
18. The PWA can be sent to an unfamiliar user and used without explaining where core actions are hidden.

---

# 13. Execution protocol for Luna / Codex

Before editing:

1. Read this file completely.
2. Inspect the live implementation of every file named in the relevant phase.
3. Verify whether the baseline has changed since \`eec57454c7cebee6553340e1ad41f283a8b21931\`.
4. If newer code already solves an item, validate it and mark the plan item satisfied instead of reimplementing it.
5. Create/use one branch: \`agent/gainslab-pwa-master-polish-v1\`.

During implementation:

- execute in P0 → P1 → P2 → P3 order;
- keep the app runnable after every checkpoint;
- run targeted tests continuously;
- run full verification at phase boundaries;
- preserve persisted user data;
- prefer small pure business-logic extractions over massive component rewrites;
- do not stop after producing recommendations: implement the maximum safe scope;
- if an item is blocked by missing external credentials/payment infrastructure, complete every non-blocked prerequisite and record the exact external dependency.

At each checkpoint report:

- commit SHA;
- files changed;
- tests/builds executed;
- pass/fail count;
- remaining risks;
- manual checks still required.

---

# 14. Copy-ready /goal prompt

Use this from the implementation branch:

\`\`\`text
/goal Implement the complete GainsLab PWA master product polish defined in GAINS_LAB_PWA_MASTER_POLISH_PLAN.md.

Treat that markdown as the source of truth. Work on ONE branch only: agent/gainslab-pwa-master-polish-v1. Do not create a branch per phase.

Execute in strict order: P0 correctness/trust → P1 UX coherence → P2 visual/performance polish → P3 public-product readiness.

Critical constraints:
- Do not rewrite the app.
- Do not add unrelated features.
- Preserve all existing workout systems and data compatibility.
- Protect the current workout runtime, offline persistence, rest timer, KONG behavior and nutrition/history/stats functionality.
- Redmi Note 10 / 4 GB is the minimum performance floor, but DO NOT automatically downgrade it to reduced effects solely because of 4 GB RAM or CPU-core heuristics.
- Capacitor Android must not be globally forced into a visually inferior reduced mode.
- Use explicit Full / Balanced / Reduced / System effects behavior as defined in the plan.
- Never solve visual polish by reducing touch targets or hiding required information.
- Do not introduce new DOM-query, MutationObserver or synthetic-click integration hacks.
- Replace browser alert/confirm usage in production flows with GainsLab UI.
- Keep subscription entitlement server-authoritative.
- Keep old persisted state and legacy backup compatibility wherever the plan requires it.
- Do not silently substitute exercises where the UI can prevent invalid references.

Implementation protocol:
1. Read the full plan before modifying code.
2. Inspect current main/branch state and account for any code newer than the audited baseline.
3. Establish the automated safety net first.
4. Implement every non-blocked P0 item before major visual redesign.
5. Continue through all P1, P2 and P3 items without stopping after analysis.
6. Use the checkpoint commit structure in the plan.
7. Keep npm run build:strict passing at every checkpoint.
8. Run the appropriate unit/integration tests continuously and the full E2E critical-flow suite at phase boundaries.
9. Run validate-kong before declaring completion.
10. Where Android build tooling is available, validate Capacitor sync/build; otherwise clearly record the exact manual Android verification still required.
11. If payment/server credentials are the only blocker for final paid-commerce behavior, implement the honest early-access state and all server-authoritative client prerequisites instead of faking a purchase flow.

Before finishing, perform the complete Release Verification Matrix and Definition of Done from the plan.

Final handoff must include:
- branch name;
- ordered checkpoint commit SHAs;
- exact test/build commands and results;
- remaining external/manual blockers only;
- concise before/after product behavior summary;
- explicit confirmation of RN10 effects/performance behavior;
- explicit confirmation that planned, freestyle, WOD, calisthenics, Two Block and KONG sessions all use the intended completion path.
\`\`\`

---

## Final product principle

When forced to choose between visual spectacle and interaction quality, prefer interaction quality.

When both are possible on the RN10 performance floor, keep both.
