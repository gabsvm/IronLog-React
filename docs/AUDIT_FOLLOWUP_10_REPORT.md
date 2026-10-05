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

## S5 — Nutrición, peso, cardio y alimentos en la nube sin recortes

### S5a — Bug del recorte (camino actual, SIN flag)
- `syncService` recortaba con `.slice(-N)` (se queda con los ÚLTIMOS N). `nutritionLogs`
  se agrega al final (bien), pero `bodyLogs`, `cardioSessions` y `customFoods` se agregan
  al PRINCIPIO (`NutriView`, `AddMealModal`): pasado el tope (100/60/100) la nube recibía
  los MÁS VIEJOS y dejaban de sincronizarse los pesajes, cardios y alimentos nuevos.
- `services/syncCaps.ts`: `keepNewest` conserva los N más recientes por fecha
  (`date`/`timestamp`/`createdAt`) manteniendo el orden original. Para nutrición el resultado
  es idéntico a `slice(-60)` (test de oro); arrays bajo el tope, misma referencia.

### S5b — Colecciones por elemento detrás de `VITE_CLOUD_LOGS_V2`
- `services/cloudCollectionSync.ts`: el motor de Q21 extraído y parametrizado por una
  especificación de colección (campo id, claves permitidas, sello, orden, marca de migración,
  fuente legada). `cloudLogsV2.ts` quedó como capa fina con `LOGS_SPEC`; sus 50 tests y los
  12 de borrado de cuenta pasan SIN cambios (refactor sin cambio de comportamiento).
- `services/cloudSectionsV2.ts`: specs para `nutritionLogs` (un doc por DÍA, id = fecha),
  `bodyLogs`, `cardioSessions`, `customFoods`; orden de salida = el de la app. Fuente legada
  = arrays recortados de `users/{uid}`; el dispositivo aporta su historial completo. Marca
  por colección: `users/{uid}.collectionsFormat.<sección> = 2` (merge anidado).
- `cloudLogsIndex.ts`: `createCloudIndexStore(prefix)` (claves de logs idénticas a Q21) +
  `cloudSectionIndex(colección)`. Ids con `/` se codifican solo en la ruta del documento.
- `syncService`: con flag ON sube/baja las 4 colecciones (bajada en paralelo con logs) y
  `adoptCloudSections` (AppContext la llama donde aplica datos de la nube). Los arrays
  recortados del documento principal se siguen escribiendo (compatibilidad con builds sin flag).
- Reglas: `collectionsFormat` (map) permitido; `match` para las 4 colecciones, solo dueño,
  `keys().hasOnly(...)`, `updatedAt is number`, lápidas `deleted == true`, tipos básicos.
- Borrado de cuenta (flag ON): vacía `logs`, `nutritionLogs`, `bodyLogs`, `cardioSessions`,
  `customFoods` (lista única `V2_COLLECTIONS`) antes de `data/history` y `users/{uid}`.
- Tests: `cloudSectionsV2` unit 11 (topes nuevo vs viejo, oro de nutrición, specs: fecha
  como id y lápida con fecha, orden por sección, ids con `/`, migración de 200 días con nube
  recortada a 60 → otro dispositivo recibe 200, incremental, marcas por colección, paridad
  claves cliente↔reglas, `V2_COLLECTIONS` ↔ reglas). `accountDeletion`: la aserción de
  orden se amplió a las 5 colecciones (cambio de comportamiento buscado). Reglas +2 (18/18).
  Integración +3 (15/15): flag ON ida y vuelta completa (80/130/70/110) con el documento
  principal recortado a los más nuevos; flag OFF de oro (sin colecciones, topes con lo más
  nuevo); borrado de cuenta vacía las 4 colecciones.
- Fail-proof: sin el cambio de `syncService`, los 2 tests de integración de sincronización
  fallan; el test unitario del tope muestra que `slice(-100)` perdía el pesaje de hoy.
- Evidencia: build OK, `test:run` 673/673, `lint:a11y` limpio, `test:rules` 18/18,
  `test:integration` 15/15, Playwright 45/45, entrada 111,32 → 112,23 KB gzip (+0,8 %,
  dentro del presupuesto; las specs y el motor van en chunks lazy).
- Limitación documentada: la nutrición se resuelve por DÍA (si dos dispositivos editan el
  mismo día a la vez, gana la última escritura de ese día; antes ganaba la del array entero).
- No verificado: con datos reales (reglas no desplegadas, flag apagado).

## S6 — Partir los 4 archivos grandes (sin cambios de comportamiento)

| Antes | Bytes | Después (máx. por archivo) |
|-------|------:|----------------------------|
| `views/StatsViewImpl.tsx` | 53 503 | orquestador 2,4 KB + `views/stats/` (hook `useStatsData` 17,4 KB, 5 bloques de render, helpers, widgets, `exerciseInsight`) |
| `context/AppContext.tsx` | 48 951 | 19,1 KB + `context/app/` (`appContexts` + 5 hooks: defaults, bootstrap, descarga inicial, subidas, tema/wake-lock; máx. 15,4 KB) |
| `views/WorkoutViewImpl.tsx` | 47 029 | 7,3 KB + `views/workout/` (hook 17,6 KB, cabecera+lista, hojas de tipo de serie y de finalizar, constantes, RestTimerControl) |
| `views/HomeViewImpl.tsx` | 43 051 | 8,1 KB + `views/home/` (hook 15,2 KB, estado vacío, cabecera+selector, tarjeta principal, modal de ajustes) |

- Método mecánico (scripts de un solo uso, no versionados): el código se MUEVE literal;
  cada vista queda como orquestador que llama a un hook `use…State/Data` (mismo orden de
  hooks) y renderiza un componente por bloque, que recibe el resultado del hook y
  desestructura solo lo que usa. Los bloques que usaban `activeSession`/`activeMeso` repiten
  el mismo guard del padre (que solo los renderiza con ese valor presente). Imports
  re-derivados y podados por uso; rutas de `import()` dinámicos re-basadas.
- AppContext: los hooks extraídos reciben interfaces TIPADAS generadas con el type checker
  de TypeScript (sin `any`); contextos, tipos y constantes en `context/app/appContexts.ts`;
  los hooks consumidores (`useApp`, etc.) siguen en `AppContext.tsx` (los tests hacen
  `vi.spyOn` sobre ese módulo). Las listas de dependencias se movieron tal cual: eslint
  ahora pide setters/refs (estables) y `withDirtyTrackingSuppressed` (se recrea por render y
  el original lo omitía a propósito); en vez de cambiar dependencias (lo que podría
  re-ejecutar efectos) se anotó cada línea con `eslint-disable-next-line` y el motivo.
- Exportaciones públicas intactas (StatsViewImpl reexporta `getVolumeZone`, widgets y
  tipos; AppContext reexporta los tipos de contexto).
- Criterio (como Q18): ningún archivo resultante de estos 4 pasa de 20 KB; TODOS los tests
  pasan SIN cambiar ningún test (`git diff -- tests` vacío en S6); entrada +1,5 % (≤ 2 %).
- Evidencia: `tsc` limpio, build OK, `test:run` 673/673, `lint:a11y` limpio, eslint del
  proyecto con los mismos 4 errores preexistentes que antes de S6 (3 en `trackDirtySection`
  de AppContext, 1 en `useStatsWorker`), `bundle:report` WITHIN BUDGET (entrada 112,23 →
  113,94 KB gzip), Playwright 45/45.
- Fuera de alcance (no estaban en la lista): `ExercisesView` 36 KB, `ProgramEditView` 27 KB,
  `NutriView` 20,5 KB siguen grandes; candidatos para la misma técnica.

## S8 — i18n: cero ramas de idioma inline (194 → 0, y las que el contador no veía)

- El contador de Q19 solo miraba `lang === 'es'` (194). Había además 58 `lang === 'en'`,
  el alias `isEs` (14 en la pantalla de error de `index.tsx`) y 6 helpers locales
  `const l = (en, es) => …` con ~110 llamadas: texto bilingüe inline que no se contaba.
- `scripts/count-lang-ternaries.mjs`: ahora cuenta `'es'`/`'en'`, `===`/`!==` y `isEs`;
  `tests/i18n-baseline.json` = **0**. Test nuevo del contador sobre un directorio de
  ejemplo (5 variantes detectadas, `pickLang` y `tests/` ignorados).
- Migración (codemods de un solo uso, verificados con `tsc` y la suite):
  - pares de strings → `TRANSLATIONS[lang].copy.<archivo>.<clave>` (bloque nuevo `copy`,
    34 espacios por archivo, 312 claves, mismas claves en es y en);
  - plantillas con `${}` → claves con `{marcadores}` + `formatMessage(...)`;
  - helpers `l(en, es)` → claves; los helpers se eliminaron;
  - datos bilingües (`x.name.es : x.name.en`, locales `es-AR`/`es-ES`, textos KONG en
    español con fallback al nombre del programa) → `pickLang(lang, …)` / `otherLang`.
  - pantalla de error (`index.tsx`): `pickLang(lang, TRANSLATIONS).copy.crashScreen`.
- `utils/i18n.ts`: `pickLang` (fallback inglés, como las ternarias), `otherLang`,
  `formatMessage`.
- Evidencia: `tsc` limpio, build OK, `test:run` 674/674 (paridad es/en y render en ambos
  idiomas verdes), `lint:a11y` limpio, eslint con los mismos 4 errores preexistentes,
  Playwright 45/45 (muchos e2e verifican textos en español).
- Efecto en bundle: entrada 113,94 → 121,53 KB gzip (dentro del presupuesto 123,12):
  textos que vivían en chunks lazy pasaron a TRANSLATIONS, que hoy viaja completo (es+en)
  en la entrada. S7 lo resuelve cargando solo el idioma activo.
