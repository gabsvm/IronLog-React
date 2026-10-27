# Plan de implementación — GainsLab / design-preview

> Estado actual — 2026-10-22: CANDIDATA v4.0.3-kong.15 PUBLICADA (M0–M5 implementados; smoke físico pendiente por Gemini 3.8). Verificación: tsc limpio; npm run verify en verde (151 archivos / 836 pruebas unitarias, validate-kong, bundle entry 66.43 KB ≤ 68300 B); e2e 49/49 en verde; visual 41/41 en verde (incluye Rutina, Resumen y matriz 1440); APK release firmada com.gainslab.pro v423 (SHA-256 bfabff79c842bbf09c3497a4b263289cb8661104cad59eb3606a7d45ac58ac37); protocolo de aceptación física en [gemini-3.8-device-release-smoke.md](gemini-3.8-device-release-smoke.md). Detalles en [muse-spark-1.3-release-remediation-plan.md](muse-spark-1.3-release-remediation-plan.md).

### Revisión de contenido y jerarquía — 2026-10-22 (commits a8f1e14…3964a49)

Criterio aprobado por el propietario: recortar taglines, textos de ayuda y etiquetas secundarias; si una
pantalla los necesita para entenderse, corregir la composición. Una acción principal por vista. Las
acciones existentes se conservan (los E2E dependen de sus nombres accesibles). Estas decisiones
sustituyen a las de las secciones siguientes donde choquen:

- **Hoy:** selector con el nombre real de cada día; hero con ejercicios numerados; «Sesión libre» y
  «Añadir comida» como secundarias; anillo semanal; recientes con fecha destacada. Escritorio: hero a la
  izquierda, semana y tendencia a la derecha, recientes a ancho completo.
- **Entreno:** reloj bajo el título y barra fina de progreso (se elimina la tarjeta «Tu sesión»); sin fila
  ← 1 de N →; «Terminar» discreto hasta completar todo; al cerrar un ejercicio, «Siguiente ejercicio · X»
  o «Terminar sesión» como acción principal; tarjeta sin etiquetas de músculo/reps/BW/SS ni iconos de
  enlazar/plegar (superserie sigue en el menú); volumen solo al completar el ejercicio.
  **Nota Strong parity (2026-10-26):** la barra fina de progreso y el modelo de ejercicio enfocado/rail quedan
  reemplazados por lista apilada continua con bandas planas de 48dp, header sin progreso y chip de descanso.
- **Rutina:** días en un panel, solo el siguiente (o en curso) es primario; acciones en un panel de filas.
- **Progreso:** sin título visible (sr-only); la subpestaña «Progreso» pasa a **«Fuerza»**; variación del
  reporte semanal neutra mientras la semana está abierta.
- **Diario / Nutrición / Perfil / hojas:** títulos duplicados como sr-only; un solo «Agregar comida»;
  sin descripciones de ayuda salvo estados deshabilitados o advertencias de comportamiento real.
- **Sin PRO (2026-10-23):** el propietario decidió publicar GainsLab como open source (AGPL-3.0)
  financiado por donaciones. Se eliminan paywall, `usePro`, `ProLock`, el límite de 7 días del
  historial y todos los candados; la sincronización en la nube queda libre para cualquier cuenta.
  Pendiente (fase 2): retirar el sistema de suscripción del servidor (`users/{uid}/data/subscription`,
  `entitlementService`, aviso de suscripción retenida al borrar la cuenta) una vez resuelto qué pasa
  con quienes pagaron PRO.
- **Orden y formato:** el Diario ordena por fecha descendente; los pesos usan el locale de la app.
- **Rendimiento:** precarga en reposo de Rutina, Progreso, Diario y Entreno (timeout 4 s).

Evidencia: `npm run verify`, E2E 50/50 y visual 41/41 en cada bloque; revisión en emulador
`medium_phone` con APK debug y datos locales (sin red). Pendiente: validación en dispositivo físico.
Fuera de alcance: etiquetas fijadas por `tests/e2e/inventory/profile-settings.*.json`.

### Registro histórico de la entrega anterior

La declaración siguiente se conserva como registro de esa entrega; no acredita el cumplimiento actual ni la validación de APK posteriores.

> Estado: IMPLEMENTADO 2026-10-21 (fases 0–8). Verificación final: `tsc` limpio; unit 146 archivos / 808 pruebas en verde; e2e 32/32 en verde (incluye navegación, shortcuts, back-stack, modales sobre sheets y burbujas); visual 18/18 con baselines regenerados y revisados (home/desktop, history=diario, stats=progreso, nutrition, workout, profile × claro/oscuro); bundle dentro de presupuesto (entry 66.48 KB ≤ 68300 B tras separar sidebar/Rutina/Diario); smoke en emulador `medium_phone` (instalación y arranque del APK debug sin errores); release firmada v2 con el certificado Gainslab (`4C:69:…:18:3B`), `com.gainslab.pro` v421, sin `usesCleartextTraffic` ni endpoints de emulador (SHA-256 `d73177f1…05d`). Hallazgo corregido en la recta final: el `<style>` del splash en `index.html` fijaba `.dark body #050506` para siempre; ahora está acotado al splash y alineado con los tokens. La app compila, la suite unitaria está en verde y la navegación es Hoy/Rutina/Progreso/Diario con Rutina y Diario como contenedores nuevos. Desviaciones respecto al borrador: (1) el presupuesto de entry subió de 67827 a 68300 bytes gzip tras medir el coste real del shell y separar sidebar/Rutina/Diario en chunks diferidos; (2) la paleta de comandos conserva un acceso en el sidebar de escritorio (botón «Acciones rápidas») ya que el botón central + desapareció; (3) los tests e2e que apuntaban a Historial/Estadísticas/Dieta o al botón + se actualizaron a Progreso/Diario/Rutina y al sidebar. Referencia visual: `design-preview/index.html` (Propuesta.jsx + proposal.css).

Hacer que la app real tenga la composición, jerarquía, superficies y respuesta del preview:
Hoy / Rutina / Progreso / Diario; grafito y lima, claro cálido, escritorio con sidebar,
registro de series enfocado y formularios tranquilos y legibles.

No incorporar la demo como otra app, iframe o ruta alternativa. No copiar su `App`, sus
arrays, su exportador ni su temporizador. Adaptar los componentes reales y eliminar la
presentación anterior sustituida en cada corte. El preview queda como referencia de revisión,
fuera de los assets de producción.

Este plan sustituye las decisiones visuales/navegación del anterior
`docs/specs/rediseno-ligero.md` que entren en conflicto. Conserva sus invariantes funcionales.
No incluye cambios de licencia, financiación, entitlement, reglas de Firestore, motor de
progresión ni formatos de backup: no son requisitos para adoptar este diseño.

### Invariantes

- Conservar datos, IDs, fechas, claves de almacenamiento, sincronización y compatibilidad con backups.
- Conservar sesiones libres, KONG, rutinas propias/globales, guías, biblioteca y edición/merge de ejercicios.
- Conservar todos los protocolos de `WorkoutSet`, RIR, superseries, warmups, peso corporal,
  isométricos, cardio, notas, reemplazos y orden de ejercicios.
- Conservar edición/repetición/borrado del historial, PNG/CSV/JSON, autosave y recuperación de sesión.
- Conservar nutrición, macros/objetivos, agua, comidas guardadas, cardio, medidas y tendencias corporales.
- Conservar notificaciones, recordatorios, widgets, Health Connect y Drive, y sus restricciones reales.
- ES/EN, kg/lb, tema claro/oscuro/Auto, acentos elegidos y preferencias de movimiento siguen funcionando.
- El onboarding mantiene las tres preguntas actuales: frecuencia, objetivo y duración. No reintroducir experiencia.

## 2. Qué se traslada y qué se corrige del preview

| Referencia | Aplicación real | Decisión |
| --- | --- | --- |
| Grafito `#101112`, panel `#191b1c`, elevado `#222526` | Variables de `index.css` y tokens Tailwind | Sustituir valores existentes, no crear otro sistema de variables paralelo. |
| Acento `#c4f13a` | `primary-*` / `accent-text` | Es el valor por defecto, no un color fijo que invalide los otros acentos. |
| Radios sobrios, bordes finos, sombra contenida | Button, Sheet, filas, inputs, tarjetas | Paneles 16 px, controles 10–12 px, confirmaciones 20 px como punto de partida. |
| Hoy / Rutina / Progreso / Diario | Layout + AppViews + useAppHistory | Navegación coherente; editor y entrenamiento son vistas hijas, no pestañas raíz. |
| Semana fechada con días completos y descansos | HomeTopSection y resumen semanal | La app modela días de rutina, no una agenda L–D. Mostrar selector de sesiones reales; usar fechas solo para actividad registrada. No inventar planificación. |
| Hero + progreso semanal + tendencia + últimos entrenos | HomeHeroCard, HomeRecapStrip, selectores existentes | Datos reales, CTA antes del preview de ejercicios en móvil. Sin plan o sin datos: estados útiles, no números ficticios. |
| Catálogo de 3 rutinas fijas | TemplateSelector, ProgramHub, ProgramEditView | Biblioteca real con filtros derivados de contenido disponible; no sustituir por las tres demos. |
| Un ejercicio enfocado y tabla de series | WorkoutMain, SetRow, controlador actual | Selección visual por `instanceId`; conservar protocolos y superseries. No limitarse a 3×8. |
| Descanso 1:30 con setInterval | TimerContext, useTimer y bridge nativo | Cambiar la superficie, no el reloj. Mantener plazos y comandos nativos existentes. |
| Gráfico de carga con 4/8 semanas | StatsView, useStatsData y worker | Selector de período real, independiente del ámbito plan/histórico. Misma entrada para resumen, gráfico y tabla. |
| Diario Sesiones / Nutrición | HistoryView + NutriView | Contenedor común, no duplicar datos ni crear otro historial. |
| «Tu esfuerzo, tus datos» | Perfil / Datos / Acerca de | Transparencia sobre almacenamiento y servicios, sin prometer sincronización o licencia que no existan. |
| «Por qué este diseño», auditoría, reiniciar demo | Solo preview | No se envían a producción. Los hallazgos de esa demo ya no son una auditoría vigente. |

Correcciones deliberadas: varias etiquetas del preview usan 8–11 px; no copiarlas a datos
importantes ni acciones. Texto de formulario 16 px, cuerpo 14–16 px y etiquetas útiles 12–14 px.
Objetivo táctil 48 px en Android, mínimo absoluto 44 px. No copiar límites arbitrarios de carga,
objetivos, fechas, claims de privacidad ni cálculos de muestra.

## 3. Arquitectura de navegación elegida

### Destinos raíz

- **Hoy:** sesión siguiente/activa, estado semanal y accesos recientes.
- **Rutina:** plan activo, estructura, biblioteca y crear/editar. La ficha de rutina no es el editor.
- **Progreso:** Resumen / Fuerza y otras métricas / Volumen; conservar funciones actuales.
- **Diario:** Sesiones / Nutrición. Nutrición conserva accesos a Hoy / Cuerpo / Historial nutricional.

Escritorio: sidebar desde `lg` (1024 px). Móvil/tablet estrecha: cuatro destinos etiquetados abajo,
sin el `+` ambiguo. Dos columnas donde quepan; no forzar el breakpoint 700 px de la demo.
Perfil/configuración permanece disponible desde el encabezado. Se conserva el logo real existente.

### Estado y compatibilidad

Definir una unión nombrada de destinos/estados en el módulo de navegación. Actualizar juntos
`App.tsx`, `AppViews.tsx`, `Layout.tsx`, `useAppHistory.ts`, loaders, acciones de navegación,
widget, shortcuts y retornos desde pantallas hijas. Antes de cambiar exports: revisar referencias
con LSP si está disponible.

- `Rutina` pasa a raíz; `ProgramEditView` sigue siendo edición hija de ese destino.
- `Diario` tiene sección seleccionada explícita y restaurable, no un toggle perdido al volver de detalle.
- Conservar interpretación de acciones existentes (`history`, `nutrition`, `stats`, `program`) en la
  frontera de navegación/shortcuts para instalaciones anteriores; traducirlas una sola vez al nuevo destino.
  Todos los emisores internos migran al contrato nuevo; no mantener rutas/renderizadores duplicados.
- Raíces usan replaceState, detalle/editor/sesión usan pushState según contrato actual. Back vuelve
  al origen y sección correctos. Una sheet/confirmación no debe cerrar también su pantalla subyacente.
- Cambiar de pestaña o volver nunca crea, finaliza ni descarta una sesión implícitamente.

## 4. Fases y entregables

### Fase 0 — Contratos y paridad antes del corte

Inventariar entradas reales de cada acción, protocolos y estados de datos; registrar capturas
actuales con fixtures locales aislados y comparar con la referencia. Medir bundle actual y
una traza de edición/registro de serie antes de cambiar layout.

Revisar `AppViews.tsx`, `useAppHistory.ts`, `views/workout/useWorkoutViewState.ts`,
`hooks/useWorkoutController.ts`, `types.ts`, `utils/statsScope.ts` y `views/home/useHomeViewState`.
No cambiar persistencia para resolver necesidades exclusivamente visuales.

Aceptación: cada acción existente tiene destino en la nueva navegación y una forma verificable
de ejecutarse; no hay una función que desaparezca por no aparecer en la demo.

### Fase 1 — Sistema visual y componentes compartidos

Archivos: `index.css`, `tailwind.config.js`, `styles/app-polish.css`,
`components/ui/Button.tsx`, `Sheet.tsx`, `ConfirmModal.tsx`, componentes de fila/formulario.

- Mapear colores/radios/sombras/movimiento a tokens existentes. Incorporar los tokens que falten
  en su mismo propietario, no importar `proposal.css` globalmente.
- Tipografía Inter existente, pesos 450–650 para lectura; énfasis reservado. Cifras tabulares.
- Tres niveles perceptibles de superficie y bordes consistentes; menos gradientes/glow/blur.
- Primario sólido, secundario neutro y destructivo inequívoco. Loading/disabled/focus/error también diseñados.
- Refactorizar los componentes que siguen fijando blanco/negro antes de quitar sus parches CSS.
- Conservar el opt-in de eventos necesario con Radix (`pointer-events-auto`), foco, Escape y overlay stacking.
- Mantener safe areas y política `data-effects`; nada de animaciones permanentes ornamentales.

Aceptación: ambos temas + acentos sin texto ilegible; foco visible, targets ≥44 px y lectura con
letra grande; ninguna confirmación visible pero intocable sobre el perfil.

### Fase 2 — Shell y navegación completa

Archivos existentes: `components/layout/Layout.tsx`, `components/app/AppViews.tsx`,
`App.tsx`, `hooks/useAppHistory.ts`. Componentes nuevos propuestos: shell/sidebar/nav
móvil y contenedores `RoutineView` / `DiaryView` (ubicación final según convenciones del repo).

- Sustituir la navegación anterior por Hoy / Rutina / Progreso / Diario.
- Sidebar en escritorio, barra inferior móvil, encabezado consistente y área de lectura más amplia.
- Mantener sesión activa visible con acción Retomar; entrada a sesión libre dentro de Hoy/Rutina
  y mediante accesos rápidos existentes, no eliminada junto con el `+`.
- Mover detalles y editor al lugar correcto de la jerarquía; migrar acciones y shortcuts juntos.
- Mantener virtualización de historial: una única región propietaria del scroll por pantalla;
  no envolver Virtuoso en un contenedor sin altura ni añadir scroll anidado.

Aceptación: Back/gesto Android y Forward no saltan de sección, no dejan overlays abiertos y no
pierden sesiones. Los accesos externos aún abren su operación prevista.

### Fase 3 — Hoy y Rutina

Hoy: `HomeView.tsx`, `HomeViewImpl.tsx`, `views/home/HomeTopSection.tsx`, `HomeHeroCard.tsx`,
`HomeRecapStrip.tsx`, estados vacíos, `utils/homeSummary.ts` y tendencias ya existentes.

- Fecha real y encabezado compacto. En 360×800, CTA principal accesible sin atravesar un bloque
  ornamental largo; limitar el saludo si desplaza la acción fuera de la primera vista.
- Selector de sesiones del plan; siguiente/seleccionada/completa/saltada/en curso distinguibles.
- Hero con nombre real, duración estimada rotulada como tal, ejercicios y series del programa.
- CTA Empezar / Retomar / Repetir sin cambiar sus reglas ni la confirmación de reemplazo.
- Resumen semanal con semántica explícita (semana del plan o calendario según dato mostrado),
  tiempo registrado, tendencia real y últimos entrenos. Sin datos comparables: no mostrar porcentaje de mejora.
- KONG mantiene bloque, guía, transición, final de semana/ciclo y descarga.

Rutina: nueva vista de lectura del plan y catálogo real; reutilizar
`views/home/TemplateSelector.tsx`, `components/programs/ProgramHub.tsx` y
`views/ProgramEditView.tsx`, sin montar un Home oculto para acceder a sus diálogos.
Extraer al propietario adecuado el estado compartido de selección de plantilla cuando sea necesario.

- Plan activo + estructura + acciones contextuales; fichas de biblioteca y filtros reales.
- Crear, guardar plantilla propia, importar, sustituir y editar conservan las validaciones y bloqueos.
- Cambiar plan no descarta una sesión en curso sin confirmación. KONG no se convierte silenciosamente.

Aceptación: cero fixtures de demo en producción; rutina vacía, 2/3/4/6 días, personalizada,
KONG y sesión libre funcionan desde sus nuevos destinos.

### Fase 4 — Entrenamiento enfocado y descanso

Archivos: `views/workout/WorkoutMain.tsx`, `useWorkoutViewState.ts`,
`components/workout/SortableExerciseCard*`, `SetRow.tsx`, `setRow/*`,
`components/ui/restTimer/*`, `WorkoutFinishSheet.tsx`, `SessionSummaryView.tsx`.

- Encabezado compacto, progreso, selector de ejercicios horizontal móvil/lateral escritorio.
- Reutilizar `activeExerciseId`/`instanceId` actuales. No identificar ejercicios por índice ni nombre;
  añadir/reemplazar/reordenar conserva el seleccionado o elige un fallback válido.
- Un panel de edición principal, navegación directa entre ejercicios y siguiente ejercicio.
  Las superseries mantienen su secuencia y acceso inmediato al compañero.
- Presentación de tabla para carga/reps/RIR, historial anterior contextual y unidades.
  Reutilizar las variantes real/corporal/isométrica y campos de protocolos/cardio existentes.
- No imponer el bloqueo de campos completados de la demo: conservar corrección y autosave actuales.
- Preservar flush de la entrada pendiente al completar, blur o cambiar de ejercicio: escribir una
  carga y tocar Hecha no puede registrar el valor anterior.
- Descanso acoplado visualmente al panel durante entrenamiento. Una sola instancia visual activa:
  fuera del entreno, conservar la píldora global necesaria para retomar, sin duplicar motor.
- Reloj, suma/resta/omitir, origen de serie, pantalla bloqueada y acciones de notificación siguen
  pasando por `TimerContext`, `useTimer` y bridge. Nada de `setInterval` local como fuente de verdad.
- Adaptar con `visualViewport`/safe areas: teclado no tapa última serie ni controles de descanso.
- Finalizar abre revisión; conservar finalizar parcial, descartar explícito, feedback, resumen y compartir.

Aceptación: comparativa antes/después de series registradas, orden, notas, PRs, duración y volumen;
reabrir tras segundo plano recupera sesión y reloj. No se remonta el input enfocado cada segundo.

### Fase 5 — Progreso con contexto

Archivos: `views/StatsView.tsx`, `StatsViewImpl.tsx`, `views/stats/*`,
`components/stats/*`, `hooks/useStatsWorker.ts`, `services/statsCache.ts`.

- Aplicar jerarquía del preview sin borrar Resumen / Fuerza (antes «Progreso») / Volumen, radar, distribución,
  selección de ejercicios, tabla de rep-max, insights y sus gates actuales.
- Selector de período (4/8 semanas e histórico) y ámbito plan/histórico, claramente diferenciados.
- Aplicar ámbito + período una sola vez antes de resúmenes/cálculos. La clave del cache y el
  fingerprint deben distinguir esas entradas; no mostrar resultados del filtro anterior.
- Gráfico, KPI y tabla accesible salen de la misma serie. Carga registrada no se llama 1RM;
  estimaciones se rotulan como estimaciones. Conservar métricas de duración/distancia/reps/isométricos.
- Mantener worker y carga diferida de charts. Nunca calcular todo el histórico por cada render de Hoy.
- Estados sin historial, un único punto, sin datos dentro del período y error con recuperación honesta.

Aceptación: kg/lb, ejercicios fusionados, entradas futuras/saltadas y cambios de filtro producen
resultados coherentes; ninguna gráfica decorativa con datos ficticios.

### Fase 6 — Diario e integración de nutrición

Archivos: nuevo `DiaryView`, `views/HistoryView.tsx`, `views/HistoryDetailView.tsx`,
`views/NutriView.tsx`, `views/nutri/*`, `components/nutrition/*`.

- Dos secciones raíz de Diario: Sesiones / Nutrición. Recordar la selección al volver de un detalle.
- Historial conserva filtro/búsqueda, virtualización, detalle, edición, borrado con confirmación,
  repetir sesión y exportar; nuevas filas con fecha, datos clave y estado legible.
- Nutrición conserva sus vistas Hoy/Cuerpo/Historial, objetivos, macros, agua, cardio, alimentos
  personalizados y peso. Aplicar el diseño de listado limpio, no reducirla a dos números.
- Añadir comida accesible desde el encabezado de Nutrición; atajo contextual desde Hoy para no
  penalizar a quien registra varias veces al día. Usar el mismo flujo, no otra implementación.
- Objetivo configurado y ausencia de objetivo se muestran con honestidad; no cambiar las fórmulas
  ni quitar los objetivos actuales para imitar la demo.
- No confundir exportar CSV de sesiones con backup JSON de todos los dominios.

Aceptación: editar/borrar/deshacer/completar formularios persiste lo correcto; volver mantiene
sección y filtros; sesiones y nutrición no se renderizan ambas ocultas cargando charts innecesarios.

### Fase 7 — Perfil, pantallas secundarias y acabado uniforme

Archivos: `components/profile/*`, `components/auth/*`, `components/onboarding/*`,
`views/ExercisesView.tsx`, `views/programEdit/*`, `components/ui/*` y hojas de estilo existentes.

- Perfil con agrupaciones claras de Cuenta / Cuerpo / Preferencias / Datos / Avanzado; mismas
  funciones de copia/importación, Drive, Health Connect, borrado y diagnóstico.
- Biblioteca, editor, guías, paywall vigente, autenticación, onboarding de tres pasos,
  resumen y errores reciben el mismo sistema de superficies, tamaños y feedback.
- Separar guardando / guardado local / pendiente de sincronizar / error. Sin prometer guardado
  durable cuando la operación no ha confirmado éxito; mensajes de nube solo si hay cuenta/servicio.
- Diálogos y sheets: título, foco inicial, foco restaurado, scroll con contenido largo, Escape/Back,
  confirmación destructiva y bloqueo del contenido inferior por tacto y teclado.
- No mostrar avisos de instalar PWA en Capacitor. No incorporar notas de auditoría/botones de demo.

Aceptación: ninguna pantalla queda con la estética anterior por ser secundaria. Importar JSON
sobre Perfil permite Cancelar e Importar con tap real, sin activar controles inferiores.

### Fase 8 — Verificación integrada y entrega

Ver la matriz inferior. Tras migrar cada superficie retirar sus clases/CSS/handlers obsoletos
con evidencia de uso; no añadir otra capa de overrides `!important`. Actualizar traducciones,
tutoriales, referencias de navegación, docs y pruebas de comportamiento afectadas.

La retirada de CSS de compatibilidad se hace después de migrar sus consumidores, no antes.
No borrar estilos ni modificaciones ajenos por parecer heredados.

## 5. Secuencia y paralelismo seguro

Dependencias: 0 → 1 → 2. Con shell/contratos estables se pueden implementar Hoy+Rutina,
Progreso y Diario de forma independiente. Entrenamiento/descanso es un bloque propio por el
riesgo de teclado, timers y superseries. Perfil/secundarias siguen los componentes comunes.
Una sola persona integra cambios en App/Layout/navigation/tokens; evitar ediciones simultáneas.
La fase final integra todos los destinos; una fase completada no equivale a entregar el rediseño.

No hace falta un sistema de flags de largo plazo ni mantener dos shells productivos. Cortes
pequeños en la rama de trabajo, app ejecutable en cada corte, un solo diseño final.

## 6. Matriz de aceptación final

| Área | Escenario obligatorio | Evidencia |
| --- | --- | --- |
| Fidelidad | Hoy, Rutina, Progreso, Diario, entreno, perfil y resumen | Capturas revisadas con fixtures reales controlados; composición comparada con preview, no igualdad píxel a píxel de datos ficticios. |
| Responsive | 320/360/390/430 px y escritorio 1024/1440 px; rotación | Sin overflow horizontal global, truncado destructivo o CTA tapado. |
| A11y | Claro/oscuro, todos los acentos, ES/EN, zoom/texto 200 %, teclado, TalkBack | WCAG AA: 4.5:1 texto normal, 3:1 texto grande/controles; foco y nombres accesibles; movimiento reducido. |
| Navegación | Cambiar raíces, editor/detalle, perfil, widget, CSV compartido, Back/Forward | Destino y sección correctos, sesión intacta; no cierre doble ni rutas antiguas sin destino. |
| Entreno | Carga/reps/RIR; corporal, isométrico, cardio, superserie, KONG y protocolos especiales | Edición pendiente registrada, corrección y orden conservados; revisión parcial y finalización correctas. |
| Android | Teclado abierto, ocultar/volver, bloquear/desbloquear, descanso y acciones nativas | Smoke en emulador del APK debug aislado; prueba física de teclado, TalkBack y notificaciones antes de afirmar soporte validado en dispositivo. |
| Datos | Reabrir sesión; JSON export/import, cancelación; editar historial/nutrición | Comparar contenido persistido; sin llamadas a producción en las pruebas de integración. |
| Rendimiento | Inicio, listas largas, edición continua, timer activo y filtros | Comparar con base de fase 0; sin nuevas librerías decorativas, sin charts/worker nuevos en arranque, sin clone de histórico ni render global por tick. |
| Compilación | Lint, TypeScript, suites existentes afectadas, producción y assembleDebug | Ejecutar al cerrar los bloques integrados; no usar capturas como sustituto de prueba de comportamiento. |

Si hay presupuestos existentes que fallan, medir causa y corregir carga antes de aumentarlos.
Los snapshots de presentación anteriores se revisan intencionalmente; tests que fijan clases,
textos incidentales o wiring no se reescriben solo para volver a verde: se eliminan cuando no
prueban comportamiento visible. Nuevas pruebas persistentes solo para transiciones/invariantes
plausibles; inspección visual y smoke para apariencia.

## 7. Definición de terminado

- Las cuatro raíces, entreno enfocado y todas las pantallas secundarias usan un solo diseño.
- Sin pérdida de funciones, datos ni accesos externos; backstack y overlays funcionan en Android.
- Comparativa visual móvil/escritorio, oscuro/claro y reporte de smoke con límites explícitos.
- CSS anterior sustituido retirado, sin componente demo en producción ni ramas muertas deliberadas.
- No se cambia entitlement/licencia ni se promete backend de borrado/cloud por cambiar la UI.
- APK debug probado; para distribución, sincronizar assets de producción y generar release firmada,
  verificar certificado, identidad y ausencia de endpoints de emulador. Informar la versión real;
  cualquier incremento de versión se decide como parte de esa entrega, no se presume en este plan.

## 8. Registro histórico de la planificación original

Inspección de `design-preview/index.html` en Chromium con viewport 390×844 y 1440×1000:
Hoy, filtro Rutina, detalle de estructura, Progreso, Diario/Nutrición, tema claro y entrenamiento
con serie completada y descanso. Lectura de sus fuentes y de los archivos de aplicación citados.
No se modificó la aplicación ni se ejecutaron builds/tests de producto en esta tarea: es un plan.
Better Design MCP no está conectado; no se atribuye a esa herramienta ninguna revisión.

## 9. Ejecución pendiente tras la auditoría de cierre

El trabajo restante se define en [Cierre de design-preview — plan para Gemini 3.8 Flash](design-preview-closure-plan.md).
Ese documento fija contratos, propietarios, secuencia A–F, regresiones, matriz visual/Android
y trazabilidad de APK. Mantener vigentes las invariantes de este plan original.
La implementación y la publicación son pasos distintos; una suite en verde o un APK debug
anterior no acreditan el release final ni las pruebas físicas pendientes.

