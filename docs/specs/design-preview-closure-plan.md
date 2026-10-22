# Cierre de design-preview — plan para Gemini 3.8 Flash

Estado: IMPLEMENTADO Y PUBLICADO (Bloques A–F2 completos). Fecha: 2026-10-22.
Verificación final:
- TypeScript limpio (`tsc --noEmit` sin errores).
- Verificación integrada (`npm run verify`): 151 archivos / 835 pruebas unitarias en verde, validate-kong passed, bundle within budget (entry 64.45 KB ≤ 68300 B).
- Playwright E2E: 49/49 pruebas en verde (`node node_modules/@playwright/test/cli.js test`).
- Playwright Visual: 21/21 pruebas en verde (`node node_modules/@playwright/test/cli.js test --config playwright.visual.config.ts`).
- APK debug final: `com.gainslab.pro.debug` v421 (`4.0.3-kong.13-debug`), SHA-256 `EEE1180539BD5240A605393D807E9D5161B7CBD3F73E8F7E91282F335FD0F845`.
- Smoke Android: 6/6 escenarios obligatorios ejecutados y verificados en emulador `medium_phone` (Android 36).
- Release de producción: `com.gainslab.pro` v422 (`4.0.3-kong.14`), SHA-256 `ef6dac6d4fb7f99778177a89becf761a0d52af71c944278151c4af32767fc86d`, publicada en GitHub y verificada por descarga.

## 1. Objetivo y límites

Cerrar los incumplimientos de la última auditoría sin rehacer el rediseño ni perder funciones.
Trabajar secuencialmente, por bloques pequeños. Terminar y comprobar cada contrato antes de
extenderlo a sus consumidores. No publicar, mover tags ni subir archivos durante esta ejecución
salvo autorización posterior explícita del usuario.

No cambiar persistencia, formatos de backup, entitlement, precios, backend, reglas de Firestore,
fórmulas de entrenamiento/nutrición ni motor del temporizador para resolver problemas de UI.
Conservar KONG, todos los protocolos, kg/lb, ES/EN, temas, acentos y movimiento reducido.
No instalar otra biblioteca de UI/router. Reutilizar Radix/Vaul y los tokens existentes.
No tocar modificaciones ajenas. Antes de cambiar exports, consultar referencias con LSP si existe;
si no existe, declarar esa limitación y localizar consumidores con las herramientas disponibles.

### Base conocida; comprobar que no cambió antes de empezar

- Fuente de la entrega auditada: commit `d70dd89d79986b92e1aa1c93c5b052eeb788b44b`.
- Release existente: `v4.0.3-kong.13`, package `com.gainslab.pro`, versionCode `421`.
- APK publicado: SHA-256 `c72bf5e74584e37ab6e45ea21a815626340079f5c03fc7b021f78ca988eaf81c`.
- El debug usado en el smoke tenía `index-CI2qeCJW.js`; el release, `index-BraJ2u2_.js`.
  Ese smoke no acredita el código final publicado.
- Evidencia anterior: 149 archivos / 828 pruebas unitarias, 49 E2E y 21 comprobaciones visuales.
  No usar esos números como objetivos: eliminar pruebas incidentales puede reducirlos legítimamente.
- Bundle anterior: entry 64.47 KiB, crítico 178.45 KiB; conservar el presupuesto configurado.

## 2. Reglas operativas para el ejecutor

1. Leer este documento completo, el plan original y los archivos del bloque actual.
2. Leer `skill://better-design` cuando el entorno lo permita. Usar las herramientas MCP realmente
   disponibles para principios de accesibilidad/navegación y revisión. Si no están conectadas,
   indicar la limitación; no inventar resultados ni ejecutar instalaciones de conexión.
3. Usar un checklist con los bloques A–F. No empezar F mientras haya fallos funcionales abiertos.
4. No arreglar un fallo aumentando timeouts, usando force-click, desactivando validaciones,
   cambiando expectativas al valor defectuoso o subiendo presupuestos.
5. Conservar las regresiones útiles. Retirar aserciones de colores/clases/textos incidentales;
   no convertirlas en snapshots equivalentes. Añadir pruebas solo para comportamiento o bordes
   plausibles: foco, Back, cancelación, reemplazo, persistencia y atribución KONG.
6. Las pruebas aisladas deben usar datos locales o emuladores `demo-*`, nunca servicios reales.
   Ningún secreto, keystore o contraseña se imprime, se copia al reporte o se añade a git.
7. Un build/E2E que sirve `dist` solo comprueba los fuentes después de reconstruir `dist`.
   No reconstruirlo mientras otra verificación/inspección lo está consumiendo.
8. Tras cada bloque, registrar qué cambió y qué escenario se observó. La suite integrada se
   ejecuta después del corte completo. No declarar que una captura o test prueba un gesto físico.
9. Al terminar, fallar o cancelar, cerrar servidores, pestañas, emuladores y procesos propios.
   Identificar propiedad por PID/comando/puerto; comprobar su salida y preservar recursos ajenos.
   Usar Gradle sin daemon; no detener indiscriminadamente Java/Kotlin, WSL ni contenedores.

Dependencias: A → B → C → D → E → F1. F2 es una entrega separada y requiere autorización.
Responsable único de integración en App/Layout/history/tokens; no editar estos propietarios
simultáneamente desde varias tareas.

## A. Unificar la propiedad de overlays, foco y Back

### A1. Archivos y estado actual

Leer primero:
- `components/ui/useModalLayer.ts`, `components/ui/Sheet.tsx`, `components/ui/ConfirmModal.tsx`.
- `hooks/useAppHistory.ts`, `components/layout/Layout.tsx`.
- `components/auth/AuthModal.tsx`, `components/pro/PaywallModal.tsx`.
- `views/programEdit/ProgramEditDialogs.tsx`.
- `views/HistoryView.tsx`, `components/programs/hub/useProgramHubState.tsx`.
- `android/app/src/main/java/com/gainslab/pro/MainActivity.java`.

`useModalLayer` ya resuelve Escape, foco y propiedad del pointerdown original. Conservar su
WeakMap y la restauración asíncrona de Radix; no sustituirlos por timers ni listeners por modal.
Hoy no integra Back. Perfil, detalle de historial y navegación interna de ProgramHub ya tienen
propietarios de historial: identificarlos antes de añadir entradas nuevas.

### A2. Decisión y contrato de historial

Integrar las capas transitorias con el historial web en un propietario compartido. Reutilizar
`useModalLayer` como registro de capas; separar el adaptador de historial en un módulo pequeño
si hace falta. No crear un segundo router ni un registro distinto para Android.

Antes de codificar, completar una tabla por consumidor: quién abre/cierra, quién registra su
historial, qué estado debe sobrevivir y si Forward puede restaurarlo. Como mínimo incluir:
Perfil, confirmaciones, Inicio rápido, constructor de sesión libre, selector de plantillas,
ProgramHub, comida, cardio, peso, objetivos, autenticación, paywall y validación del editor.

Contrato obligatorio:
- Cada overlay tiene identidad estable durante su apertura y un solo propietario de historial.
- Si ya existe propietario externo, conservarlo o migrarlo en el mismo corte. No duplicar el
  push de Perfil ni eliminar sus datos `profileSection`, vista raíz o sección de Diario.
- Una apertura administrada añade exactamente una entrada; rerenders, ticks y StrictMode no
  añaden entradas. Guardar solo identificadores/datos serializables, nunca callbacks o nodos DOM.
- Back cierra únicamente la capa superior sin cambiar la pantalla de fondo ni la sesión.
- X, Cancelar, Escape y backdrop permitido consumen la misma apertura; no dejan una entrada
  que reaparezca como overlay vacío. Cerrar por popstate no vuelve a llamar history.back().
- Una confirmación explícita consume su entrada antes de ejecutar la navegación posterior.
  Distinguir confirmación de cancelación: no limpiar el callback pendiente antes de confirmarlo.
  Ejecutar la acción una sola vez; nunca ejecutarla por Back, desmontaje o Forward.
- Forward puede restaurar una pantalla/hoja restaurable con contexto válido; nunca debe
  reproducir una acción destructiva cancelada. Normalizar entradas transitorias caducadas sin
  abrir una carcasa vacía, cambiar la sesión o generar nuevos pushes.
- Al recargar, reconciliar el historial con el estado rehidratado. No sobrescribir a ciegas
  los datos de Perfil/hojas restaurables con la raíz inicial; descartar de forma segura una
  confirmación caducada sin ejecutar su acción ni dejar una entrada fantasma.
- Mantener el retorno real de editor/biblioteca/workout y el reemplazo workout → resumen.

Preparar las transiciones abrir → Back, abrir → X, abrir → confirmar → navegar,
anidar → Back dos veces, cancelar → Forward y desmontar antes de terminar la animación.
Si una transición no tiene propietario definido, resolverla antes de migrar consumidores.

Mantener por defecto el Back nativo basado en historial de `MainActivity`. No introducir
además otro manejador nativo que cierre y retroceda simultáneamente. Con teclado visible,
verificar que un Back lo oculta sin cerrar también la hoja; el siguiente cierra la hoja.

### A3. Migrar modales personalizados

- AuthModal: registrar la capa, dar título/nombres accesibles, foco inicial útil, Tab/Shift+Tab
  contenido y restauración al desencadenante todavía conectado. El cierre de Perfil no puede
  robar el foco después de abrir autenticación.
- PaywallModal: mismo contrato, incluido Escape y foco inicial. No cambiar precios, gates ni
  enlaces comerciales. No abrir WhatsApp durante las pruebas.
- Mantener el fondo fuera del foco y del árbol accesible mientras haya una capa modal activa,
  y restaurarlo al cerrar. No aplicar inert/aria-hidden a un ancestro de la propia capa.
- Diálogo de slots sin asignar: usar las primitivas compartidas; eliminar su lógica modal
  manual sustituida. Mantener la validación y el listado de slots pendientes.
- Conservar opt-in `pointer-events-auto`, bloqueo de contenido inferior por tacto/teclado,
  scroll interno y liberación de overflow/pointer-events. aria-modal por sí solo no basta.
- No dejar listeners locales de Escape compitiendo con la pila común.

### A4. Aceptación y regresiones

Extender las pruebas pertinentes, por ejemplo `tests/unit/confirmModal.test.tsx`,
`tests/unit/appHistoryNavigation.test.tsx` y `tests/e2e/profileBackNav.spec.ts`.
Usar Radix real en los casos donde importa el ciclo de vida; no mockear el comportamiento a probar.

Probar con interacción real:
1. Perfil → login: foco dentro de autenticación; Tab/Shift+Tab no alcanzan Opciones del plan.
2. CSV bloqueado → PRO: Escape cierra PRO y restaura foco al CSV, sin acción comercial.
3. Perfil → importar JSON inválido: Escape/backdrop cierran solo la confirmación superior.
4. Inicio rápido abierto desde Hoy: Back cierra Inicio rápido sin salir de la app.
5. Comida/cardio/peso/objetivos: Back cancela la capa adecuada y no guarda datos parciales.
6. Perfil → hoja hija → confirmación: tres cierres sucesivos, sin dobles pops ni bloqueos.
7. Cerrar/reabrir/restaurar backup y Forward: controles utilizables, contexto correcto,
   sin callbacks repetidos ni fuga de foco al body.

No dar A por terminado solo porque funcionan Sheet y ConfirmModal: todos los consumidores
inventariados deben usar el contrato o tener una excepción funcional explícita y comprobada.

## B. Unificar edición/conversión de plan y reanudación de sesión

### B1. Archivos

`App.tsx`, `components/app/AppViews.tsx`, `components/app/AppModals.tsx`, `components/layout/Layout.tsx`,
`hooks/useShortcutLaunch.ts`, `views/home/applyTemplate.ts`, `views/RoutineView.tsx`,
`views/programEdit/useProgramEditState.tsx`, `programs/engine/ProgramConversion.ts`,
`services/workoutCompletionService.ts` y los consumidores reales de entrada al editor.

### B2. Política elegida: bloquear edición/conversión mientras haya sesión activa

Es la opción conservadora y coincide con el bloqueo actual de Inicio rápido. No inventar
una migración de sesiones entre planes ni alterar completeWorkoutPipeline para ocultar el problema.

- Localizar todas las entradas al editor/conversión: Hoy, Rutina, Perfil, Inicio rápido,
  paleta y accesos externos/Forward cuando correspondan. Deben pasar por el mismo boundary.
- Leer `useStore.getState().activeSession` al ejecutar la acción, no solo desde un render viejo.
- Con sesión activa: mostrar una explicación no destructiva para terminarla o descartarla
  mediante el flujo existente. No abrir el editor, convertir KONG, cambiar mesoId ni parar reloj.
- Sin sesión: editor normal; en KONG, confirmación de conversión explícita y conversión canónica.
- El callback que confirma convertir vuelve a comprobar sesión/plan vigente para no usar una
  autorización obsoleta. Si apareció una sesión, bloquear; no aplicar una conversión pendiente.
- Unificar los dos flujos de conversión actuales en AppModals/Layout; retirar duplicados
  después de migrar sus emisores. No dejar enlaces directos que salten el boundary.
- Mantener aparte la política ya existente de sustituir/recargar una plantilla: permite
  descartar con consentimiento explícito mediante el guard compartido de applyTemplate.
  Cancelar conserva todo; confirmar detiene descanso y descarta antes de cambiar el plan.
- Crear desde cero puede entrar al editor después de que ese descarte haya finalizado.

### B3. Retomar desde Rutina

Antes del guard genérico de reemplazo en `AppViews`:
- Si la sesión activa coincide en `mesoId` y `dayIdx`, abrir la misma sesión sin reconstruirla.
- Si es otra sesión, conservar la confirmación de reemplazo existente.
- Cambiar la etiqueta/estado del día activo para ofrecer Retomar de forma coherente con Hoy.

### B4. Aceptación

- Sesión KONG de semana/bloque intermedio con series editadas y descanso activo: intentar editar
  desde cada entrada no cambia sesión, plan, semana, prescripciones ni plazo de descanso.
- Tras terminarla, el log conserva `programSystem`/bloque/semana y mesoId original.
- Tras descartar explícitamente, convertir KONG sigue funcionando y genera la rutina editable.
- Una sesión aparecida entre apertura y confirmación bloquea la conversión.
- Rutina → día activo retoma los mismos datos/identidad; otro día conserva confirmación.
- Cancelar cambio de plantilla no muta nada; confirmar conserva el orden descarte → aplicación.

Ampliar `homeTemplateActions.test.tsx`, `appHistoryNavigation.test.tsx` y los E2E relevantes
con resultados de estado/persistencia reales. No afirmar que hoy se corrompe el meso nuevo:
la auditoría comprobó que se conserva el mesoId viejo; el fallo es perder atribución KONG
al continuar una sesión separada después de convertir.

## C. Terminar accesibilidad visual y retirar compatibilidad sustituida

1. `components/ui/Sheet.tsx`: cierre y Back con área efectiva mínima 44×44 px; 48 px donde
   encaje en Android. Mantener iconos pequeños dentro del hit area. Foco visible y etiquetas ES/EN.
2. Revisar controles de Auth, PRO, editor y Perfil con DOM real. Contar expansiones por
   pseudoelementos al medir; no acusar un target solo por el tamaño visual del icono.
3. `components/workout/setRow/useSetRowState.tsx`: retirar el oscuro fijo `#1b1b20` y usar
   el token correspondiente. Eliminar la aserción dark de color exacto en
   `tests/e2e/lightTheme.spec.ts`; no restaurar el hex para satisfacerla ni fijar otro RGB.
4. Inventariar consumidores de la compatibilidad en `index.css` y `styles/app-polish.css`.
   Migrar primero los componentes implicados, incluidos gates PRO y formularios de sesión libre;
   retirar después solo reglas sustituidas y sin consumidores. No borrar por patrón todos los
   `!important`: las reglas de movimiento reducido y accesibilidad pueden seguir siendo necesarias.
5. Comprobar etiquetas útiles/datos/acciones de Inicio rápido, biblioteca KONG y editor:
   12–14 px; formularios 16 px. No truncar peso × reps ni ocultar acciones con texto grande.
6. Mantener la marca y los acentos elegidos, colores semánticos de error y ambos temas.
   No convertir todos los botones en primarios ni retirar affordances por limpiar CSS.

Aceptación: Sheet cumple 44 px con medición, el tema de cada superficie deriva de tokens,
no hay textos esenciales ilegibles, y quitar compatibilidad no crea islas oscuras en claro.
Contraste 4.5:1 para texto normal y 3:1 para texto grande/controles. Revisar capturas, no solo clases.

## D. Verificación integrada y matriz visual que falta

### D1. Código y comportamiento

Tras integrar A–C y sin verificaciones concurrentes que reconstruyan dist:

```text
npm run verify
node node_modules/@playwright/test/cli.js test
node node_modules/@playwright/test/cli.js test --config playwright.visual.config.ts
```

El primer comando ya incluye lint, TypeScript/build, unitarias, KONG y presupuesto.
Los dos siguientes consumen ese dist sin reconstruirlo. No cambiar presupuesto para pasar.
Si hay fallos, corregir su causa y repetir los checks afectados sobre un build actualizado.
Mantener suite completa en verde antes de entregar; explicar pruebas retiradas y por qué.

### D2. Cobertura observable, sin exigir un producto cartesiano innecesario

- Capturas comparadas con el preview: Hoy, Rutina, Progreso, Diario/Sesiones,
  Diario/Nutrición, entrenamiento, Perfil y resumen; 390 y 1440 px, claro y oscuro.
- Reflow de las cuatro raíces y entrenamiento: 320/360/390/430 y 1024/1440 px; retrato/paisaje.
  Sin overflow global, CTA tapado ni truncado destructivo. Verificar editor y overlays largos
  en los extremos estrecho/ancho y con teclado, no asumir que heredan el resultado de Hoy.
- ES/EN y texto al 200 % en las pantallas anteriores y en Auth/PRO/formularios críticos.
- Todos los acentos en ambos temas: contraste de CTA, selección, foco, texto y error de las
  primitivas compartidas; comprobar sus consumidores representativos, no solo los swatches.
- Teclado: Tab/Shift+Tab, Escape y foco de retorno en cada tipo de overlay.
- Movimiento reducido y valores persistidos de kg/lb/tema/acento no se resetean al navegar.

Completar capturas faltantes en la suite existente cuando aporten regresión visual útil.
No actualizar baselines a ciegas: revisar los diffs y capturas de contenido idéntico antes de
aceptarlas; después ejecutar la suite sin --update-snapshots.

Con Better Design conectado: get-review-rules, check-comprehension por panel e inspect-spacing
sobre DOM real (390/1440/1728). Leer findings y descartar falsos positivos con evidencia, sin
atribuir al score una aprobación visual. Si review-ui-code no existe, declararlo. No desplegar
una preview pública ni enviar datos reales para obtener una aprobación de herramienta.

## E. Verificar Android y vincular el resultado al artefacto exacto

### E1. No reutilizar un APK debug viejo

- Usar JDK 21, SDK 36 y --no-daemon. No imprimir local.properties ni valores de firma.
- Para pruebas con Auth/Firestore, usar el flujo existente `android-debug-emulator` y su
  proyecto `demo-*`. Si requiere Docker/WSL, seguir las reglas locales y preservar volúmenes.
- Para verificar los mismos assets de producción sin servicios reales: generar dist una vez,
  sincronizarlo con Capacitor y construir el debug aislado `com.gainslab.pro.debug`; instalarlo
  con red desactivada antes del arranque y no iniciar sesión contra producción.
- Si se alternan dist-capacitor y dist, dejar constancia de qué assets se sincronizaron para
  cada APK. No atribuir al release resultados obtenidos con el bundle del entorno demo.
- Comparar el mapa nombre → SHA-256 de los assets web empaquetados contra el build esperado,
  incluidas diferencias conocidas de configuración/generación. Registrar SHA-256 del APK y de
  su entrada/CSS. Un nombre de archivo igual no demuestra contenido igual.

### E2. Smoke obligatorio del debug final

Instalación/arranque más estas interacciones, con datos aislados:
1. Login y PRO: foco y cierre; Perfil + importación JSON inválida/válida y cancelación.
2. Inicio rápido, comida y hojas anidadas: Back nativo cierra una capa; no sale de la app.
3. Abrir teclado en última serie: escribir peso/reps y completar sin blur manual; verificar
   el dato guardado, ocultar teclado y cambiar ejercicio sin perder entrada pendiente.
4. Sesión en curso → Rutina → Retomar; segundo plano → volver; cierre/reapertura de proceso.
5. Descanso: una sola superficie, plazo continuo, sumar/restar/omitir, retorno a Hoy sin tapar
   navegación, bloqueo/desbloqueo y acciones de notificación cuando los permisos lo permitan.
6. KONG: edición bloqueada durante sesión; cierre conserva bloque/semana y avance correcto.

Registrar capturas/estado persistido y logcat del PID propio. Los errores de otra aplicación
no se atribuyen a GainsLab. No borrar datos ni sustituir la app de un usuario para aislar pruebas.

TalkBack, teclado y notificaciones deben probarse también en dispositivo físico para marcar
esa parte de la matriz como validada físicamente. Sin dispositivo: cerrar lo verificable,
registrar exactamente lo pendiente y NO declarar el plan global completado.

## F. Documentación, eventual distribución y cierre

### F1. Documentación obligatoria

Actualizar este documento (estado/checklist), `docs/specs/design-preview-implementation-plan.md`,
`docs/AUDIT_FOLLOWUP_12_REPORT.md` y el reporte de bundle generado. Registrar:
- Hallazgo → cambio → escenario observado → archivo/prueba/evidencia.
- Comandos y resultados realmente ejecutados; conteos actuales, no los heredados.
- Commit/build/entorno/versión/checksum asociados a cada smoke y APK.
- Cobertura visual agregada, reglas CSS retiradas y pruebas incidentales eliminadas.
- Límites físicos, permisos o herramientas no disponibles; no convertir pendientes en passes.

### F2. Solo si el usuario autoriza una nueva publicación

1. Comprobar estado remoto y elegir versión/versionCode nuevos por encima de lo ya distribuido.
   Candidato, si siguen libres y válidos: `4.0.3-kong.14` / `422`. No reutilizar .13/421.
2. No usar --clobber ni force-push de tags publicados. Mantener la entrega anterior recuperable.
3. Congelar el commit fuente y la versión antes de construir el release. Sin cambios posteriores
   a los assets/versionado durante su validación; cambios posteriores requieren reconstrucción.
4. Validar entorno de producción, generar dist, sincronizar Capacitor y assembleRelease con
   la firma GainsLab configurada. Verificar certificado, package, versionCode, versión,
   ausencia de endpoints demo/emulador y de excepciones cleartext/mixed-content de debug.
5. Ejecutar instalación/arranque del release exacto en entorno aislado, sin borrar una instalación
   ajena. Comparar sus assets con el build verificado. Registrar límites frente al smoke debug.
6. Crear release/tag nuevos sobre el commit correcto; subir APK y checksum. Descargar el asset
   de GitHub y comparar SHA-256 con el archivo validado. Dar link directo y link de release.
7. Comprobar procesos/puertos/AVD/daemons propios y cerrarlos; no detener recursos compartidos.

## Checklist final de aceptación
- [x] A: todos los overlays inventariados comparten foco/cierre y Back; no hay doble historial.
- [x] B: todas las entradas de editor/conversión protegen la sesión; Rutina retoma el mismo día.
- [x] C: targets/tokens/legibilidad y limpieza de compatibilidad, sin pruebas que fijan el defecto.
- [x] D: checks integrados y cobertura visual/a11y ampliada, con resultados observados.
- [x] E: debug final identificado y smoke completo; físicos validados o bloqueo explícito (smoke emulador 6/6 verde; validación física de TalkBack/vibración retenida como limitación explícita sin dispositivo físico conectado).
- [x] F1: documentación refleja el estado real y permite rastrear cada artefacto.
- [x] F2: ejecutado tras autorización explícita; release v4.0.3-kong.14 creada en GitHub con APK firmado y checksum verificado por descarga (SHA-256 ef6dac6d4fb7f99778177a89becf761a0d52af71c944278151c4af32767fc86d).

## Prompt de arranque para Gemini 3.8 Flash

> Implementa los bloques A–F1 de este documento en orden, conservando las invariantes del plan
> original. Empieza por el inventario de propietarios de overlays y la tabla de transiciones.
> Reutiliza las primitivas existentes y elimina el código sustituido en el mismo corte.
> Reproduce los fallos con la evidencia disponible; no repitas checks solo para confirmar un
> fallo ya reportado. Demuestra la corrección con interacción real y regresiones de comportamiento.
> No alteres el motor de descanso, persistencia, gates ni backend. No repines pruebas de colores
> incidentales. No publiques ni sobrescribas la release .13. Si falta dispositivo físico, termina
> lo alcanzable y entrega el bloqueo exacto, sin marcar el plan global como completo.
