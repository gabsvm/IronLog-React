
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

export interface ExerciseDef {
  id: string;
  name: string | { en: string; es: string };
  muscle: MuscleGroup;
  instructions?: { en: string; es: string };
  defaultCardioType?: CardioType;
  videoId?: string;
  isBodyweight?: boolean; // NEW: Bodyweight flag
}

export type SetType = 'regular' | 'myorep' | 'myorep_match' | 'cluster' | 'top' | 'backoff' | 'giant' | 'warmup' | 'avt_hop';

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

export type WeightUnit = 'kg' | 'lb' | 'pl';

export interface SessionExercise extends ExerciseDef {
  instanceId: number;
  slotLabel?: string;
  targetReps?: string;
  note?: string;
  sets: WorkoutSet[];
  weightUnit?: WeightUnit;
  plateWeight?: number;
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
}

export interface ProgramSlot {
  muscle: MuscleGroup;
  setTarget: number;
  reps?: string;
  exerciseId?: string | null;
  supersetId?: string;
  setType?: SetType; // NEW: Persist preferred set type
  isAVT?: boolean;         // flag para indicar que este slot usa sistema AVT
  avtRounds?: number;      // cuántos rounds por sesión (default: 3)
  avtStartReps?: number;   // reps objetivo por hop (default: 6)
  label?: string;          // NEW: Custom label for the exercise
  notes?: string;          // NEW: Notes for the exercise slot
  avtHops?: string;        // NEW: Number of hops (e.g. "6-10")
  restBetweenHopsSec?: number;  // NEW: Rest between hops
  restBetweenRoundsSec?: number; // NEW: Rest between rounds
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
  skipped?: boolean;
  mesoId: number;
  week: number;
  exercises: SessionExercise[];
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
    plateInventory: Record<number, number>;
  };
  rpFeedback: Record<string, Record<string, Record<string, FeedbackEntry>>>;
  hasSeenOnboarding: boolean;
  tutorialProgress: TutorialState;
  userProfile?: UserProfile;
  lastUpdated?: number;
  globalTemplates?: GlobalTemplate[];
  nutritionLogs: NutritionLog[];
  cardioSessions: CardioSession[];
  nutritionGoal: NutritionGoal;
  bodyLogs: BodyLog[];
  macroGoals?: MacroGoals;
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
