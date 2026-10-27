# Matriz de paridad 1:1 — Strong v6.2.4 (602006) vs IronLog-React kong.27

Auditoría manual en emulador el 2026-10-27/28 (APK `io.strongapp.strong` v6.2.4,
paquete modificado con firma no oficial; cuenta del propietario, solo lectura:
2 toggles tocados por error restaurados, 2 workouts de prueba descartados,
cero guardados). Evidencia en `strong-audit/` (screenshots + dumps XML).

Leyenda: ✅ igual · 🟡 parcial/difiere · ❌ falta · 🔍 no observado.

## 1. Navegación (5 destinos)
| Strong | IronLog | Estado |
|---|---|---|
| Profile / History / Workout(+) / Exercises / Measure | Perfil / Historial / Entreno / Ejercicios / Medidas | ✅ (labels ES intencionales) |
| Minimizar workout → banner inferior "Name + time" retomable | FAB Entreno en vivo (verde) | 🟡 mismo alcance, distinto mecanismo |
| Sin píldora flotante sobre otras pantallas | ✅ igual desde kong.26 | ✅ |

## 2. Pestaña Workout
| Strong | IronLog | Estado |
|---|---|---|
| Quick start + START AN EMPTY WORKOUT | ✅ | ✅ |
| Templates + (nuevo) + carpeta + ••• (Show archived / Hide examples / Show list) | 🟡 verificar menú ••• y modos lista | 🟡 |
| Carpetas (KONG Phase 1 (4)) + cards (nombre, •••, "3 x Nombre" truncado, último "Yesterday"/fecha) | 🟡 falta "último realizado" en cards | 🟡 |
| Card •••: New workout template / Rename / Delete | ✅ (revisar) | 🟡 |
| Detalle plantilla: título, Last performed, filas avatar+nombre+músculo+?, START WORKOUT | 🟡 falta "Last performed" y botón ? | 🟡 |
| Detalle •••: Edit / Rename / Archive / Duplicate / Share / Delete | ✅ (revisar 1:1) | 🟡 |

## 3. Entreno en curso (núcleo)
| Strong | IronLog | Estado |
|---|---|---|
| Header: colapsar, icono reloj (rest manual), elapsed, FINISH | ✅ | ✅ |
| Título editable + ••• (Edit workout name / Adjust start-end time / Add note) | 🟡 verificar las 3 | 🟡 |
| Columnas SET \| PREVIOUS \| KG \| REPS \| ✓ ; (+KG) y banner "8 - 12" en bodyweight | ✅ (verificar banner rango) | 🟡 |
| **Inputs RELLENOS con valores previos** ("—" solo sin historial) | ❌ usamos hints grises + vacío | ❌ ALTO IMPACTO |
| Etiqueta "2:00" entre sets = el auto-timer (editable+START al tocar) | 🟡 nuestro chip/dock difiere | 🟡 |
| "ADD SET (2:00)" con duración | 🟡 el nuestro no muestra duración | 🟡 |
| Descanso: **corre in-flow donde estaba la etiqueta** (barra 1:58 + Pause/RESET/SKIP; pausado: Resume) | ❌ dock separado / píldora | ❌ ALTO IMPACTO |
| Sin overlay/píldora al completar (ni notif con cuenta atrás; solo notif "Complete set" de progreso) | 🟡 nosotros auto-disparamos dock+píldora | 🟡 revisar |
| Menú ejercicio: Add note, Add sticky note, Add warm-up sets, Update rest timers, Replace exercise, Create superset, Preferences, Remove exercise | ✅ existe (revisar 1:1 textos) | 🟡 |
| Preferences → About + Rest Timer Settings por ejercicio (Work/Warm/Drop, SAVE SETTINGS FOR EXERCISE) | 🟡 verificar defaults por ejercicio | 🟡 |
| FINISH con incompletas → "Complete or Discard..." (Ask every time / Always complete / Always discard) | ✅ | ✅ |
| Cancelar → "Discard workout? ... CANCEL/DISCARD" | ✅ (revisar textos) | 🟡 |
| Keypad propio: dígitos, ⌫, − +, RPE, NEXT/START contextual | ✅ T5 (comparar botones) | 🟡 |

## 4. Historial
| Strong | IronLog | Estado |
|---|---|---|
| Meses ("October / 1 workout"), cards con Sets + Best set, footer duración/volumen/PRs | ✅ (revisar columnas) | 🟡 |
| Icono calendario → vista Calendar (dots, día check, OK) | ❌ | ❌ MEDIO |
| Detalle: fecha, sets + **columna 1RM por set**, PERFORM AGAIN | 🟡 falta 1RM por set | 🟡 |
| Detalle •••: Edit workout / Save as template / Delete | ✅ (revisar) | 🟡 |

## 5. Ejercicio (About/History/Charts/Records, tabs con memoria)
| Strong | IronLog | Estado |
|---|---|---|
| ABOUT: Body part, Category, Instructions+MORE, Preferences>Rest Timer Settings, Weight unit | 🟡 | 🟡 |
| HISTORY vacía: "Not performed yet..." | ✅ (revisar texto) | 🟡 |
| CHARTS: Best set (est. 1RM) / (max weight) / Total volume (kg) o "Not enough recent data" + ejes MES | ✅ (revisar métricas) | 🟡 |
| RECORDS: Estimated 1RM, Max volume, Max weight, VIEW RECORDS HISTORY, tabla REPS\|BEST\|ESTIMATED | 🟡 verificar tabla por reps | 🟡 |
| Cardio: Max duration – / Total duration 0:00 | 🟡 | 🟡 |
| ••• detalle: solo "Edit exercise" | ✅ | ✅ |
| Lista: secciones A-Z, thumb, músculo, contador; search/filter/sort/••• (Create Exercise, Show archived); filtro por bodypart + categoría; orden Name/Frequency/Last performed | 🟡 revisar filtro y orden | 🟡 |

## 6. Medidas
| Strong | IronLog | Estado |
|---|---|---|
| Lista: Weight 85 kg, Body fat %, Caloric intake, Neck...Right calf | ✅ (comparar lista exacta) | 🟡 |
| Detalle: gráfica + HISTORY + alta + ••• (Export data as CSV) | ✅ | 🟡 |

## 7. Ajustes (Settings)
| Strong | IronLog | Estado |
|---|---|---|
| Profile>Edit | ✅ | ✅ |
| Theme Auto dark | ✅ | ✅ |
| Sound Effects (no incluye alerta) ON / Lock completed OFF / Delete confirm ON | ✅ | ✅ |
| Previous set: Any workout / same-template-only | ✅ | ✅ |
| Incomplete: Ask / Always complete / Always discard | ✅ | ✅ |
| Available bars: Hex 34/75, Olympic 20/45, Short 15/33, EZ 7/15, None 0/0 (+•••, +FAB) | 🟡 comparar + edición | 🟡 |
| Available plates: tabs KG/LB, 50..0.25 (las bajas deshabilitadas) | 🟡 comparar + enable/disable | 🟡 |
| Rest: Simple Timers OFF / Default Values (Work 2:00, Warm/Drop None) / Increment 5/15/30s / Vibrate ON / Auto fullscreen OFF / Auto start ON / Sound list | ✅ in-flow + labels tappeables + simple fullscreen + 4 sonidos (ver notas) | 🟡 |
| Units: English+9 (Español ✓), Body weight kg, Weight kg, Distance km, Size cm, First weekday Monday | ✅ (revisar weekday/LB) | 🟡 |
| xRM: Hybrid (Recommended) / Brzycki / Epley (+explicación) + Factor in RPE | ✅ Hybrid por defecto + toggle RPE (+Lombardi extra nuestro) | ✅ |
| Prevent screen sleep / Start history from / Show Update Template / Health Connect / Export CSV (nota "cannot be imported back") / soporte / LOG OUT / versión+unsynced | 🟡 revisar una por una | 🟡 |

## 8. Perfil
| Strong | IronLog | Estado |
|---|---|---|
| avatar+nombre+workouts+chevron, Dashboard+widgets ("No widgets added..."), gear | 🟡 **sin widgets** | 🟡 |

## Top gaps (impacto)
1. Inputs con valores previos rellenos. 2. Descanso in-flow en la etiqueta + tap-to-start. 3. Sin píldora flotante; sin auto-popup. 4. xRM Hybrid + RPE-factor. 5. Calendario de historial. 6. 1RM por set en detalle + Last performed en plantillas. 7. Sonidos, Simple Timers, incremento sin 10.

## Implementado en kong.27

- Prefill de inputs con valores previos (hints solo sin historial).
- Etiquetas de descanso tappeables por serie + in-flow dock anclado; fullscreen simple con -/+ y SKIP cuando corresponde.
- Hybrid por defecto + toggle Factor in RPE (propagado a worker, caché, gráficas y récords).
- Calendario de historial con dots y filtro por día.
- Columna 1RM por serie y "último realizado" en plantillas.
- Selector de sonido de descanso (4 tonos sintetizados) + incremento 5/15/30.
- Update-all-templates: N/A (nuestras plantillas usan defaults globales; no hay nada que propagar).
- Warmup 60s por defecto (Strong: None) — divergencia intencional menor.
