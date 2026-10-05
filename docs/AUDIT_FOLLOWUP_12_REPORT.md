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

## U4 — Contraste del menú en modo claro y layout de escritorio

- Menú de la tarjeta de ejercicio: textos `*-300` (pensados para fondo oscuro) ilegibles
  sobre fondo claro → `text-amber-700 / blue-700 / red-700 / violet-700` con variante `dark:`
  que conserva exactamente el color anterior en oscuro.
- `Layout`: el contenido y la barra superior van en una columna centrada `max-w-2xl`
  (672 px); en teléfonos (más angostos) no cambia nada. La vista de entreno usa su propio
  layout fijo y no se tocó.
- Suite visual: +2 capturas de escritorio (1280×800, claro/oscuro). Diferencias aceptadas
  tras revisarlas: `workout-menu-light` (el contraste buscado) y `nutrition-*` (888 px de
  anti-aliasing del texto en los botones "Agregar comida"/"Cardio" por la capa nueva del
  contenedor; a simple vista es idéntica). Resto 11/11 sin cambios.
- `.gitattributes`: `.githooks/*` con fin de línea LF (un hook en CRLF rompe `sh` en Windows).
- Evidencia: suite visual 16/16, Playwright 47/47, `verify` en el hook de push.

## U5a — Componentes grandes (6 de 8)

| Componente | Antes | Después (máx. por archivo) |
|------------|------:|----------------------------|
| `AddMealModal` | 23,7 KB | 18,7 KB + `addMeal/mealData.ts` 5,2 KB |
| `ProgramHub` | 25,0 KB | 1,4 KB + `hub/` (paneles 18 KB, estado 7,3 KB, datos 1,4 KB) |
| `SetupWizard` | 25,7 KB | 7,8 KB + `wizard/` (pasos 13,6 KB, estado 6 KB) |
| `FreestyleSessionModal` | 29,6 KB | 3,4 KB + `freestyle/` (calistenia 12,2 KB, datos 5,1 KB, estado 6,3 KB, WOD 4,3 KB, gym 2,1 KB) |
| `AdminTemplateManager` | 36,7 KB | 0,6 KB + `templates/` (editor 16,5 KB, estado 13,5 KB, lista 7,2 KB, toast, constantes) |
| `RestTimerOverlay` | 37,5 KB | 0,9 KB + `restTimer/` (activo 18,6 KB, estado 9,6 KB, lógica 5,4 KB, avisos 3,9 KB, anillo 2,5 KB) |

- Código movido literal (helpers/datos de nivel superior a módulos hermanos; cuerpos en
  hook de estado + componentes de vista). Exportaciones públicas reexportadas.
- **Mejoras de paso**: ProgramHub (`Header`, `Hero`, `MetricGrid`) y AdminTemplateManager
  (`Toast`) definían componentes DENTRO del render: React los recreaba y remontaba en cada
  render (mismo antipatrón que `ColorPill` en Q18). Ahora son componentes de nivel superior.
- RestTimerOverlay: en reposo muestra los dos avisos únicos; con el temporizador activo solo
  el de notificaciones (comportamiento original preservado al separarlos).
- Test nuevo `programHub` (4: inicio, cada acceso abre su panel y Atrás vuelve, todos los
  paneles renderizan, Cerrar llama a onClose). Pasa igual con el código anterior y con el
  nuevo: prueba de equivalencia del refactor (ProgramHub no tenía tests).
- Evidencia: `tsc`, `npm run lint` en 0, `test:run` 696/696, Playwright 47/47, visual 16/16.
