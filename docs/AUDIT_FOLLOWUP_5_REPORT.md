# AUDIT FOLLOW-UP 5 — K1 a K10 (reorder, UI/UX, APK release)

- Rama: `agent/gainslab-audit-fixes-v3` (sin ramas nuevas).
- Rango: `ed79686` (K1) … `05a421a` (K9). El APK K10 se construyó sobre `05a421a` con árbol limpio.
- Fecha: 2026-10-02.

## K1 — Temblor al reordenar (`ed79686`)

- Causa: `transition-all` en la fila peleaba con el `transform` que dnd-kit actualiza por frame;
  el Sheet (vaul) competía con el gesto vertical; `scale-[1.02]` inefectivo (el style inline
  pisa el transform).
- Cambios (`components/workout/ReorderExercisesSheet.tsx`, `SortableExerciseCard*.tsx`,
  `WorkoutSortableList.tsx`): sin `transition-all` en filas activas, `data-vaul-no-drag` en la
  lista, `DragOverlay` para el elemento arrastrado (original como placeholder `opacity-30`),
  `will-change: transform`, escala dentro del transform vía `CSS.Transform.toString`.
- Evidencia: `tests/unit/reorderDrag.test.tsx` (estilo computado `transition-property != all`
  durante drag simulado) y `tests/e2e/reorderDrag.spec.ts` (el Sheet no se mueve con
  mouse.down + 120 px; reorder por teclado persiste en el store). El e2e falla sin el fix
  (hoja inestable en el paso 1).
- No verificado: perfilado del arrastre en dispositivo real (Xiaomi `96165d8a` con MIUI sin
  inyección de input y equipo bloqueado; queda pendiente).

## K2 — Dona de intensidad negra (`7ab5778`)

- Causa: `backgroundColor: ['rgb(var(--primary-500))', …]` no resuelve variables CSS en el
  canvas de Chart.js.
- Cambios: nuevo `utils/chartColors.ts` (resuelve `var(--…)` formato "R G B" con
  `getComputedStyle`, fallback fijo); aplicado a la dona y al mismo patrón en `ProgressChart`,
  `SymmetryRadar` y demás gráficos. Leyenda bajo la dona (tipo de serie + cantidad) con
  `t.types`.
- Evidencia: `tests/unit/chartColors.test.ts` (variable definida/ausente/fallback) y test de
  componente (ningún `backgroundColor` contiene `"var("`).

## K3 — "T" literal en PRs (`5a2f53e`)

- Cambio: letra "T" reemplazada por `<Icon name="Trophy">` (existe en el mapa de
  `components/ui/Icon.tsx`).
- Evidencia: `tests/unit/prTrophy.test.tsx` (renderiza el ícono, no el texto "T").

## K4 — Idiomas mezclados y acentos (`40e1340`)

- Cambios: `resolveMuscleLabel` (enum `MuscleGroup` → `TRANSLATIONS[lang].muscle`, texto
  propio tal cual) en tarjeta de ejercicio y `ReorderExercisesSheet`; nuevas claves
  `statsTitle/statsLevels/planTypes/progressEmptyTitle/Body/adminPanel/manageTemplates/
  creditsTitle/nhRule`; acentos (`Máquinas`, `Músculos`, `Óptimo`, `Isométricos`, …).
- Evidencia: `tests/unit/spanishUi.test.tsx` (render es sin enums crudos ni cadenas inglesas).
- Residual corregido en K7: el label "Stats" del nav inferior (`Layout.tsx`) había quedado
  hardcodeado; ahora usa `t.statsTitle`. Se actualizaron 5 specs e2e al localizador
  `/Stats|Estadísticas/`.

## K5 — Datos inconsistentes (`cfd01ae`)

- Metas: Cuerpo muestra primero "Tu meta" (misma fuente que Hoy) y debajo "Recomendado para
  tu peso" (calculados) — `views/nutri/BodyTab.tsx`.
- Sesiones: `filterLogsByScope`/`countSessionsByScope` únicos (las saltadas nunca cuentan);
  se unificó la definición entre hoja "Tú", Stats, `statsCache` y `useStatsWorker`.
- Alcance: selector "Este plan / Todo el historial" (defecto: historial) en Stats > Progreso
  que gobierna gráfico, PRs y pill de sesiones; caché `statsCache` coherente (clave `v3`).
- Evidencia: `tests/unit/statsScope.test.ts` (conteo con varios mesociclos y saltadas),
  `tests/unit/bodyTargets.test.tsx`.
- Nota: claves `v2` huérfanas del caché viejo quedan sin limpiar (sin efecto funcional).

## K6 — Empty states Dieta > Historial (`1c0a5aa`)

- Cambio: `HistoryTab` muestra estado vacío (ícono `BarChart3` + texto + botón a "Hoy") cuando
  no hay `nutritionLogs`; registrado `BarChart3` en `ICON_MAP`.
- Evidencia: `tests/unit/nutriHistoryEmpty.test.tsx` (vacío sin logs, barras con ≥1 registro).

## K7 — Pulidos visuales (`b6642c8`)

- Header fantasma: gradiente de `.app-topbar` (`Layout.tsx`) con piso 0.92
  (`via/0.94 → to/0.92`); en `[data-effects='reduced']` fondo sólido (`index.css`). Es el
  único header translúcido compartido (Workout/Stats no tienen sticky propio).
- Banda Dieta: raíz de `NutriView` `bg-black` → `surface-app`, y `.dark body` en `index.html`
  `#09090b` → `#050506` (el crítico inline con especificidad `.dark body` ganaba al `body`
  de `index.css`; eran 3 negros distintos).
- Segmentado: selección de "Píldora Compacta / Panel Completo" con relleno lima
  (`bg-primary-500 text-black`) como el resto de pestañas.
- Toggles: perillas del Perfil `zinc-950/zinc-400` → blancas como las de Ajustes.
- Etiquetas: `keepScreen/showRIR/programEditor` a minúsculas iniciales en es y en
  (Perfil ya estaba así; se unificó Ajustes).
- Evidencia: `tests/e2e/visualPolish.spec.ts` (5 tests con `getComputedStyle`: alfa ≥ 0.92,
  sólido en reduced, lima + etiquetas, perillas blancas, fondo dieta == body en las 3
  sub-pestañas). 5/5 fallan sin el fix (stash) y pasan con él.

## K8 — Ajustes UX (`f257d88`)

- Volumen: nuevo `VolumeMuscleList` exportado filtra `CARDIO` solo en render; `maxVal` y
  caché intactos (cálculos sin cambios).
- Dieta: sub-pestaña "Historial" → `TRANSLATIONS.dietTrends` ("Tendencias"/"Trends"); id
  interno `history` sin cambios.
- Saltar: `NextSessionCard` y tarjeta del día (`HomeViewImpl`) con
  `aria-label` + `title` = `t.skipSession` ("Saltar sesión"/"Skip session"); antes uno
  tenía solo `title` y el otro un `aria-label` hardcodeado en inglés.
- Pesaje: aviso suave con `TRANSLATIONS.staleWeighIn` ("Hace {days} días…") junto a
  "Registrar" si el último pesaje supera 14 días.
- Evidencia: `tests/unit/uxTweaks.test.tsx` (8 tests: filtro Cardio es/en + conteos, nombre
  accesible es/en, aviso 20/30 días, silencio con pesaje reciente/ausente) y
  `tests/e2e/uxTweaks.spec.ts` (Tendencias en la barra de Dieta; skip nombrado tras el flujo
  real de onboarding hasta `#tut-up-next`). Sin el fix: unit 7/8 fallan (el 8.º es la
  aserción negativa, que pasa por naturaleza) y e2e 2/2 fallan; con el fix todo pasa.

## K9 — Barra de estado en workout (`05a421a`, sin cambios de código)

- Investigación: cero referencias a `StatusBar/SystemUi/WindowInsets/immersive/fullscreen`
  en todo `App/views/components/hooks/utils/context/lib` y `android/app/src`; sin plugin
  `@capacitor/status-bar`; manifest y `styles.xml` sin flags fullscreen; "mantener pantalla
  encendida" es `navigator.wakeLock` web (no afecta la UI del sistema); `SystemBars` solo
  inyecta insets CSS. Todas las vistas comparten la única `MainActivity`.
- Evidencia en dispositivo (`96165d8a`, Android 11): la ventana de la app muestra
  `fl=…DRAWS_SYSTEM_BAR_BACKGROUNDS` sin `FLAG_FULLSCREEN`, `vsysui=LAYOUT_STABLE`,
  `mSystemUiVisibility=0x100` (solo `LAYOUT_STABLE`, sin `FULLSCREEN/HIDE_NAVIGATION/
  IMMERSIVE`) y `pfl=FORCE_DRAW_STATUS_BAR_BACKGROUND`; `policy_control` en defecto
  (`immersive.preconfirms=*`). La app no puede ocultar los iconos de estado.
- Conclusión: la zona superior vacía de esa captura es un artefacto de captura, no un bug
  de la vista workout. No se cambió código.

## K10 — APK release de prueba

- Commit fuente: `05a421a` (árbol limpio), `npm run build && npx cap sync android`,
  `assembleRelease` con `JAVA_HOME=C:\jdk-21`, R8 (`minifyEnabled`, `shrinkResources`,
  `proguard-android-optimize.txt` + reglas Capacitor/nativo/`@JavascriptInterface`).
- Firma: MISMA keystore de debug anterior (`%USERPROFILE%\.android\debug.keystore`, alias
  `androiddebugkey`); cert SHA-256 `a4a85218b5125977bf7ccf408c67d01ea2682ea2916c3dbbf776289d7d853512`
  idéntico al de J3 → `adb install -r` actualiza sin desinstalar.
- Artefactos (ignorados por git, NO commiteados):
  - `C:\Dev\IronLog-React\apk-out\gainslab-release-test.apk` — 13994417 B —
    SHA-256 `4E85BAB9D3AE8189DB89C33402D749EB3EAFFD4169A8CA8490E26D59F23D9A8E`
  - `C:\Dev\IronLog-React\apk-out\mapping.txt` — 5479020 B —
    SHA-256 `BCBE1E299DEB758F8A601CC4704F2D5685B843523D99A2599B3F55C18858A1F2`
    (idéntico al de J3: sin cambios nativos desde entonces, solo web).
- Versiones (`aapt dump badging`): `versionCode 414`, `versionName 4.0.3-kong.6`,
  `compileSdk 36 / targetSdk 36 / minSdk 24`.
- Instalación: `adb install -r apk-out/gainslab-release-test.apk` → `Success` en `96165d8a`.
- Logcat tras lanzar: sin `ClassNotFoundException`, `NoSuchMethodException`,
  `Resources$NotFoundException` ni `FATAL` de `com.gainslab.pro`; `AndroidRuntime:E` vacío.
- Instalación: `adb install -r C:\Dev\IronLog-React\apk-out\gainslab-release-test.apk`

## Resultado de los 4 comandos (rama final)

- `npm run build`: OK (precache 62 assets, caché `9c2535843718`).
- `npm run test:run`: 59 archivos / 284 tests, todo verde.
- `npm run lint:a11y`: 0 errores.
- `npx playwright test` (config por defecto, puerto 5173 ya libre): 33/33 verde,
  incluyendo `reorderDrag`, `visualPolish` (5) y `uxTweaks` (2).

## Pendiente de verificar en dispositivo real

- K1: arrastre con profiling de frames en un equipo desbloqueado con inyección de input
  (el e2e cubre estabilidad del Sheet y persistencia; el "temblor" visual solo se confirma
  al tacto).
- K7: apreciación visual del header/banda/segmentados en pantalla real (cubierto por
  estilos computados, no por captura).
- K9: si vuelve a aparecer una captura sin iconos de estado, conservar la imagen original
  con metadatos para determinar dónde se generó el artefacto.
- Todo lo demás de K2–K6/K8 está verificado con tests que ejecutan comportamiento real.
