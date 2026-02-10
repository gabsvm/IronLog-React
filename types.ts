
export type Lang = 'en' | 'es';
export type Theme = 'light' | 'dark' | 'system';
export type ColorTheme = 'iron' | 'ocean' | 'forest' | 'royal' | 'sunset' | 'monochrome';

// Add Window extension
declare global {
    interface Window {
        deferredPrompt: any;
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

export type SetType = 'regular' | 'myorep' | 'myorep_match' | 'cluster' | 'top' | 'backoff' | 'giant' | 'warmup';

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
}

export interface ProgramSlot {
  muscle: MuscleGroup;
  setTarget: number;
  reps?: string;
  exerciseId?: string | null;
  supersetId?: string; 
  setType?: SetType; // NEW: Persist preferred set type
}

export interface ProgramDay {
  id: string;
  dayName: { en: string; es: string };
  slots: ProgramSlot[];
}

export type MesoType = 'hyp_1' | 'hyp_2' | 'metabolite' | 'resensitization' | 'full_body' | 'wizard' | 'male_physique' | 'toji_fushiguro' | string;

export interface GlobalTemplate {
    id: string;
    name: string; 
    title: { en: string, es: string };
    description: { en: string, es: string };
    isPro: boolean;
    program: ProgramDay[];
    order: number; 
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
    mesoSettings: boolean; // NEW: Specific tutorial for the settings modal
}

export type SubscriptionTier = 'free' | 'monthly' | 'yearly' | 'lifetime';

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
}
