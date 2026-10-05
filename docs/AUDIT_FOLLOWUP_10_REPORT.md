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
