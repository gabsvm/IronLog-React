# Serie U — Reporte de seguimiento 12 (mejoras, integraciones y calidad)

Rama: `agent/gainslab-audit-fixes-v3`. Tag de retorno: `pre-u-series` (en origin).
Alcance pedido: todo lo propuesto EXCEPTO avisos push fiables en la PWA, pasarela de pago y
todo lo de Play Store. Desplegar reglas / encender `VITE_CLOUD_LOGS_V2` no se hace desde acá
(cambia el Firebase real y no hay credenciales): queda documentado para el dueño.

## U1 — Dependencias

- Quitadas `date-fns` (0 usos; también su `manualChunks` en vite.config) y `@capacitor/ios`
  (no hay proyecto iOS).
- Firebase 10.8 → **11.10** (+ `@firebase/rules-unit-testing` 3 → 4). Se probó 12.19: el
  chunk de Firestore pasaba de 106,9 a **169,4 KB gzip**, así que se descartó (corrige una
  afirmación previa mía: la versión actual NO es más liviana). Con 11.10: 111,7 KB (+4,9 KB).
- `framer-motion` se mantiene: lo usa CommandPalette, que ya va en chunk lazy.
- Tests intermitentes de Stats: en la suite completa (12 procesos jsdom en paralelo) un render
  de Stats pasaba de ~0,3 s a 3,7 s. `vitest.config.ts`: `poolOptions.forks.maxForks = 6`.
  Suite 45–48 s → 54 s, pero tiempo de tests 46–51 s → 24 s (menos contención).
- Evidencia: `verify` OK, `test:run` 692/692 ×3, `test:rules` 18/18, `test:integration` 15/15
  (Firebase 11 contra emuladores), Playwright 47/47.

## U2 — Regresión visual permanente

- `tests/visual/screens.visual.ts` + `playwright.visual.config.ts` (puerto 5196, separado de
  los e2e): build de preview, reloj fijo, datos sembrados, 7 pantallas (inicio, historial,
  métricas, dieta, entreno, menú de ejercicio, perfil) × oscuro/claro, comparación píxel a
  píxel (`maxDiffPixels: 0`). 14 capturas de referencia versionadas en
  `tests/visual/__screenshots__/` (736 KB).
- `npm run test:visual` compara; `npm run test:visual:update` acepta cambios buscados
  (revisar el diff antes). Las referencias se generan en la máquina Windows del dueño: las
  fuentes cambian entre sistemas operativos, así que en otra máquina hay que regenerarlas.
- Es el mismo arnés que detectó la fila negra en modo claro (S9) y validó T1.
- Evidencia: generación 14/14 y comparación inmediata 14/14 idénticas (determinista).

## U3 — Hook pre-push (control de calidad local, sin CI)

- `.githooks/pre-push` corre `npm run verify` (secretos, lint, build estricto, tests
  unitarios, validate-kong, presupuesto de bundle) y bloquea el push si falla.
- `npm run hooks:install` (= `git config core.hooksPath .githooks`); ya activado en esta
  copia del repo. En otro clon hay que correrlo una vez.
- Evita repetir lo de S8–S10, cuando `validate-kong` estuvo roto varios commits sin que
  nada lo frenara. Este mismo commit se pushea ya a través del hook.
