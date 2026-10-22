# Muse Spark 1.3 — correcciones, verificación y entrega de APK release

Estado: PLAN PENDIENTE DE EJECUCIÓN. Fecha: 2026-10-22.
Ejecutor de implementación: Muse Spark 1.3. Ejecutor físico posterior: Gemini 3.8, en la PC del trabajo del propietario.
Este documento no acredita ninguna corrección ni prueba futura.

## 1. Encargo y frontera de aceptación

Corregir todos los incumplimientos descritos abajo, completar la verificación alcanzable y publicar una NUEVA APK release firmada en GitHub para que Gemini la descargue y pruebe en un dispositivo físico. La solicitud del propietario autoriza esa nueva publicación, no sobrescribir releases anteriores ni borrar datos del teléfono.

Leer completos antes de editar:
- [Plan original](design-preview-implementation-plan.md): invariantes, fases 0–8 y matriz final.
- [Plan de cierre previo](design-preview-closure-plan.md): contratos A–F, no confiar en sus casillas marcadas.
- [Protocolo de Gemini](gemini-3.8-device-release-smoke.md): casos físicos y formato de entrega.
- Reglas locales del repositorio y del entorno de ejecución.

Dos hitos distintos:
1. **Muse: CORRECCIONES VERIFICADAS EN ENTORNO DISPONIBLE; RELEASE CANDIDATA PUBLICADA; PRUEBAS FÍSICAS PENDIENTES.** Entrega binario real, código subido, hashes, enlaces y limitaciones.
2. **Gemini: ACEPTACIÓN FÍSICA APROBADA / FALLIDA / BLOQUEADA / PARCIAL.** Solo después de ejecutar el protocolo sobre la descarga exacta. La publicación por sí sola no cierra el plan global.

No reducir alcance ni convertir ausencias de herramientas/permisos en aprobaciones. Si falta firma o acceso a GitHub, terminar las correcciones/verificaciones alcanzables y declarar el requisito exacto que impide publicar; no entregar una APK debug como release.

## 2. Base auditada y hechos que no se deben confundir

Base de referencia: release `v4.0.3-kong.14`, commit `d7d31a1a237c17c3cfe32f12caddb335d02ef616`, package `com.gainslab.pro`, versionCode `422`.
APK SHA-256: `ef6dac6d4fb7f99778177a89becf761a0d52af71c944278151c4af32767fc86d`.
Certificado GainsLab SHA-256: `4C:69:56:9B:3A:45:1D:97:24:B1:D3:17:25:76:09:0F:0B:68:73:8B:E5:8B:B6:C6:A4:A1:87:D7:D5:AE:18:3B`.

En la auditoría se descargó la .14 y se compararon los 117 archivos web por SHA-256 con el debug registrado: idénticos. No diagnosticar mezcla de bundles ni chunks huérfanos solo por ver dos archivos `index-*.js`.
No restaurar `#1b1b20` ni afirmar contraste blanco sobre claro sin medir estilos computados: `index.css` todavía reasigna `.text-white` en modo claro.
Los conteos históricos de suites y el booleano `allPassed` del smoke anterior NO son objetivos de aceptación.

## 3. Límites y disciplina

- Mantener datos/IDs/claves de almacenamiento, sincronización, JSON/CSV, gates/precios, fórmulas, KONG y protocolos. No cambiar backend, reglas Firebase ni motor del descanso para ocultar fallos de UI.
- Conservar kg/lb, ES/EN, claro/oscuro/Auto, todos los acentos y movimiento reducido.
- Reutilizar React, Radix/Vaul, tokens y navegación existentes. No añadir router/biblioteca decorativa ni otra app/demo.
- Revisar referencias con LSP si está configurado; si no, declarar limitación y localizar consumidores con herramientas disponibles. Un único integrador de App/Layout/history.
- Leer `skill://better-design`; usar MCP solo si realmente está disponible. Si no está conectado, indicar limitación; no instalarlo ni inventar revisiones. Setup oficial: https://github.com/marvkr/better-design#setup.
- No force-click, sleeps para ocultar carreras, aumento de timeouts/presupuestos ni expectativas fijadas al defecto. Datos de fixture permitidos para preparar el estado; no reemplazar por escritura directa la acción que se está probando.
- Pruebas aisladas sin servicios reales: fixtures, Firebase `demo-*` o red desactivada. Nunca imprimir secretos, credenciales o `local.properties`; no publicar keystore.
- Preservar cambios ajenos. No hacer pull destructivo, reset, clean, rebase ni mover tags publicados. Revisar estado remoto antes de elegir nueva versión.

## 4. Bloques de implementación (orden obligatorio)

### M0 — inventario y evidencia antes del corte

Registrar commit actual, cambios preexistentes, versión local y último versionCode distribuido. Leer scripts/configuración real; comandos de este plan son para PowerShell, adaptar al shell sin mezclar sintaxis.

Completar tabla de overlays: consumidor, apertura/cierre, propietario único de historial, identidad durante apertura, estado serializable, restaurabilidad Forward/reload, acción confirmada y retorno de foco. Incluir TODOS: Perfil, confirmaciones, Inicio rápido, sesión libre, plantillas, ProgramHub/detalle, comida/alimentos, cardio, peso/medidas, objetivos, Auth, PRO, validación/editor, guías, paleta, celebración PR, finalización y tipo de serie. Toda excepción debe justificar y demostrar el mismo comportamiento observable, no solo desactivar historial.

Los fallos ya reproducidos no necesitan otra ejecución solo para reconfirmarlos; usar esa evidencia y demostrar el resultado corregido. Añadir regresiones de transiciones inciertas y bordes reales, no tests de wiring ni copias del algoritmo.

### M1 — confirmaciones reutilizables y acciones exactamente una vez

Archivos principales: `components/ui/ConfirmModal.tsx`, `components/ui/useModalLayer.ts` y todos los consumidores persistentes.

Defecto: `confirmedRef` se mantiene true entre aperturas sin desmontaje. Evidencia: editor 15 slots → primer Quitar 14 → segundo Quitar sigue 14 y diálogo abierto.

Contrato:
- Bloquear doble confirmación SOLO durante la misma operación/apertura; reiniciar de forma segura para la siguiente apertura, incluso sin desmontar componente.
- Cancelar, Back, Escape, Forward y desmontaje nunca ejecutan onConfirm.
- Confirmar consume la entrada correcta antes de navegar; no invocar acciones desde un pop ajeno o por temporizador que compita con navegación pendiente.
- Si el consumidor permite reintentar una acción fallida, no dejarlo permanentemente inoperativo. No añadir una política global nueva de reintentos.
- No bifurcar comportamiento por userAgent `jsdom` para hacer pasar unitarias; probar el contrato asíncrono real con navegador cuando corresponda.

Revisar al menos Quitar slots, saltar días, borrar ejercicios, alimentos guardados, borrar/resetear plantillas, importación y sync. Regresión: confirmar → cerrar → reabrir → confirmar otra entidad, doble toque rápido, cancelar y volver, StrictMode. Verificar mutación exacta y contexto de la entidad, no solo desaparición del diálogo.

### M2 — historial, Back/Forward/reload y aislamiento modal

Archivos: `hooks/useAppHistory.ts`, `components/ui/useModalLayer.ts`, `Sheet.tsx`, `ConfirmModal.tsx`, `components/layout/Layout.tsx`, Auth/PRO y todos los overlays inventariados. Mantener `MainActivity` como puente de Back web salvo necesidad demostrada; no añadir dos manejadores que retrocedan a la vez.

Corregir:
1. Reload de Perfil: `useAppHistory` no debe reemplazar ciegamente por `{view:'home'}`. Reconciliar vista, `profileSection`, Diario, rutas hijas y estado rehidratado. Manejar confirmaciones caducadas sin ejecutar acción.
2. Inicio rápido Back→Forward: entrada `_modalKey` sin diálogos debe restaurarse con contexto válido o normalizarse sin entrada zombi ni nuevo push. Igual contrato para los demás transitorios.
3. `WorkoutFinishSheet` y `WorkoutSetTypeSheet`: `manageHistory={false}` no es solución si Back se lleva también la pantalla. Back cancela solo la capa superior, preservando workout y sesión.
4. Auth y PRO: portales deben sacar el fondo del árbol accesible y del foco mientras están activos; no poner inert/aria-hidden sobre un ancestro de la propia capa. Restaurar atributos y estado anterior al cerrar, incluso con capas anidadas/desmontaje fuera de orden.
5. Extender el contrato a modales personalizados sin registro; retirar listeners Escape competidores y lógica manual sustituida en el mismo corte.

Invariantes: una entrada por apertura, identidad estable, ningún push por tick/rerender/StrictMode; cierre LIFO por X/Cancelar/Escape/backdrop/Back, sin dobles pops; confirmación una vez; no pérdida de pantalla padre, foco ni sesión. Con IME: primer Back oculta teclado; siguiente cierra capa. Retorno de foco a disparador conectado o fallback útil, nunca al fondo de otra capa activa.

Pruebas: restaurar Perfil y sección tras reload; QuickStart cerrar→Forward; confirmar→navegar→Back; cancelar destructivo→Forward sin mutación; tres capas sucesivas; cerrar/reabrir durante salida; cerrar capa inferior primero. Usar Radix real. Inspeccionar árbol accesible real tras terminar animaciones, no únicamente `aria-modal` o Tab.

### M3 — boundary de edición, KONG y reanudación

Archivos: `App.tsx`, `components/app/AppViews.tsx`, `AppModals.tsx`, Layout, `hooks/useShortcutLaunch.ts`, `views/home/applyTemplate.ts`, `RoutineView.tsx`, `views/programEdit/useProgramEditState.tsx`, servicio de finalización y consumidores reales.

- Todas las entradas a editar/convertir consultan sesión Y plan vigentes al ejecutar; mismo boundary para Hoy/Rutina/Perfil/Inicio rápido/paleta/accesos externos/Forward.
- Con sesión activa, bloquear edición/conversión de forma no destructiva. No cambiar mesoId/semana/prescripciones ni detener descanso.
- Al confirmar conversión volver a comprobar sesión, identidad y tipo de plan. Rechazar autorización caducada con salida útil.
- Corregir el riesgo estático de cierre obsoleto: crear desde cero hace `setActiveMeso(null)` antes de `onEditProgram`, pero el callback puede seguir viendo el KONG anterior. Debe abrir editor vacío una vez finalizado el descarte consentido; no abrir conversión inválida ni destruir plan al cancelar.
- Retomar mismo mesoId/dayIdx usa la misma sesión/IDs/datos, sin reconstruir ni preguntar reemplazo. Otro día conserva confirmación; cancelar preserva todo. Verificar también que confirmar reemplazo no arrastre el descanso/origen de la sesión vieja.
- Finalizar KONG real conserva mesoId original, programSystem, bloque/semana y avance correcto. No sustituirlo por borrar IDB.

En `tests/unit/programEditProtection.test.tsx`, sustituir pruebas que definen su propio guard/onStartDay y solo prueban esa copia: ejercitar código productivo mediante componente/flujo real. Mantener pruebas válidas de la función de dominio. No mockear el boundary que se pretende verificar.

### M4 — completar accesibilidad, tipografía y migración de tokens

Archivos: `ProgramEditView.tsx`, `programEdit/ProgramEditDays.tsx`, `Sheet.tsx`, `index.css`, `styles/app-polish.css`, Auth/PRO/Perfil, Inicio rápido y paneles freestyle/KONG.

- Atrás y Comenzar del editor: hit area real ≥44×44 px, preferible 48 px Android. Auditoría midió alturas 20/28 px sin expansión. Medir bounds/pseudoelementos y comprobar que no se solapen áreas.
- Formularios de series/reps/selección: 16 px y áreas cómodas; etiquetas/datos/acciones útiles 12–14 px; no truncar carga×reps ni acciones al 200 %.
- Traducir nombres accesibles de cerrar/atrás en Sheet y consumidores; conservar títulos útiles, labels asociados y foco visible.
- Inventariar overrides legacy y sus consumidores. Migrar antes de retirar; no borrar todos los `!important` (movimiento reducido y accesibilidad pueden requerirlos).
- Superficies/textos derivan de tokens, todos los acentos conservan contraste. Medir estilos compuestos: 4.5:1 texto normal, 3:1 texto grande/controles. No fijar otro hex incidental en tests ni introducir una segunda capa de parches.
- Revisar las cuatro raíces, editor, biblioteca, sesiones libres, formularios, Perfil, errores y resumen, no solo Home.

### M5 — verificación integrada y matriz real

Solo después de integrar cambios; no reconstruir dist mientras otro proceso lo consume:

```powershell
npm run verify
node node_modules/@playwright/test/cli.js test
node node_modules/@playwright/test/cli.js test --config playwright.visual.config.ts
```

`verify` incluye lint, a11y, TS/build, unitarias, KONG y bundle. Los comandos Playwright directos consumen dist sin reconstruir. Si hay cambios productivos después, reconstruir y repetir lo afectado. No heredar conteos; registrar salida y fecha.

Completar D2 del cierre anterior:
- Capturas comparadas con referencia para Hoy, Rutina, Progreso, Sesiones, Nutrición, workout, Perfil y resumen a 390 y 1440, claro/oscuro.
- Reflow de raíces/workout a 320/360/390/430/1024/1440, retrato/paisaje; editor y overlays largos en extremos y con viewport reducido por teclado.
- ES/EN, texto 200 %, acentos en ambos temas en consumidores representativos, foco/error/selección/CTA y movimiento reducido; preferencias persisten al navegar.
- No exigir producto cartesiano inútil: registrar exactamente qué caso demuestra cada dimensión y cada superficie; no omitir dimensiones.
- `modalOverlays.test.tsx` debe realmente ejercitar Tab/Shift+Tab, apertura/cierre y retorno de foco si su contrato lo declara. Eliminar pruebas incidentales de textos/clases/hex; no volver a fijarlas.
- Revisar imágenes/diffs antes de aceptar nuevos baselines; correr luego sin `--update-snapshots`.
- Comparar inicio, listas largas, edición continua, timer y filtros con base disponible; si no existe traza histórica, declarar límite. Bundle en presupuesto no prueba fluidez.

Smoke real en entorno disponible: interacción del usuario, sin force, con persistencia observada. Reparar `scripts/smoke-playwright-android.mjs`: granularidad por subcaso, no booleanos que ocultan omisiones; calcular hash del APK realmente usado, no literal; cleanup en finally. No escribir estado para simular completar, descartar, convertir o guardar. Si no hay Android, ejecutar UI web del bundle exacto y marcar límites nativos.

## 5. Nueva release firmada e inmutable

### R0 — versión, commit y prerequisitos

Consultar remoto y tags antes de decidir. Candidato si sigue libre y es mayor que todo lo publicado: `4.0.3-kong.15` / `423`; NO asumirlo reservado. Actualizar `android/app/build.gradle` y referencias activas de versión que realmente correspondan; preservar registros históricos. Package sigue `com.gainslab.pro`.

JDK 21+, SDK 36, Node/npm/dependencias compatibles y firma oficial configurada localmente. No reimprimir rutas privadas/contraseñas. `npm run validate-android-env` debe aprobar con ese JDK. No usar debug.keystore ni desactivar minify/seguridad para conseguir compilar.

Congelar commit fuente con cambios, pruebas y docs antes del build final; subir rama. Cualquier cambio posterior de código/assets/versión invalida el binario y su evidencia: reconstruir. Docs de resultados posteriores pueden ir en commit adicional, sin mover tag ni fingir que ese commit construyó el APK.

### R1 — build productivo (PowerShell)

Ajustar JAVA_HOME solo al JDK realmente localizado, sin fijar una ruta de otra PC. Verificar que `CAPACITOR_WEB_DIR` no apunte a dist-capacitor y que no se usen flags/env de emulador.

```powershell
npm run validate-android-env
npm run build
npx cap sync android
Push-Location android
try {
    .\gradlew.bat --no-daemon -Pkotlin.compiler.execution.strategy=in-process assembleRelease
    if ($LASTEXITCODE -ne 0) { throw 'assembleRelease failed' }
} finally { Pop-Location }
```

Verificar exit code de CADA comando nativo (PowerShell no aborta automáticamente por `$LASTEXITCODE`). No publicar si algún paso falla.
Artefacto esperado: `android/app/build/outputs/apk/release/app-release.apk`.

### R2 — identidad, seguridad, paridad y arranque

Usar herramientas reales del SDK localizado (`apksigner`, `aapt`/`apkanalyzer`):
- Firma verificada; certificado GainsLab coincide con SHA indicado en §2.
- Package, versión/versionCode, min/target SDK correctos; release no debuggable ni testOnly, sin excepciones cleartext/mixed-content de debug.
- Inspeccionar assets realmente empaquetados: configuración productiva prevista, sin endpoints de emulador, proyectos demo activos, flags de testing, server.url remoto ni artefactos de demo. Un substring `demo-` en código SDK no prueba configuración activa.
- Comparar mapa nombre→SHA-256 de TODOS los assets web con el build verificado; justificar diferencias generadas. Registrar entrada/CSS y hash APK. No aceptar solo nombres iguales.
- Instalar/arrancar release exacto en emulador aislado disponible sin sustituir datos ajenos; red apagada antes del arranque si usa configuración producción. Logcat del PID propio y pantalla inicial. Si falta entorno, registrar bloqueo y límites; no inventar smoke.
- Las pruebas físicas quedan a Gemini: TalkBack, teclado IME real, bloqueo/desbloqueo, notificaciones/acciones nativas y recuperación de proceso sobre la descarga exacta, además del resto del protocolo. No usar resultado debug como prueba de firma/optimizaciones/servicios de release.

### R3 — publicación GitHub y paquete de traspaso

Repo: `gabsvm/IronLog-React`. Crear tag NUEVO sobre commit fuente congelado y GitHub **pre-release candidata pendiente de smoke físico**. No `--clobber`, force-push, ni reemplazar .14. No marcarla estable/aprobada antes de Gemini.

Subir como assets:
1. `GainsLab-<version>.apk` (release firmado).
2. `GainsLab-<version>.apk.sha256` (UTF-8/ASCII, hash completo y nombre).
3. `release-verification-<version>.md` con commit/tag, identidad, certificado, hashes, mapa/resumen de paridad, entorno, comandos/resultados reales, fallos/limitaciones y subcasos pendientes.
4. Copia del protocolo Gemini con versión/tag/hash concretos en cabecera y enlace al commit del documento; no dejar placeholders en el traspaso final.

Descargar de GitHub a directorio NUEVO y comparar SHA completo con el APK validado. Confirmar que tag resuelve al commit correcto (target_commitish por sí solo no basta), identidad, tamaño y assets. Entregar URL de release, APK, checksum y protocolo; ruta local APK y commit de rama. Nunca pedir a Gemini reconstruir para probarlo: debe probar esa descarga.

Si surge un fallo después de publicar, conservar candidato y evidencia, publicar corrección en NUEVA versión/versionCode y repetir checks afectados; no cambiar silenciosamente el binario bajo el mismo hash/tag.

## 6. Documentación, limpieza y definición de entrega Muse

Actualizar estado real de `design-preview-implementation-plan.md`, `design-preview-closure-plan.md`, `docs/AUDIT_FOLLOWUP_12_REPORT.md`, changelog y bundle report según convenciones. Distinguir observación histórica de evidencia nueva. Mantener referencia a la auditoría y qué la corrige. No decir «plan cerrado» con físicos pendientes.

Detener solo procesos/puertos/emuladores/daemons/containers propios tras éxito, fallo o cancelación; identificar propiedad, preservar trabajo ajeno y verificar salida. Para WSL/Docker seguir reglas locales y no eliminar volúmenes. Retirar scripts/fixtures temporales y datos de prueba; conservar regresiones útiles y evidencia sanitizada.

Checklist de salida (no marcar hasta observar):
- [ ] M0 inventario completo y todas las invariantes preservadas.
- [ ] M1 segunda confirmación y exactamente una vez demostrados en consumidores reales.
- [ ] M2 Back/Forward/reload/aislamiento accesible completos, sin exclusiones ocultas.
- [ ] M3 guards reales, crear desde KONG y retomar/reemplazar/finalizar correctos.
- [ ] M4 editor/overlays/tokens/idiomas/contraste verificados por DOM y capturas.
- [ ] M5 suites y matriz ampliada observadas, sin force ni pruebas de copias locales.
- [ ] Release nueva firmada, seguridad/paridad verificadas, código/tag subidos.
- [ ] Descarga de GitHub comparada por SHA; links y protocolo concreto entregados.
- [ ] Recursos propios cerrados; límites y pruebas físicas pendientes explícitos.

## 7. Prompt para Muse Spark 1.3

> Lee completos este plan, los dos planes anteriores y el protocolo Gemini enlazado. Implementa M0→M5, verifica el comportamiento real y entrega R0→R3: nueva APK release firmada publicada en GitHub como candidata pendiente de smoke físico, con checksum verificado por descarga y protocolo concreto para Gemini 3.8. No te detengas en compilar ni marques como superadas pruebas no ejecutadas. No sobrescribas releases/tags ni borres datos del usuario. Si hay un bloqueo real, termina todo lo alcanzable y entrega evidencia y el requisito exacto faltante. La aceptación física y el cierre global corresponden al protocolo posterior.
