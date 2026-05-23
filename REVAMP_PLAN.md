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

### Fase 1 — Sistema de diseño (1–2d, ROI alto) ⏳ PENDIENTE
- [ ] Tokens en tailwind.config: `duration: { fast: 150, base: 200, slow: 300, sheet: 400 }`
- [ ] Tokens `zIndex: { nav: 30, sheet: 60, modal: 80, toast: 90, dropdown: 70 }` — eliminar `z-[500]`
- [ ] Escala tipográfica: matar `text-[9/10/11px]` arbitrarios (excepto datos numéricos densos)
- [ ] `prefers-reduced-motion` en `:root`
- [ ] Reemplazar `transition-all` masivo por `transition-[transform,opacity,colors]`
- [ ] Icon fallback ruidoso (rojo visible)

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

### Fase 3 — Sistema de modales (1d) ⏳ PENDIENTE
- [ ] Adoptar `vaul` (12kb, gestures incluidos) o `@radix-ui/react-dialog`
- [ ] Una sola `<Sheet>` con variantes: `sheet` / `dialog` / `command`
- [ ] Migrar uno a uno: ExerciseSelector → FreestyleSession → TwoBlockMass → resto

### Fase 4 — Animaciones (0.5d) ✅ HECHA
- [x] Instalar `framer-motion` (^12.40)
- [x] AnimatePresence en CommandPalette + TwoBlockMassModal — animan al abrir y al cerrar (antes desaparecían en seco)
- [x] LayoutGroup-style `layout="position"` en SortableExerciseCard — los reorders post-drag y cuando una card cambia de tamaño (set añadido / eliminado / superset linkeado) animan suaves
- [ ] Pendiente: Shared element card→focus mode (requiere refactor de focus mode primero)
- [ ] Pendiente: AnimatePresence en el resto de modales (ExerciseSelector, SettingsModal, FreestyleSessionModal) — convergerá con Fase 3 (sistema unificado de modales con vaul/radix)

### Fase 5 — A11y mínimo viable (0.5d) ⏳ PENDIENTE
- [ ] `aria-label` en ~80 botones-icono
- [ ] `focus-visible:ring-2 ring-primary-500 ring-offset-2 ring-offset-black` global
- [ ] `role="dialog"` + `aria-modal="true"` + focus-trap en modales
- [ ] Linter `jsx-a11y/control-has-associated-label`

### Fase 6 — Refactor monolitos (gradual) ⏳ PENDIENTE
- [ ] SortableExerciseCard (893) → ExerciseHeader, ExerciseMenu, SetList, SetHistoryPill
- [ ] SettingsModal (426) — muere con Fase 2
- [ ] HomeView (1104) → sub-componentes por bloque
- [ ] NutriView (961) → sub-componentes por bloque

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

- ✅ Fase 2 — navegación reorganizada (avatar + command palette + settings tabbed)
- ✅ Fase 4 — framer-motion aplicado a 3 superficies clave
- ⏳ Fase 1, 3, 5, 6 — pendientes
