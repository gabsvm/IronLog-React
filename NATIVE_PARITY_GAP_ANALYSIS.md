# Native App Parity Gap Analysis

Fecha: 2026-06-28

## Objetivo

Lograr paridad visual y funcional entre la app nativa KMP/Compose (`ironlog-kmp/`) y la PWA React actual.

## Estado actual resumido

La app nativa ya tiene base sólida en:

- estado global con `AppStore`
- persistencia local Room offline-first
- navegación principal
- editor de mesociclos
- biblioteca de ejercicios
- stats básicas
- historial básico
- nutrición básica

Pero hoy la PWA sigue siendo claramente la referencia de producto en dos frentes:

1. profundidad funcional
2. refinamiento visual y de interacción

## Paridad funcional: brecha principal

### 1. Home / Meso activo

La PWA tiene:

- card principal “Up Next” mucho más rica
- progreso semanal y recap
- heatmap de consistencia
- warnings de fatiga / deload
- templates globales
- guidelines por template
- repeat last session
- quick launcher de freestyle / crossfit / calistenia
- tutoriales / onboarding más completos
- settings del mesociclo con más controles

La nativa hoy tiene:

- selección básica de día
- start session
- CTA de acciones rápidas

### 2. Workout runtime

La PWA tiene un runtime mucho más avanzado:

- controlador completo de sets
- reorder drag & drop
- replace exercise / add exercise
- detail modal por ejercicio
- banners de protocolo
- timers embebidos
- plate calculator
- warmup modal
- feedback modal
- summary view
- PR detection / historical context
- soporte freestyle completo

La nativa parece tener la sesión activa base, pero no está al nivel de profundidad del flujo React.

### 3. Nutrición

La PWA tiene:

- subtabs `Today`, `Body`, `History`
- goals editables
- tracking de agua real persistido
- cardio logging
- body logs / peso
- historia de 14 días
- edición y borrado con undo
- modales ricos

La nativa hoy está muy por detrás:

- usa una sola vista simple
- goal calórico hardcodeado
- fecha hardcodeada
- agua no persistida realmente
- no hay subtabs ni cuerpo/historial
- no hay cardio ni body tracking equivalente

### 4. History

La PWA tiene:

- virtualización
- expansión por sesión
- delete flow
- export CSV
- bloqueo/pro gating en ciertas áreas

La nativa hoy muestra cards simples.

### 5. Stats

La PWA tiene:

- overview más profundo
- charts por ejercicio
- picker/búsqueda
- historial de PRs
- cálculos dedicados

La nativa hoy cubre solo volumen muscular básico y PRs simples.

### 6. Settings / cuenta / sync

La PWA tiene:

- modal de settings más amplio
- preferencias
- configuración de entrenamiento
- login/sync/export/import
- toggles de features
- paneles admin/pro

La nativa hoy tiene:

- editor de meso
- ejercicios
- stats
- selector de color

### 7. IA

La PWA tiene:

- `GainsLabChat`
- análisis de contexto
- creación y modificación de rutinas
- quick prompts

La nativa no tiene equivalente hoy.

## Paridad visual: brecha principal

La PWA tiene una identidad bastante marcada:

- header translúcido
- navegación bottom edge-to-edge refinada
- FAB integrado
- glass cards / glass panels
- tipografía con jerarquías muy marcadas
- badges, pills, micro-estados y sombras más premium
- layouts con mejor densidad visual
- motion y transiciones más cuidadas

La nativa hoy replica intención general, pero todavía se ve más “Material básico” que “producto premium”.

## Problemas concretos detectados en la nativa

- `NutritionTab` usa fecha fija `2026-06-28`
- `NutritionTab` usa calorías objetivo mockeadas
- `waterCount` es local y no persistente
- varias strings muestran problemas de encoding
- la navegación inferior no replica todavía el comportamiento visual de la PWA
- faltan estados intermedios y componentes reutilizables equivalentes a `glass-card`, `sheet`, `modal`, `chip`, `hero card`

## Orden recomendado de trabajo

### Fase 1. Shell visual compartido

Construir primero la base visual Compose:

- tokens de spacing
- escala tipográfica
- componentes glass
- top header
- bottom nav + FAB
- cards, pills, sheets, dialogs
- sombras, bordes, gradientes, estados pressed

Sin esto, cualquier feature nueva sigue viéndose inferior a la PWA.

### Fase 2. Home parity

Llevar Home/Active Meso a paridad visual y funcional:

- hero card “Up Next”
- progreso semanal
- quick launcher freestyle
- repeat last session
- heatmap / recap
- meso settings ricos

### Fase 3. Workout parity

Después, cerrar el core del producto:

- runtime de sesión
- modales auxiliares
- summary
- protocolos / banners / rest UX

### Fase 4. Nutrition parity

Migrar por vertical completa:

- tabs Today / Body / History
- goals persistidos
- water tracking persistido
- cardio
- body logs
- edición y undo

### Fase 5. History + Stats parity

Expandir data surfaces con UX equivalente.

### Fase 6. Settings + Sync + AI

- sync real con Firebase nativo
- cuenta / preferencias
- GainsLab AI nativo

## Recomendación práctica

No conviene atacar “todo Compose” a la vez. La forma más segura es migrar por verticales de experiencia:

1. shell visual
2. home
3. workout
4. nutrition
5. history/stats
6. settings/sync/AI

## Próximo paso recomendado

Empezar por `ironlog-kmp/composeApp/src/commonMain/kotlin/com/gainslab/ironlog/App.kt` y extraer un design system base para:

- header nativo premium
- bottom nav equivalente a la PWA
- card styles reutilizables
- chips/badges/buttons coherentes

Ese paso desbloquea la paridad visual del resto de pantallas y evita re-trabajo.
