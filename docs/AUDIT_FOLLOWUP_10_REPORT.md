# Serie S — Reporte de seguimiento 10 (limpieza y mejoras de la PWA)

Rama: `agent/gainslab-audit-fixes-v3`. Tag de retorno: `pre-s-series` (`549e245`, en origin).
Origen: análisis de la PWA tras la serie Q; el dueño pidió aplicar todo y limpiar el repo
(solo PWA + Capacitor; la reescritura KMP queda descartada).
Reglas heredadas de la serie Q: un commit por tarea, push tras cada una, tests de
comportamiento real que fallan sin el cambio, sin dependencias nuevas, sin desplegar nada.

## Commits

| ID | Tarea | Estado |
|----|-------|--------|

## S0 — Preparación

- `git tag pre-s-series && git push origin pre-s-series`. Línea base (tras Q22): build OK,
  `test:run` 652/652, `lint:a11y` limpio, Playwright 43/43, reglas 16/16, integración 12/12.

## S1 — Quitar push / sync / periodicsync muertos del service worker

- `public/sw.js`: eliminados los handlers `push` (nada se suscribía: no hay `pushManager`
  en el cliente; textos en inglés), `sync` y `periodicsync` (solo hacían `postMessage` a
  ventanas abiertas: con la app cerrada no hacían nada y con la app abierta la cola ya se
  vacía en `online`/foco/visibilidad). Se conserva `notificationclick` (lo usan las
  notificaciones web del temporizador, `hooks/useTimer.ts`) sin la acción `dismiss`, que
  solo existía para el push.
- Cliente: borrado `services/backgroundSync.ts` y sus llamadas (`index.tsx`,
  `offlineSyncQueue.ts`) y el listener `FLUSH_SYNC_QUEUE` de `AppContext`.
- Test: `swOffline` carga el `sw.js` real en un `vm` y exige exactamente los handlers
  `activate, fetch, install, message, notificationclick`. Con el `sw.js` anterior falla
  (8 handlers). Se borró `backgroundSync.test.ts` (4 tests del módulo eliminado).
- Evidencia: build OK, `test:run` 649/649 (652 − 4 + 1), `lint:a11y` limpio.

## S2 — Limpieza del repo (solo PWA + Capacitor)

- Eliminada `ironlog-kmp/` (reescritura Kotlin Multiplatform abandonada: 1741 archivos
  versionados, ~139 MB en disco con builds) y `scripts/generate_kotlin_data.ts` (solo
  escribía `StaticData.kt` dentro de `ironlog-kmp/`). Quitadas las entradas KMP de
  `.gitignore` y de la lista de exclusión de `count-lang-ternaries.mjs`.
- Eliminadas imágenes sin referencias que se empaquetaban también en el APK:
  `logonew.png`, `logonew2.png`, `Gainslab-icono.png` (las tres idénticas, md5 igual,
  21,8 KB c/u) y `GainsLab-logo-nombre.png` (74 KB). Búsqueda en código, HTML, CSS,
  manifiesto, scripts y `android/app/src`: 0 referencias.
- Eliminado `metadata.json` (resto de AI Studio, sin referencias).
- 7 documentos de planificación de la raíz → `docs/archive/` (`git mv`, historial
  intacto); índice en `docs/README.md`.
- No se tocaron `utils.ts` / `constants.ts` de la raíz: son reexportaciones usadas por
  15 archivos.
- Evidencia: build OK, `test:run` 649/649, `lint:a11y` limpio (sin cambios de código de la app).

## S3 — Manifiesto en español, atajos, captura ancha y recibir CSV desde "Compartir"

- `public/manifest.json`:
  - Atajos en español: "Iniciar entreno" (`?action=start`), nuevos "Registrar comida"
    (`?action=nutrition`) e "Historial" (`?action=history`); `useShortcutLaunch` abre esas
    vistas y limpia la query.
  - Etiquetas de capturas en español + nueva `screenshot-wide.png` (1280×800,
    `form_factor: wide`, 55 KB) para la ventana de instalación en escritorio. Generada con
    Playwright sobre el dev server con datos sembrados (biblioteca real, sin datos personales).
  - `share_target` (POST multipart, `file` acepta text/csv, .csv, text/plain) y
    `file_handlers` (`.csv` → `/?action=import-csv&source=file`).
- `public/sw.js`: `POST /share-target` → guarda `{name, text}` en el caché
  `gainslab-share-v1` (máx. 10 MB) → `303` a `/?action=import-csv` (con `&error=share` si
  no llegó archivo). `activate` no borra ese caché. Redirecciones con URL absoluta.
- `utils/sharedCsv.ts`: `consumeSharedCsvLaunch` (lee y BORRA el archivo una sola vez,
  limpia la query para que recargar no reimporte) y `subscribeFileHandlerLaunches`
  (`launchQueue`, Chromium de escritorio).
- `components/profile/useCsvImportFlow.ts`: el flujo de importación de Q12 extraído tal cual
  de `DataSection` (que ahora lo usa); `components/app/SharedCsvImport.tsx` lo reutiliza,
  muestra el mismo `CsvImportSheet`, avisa errores/éxito y tras importar va a Historial.
  App lo carga en `React.lazy` SOLO si la URL de arranque trae `?action=import-csv`
  (entrada 111,37 → 111,32 KB gzip). Textos `csv.sharedError`/`csv.dismiss` es/en.
- Tests: `sharedCsv` (6: consumo único, payload inválido, query limpia, errores,
  launchQueue); `swOffline` +4 (POST real al `sw.js` en vm guarda y redirige 303, error
  sin archivo, `activate` conserva el caché de compartir y purga los viejos, manifiesto ↔
  acciones manejadas). E2E `shareTarget.spec.ts` (preview build, SW real): un formulario
  multipart a `/share-target` abre el importador con el CSV de Hevy, query limpia, caché
  consumido; atajos de Historial/Dieta marcan su pestaña activa.
- Fail-proof: con el `sw.js` previo, 3/4 tests unitarios de S3 y el e2e de compartir
  fallan; sin el cambio de `useShortcutLaunch`, el e2e de atajos falla.
- Evidencia: build OK, `test:run` 659/659, `lint:a11y` limpio, `bundle:report` WITHIN
  BUDGET, Playwright 45/45 (contra preview, sin servidor reutilizado).
- No verificado / alcance: el menú "Compartir" real de Android solo ofrece la PWA
  INSTALADA desde Chrome (el e2e simula el POST que hace el sistema). La app Capacitor no
  usa el manifiesto: recibir CSV en la app nativa requeriría un intent-filter `SEND` en
  Android (no incluido). Observación: en escritorio el layout se estira a todo el ancho.

## S4 — Aviso honesto sobre el temporizador en la web

- Límite real (sin arreglo sin un servidor de push): en la PWA el aviso de fin de descanso
  solo sale si el JS sigue vivo, y Android congela la PWA con la pantalla apagada. La app
  Android no tiene el problema (AlarmManager, Q8/Q9).
- `notifWebCaveat` (es/en) se muestra: (1) en Perfil → Entrenamiento, bajo la fila de
  notificaciones del descanso, solo fuera de la app nativa; (2) en el aviso único que
  ofrece las notificaciones tras el primer descanso.
- Tests: `webTimerCaveat` (2: visible en web, oculto en nativo, sobre el ProfileSheet real)
  y `restNotifPrompt` +1. Sin el cambio, los 2 tests de comportamiento nuevos fallan.
- Evidencia: build OK, `test:run` 662/662, `lint:a11y` limpio.
