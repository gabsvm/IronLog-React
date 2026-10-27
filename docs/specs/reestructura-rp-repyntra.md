# Reestructura tipo RP (Enfoque B) + renombre a Repyntra

Estado: implementado y auditado (2026-10-27). Verificación: lint 0, build 0, unit 810/810, visual Playwright 23/23 tras actualizar baselines (cambios aprobados) y adaptar 3 selectores del hero eliminado.
Modo: Estándar (feature multi-pantalla, sin cambio de datos ni de permisos).

## 1. Objetivo y alcance

Reorganizar la presentación de la app con la misma estructura de uso de la app
RP Hypertrophy (hub del mesociclo → semana → días → sesión con objetivo/log →
feedback por músculo → progresión), manteniendo intactos lógica, motores,
datos y el estilo visual actual (oscuro `#050506`, lima, Inter, radios amplios).

Confirmado por el propietario:
- Nombre nuevo: **Repyntra** (preferido) o RepIntra (alternativo). Este spec usa Repyntra.
- Iconos/logos: reutilizar la marca de `C:\Dev\GainsLab` (matraz + barras +
  flecha lima `#C6FF00` en círculo, sobre negro). El símbolo se conserva; solo
  se re-rotula el wordmark de "GainsLab" a "Repyntra".
- Enfoque B: reestructura de organización en varias pantallas, sin reescribir lógica.

Fuera de alcance:
- Copiar textos, imágenes, vídeos, plantillas propietarias o trade dress de RP.
- Cambiar motores de progresión/feedback, modelo de datos, sync o permisos.
- Cambiar `appId` Android (`com.gainslab.pro`): rompería actualizaciones y firma.
  Solo cambian nombre visible, título, manifest y textos de marca.
- Nutrición: no forma parte del flujo RP de hipertrofia; queda como vista secundaria igual.

## 2. Evidencia y límites

- Repo actual: vistas home/workout/history/stats/nutrition/exercises/program/summary;
  barra inferior en `components/layout/Layout.tsx` (Entrenar·Historial·(+)·Dieta·Stats);
  Home en `views/HomeViewImpl.tsx` con hero dominante de "próxima sesión".
- RP (página oficial y fichas de tienda, 2026-10-27): plantillas o mesociclo
  personalizado, objetivo semanal de peso/reps, feedback de pump/soreness/workload
  que ajusta la semana siguiente, biblioteca con vídeos, deload por mesociclo.
- Sin cuenta RP no hay medidas píxel a píxel de su app. La réplica es de
  organización/jerarquía/espaciado de sistema propio, no métrica de RP.
  Si el propietario aporta capturas/grabación, se ajustan medidas en una enmienda.
- Nombre vetado por búsqueda web exacta (2026-10-27): sin app de fitness ni uso
  comercial visible para "Repyntra" ni "RepIntra". No es clearance legal:
  antes de publicar, verificar EUIPO/USPTO/WIPO, App Store, Google Play y dominio.

## 3. Estructura objetivo (orden y jerarquía por pantalla)

Sistema de espaciado único en pantallas tocadas: margen lateral 16px,
separación vertical entre bloques 16px, entre filas 8px, radio tarjeta 24px,
objetivos táctiles ≥44px. Son valores del sistema actual, unificados.

### 3.1 Home = hub del mesociclo
1. Cabecera: nombre del mesociclo + "Semana X de Y" + acción de plan (⋯).
2. Selector de semana (anterior/siguiente + indicador de deload si aplica).
3. Lista de días de la semana en filas: nombre, músculos, estado
   (completado / hoy / pendiente), sets totales; toque abre el día.
4. Acción primaria del día seleccionado: "Entrenar" (sustituye al hero dominante).
5. Recap semanal compacto debajo (hechos/planeados, racha), reutilizando
   `HomeRecapStrip` sin cambios de datos.
6. Sesión libre como fila secundaria al final.

Se conserva `useHomeViewState` como única fuente de estado; cambian solo
componentes de render de `views/home/`.

### 3.2 Sesión (Workout)
1. Cabecera fija: día, semana, progreso de ejercicios, descartar/terminar.
2. Ejercicios en tarjetas en orden del programa; cada una con sets en filas
   objetivo (peso×reps objetivo, RIR objetivo) + entrada real, en ese orden visual.
3. Añadir/reemplazar ejercicio y temporizador de descanso: comportamiento actual.
4. Cierre: feedback por músculo trabajado (pump, soreness, workload) como paso
   final obligatorio-omitible, reutilizando `FeedbackModal` y su guardado actual;
   después, resumen de sesión existente.

### 3.3 Programa y biblioteca
1. `ProgramHub`: primero plantillas, después "crear mesociclo", después mi programa.
2. Ejercicios: buscador arriba, lista por músculo; detalle con historial como hoy.

### 3.4 Navegación
Sin cambios de destinos ni de barra inferior en esta fase. Solo cambia el
orden interno de Home/Programa para que el primer destino se comporte como
hub del mesociclo. Cualquier cambio de pestañas queda fuera (enmienda aparte).

### 3.5 Renombre e identidad
- Visible: título, `application-name`, manifest (`name`/`short_name`),
  `appName` Capacitor, textos "GainsLab" en UI/onboarding y `Logo` (`showText`).
- Activos: copiar desde `C:\Dev\GainsLab\assets\` el icono
  (`Gainslab-icono.png`, `icon.png`, adaptativos Android) a
  `public/assets/branding/` y `public/assets/icons/` con nombres `repyntra-*`,
  generando los tamaños existentes (48–512) desde el mayor.
- Interno sin cambios: paquete npm, `appId`, rutas de datos, claves de
  almacenamiento y firmas. Evita migración de datos de usuarios.

## 4. Criterios de aceptación verificables

1. Home muestra, en este orden visual: cabecera del meso, selector de semana,
   lista de días con estado, acción Entrenar, recap. Sin hero dominante.
2. Iniciar sesión desde la fila/acción del día crea la misma sesión que hoy
   (mismos ejercicios, sets y objetivos) — test de flujo existente en verde.
3. La sesión muestra objetivo antes/junto a la entrada real en cada set y el
   feedback por músculo aparece al terminar, guardando lo mismo que hoy.
4. Ningún test existente pasa a rojo; `npm run lint` y `npm run build` en verde.
5. La app se presenta como Repyntra en título, manifest, logo con texto y
   onboarding; el icono es el símbolo de GainsLab reutilizado.
6. Datos de un usuario existente (meso, logs, ajustes) se cargan igual tras el
   renombre: sin cambios de claves ni de `appId`.

## 5. Riesgos

- P2: regresión visual en Home al retirar el hero (mitigación: tests visuales
  Playwright existentes + revisión en 390px).
- P2: renombre parcial que deje "GainsLab" visible (mitigación: barrido
  `search "GainsLab"` en superficies visibles al cerrar la tarea).
- P3: nombre con colisión no visible en web (mitigación: chequeo de registros
  antes de publicar; no bloquea el desarrollo).
