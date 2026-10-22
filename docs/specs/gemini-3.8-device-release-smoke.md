# Gemini 3.8 — aceptación física del APK release publicado

Estado: PROTOCOLO PENDIENTE DE EJECUCIÓN. Fecha: 2026-10-22.
Entorno previsto: PC del trabajo del propietario y teléfono Android físico conectado/autorizado.
Implementación y publicación a cargo de Muse Spark 1.3: [plan de entrega](muse-spark-1.3-release-remediation-plan.md).

## 1. Misión y límites

Probar la APK RELEASE descargada de GitHub, no otra compilación ni una preview web. Cubrir TODOS los casos aplicables enumerados en este documento y emitir reporte por subcaso. No modificar código, reconstruir APK ni publicar otra release como parte de esta ejecución. Un bug se informa al implementador con reproducción/evidencia; no se oculta cambiando expectativas.

«Smoke» aquí incluye regresión funcional y aceptación física, no solo instalación/arranque. Ni los checks verdes de Muse ni el smoke debug 6/6 sustituyen estos casos. No declarar «todo aprobado» con casos bloqueados/no ejecutados. No usar un porcentaje ni un booleano agregado para esconder subcasos.

## 2. Traspaso obligatorio de Muse y preparación segura

Antes de iniciar, obtener del release-verification adjunto y de GitHub:
- Repo `gabsvm/IronLog-React`, tag y commit fuente exactos.
- URL de APK, archivo SHA-256 y hash completo esperado.
- Package `com.gainslab.pro`, versionName y versionCode del nuevo candidato.
- Certificado SHA-256 esperado GainsLab: `4C:69:56:9B:3A:45:1D:97:24:B1:D3:17:25:76:09:0F:0B:68:73:8B:E5:8B:B6:C6:A4:A1:87:D7:D5:AE:18:3B`.
- Protocolo asociado al candidato, resultados previos, matriz visual y limitaciones de Muse.

La .14/v422 es la base auditada, NO el candidato corregido esperado. Si la versión no está identificada, resolver desde GitHub/artefactos; si no se puede, registrar bloqueo, no elegir «latest» a ciegas.

### P0 — estación y dispositivo

- P0.1 Identificar shell/OS, herramientas existentes (`adb`, SDK build-tools, GitHub CLI o navegador); leer reglas locales de esa PC. No asumir rutas/JDK de la PC de desarrollo ni instalar herramientas sin autorización/política de empresa.
- P0.2 `adb devices -l`: seleccionar serial explícito; si hay varios, usar `adb -s <serial>` en TODO comando. Registrar fabricante/modelo, Android/API, WebView/Chrome, resolución/densidad, IME, navegación gestual o tres botones y estado de permisos/batería. No publicar serial/identificadores personales sin sanitizar.
- P0.3 Verificar consentimiento del propietario para actualizar su instalación y para acciones de prueba. NO `pm clear`, desinstalar, reset de fábrica, wipe, borrar volúmenes ni eliminar históricos reales. No reinstalar con downgrade ni firma alternativa. No activar root ni inspeccionar credenciales.
- P0.4 Si ya hay datos, exportar JSON mediante la app y conservar copia local privada validada. Documentar estado previo y plan de restauración. Probar importación destructiva/borrado solo en perfil Android de prueba o dispositivo de pruebas autorizado. Si no existe aislamiento, marcar esos casos BLOQUEADOS POR SEGURIDAD y continuar el resto; no sacrificar datos para aprobar.
- P0.5 Preparar datos ficticios reconocibles por prefijo `QA-`, sin datos personales: plan de 2 días con varias series y ≥2 ejercicios, otro plan distinto, KONG intermedio, comidas/objetivos/cardio/medidas y JSON de prueba válido. Usar flujos de app/importación soportada; fixtures permitidos solo como preparación. No escribir IDB para simular la acción bajo prueba.

### P1 — descargar, identificar e instalar

Ejemplos PowerShell: sustituir valores por los del traspaso y verificar exit codes; no pegar placeholders literalmente.

```powershell
gh release download <tag> --repo gabsvm/IronLog-React --pattern 'GainsLab-*.apk*' --dir <directorio-nuevo>
Get-FileHash <apk-descargado> -Algorithm SHA256
apksigner verify --verbose --print-certs <apk-descargado>
aapt dump badging <apk-descargado>
adb -s <serial> shell dumpsys package com.gainslab.pro
adb -s <serial> install -r <apk-descargado>
adb -s <serial> shell am start -W -n com.gainslab.pro/com.gainslab.pro.MainActivity
```

Usar ejecutables reales localizados, no asumir PATH. Alternativa descarga por navegador y hash local si no hay gh. No exponer tokens. APK de GitHub y APK instalado deben corresponder al mismo archivo.

- P1.1 Comparar SHA COMPLETO, firma, package/versionCode/versionName, no solo nombre del fichero. Si difieren, DETENER instalación de ese binario y reportar.
- P1.2 Si hay instalación anterior, registrar identidad y actualizar in-place sin perder datos. Confirmar tras actualizar versión instalada y conservación de sesiones, preferencias, rutinas e historial. Si instalación limpia en perfil de prueba, probar onboarding; no exigir instalación limpia a costa de datos reales.
- P1.3 Arranque en frío real, cerrar/abrir desde launcher y pasar a segundo plano. Sin pantalla blanca permanente, splash trabado, crash/ANR ni banner «instalar PWA» en Capacitor.
- P1.4 Registrar logcat limitado al PID de esta app durante los escenarios. No atribuir errores de otras apps; no volcar logs personales de todo el teléfono. Reobtener PID tras matar/reabrir. Evidencia release sin depuración WebView puede obtenerse con ADB/UIAutomator, captura/video, export JSON y almacenamiento observado mediante flujos públicos; NO reemplazarla por debug para facilitar inspección.

## 3. Reglas para ejecutar y registrar

Usar tap, swipe y teclado REALES (mano, ADB input o automatización nativa equivalente). Prohibidos force-click, dispatchEvent/JavaScript para completar/guardar/cancelar y borrar IDB para simular finalizar. No usar blur manual si el caso exige completar directamente con IME abierto. Registrar si una acción fue física, ADB, navegador o simulada.

Para cada ID: estado PASS / FAIL / BLOCKED / NOT RUN / N/A, precondiciones, pasos realmente ejecutados, esperado, observado, versión/hash, evidencia y motivo. N/A necesita causa comprobable; falta de tiempo, permiso o herramienta es BLOCKED/NOT RUN, no N/A. Si falla una ruta compartida, registrar subcasos afectados sin inventar que todos se ejecutaron.

Prioridad: ejecutar primero C1–C6 (regresiones auditadas), luego resto. Ante pérdida/corrupción de datos, detener acciones mutantes, preservar evidencia y backup; continuar solo casos seguros. No repetir un fallo conocido solo para «confirmarlo»; tras nueva corrección probarlo sobre el NUEVO hash.

## 4. Regresiones obligatorias del corte

### C1 — segunda confirmación y exactamente una vez

Preparar rutina ficticia con ≥3 slots editables.
- C1.1 Quitar slot A y confirmar: desaparece exactamente A, sin cambiar los restantes.
- C1.2 Sin salir del editor, quitar slot B y confirmar: también desaparece B, diálogo se cierra. En .14 fallaba el segundo confirmar. Verificar persistencia al salir/reabrir.
- C1.3 Abrir quitar C, cancelar; reabrir y confirmar. Cancelar no muta nada; confirmación posterior funciona.
- C1.4 Doble tap rápido en confirmar: una sola mutación, sin borrar siguiente entidad ni navegar dos veces.
- C1.5 Repetir dos confirmaciones consecutivas en consumidores distintos: saltar dos días ficticios, borrar dos ejercicios personalizados sin referencias, borrar dos alimentos guardados. Si existen permisos de administrador, incluir eliminar/resetear dos plantillas; sin esos permisos registrar N/A justificado solo para administración.
- C1.6 Back/Escape (teclado externo si existe)/desmontaje/Forward nunca ejecutan callback destructivo cancelado. Las confirmaciones de importar/reemplazar siguen operativas al segundo uso.

### C2 — Back desde revisión final y tipos de serie

- C2.1 Iniciar entrenamiento, editar un set, abrir Terminar sesión. Back cierra SOLO revisión y deja workout visible con mismos valores, IDs y sesión activa. No vuelve a Hoy.
- C2.2 Reabrir revisión, Seguir entrenando y X/backdrop permitido: mismo resultado, sin entrada extra ni sesión finalizada.
- C2.3 Abrir selector de tipo de serie. Back cancela solo ese selector, conserva tipo anterior y pantalla workout.
- C2.4 Abrir revisión → Descartar → confirmación superior. Primer Back cierra solo confirmación; siguientes cierres respetan LIFO sin guardar/descartar por accidente.

### C3 — autenticación/PRO y aislamiento accesible

- C3.1 Perfil → login: foco inicial útil en correo. Esperar que Perfil termine de cerrar; con TalkBack explorar por swipe lineal y exploración táctil: no se accede a Hoy/nav/controles del fondo.
- C3.2 Con IME visible, primer Back oculta IME sin cerrar Auth; siguiente cierra Auth. No activa botón inferior ni abandona la app inesperadamente.
- C3.3 Tab/Shift+Tab con teclado físico o ADB KEYCODE_TAB y combinación Shift: ciclo dentro del modal, foco visible. Si el entorno no permite Shift+Tab, registrar límite, no sustituir por afirmar que aria-modal basta.
- C3.4 Abrir PRO desde CSV/gate real sin entitlement de prueba falsa. Foco dentro, fondo fuera de TalkBack, Back/X cierran solo PRO y devuelven contexto/foco. NO pulsar enlaces de compra/WhatsApp ni modificar licencia.
- C3.5 Al cerrar última capa, fondo vuelve a ser accesible/tocable; no quedan inert/aria-hidden/overflow/pointer-events bloqueando. Reabrir/cerrar dos veces.

### C4 — restauración y entradas caducadas

- C4.1 Abrir Perfil desde cada raíz y sección relevante (Datos/Preferencias). Recrear WebView/Activity o proceso según §C9. Al volver: perfil/vista/sección coherentes o normalización segura documentada, nunca hoja abierta desvinculada de navegación. La garantía específica de reload web se revisa además en C4.4.
- C4.2 Inicio rápido desde Hoy → Back: cierra hoja, sigue Hoy. Reabrir/cerrar varias veces y luego entrar a workout: Back vuelve al origen, no a una hoja vacía anterior.
- C4.3 Forward no existe necesariamente como gesto Android; no inventarlo. Revisar evidencia automatizada de Muse y ejecutar Back→Forward/reload en Chromium de PC con LOS MISMOS assets extraídos del APK y red restringida, si es posible. Si no, registrar esa subprueba como no física/bloqueada.
- C4.4 Complemento PC: Perfil abierto→reload preserva/reconcilia `profileSection`/raíz; QuickStart→Back→Forward restaura contexto válido o normaliza sin `_modalKey` huérfano; cancelar destructivo→Forward no ejecuta acción; confirmar→navegar→Back no repite callback. No presentar esta ejecución web como evidencia de Back nativo.
- C4.5 Tres capas reales disponibles (p. ej. Perfil/Datos → importación → confirmación): cada Back cierra exclusivamente la superior; controles inferiores permanecen utilizables al volver. Si el producto no ofrece una combinación concreta, usar combinación real documentada, no fixtures de diálogos que sustituyan el flujo.

### C5 — editor legible y alcanzable

- C5.1 Abrir editor sin sesión activa. Atrás/Comenzar responden a tap normal; no necesitan acertar icono diminuto. Obtener medición ≥44×44 px de hit area desde evidencia DOM de Muse o inspector disponible; screenshot sola no certifica tamaño CSS.
- C5.2 Campos series/reps/selección: fuente 16 px, foco visible, IME correcto; acciones útiles legibles, sin truncado destructivo.
- C5.3 Texto Android al 200 %/máximo comparable: editor y overlays largos siguen utilizables con teclado abierto/cerrado, scroll alcanza última acción. Registrar escala real usada y restaurarla al terminar.

### C6 — editar/convertir y crear desde KONG

- C6.1 Preparar KONG en bloque/semana intermedia, set editado y descanso activo. Intentar editar desde Hoy, Rutina, Perfil, Inicio rápido, paleta/acceso externo cuando exista. Todos bloquean de forma no destructiva; sesión/mesoId/semana/plazo no cambian.
- C6.2 Sin sesión, abrir conversión; cancelar preserva KONG. Confirmar conversión explícita crea rutina editable correcta una sola vez.
- C6.3 Preparar KONG sin sesión y elegir crear desde cero: abre editor vacío, no conversión obsoleta ni pantalla trabada. Con sesión, cancelar descarte conserva todo; consentir descarte detiene descanso antes de abrir editor vacío.
- C6.4 Sesión aparecida entre abrir conversión y confirmar: comprobar evidencia automatizada REAL de Muse; si hay entrada real para reproducirlo, ejecutar. Sin entrada real no manipular storage para fingir concurrencia; declarar revisión automatizada, no prueba física.
- C6.5 Finalizar entrenamiento KONG por flujo real, no borrar sesión: comparar log exportado/detalle antes/después con `mesoId`, `programSystem`, bloque/semana y avance esperado. Incluir final de semana, transición de bloque, descarga y cierre de ciclo en fixtures aislados. Cancelar confirmaciones de cierre conserva plan.

## 5. Regresión funcional y nativa completa

### C7 — navegación, raíces y funciones conservadas

- C7.1 Recorrer Hoy/Rutina/Progreso/Diario repetidamente; entrenamiento/editor/biblioteca/detalle regresan a raíz y sección correctas. Cambiar raíz nunca crea/finaliza/descarta sesión implícitamente.
- C7.2 Hoy: vacíos útiles; plan de 2/3/4/6 días; día seleccionado/siguiente/completado/saltado/activo distinguibles; CTA accesible sin scroll ornamental; resumen semanal, duración estimada rotulada y tendencia sin mejoras ficticias cuando faltan datos.
- C7.3 Rutina: catálogo/filtros/detalle real, crear/editar/guardar plantilla propia/importar/sustituir. Cancelar cambio conserva sesión; confirmar reemplazo descarta en orden correcto. Conservar guías y bloques KONG.
- C7.4 Biblioteca: buscar/filtros, crear/editar/merge/reemplazar ejercicio, borrar con y sin referencias según reglas. Cancelar no modifica logs/rutina; cambios válidos persisten.
- C7.5 Inicio rápido, widget/shortcut existente y CSV compartido por Android abren destino/operación previstos. Back no sale accidentalmente ni deja rutas antiguas sin destino.
- C7.6 Onboarding de instalación limpia autorizada: frecuencia, objetivo, duración; rutas sugerida y personalizada funcionan; no pregunta extra reintroducida. Tutoriales corresponden a navegación real y se pueden cerrar.

### C8 — registro de series y protocolos

Preparar ejercicios de fuerza, corporal, isométrico, cardio, superserie y protocolos especiales existentes; recorrer cada opción realmente soportada, sin reducir todo a 3×8.

- C8.1 En ÚLTIMA serie y con IME abierto escribir carga `87.5` y reps `12`; tocar Hecha/Completar sin blur manual ni ocultar IME. Datos correctos guardados, no valores anteriores. Verificar al reabrir y por export/detalle soportado.
- C8.2 Escribir entrada pendiente y cambiar de ejercicio inmediatamente; volver: flush correcto. Repetir ocultando/mostrando teclado y cambiando app.
- C8.3 Corregir serie ya completada; RIR/RPE/notas e historial contextual persisten. kg/lb cambia presentación/entrada, no reescribe indebidamente datos canónicos.
- C8.4 Añadir/reemplazar/borrar/reordenar ejercicios conserva seleccionado por instanceId o fallback válido; superserie permite ir al compañero y conserva secuencia. Scroll no inicia drag accidental; reorder se guarda solo al confirmar.
- C8.5 Corporal con/sin carga extra, isométrico con duración, cardio distancia/duración y cada protocolo especial conservan campos, cálculos y finalización. Controles no se remontan ni pierden foco por tick del timer.
- C8.6 Finalizar parcial/completo: revisión → guardar → PR/feedback cuando corresponda → resumen → volver. Comprobar notas, PR, duración/volumen y log real, sin workout vacío resucitado por Back.
- C8.7 Compartir resumen como PNG por Android y exportar CSV: archivo válido con datos esperados, cancelar compartir no informa éxito falso. No enviar a contactos reales; usar destino local autorizado.
- C8.8 Descartar explícitamente sesión ficticia elimina solo esa sesión, no histórico/plan; cancelar conserva valores/reloj.

### C9 — persistencia, ciclo de vida y descanso nativo

No confundir Home/segundo plano con muerte del proceso. Capturar estado antes, PID y hora/plazo esperado.

- C9.1 Sesión activa → Rutina → Retomar mismo día: conserva identidad, sets/carga/reps/notas/selección, sin reconstruir ni diálogo de reemplazo. Otro día pide confirmación; cancelar intacto; confirmar sin descanso del origen viejo.
- C9.2 Home Android → esperar → abrir desde launcher: sesión y reloj continúan por plazo, no se reinician.
- C9.3 En sesión de prueba autorizada, detener SOLO `com.gainslab.pro` y reabrir. Puede usarse `adb -s <serial> shell am force-stop com.gainslab.pro`; registrar que force-stop impide notificaciones hasta relanzar y NO equivale a muerte natural del proceso. Recuperar datos persistidos; distinguir entrada pendiente de guardado confirmado.
- C9.4 Si entorno permite matar proceso en background sin force-stop, probar recuperación también ahí y registrar método. Si no, marcar limitación; nunca matar todos los procesos del teléfono.
- C9.5 Descanso en workout: una sola superficie acoplada; fuera, una sola píldora sin tapar nav. Compacto/expandido accesibles con IME y safe areas.
- C9.6 Sumar y restar: comparar deadline antes/después, no solo visibilidad del botón. Omitir detiene descanso correcto una vez. Restos de timer no reaparecen en otra sesión.
- C9.7 Medir continuidad real con referencia temporal: iniciar descanso, background/bloquear pantalla, esperar intervalo conocido, desbloquear. Tiempo restante/fin acorde al plazo, no al tiempo de render; sin duplicados.
- C9.8 Con permiso concedido: notificación de fin y acciones nativas disponibles (sumar/omitir/abrir) aplican al descanso correcto, incluso tras background; no doble aviso. Registrar permisos de notificación/alarma exacta y restricciones OEM/batería.
- C9.9 Con permiso denegado o alarmas exactas no autorizadas: explicación honesta, sin crash/loops ni promesa falsa de entrega puntual; reloj en primer plano sigue útil. No cambiar ajustes corporativos ni conceder permisos sin consentimiento.
- C9.10 Bloqueo/desbloqueo, ahorro de batería y restricciones Android/OEM: ejecutar lo autorizado y documentar límites reales. Reinicio de teléfono solo con autorización; de lo contrario BLOCKED/NOT RUN, no afirmar recovery de reboot probado.

### C10 — Diario, Progreso y nutrición

- C10.1 Diario: buscar→detalle→volver conserva búsqueda y Sesiones; cambiar Nutrición/Hoy/Cuerpo/Historial y volver conserva subpestaña. Listas largas virtualizadas desplazan sin doble scroll ni salto al principio injustificado.
- C10.2 Editar/repetir/borrar/deshacer sesión ficticia: datos correctos y persistidos; confirmación no cierra fondo, repetir no atribuye sesión al plan equivocado.
- C10.3 Progreso: ámbito plan/histórico y período 4/8/histórico independientes y coherentes entre KPI/gráfico/tabla rep-max. Cambiar rápido filtros no deja cache de selección anterior. kg/lb, ejercicio fusionado, corporal/isométrico/cardio, registros futuros/saltados, un punto/vacío/error tienen resultados honestos. Contrastar con fixtures cuyo resultado se conozca.
- C10.4 Nutrición: añadir/editar/borrar comida, alimento guardado/personalizado, macros/agua/objetivos, peso/medidas y cardio; cancelar no guarda parcial, guardar persiste; atajo desde Hoy abre el mismo formulario. Agregar dos veces y borrar dos veces, sin bug de segunda confirmación.
- C10.5 Cuerpo/historial: tendencias y fechas/unidades correctas, no mezclar CSV de entrenamiento con backup completo ni mostrar objetivos inventados.

### C11 — Perfil, backups, servicios y errores

- C11.1 Inventariar secciones Cuenta/Cuerpo/Entrenamiento/Apariencia/Datos/Avanzado y acciones disponibles. No perder funciones por rediseño.
- C11.2 JSON inválido sobre Perfil: error comprensible; Back/Escape/backdrop permitido cierra solo confirmación. Perfil sigue usable, sin guardado parcial ni controles inferiores activados.
- C11.3 JSON válido ficticio: revisar resumen, CANCELAR y comparar estado intacto. Reabrir e IMPORTAR por tap normal; comparar contenido persistido de todos los dominios, no solo toast. Repetir importación controlada para probar confirmación reutilizable.
- C11.4 Exportar→restaurar JSON autorizado conserva IDs/fechas/plan/logs/nutrición/preferencias según contrato; distinguir guardado local/pendiente nube/error. Verificar caso de fallo disponible sin fingir que importación tuvo éxito.
- C11.5 Drive, Health Connect y sincronización: solo con cuenta de pruebas y permisos expresamente autorizados; comprobar conectar/denegar/cancelar, retorno a app y estados honestos. No iniciar sesión contra producción ni enviar fixtures a cuenta real sin autorización. Si no hay entorno/cuenta, registrar BLOCKED; no desbloquear gates falsificando entitlement.
- C11.6 Borrado total/de cuenta: solo dispositivo/perfil/cuenta DE PRUEBA autorizados y backend de prueba válido. Verificar cancelación segura siempre; confirmación destructiva real solo si procede. Sin aislamiento, no ejecutar, registrar bloqueo. No dar por implementado un backend no existente.
- C11.7 Offline/volver online: arranque local, lectura/registro/persistencia sin pérdida, recuperación de error y sincronización solo si está configurada/autorizada. No anunciar guardado durable/cloud antes de éxito real.

### C12 — matriz visual, accesibilidad y rendimiento observado

- C12.1 Capturas reales claro/oscuro de Hoy, Rutina, Progreso, Sesiones, Nutrición, workout, Perfil y resumen; comparar composición con referencia, no igualdad de datos de demo. PC 390/1440 y demás dimensiones revisadas en evidencia de Muse; teléfono aporta viewport real, no fingir que cubre seis dispositivos.
- C12.2 Rotar retrato/paisaje en raíces/workout/editor/overlays largos, IME abierto/cerrado, navegación gestual/tres botones si disponible: sin CTA tapado, overflow global ni scroll imposible. Si app bloquea rotación, registrar restricción y comprobar reflow web de Muse, no forzar soporte inexistente.
- C12.3 ES y EN, texto al 200 %, todos los acentos en claro/oscuro en CTA/selección/foco/error, Auto y movimiento reducido. Revisar contraste con medición de Muse/inspector y legibilidad real; no afirmar WCAG por apariencia. Preferencias permanecen tras navegar/reabrir.
- C12.4 TalkBack: nombres/roles/estados de nav/tabs/sets/diálogos; orden de lectura y foco al abrir/cerrar; fondo excluido, errores anunciados, áreas táctiles sin solapamiento. Ejecutar exploración táctil además de secuencia por swipe.
- C12.5 Interacción sostenida: inicio frío/caliente, historial/biblioteca largos, edición continua, filtros de Progreso y timer activo. Registrar latencias/jank observables y método/dispositivo; no inventar comparación anterior ni deducir fluidez del tamaño bundle. Sin teclado/foco perdido cada segundo, bloqueo ni ANR.

## 6. Cobertura cruzada y evidencia mínima

No hace falta producto cartesiano de cada caso×idioma×acento×viewport. Sí hace falta asociar cada dimensión a casos y cubrir cada tipo de formulario/overlay/protocolo. Para toda fila de la matriz original indicar evidencia Muse (automatizada/web), Gemini (física) o bloqueo explícito. Falta evidencia no equivale a fallo funcional, pero impide aceptación completa.

Reporte Markdown local sanitizado, con:
1. Fecha/ejecutor, tag/commit/versionCode/versionName/package, APK SHA completo y certificado; links GitHub exactos.
2. Entorno y configuración inicial/final del dispositivo, método de aislamiento, backup privado existente y permisos autorizados.
3. Tabla con UNA fila por subcaso P0.1…C12.5: estado, esperado/observado, evidencia, límites. No agrupar C9 en un solo true.
4. Fallos: ID, severidad, precondiciones, pasos mínimos, esperado/real, frecuencia observada sin repeticiones inútiles, impacto en datos y captura/video/log PID/archivo exportado ficticio.
5. Evidencia de persistencia para valores editados y finalización KONG; marca de tiempo/plazo antes/después de descanso. Redactar datos personales y credenciales.
6. Lista explícita de casos sin ejecutar/bloqueados y qué recurso/permiso/entorno falta. No llamar N/A a una funcionalidad que sí existe pero no se pudo probar.
7. Veredicto: APROBADO solo si todos los obligatorios aplicables pasan y ninguna dimensión requerida queda sin evidencia; FALLIDO con regresiones reproducidas; PARCIAL/BLOQUEADO si faltan pruebas aun sin fallos observados.

Entregar reporte a propietario/Muse por canal autorizado. No subir logs privados a GitHub ni adjuntar backups reales; publicación de evidencia solo sanitizada y autorizada. Ningún fallo se resuelve reemplazando el APK bajo el mismo tag: nuevo candidato/versionCode/hash y rerun de afectados más regresión compartida.

## 7. Limpieza obligatoria

Restaurar orientación, escala de fuente, TalkBack, permisos/red/batería modificados al estado previo autorizado. Retirar SOLO fixtures QA con consentimiento, sin borrar datos previos; restaurar backup únicamente por flujo aprobado y después de preservar evidencia. No dejar reloj de prueba activo ni alarmas/notificaciones innecesarias.
Cerrar servidores, emuladores, herramientas de captura/watchers y forwards ADB propios; preservar servicios/dispositivos/trabajo ajenos. Verificar salida de procesos/puertos. La app instalada en el teléfono se conserva para el propietario; no desinstalarla como limpieza.

## 8. Prompt para Gemini 3.8 en la PC del trabajo

> Lee este protocolo completo y el release-verification entregado por Muse. Identifica el nuevo candidato por tag, commit, versión y hash, descarga ESA APK de GitHub y verifica firma/checksum antes de instalarla in-place sin borrar datos. Ejecuta todos los subcasos aplicables P0–C12 con evidencia real, especialmente segunda confirmación, Back de revisión, aislamiento TalkBack, IME en última serie, recuperación de proceso, descanso nativo y finalización KONG real. No reconstruyas ni sustituyas el APK por debug, no uses force ni escrituras de almacenamiento como acción probada y no envíes datos a servicios reales sin autorización. Marca cada subcaso PASS/FAIL/BLOCKED/NOT RUN/N/A y entrega reporte sanitizado con límites exactos y recursos propios cerrados. La ausencia de fallos en pruebas parciales no autoriza declarar el plan completamente aprobado.
