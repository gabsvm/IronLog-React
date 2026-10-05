# Serie T — Reporte de seguimiento 11 (lo pendiente de la serie S)

Rama: `agent/gainslab-audit-fixes-v3`. Tag de retorno: `pre-t-series` (en origin).

## T1 — Islas oscuras: código muerto y overrides muertos

- Al ir a tokenizar los colores hex "de isla oscura" que justificaban los `!important` de
  `styles/app-polish.css`, resultó que casi todos vivían en código MUERTO de `SetRow.tsx`:
  `getTypeColor`, `getRowAccent` y `getBorderAccent` no se llamaban, y `rowAccent` se
  calculaba sin usarse. Tailwind igual generaba esas clases (escanea el código) y había
  reglas de modo claro compensándolas. Eliminado el código muerto.
- Overrides eliminados (ya ninguna clase fuente los usa): en `app-polish.css` 10 reglas /
  16 `!important` (#1A1A1A, #121212 en Home; #141416, #17171b/B, #18181c, #1c1816,
  #18141f, #131b1f, #1A1A1A, #121212, #202024 en Workout); en `index.css` 8 selectores
  muertos de la lista de compatibilidad (quedan solo los vivos: `#131316`, `#17171B/95`).
  `!important` en app-polish: 37 → 22. CSS 129,59 → 126,89 KB.
- El test `lightModeContrast` exigía que `index.css` contuviera tres de esos selectores
  muertos. Reemplazado por una guarda real: toda clase `bg-[#hex]` OSCURA usada en
  componentes debe ser variante `dark:` o tener remapeo `html.light`. Quitando el remapeo de
  `#131316` el test falla y nombra la clase.
- Arnés visual (14 capturas: 7 pantallas × claro/oscuro, incluido el menú de la tarjeta de
  ejercicio): línea base sobre el build previo, 14/14 idénticas tras el cambio.
- Lo que queda de `!important` en app-polish (22) compite con la capa de compatibilidad
  global (`[class*="bg-zinc-900/"]`, etc.), que cubre muchas utilidades usadas en muchos
  componentes; no es código muerto.

Nota T1: después del commit, una corrida completa mostró un fallo en `statsMerge.test.tsx`
(pasó en 3 corridas aisladas y 3 completas siguientes). Mismo patrón que `detectPRs` en S7:
`waitFor` con timeout por defecto de 1 s en tests que renderizan Stats bajo la carga de la
suite completa. Se trata en T4.

## T2 — Partir ExercisesView y ProgramEditView

| Antes | Bytes | Después |
|-------|------:|---------|
| `views/ExercisesView.tsx` | 36 392 | orquestador 1,8 KB + `views/exercises/` (hook 15,5 KB, modo lista 10 KB, modo edición 3,7 KB, diálogos 9,3 KB) |
| `views/ProgramEditView.tsx` | 25 794 | orquestador 4,9 KB (incluye el return temprano de KONG) + `views/programEdit/` (hook 6,9 KB, días 8 KB, diálogos 9,3 KB) |

- `NutriView.tsx` ya había bajado a 20 209 bytes (< 20 KiB) con el codemod de S8: sin cambios.
- Mismo método que S6 (movido literal, hook + bloques + orquestador), ahora con un divisor
  genérico; los hooks son `.tsx` porque contienen helpers que devuelven JSX.
- Corregido de paso: el botón atrás de ExercisesView tenía `aria-label="Volver"` fijo en
  español; ahora usa `t.back` (nombre accesible = texto visible traducido).
- Evidencia: `tsc` limpio, ningún test modificado, `test:run` 681/681, `lint:a11y` limpio,
  eslint con los mismos 4 errores preexistentes (se tratan en T4), Playwright 47/47.
- Siguen > 20 KB (componentes, fuera de esta tanda): `SortableExerciseCardImpl` 37,5 KB,
  `RestTimerOverlay` 37,5 KB, `AdminTemplateManager` 36,7 KB, `SetRow` 34,3 KB,
  `FreestyleSessionModal` 29,6 KB, `SetupWizard` 25,7 KB, `ProgramHub` 25 KB, `AddMealModal` 23,7 KB.
