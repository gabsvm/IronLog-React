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

## 8. Pasada de consistencia Expressive (2026-10-13)

Aplicada **directamente** en `agent/gainslab-audit-fixes-v3`, sin tocar `main`, sin crear otra rama y sin promocionar Vercel manualmente.

- Tema claro: `--text-muted: #535e4e` en lugar de `#7d8478`; contraste calculado >= 5:1 en los fondos lila, menta, azul y durazno originales. Nueva prueba automatizada de contraste real para las cuatro tarjetas de Stats.
- Tokens globales de forma/movimiento y tarjetas de 24 px; segmentos de 18 px. CTA principal tipo píldora de 48 px como mínimo.
- Tonalidad del tema claro mezclada ligeramente con el acento elegido; la tarjeta hero principal responde al color de acento. En oscuro, las tarjetas tonales reciben una capa tenue del acento.
- Barra inferior: selección tonal en forma de píldora, tipografía de 12 px sin mayúsculas forzadas y estados de iconografía coherentes.
- Selector de días: mínimo 56 px, etiqueta de 11 px, nombre de 13 px y `aria-pressed`.
- Stats: etiquetas legibles de 12 px y contraste del texto sobre cada superficie tonal.
- Entreno: barra de progreso con rol semántico y lectura accesible; tarjeta de resumen tonal.
- Descanso: píldora que se adapta a 320 px; al aparecer teclado oculta acciones secundarias y se acopla junto al encabezado; la lista reserva espacio superior. El modo expandido vuelve a compacto al abrirse el teclado.
- Movimiento reducido del sistema y `data-effects="reduced"` respetados en la nueva clase `expressive-press`.
- Pruebas Playwright adicionales: teléfono estrecho 320 px y contraste WCAG AA; `npm run verify:expressive` para ejecutarlas sin depender de snapshots anteriores.

**Evidencia/limitaciones:** los resultados de 783 pruebas, 16 capturas y `tsc` citados arriba corresponden a la implementación anterior. Esta pasada se aplicó mediante la conexión GitHub, sin checkout local ni ejecución de npm/Playwright: aún deben ejecutarse `npm run verify`, `npm run verify:expressive`, `npm run test:visual:update` (solo tras revisar los nuevos PNG), `npm run test:visual` y una prueba en Android con teclado y descanso activos. No confundir commit/push correcto con suite validada.


## 9. Premium Expressive — pasada final (2026-10-13)

Implementado directamente en `agent/gainslab-audit-fixes-v3` a partir del prototipo interactivo Premium Expressive Lab. Sin nuevos paquetes, sin pantallas o datos ficticios, sin tocar `main` ni promover Production.

- **Home:** `HomeHeroCard` usa una composición editorial más distintiva, un motivo de pesa hecho con SVG inline, un CTA primario claro y los ejercicios/series reales del día. Admite todos los acentos y ambos temas; conserva empezar/reanudar/repetir/omitir sin cambiar la lógica de KONG. `HomeRecapStrip` mantiene la misma información y ofrece mejor jerarquía.
- **Stats:** `utils/premiumInsights.ts` deriva del historial filtrado por el scope actual (plan/histórico) las series de trabajo completadas de cuatro ventanas móviles de 7 días y la mejor serie con carga por e1RM de Epley; se excluyen saltadas, warmups, AVT hops, cardio, isométricos y peso corporal al identificar la marca. Se muestra la carga real anotada, no el e1RM como una cifra levantada, y se etiqueta como **mejor serie registrada**, no «nuevo PR». Sin semanas comparables, no se inventa crecimiento. `PremiumTrendCard` muestra un SVG con los datos y fallback vacío.
- **Entreno:** `SetRow` conserva tamaños, foco, orden y lógica de confirmación; las series siguientes/completadas reciben una transición de color/borde muy ligera; nunca se animan las filas en su posición.
- **Dieta, Historial, Perfil:** reutilizan una familia de superficies tonales contenidas; no se añaden tarjetas extra a listas ni se afecta la virtualización de Historial.
- **Accesibilidad y rendimiento:** el SVG de Home es decorativo, el gráfico de Stats ofrece una descripción legible y todos los movimientos añadidos respetan `prefers-reduced-motion` y el ajuste reducido de la aplicación.
- **Pruebas añadidas:** `tests/unit/premiumInsights.test.ts` cubre conteo, scope, marcas, fechas futuras y estados vacíos; la suite visual contiene un test funcional de los elementos Premium para ambos temas.

**Validación:** el Preview intermedio compiló con TypeScript + Vite. El Preview final debe comprobar el SHA final. Quedan por ejecutar en un entorno con checkout y navegador los comandos `npm run verify`, `npm run verify:expressive` y la regresión visual completa con regeneración revisada de baselines. No asumir que capturas antiguas son compatibles: el rediseño cambia la interfaz intencionalmente. Falta la inspección física Android y prueba del teclado/temporizador.


## 10. Unificación final de pantallas secundarias (2026-10-13)

Aplicada **en la misma branch** `agent/gainslab-audit-fixes-v3`. No se ha cambiado la lógica de negocio ni las reglas de KONG, ejercicio, carga, edición de series, sincronización o nutrición.

- **Dieta / Cuerpo e Historial:** tarjetas `premium-theme-panel`, mejor tipografía, controles de peso táctiles y gráficos de 14 días con marcas legibles cada tres días, valores exactos en `title` y respeto de ambas unidades. Las tres subtabs comparten la segmentación Expressive con `aria-pressed`.
- **Stats / Resumen, Progreso y Volumen:** tarjetas y contenedores de gráfico con la misma familia de superficies, pestañas y encabezados legibles; sin tocar las fórmulas o el filtrado de datos.
- **Cierre del entrenamiento:** portada de conclusión `premium-summary-hero` con datos de la sesión real (tiempo, series y volumen), espacios y escalas de texto uniformes, sin recompensas ficticias. Se preservaron compartir PNG y volver al Home.
- **Biblioteca de ejercicios y editor de programas:** encabezados, filtros, inputs, tarjetas y estados seleccionados modernizados. Sin eliminar ni modificar operaciones de edición, creación, filtro, merge y guardado.
- **Historial, Perfil y modales secundarios:** tarjetas de detalles y edición, confirmación, calentamiento y detalles/selector de ejercicios armonizados. Se mantienen el sheet común, los diálogos y los mensajes.
- **KONG:** retoque mínimo del hero y formas de las tarjetas; la planificación y estados de programa no cambian.
- **Tokens:** clases reutilizables `premium-summary-hero`, `premium-form-input`, `premium-editor-card`, `premium-filter-pill`, `premium-section-heading` y `premium-quiet-row`. Se evita sustituir globalmente estilos viejos: algunos remapeos del modo claro continúan para compatibilidad con vistas no migradas.
- **Pruebas:** nuevas comprobaciones visuales funcionales de la navegación entre Hoy/Cuerpo/Tendencias a 320px. Se migraron textos bilingües de Home y PremiumTrend a `pickLang` para respetar el contador Q19 de traducciones inline y se actualizó el contrato tipográfico de navegación a 12px.

**Cierre pendiente:** correr `npm run verify`, ejecutar Playwright `npm run verify:expressive`, revisar/actualizar baselines visuales en el entorno del propietario y probar Android físico (teclado, temporizador y navegación). Un build Preview READY no sustituye estas comprobaciones.
