# GainsLab — Visual Reference Redesign Pass

**Repository:** `gabsvm/IronLog-React`  
**Branch:** `agent/gainslab-pwa-master-polish-v1`  
**Baseline for this pass:** `48f75f44897fbdbe72ff465a4f5c5441b8ff5517`  
**Reference archive:** `docs/design-reference/gainslab-rediseno.zip`  
**Date:** 2026-10-01

## 0. Goal

Implement a second, more decisive product-UI pass using the supplied six-screen HTML redesign as the **visual and information-architecture reference**, while preserving GainsLab's current production logic, data model, workout systems, sync behavior, native timer behavior, KONG handling, backup/reset hardening, entitlement rules, and current automated safety net.

The supplied reference is intentionally simpler and calmer than the current UI. Its value is not exact pixels; its value is the hierarchy:

- fewer simultaneous visual decisions;
- denser but clearer workout logging;
- one obvious active task;
- secondary information collapsed instead of competing;
- settings grouped by user intent;
- rest/finish/reorder flows treated as focused tasks;
- accent color used for state and action rather than decoration.

The primary target device for this product pass is the **Moto G86 Power**.

**Do not perform or claim Redmi Note 10 physical validation in this pass.**  
**Do not claim Moto G86 Power physical validation unless a real device was actually used.**

---

# 1. Visual reference package

Unpack:

```bash
unzip docs/design-reference/gainslab-rediseno.zip -d /tmp/gainslab-rediseno-reference
```

Reference files:

1. `01-entrenamiento-y-terminar.html`
   - workout execution;
   - active exercise hierarchy;
   - set-row density;
   - inline rest/effort feedback;
   - finish-session sheet.

2. `02-home.html`
   - Home hierarchy;
   - current program/week;
   - day selector;
   - next-session hero;
   - bottom navigation.

3. `03-perfil-y-ajustes.html`
   - unified Profile/Settings information architecture;
   - grouped Training / Appearance / Data sections.

4. `04-descanso.html`
   - focused rest-timer sheet;
   - next exercise context;
   - duration adjustments and presets.

5. `05-ordenar-ejercicios.html`
   - reorder sheet;
   - supersets visually treated as blocks;
   - explicit drag handles and progress.

6. `06-apariencia.html`
   - theme/accent/language hierarchy;
   - effects/performance as an explicit advanced choice.

These HTML files are **design references, not production code**.

Do not:
- copy their CDN dependency;
- use Tabler webfont;
- paste their inline HTML/CSS into React;
- hardcode dark-only values into every component;
- replace existing GainsLab capabilities with the reduced demo behavior.

Use existing React components, `Icon`, theme tokens, effects profiles, Sheets, accessibility infrastructure, and app state.

---

# 2. Non-negotiable preservation rules

The visual redesign must not regress behavior already hardened on this branch.

Preserve:

- IndexedDB/local persistence;
- active-session persistence on pagehide / visibility changes;
- canonical local reset behavior;
- versioned backup/restore;
- Firebase auth/sync and conflict handling;
- server-authoritative production entitlement;
- native Capacitor rest timer bridge;
- web Worker / endAt-based rest timing;
- current Full / Balanced / Reduced / System effects profiles;
- current Capacitor effects authority;
- KONG canonical conversion behavior;
- official exercise-catalog protections;
- exercise reference replacement safety;
- current onboarding outcomes;
- the unified workout completion pipeline;
- current History / Stats / Nutrition data semantics;
- all current special workout protocols.

Do not touch `main`.

Do not create a new branch for this pass.

---

# 3. Design language to implement

The reference establishes a calmer GainsLab product language.

## 3.1 Density

Prefer:
- 12–16 px internal card spacing;
- compact metadata;
- clear row rhythm;
- one strong CTA;
- limited chips;
- fewer nested rounded rectangles.

Do not reduce touch targets below approximately 44 px for primary interactive controls.

Density must come from:
- fewer redundant wrappers;
- reduced vertical whitespace;
- collapsed secondary information;
- better alignment.

It must **not** come from tiny buttons or unreadable type.

## 3.2 Surfaces

Use the current theme-token system rather than scattering reference hex values.

The dark reference roughly corresponds to:

- app background: near-black;
- base panel: `#0e0e10`;
- raised card: `#17171a`;
- input/secondary control: `#212125`;
- subtle border: `#2a2a2e`;
- muted text: `#8a8a92`;
- default lime accent: approximately `#c4f13a`.

These must map into GainsLab tokens such as:
- `--surface-app`;
- `--surface-base`;
- `--surface-raised`;
- `--surface-elevated`;
- `--border-subtle`;
- `--border-strong`;
- `--text-primary`;
- `--text-secondary`;
- `--text-muted`;
- `--primary-*`.

The design must continue to work with:
- light mode;
- Ocean;
- Forest;
- Royal;
- Sunset;
- Monochrome.

The HTML reference shows lime because that is the default example, not because lime should be hardcoded everywhere.

## 3.3 Typography

Use a restrained hierarchy:

- page/sheet title: strong but not huge;
- exercise/session title: dominant;
- row value: readable and tabular;
- metadata: 11–12 px equivalent;
- labels: short uppercase only where it helps scanning.

Avoid excessive all-caps and excessive font-black usage.

## 3.4 Motion

Keep interaction motion short and purposeful.

Suggested vocabulary:
- tap/press: ~100–140 ms;
- row completion: ~140–180 ms;
- expand/collapse: ~180–220 ms;
- sheet transition: ~220–280 ms.

Prefer opacity and transform.

Do not add continuous decorative loops during a workout.

Respect `prefers-reduced-motion` and the explicit GainsLab effects profile.

---

# 4. Phase V1 — Workout execution redesign

Primary production areas:

- `views/WorkoutViewImpl.tsx`
- `views/WorkoutView.tsx`
- `components/workout/SortableExerciseCard*.tsx`
- `components/workout/ExerciseCardSets.tsx`
- `components/workout/SetRow.tsx`
- `views/product-polish.css`
- `views/workout-density-feedback.css`

Reference: `01-entrenamiento-y-terminar.html`.

## 4.1 Header

Replace the visually fragmented workout header with a compact task header.

Target hierarchy:

- back;
- session/day name, e.g. `Torso A`;
- compact subtitle with week + useful progress;
- session timer;
- compact Finish CTA;
- thin global workout progress.

Do not duplicate the same timer/progress information in multiple pills.

Prefer a metric such as **remaining loggable sets** when it can be computed honestly.

If a protocol has a different completion model, do not force a misleading set count.

## 4.2 Active exercise model

The reference is strongest when one exercise is clearly active.

Implement an explicit expanded/collapsed model:

- current/active exercise: expanded;
- secondary exercises: compact summary cards;
- tap a compact card to expand/jump to it;
- completing the current exercise may advance focus sensibly;
- user can still manually expand another exercise.

Collapsed card should preserve useful context:
- exercise name;
- pattern/muscle;
- rep target;
- completed sets / total;
- recommendation/suggestion when present;
- superset relation when present.

Do not remove access to:
- exercise menu;
- substitute;
- detail;
- warmup;
- set-type controls;
- reorder;
- superset actions.

## 4.3 Superset visual treatment

Use a subtle vertical accent/connection treatment like the reference.

A superset must read as a relationship, not as unrelated cards with identical borders.

Do not make the accent louder than the primary lime completion/action state.

## 4.4 Set rows

For ordinary resistance work, use the reference's compact row logic.

Weighted exercise layout:

```text
# | Previous | Weight | Reps | Complete
```

Bodyweight / weighted-bodyweight layout:

```text
# | Previous | +kg | Reps | Complete
```

Adapt the row for existing special domains rather than forcing one grid:

- cardio: duration/distance/intensity as currently supported;
- isometric: target/elapsed duration controls;
- pure bodyweight;
- assisted bodyweight;
- typed protocol sets.

Preserve:
- warmup;
- drop;
- myorep / myorep match;
- top/backoff;
- giant;
- cluster;
- EMOM;
- rest-pause;
- time-volume;
- AVT/hop;
- any existing protocol-specific fields.

The compact redesign must not erase semantics needed to execute those systems.

## 4.5 Row state

Use three obvious visual states:

- pending;
- active/next;
- completed.

Completed:
- subtle primary-tinted row;
- clear completion affordance;
- no giant glow.

Active:
- stronger border/focus treatment;
- editable values remain obvious.

Pending:
- quiet neutral surface.

Use haptic feedback already available.

## 4.6 Previous performance

The reference uses a compact `Ant.` column.

Use existing history data.

Do not fabricate prior values.

For weighted work, a concise prior set can show the relevant last weight/reps.  
For bodyweight, show the useful prior rep/load signal.  
For special types, fall back to the existing history hint presentation if the compact cell would be ambiguous.

## 4.7 Add/remove sets

Keep `Añadir serie` easy to reach.

`Quitar serie` should remain available but visually secondary.

Do not make destructive row removal as prominent as the primary training action.

---

# 5. Phase V2 — Effort feedback + rest timer

References:
- lower portion of `01-entrenamiento-y-terminar.html`;
- `04-descanso.html`.

Primary production areas:

- `components/ui/RestTimerOverlay.tsx`
- `context/TimerContext.tsx`
- `hooks/useTimer.ts`
- workout completion/feedback handlers;
- native bridge scheduling code must remain behaviorally unchanged unless required for UI integration.

## 5.1 Feedback placement

The current Easy / OK / Hard feedback should not inflate every completed set row.

When applicable, move it into a compact post-set/rest context.

Target:
- set completes;
- rest starts;
- compact feedback control appears in the rest context;
- `Fácil / OK / Duro` is one short decision;
- once answered, it does not continue occupying workout-row space.

If the user has disabled the corresponding feedback/RIR feature, do not force the control.

Preserve whatever adaptation/progression logic consumes this feedback.

## 5.2 Rest sheet

Redesign the full rest timer around the reference.

Required hierarchy:

- clear `Descansando` state;
- large remaining time;
- total target duration;
- circular or equally legible progress;
- next exercise / next superset partner context;
- `-10 s`;
- `+30 s`;
- presets such as 30 / 60 / 90 where appropriate;
- `Saltar descanso`.

If existing recommended-rest values differ from the reference presets, preserve the real recommendation.

## 5.3 Reliability

Do not change the core timer guarantees:

- derive state from `endAt`;
- background resync;
- native AlarmManager/receiver in Capacitor;
- vibration/sound behavior;
- native notification/channel logic.

This is a UI pass, not a timer rewrite.

---

# 6. Phase V3 — Finish session redesign

Reference: second screen/state in `01-entrenamiento-y-terminar.html`.

Use the existing Sheet primitive.

Target hierarchy:

1. `Terminar sesión`;
2. compact session summary;
3. optional template-update decision;
4. note;
5. primary completion action;
6. secondary continue action;
7. separated destructive discard.

## 6.1 Summary

Show only truthful values available from current session state, such as:
- duration;
- completed sets;
- possibly exercises completed if useful.

Do not create fake milestone metrics.

## 6.2 Update template

Copy should explain the consequence:

`Actualizar plantilla`  
`Guarda ejercicios, orden y series para próximos entrenos.`

Use a switch/card state rather than a bare checkbox.

Critical semantics:

- only show this option when there is a user-editable template/routine context;
- never mutate official KONG program definitions;
- if KONG requires conversion to personal before persistent structural edits, preserve that rule;
- do not silently rewrite historical logs.

## 6.3 Note

Keep the session note optional.

Use a useful placeholder, not generic `...`.

Example:

`Cómo te has sentido hoy`

or the richer current translation if already available.

## 6.4 Actions

Preferred order:

- primary: `Guardar y terminar` / `Terminar sesión`;
- secondary: `Seguir entrenando`;
- destructive: `Descartar sesión` separated by space/divider.

Do not use primary-accent styling for discard.

Discard still requires explicit confirmation.

---

# 7. Phase V4 — Home redesign

Reference: `02-home.html`.

Primary areas:

- `views/HomeViewImpl.tsx`
- home subcomponents;
- `components/layout/Layout.tsx` only where shell integration is required.

Preserve the existing bottom navigation architecture:

- Entreno;
- Historial;
- central Quick Start;
- Dieta;
- Stats.

## 7.1 Home north star

The screen should answer immediately:

**What am I training next?**

Recommended hierarchy:

1. GainsLab / profile access;
2. active program name;
3. week/day progress;
4. compact day selector;
5. selected/next session hero;
6. primary `Empezar` / `Reanudar` CTA;
7. secondary program information below the primary action.

## 7.2 Day selector

Reference: four equal compact day buttons.

Behavior:

- 1–4 day programs may fit;
- longer schedules can horizontally scroll;
- completed/skipped/today/current states remain distinguishable;
- keyboard/a11y roles remain valid.

## 7.3 Session hero

Show:

- session/day name;
- relevant muscle tags;
- estimated duration;
- exercise count;
- set count;
- top few exercises + prescription;
- `y N ejercicios más` instead of dumping the full routine;
- one dominant start/resume CTA.

Do not reintroduce clutter that the prior product-polish pass intentionally removed.

## 7.4 Preserve non-happy states

The redesign must still handle:

- no active plan;
- active live session;
- completed week;
- mesocycle completion;
- KONG block transition;
- KONG hub/actions;
- skipped day;
- program with >4 days;
- freestyle access through Quick Start.

---

# 8. Phase V5 — Profile + Settings information architecture

Reference: `03-perfil-y-ajustes.html`.

Primary areas:

- `components/profile/ProfileSheet.tsx`
- `components/settings/SettingsModal.tsx`
- related settings subcomponents.

Goal: make Profile the human entry point and Settings the grouped configuration system, without duplicating the same editable data in multiple places.

## 8.1 Profile top

Show:

- avatar/initial;
- display name;
- Pro/free entitlement label;
- email/account summary;
- compact user stats;
- body metrics summary with focused Edit action.

## 8.2 Grouped sections

Use the reference IA:

### Training
Examples:
- current program;
- program editor;
- exercises/templates;
- RIR/feedback setting;
- keep-screen-awake.

### Appearance
- theme/accent;
- language;
- effects/performance.

### Data
- sync status / sync action;
- export/backup;
- import/restore where applicable;
- diagnostics/advanced data tools behind a deeper entry.

### Account
- sign in/out;
- entitlement information;
- early-access/Pro handling as currently implemented.

Do not expose internal implementation concepts as top-level menu items unless they are user-actionable.

## 8.3 Advanced/admin

Do not delete capabilities that are not shown in the reference.

Admin/diagnostics/destructive tools can live in an explicit Advanced/Data sub-sheet.

Keep dangerous operations visually separated.

---

# 9. Phase V6 — Reorder exercises redesign

Reference: `05-ordenar-ejercicios.html`.

Primary area:

- `components/workout/ReorderExercisesSheet.tsx`.

Preserve:
- dnd-kit;
- pointer drag;
- keyboard drag;
- haptics;
- methodology warnings;
- KONG protections.

## 9.1 Superset blocks

Visually group linked exercises.

The reference uses:
- group label;
- left relationship accent;
- contained rows;
- progress such as `0/3`;
- explicit grip.

Supersets should behave coherently when reordering.

If methodology requires linked exercises to move together, preserve/enforce that.

Do not allow the visual redesign to create an invalid KONG/order state.

## 9.2 Non-superset items

Use the same row language without a fake group.

Keep the sheet readable with large routines.

---

# 10. Phase V7 — Appearance redesign

Reference: `06-apariencia.html`.

Primary areas:
- Appearance section of settings;
- existing theme/effects controls;
- `utils/effectsProfile.ts`;
- App preferences.

## 10.1 Theme

Use a segmented choice:
- Oscuro;
- Claro;
- Auto/System.

## 10.2 Accent

Present the current accent choices as visual swatches:
- default hypertrophy/lime;
- Ocean;
- Forest;
- Royal;
- Sunset;
- Mono.

Use current canonical theme values. Do not create a second competing palette source.

## 10.3 Language

Simple two-option segment where appropriate.

## 10.4 Effects & performance

Keep the already-established explicit model:

- System;
- Full;
- Balanced;
- Reduced.

The reference's `Completo` row is the compact entry point, not a reason to remove the other profiles.

Capacitor must not be forced to Reduced.

---

# 11. Architecture cleanup while touching these surfaces

This pass should reduce dependence on selector hacks.

Current styling contains structure-dependent overrides in:
- `views/product-polish.css`;
- `views/workout-density-feedback.css`;
- other old polish layers.

When a touched area is redesigned:

1. move the intended layout into explicit React composition/classes;
2. delete the corresponding obsolete DOM-shape override;
3. do not add new `:has()`, MutationObserver, querySelector, synthetic-click, or child-index hacks to achieve the redesign.

Do this incrementally.

Do not perform a repository-wide CSS rewrite unrelated to the reference screens.

---

# 12. Accessibility

Required:

- visible focus states;
- semantic buttons;
- no nested interactive elements;
- labels for icon-only controls;
- correct tab/segment roles where used;
- keyboard-operable reorder;
- sheets keep focus management;
- touch targets remain usable;
- no information encoded only by accent color;
- reduced-motion remains respected.

---

# 13. Performance target

Primary target: **Moto G86 Power**.

The redesign should feel immediate on that device class.

Use:
- React memoization where already effective;
- virtualization where already present;
- CSS transforms/opacity for motion;
- `content-visibility` only where useful;
- lazy loading already established.

Avoid:
- expensive always-on blur across large scrolling surfaces;
- huge nested shadows;
- continuous animation in workout rows;
- rerendering the full workout tree on every timer tick if avoidable.

Do not physically test RN10 in this pass.

Do not claim G86 physical performance unless actually tested.

---

# 14. Testing and regression matrix

Do not weaken existing tests.

Add focused tests where the redesign changes interaction structure.

At minimum verify:

## Workout
- active exercise expands;
- secondary exercise can expand;
- set values update;
- set completes;
- completed state persists;
- bodyweight +kg layout works;
- weighted layout works;
- special set controls remain reachable;
- finish sheet opens;
- discard still confirms.

## Rest
- timer sheet reflects real timer state;
- +time / -time controls;
- skip rest;
- next superset context when available;
- feedback action does not corrupt set state.

## Home
- next session CTA;
- active session resumes;
- day selection;
- >4 day program does not break layout;
- no-plan state;
- KONG state.

## Reorder
- normal reorder;
- keyboard reorder;
- linked supersets;
- KONG warning/protection.

## Profile/Settings
- appearance entry;
- sync/data actions still accessible;
- account state;
- entitlement display.

## Appearance
- theme;
- accent;
- language;
- Full/Balanced/Reduced/System behavior.

---

# 15. Required verification

Run:

```bash
npm run build:strict
npm run test:run
npm run validate-kong
npm run test:e2e
git diff --check
```

If Android tooling and the already-configured Firebase build environment remain available:

```bash
npm run android-debug-apk
```

Do not interpret a successful APK build as physical runtime validation.

---

# 16. Implementation order / checkpoint commits

Use the same branch and keep commits reviewable.

Suggested order:

1. `refactor(ui): establish reference-driven product primitives`
2. `feat(workout): implement compact active-exercise logging surface`
3. `feat(workout): redesign rest and effort feedback flow`
4. `feat(workout): redesign finish-session sheet`
5. `feat(home): implement next-session focused home hierarchy`
6. `feat(settings): unify profile and settings information architecture`
7. `feat(workout): redesign reorder sheet and superset grouping`
8. `feat(settings): redesign appearance controls`
9. `refactor(ui): remove obsolete polish selector hacks`
10. `test(ui): cover redesigned critical interactions`
11. `docs(ui): record visual redesign verification`

Do not create a branch per checkpoint.

---

# 17. Definition of Done

The pass is done only when:

- [ ] Reference ZIP is reviewed before implementation.
- [ ] Workout header is compact and task-oriented.
- [ ] One active exercise is visually dominant.
- [ ] Secondary exercises can collapse without losing access.
- [ ] Ordinary set rows are materially denser than the current production layout.
- [ ] Weighted and bodyweight rows use appropriate columns.
- [ ] Special protocol set types remain executable.
- [ ] Easy/OK/Hard no longer bloats every completed set row.
- [ ] Rest timer has a focused, readable sheet.
- [ ] Finish sheet follows summary → template choice → note → finish hierarchy.
- [ ] Official KONG content cannot be mutated through the template-update control.
- [ ] Home clearly prioritizes the next session.
- [ ] Bottom navigation remains unchanged in architecture.
- [ ] Profile/Settings follows grouped Training / Appearance / Data intent.
- [ ] Reorder clearly groups supersets and keeps keyboard DnD.
- [ ] Appearance uses the existing theme/effects sources of truth.
- [ ] Dark mode matches the supplied visual direction.
- [ ] Light mode remains usable and coherent.
- [ ] Alternate accent themes still work.
- [ ] No new DOM-query/MutationObserver/CSS-structure hacks are introduced.
- [ ] Touched obsolete selector hacks are removed.
- [ ] Existing sync/persistence/backup/entitlement behavior remains intact.
- [ ] Planned, Freestyle, WOD, Calisthenics, Two Block and KONG workout behavior is not regressed.
- [ ] `npm run build:strict` passes.
- [ ] `npm run test:run` passes.
- [ ] `npm run validate-kong` passes.
- [ ] `npm run test:e2e` passes.
- [ ] `git diff --check` passes.
- [ ] Android debug APK is rebuilt if tooling/env are available.
- [ ] Redmi Note 10 physical validation is explicitly **NOT RUN by design**.
- [ ] Moto G86 physical validation is reported truthfully as RUN or NOT RUN.

---

# 18. Final handoff

Report:

1. branch and final HEAD;
2. ordered commits;
3. files/components redesigned per reference screen;
4. any deliberate deviations from the reference and why;
5. exact test/build commands and results;
6. unit/E2E counts;
7. Android APK build result/path if run;
8. Moto G86 physical validation: RUN or NOT RUN;
9. Redmi Note 10 physical validation: **NOT RUN by design**;
10. remaining blockers only.

Do not merge to `main`.
