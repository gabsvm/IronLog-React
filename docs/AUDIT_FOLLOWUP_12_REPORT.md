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

## U5b — SetRow y SortableExerciseCard (los dos con React.memo)

| Componente | Antes | Después (máx. por archivo) |
|------------|------:|----------------------------|
| `SetRow` | 34,3 KB | 0,8 KB + `setRow/` (estado 18,7 KB, HoldTimer 6,7 KB, vistas isométrica / peso corporal / estándar ≤ 5,1 KB) |
| `SortableExerciseCardImpl` | 37,5 KB | 1,9 KB + `exerciseCard/` (expandida 17,5 KB, estado 16,8 KB, colapsada 6,3 KB) |

- El límite de `React.memo` queda en el componente exterior (mismas props, misma
  comparación): las vistas son hijos comunes que se renderizan cuando él se renderiza, igual
  que el JSX que había adentro. `setNodeRef`/refs de dnd-kit viajan en el estado.
- Tests de aislamiento de renders (R1 y otros) sin cambios y en verde.
- Resultado: **ningún archivo de `components/`, `views/` ni `context/` pasa de 20 KB**.
- Evidencia: `npm run lint` 0, `test:run` 696/696, Playwright 47/47 (incluye arrastrar y
  reordenar), visual 16/16, bundle WITHIN BUDGET (entrada 81,28 KB, sin cambios).

## U6a — Código muerto (encontrado al preparar U6)

- Búsqueda sistemática de módulos que nadie importa (código, tests y scripts) y verificación
  manual por nombre. Eliminados 9 archivos (~57 KB de código fuente): `AddFoodModal` +
  `data/foodDatabase.ts` (la app agrega comidas con `AddMealModal`), `GoalSetupModal`,
  `ProgramCatalog`, `OnboardingModal`, `SkillProgressionBadge`, `SparkLine`,
  `views/home/WeekProgress.tsx` y `views/workout/RestTimerControl.tsx` (este último salió de
  WorkoutViewImpl en S6; ya estaba sin uso allí).
- **No eliminados** (decisión del dueño): `programs/registry.ts`,
  `programs/engine/ProgramSubstitutions.ts`, `programs/kong/kongSubstitutions.ts` y
  `kongExerciseNotes.ts` tampoco se importan, pero son contenido de dominio KONG que puede
  usar una futura función de sustituciones; no afectan al bundle.
- Traducciones: 81 claves de primer nivel sin ningún uso (ni siquiera como palabra en el
  código) + el espacio `copy.onboardingModal`, borradas de ambos idiomas (el español está
  tipado contra el inglés: `tsc` garantiza la paridad). 11 claves dudosas (aparecen como
  palabra, posible desestructuración) se dejaron. Diccionarios: en 60,9 KB, es 65,2 KB;
  precache crítico 194,83 → 191,39 KB gzip.
- Evidencia: lint 0, `test:run` 696/696, Playwright 47/47, visual 16/16, bundle WITHIN BUDGET.

## U6b — Nutrición por comida en la nube (flag V2)

- S5 guardaba la nutrición como un documento por DÍA: si dos dispositivos cargaban comidas
  el mismo día, ganaba la última escritura del día entero. Ahora:
  `users/{uid}/nutritionEntries/{entryId}` (una comida, con su `date`) y
  `users/{uid}/nutritionDays/{date}` (el agua del día). La colección por día de S5 nunca se
  desplegó (flag apagado), así que se reemplazó sin migración intermedia.
- `services/cloudSectionsV2.ts`: `SECTION_ADAPTERS` describe cada sección como una o más
  colecciones + cómo dividir/reagrupar el array local (`splitNutrition` / `joinNutrition`:
  días del más viejo al más nuevo, comidas por hora, agua conservada); el resto de secciones
  son 1:1. `syncService` (subida, bajada, adopción) recorre los adaptadores.
- Reglas: `nutritionEntries` (claves de FoodEntry + `date`, `id` string, `calories` number) y
  `nutritionDays` (`date` string, `waterMl` number); marcas `collectionsFormat.nutritionEntries`
  / `.nutritionDays`; borrado de cuenta vacía ambas (`V2_COLLECTIONS`).
- Tests: unit `cloudSectionsV2` (comida por id + día por fecha y lápidas; ida y vuelta
  split/join; **dos dispositivos agregando comidas al MISMO día conservan ambas**; migración
  de 200 días vía adaptador; paridad claves ↔ reglas; colecciones ↔ reglas ↔ borrado),
  reglas (dueño / extraños / claves y tipos de ambas colecciones) 18/18, integración con
  emuladores 15/15 (80 comidas + 80 días, marcas, borrado de cuenta), `accountDeletion`
  con el orden nuevo. El test de "mismo día" no se puede correr contra el diseño anterior
  (no existía la colección por comida); por diseño, con un doc por día una de las dos
  escrituras se perdía.
- Evidencia: lint 0, `test:run` verde, Playwright 47/47.

## U7 — Reportes de errores remotos (opt-in, anónimos)

- Crashlytics no tiene SDK web y en Android exigiría `google-services.json` + plugin de
  Gradle; se usó el Firebase que ya está (Firestore), igual para PWA y APK.
- `utils/errorReporting.ts`: preferencia local **apagada por defecto**; se envía solo con
  sesión iniciada (las reglas exigen auth), máx. 10 por sesión, sin repetir el mismo mensaje,
  nunca lanza. El documento: fecha, mensaje y stack (ya redactados y recortados por Q5:
  sin emails ni secretos), origen, vista, versión y plataforma. **Sin uid ni email.**
  Firebase se importa de forma diferida (entrada sin cambio relevante).
- `utils/errorLog.ts` ofrece cada entrada nueva al reportero tras guardarla localmente.
- UI: interruptor en Perfil → Avanzado (tarjeta de registro de errores) con explicación de
  qué se envía; panel de admin con la lista de los 30 reportes más recientes (a demanda).
- Reglas `errorReports/{id}`: crear solo autenticado, claves exactas, tamaños y valores
  acotados (`source`, `platform` enumerados); leer/borrar solo admin; nunca actualizar.
- Tests: unit (apagado por defecto y persistencia, nada sin opt-in, dedupe + tope por sesión,
  sin sesión no envía y permite reintento, sink que falla no lanza, documento sin identidad y
  acotado, claves = allowlist de reglas, interruptor de la UI); reglas 19/19 (crear con/sin
  auth, campo uid rechazado, tamaños, lectura solo admin, sin update); integración con
  emuladores 16/16 (envío real con sesión, nada sin sesión).
- Pendiente del dueño: desplegar las reglas (incluye `errorReports`).
