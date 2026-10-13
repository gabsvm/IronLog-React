# Feature Spec — Rediseño ligero (concepto Expressive)

> **Estado:** Implementado (2026-10-12), pendiente de validación del propietario en dispositivo.
> **Producto:** IronLog / GainsLab Pro (PWA + Capacitor) es la app principal. GainsLab nativa (KMP) queda pausada.
> **Referencias:** `C:\Dev\GainsLab\docs\design\references\concepto-01-oscuro-expressive.png` (oscuro) y `concepto-02-claro-tonal.html` (claro). Son propuestas, no capturas de producción.
> **Modo del estándar:** Estándar, en incrementos pequeños.

## 1. Problema y resultado esperado

IronLog ya comparte con el concepto el acento lima `#c4f13a`, la barra inferior con "+" central y Dieta, el programa por días y las tarjetas por función. Falta el acabado: formas más redondeadas, jerarquía más clara y tres piezas del concepto que no existen igual (progreso de sesión en el entreno, descanso acoplado con anillo, resumen de Stats con tarjetas). "Ligero" = acercarse al concepto sin reescribir pantallas ni cambiar funcionalidad.

## 2. Alcance explícito

**Incluye:**
1. Tokens visuales: radios, tono de superficies y bordes en oscuro y claro (variables CSS/Tailwind, no pantallas sueltas).
2. Entreno activo: tarjeta de **progreso de sesión** (tiempo, series hechas/totales, barra) y tarjetas de ejercicio más redondeadas.
3. **Descanso**: píldora acoplada sobre la barra inferior con anillo de progreso, tiempo, ±, y omitir (reusa la lógica actual).
4. Home y Stats: titulares y tarjetas de resumen según el concepto, con los datos reales.

**Fuera de alcance:**
- Cambios de datos, sincronización, reglas de negocio, RPE/RIR, navegación, idiomas.
- Reescribir pantallas no listadas (Historial, Ejercicios, Perfil, Dieta heredan solo los tokens).
- Datos de ejemplo del concepto (KONG, "Semana 3", "85 kg") y la pestaña de tema claro tonal con tarjetas lila/menta: se evalúa tras ver el resultado en oscuro.

## 3. Reglas e invariantes

- Español neutro; áreas táctiles ≥ 44 px; movimiento reducido respetado (`reducedEffects`).
- El acento sigue siendo elegible (6 colores). Nada de colores fijos lima en los componentes nuevos: usar `primary-*`.
- Sin dependencias nuevas.
- Cada incremento deja `tsc`, lint y tests en verde (`npm test`).

## 4. Criterios de aceptación

- [ ] Radios y superficies actualizados se ven coherentes en Home, Entreno, Historial, Stats, Dieta y Perfil, en oscuro y claro (captura visual).
- [ ] El entreno muestra tiempo, series hechas/totales y barra de progreso, y se actualiza al completar series.
- [ ] El descanso acoplado no cubre campos en edición (conserva el comportamiento con teclado) y mantiene −10/+30/omitir y la vibración.
- [ ] Stats muestra el resumen en tarjetas con datos reales.
- [ ] Tests existentes en verde; los snapshots visuales se regeneran de forma intencional.

## 5. Dependencias y riesgos

- Los snapshots visuales (`tests/visual`, `maxDiffPixels: 0`) cambiarán a propósito; se regeneran con `npm run test:visual:update` tras cada incremento aprobado.
- Tests unitarios que fijan clases CSS (p. ej. `uiConsistency.test.ts`) pueden requerir ajuste.

## 6. Decisiones pendientes

- Resuelta: el tema claro adopta la paleta cálida y tarjetas tonales del concepto 02 (variables en `index.css`, clases `.tonal-1..4` y hero de Home en menta). Solo afecta al modo claro.

## 7. Evidencia de cierre

- `tsc` limpio; 139 archivos / 783 pruebas en verde; capturas visuales regeneradas (oscuro y claro) y revisadas para Home, Entreno, Estadísticas, Historial, Dieta y Perfil. Nota: Playwright tolera diferencias pequeñas de color (umbral por píxel), por lo que al cambiar tonos hay que borrar los PNG antes de `test:visual:update`.
- Sin validación en dispositivo del anillo de descanso (no sale en las capturas).
