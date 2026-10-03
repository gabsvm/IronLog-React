# Serie Q — Reporte de seguimiento 9 (Q0–Q22)

Rama: `agent/gainslab-audit-fixes-v3`. Tag de retorno: `pre-q-series` (pusheado a origin).
Sin ramas nuevas, sin GitHub Actions, sin `firebase deploy`, sin binarios commiteados.
Estado persistente: se actualiza y pushea al cerrar CADA tarea.

## Commits

| ID | Commit | Estado |
|----|--------|--------|
| Q0 | `a4de001` | hecho |
| Q1 | (este commit) | hecho |

## Q0 — Preparación

- Árbol limpio verificado; `git tag pre-q-series && git push origin pre-q-series`.
- Baseline (4 comandos, árbol `2861a69`): `npm run build` OK (61 assets, 7 critical + 54 lazy);
  `npm run test:run` 363/363; `npm run lint:a11y` limpio; `npx playwright test` 40/40.

## Q1 — Infra de integración con emuladores (Auth + Firestore)

- `firebase.json`: emulador de Auth en 127.0.0.1:9099 (libre) junto a Firestore 8085.
- `lib/firebaseLoader.ts`: `shouldUseFirebaseEmulator(env, {isDev, mode})` exportada — activa solo con
  `VITE_FIREBASE_EMULATOR=1` Y (DEV o modo test). Conecta Auth/Firestore a los hosts de
  `VITE_FIREBASE_EMULATOR_AUTH/_FIRESTORE` y usa `memoryLocalCache` (Node sin IndexedDB).
  Sin literales de hosts en el código: si falta el host, warn y sigue a live.
- `vitest.integration.config.ts` (entorno node, `test.env` con flag + hosts + proyecto demo) y
  `npm run test:integration` (`emulators:exec --project demo-q1-integration --only auth,firestore`).
- Tests: `tests/integration/authFirestore.test.ts` (registro real en Auth emulator, write/read
  `users/{uid}` y `data/history` bajo las reglas REALES, otro usuario denegado) y
  `tests/integration/syncRoundTrip.test.ts` (`uploadState` → `downloadState` preserva secciones).
  Stubs: `fake-indexeddb/auto` + `window.dispatchEvent/localStorage` (sin `navigator`: es read-only
  en Node y el nativo ya no tiene serviceWorker).
- Prod-safety: `tests/unit/emulatorProdGuard.test.ts` — 4 casos del gate + scan de `dist/assets/*.js`
  que falla si aparece `127.0.0.1:9099/8085` o `localhost:9099/8085` (requiere `dist/`, skip si falta).
- Evidencia: `test:integration` 5/5 en emuladores. Fail-proof: con el loader en stash, los 2 archivos
  fallan (`beforeAll` → `auth/api-key-not-valid` porque el SDK pega a live con la demo key).
- Gates: build OK, `test:run` 368/368, lint limpio. `.env.example` con las 3 vars nuevas (sin valores).
- No verificado: nada pendiente; emuladores ejecutables en esta máquina (JDK 21 en PATH).
