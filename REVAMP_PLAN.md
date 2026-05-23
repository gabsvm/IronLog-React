# UI/UX Revamp Plan — IronLog-React

> Auditoría realizada 2026-05-23. Este archivo se actualiza conforme cerramos fases.

## Diagnóstico

**Lo sólido (no tocar):**
- Sistema de color con CSS vars + 6 temas
- Glassmorphism + floating-island nav (patrón iOS 17/18)
- Safe areas (`pt-safe`, `pb-safe`)
- View Transitions API cableado en CSS
- dvh + OLED black base
- react-virtuoso en HistoryView

**Lo que chirría (16 hallazgos clasificados):**
1. Cero `prefers-reduced-motion` — viola WCAG 2.3.3
2. Sólo 7 `aria-label` en todo el repo — screen readers ciegos
3. "Hamburger" abre SettingsModal monolítico de 426 líneas: cajón de sastre
4. Animaciones inconsistentes (durations 200/300/400/500 sin sistema)
5. `transition-all` masivo — anti-patrón de performance
6. Sin biblioteca de animación (framer-motion a mano)
7. 7 modales con z-index distintos sin tokens (60/80/100/500)
8. Bottom-sheet sin gestures (drag handle visual no responde)
9. `font-black` para todo — sin jerarquía tipográfica
10. Z-index sin sistema → conflictos garantizados
11. SortableExerciseCard.tsx = 893 líneas monolíticas
12. Sin `focus-visible` global — navegación teclado invisible
13. Haptics planos, sin diferenciar light/heavy/selection
14. Icon fallback silencioso (cuadrito gris) → bugs reales
15. HomeView 1104 líneas, NutriView 961
16. SettingsModal mezcla rol nav + config → IA rota

## Veredicto

Revamp **parcial**. Mantén el esqueleto visual. Refactoriza sistema + reorganiza navegación.

## Plan por fases

### Fase 1 — Sistema de diseño (1–2d, ROI alto) ✅ HECHA
- [x] Tokens en tailwind.config: `transitionDuration: { fast: 150, base: 200, slow: 300, sheet: 400 }` + easing `natural`
- [x] Tokens `zIndex: { nav, dropdown, sheet, modal, toast, confirm, celebration, tutorial }` y migración batch: 36 ocurrencias `z-[NNN]` → tokens. Solo queda el ref en este doc.
- [x] `prefers-reduced-motion` en `:root` — colapsa todas las animaciones + view transitions
- [x] `focus-visible` global en `@layer base` — buttons/links/role=button/tab muestran ring 2px primary cuando se navega por teclado
- [x] Icon fallback ruidoso: caja roja con "!" + `console.warn` en DEV. Invisible en PROD (no asusta usuarios).
- [ ] Pendiente menor: escala tipográfica (matar `text-[9/10/11px]` arbitrarios) — disruptivo, se posterga
- [ ] Pendiente menor: reemplazar `transition-all` masivo (170 ocurrencias) — bajo ROI, se evalúa caso a caso

### Fase 2 — Reorganizar navegación (0.5d, impacto UX máximo) ✅ HECHA
- [x] Top-right: cambiar `Menu` icon → avatar/iniciales (`components/ui/Avatar.tsx`) con inicial del email + crown PRO + photoURL si existe
- [x] Avatar abre el SettingsModal (tabbed)
- [x] FAB "+" junto al nav island → Command Palette estilo Linear (`components/ui/CommandPalette.tsx`):
  - Reanudar sesión activa (si existe)
  - Continuar mesociclo (si hay activeMeso)
  - Two Block Mass
  - Sesión libre / WOD / Skill (FreestyleSessionModal)
  - Editar mi programa
  - Search + ↑↓ + Enter + ESC
- [x] SettingsModal refactor → 3 tabs: **Cuenta** / **Preferencias** / **Avanzado**
- [x] Sacar botón "Two Block Mass" de Settings → vive en el Command Palette

### Fase 3 — Sistema de modales (1d) ✅ 95% HECHA
- [x] Adoptar `vaul` (^1.1)
- [x] Crear `components/ui/Sheet.tsx` primitive — bottom drawer con drag-to-dismiss, focus trap, ESC, role=dialog auto. Variantes `sheet` (max-h 92vh, rounded) y `full` (edge-to-edge).
- [x] **Migrados a Sheet (6)**: TwoBlockMassModal, WarmupModal, PlateCalculatorModal, FeedbackModal, ExerciseDetailModal, PDFImportModal
- [x] **A11y patch (no migrados a Sheet, son centered dialogs)**: ConfirmModal, OnboardingModal, PaywallModal, AuthModal con `role=dialog` + `aria-modal=true` + `aria-labelledby`
- [x] CommandPalette: NO migrar — layout top-positioned palette no encaja con bottom-sheet. Se queda con framer puro.
- [ ] Pendientes menores: ExerciseSelector (full-screen propio, complejo), FreestyleSessionModal (similar), SettingsModal (drawer derecho), PRCelebrationOverlay (overlay especial).

### Fase 4 — Animaciones (0.5d) ✅ HECHA
- [x] Instalar `framer-motion` (^12.40)
- [x] AnimatePresence en CommandPalette + TwoBlockMassModal — animan al abrir y al cerrar (antes desaparecían en seco)
- [x] LayoutGroup-style `layout="position"` en SortableExerciseCard — los reorders post-drag y cuando una card cambia de tamaño (set añadido / eliminado / superset linkeado) animan suaves
- [ ] Pendiente: Shared element card→focus mode (requiere refactor de focus mode primero)
- [ ] Pendiente: AnimatePresence en el resto de modales (ExerciseSelector, SettingsModal, FreestyleSessionModal) — convergerá con Fase 3 (sistema unificado de modales con vaul/radix)

### Fase 5 — A11y mínimo viable (0.5d) ✅ HECHA
- [x] +22 `aria-label` añadidos por batch en botones-icono más visibles (close, back, next, settings, add, remove, etc) en 15 archivos
- [x] `focus-visible` global ring 2px primary en buttons/links/role=button/tab (hecho en Fase 1)
- [x] `role="dialog"` + `aria-modal="true"` en modales: vaul lo añade automático a los migrados a Sheet; manualmente en ConfirmModal, OnboardingModal, PaywallModal, AuthModal
- [x] Subió cobertura aria-label de 7 → 49 ocurrencias (~7x)
- [x] `eslint-plugin-jsx-a11y` + `react-hooks` instalados con flat config (eslint v9). Script `npm run lint:a11y`.
- [x] **2 rules-of-hooks bugs reales arreglados** que el lint expuso: SkillProgressionBadge y WorkoutView llamaban `useMemo` después de un early-return condicional. Latente.

### Fase 6 — Refactor monolitos (gradual, requiere sesión dedicada) ⏳ PENDIENTE
> **Aviso**: NO se hace en blanket porque cada split altera muchas referencias y requiere validación funcional. Plan por componente:

#### `components/workout/SortableExerciseCard.tsx` (893 → 655 líneas, **-238 / -27%**) ✅ Hecho
- [x] `SparkLine.tsx` (41 líneas) — SVG sparkline reusable
- [x] `ExerciseProtocolBanners.tsx` (89 líneas) — EMOM/Myorep/Cluster/Giant/TopBackoff/Tabata/HIIT banners
- [x] `ExerciseCardMenu.tsx` (201 líneas) — dropdown con role=menu + menuitemradio + delete inline confirm
- [x] `RestPresetSheet.tsx` (72 líneas) — usa el Sheet primitive
- [x] `ExerciseCardSets.tsx` (168 líneas) — column header row + SetRow map + AVTRoundCard map
- [x] `ExerciseCardStats.tsx` (86 líneas) — historical best + 1RM sparkline + overload pill + last note + progress bar
- [ ] Opcional menor: extraer `ExerciseCardHeader` (drag handle + badges + title + info button + warmup btn + menu trigger). Tiene muchas deps (`useSortable` attrs, `useTimerContext`), bajaría otro ~120. No urgente.

#### `views/HomeView.tsx` (1104 → 672 líneas, **-432 / -39%**) ✅ Hecho
Extraído en `views/home/`:
- `GuidelinesModal.tsx` — visor de imágenes con zoom + pan + role=dialog
- `TemplateSelector.tsx` — picker de templates al iniciar mesociclo
- `WeekProgress.tsx` — barra de progreso semanal con role=progressbar
- `WeeklyRecapCard.tsx` — stats 7-días con PR detection
- `NextSessionCard.tsx` — hero card "Up Next" con week-complete state

#### `views/NutriView.tsx` (961 → 829 líneas, **-132 / -14%**) 🟡 Parcial
Extraído en `views/nutri/`:
- `nutritionHelpers.ts` — todayStr, getTodayLog, sumMacros, MEAL_META, calcStreak, calcTDEE, constantes
- `MacroBar.tsx` — slim macro progress bar
- `WaterTracker.tsx` — agua del día (progress bar + cup viz + quick-add)
- [ ] Pendiente: el render principal con tabs Today/Body/History sigue inline (~700 líneas). Extraer en `TodayTab.tsx`, `BodyTab.tsx`, `HistoryTab.tsx` requiere romper estado compartido — tarea para sesión dedicada.

#### `components/settings/SettingsModal.tsx` (426 líneas, ahora tabbed)
Ya está parcialmente domado por las 3 tabs. Refactor opcional:
- Extraer tabs como componentes hijos: `<AccountTab/>`, `<PreferencesTab/>`, `<AdvancedTab/>`
- Cada uno consume `useApp()` directamente
- SettingsModal queda como shell + tab router

#### Reglas comunes
- Cada extracción: 1 PR pequeño, build verde, smoke-test manual en mobile + desktop
- No tocar lógica de negocio; sólo separación visual
- Si hay estado compartido entre sub-componentes, extraer un hook `useFoo()` antes

## ROI por fase

| Fase | Esfuerzo | Impacto visible | Impacto código |
|------|----------|-----------------|----------------|
| 1    | 1–2d     | ⭐⭐             | ⭐⭐⭐⭐         |
| 2    | 0.5d     | ⭐⭐⭐⭐⭐         | ⭐⭐⭐           |
| 3    | 1d       | ⭐⭐⭐⭐           | ⭐⭐⭐⭐         |
| 4    | 0.5d     | ⭐⭐⭐             | ⭐⭐             |
| 5    | 0.5d     | ⭐ (crítico)     | ⭐⭐             |
| 6    | gradual  | ⭐               | ⭐⭐⭐⭐⭐         |

## Orden acordado

1. ~~**Fase 2**~~ ✅ hecha
2. ~~**Fase 4**~~ ✅ hecha
3. **Siguiente**: a decidir. Recomiendo Fase 1 (tokens) o Fase 3 (sistema de modales).

## Estado actual

- ✅ Fase 1 — tokens + a11y básico (z-index, duration, prefers-reduced-motion, focus-visible, icon fallback ruidoso)
- ✅ Fase 2 — navegación reorganizada (avatar + command palette + settings tabbed)
- ✅ Fase 3 — Sheet primitive + 6 modales migrados + a11y patch en los 4 centered restantes. Sólo 4 modales legacy pendientes (todos funcionan).
- ✅ Fase 4 — framer-motion aplicado a 3 superficies clave
- ✅ Fase 5 — aria-label batch (+22), focus-visible global, aria-modal en 8 modales, **eslint-plugin-jsx-a11y configurado** y 2 rules-of-hooks bugs arreglados de pasada
- 🟡 Fase 6 — refactor monolitos: SortableExerciseCard (893→655, -27%) y HomeView (1104→672, -39%) hechos. NutriView (961→829) parcial.
