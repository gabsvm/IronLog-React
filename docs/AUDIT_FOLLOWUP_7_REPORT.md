# AUDIT_FOLLOWUP_7 — Pulido de estadísticas (M1–M3) + APK release (M4)

Rama: `agent/gainslab-audit-fixes-v3` (sin ramas nuevas).
Base: `docs/AUDIT_FOLLOWUP_6_REPORT.md` (commit `6a902e4`).

Commits (uno por tarea, pusheados tras cada gate):

| Tarea | Commit | Archivos |
|---|---|---|
| M1 | `89c54bc` M1: alcance efectivo por pestaña | `utils/statsScope.ts`, `views/StatsView.tsx`, `tests/unit/statsScope.test.ts`, `tests/unit/statsScopeControl.test.tsx` |
| M2 | `efd3e7b` M2: 1 decimal + formato + cache v4 | `utils/statsOverview.ts`, `services/statsCache.ts`, `views/StatsViewImpl.tsx`, `views/StatsView.tsx`, `components/stats/MuscleHeatmapGrid.tsx`, `components/stats/SymmetryRadar.tsx`, `constants/translations.ts`, tests (overview, scopeControl, volumeZones, statsCachePrune) |
| M3 | `a242922` M3: exFreq solo con series completadas | `utils/statsOverview.ts`, `tests/unit/statsOverview.test.ts`, `tests/unit/statsScopeControl.test.tsx` |
| M4 | este commit (reporte) + APK en `apk-out/` (no commiteado) | `docs/AUDIT_FOLLOWUP_7_REPORT.md` |

No hubo reverts ni bloqueos: M1–M3 verificados con tests de comportamiento real.

## M1. Alcance por defecto según la pestaña

Modelo nuevo en `utils/statsScope.ts` (`effectiveScopeFor(section, userScope, hasActiveMeso)`, puro):

- Estado `userScope: StatsScope | null` en `views/StatsView.tsx`: solo la elección
  EXPLÍCITA del usuario (persistida con la clave v2 existente; `null` si nunca eligió).
- Sin elección: `progress` → `history`; `overview`/`volume` → `plan` si hay
  mesociclo activo, si no `history`. Con elección explícita, las tres pestañas la usan.
- El selector (`StatsScopeSelector`, uno solo bajo el encabezado del wrapper)
  muestra el alcance efectivo de la pestaña visible; al cambiarlo fija `userScope`
  y lo persiste. El defecto NUNCA se escribe en el caché.
- Tarjetas, rótulo ("Plan actual · Semana N" / "Todo el historial"), caption de
  Volumen, dona, heatmaps, radar, gráfico de progreso y PRs usan el alcance
  efectivo de la pestaña visible. `StatsViewImpl` recibe `scope` como prop y
  sigue sin estado propio de alcance.

Evidencia: TDD RED→GREEN (tests escritos antes del fix, fallando por import
ausente/conteos sin corregir; GREEN tras el fix). Tests RTL del wrapper con
logs de dos mesociclos (activo = B, A con más historial):

- `M1: without a stored choice, overview and volume default to plan, progress to history`
- `M1: an explicit choice wins in every tab`
- `M1: a stored v2 choice applies on mount in all tabs`
- `M1: without an active meso every tab defaults to history`
- `M1: cards, doughnut and heatmap agree per tab with its effective scope`
- Puras en `statsScope.test.ts`: `M1: effectiveScopeFor resolves the tab default…`
  (3 casos) + contratos L2/L3/M2/M3 intactos.
- El valor v1 viejo se ignora (`ignores the stale v1 persisted value`) y el
  defecto no se escribe (`does not persist the default scope`).

Tabla de alcance efectivo:

| Pestaña | Sin elección + meso activo | Sin elección + sin meso | Con elección explícita |
|---|---|---|---|
| Resumen | Este plan | Todo el historial | La elección, en las tres |
| Progreso | Todo el historial | Todo el historial | La elección, en las tres |
| Volumen | Este plan | Todo el historial | La elección, en las tres |

## M2. Promedios semanales con un decimal

Cambio en `utils/statsOverview.ts` (`computeOverview`):

- Antes (`git show efd3e7b^:utils/statsOverview.ts`):
  `muscleCounts[key] = Math.round(muscleCounts[key] / weeks);` (entero).
- Después: `raw > 0 ? Math.max(0.1, Math.round(raw * 10) / 10) : 0`
  (1 decimal; si `count > 0` el promedio nunca baja de 0.1, así "tiene volumen"
  coincide siempre con `count > 0`). CARDIO sigue en el cálculo.
- `formatSets(value, lang)` vía `toLocaleString`: entero si es entero, un
  decimal si no, coma en es ("3,5") y punto en en ("3.5"). Usado en la lista de
  volumen, `MuscleHeatmapGrid`, la tarjeta "Series semanales del músculo" y el
  caption de volumen.
- Consumidores revisados para no asumir enteros: `getVolumeZone` (umbrales
  `< 6`, `< 12`, `<= 22` sin cambios — funcionan con decimales), colores del
  mapa de calor, escala del radar (`SymmetryRadar`), `maxVal` de las barras,
  `muscleWeeklySets`/`volumeStatus`.
- Caché de overview `v3 → v4` + `pruneLegacyStatsKeys()` una sola vez por
  sesión (borra `il_stats_overview_v2/v3`, `il_stats_scope_v1`, chart `v2`).
  Nota: el primer intento falló por un `idbKeys` sin importar; se agregó
  `import { keys as idbKeys } from 'idb-keyval'` y se verificó con probe
  (listar + borrar) antes de quitar el probe.

Ejemplo numérico real (mismo set de logs de prueba, semanas reales como divisor):

| Caso | Antes (entero) | Después (1 decimal) |
|---|---|---|
| 2 series en 5 semanas | `Math.round(0.4)` = **0** (desaparecía de la lista) | **0.4** |
| 1 serie en 25 semanas | **0** | **0.1** (piso: nunca 0 si count > 0) |
| 36 series / 6 semanas | **6** | **6** (se mantiene) |

Evidencia: TDD RED→GREEN. Tests:

- `keeps one decimal: 2 sets over 5 weeks average 0.4`
- `floors positive averages at 0.1 so volume never rounds to zero`
- `M2: formatSets prints whole sets plainly, decimals localized` (3 casos:
  enteros, coma/punto, `0.1 + 0.2`)
- `M2: volume zones keep integer thresholds with decimal averages`
  (5.9 → MV, 6 → MEV, 12 → MAV, >22 → MRV)
- `M2: pruneLegacyStatsKeys removes orphaned cache versions once`
- `M2: the muscles contract holds with sparse data (no rounding to zero)`:
  se eliminó el "límite conocido" de L3 — el contrato
  Músculos == músculos con volumen > 0 vale en TODOS los casos, sin necesidad
  de datos "representativos".

## M3. Una sola definición de "Ejercicios"

Cambio en `utils/statsOverview.ts` (`computeOverview`): `exFreq` solo suma si
el ejercicio tiene `setsDone > 0` (misma definición que
`summarizeLogsByScope` de la tarjeta del encabezado). Efectos:

- Tarjeta "Ejercicios" == contador "N ejercicios con historial" del selector de
  Progreso == tamaño de `availableExercises`, en plan e historial.
- Un ejercicio sin series completadas deja de aparecer en el selector de
  Progreso (correcto: no tiene datos que graficar). El orden del selector se
  preserva (subconjunto, sigue ordenado por frecuencia).

Evidencia: TDD RED→GREEN. Tests:

- `counts an exercise only when it has completed sets` (vacío/solo-saltadas excluidos)
- `M3: header card, progress counter and picker draw from one exercises definition`
  (plan e historial)

## M4. APK release de prueba

- Ruta: `C:\Dev\IronLog-React\apk-out\gainslab-release-test.apk`
- Tamaño: 13995273 bytes
- SHA-256: `EF14B84D8D30A498487224C2B19A49BD029A1852D9ACEFC9F758AC5D8C19FA3B`
- Commit fuente: `a242922` (árbol limpio, todo pusheado)
- versionName/versionCode: `4.0.3-kong.6` / `414` (`android/app/build.gradle`)
- Firma: misma keystore de debug de las veces anteriores
  (`$USERPROFILE\.android\debug.keystore`, fuera del repo, no commiteada);
  `adb install -r` actualiza sin desinstalar ni perder datos.
- mapping.txt nuevo en `apk-out/mapping.txt`.
- Instalación: `adb install -r apk-out/gainslab-release-test.apk`
- Notas de build: `npm run build` (precache 62 assets, 7 critical + 55 lazy,
  cache `deec383b93f2`) + `npx cap sync android` + `assembleRelease` con
  `JAVA_HOME=C:\jdk-21` → `BUILD SUCCESSFUL in 12s`. El primer intento falló
  porque `build.gradle` exige las variables `GAINS_LAB_KEYSTORE_PATH`,
  `GAINS_LAB_KEYSTORE_PASSWORD`, `GAINS_LAB_KEY_ALIAS`, `GAINS_LAB_KEY_PASSWORD`
  (nombres verificados en el archivo; ningún valor commiteado ni impreso):
  se apuntaron a la keystore de debug y el build pasó. No es un problema de código.
- `apk-out/` y `*.apk` siguen ignorados; `.env`, `local.properties` y keystores
  fuera del índice (verificado con `git check-ignore` + `git status` limpio).

## Resultado de los 4 comandos (árbol final)

| Comando | Resultado |
|---|---|
| `npm run build` | OK (tsc + vite + precache 62 assets, cache `deec383b93f2`) |
| `npm run test:run` | **327/327** (64 archivos). Primera corrida: 326 + 1 fallo transitorio bajo carga paralela; verde en rerun sin tocar tests. En M2 también hubo flakes (`lazySheets`, `modulePreload`): fail → fail → verde total. No se modificó ningún test con timing, según regla. |
| `npm run lint:a11y` | 0 errores |
| `npx playwright test` | **37/37** (incluye `navLabels`, `heatmapGrid`, `dragOverlayPosition`, `visualPolish`, `uxTweaks`, `reorderDrag`) |

Foco M2–M3 verificado aparte: `statsOverview.test.ts` + `statsScopeControl.test.tsx`
→ 28/28 en 3.56 s.

## Pendiente de verificar en dispositivo real

- `adb devices` vacío al momento del build: la instalación con `adb install -r`
  y la revisión de `logcat` (sin `ClassNotFoundException` ni FATAL de
  `com.gainslab.pro`) quedan pendientes.
- Verificación visual en dispositivo: decimales con coma en es, alcance
  efectivo por pestaña al primer arranque (sin elección guardada), y limpieza
  legacy del caché en un montaje real de Stats (cubierta en unit, pendiente en HW).
- El arrastre de reorden (K1) sigue pendiente de perfilado en dispositivo real.
