# Feature Spec — Editar un entrenamiento guardado

> **Estado:** Implementado (pendiente de prueba manual en dispositivo). Aprobado por el propietario ("hazlas todas", 2026-10-12); alcance acotado por este documento
> **Modo:** Crítico (datos reales, sincronización en la nube, PRs derivados)
> **Origen:** `HistoryEditor` de GainsLab (kmp), adaptado al modelo de IronLog

## 1. Problema y resultado esperado
Un error de tipeo en un entrenamiento terminado queda para siempre en historial, PRs y gráficos; hoy solo se puede borrar la sesión entera. El usuario puede corregir pesos y reps, quitar un set o agregar uno olvidado, y la nube y las estadísticas reflejan la corrección.

## 2. Camino feliz
Historial → abrir un entrenamiento → **Editar** → cambiar peso/reps, quitar o agregar sets, editar la nota → **Guardar** → aviso "Cambios guardados" con **Deshacer**.

## 3. Alcance
**Incluye:** peso y reps de sets completados de fuerza/peso corporal; quitar un set completado; agregar un set completado a un ejercicio (copia el último set); editar la nota de la sesión; descartar con confirmación si hay cambios; deshacer tras guardar.
**Fuera de alcance:** fecha/hora/duración, nombre, agregar o quitar ejercicios, cambiar tipo de set, RIR, y sets de cardio/isométricos (se muestran solo lectura); mover entre mesociclos.

## 4. Invariantes
- `id`, `startTime`, `endTime`, `mesoId`, `week`, `dayIdx`, `programSystem`, `importKey` y todo lo no listado en el alcance no cambian.
- Los pesos se guardan siempre en kg; un set cuyo valor mostrado no cambió conserva su valor original exacto (sin deriva por lb↔kg).
- Guardar sube `updatedAt` a `max(ahora, previo + 1)` para ganar el merge por último-escritor de la nube V2. Sin cambios reales no se escribe nada.
- Validación al guardar: peso vacío o 0–1500 kg; reps enteras 1–1000; el entrenamiento no puede quedar sin sets completados (para eso existe borrar).
- Deshacer restaura el log original con un `updatedAt` aún mayor. Cancelar nunca modifica datos.

## 5. Criterios de aceptación
- [ ] Editar peso/reps y guardar actualiza el log, el resumen y, tras sincronizar, la nube; una sesión sin cambios no marca nada.
- [ ] Valores inválidos bloquean Guardar y marcan el campo.
- [ ] En lb, guardar sin tocar un set no altera su peso almacenado.
- [ ] Salir con cambios pide confirmación; Deshacer devuelve el log previo.
- [ ] Estadísticas/PRs reflejan la edición (la firma de caché ya incluye peso y reps).

## 6. Riesgos / decisiones pendientes
- Dos dispositivos editando la misma sesión a la vez: gana el `updatedAt` más reciente (comportamiento V2 vigente, sin resolución campo a campo).
- Editar fecha/hora y ejercicios queda para otra iteración (afecta orden, mesociclo y progresión).

## 7. Evidencia de cierre
- **Tests (unit/componente):** `historyEdit` (núcleo puro), `historyDetailEdit` (flujo de UI) e `historyEditSync` (merge y subida contra `cloudLogsV2`); `tsc`, `npm run lint`, `lint:a11y` limpios; suite completa 136 archivos / 771 tests; build dentro del presupuesto de bundle.
- **No probado:** sincronización real contra Firebase y dispositivo físico/APK. Una corrida completa mostró 2 fallos no reproducibles en dos corridas posteriores (inestabilidad bajo carga, sin identificar).
- **Limitación conocida:** el merge V2 depende del reloj del dispositivo; con un reloj muy atrasado respecto a la copia en la nube, una edición de un log sin `updatedAt` previo podría perder frente a ella.
- **Resultado:** Aprobar con observaciones.
