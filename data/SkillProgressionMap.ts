
// ─── SKILL PROGRESSION MAP ───────────────────────────────────────────────────
// Defines the calisthenics skill families and their progression chains.
// "unlockAt" marks the performance criteria to suggest moving to the next level.
// Unit can be "reps" (max reps in one set) or "sec" (hold time in seconds).

export interface SkillLevel {
  exerciseId: string;
  name: { en: string; es: string };
  level: number;            // 1 = easiest
  unlockAt?: {
    value: number;
    unit: 'reps' | 'sec';
    description: { en: string; es: string };
  };
}

export interface SkillFamily {
  id: string;
  name: { en: string; es: string };
  icon: string;             // lucide icon name
  color: string;            // tailwind bg color
  levels: SkillLevel[];
}

export const SKILL_PROGRESSION_MAP: Record<string, SkillFamily> = {

  planche: {
    id: 'planche',
    name: { en: 'Planche', es: 'Plancha' },
    icon: 'Maximize2',
    color: 'bg-violet-500',
    levels: [
      {
        exerciseId: 'cal_planche_lean',
        name: { en: 'Planche Lean', es: 'Inclinación de Plancha' },
        level: 1,
        unlockAt: {
          value: 60,
          unit: 'sec',
          description: { en: '60s hold with straight arms', es: '60s de hold con brazos rectos' }
        }
      },
      {
        exerciseId: 'cal_tuck_planche',
        name: { en: 'Tuck Planche', es: 'Plancha Encogida' },
        level: 2,
        unlockAt: {
          value: 30,
          unit: 'sec',
          description: { en: '30s tuck planche hold', es: '30s de hold en plancha encogida' }
        }
      },
      {
        exerciseId: 'cal_adv_tuck_planche',
        name: { en: 'Adv. Tuck Planche', es: 'Plancha Encogida Avanzada' },
        level: 3,
        unlockAt: {
          value: 20,
          unit: 'sec',
          description: { en: '20s advanced tuck hold', es: '20s de hold encogido avanzado' }
        }
      },
      {
        exerciseId: 'cal_straddle_planche',
        name: { en: 'Straddle Planche', es: 'Plancha Abierta' },
        level: 4,
        unlockAt: {
          value: 15,
          unit: 'sec',
          description: { en: '15s straddle hold', es: '15s de hold en straddle' }
        }
      },
      {
        exerciseId: 'cal_full_planche',
        name: { en: 'Full Planche', es: 'Plancha Completa' },
        level: 5,
      }
    ]
  },

  front_lever: {
    id: 'front_lever',
    name: { en: 'Front Lever', es: 'Palanca Frontal' },
    icon: 'Minus',
    color: 'bg-blue-500',
    levels: [
      {
        exerciseId: 'cal_scap_pull',
        name: { en: 'Scapular Pull', es: 'Jalón Escapular' },
        level: 1,
        unlockAt: {
          value: 10,
          unit: 'reps',
          description: { en: '3×10 scapular pulls', es: '3×10 jalones escapulares' }
        }
      },
      {
        exerciseId: 'cal_tuck_fl',
        name: { en: 'Tuck Front Lever', es: 'Palanca Encogida' },
        level: 2,
        unlockAt: {
          value: 20,
          unit: 'sec',
          description: { en: '20s tuck hold', es: '20s de hold encogido' }
        }
      },
      {
        exerciseId: 'cal_straddle_fl',
        name: { en: 'Straddle Front Lever', es: 'Palanca Abierta' },
        level: 3,
        unlockAt: {
          value: 15,
          unit: 'sec',
          description: { en: '15s straddle hold', es: '15s de hold en straddle' }
        }
      },
      {
        exerciseId: 'cal_full_fl',
        name: { en: 'Full Front Lever', es: 'Palanca Frontal Completa' },
        level: 4,
      }
    ]
  },

  muscle_up: {
    id: 'muscle_up',
    name: { en: 'Muscle Up', es: 'Muscle Up' },
    icon: 'Award',
    color: 'bg-amber-500',
    levels: [
      {
        exerciseId: 'cal_pullup',
        name: { en: 'Pull Up', es: 'Dominada' },
        level: 1,
        unlockAt: {
          value: 12,
          unit: 'reps',
          description: { en: '12 strict pull-ups', es: '12 dominadas estrictas' }
        }
      },
      {
        exerciseId: 'cal_au_pullup',
        name: { en: 'Archer Pull Up', es: 'Dominada Arquero' },
        level: 2,
        unlockAt: {
          value: 8,
          unit: 'reps',
          description: { en: '8 archer pull-ups each side', es: '8 dominadas arquero por lado' }
        }
      },
      {
        exerciseId: 'cal_neg_mu',
        name: { en: 'Negative Muscle Up', es: 'Muscle Up Negativo' },
        level: 3,
        unlockAt: {
          value: 5,
          unit: 'reps',
          description: { en: '5 slow negatives', es: '5 negativos lentos' }
        }
      },
      {
        exerciseId: 'cal_bar_mu',
        name: { en: 'Bar Muscle Up', es: 'Muscle Up en Barra' },
        level: 4,
        unlockAt: {
          value: 5,
          unit: 'reps',
          description: { en: '5 clean bar muscle-ups', es: '5 muscle-ups limpios' }
        }
      },
      {
        exerciseId: 'cal_ring_mu',
        name: { en: 'Ring Muscle Up', es: 'Muscle Up en Anillas' },
        level: 5,
      }
    ]
  },

  handstand: {
    id: 'handstand',
    name: { en: 'Handstand', es: 'Pino / Vertical' },
    icon: 'ArrowUp',
    color: 'bg-emerald-500',
    levels: [
      {
        exerciseId: 'cal_pike_pu',
        name: { en: 'Pike Push Up', es: 'Flexión en Pica' },
        level: 1,
        unlockAt: {
          value: 10,
          unit: 'reps',
          description: { en: '10 pike push-ups', es: '10 flexiones en pica' }
        }
      },
      {
        exerciseId: 'cal_wall_hs',
        name: { en: 'Wall Handstand Hold', es: 'Hold en Pared' },
        level: 2,
        unlockAt: {
          value: 60,
          unit: 'sec',
          description: { en: '60s wall handstand', es: '60s pino contra la pared' }
        }
      },
      {
        exerciseId: 'cal_handstand',
        name: { en: 'Freestanding Handstand', es: 'Pino Libre' },
        level: 3,
        unlockAt: {
          value: 30,
          unit: 'sec',
          description: { en: '30s freestanding hold', es: '30s de hold libre' }
        }
      },
      {
        exerciseId: 'cf_hspu',
        name: { en: 'Handstand Push Up', es: 'Flexión en Pino' },
        level: 4,
      }
    ]
  },

  back_lever: {
    id: 'back_lever',
    name: { en: 'Back Lever', es: 'Palanca Posterior' },
    icon: 'CornerDownRight',
    color: 'bg-rose-500',
    levels: [
      {
        exerciseId: 'cal_german_hang',
        name: { en: 'German Hang', es: 'Colgado Alemán' },
        level: 1,
        unlockAt: {
          value: 30,
          unit: 'sec',
          description: { en: '30s german hang', es: '30s de colgado alemán' }
        }
      },
      {
        exerciseId: 'cal_tuck_bl',
        name: { en: 'Tuck Back Lever', es: 'Palanca Posterior Encogida' },
        level: 2,
        unlockAt: {
          value: 20,
          unit: 'sec',
          description: { en: '20s tuck back lever', es: '20s de palanca encogida' }
        }
      },
      {
        exerciseId: 'cal_straddle_bl',
        name: { en: 'Straddle Back Lever', es: 'Palanca Posterior Abierta' },
        level: 3,
        unlockAt: {
          value: 15,
          unit: 'sec',
          description: { en: '15s straddle back lever', es: '15s de palanca abierta' }
        }
      },
      {
        exerciseId: 'cal_full_bl',
        name: { en: 'Full Back Lever', es: 'Palanca Posterior Completa' },
        level: 4,
      }
    ]
  },

  lsit: {
    id: 'lsit',
    name: { en: 'L-Sit', es: 'L-Sit' },
    icon: 'AlignCenter',
    color: 'bg-cyan-500',
    levels: [
      {
        exerciseId: 'cal_tuck_lsit',
        name: { en: 'Tuck L-Sit', es: 'L-Sit Encogido' },
        level: 1,
        unlockAt: {
          value: 20,
          unit: 'sec',
          description: { en: '20s tuck hold', es: '20s de hold encogido' }
        }
      },
      {
        exerciseId: 'cal_one_leg_lsit',
        name: { en: 'One-Leg L-Sit', es: 'L-Sit Una Pierna' },
        level: 2,
        unlockAt: {
          value: 15,
          unit: 'sec',
          description: { en: '15s each leg', es: '15s por pierna' }
        }
      },
      {
        exerciseId: 'cal_lsit',
        name: { en: 'Full L-Sit', es: 'L-Sit Completo' },
        level: 3,
        unlockAt: {
          value: 30,
          unit: 'sec',
          description: { en: '30s full L-sit', es: '30s de L-sit completo' }
        }
      },
      {
        exerciseId: 'cal_vsit',
        name: { en: 'V-Sit', es: 'V-Sit' },
        level: 4,
      }
    ]
  }
};

// Helper: Get the current skill level for an exercise based on its best performance
export const getSkillReadyToProgress = (
  exerciseId: string,
  bestValue: number | null
): boolean => {
  for (const family of Object.values(SKILL_PROGRESSION_MAP)) {
    for (const level of family.levels) {
      if (level.exerciseId === exerciseId && level.unlockAt && bestValue !== null) {
        return bestValue >= level.unlockAt.value;
      }
    }
  }
  return false;
};

// Helper: Get progression info for an exercise
export const getSkillProgressionInfo = (exerciseId: string) => {
  for (const family of Object.values(SKILL_PROGRESSION_MAP)) {
    const idx = family.levels.findIndex(l => l.exerciseId === exerciseId);
    if (idx !== -1) {
      return {
        family,
        currentLevel: family.levels[idx],
        nextLevel: family.levels[idx + 1] || null,
        prevLevel: family.levels[idx - 1] || null,
        isLast: idx === family.levels.length - 1,
      };
    }
  }
  return null;
};
