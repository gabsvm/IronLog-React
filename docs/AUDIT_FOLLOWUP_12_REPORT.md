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
