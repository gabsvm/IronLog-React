
export type Lang = 'en' | 'es';
export type Theme = 'light' | 'dark' | 'system';
export type ColorTheme = 'iron' | 'ocean' | 'forest' | 'royal' | 'sunset' | 'monochrome';

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
  source?: 'nilsson_bw';         // Origin tag (e.g. Nick Nilsson Best Bodyweight Exercises)
}

export type SetType = 'regular' | 'myorep' | 'myorep_match' | 'cluster' | 'top' | 'backoff' | 'giant' | 'warmup' | 'avt_hop' | 'emom' | 'drop' | 'rest_pause' | 'time_volume' | 'triple_add';

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
  avtRoundId?: number;  // ID compartido entre todos los hops de un mismo round AVT
  isLastHop?: boolean;  // true en el hop donde se llegó al fallo
}

export type WeightUnit = 'kg' | 'lb';

export interface SessionExercise extends ExerciseDef {
  instanceId: number;
  slotLabel?: string;
  targetReps?: string;
  note?: string;
  sets: WorkoutSet[];
  supersetId?: string;
  isPlaceholder?: boolean;
  cardioType?: CardioType;
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
}

export interface ProgramDay {
  id: string;
  dayName: { en: string; es: string };
  slots: ProgramSlot[];
  notes?: string;          // NEW: Notes for the training day
}

export type MesoType = 'hyp_1' | 'hyp_2' | 'metabolite' | 'resensitization' | 'full_body' | 'wizard' | 'male_physique' | 'toji_fushiguro' | 'tokita' | string;

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
  experience: 'beginner' | 'intermediate' | 'advanced';
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
  };
  rpFeedback: Record<string, Record<string, Record<string, FeedbackEntry>>>;
  hasSeenOnboarding: boolean;
  tutorialProgress: TutorialState;
  userProfile?: UserProfile;
  lastUpdated?: number;
  globalTemplates?: GlobalTemplate[];
  personalTemplates?: GlobalTemplate[];
  nutritionLogs: NutritionLog[];
  cardioSessions: CardioSession[];
  nutritionGoal: NutritionGoal;
  bodyLogs: BodyLog[];
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
  | 'personalTemplates';

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
