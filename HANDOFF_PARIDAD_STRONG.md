# Traspaso: paridad IronLog-React / Strong

## Estado inmediato

**Trabajo detenido a pedido del propietario. No está terminado, no está integrado y no se debe considerar listo para publicar.**

El objetivo pedido fue implementar paridad funcional y visual 1:1 con la aplicación Strong, revisar al terminar qué quedó faltando y verificarlo. La última ejecución de `npm run build` falló con errores de TypeScript. Después se aplicaron correcciones, pero **no se ejecutó otra compilación ni pruebas tras esas correcciones**. Por tanto, no se sabe si el árbol actual compila ni si los cambios funcionan. No se ha generado un APK validado con estos cambios.

La ejecución se dividió entre demasiados agentes que editaron áreas interdependientes. Hubo regresiones: imports, declaraciones y estado eliminados por accidente, además de problemas detectados en una revisión de datos y navegación. Se aplicaron correcciones posteriores sin verificarlas. **Antes de ampliar funcionalidad, estabilizar y revisar el árbol existente.**

### Precauciones con el árbol de trabajo

- El proyecto es `C:/Dev/IronLog-React`. No confundir con `C:/Dev/IronLog-React-strong-parity`.
- Al comenzar la implementación ya existían estos cambios del propietario: `AGENTS.md` eliminado, `docs/BUNDLE_REPORT.md` modificado, y los no rastreados `android/build-broken-20261026/` y `docs/superpowers/plans/2026-10-26-strong-workout-parity.md`. **No restaurar, borrar ni sobrescribir esos cambios sin autorización.**
- La inspección actual de Git, antes de crear este archivo, mostró **101 archivos rastreados modificados/eliminados y 24 entradas no rastreadas**, sin archivos staged. El `diff --stat` de rastreados informó `+3710/-1115` líneas e incluye los cambios preexistentes señalados arriba; no incluye el contenido de los archivos no rastreados.
- No se hizo commit, reset ni revert. Hay cambios tanto en código existente como en archivos nuevos no rastreados. Antes de cualquier reversión selectiva, revisar cuidadosamente cada archivo y preservar los cambios previos del propietario.
- El emulador se cerró al recibir la orden de parar. Se había iniciado sesión en la cuenta de Strong del propietario; no incluir credenciales, códigos ni datos personales en reportes, archivos, capturas ni logs. Evitar acciones que modifiquen su cuenta o entrenamientos. Si se necesitan pruebas de escritura, usar datos y cuenta de prueba, o una sesión temporal que se descarte.

## Referencia Strong y alcance observado

- Se ejecutó en el emulador la APK modificada `C:/Dev/Strong-installed.apk`, paquete `io.strongapp.strong`, **v6.2.4**, código `602006`, SHA-256 `cab17f314495cf0b7812896dc265981db0bcb35bd3f6a172bd97ea1c1558243c`.
- Es distinta de `C:/Dev/apk-analysis/strong/input/Strong.apk`, v6.2.7, SHA-256 `ea0700cca9c387d82a23ad5d0c1af52e0c4847bafeca6710cf34dbeefcf9e3f1`. No mezclar los resultados de ambas versiones como si fueran la misma.
- La APK v6.2.4 es modificada; su firma fue verificada criptográficamente, **no** contrastada como firma oficial de Strong. El propietario confirmó que quería usar la APK modificada.
- REA/JADX produjo inventarios estáticos en `C:/Dev/apk-analysis/strong/reports-installed/`. Hay ofuscación, no se pudo desensamblar `RestTimerService.onStartCommand`, y apktool no estaba disponible. Una clase o permiso declarado no demuestra comportamiento en ejecución.
- Se observó en el emulador: cinco destinos Profile / History / Workout / Exercises / Measure; opciones de rutina y carpetas; lista y editor de historial; detalle de ejercicio About / History / Charts / Records; ajustes; sección y detalle de medidas; y un entrenamiento vacío con un ejercicio, una serie de prueba y descanso automático. El entrenamiento de prueba se descartó; un entrenamiento histórico se abrió en el editor y se cerró sin guardar.
- Se observó que `Previous set` ofrece **Any workout** y **Workouts from same template only**, y que el manejo de series incompletas ofrece **Ask every time**, **Always complete unfinished sets** y **Always discard unfinished sets**.
- La auditoría **no** revisó todos los estados ni probó terminar y guardar una sesión, editar datos reales, restaurar backups, importar un CSV real, sincronizar dos dispositivos, Health Connect real, acciones en segundo plano, todas las pantallas de plantillas, todos los gestos ni todas las opciones/variantes de Strong. «1:1» sigue sin demostrarse.
- Ayuda oficial útil: [entrenamiento](https://help.strongapp.io/article/229-my-first-workout), [descanso](https://help.strongapp.io/article/231-rest-timer), [detalle de ejercicio](https://help.strongapp.io/article/237-about-exercise-detail), [edición de fecha](https://help.strongapp.io/article/167-adjust-workout-date), [mediciones](https://help.strongapp.io/article/238-add-measurements), [exportación CSV](https://help.strongapp.io/article/235-export-workout-data). Son documentos de distintas fechas: no asumir que cada captura describe exactamente la APK 6.2.4.

## Qué quedó escrito, sin verificación final

Esta lista describe archivos y objetivos de los cambios, **no afirma que estén completos, compilando o funcionando**.

### Logger, series y superseries

- Cambios en `views/workout/`, `hooks/useWorkoutController.ts`, `components/workout/`, `types.ts` y traducciones.
- Se intentó añadir serie `failure`, nota fija `stickyNote`, menú de acciones, controles compactos, manejo de series incompletas al terminar, temporización automática configurable y filtrado de series anteriores.
- Se añadió identidad de plantilla/día en `utils/templateIdentity.ts`, `views/home/applyTemplate.ts`, `services/SessionBuilder.ts`, `services/workoutCompletionService.ts`, modelos, `services/cloudLogsV2.ts` y reglas. Intención: que «misma plantilla» sobreviva a nuevos mesociclos sin asignar identidades falsas a datos históricos.
- **Revisar:** flujo `ask/complete/discard`, validación de series incompletas, lectura de sesión fresca al terminar, actualización de plantilla con los datos ya normalizados, identidad por plantilla/día para planes anteriores, KONG, sesiones libres, importadas, duplicadas y reemplazos. No declarar paridad por el nombre de los campos.

### Temporizador y Android

- Cambios en `hooks/useTimer.ts`, `context/TimerContext.tsx`, `components/ui/restTimer/`, `components/workout/WorkoutRestDock.tsx`, `utils/audio.ts` y `android/app/src/main/java/com/gainslab/pro/NativeBridgePlugin.java`.
- Se intentaron integrar pausa, reanudación, reinicio, ajuste, omisión, contexto de descanso manual y preferencias de sonido/vibración también en segundo plano.
- La revisión estática detectó problemas en: omitir desde notificación pausada, actualizar segundos en pausa, carrera entre Pausa y `+30` nativo, y preferencias de sonido/vibración que no llegaban al lado nativo. Se aplicaron correcciones **después de la última compilación fallida**, sin verificarlas.
- **Revisar:** orden de comandos y snapshots, timer en primer plano/fondo/pantalla bloqueada, restauración tras matar proceso o reiniciar, alarmas exactas y fallback, notificaciones pausadas, configuración del canal Android y sonidos/vibración. Compilar y probar Android; no basta el build web.

### Navegación, perfil y apariencia

- Cambios en `components/layout/Layout.tsx`, `Sidebar.tsx`, `navigation.ts`, `components/layout/strong.css`, `App.tsx`, `components/app/AppViews.tsx`, `hooks/useAppHistory.ts` y componentes nuevos `ProfileDashboard`, `ProfileWidget` y `MeasureWidget`.
- Se intentó añadir la navegación de cinco destinos, ruta de medidas y dashboard de perfil sin quitar acceso a funciones anteriores.
- La revisión detectó ruta de medidas interceptada desde nutrición, Atrás que no cerraba Perfil, desmontaje de la vista bajo Perfil, modo claro forzado a oscuro y foco no restaurado. Se aplicaron correcciones sin verificarlas.
- **Revisar:** todas las rutas, acciones del dashboard, eventos `gainslab:open-measure`, historial del navegador y botón Atrás de Android, foco y lector de pantalla, persistencia del scroll, modo claro/oscuro, tamaños táctiles, responsive, y que nutrición, estadísticas, programas y ajustes anteriores sigan accesibles. Comparar visualmente la versión actual compilada con Strong en la misma resolución y estados, no con capturas de versiones anteriores de IronLog.

### Rutinas y carpetas

- Archivos nuevos `views/home/templateOrganization.ts`, `useTemplateFolders.ts`, `TemplateFolderSheets.tsx`, `PersonalTemplatesSection.tsx`; cambios en `TemplateSelector.tsx`, tipos, contexto, sync, backup y `firestore.rules`.
- Se intentó implementar carpetas, organización de plantillas, renombrar, duplicar, archivar, mover, compartir, importar y borrar, con persistencia.
- La revisión detectó plantillas con carpeta huérfana invisibles, exportación de plantilla sin importador y hoja de acciones que no se actualizaba al mover. Se aplicaron cambios posteriores sin verificarlos.
- **Revisar:** creación/renombrado/eliminación de carpeta sin borrar plantillas; orden; duplicación e IDs; archivadas; importación/exportación completa; hidratación asíncrona y referencias huérfanas; sync y restauración en otro dispositivo; identidad al duplicar o recrear planes; acciones de plantillas del catálogo frente a personales.

### Historial y editor

- Cambios en `utils/historyEdit.ts`, `views/history/`, `views/HistoryView.tsx`, `docs/specs/history-edit.md` y pruebas.
- Se intentó ampliar edición a nombre, fecha y hora, duración, notas, ejercicios, series, tipo, RIR, cardio e isométricos, más guardar como plantilla y deshacer.
- La revisión detectó dos riesgos críticos: edición en libras que podía convertir mal el lastre isométrico al cambiar otro campo, y la imposibilidad de guardar logs con series `failure`. Se aplicaron correcciones y se añadieron pruebas sin ejecutarlas.
- **Revisar:** conversiones kg/lb y km/mi sin deriva, 0 y vacíos, isométricos/cardio, ejercicios o series incompletas, fechas locales y cambios de día/horario, mantener campos no editados, IDs, orden, cálculo de estadísticas/récords, deshacer y sincronización. No probar escribiendo sobre historial real del propietario.

### Biblioteca, detalle, gráficas y récords

- `components/ui/ExerciseDetailModal.tsx`, nuevos componentes en `components/exercises/exerciseDetail/`, `components/stats/ProgressChart.tsx`, utilidades de stats, worker y caché.
- Se intentó presentar About / History / Charts / Records y aplicar fórmulas Epley/Brzycki/Lombardi a récords y gráficas.
- **Revisar:** instrucciones, categorías, preferencias por ejercicio, gráficos sin datos y con datos, cálculos por tipo de ejercicio, tabla de repeticiones real/estimada, unidad, resultados históricos, grupos de ejercicios fusionados y que la caché/worker cambien al cambiar de fórmula. El último build detectó imports faltantes en el detalle; se agregaron después sin recompilar.

### Mediciones

- Archivos nuevos en `components/measurements/`, `hooks/useMeasurements.ts`, `utils/measurements.ts` y `views/MeasureView.tsx`.
- Se intentó añadir peso, grasa, calorías y perímetros corporales, fecha/hora, historial, gráfica, eliminación, exportación CSV, sync V2 y respaldo. Los nuevos registros son independientes de `BodyLog`; las unidades internas previstas son kg, cm, kcal y porcentaje.
- La revisión detectó gráfica recortada por discrepancia entre coordenadas y `viewBox`, widget de perfil que ignoraba mediciones nuevas, fechas inválidas convertidas silenciosamente a «ahora» y problemas de etiquetas/tamaño táctil. Se comunicaron correcciones aplicadas sin probar.
- **Revisar:** que las pesadas antiguas de `bodyLogs` sigan visibles sin duplicación, crear/editar/borrar cada métrica, validaciones y unidades, fechas vacías/inválidas, gráfico de rango completo, accesibilidad, CSV, almacenamiento local, sync, conflictos, respaldo y restauración. No permitir que una medida sin peso cree un peso falso.

### Ajustes, unidades y calculadora de discos

- Cambios en `components/profile/sections/TrainingSection.tsx`, nuevos componentes bajo `components/profile/sections/training/`, `utils/strongTraining.ts`, `hooks/useTrainingConfig.ts`, `utils/plateCalculator.ts`, tipos, contexto, sync, backup y consumidores de estadísticas/nutrición.
- Se intentaron conectar preferencias de series, descanso, unidades independientes, primer día de semana, fórmula de xRM y calculadora de discos.
- Se separó el hook de configuración de los helpers puros para evitar que el worker de estadísticas importe el contexto de la aplicación. La integración debe revisarse sin introducir fallback silencioso ni un segundo almacén de preferencias.
- **Revisar:** cada control debe cambiar efectivamente el comportamiento anunciado, persistir tras recargar, sincronizar y restaurarse. Verificar ámbitos de «previous», opciones de incompletas, actualización de preferencias mientras el timer ya está en curso, todas las conversiones, redondeos, barras/discos disponibles y fórmulas/cachés. No asumir que una UI con un selector significa que todos los consumidores estén conectados.

## Última compilación conocida

1. Primera ejecución `npm run build`: errores de sintaxis en `views/workout/useWorkoutViewState.ts:202`; se añadió una llave y se volvió a ejecutar.
2. Segunda ejecución `npm run build`: **falló** con numerosos errores TypeScript. Entre ellos: `TimerState.endAt` y `TRANSLATIONS` ausentes; imports y estado faltantes en timer, logger, nutrición, medidas, detalle de ejercicios, historial y estadísticas; `MeasurementInput` ausente y `FIELD_BY_KEY` duplicado; `macroGoals` faltante en un contrato de contexto; pruebas con tipos incompatibles.
3. Después varios agentes restauraron declaraciones/imports y aplicaron otras correcciones, pero **no hay tercera ejecución ni resultado final**. Las correcciones reportadas no son evidencia de compilación exitosa.

No se ejecutaron en el estado final `npm run lint`, suite Vitest, pruebas de reglas/integración Firebase, Playwright, build Android ni prueba en dispositivo de los cambios. No se ha comprobado que las pruebas añadidas sean adecuadas o que sus mocks y expectativas no oculten errores.

## Hallazgos que requieren revisión prioritaria antes de usar datos reales

1. **Compilación y regresiones transversales:** comprobar que los imports/variables restaurados correspondan a la lógica original y que no se hayan perdido acciones, hooks, campos o componentes durante ediciones concurrentes. Una compilación verde por sí sola no demuestra esto.
2. **Integridad del historial:** peso isométrico en lb, `failure`, fecha/hora, notas y unidades; asegurar que editar un campo no modifique otros.
3. **Almacenamiento y recuperación:** carpetas, plantillas y `measurementLogs` a través de IndexedDB, sync legacy/V2, conflictos, `firestore.rules`, auto-backup, export JSON y restore. La revisión detectó un backup solo con plantillas rechazado y un límite de `customFoods` perdido en las reglas de creación; se reportaron correcciones, no verificadas.
4. **Temporizador nativo:** carreras y reconciliación de notificaciones; especialmente pausa → ajustar → fondo → volver, y pausa → Skip desde notificación.
5. **Navegación/perfil/medidas:** eventos, historial y foco; verificar que el panel no oculte o desmonte el estado subyacente, y que el modo claro no quede forzado a oscuro.
6. **Compartición de plantillas:** verificar que el archivo generado realmente pueda importarse, que el contenido se valide antes de aceptar y que no se pierdan campos ni se duplique por ID.
7. **Cobertura 1:1 incompleta:** inspeccionar lo que no se observó en Strong, comparar producto actual y cerrar brechas; revisar por separado funciones adicionales de IronLog para no eliminarlas o alterar datos involuntariamente.

## Secuencia recomendada para retomar

1. Respetar la orden de trabajo actual del propietario y acordar el método de trabajo antes de reiniciar implementación. No lanzar agentes adicionales ni hacer cambios masivos sin su indicación.
2. Revisar `git status` y los cambios existentes; preservar los cambios preexistentes. Crear un respaldo fuera del proyecto si el propietario lo autoriza.
3. Ejecutar `npm run build` para conocer el estado real actual y corregir causas raíz. No asumir que los errores del segundo build siguen idénticos ni que ya desaparecieron.
4. Ejecutar las pruebas pertinentes de unidades, integración y reglas; después las suites correspondientes. Corregir fallas reales, sin desactivar pruebas ni cambiar expectativas solo para hacerlas pasar.
5. Realizar pruebas funcionales con datos aislados: logger + cierre/descartar, temporizador, rutinas/carpetas y share/import, edición de historial con unidades, medidas, settings, backups y sync.
6. Levantar la aplicación actual y hacer revisión visual real frente a Strong v6.2.4 en el emulador, pantalla y estado por pantalla y estado, incluyendo modo claro/oscuro y accesibilidad. El APK de IronLog observado antes era `4.0.3-kong.20`, anterior al árbol de código actual; no usarlo como prueba de los cambios actuales.
7. Compilar y probar Android, incluida la funcionalidad nativa del temporizador en fondo y reanudación. Confirmar reglas y despliegue antes de probar sincronización real; no asumir que las reglas locales ya están desplegadas.
8. Volver a inspeccionar las funciones de Strong aún no observadas y actualizar una matriz de paridad con columnas **observado en Strong / implementado / verificado / pendiente**. Solo afirmar 1:1 cuando exista evidencia para cada criterio acordado.

## Acceso a la demostración anterior

Se generó una maqueta exploratoria en `C:/Dev/outputs/strong-parity-demo.html` y una captura `C:/Dev/outputs/strong-parity-demo.webp`. Son archivos locales de la PC; el propietario indicó que **no podía abrirlos desde su celular**. Son una propuesta estática, no una demostración funcional ni una captura de la APK actual. No publicarlos externamente ni exponer capturas con datos personales sin autorización.
