import type { LocalizedText } from '../types';

export interface PerformanceGuideSection {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  points?: LocalizedText[];
}

const p = (en: string, es: string): LocalizedText => ({ en, es });

export const PERFORMANCE_GUIDE: PerformanceGuideSection[] = [
  {
    id: 'what-is-performance',
    title: p('What is PERFORMANCE?', 'Qué es PERFORMANCE'),
    summary: p(
      'A hypertrophy-focused Upper/Lower system built around stimulus-to-fatigue efficiency. The target is not the most work you can survive; it is enough high-quality work to progress while remaining functional outside the gym.',
      'Un sistema Torso/Pierna orientado a hipertrofia y diseñado alrededor de la relación estímulo/fatiga. La meta no es hacer la mayor cantidad de trabajo que puedas sobrevivir, sino suficiente trabajo de alta calidad para progresar y seguir funcionando bien fuera del gimnasio.',
    ),
    points: [
      p('Four sessions form one rolling cycle.', 'Cuatro sesiones forman un ciclo rodante.'),
      p('The default cadence is one rest day between sessions.', 'La cadencia por defecto deja un día de descanso entre sesiones.'),
      p('Most work lives at 1–3 reps in reserve.', 'La mayor parte del trabajo se mantiene a 1–3 repeticiones en reserva.'),
      p('Volume is intentionally moderate and only changes when recovery and progress justify it.', 'El volumen es deliberadamente moderado y solo cambia cuando la recuperación y el progreso lo justifican.'),
    ],
  },
  {
    id: 'fatigue-budget',
    title: p('Principle 1 — Fatigue is a budget', 'Principio 1 — La fatiga es un presupuesto'),
    summary: p(
      'Training stress competes with work, sleep, relationships and normal life. PERFORMANCE treats systemic fatigue as a cost to control, not as an adaptation target by itself.',
      'El estrés del entrenamiento compite con el trabajo, el sueño, las relaciones y la vida normal. PERFORMANCE trata la fatiga sistémica como un costo a controlar, no como una meta de adaptación por sí sola.',
    ),
    points: [
      p('Prefer supported rows, machines and stable patterns when they preserve stimulus and reduce unnecessary fatigue.', 'Prefiere remos apoyados, máquinas y patrones estables cuando mantienen el estímulo y reducen fatiga innecesaria.'),
      p('A hard set is valuable; feeling destroyed is not a progression metric.', 'Una serie dura puede ser valiosa; quedar destruido no es una métrica de progreso.'),
    ],
  },
  {
    id: 'rolling-cycle',
    title: p('Principle 2 — The calendar does not own the program', 'Principio 2 — El calendario no manda al programa'),
    summary: p(
      'The four workouts do not have to fit inside Monday through Sunday. Complete Upper A → Lower A → Upper B → Lower B in order, normally with one rest day between sessions.',
      'Las cuatro sesiones no tienen que entrar entre lunes y domingo. Completa Torso A → Pierna A → Torso B → Pierna B en orden, normalmente dejando un día de descanso entre sesiones.',
    ),
    points: [
      p('Default rhythm: train / rest / train / rest.', 'Ritmo por defecto: entrenar / descansar / entrenar / descansar.'),
      p('If life demands another rest day, take it and continue the sequence; do not cram sessions to “save the week”.', 'Si la vida exige otro día de descanso, tómalo y continúa la secuencia; no amontones sesiones para “salvar la semana”.'),
    ],
  },
  {
    id: 'double-progression',
    title: p('Principle 3 — Earn the load increase', 'Principio 3 — Gánate el aumento de carga'),
    summary: p(
      'PERFORMANCE uses double progression. Keep the same load while you build repetitions inside the prescribed range. Increase load only when every work set reaches the top of the range with the intended effort.',
      'PERFORMANCE usa doble progresión. Mantén la misma carga mientras acumulas repeticiones dentro del rango prescrito. Sube la carga solamente cuando todas las series de trabajo alcanzan el techo del rango con el esfuerzo previsto.',
    ),
    points: [
      p('Example: 3×6–10 @ RPE 8. If you log 9/8/7, keep the load next time.', 'Ejemplo: 3×6–10 @ RPE 8. Si haces 9/8/7, mantén la carga la próxima vez.'),
      p('When you reach 10/10/10 around RPE 8, add the smallest practical increment and rebuild from the lower half of the range.', 'Cuando llegues a 10/10/10 cerca de RPE 8, añade el incremento práctico más pequeño y vuelve a construir desde la mitad baja del rango.'),
      p('GainsLab compares the same exercise in the same PERFORMANCE slot, not an unrelated routine or KONG exposure.', 'GainsLab compara el mismo ejercicio en el mismo slot de PERFORMANCE, no una ejecución ajena de otra rutina o de KONG.'),
      p('If the first work set cannot reach the lower bound without exceeding the RPE cap, reduce the load roughly 2.5–5%.', 'Si la primera serie de trabajo no llega al mínimo del rango sin superar el RPE límite, reduce aproximadamente 2.5–5% la carga.'),
      p('No forced weekly load jumps.', 'No hay aumentos de carga obligatorios por semana.'),
    ],
  },
  {
    id: 'rir',
    title: p('Principle 4 — Productive effort, not mandatory failure', 'Principio 4 — Esfuerzo productivo, no fallo obligatorio'),
    summary: p(
      'Cycles 1–2 calibrate around RPE 7–7.5. Cycles 3–7 run mostly around RPE 8 on compounds and RPE 8–8.5 on accessories. Failure is never required on compound lifts.',
      'Los ciclos 1–2 calibran alrededor de RPE 7–7.5. Los ciclos 3–7 trabajan principalmente cerca de RPE 8 en compuestos y RPE 8–8.5 en accesorios. El fallo nunca es obligatorio en movimientos compuestos.',
    ),
    points: [
      p('RPE 7 ≈ about 3 reps in reserve.', 'RPE 7 ≈ unas 3 repeticiones en reserva.'),
      p('RPE 8 ≈ about 2 reps in reserve.', 'RPE 8 ≈ unas 2 repeticiones en reserva.'),
      p('RPE 8.5 ≈ roughly 1–2 reps in reserve.', 'RPE 8.5 ≈ aproximadamente 1–2 repeticiones en reserva.'),
      p('Optional failure is reserved for safe isolation work and is not necessary for progression.', 'El fallo opcional se reserva para aislamientos seguros y no es necesario para progresar.'),
    ],
  },
  {
    id: 'volume',
    title: p('Principle 5 — Start with enough, not with the maximum', 'Principio 5 — Empieza con suficiente, no con el máximo'),
    summary: p(
      'The base plan deliberately starts with moderate direct volume. If a muscle is progressing, its volume stays unchanged. During productive cycles, GainsLab may change at most one set on one low-systemic-cost slot for that muscle.',
      'El plan base empieza deliberadamente con volumen directo moderado. Si un músculo progresa, su volumen se mantiene. Durante los ciclos productivos, GainsLab puede modificar como máximo una serie en un único slot de bajo costo sistémico para ese músculo.',
    ),
    points: [
      p('Cycles 1–2 are calibration: no automatic volume changes.', 'Los ciclos 1–2 son de calibración: no hay cambios automáticos de volumen.'),
      p('Cycles 3–7: better performance means keep the current dose; it does not earn more volume.', 'Ciclos 3–7: mejorar el rendimiento significa mantener la dosis actual; no te “ganás” más volumen por estar progresando.'),
      p('Flat performance + clearly fresh recovery + non-excessive stimulus may add exactly +1 set next cycle.', 'Rendimiento igual + recuperación claramente fresca + estímulo no excesivo puede añadir exactamente +1 serie en el siguiente ciclo.'),
      p('Poor recovery, meaningful joint discomfort, or worse performance with incomplete recovery may remove exactly 1 set next cycle.', 'Mala recuperación, molestia articular relevante o peor rendimiento con recuperación incompleta puede quitar exactamente 1 serie en el siguiente ciclo.'),
      p('The adjustment is applied only to a designated low-cost accessory slot, never to every exercise for that muscle.', 'El ajuste se aplica solo a un slot accesorio designado de bajo costo, nunca a todos los ejercicios de ese músculo.'),
      p('Ratings copied with “Apply to remaining” are recorded but cannot automatically change those muscles’ volume.', 'Las valoraciones copiadas con “Aplicar al resto” se registran, pero no pueden cambiar automáticamente el volumen de esos músculos.'),
      p('Cycle 8 is a pivot and ignores automatic volume changes.', 'El ciclo 8 es un pivote e ignora cambios automáticos de volumen.'),
    ],
  },
  {
    id: 'recovery-gate',
    title: p('Principle 6 — Recovery Gate', 'Principio 6 — Recovery Gate'),
    summary: p(
      'Before a session, compare sleep, energy, concentration, vitality/libido and muscle recovery with your own normal baseline. Joint warning is tracked separately because meaningful joint irritation should not be averaged away by otherwise good readiness.',
      'Antes de una sesión, compara sueño, energía, concentración, vitalidad/libido y recuperación muscular con tu propio nivel normal. La advertencia articular se evalúa aparte porque una irritación articular relevante no debe quedar “compensada” por buenas señales en el resto.',
    ),
    points: [
      p('GREEN — 0–1 clearly worse non-joint signals: run the session as written.', 'VERDE — 0–1 señales no articulares claramente peores: realiza la sesión tal como está escrita.'),
      p('YELLOW — 2 worse non-joint signals: target RPE drops by 1 and GainsLab removes the final two low-priority accessory exercises.', 'AMARILLO — 2 señales no articulares peores: el RPE objetivo baja 1 punto y GainsLab elimina los dos últimos accesorios de baja prioridad.'),
      p('RED — 3+ worse non-joint signals OR a meaningful joint warning: do not force the session; delay about 24 hours and reassess.', 'ROJO — 3 o más señales no articulares peores O una advertencia articular relevante: no fuerces la sesión; retrásala unas 24 horas y vuelve a evaluar.'),
      p('A yellow session also suppresses planned automatic volume changes for that day.', 'Una sesión amarilla también suprime los cambios automáticos de volumen que estuvieran previstos para ese día.'),
      p('Do not use extra stimulants simply to force a red day into a hard session.', 'No uses más estimulantes simplemente para convertir un día rojo en una sesión dura.'),
    ],
  },
  {
    id: 'exercise-selection',
    title: p('Principle 7 — Stable exercises are a feature', 'Principio 7 — La estabilidad es una ventaja'),
    summary: p(
      'Exercise selection favors movements that make local muscular effort easy to repeat and measure: supported rows, machines, controlled presses and a restrained amount of free-weight hinging.',
      'La selección de ejercicios favorece movimientos donde el esfuerzo muscular local sea fácil de repetir y medir: remos apoyados, máquinas, presses controlados y una cantidad contenida de bisagras con peso libre.',
    ),
    points: [
      p('Substitute by movement role, not randomly.', 'Sustituye por función del movimiento, no al azar.'),
      p('Keep the replacement stable long enough to build a progression history.', 'Mantén el reemplazo el tiempo suficiente para construir un historial de progresión.'),
      p('Pain is not a technique cue. Choose a tolerable alternative instead of forcing a prescribed movement.', 'El dolor no es una señal técnica. Elige una alternativa tolerable en vez de forzar un movimiento prescrito.'),
    ],
  },
  {
    id: 'pivot',
    title: p('Cycle 8 — Pivot', 'Ciclo 8 — Pivote'),
    summary: p(
      'Cycle 8 cuts work-set count roughly in half and returns effort to about RPE 7. It is not a test week. Keep technique crisp, leave the gym fresh and preserve the movement patterns.',
      'El ciclo 8 reduce aproximadamente a la mitad las series de trabajo y devuelve el esfuerzo a cerca de RPE 7. No es una semana de prueba. Mantén la técnica limpia, sal fresco del gimnasio y conserva los patrones de movimiento.',
    ),
    points: [
      p('Do not chase PRs during the pivot.', 'No busques récords durante el pivote.'),
      p('Resume the next run using the loads you earned in cycles 3–7, not the lighter pivot loads.', 'Reanuda el siguiente bloque usando las cargas ganadas en los ciclos 3–7, no las cargas más livianas del pivote.'),
    ],
  },
  {
    id: 'after-eight-cycles',
    title: p('After cycle 8', 'Después del ciclo 8'),
    summary: p(
      'If the program is still producing progress and your daily function is good, repeat the system with the same exercise menu or make only a small number of justified substitutions.',
      'Si el programa sigue produciendo progreso y tu funcionamiento diario es bueno, repite el sistema con el mismo menú de ejercicios o realiza solo unas pocas sustituciones justificadas.',
    ),
    points: [
      p('Keep exercises that are still progressing and feel good.', 'Mantén los ejercicios que siguen progresando y se sienten bien.'),
      p('Change an exercise for stagnation, poor stimulus, pain/tolerance or equipment constraints—not boredom alone.', 'Cambia un ejercicio por estancamiento, mal estímulo, dolor/tolerancia o limitaciones de equipo; no solo por aburrimiento.'),
      p('The goal of the next run is a slightly better logbook at the same or lower recovery cost.', 'La meta del siguiente bloque es un logbook ligeramente mejor con el mismo o menor costo de recuperación.'),
    ],
  },
];
