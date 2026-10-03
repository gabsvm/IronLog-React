# AUDIT FOLLOW-UP 6 — L1 a L9 (alcance/cálculo de stats, pulidos, APK release)

- Rama: `agent/gainslab-audit-fixes-v3` (sin ramas nuevas).
- Rango: `804725f` (L1) … `79f2019` (L8). El APK L9 se construyó sobre `79f2019` con árbol limpio.
- Fecha: 2026-10-03.

## L1 — Promedio semanal correcto (`804725f`)

- Causa: `CALCULATE_OVERVIEW` dividía por `weeksFound.size` (números de semana distintos
  1..5 repetidos en cada plan), no por semanas reales. En historial, 853 series / ~168 por
  semana implicaba divisor ≈ 5.
- Cambios: nuevo `utils/statsOverview.ts` con `computeOverview(logs, mesoId)` pura
  (divisor = pares distintos `(mesoId, week)` con al menos un log no saltado; sin
  mesoId/week usa la semana calendario ISO de `startTime`; mínimo 1; saltados y series sin
  completar fuera; CARDIO sigue en el conteo porque las vistas lo filtran). El worker la
  llama; `OverviewResult` suma `weeks`; caché overview `v2` → `v3`; `StatsViewImpl` guarda
  `overviewWeeks` (lo muestra L4).
- Evidencia: `tests/unit/statsOverview.test.ts` (6 tests: 2 mesociclos × semanas 1..3 →
  `weeks` 6; filtro por plan; fallback ISO; saltados/incompletas fuera; caso 3×6 → 6;
 sson nunca 0 + forma del resultado). TDD: RED (módulo inexistente) antes de GREEN.
- Ejemplo numérico (set de prueba de dos mesociclos, 6 series de espalda por log):
  - Antes: 36 series / 3 (semanas 1..3 colapsadas) = **12** por semana (falso MRV).
  - Después: 36 series / 6 semanas reales = **6** por semana (MAV correcto).
  El valor "antes" se deriva del código previo leído (`weeksFound.size` = 3) más
  aritmética exacta; el "después" lo ejecuta el test (i) en verde.

## L2 — Alcance único y visible en las tres pestañas (`a8ad0a9`)

- Cambios: estado de alcance elevado a `views/StatsView.tsx` (defecto `plan` con meso
  activo, `history` sin él); nuevo `components/stats/StatsScopeSelector.tsx` bajo el
  encabezado del wrapper (visible en Resumen/Progreso/Volumen, estilo segmentado lima);
  `StatsViewImpl` recibe `scope` + `onScopeChange` sin estado propio (su selector de
  Progreso eliminado); persistencia solo en cambios explícitos con clave nueva
  `il_stats_scope_v2` (la `v1` de K5 se ignora; funciones v1 eliminadas del caché).
- Evidencia: `tests/unit/statsScopeControl.test.tsx` (6 tests RTL del wrapper con 2
  mesociclos: selector en las 3 pestañas; defecto plan; v1 ignorado; el cambio actualiza
  worker + heatmap a la vez y persiste v2; el defecto no se escribe). 6/6 fallan sin el
  fix (stash) y pasan con él. Worker mockeado solo como transporte (no existe en jsdom);
  ejecuta el `computeOverview` real sobre logs reales.
- Nota: un mock con `exercises: []` fresco por render causaba loop de efectos en el
  test; se estabilizó con referencias fijas (artefacto del test, no de la app).

## L3 — Tarjetas del encabezado consistentes (`cfbc555`)

- Cambios: `summarizeLogsByScope(logs, mesoId)` en `utils/statsScope.ts` (misma
  definición que el worker: logs no saltados, series completadas no saltadas, ejercicios
  con ≥1 serie completada, músculos distintos sin CARDIO); el wrapper la usa con el
  alcance vigente; rótulo `Plan actual · Semana N` (nueva clave `currentPlan`) o
  `Todo el historial` según alcance; título hardcodeado "Stats" → `t.statsTitle`.
- Evidencia: 4 unit en `statsScope.test.ts` + 2 RTL en `statsScopeControl.test.tsx`
  (con el mismo set: tarjetas == total dona == suma por tipo; Músculos == músculos con
  volumen > 0 en lista sin Cardio y en heatmap, en ambos alcances). RED antes de GREEN.
- Límite conocido: con promedios que redondean a 0 (ej. 1 serie en 3 semanas) la tarjeta
  Músculos (totales) puede superar al conteo con promedio > 0; el contrato se verifica
  sobre datos representativos donde ningún promedio positivo redondea a 0.

## L4 — Transparencia del promedio (`e7bcc81`)

- Cambios: `VolumeAverageCaption` exportado (`Promedio sobre N semanas · {alcance}` /
  `Average over N weeks · {scope}`; `Esta semana`/`This week` si `weeks` = 1; claves
  `volumeAvgWeeks`/`volumeAvgThisWeek`), bajo el título del bloque de Volumen usando
  `overviewWeeks` + alcance (oculto mientras carga para no mostrar un defecto falso).
- Evidencia: `tests/unit/volumeCaption.test.tsx` (4 tests es/en × 1/N semanas, RED antes
  de GREEN) + 1 RTL de integración (caption real por alcance con `weeks` del worker).

## L5 — Etiqueta corta del nav (`9e3c609`)

- Cambios: clave `navStats` ("Métricas"/"Stats") para el botón (el título sigue
  `t.statsTitle`); `min-w-0 max-w-full truncate` en las 4 etiquetas; 6 specs e2e
  actualizados a `/Stats|Métricas/`.
- Evidencia: `tests/e2e/navLabels.spec.ts` (360x800 y 390x844: texto corto, `Estadísticas`
  ausente, truncado computado en las 4, borde derecho ≥ 8 px del viewport, sin solapes).
  RED (locator Métricas) antes de GREEN. La geometría no se afirma como failing pre-fix
  (el RED cortó en el texto).

## L6 — Header 100% opaco (`0db1ac7`)

- Cambios: `.app-topbar` con fondo sólido `surface-app` (gradiente eliminado, sin fade
  separado); override `reduced` redundante eliminado de `index.css` (el sólido es base en
  todos los modos).
- Evidencia: test reescrito en `visualPolish.spec.ts` (fondo alfa 1 + sin
  `background-image`, y ningún descendiente con paradas alfa < 1, en balanced; el de
  reduced ya pedía eso). 1 falla sin el fix, 5/5 pasan con él.

## L7 — Heatmap sin solape (`dd72706`)

- Cambios: fuera `scale-105/z-10` y `scale-110/z-20` de `getHeatColor`; el resalte queda
  en `box-shadow`/`ring` (no afectan layout). Sin transforms en el archivo.
- Evidencia: `tests/e2e/heatmapGrid.spec.ts` (seed vía `localStorage` → migración real a
  IndexedDB: 30 series en BACK y CHEST → celdas rojas; 12 boundingBox iguales ±1 px y sin
  intersección). RED exacto pre-fix: celda roja 110 px vs 100 px; GREEN post-fix.

## L8 — DragOverlay portaled a body (`79f2019`)

- Causa real (medida, corrige la hipótesis del enunciado): el panel vaul abierto NO tiene
  `transform` sino `position: fixed`, que igual captura a los descendientes `fixed`.
  dnd-kit pone `top: 570px` (viewport) pero renderiza en 930 = 570 + 347 (top del panel).
- Cambios: `DragOverlay` envuelto en `createPortal(..., document.body)` (el contexto
  dnd-kit se conserva) con `zIndex={999}` (> modal 90). `SortableExerciseCardImpl` no
  tiene overlay (no aplica).
- Evidencia: `tests/e2e/dragOverlayPosition.spec.ts` (10 pasos: centro del clon ≤ 24 px
  del puntero en vertical y dentro del sheet en horizontal). Sin el fix: clon en 960 vs
  puntero 612 (offset 348); con el fix pasa. `reorderDrag.spec.ts` y
  `reorderDrag.test.tsx` siguen verdes.

## L9 — APK release de prueba

- Commit fuente: `79f2019` (árbol limpio), `npm run build && npx cap sync android`,
  `assembleRelease` con `JAVA_HOME=C:\jdk-21`, R8.
- Firma: MISMA keystore de debug (`%USERPROFILE%\.android\debug.keystore`, alias
  `androiddebugkey`); cert SHA-256 `a4a85218b5125977bf7ccf408c67d01ea2682ea2916c3dbbf776289d7d853512`
  idéntico al de J3/K10 → `adb install -r` actualiza sin desinstalar.
- Artefactos (ignorados por git, NO commiteados):
  - `C:\Dev\IronLog-React\apk-out\gainslab-release-test.apk` — 13995009 B —
    SHA-256 `B3083B5A4EB9880E37D2905A55EF14B009938EE649844857E8CEF319B397BFBF`
  - `C:\Dev\IronLog-React\apk-out\mapping.txt` — 5479020 B —
    SHA-256 `BCBE1E299DEB758F8A601CC4704F2D5685B843523D99A2599B3F55C18858A1F2`
    (idéntico: sin cambios nativos).
- Versiones (`aapt dump badging`): `versionCode 414`, `versionName 4.0.3-kong.6`,
  `compileSdk 36 / targetSdk 36 / minSdk 24`.
- Instalación: `adb install -r C:\Dev\IronLog-React\apk-out\gainslab-release-test.apk`
- NO verificado: instalación y logcat en dispositivo — al momento de L9 `adb devices`
  no lista ningún equipo (en K10 sí estaba `96165d8a`). Pendiente correr install + logcat
  cuando haya un dispositivo conectado.

## Resultado de los 4 comandos (rama final)

- `npm run build`: OK (precache 62 assets, caché `e3e76ac37a92`).
- `npm run test:run`: 62 archivos / 307 tests, todo verde.
- `npm run lint:a11y`: 0 errores.
- `npx playwright test` (config por defecto): 37/37 verde (33 previos + navLabels 2 +
  heatmapGrid 1 + dragOverlayPosition 1; visualPolish actualizado por L6).

## Notas y pendientes

- Flakes transitorios en `test:run` bajo carga paralela (`lazySheets`, `modulePreload`):
  fallan de a uno en corridas aisladas y pasan solos y en rerun completo; disjuntos de
  los diffs L (timing de idle/lazy). Toda tarea se pusheó con corrida 100% verde.
- K1 en dispositivo real sigue pendiente (sin equipo desbloqueado con inyección).
- L9: install + logcat pendientes de dispositivo (ver arriba).
- Cachés viejos huérfanos (`il_stats_overview_v2`, `il_stats_scope_v1`, chart `v2`) quedan
  sin limpiar; las claves nuevas los ignoran.
