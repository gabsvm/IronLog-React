# GainsLab PWA — Master Polish Corrective Pass

**Repository:** `gabsvm/IronLog-React`  
**Branch:** `agent/gainslab-pwa-master-polish-v1`  
**Audited baseline:** `fd284b74dcefd3ca7845c7eca0e681ba5bcf5e8c`  
**Parent plan:** `GAINS_LAB_PWA_MASTER_POLISH_PLAN.md`  
**Audit date:** 2026-09-30

## 0. Goal

Close the concrete defects and verification gaps found in the post-implementation audit of the Master Product Polish pass.

This is a **corrective pass**, not a redesign and not a rewrite. Preserve the product work already completed unless a change is required by one of the findings below.

The intended day-to-day target device is now the **Moto G86 Power**. Keep the interface visually rich, responsive, and pleasant on that class of hardware.

The Redmi Note 10 / 4 GB remains a useful compatibility floor for code-level heuristics, but **DO NOT perform or claim physical Redmi Note 10 validation in this pass**. After the product is correct and polished on the G86 target, physical RN10 behavior will be evaluated separately by the owner.

Do not claim physical G86 validation either unless it was actually performed on a real connected G86 by the owner.

---

# 1. Hard constraints

1. Work only on `agent/gainslab-pwa-master-polish-v1`.
2. Do not merge to `main`.
3. Do not create a second implementation branch.
4. Do not reimplement the app.
5. Do not perform broad visual redesigns unrelated to these findings.
6. Do not introduce a blanket “cheap Android mode”.
7. Capacitor must not be visually downgraded merely because it is Capacitor.
8. Explicit effects preferences must remain authoritative:
   - `system`
   - `full`
   - `balanced`
   - `reduced`
9. `prefers-reduced-motion` must still win for accessibility.
10. Do not fake device validation with jsdom/Node timing tests.
11. Do not label host microbenchmarks as physical-device performance validation.
12. Preserve existing persisted data formats unless a migration is necessary and tested.
13. Do not silently rewrite historical workout logs when changing exercise references.
14. Subscription entitlement must be server-authoritative in production.
15. No fake payment completion or client-side production Pro unlock.
16. Keep `npm run build:strict` green at every checkpoint.
17. Do not update the release checklist with claims stronger than the tests actually prove.

---

# 2. Finding A — Critical E2E coverage is materially incomplete

The current `tests/e2e/criticalJourneys.spec.ts` has only three journeys and several are smoke tests rather than the full workflows specified by the master plan.

## Required corrections

### Journey A — Suggested onboarding

Keep the existing test, but make sure it proves:

1. fresh state;
2. onboarding answers are accepted;
3. suggested recommendation is applied;
4. active mesocycle exists;
5. Home is reached;
6. the next scheduled session can actually be opened.

Do not merely assert that the navigation bar exists.

### Journey B — Custom onboarding

Add the missing real workflow:

1. fresh state;
2. onboarding;
3. choose custom routine;
4. land in program editor;
5. create/edit a day;
6. add at least one slot;
7. assign a concrete exercise;
8. configure sets/reps;
9. start/save the routine;
10. land in Home with an active personal mesocycle;
11. reopen the editor and prove persisted values are still present.

### Journey C — Quick Start / Freestyle

Strengthen the existing Quick Start test into the real workflow:

1. onboarded user;
2. open Quick Start;
3. start Freestyle;
4. add/select an exercise;
5. enter at least two sets;
6. complete at least one set;
7. prove live session persistence;
8. finish;
9. arrive at `SessionSummaryView`;
10. close summary;
11. verify the workout exists in History.

If the rest timer is triggered by set completion in the actual UI, verify that the timer can be started/updated without blocking completion. Do not invent a synthetic timer flow that the user cannot execute.

### Journey D — Persistence / background boundary

Replace the current pre-seeded-only smoke test with one that proves actual mutation persistence:

1. create or enter a live workout through the UI;
2. change weight/reps/completion state;
3. trigger the app persistence boundary used by production (`visibilitychange` / `pagehide` or the closest deterministic Playwright equivalent);
4. reload/re-enter;
5. resume;
6. prove the edited values and completion state survived.

A pre-seeded `localStorage` object by itself is not sufficient evidence.

### Journey E — Fresh-device cloud restore

Add the missing cloud-restore acceptance path.

Because Firebase networking may be inappropriate for deterministic E2E, isolate the decision logic into a pure helper and mock the gateway at the boundary if necessary.

Required behavior:

- A truly fresh/local-empty installation may auto-apply a valid cloud snapshot.
- A device with meaningful local user data must **not** be classified as empty merely because it has no active mesocycle and no workout logs.
- Local nutrition/body/cardio/custom-food/personal-template data must prevent unsafe “empty device” auto-overwrite.
- Default seeded catalog/program scaffolding must not by itself incorrectly make a new install look user-populated.
- Existing local data + newer cloud data must go through the normal scoped conflict path instead of silent replacement.

Create a pure helper such as `isMeaningfullyEmptyLocalState(...)` and unit-test it.

## Acceptance

The E2E report must enumerate exactly what was executed and what passed. Do not claim WOD/Calisthenics/Two Block/KONG end-to-end coverage unless those exact UI flows are actually covered.

---

# 3. Finding B — Capacitor still gets a blanket visual downgrade

Current `index.tsx` does this in native shell startup:

```ts
document.documentElement.dataset.effects = 'reduced';
(document as any).startViewTransition = undefined;
```

This contradicts the product requirement.

## Required corrections

1. Remove the native-shell startup assignment that forces `data-effects='reduced'`.
2. Do not globally destroy/disable `document.startViewTransition` only because the app runs in Capacitor.
3. Let `AppContext` + `resolveEffectsMode()` remain the canonical effects decision.
4. In `system` mode, touch/mobile including Capacitor should resolve to `balanced`, not `reduced`.
5. Explicit `full` must remain possible in Capacitor.
6. Explicit `reduced` and OS reduced-motion must still work.
7. Audit `native-performance.css`:
   - retain low-risk interaction/performance fixes such as `touch-action`, overscroll control, numeric rendering, or narrowly targeted expensive filters when justified;
   - remove blanket rules whose only purpose is to make Capacitor visibly inferior;
   - do not remove useful visual polish without evidence.

## Tests

Add/update tests proving:

- Capacitor + system => balanced.
- Capacitor + full => full.
- Capacitor + reduced => reduced.
- reduced-motion => reduced regardless of platform.
- native shell initialization does not preempt the explicit effects resolver.

No physical Redmi test is required.

---

# 4. Finding C — KONG → personal routine conversion has two inconsistent paths

There are currently two separate conversions:

- `Layout.tsx`: resolves the current KONG week, converts it with `toEditableProgram()`, rebuilds plan, creates a personal cycle.
- `App.tsx`: only removes `programSystem` and changes `mesoType`, leaving different semantics.

This can produce different data depending on where the user presses Edit.

## Required corrections

1. Create one canonical conversion function/service, preferably alongside `ProgramConversion`.
2. Both Home/plan actions and Layout/Quick Start must call the same function.
3. The conversion must:
   - resolve the current KONG week with current substitutions;
   - convert it to editable program data;
   - strip KONG-only prescription/internal metadata;
   - rebuild `plan` from the converted program;
   - create a new personal mesocycle identity;
   - normalize week/duration semantics deliberately;
   - preserve the user-visible exercise substitutions;
   - not mutate `KONG_4DAY_V1`.
4. Use one documented semantic for the resulting personal routine. If the current Layout behavior (new personal 4-week cycle beginning at week 1) is retained, codify it in the helper and tests.

## Tests

Prove that every UI entry point produces structurally identical converted data for the same KONG source state.

---

# 5. Finding D — Production entitlements still have a client-side unlock capability

`AuthContext.upgradeToPro()` currently creates a Pro subscription in client state even though Firestore writes were removed.

That still violates the server-authoritative contract.

## Required corrections

1. Production client code must never gain Pro by constructing its own entitlement object.
2. Remove or redesign `upgradeToPro()` so it cannot call `setSubscription({ isPro: true, ... })`.
3. Prefer a read/refresh model:
   - server/backend/webhook provisions entitlement;
   - client refreshes the authoritative subscription document;
   - `usePro` derives access only from that authoritative result.
4. Audit `startDemo()`:
   - if a local demo is still useful for development, gate it explicitly behind development/test configuration and make it unreachable in production;
   - otherwise remove it from production behavior.
5. Early Access via WhatsApp may remain as the honest public UX.
6. Do not implement fake Mercado Pago/Stripe success.

## Tests

Prove that no production-callable client method can locally flip a free user to Pro without an authoritative entitlement response.

---

# 6. Finding E — Official CrossFit/Calisthenics catalog items are misclassified as custom

`isBuiltInExercise()` currently knows `DEFAULT_LIBRARY` and `source === 'nilsson_bw'`, while bundled `cf_*` and `cal_*` definitions are not consistently identified as official catalog entries.

## Required corrections

Create one canonical catalog classification.

It must recognize:

- default library exercises;
- bundled CrossFit exercises;
- bundled Calisthenics exercises;
- Nilsson/bodyweight bundled catalog entries.

Implementation may use canonical ID sets and/or explicit `source` metadata, but there must be a single production decision function.

Behavior:

- official catalog exercises cannot be destructively deleted;
- they must not appear as user-created custom exercises;
- they must not be “deleted” only to silently reappear on restart;
- custom exercises retain archive/delete behavior.

## Tests

Add regression fixtures using real `cf_*`, `cal_*`, `nil_*`, default IDs, and `custom_*`.

---

# 7. Finding F — “Replace References” exists in logic but not in the UI

`replaceExerciseReferences()` is implemented but referenced custom exercise deletion only offers Archive or Cancel.

## Required corrections

For a referenced custom exercise, offer:

1. Archive;
2. Replace references;
3. Cancel.

Replace flow:

1. open a real exercise selector;
2. exclude the same source exercise;
3. prefer non-archived replacement candidates;
4. show an explicit confirmation;
5. update:
   - current program;
   - active mesocycle plan;
   - personal templates;
6. do **not** rewrite historical workout logs;
7. after replacement succeeds, the old custom exercise may be destructively deleted only if it now has zero active references.

Make the multi-domain update coherent so the UI cannot leave half the references changed if one local state setter is missed.

## Tests

Cover service behavior and at least one component/integration flow proving the replacement action is actually reachable.

---

# 8. Finding G — Backup export and restore are not fully symmetric

The new backup envelope includes `config`, but `restoreBackupToStorage()` does not restore:

- `il_cfg_rir`
- `il_cfg_rp`
- `il_cfg_rp_rir`
- `il_cfg_screen`

## Required corrections

1. Restore config using the **actual production storage keys**.
2. Keep legacy backup compatibility.
3. Do not silently accept an unsupported future schema.
4. Preserve active session and active mesocycle correctly.
5. If a storage write fails, the import must not report a false success.
6. Avoid partially applying an invalid backup before validation completes.

## Required round-trip test

Create a realistic test:

`state A → export → clear/reset storage → restore → read every backed-up domain → compare with A`

At minimum include:

- program;
- exercises;
- logs;
- activeMeso;
- activeSession;
- userProfile;
- nutritionLogs;
- cardioSessions;
- bodyLogs;
- macroGoals;
- nutritionGoal;
- personalTemplates;
- customFoods;
- rpFeedback;
- config.

The test must exercise the actual restore storage path, not only envelope construction.

---

# 9. Finding H — Local reset has incorrect preference keys and a persistence race

Current preference-preservation constants use old/non-production keys such as:

- `il_theme`
- `il_lang`
- `il_color_theme`

Actual app keys include:

- `il_theme_v1`
- `il_lang_v1`
- `il_color_theme_v1`
- `il_effects_mode`

Also, `lib/store.ts` has pending 500 ms IndexedDB debounce timers that can fire after `db.clear()` and reinsert old `activeSession` / `activeMeso`.

## Required corrections

### Preference keys

Use exact production keys.

### Do not clear unrelated origin storage

`resetLocalData()` must target GainsLab-owned storage.

Do not remove arbitrary unrelated `localStorage` keys simply because `preservePreferences=false`.

### Store persistence race

Add a canonical reset primitive in `lib/store.ts`, for example `resetStorePersistence()`, that:

1. cancels pending `sessionTimeout`;
2. cancels pending `mesoTimeout`;
3. sets in-memory active session/meso to null without scheduling a stale write;
4. allows `resetLocalData()` to clear storage afterward safely.

Audit `pagehide` / `visibilitychange` handlers so they cannot re-persist stale pre-reset state during the reset flow.

## Tests

Add a fake-timer regression:

1. schedule a debounced session write;
2. trigger reset before 500 ms;
3. advance timers;
4. prove old session/meso were not reinserted.

Also prove:

- exact preferences are preserved when requested;
- GainsLab data is removed;
- unrelated origin keys survive.

---

# 10. Finding I — ErrorBoundary still uses native `window.confirm()`

The production runtime claims native alert/confirm removal, but the ErrorBoundary reset action still calls `window.confirm()`.

## Required correction

Replace this with an in-boundary two-step confirmation state or equivalent self-contained UI that does not depend on the application React tree being healthy.

The ErrorBoundary must retain:

- Reload App;
- destructive Reset Local Data as a secondary action;
- explicit destructive confirmation;
- no automatic wipe.

Add a static regression check if useful to prevent `window.alert` / `window.confirm` from returning to production code.

---

# 11. Finding J — Release documentation overstates what was actually verified

Update `docs/RELEASE_CHECKLIST_AND_ADR.md` only after the corrective tests run.

Required truthfulness rules:

1. RN10 physical validation: **NOT RUN**.
2. Do not claim RN10 physical performance from Node/jsdom microbenchmarks.
3. Moto G86 Power is the primary product target, but physical G86 validation is **NOT RUN** unless a real device test was actually performed.
4. Capacitor APK build: state exactly whether it was built.
5. Capacitor physical runtime: state exactly whether it was run.
6. WOD/Calisthenics/Two Block/KONG end-to-end: only check them if exact automated or physical flows exist.
7. Report the real Playwright journey count.
8. Report the real unit-test count from the final run.
9. Keep unresolved external blockers explicitly unresolved.

---

# 12. Fresh-device restore safety audit

In addition to Journey E, audit the current cloud startup decision.

The current pattern:

```ts
const isLocalEmpty = !activeMeso && (!logs || logs.length === 0);
```

is too weak.

Replace it with a deliberate pure classifier for **meaningful local user state**.

At minimum inspect:

- active session;
- active mesocycle;
- workout logs;
- nutrition logs;
- cardio sessions;
- body logs;
- custom foods;
- personal templates;
- non-default user-owned routine state when distinguishable.

Do not count deterministic bundled catalog seed data as user-owned content by itself.

Acceptance:

- truly fresh device → cloud can restore automatically;
- meaningful local data → no silent full overwrite;
- newer cloud sections → scoped conflict UI;
- “Keep Local” must not manufacture false user edits for every untouched domain without a documented reason.

Audit the current `cancelCloudSync()` behavior, which marks all sync sections dirty. Replace it with safer semantics if it can cause untouched local sections to overwrite newer cloud sections.

Add unit tests around the exact conflict decision.

---

# 13. Verification commands

Run from the final branch state.

Required:

```bash
npm run build:strict
npm run test:run
npm run validate-kong
npm run test:e2e
```

Also run:

```bash
git diff --check
```

If Android tooling is available:

```bash
npx cap sync android
npm run android-debug-apk
```

If Android tooling is not available, report **NOT RUN** with the exact missing prerequisite. Do not substitute a successful web build for an Android build.

Do **not** perform Redmi Note 10 physical validation.

Do not claim Moto G86 Power physical validation unless a real device was actually used.

---

# 14. Required checkpoint commits

Keep the corrective work reviewable. Suggested checkpoints:

1. `test: complete critical PWA journeys and fresh-device decisions`
2. `fix: restore effects authority across PWA and Capacitor`
3. `fix: unify KONG editable conversion`
4. `fix: enforce server-authoritative production entitlements`
5. `fix: harden exercise catalog references and replacement flow`
6. `fix: make backup restore and local reset symmetric`
7. `fix: remove remaining native confirm fallback`
8. `docs: record truthful corrective verification`

If a task naturally requires a different split, that is acceptable, but do not collapse the entire corrective pass into one commit.

---

# 15. Definition of Done

This corrective pass is done only when all applicable statements are true:

- [ ] Journey A proves the suggested plan can actually start.
- [ ] Journey B exists and covers custom onboarding → editor → persisted personal routine.
- [ ] Journey C covers real Freestyle creation → sets → finish → summary → History.
- [ ] Journey D proves actual edited active-session values survive the persistence boundary.
- [ ] Journey E proves safe fresh-device cloud bootstrap decisions.
- [ ] Meaningful local nutrition/body/custom/template data cannot be silently overwritten as “empty”.
- [ ] Capacitor no longer forces reduced effects at startup.
- [ ] Capacitor no longer globally disables View Transitions merely for being native.
- [ ] Full/Balanced/Reduced/System semantics remain explicit.
- [ ] KONG conversion has exactly one canonical implementation.
- [ ] All KONG edit entry points produce equivalent personal routine state.
- [ ] Production client cannot locally grant itself Pro.
- [ ] Local demo behavior is removed from production or explicitly dev-only.
- [ ] CrossFit, Calisthenics, Nilsson, and default bundled exercises are classified as official catalog.
- [ ] Official catalog entries cannot be destructively deleted as “custom”.
- [ ] Referenced custom exercises offer Archive + Replace References + Cancel.
- [ ] Replacement does not mutate historical workout logs.
- [ ] Backup config restores using real storage keys.
- [ ] Export → reset → restore round-trip test covers all backed-up domains.
- [ ] Reset uses real preference keys.
- [ ] Reset preserves unrelated origin keys.
- [ ] Pending Zustand persistence timers cannot resurrect pre-reset session/meso state.
- [ ] ErrorBoundary does not use `window.confirm()`.
- [ ] `npm run build:strict` passes.
- [ ] `npm run test:run` passes.
- [ ] `npm run validate-kong` passes.
- [ ] `npm run test:e2e` passes.
- [ ] `git diff --check` passes.
- [ ] Documentation states physical RN10 validation **NOT RUN**.
- [ ] Documentation states physical G86 validation truthfully.
- [ ] No unverified device-performance claim remains.

---

# 16. Final handoff format

Return:

1. final branch name and HEAD SHA;
2. ordered corrective commit SHAs;
3. each audit finding with:
   - fixed/not fixed;
   - exact file(s);
   - exact test(s);
4. final unit-test count;
5. final E2E journey/test count;
6. exact build/validation commands and outcomes;
7. Android sync/APK result or **NOT RUN**;
8. physical Moto G86 Power validation result or **NOT RUN**;
9. explicit statement: **Redmi Note 10 physical validation NOT RUN by design**;
10. remaining blockers only;
11. recommendation whether the branch is ready for a final audit before merge.

Stop after implementation + host verification. Do not merge to `main`.
