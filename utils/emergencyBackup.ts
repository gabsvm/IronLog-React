import { entries } from 'idb-keyval';

export interface EmergencyBackupResult {
  filename: string;
  payload: any;
}

export const getPreferredLanguage = (): 'es' | 'en' => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('il_lang_v1');
      if (saved === 'es' || saved === 'en') return saved;
      const nav = window.navigator?.language?.toLowerCase() || '';
      if (nav.startsWith('es')) return 'es';
    }
  } catch { }
  return 'en';
};

export const generateEmergencyBackup = async (): Promise<EmergencyBackupResult> => {
  const lsData: Record<string, any> = {};
  if (typeof window !== 'undefined' && window.localStorage) {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && (key.startsWith('il_') || key.startsWith('ironlog_') || key === 'active_session')) {
        try {
          const val = window.localStorage.getItem(key);
          lsData[key] = val ? JSON.parse(val) : val;
        } catch {
          lsData[key] = window.localStorage.getItem(key);
        }
      }
    }
  }

  const idbData: Record<string, any> = {};
  try {
    const idbEntries = await entries();
    for (const [key, val] of idbEntries) {
      if (typeof key === 'string' && (key.startsWith('il_') || key.startsWith('ironlog_') || key === 'active_session')) {
        idbData[key] = val;
      }
    }
  } catch (err) {
    console.warn('[EmergencyBackup] Failed to read IndexedDB via idb-keyval:', err);
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `gainslab-emergency-backup-${dateStr}.json`;

  const payload = {
    schema: 'gainslab-backup',
    version: 1,
    exportedAt: Date.now(),
    appVersion: '4.0.3-emergency',
    state: {
      program: idbData.il_prog_v16 ?? lsData.il_prog_v16 ?? [],
      exercises: idbData.il_ex_v16 ?? lsData.il_ex_v16 ?? [],
      logs: idbData.il_logs_v16 ?? lsData.il_logs_v16 ?? [],
      activeMeso: idbData.il_meso_v16 ?? lsData.il_meso_v16 ?? null,
      activeSession: idbData.il_session_v16 ?? lsData.il_session_v16 ?? null,
      userProfile: idbData.il_profile_v1 ?? lsData.il_profile_v1,
      nutritionLogs: idbData.il_nutrition_v1 ?? lsData.il_nutrition_v1 ?? [],
      cardioSessions: idbData.il_cardio_v1 ?? lsData.il_cardio_v1 ?? [],
      bodyLogs: idbData.il_body_v1 ?? lsData.il_body_v1 ?? [],
      macroGoals: idbData.il_macros_v1 ?? lsData.il_macros_v1 ?? null,
      nutritionGoal: idbData.il_nut_goal_v1 ?? lsData.il_nut_goal_v1,
      personalTemplates: idbData.il_personal_templates_v1 ?? lsData.il_personal_templates_v1 ?? [],
      customFoods: idbData.il_custom_foods_v1 ?? lsData.il_custom_foods_v1 ?? [],
      rpFeedback: idbData.il_rp_fb_v1 ?? lsData.il_rp_fb_v1 ?? {},
      config: {
        showRIR: lsData.il_cfg_rir,
        rpEnabled: lsData.il_cfg_rp,
        rpTargetRIR: lsData.il_cfg_rp_rir,
        keepScreenOn: lsData.il_cfg_screen,
      },
    },
    rawStorage: {
      indexedDB: idbData,
      localStorage: lsData,
    },
  };

  return { filename, payload };
};

export const downloadEmergencyBackup = async (): Promise<string> => {
  const { filename, payload } = await generateEmergencyBackup();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
};
