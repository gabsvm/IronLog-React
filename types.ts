
export type Lang = 'en' | 'es';
export type Theme = 'light' | 'dark' | 'system';
export type ColorTheme = 'royal' | 'cyan' | 'iron' | 'ocean' | 'forest' | 'sunset' | 'rose' | 'monochrome';
export type EffectsMode = 'system' | 'full' | 'balanced' | 'reduced';
export type ResolvedEffects = 'full' | 'balanced' | 'reduced';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    deferredPrompt: BeforeInstallPromptEvent | null;
  }
}

export type MuscleGroup =
  | 'CHEST' | 'BACK' | 'QUADS' | 'HAMSTRINGS'
  | 'GLUTES' | 'CALVES' | 'SHOULDERS' | 'BICEPS'
  | 'TRICEPS' | 'TRAPS' | 'ABS' | 'FOREARMS'
  | 'NECK' | 'CARDIO';

export type CardioType = 'steady' | 'hiit' | 'tabata';

/**
 * Defines how the load and reps entered for an exercise translate to external
 * tonnage. `per_side` is for entries such as 20 kg x 10 per arm, performed on
 * both sides; `total` is for bars, bilateral machines, or alternating reps
 * already entered as a total.
 */
export type VolumeCountingMode = 'total' | 'per_side';

export interface ExerciseDef {
  id: string;
  name: string | { en: string; es: string };
  muscle: MuscleGroup;
  instructions?: { en: string; es: string };
  defaultCardioType?: CardioType;
  videoId?: string;
  isBodyweight?: boolean;        // Bodyweight flag
  volumeCountingMode?: VolumeCountingMode; // Defaults to total (x1)
  isIsometric?: boolean;         // L-sit, planche hold, back lever hold — tracked in seconds
  isometricTargetSecs?: number;  // Target hold duration (countdown mode)
  skillFamily?: string;          // "planche" | "front_lever" | "muscle_up" | "handstand" | "back_lever" | "human_flag"
  skillLevel?: number;           // 1=tuck, 2=adv_tuck, 3=straddle, 4=full (within family)
  progressionNext?: string;      // ID of next-level exercise in progression
  progressionPrev?: string;      // ID of previous-level exercise in progression
  defaultRestSeconds?: number;   // Per-exercise rest timer override
  progressionMode?: 'load' | 'density';
  densityTargetRestSeconds?: number;
  densityMinRestSeconds?: number;
  densityStepSeconds?: number;
  source?: 'nilsson_bw';         // Origin tag (e.g. Nick Nilsson Best Bodyweight Exercises)
  isCustom?: boolean;            // User-created exercise
  archived?: boolean;            // Archived exercise (hidden from selectors, preserved for references)
  /** Q14: extra search names (matched normalized, like the curated map). */
  aliases?: string[];
  /** Q14: id this exercise was merged into (reads resolve to it; logs untouched). */
  mergedInto?: string;
  /** Explicit or overridden anatomical illustration key (from EXERCISE_ILLUSTRATIONS). */
  illustrationId?: string;
}

export type SetType = 'regular' | 'myorep' | 'myorep_match' | 'cluster' | 'top' | 'backoff' | 'giant' | 'warmup' | 'avt_hop' | 'emom' | 'drop' | 'failure' | 'rest_pause' | 'time_volume' | 'triple_add';

import type { ProgramRunState, SetPrescription, ProgramSetRole } from './programs/types';

export interface WorkoutSet {
  id: number;
  weight: string | number;
  reps: string | number;
  rpe: string | number;
  completed: boolean;
  type: SetType;
  skipped?: boolean;
  hintWeight?: string | number;
  hintReps?: string | number;
  prevWeight?: string | number;
  prevReps?: string | number;
  distance?: string | number;
  duration?: string | number;
  workSeconds?: number;
  restSeconds?: number;
  prescribedReps?: number | 'FAILURE';
  targetRpe?: number;
  prescriptionRole?: ProgramSetRole;
  programSetIndex?: number;
  avtRoundId?: number;  // ID compartido entre todos los hops de un mismo round AVT
  isLastHop?: boolean;  // true en el hop donde se llegó al fallo
}

export type WeightUnit = 'kg' | 'lb';

export interface SessionExercise extends ExerciseDef {
  instanceId: number;
  slotLabel?: string;
  targetReps?: string;
  note?: string;
  stickyNote?: string;
  sets: WorkoutSet[];
  supersetId?: string;
  isPlaceholder?: boolean;
  cardioType?: CardioType;
  programSlotId?: string;
  recommendedRestSeconds?: number;
  progressionMode?: 'load' | 'density';
  densityTargetRestSeconds?: number;
  densityMinRestSeconds?: number;
  densityStepSeconds?: number;
  substitutionGroup?: string;
  programSourceName?: string;
  targetMuscle?: MuscleGroup;
}

export interface ActiveSession {
  id: number;
  dayIdx: number;
  name: string;
  startTime: number | null;
  endTime?: number;
  mesoId: number;
  week: number;
  exercises: SessionExercise[];
  skipped?: boolean;
  note?: string;            // Freeform session journal note
  /** Stable template identity stamped at session build (null: detached/KONG/custom/pre-feature). */
  templateId?: string | null;
  /** Frozen day key within the template (null whenever templateId is null). */
  templateDayKey?: string | null;
}

export interface ProgramSlot {
  muscle: MuscleGroup;
  setTarget: number;
  reps?: string;
  exerciseId?: string | null;
  supersetId?: string;
  setType?: SetType; // NEW: Persist preferred set type
  isAVT?: boolean;
  avtRounds?: number;
  avtStartReps?: number;
  label?: string;          // NEW: Custom label for the exercise
  notes?: string;          // NEW: Notes for the exercise slot
  avtHops?: string;
  restBetweenHopsSec?: number;
  restBetweenRoundsSec?: number;
  prescription?: SetPrescription[];
  programSlotId?: string;
  recommendedRestSeconds?: number;
  progressionMode?: 'load' | 'density';
  densityTargetRestSeconds?: number;
  densityMinRestSeconds?: number;
  densityStepSeconds?: number;
  substitutionGroup?: string;
  programSourceName?: string;
  targetMuscle?: MuscleGroup;
}

export interface ProgramDay {
  id: string;
  dayName: { en: string; es: string };
  slots: ProgramSlot[];
  notes?: string;          // NEW: Notes for the training day
  /**
   * Stable day identity within its template (Strong "same template only").
   * Frozen onto the mesocycle + session + log at apply time; never inferred.
   * Absent on pre-feature data (fallback: mesoId + dayIdx).
   */
  templateDayKey?: string | null;
}

export type MesoType = 'hyp_1' | 'hyp_2' | 'metabolite' | 'resensitization' | 'full_body' | 'wizard' | 'male_physique' | 'toji_fushiguro' | 'tokita' | string;

export interface TemplateFolder {
  id: string;
  name: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface GlobalTemplate {
  id: string;
  name: string;
  title: { en: string, es: string };
  description: { en: string, es: string };
  isPro: boolean;
  program: ProgramDay[];
  order: number;
  /** Private templates are stored in the owner's account and never published. */
  scope?: 'personal';
  guidelineImages?: string[]; // NEW: Array of images for guidelines
  /** Optional folder assignment for personal templates (TemplateFolder.id). Absent/null = unfiled. */
  folderId?: string | null;
  /** Archived personal templates are hidden from the active library but never deleted. */
  archivedAt?: number | null;
 }

export interface MesoCycle {
  id: number;
  name?: string;
  mesoType: MesoType;
  week: number;
  plan: (string | null)[][];
  targetWeeks?: number;
  isDeload?: boolean;
  note?: string; // NEW: General mesocycle notes
  duration: number;
  programSystem?: ProgramRunState;
  /**
   * Stable template identity (Strong "same template only").
   * templateId = GlobalTemplate.id at apply time (never mesoType: it also
   * carries program ids like 'hyp_1'); templateDayKeys[dayIdx] freezes the
   * day key. Absent/null on pre-feature, custom, wizard and KONG mesocycles
   * (fallback: mesoId + dayIdx).
   */
  templateId?: string | null;
  templateDayKeys?: (string | null)[] | null;
}

export interface Log {
  id: number;
  dayIdx: number;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  bodyWeightSnapshot?: number;
  skipped?: boolean;
  mesoId: number;
  week: number;
  exercises: SessionExercise[];
  note?: string;            // Freeform session journal note
  /** Q12: present on CSV-imported sessions; reserved mesoId -100 keeps them out of "This plan". */
  importKey?: string;
  importedFrom?: 'hevy' | 'strong';
  discipline?: string;      // Optional discipline tag (e.g. crossfit, calisthenics)
  programSystem?: {
    systemId: string;
    systemVersion: number;
    blockNumber: number;
    blockWeek: number;
  };
  /**
   * Stable template identity copied from the session at completion.
   * Null on detached (freestyle/repeat/imported), KONG and pre-feature logs.
   */
  templateId?: string | null;
  templateDayKey?: string | null;
  /**
   * Q21: last-write timestamp for per-session cloud sync (V2). Absent on
   * older logs; readers fall back to endTime. Never required locally.
   */
  updatedAt?: number;
}

export interface FeedbackEntry {
  soreness: number;
  performance: number;
  adjustment: number;
}

export interface TutorialState {
  home: boolean;
  workout: boolean;
  history: boolean;
  stats: boolean;
  mesoSettings: boolean;
  nutrition: boolean;
}

export type SubscriptionTier = 'free' | 'monthly' | 'yearly' | 'lifetime' | 'demo';

export interface UserSubscription {
  isPro: boolean;
  tier: SubscriptionTier;
  expiryDate: number | null;
}

export interface UserProfile {
  daysPerWeek: number;
  goal: 'hypertrophy' | 'strength' | 'endurance';
  sessionDuration: 'short' | 'medium' | 'long';
  subscription?: UserSubscription;
  // NEW: Body Stats
  bodyWeight?: number;
  height?: number;
  bodyFat?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  nutritionGoal?: 'cut' | 'maintain' | 'bulk';
}

export interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface DailyNutrition {
  id: string; // YYYY-MM-DD
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  water: number; // in ml
}

export interface BodyLog {
  id: number;
  date: number;
  weight: number;
  bodyFat?: number;
  notes?: string;
}

export type MeasurementMetricKey = 'weight' | 'bodyFat' | 'calories' | 'neck' | 'shoulders' | 'chest' | 'bicepsL' | 'bicepsR' | 'forearmL' | 'forearmR' | 'upperAbs' | 'lowerAbs' | 'waist' | 'hips' | 'thighL' | 'thighR' | 'calfL' | 'calfR';

export interface MeasurementLog {
  id: number;
  date: number;
  weight?: number;
  bodyFat?: number;
  calories?: number;
  neck?: number;
  shoulders?: number;
  chest?: number;
  bicepsL?: number;
  bicepsR?: number;
  forearmL?: number;
  forearmR?: number;
  upperAbs?: number;
  lowerAbs?: number;
  waist?: number;
  hips?: number;
  thighL?: number;
  thighR?: number;
  calfL?: number;
  calfR?: number;
  notes?: string;
}

// ─── TRAINING PREFERENCES (Strong parity) ───────────────────────────────────
// Canonical field names, value unions and defaults. Owned by
// utils/strongTraining.ts (TRAINING_CONFIG_DEFAULTS, TRAINING_CONFIG_KEYS,
// sanitizeTrainingConfig); this interface is the single type source —
// utils/strongTraining.ts re-exports these names for existing importers.
export type OneRmFormula = 'epley' | 'brzycki' | 'lombardi' | 'hybrid';
export type RestSoundName = 'boxingBell' | 'chime' | 'triTone' | 'shortBell';
export type WeekStart = 'monday' | 'sunday';
export type BodyWeightUnit = 'kg' | 'lb';
export type DistanceUnit = 'km' | 'mi';
export type SizeUnit = 'cm' | 'in';
export type RestIncrement = 5 | 10 | 15 | 30;
/**
 * Incomplete-set handling at finish: 'ask' = ask every time; 'complete' =
 * always mark unfinished sets as completed on finish; 'discard' = always
 * strip incomplete sets on finish.
 */
export type IncompleteSets = 'ask' | 'complete' | 'discard';
/**
 * Previous-performance source. Identity is the stable template pair
 * (templateId, templateDayKey), stamped at apply/build/completion;
 * logs or contexts without it fall back to the plan day (mesoId, dayIdx).
 * 'planDay' = latest log of the same day of the same template;
 * 'any' = latest log of the exercise in any workout.
 */
export type PreviousScope = 'any' | 'planDay';

/** Training preference fields stored in AppState['config']. */
export interface TrainingConfigFields {
    previousScope: PreviousScope;
    incompleteSets: IncompleteSets;
    /** Regular sets a newly added exercise starts with (1-10). */
    defaultSets: number;
    /** Base auto-rest for working sets, seconds (Strong default 2:00). */
    defaultRestSeconds: number;
    /** Auto-rest after warmup sets, seconds. */
    warmupRestSeconds: number;
    /** Step for the rest timer +/- buttons, seconds. */
    restIncrementSeconds: RestIncrement;
    restSound: boolean;
    restSoundName: RestSoundName;
    restVibrate: boolean;
    autoStartRest: boolean;
    autoFullscreen: boolean;
    simpleTimers: boolean;
    bodyWeightUnit: BodyWeightUnit;
    distanceUnit: DistanceUnit;
    sizeUnit: SizeUnit;
    weekStart: WeekStart;
    oneRmFormula: OneRmFormula;
    /** Adjust the xRM estimate by RPE (Strong "Factor in RPE"). */
    factorInRpe: boolean;
    /** Selected bar, canonical kg. */
    plateBarKg: number;
    /** Enabled plate denominations, canonical kg, descending. */
    platePlatesKg: number[];
}

export interface AppState {
  program: ProgramDay[];
  activeMeso: MesoCycle | null;
  activeSession: ActiveSession | null;
  exercises: ExerciseDef[];
  logs: Log[];
  config: {
    showRIR: boolean;
    rpEnabled: boolean;
    rpTargetRIR: number;
    keepScreenOn: boolean;
    restTimerDisplay?: 'compact' | 'expanded';
    /** Q11: display/entry unit. Stored data is always kg. Absent = 'kg'. */
    weightUnit?: WeightUnit;
  } & TrainingConfigFields;
  rpFeedback: Record<string, Record<string, Record<string, FeedbackEntry>>>;
  hasSeenOnboarding: boolean;
  tutorialProgress: TutorialState;
  userProfile?: UserProfile;
  lastUpdated?: number;
  globalTemplates?: GlobalTemplate[];
  templateFolders?: TemplateFolder[];
  personalTemplates?: GlobalTemplate[];
  nutritionLogs: NutritionLog[];
  cardioSessions: CardioSession[];
  nutritionGoal: NutritionGoal;
  bodyLogs: BodyLog[];
  measurementLogs: MeasurementLog[];
  macroGoals?: MacroGoals;
  customFoods?: CustomFood[];
}

export type SyncQueueEntryType =
  | 'UPLOAD_IDENTITY'
  | 'UPLOAD_SESSION_SNAPSHOT'
  | 'UPLOAD_STATE_SNAPSHOT';

export type DirtySyncSection =
  | 'program'
  | 'activeMeso'
  | 'exercises'
  | 'logs'
  | 'config'
  | 'rpFeedback'
  | 'userProfile'
  | 'nutritionLogs'
  | 'cardioSessions'
  | 'nutritionGoal'
  | 'bodyLogs'
  | 'macroGoals'
  | 'customFoods'
  | 'personalTemplates'
  | 'templateFolders'
  | 'measurementLogs';

export type SectionSyncMeta = Partial<Record<DirtySyncSection, number>>;

export type CloudSyncSnapshot = Partial<AppState> & {
  syncMeta?: SectionSyncMeta;
  source?: 'network' | 'cache';
  cachedAt?: number;
};

interface SyncQueueEntryBase {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export type SyncQueueEntry =
  | (SyncQueueEntryBase & {
      type: 'UPLOAD_IDENTITY';
      payload: { email: string };
    })
  | (SyncQueueEntryBase & {
      type: 'UPLOAD_SESSION_SNAPSHOT';
      payload: { lastUpdated: number; session: AppState['activeSession'] | null };
    })
  | (SyncQueueEntryBase & {
      type: 'UPLOAD_STATE_SNAPSHOT';
      payload: { state: Partial<AppState> & { email?: string | null }; sections?: DirtySyncSection[] };
    });

// ─── CUSTOM FOOD DATABASE ──────────────────────────────────────────
export interface CustomFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;      // "100g", "1 unidad", etc.
  isFavorite?: boolean;
  createdAt: number;
}

// ─── NUTRITION TYPES ───────────────────────────────────────────────
export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;   // gramos
  carbs: number;     // gramos
  fat: number;       // gramos
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: number; // Date.now()
}

export interface NutritionLog {
  date: string;       // "YYYY-MM-DD"
  entries: FoodEntry[];
  waterMl?: number;   // ml de agua consumida
}

export interface NutritionGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ─── CARDIO TYPES ───────────────────────────────────────────────────
export type CardioActivityType =
  | 'running' | 'cycling' | 'swimming' | 'walking'
  | 'rowing' | 'elliptical' | 'jump_rope' | 'hiit' | 'other';

export interface CardioSession {
  id: string;
  date: string;           // "YYYY-MM-DD"
  activityType: CardioActivityType;
  durationMin: number;
  distanceKm?: number;
  caloriesBurned?: number;
  avgHeartRate?: number;
  notes?: string;
  timestamp: number;
}
