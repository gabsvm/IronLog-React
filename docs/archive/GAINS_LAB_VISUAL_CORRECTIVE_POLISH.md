# GainsLab — Visual Corrective Polish Pass

**Repository:** `gabsvm/IronLog-React`  
**Branch:** `agent/gainslab-pwa-master-polish-v1`  
**Baseline:** `bbbe525135798b2072db49cb2d55af9962dd4f84`  
**Primary target device:** Moto G86 Power  
**Date:** 2026-10-01

## Goal

Perform a **surgical corrective pass** on the reference-driven redesign already implemented.

Do **not** redesign GainsLab again. The current visual direction is accepted.

This pass exists to fix the concrete integration, correctness, responsive-layout, and interaction issues identified after reviewing the real Moto G86 screenshots and auditing the current branch implementation.

Work only on:

`agent/gainslab-pwa-master-polish-v1`

Do not merge to `main`.

Do not create another branch.

Do not perform or claim Redmi Note 10 physical validation in this pass.

---

# 1. Preserve the accepted visual direction

Keep:

- compact workout logging table;
- one dominant expanded exercise;
- collapsed secondary exercises;
- new Home next-session hero;
- lime reference theme and theme-token architecture;
- new Rest sheet visual direction;
- new Finish Session sheet visual direction;
- grouped Profile/Settings IA;
- new Reorder sheet;
- explicit effects profiles;
- all current KONG, Freestyle, WOD, Calisthenics and Two Block behavior.

This is a **corrective polish pass**, not another product redesign.

---

# 2. P0 — Fix the workout header collision

## Problem

The session-level reorder launcher is still rendered as a fixed floating button:

`views/WorkoutView.tsx`

and positioned by legacy CSS:

`views/reorder-history-polish.css`

Current rule:

```css
.workout-reorder-launcher {
  top: calc(env(safe-area-inset-top, 0px) + 6px);
  right: 48px;
}
```

That geometry belonged to the old workout header.

In the current redesigned header it visibly overlaps the green **Terminar** button on the Moto G86 screenshot.

## Required correction

Remove the fixed floating reorder launcher entirely.

Do not solve this by changing `right: 48px` to another magic offset.

Integrate the session-level reorder action into the real workout header composition.

Preferred structure:

```text
<   Torso A                  0:22   [Terminar]
    Semana 1 · 14 restantes
```

Secondary session actions should be accessible through one compact header action/menu.

At minimum, this menu may contain:

- Añadir ejercicio;
- Ordenar ejercicios.

If there is enough space on wider breakpoints, Add may remain explicit.

On narrow mobile widths, prioritize:

1. Back
2. Session title/subtitle
3. Elapsed time
4. Finish

Everything else is secondary.

Delete the now-obsolete `.workout-reorder-launcher` positioning CSS.

---

# 3. P0 — Remove duplicate Home shell/header

## Problem

`Layout.tsx` already renders the global shell header:

- GainsLab logo;
- sync state;
- profile avatar.

`HomeViewImpl.tsx` renders another independent top header:

- GainsLab;
- Guidelines/KONG;
- Settings;
- another avatar-like `G`.

The real screenshot therefore shows two complete headers and duplicate brand/profile affordances.

## Required correction

Use `Layout.tsx` as the only app-shell brand/profile header.

Remove the duplicate Brand/Profile header from `HomeViewImpl.tsx`.

Home content should begin with the current program section:

```text
My program · NH Lab                  [...]
SEMANA 1 de 5 · 0 de 4 días
```

KONG/Guidelines actions that are Home-specific may move next to or below the program title.

Do not duplicate:
- logo;
- avatar;
- global profile entry.

---

# 4. P0 — Fix missing `MoreHorizontal` icon

## Problem

`HomeViewImpl.tsx` uses:

```tsx
<Icon name="MoreHorizontal" />
```

but `components/ui/Icon.tsx` does not register/import `MoreHorizontal`.

Production fallback renders a nearly empty block, visible in the Home screenshot.

## Required correction

Import and register Lucide `MoreHorizontal` in `ICON_MAP`.

Add a focused unit test against the actual exported icon map/component behavior or otherwise ensure all icon names used by the touched surfaces are registered.

Do not silently replace the icon with an unrelated alias unless product semantics require it.

---

# 5. P0 — Unify rest UI and effort feedback into one source of truth

## Problem A — duplicate rest interfaces

There are currently two rest UIs:

1. global `RestTimerOverlay`;
2. inline `WorkoutRestWidget` inside `WorkoutViewImpl.tsx`.

This creates two competing rest surfaces.

The inline widget may appear far below the active exercise when the routine has many exercises, making the new Easy / OK / Hard feedback hard to discover.

## Problem B — feedback can update the wrong set

Current `handleRateEffort()` scans exercises from the end and updates the latest completed set it can find.

That does not prove which set triggered the current rest period.

If the user logs exercises out of order, the effort answer can be written to a different completed set.

## Required architecture

`RestTimerOverlay` must become the **single canonical rest UI**.

Remove `WorkoutRestWidget` from the workout list once equivalent functionality exists in the overlay.

When a completed set starts a rest period, persist transient rest context identifying the exact source:

```ts
{
  exerciseInstanceId: number,
  setId: number
}
```

Use the smallest compatible representation in the existing timer state/context.

Then:

- Easy / OK / Hard updates exactly that set;
- the context is cleared when the rest ends/skips;
- undoing/completing unrelated sets must not redirect the rating target;
- supersets must identify the set that actually starts the rest after the pair/round condition succeeds;
- EMOM/drop/no-rest protocols must not fabricate rest feedback.

Only show effort feedback when the relevant current configuration says that feedback is enabled.

Do not globally write arbitrary RPE values when the corresponding feature is disabled.

---

# 6. P0 — Correct Finish Session template-update eligibility

## Problem

Current guard:

```ts
const isKong = activeMeso?.programSystem?.systemId === 'kong_4day';
const canUpdateTemplate = !isKong && completedSets > 0;
```

This protects KONG but does not prove that the active session actually maps to an editable planned day.

Detached sessions such as:

- Freestyle;
- CrossFit/WOD;
- Calisthenics;
- Two Block Mass;

typically use `dayIdx = -1`.

If a personal mesocycle also exists, the current guard can still show **Actualizar plantilla** even though that detached session has no planned day to update.

## Required correction

Create one explicit eligibility helper for template update.

It must require all of the following:

- completed workout data exists;
- active mesocycle exists;
- session is a planned session belonging to that mesocycle;
- `dayIdx` is a valid in-range program day;
- target routine is user-editable;
- canonical KONG definitions are not directly mutated;
- detached session types do not show the control unless a future explicit "Save as template" feature exists.

Do not infer editability solely from `!isKong`.

Add tests against the real helper for:

- personal planned session → allowed;
- KONG → denied;
- Freestyle `dayIdx=-1` → denied;
- WOD → denied;
- Calisthenics detached → denied;
- Two Block detached → denied;
- invalid day index → denied.

---

# 7. P0 — Normalize workout set progress semantics

## Problem

Current workout statistics mix different set domains.

In `WorkoutViewImpl.tsx`:

- `completedSets` currently counts every completed set;
- `totalWorkingSets` excludes warmups;
- `avt_hop` treatment differs from other UI areas.

This can produce semantically inconsistent values in:

- header remaining sets;
- progress bar;
- Finish Session `completed / total`;
- active exercise progress.

## Required correction

Extract one canonical working-set classifier/helper.

Use it everywhere touched by this pass.

At minimum document and enforce treatment for:

- warmup;
- regular;
- AVT hop;
- myorep;
- myorep match;
- top;
- backoff;
- drop;
- giant;
- cluster;
- EMOM;
- rest-pause;
- time-volume;
- triple-add.

The same domain used for total must be used for completed.

Do not allow impossible summaries such as `4 / 3 series`.

Add tests against the real production helper.

---

# 8. P1 — Remove the duplicated Clock icon

## Problem

The redesigned workout header wraps `WorkoutTimer` with an external Clock icon.

But `WorkoutTimer` already renders its own Clock icon.

The screenshot visibly shows two clock glyphs.

## Required correction

Use a single icon.

Prefer making `WorkoutTimer` own its visual content and render it once.

Avoid nested pill styling if both parent and child currently create a background container.

---

# 9. P1 — Make the workout header robust at narrow mobile widths

The current title/subtitle can truncate aggressively because the row also contains:

- elapsed timer;
- Add;
- Finish;
- formerly Reorder.

After removing fixed Reorder, ensure approximately 360dp-class viewport widths remain clean.

Requirements:

- session title remains readable;
- subtitle may truncate after meaningful content;
- Finish remains visible;
- no overlap;
- timer remains legible;
- header does not exceed one primary row plus one subtitle row;
- no horizontal scrolling.

Do not reduce primary touch targets to solve layout pressure.

---

# 10. P1 — Fix exercise metadata wrapping

## Problem

On the Moto screenshot, the active exercise metadata wraps:

`HORIZONTAL PRESS · 6-10 REPS · BW`

then leaves `SS` alone on a second line.

## Required correction

Prevent orphan metadata chips.

Possible acceptable approaches:

- prioritize slot + rep range + BW and let superserie state be communicated by the existing left relationship accent;
- render SS in a compact relation indicator near the exercise title;
- use controlled wrapping where two chips never leave one semantic badge alone.

Do not hardcode specifically for `SS`; make metadata wrapping intentional.

---

# 11. P1 — Fix expanded/collapsed state semantics

## Problem

Current active exercise state is derived from:

`manualActiveId ?? defaultActiveId`

where `defaultActiveId` is the first incomplete exercise.

Tapping Collapse on the default active exercise can set `manualActiveId` to null and immediately cause the same exercise to become active again.

The chevron can therefore promise a collapse that cannot actually persist.

## Required correction

Use an explicit state model.

Acceptable examples:

```ts
manualActiveId: number | null
collapsedByUser: boolean
```

or a single explicit active id where `null` genuinely means none expanded.

Requirements:

- user can collapse the current card;
- user can expand any other card;
- completing the final set of one exercise may advance to the next incomplete exercise if the user has not explicitly chosen otherwise;
- no surprise re-expansion on the same render;
- state remains predictable when exercises are added/replaced/deleted.

Add tests for the actual state transition helper if extracted.

---

# 12. P1 — Remove redundant Home week-progress bars

## Problem

The Home now has a day selector that already shows:

- current/next day;
- completed days;
- selected day.

`WeekProgress` then renders another four-bar progress row below the hero.

In the real screenshot it reads more like an unexplained placeholder than useful information.

## Required correction

Remove the redundant `WeekProgress` visual from this Home path unless it communicates information not already represented.

Do not remove progress data used elsewhere.

If adherence/week progress needs to remain visible, integrate it into the program subtitle or day selector rather than adding a second anonymous progress rail.

---

# 13. P1 — Fix Rest Timer ring theme color

## Problem

`RestTimerOverlay.tsx` currently uses:

```tsx
stroke="var(--primary-500, #c4f13a)"
```

But GainsLab stores the CSS variable as an RGB triplet:

```css
--primary-500: 196 241 58;
```

## Required correction

Use:

```tsx
stroke="rgb(var(--primary-500))"
```

or the canonical equivalent.

Verify all accent themes:

- Hypertrophy;
- Ocean;
- Forest;
- Royal;
- Sunset;
- Monochrome.

Do not hardcode lime for the timer ring.

---

# 14. P1 — Make rest "next exercise" context truthful

Current `RestTimerOverlay` finds the first incomplete set by scanning all exercises.

That is not necessarily the correct next exercise after:

- manually changing active exercise;
- supersets;
- out-of-order logging.

Now that the timer will have an exact source set/exercise context, use that context to resolve the next useful action.

For supersets:
- before the pair/round is complete, no full rest should start;
- after the pair/round triggers rest, show the correct next round/exercise context.

For normal exercises:
- prefer the next incomplete set in the current exercise before claiming a different "next exercise", unless product logic explicitly advances the active exercise.

Keep the copy truthful.

---

# 15. P2 — Strengthen the visual-redesign tests

## Problem

`tests/unit/visualRedesignInteractions.test.ts` currently reimplements production logic inside the test for several behaviors.

A copied algorithm can pass even when the actual implementation differs.

Two concrete examples found during audit:

1. circular timer progress test uses different progress semantics from the real ring implementation;
2. KONG/template test uses a locally invented classifier rather than the actual production eligibility logic.

## Required correction

Do not test copies of algorithms.

Extract pure production helpers where appropriate and import them into the tests.

Candidates:

- working-set classification/progress;
- template-update eligibility;
- active-exercise transition logic;
- superset block reorder logic;
- timer ring percentage/offset calculation;
- exact rest-feedback target resolver if implemented as pure logic.

The unit suite should fail if production behavior regresses.

Keep UI/E2E coverage for rendered interaction behavior.

---

# 16. P2 — Verify no new legacy positioning/hack remains

Audit touched areas for:

- `position: fixed` controls that assume old header geometry;
- magic right/top offsets;
- `:has()` dependencies;
- `querySelector`;
- `MutationObserver`;
- synthetic clicks;
- child-index selectors;
- CSS that hides structural mistakes instead of fixing composition.

Do not undertake an unrelated repo-wide rewrite.

Remove obsolete rules only where this corrective pass replaces them.

---

# 17. Tests required

## Unit/integration

Add or update tests for:

- exact rest-feedback source set;
- feedback disabled state;
- superset rest source;
- template update eligibility;
- detached session denial;
- working-set counts;
- active-card collapse semantics;
- registered MoreHorizontal icon;
- timer ring calculation via production helper;
- reorder block helper if extracted.

## E2E / rendered critical paths

At minimum verify:

### Workout header
- Finish is visible and unobstructed at mobile viewport;
- no floating reorder button overlaps it;
- secondary actions remain reachable;
- only one clock icon/pill appears.

### Home
- only one brand/profile shell exists;
- no missing-icon placeholder;
- day selector works;
- hero CTA works;
- no redundant anonymous progress rail.

### Rest
- completing a set starts rest where appropriate;
- Easy/OK/Hard updates the exact triggering set;
- skipping rest clears source context;
- keyboard/input focus does not break overlay behavior.

### Finish
- planned personal session can show Update Template;
- KONG cannot;
- Freestyle/WOD/Calisthenics/Two Block detached sessions cannot.

---

# 18. Verification commands

Run:

```bash
npm run build:strict
npm run test:run
npm run validate-kong
npm run test:e2e
git diff --check
```

If the configured Android environment is still available:

```bash
npm run android-debug-apk
```

A successful APK build is not physical-device validation.

---

# 19. Definition of Done

- [ ] Reorder no longer overlaps Finish.
- [ ] No fixed launcher uses old header geometry.
- [ ] Home contains one global brand/profile header.
- [ ] MoreHorizontal renders correctly.
- [ ] RestTimerOverlay is the single canonical rest surface.
- [ ] Effort feedback targets the exact set that triggered rest.
- [ ] Feedback respects the user's enabled/disabled configuration.
- [ ] Template Update only appears for valid editable planned sessions.
- [ ] KONG remains immutable.
- [ ] Detached sessions cannot accidentally update an unrelated routine.
- [ ] Working-set progress uses one canonical classifier.
- [ ] Header has one Clock icon.
- [ ] Header fits narrow mobile width without overlap.
- [ ] SS metadata no longer appears as an orphan chip.
- [ ] Current exercise can actually be collapsed.
- [ ] Home redundant WeekProgress rail is removed/integrated.
- [ ] Rest timer ring follows the active accent theme.
- [ ] Rest "next" context is truthful.
- [ ] Visual tests exercise imported production logic rather than copied algorithms.
- [ ] No new selector/DOM/layout hacks introduced.
- [ ] Existing KONG, Freestyle, WOD, Calisthenics and Two Block behavior remains intact.
- [ ] `npm run build:strict` passes.
- [ ] `npm run test:run` passes.
- [ ] `npm run validate-kong` passes.
- [ ] `npm run test:e2e` passes.
- [ ] `git diff --check` passes.
- [ ] Android debug APK rebuilt if tooling/env available.
- [ ] Moto G86 physical validation reported truthfully as RUN or NOT RUN.
- [ ] Redmi Note 10 physical validation is **NOT RUN by design**.

---

# 20. Suggested checkpoint commits

1. `fix(workout): integrate reorder into redesigned header`
2. `fix(home): remove duplicate shell and missing icon`
3. `fix(workout): unify rest context and effort feedback`
4. `fix(workout): harden finish template eligibility and set progress`
5. `fix(ui): polish mobile header metadata and active-card state`
6. `fix(home): remove redundant week progress rail`
7. `test(ui): bind corrective coverage to production helpers`
8. `docs(ui): record corrective polish verification`

Do not create branches per checkpoint.

---

# 21. Final handoff

Report:

1. branch;
2. final HEAD;
3. ordered corrective commits;
4. exact production helpers extracted;
5. exact bugs fixed;
6. test/build commands and results;
7. unit/E2E counts;
8. Android APK path/result if built;
9. Moto G86 physical validation: RUN or NOT RUN;
10. Redmi Note 10 physical validation: NOT RUN by design;
11. remaining blockers only.

Do not merge to `main`.
