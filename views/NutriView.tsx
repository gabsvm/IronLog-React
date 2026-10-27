import { pickLang } from '../utils/i18n';
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useApp, useAppPreferences, useAppConfig } from '../context/AppContext';
import { FoodEntry, CardioSession, BodyLog } from '../types';
import { AddMealModal } from '../components/nutrition/AddMealModal';
import { AddCardioModal } from '../components/nutrition/AddCardioModal';
import { LogWeightModal } from '../components/nutrition/LogWeightModal';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { triggerHaptic } from '../utils/audio';
import { TRANSLATIONS } from '../constants';
import { resolveWeightUnit } from '../utils/units';
import { useTrainingConfig } from '../hooks/useTrainingConfig';


// Extracted in Phase 6.3 to views/nutri/ for clarity
import { todayStr, getTodayLog, sumMacros, calcStreak, calcTDEE } from './nutri/nutritionHelpers';
import { formatLocalDateKey, addLocalDays } from '../utils/localDate';
import { TodayTab } from './nutri/TodayTab';
import { BodyTab } from './nutri/BodyTab';
import { MeasurementsSection } from '../components/measurements/MeasurementsSection';
import { HistoryTab } from './nutri/HistoryTab';

// ─── COMPONENT ──────────────────────────────────────────────────────
export type NutriSubTab = 'today' | 'body' | 'history';

interface NutriViewProps {
  subTab: NutriSubTab;
  onSubTabChange: (tab: NutriSubTab) => void;
  addMealRequested?: boolean;
  onAddMealHandled?: () => void;
}

export const NutriView: React.FC<NutriViewProps> = ({ subTab, onSubTabChange, addMealRequested, onAddMealHandled }) => {
  const {
    nutritionLogs, setNutritionLogs,
    cardioSessions, setCardioSessions,
    nutritionGoal, setNutritionGoal,
    userProfile, setUserProfile, bodyLogs, setBodyLogs,
  } = useApp();
  const { lang } = useAppPreferences();
  const { config } = useAppConfig();
  // Strong-parity independent units (SettingsParity live binding until the
  // config migration lands). Storage stays canonical (kg/km); prefs affect
  // display and entry only — historical sessions are never rewritten.
  const [trainingPrefs] = useTrainingConfig();
  const unit = trainingPrefs.bodyWeightUnit ?? resolveWeightUnit(config);
  const distanceUnit = trainingPrefs.distanceUnit;

  const nutritionLogsRef = useRef(nutritionLogs);
  nutritionLogsRef.current = nutritionLogs;
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardioSessionsRef = useRef(cardioSessions);
  cardioSessionsRef.current = cardioSessions;
  const undoCardioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (undoCardioTimerRef.current) clearTimeout(undoCardioTimerRef.current);
    };
  }, []);

  const [showAddMeal, setShowAddMeal]   = useState(false);
  const [showAddCardio, setShowAddCardio] = useState(false);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [showLogWeight, setShowLogWeight] = useState(false);
  const [expandedMeal, setExpandedMeal]   = useState<string | null>(null);
  const [editingEntry, setEditingEntry]     = useState<FoodEntry | null>(null);
  const [editEntryDraft, setEditEntryDraft] = useState<FoodEntry | null>(null);
  const [editGoal, setEditGoal]           = useState(nutritionGoal);
  const [lastDeletedEntry, setLastDeletedEntry] = useState<{ entry: FoodEntry; date: string } | null>(null);
  const [lastDeletedCardio, setLastDeletedCardio] = useState<CardioSession | null>(null);

  useEffect(() => {
    if (!addMealRequested) return;
    setShowAddMeal(true);
    onAddMealHandled?.();
  }, [addMealRequested, onAddMealHandled]);

  const todayLog    = useMemo(() => getTodayLog(nutritionLogs), [nutritionLogs]);
  const todayMacros = useMemo(() => sumMacros(todayLog.entries), [todayLog]);
  const todayWater  = todayLog.waterMl ?? 0;
  const todayCardio = useMemo(() => { const d = todayStr(); return cardioSessions.filter(s => s.date === d); }, [cardioSessions]);
  const streak      = useMemo(() => calcStreak(nutritionLogs), [nutritionLogs]);
  const tdee        = useMemo(() => calcTDEE(userProfile), [userProfile]);

  const caloriesBurned    = useMemo(() => todayCardio.reduce((a, s) => a + (s.caloriesBurned || 0), 0), [todayCardio]);
  const caloriesRemaining = nutritionGoal.calories + caloriesBurned - todayMacros.calories;

  // Last 14 days for history (show more data)
  const last14Days = useMemo(() => {
    const days = [];
    const todayKey = todayStr();
    for (let i = 13; i >= 0; i--) {
      const dateStr = addLocalDays(todayKey, -i);
      const d = new Date(); d.setDate(d.getDate() - i);
      const log = nutritionLogs.find(l => l.date === dateStr);
      const macros = log ? sumMacros(log.entries) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
      days.push({
        date: dateStr,
        label: d.toLocaleDateString(pickLang(lang, { es: 'es-AR', en: 'en-US' }), { weekday: 'short' }),
        shortDate: d.toLocaleDateString(pickLang(lang, { es: 'es-AR', en: 'en-US' }), { day: 'numeric' }),
        isToday: i === 0,
        ...macros,
      });
    }
    return days;
  }, [nutritionLogs, lang]);

  // Body weight last 30 days
  const weightTrend = useMemo(() => {
    return [...bodyLogs]
      .sort((a, b) => a.date - b.date)
      .slice(-30);
  }, [bodyLogs]);

  const recentWeighIns = useMemo(() => [...weightTrend].reverse().slice(0, 7), [weightTrend]);
  const historyDayList = useMemo(() => [...last14Days].reverse().filter(d => d.calories > 0), [last14Days]);

  // ─── HANDLERS ────────────────────────────────────────────────────
  const handleAddMeal = useCallback((entry: FoodEntry) => {
    const today = todayStr();
    setNutritionLogs(prev => {
      const existing = prev.find(l => l.date === today);
      if (existing) return prev.map(l => l.date === today ? { ...l, entries: [...l.entries, entry] } : l);
      return [...prev, { date: today, entries: [entry], waterMl: 0 }];
    });
    triggerHaptic('success');
  }, [setNutritionLogs]);

  const handleDeleteMeal = useCallback((entryId: string) => {
    const today = todayStr();
    const log = nutritionLogsRef.current.find(l => l.date === today);
    const entry = log?.entries.find(e => e.id === entryId);
    if (!entry) return;

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setLastDeletedEntry({ entry, date: today });
    setNutritionLogs(prev =>
      prev.map(l => l.date === today ? { ...l, entries: l.entries.filter(e => e.id !== entryId) } : l)
    );
    triggerHaptic('medium');

    undoTimerRef.current = setTimeout(() => {
      setLastDeletedEntry(prev => (prev?.entry.id === entryId ? null : prev));
      undoTimerRef.current = null;
    }, 5000);
  }, [setNutritionLogs]);

  const handleUndoDelete = useCallback(() => {
    if (!lastDeletedEntry) return;
    const { entry, date } = lastDeletedEntry;
    if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null; }
    setNutritionLogs(prev => {
      const log = prev.find(l => l.date === date);
      if (log) return prev.map(l => l.date === date ? { ...l, entries: [...l.entries, entry] } : l);
      return [...prev, { date, entries: [entry], waterMl: 0 }];
    });
    setLastDeletedEntry(null);
    triggerHaptic('success');
  }, [lastDeletedEntry, setNutritionLogs]);

  const handleEditEntry = useCallback((entry: FoodEntry) => {
    setEditingEntry(entry);
    setEditEntryDraft({ ...entry });
  }, []);

  const handleSaveEditEntry = useCallback(() => {
    if (!editEntryDraft) return;
    const today = todayStr();
    setNutritionLogs(prev =>
      prev.map(l => l.date === today
        ? { ...l, entries: l.entries.map(e => e.id === editEntryDraft.id ? editEntryDraft : e) }
        : l
      )
    );
    setEditingEntry(null);
    setEditEntryDraft(null);
    triggerHaptic('success');
  }, [editEntryDraft, setNutritionLogs]);

  const handleAddCardio = useCallback((session: CardioSession) => {
    setCardioSessions(prev => [session, ...prev]);
  }, [setCardioSessions]);

  const handleDeleteCardio = useCallback((id: string) => {
    const session = cardioSessionsRef.current.find(s => s.id === id);
    if (!session) return;
    if (undoCardioTimerRef.current) clearTimeout(undoCardioTimerRef.current);
    setLastDeletedCardio(session);
    setCardioSessions(prev => prev.filter(s => s.id !== id));
    triggerHaptic('medium');
    undoCardioTimerRef.current = setTimeout(() => {
      setLastDeletedCardio(null);
      undoCardioTimerRef.current = null;
    }, 5000);
  }, [setCardioSessions]);

  const handleUndoDeleteCardio = useCallback(() => {
    if (!lastDeletedCardio) return;
    if (undoCardioTimerRef.current) { clearTimeout(undoCardioTimerRef.current); undoCardioTimerRef.current = null; }
    setCardioSessions(prev => [lastDeletedCardio, ...prev]);
    setLastDeletedCardio(null);
    triggerHaptic('success');
  }, [lastDeletedCardio, setCardioSessions]);

  const handleAddWater = useCallback((ml: number) => {
    const today = todayStr();
    setNutritionLogs(prev => {
      const existing = prev.find(l => l.date === today);
      if (existing) return prev.map(l => l.date === today ? { ...l, waterMl: (l.waterMl ?? 0) + ml } : l);
      return [...prev, { date: today, entries: [], waterMl: ml }];
    });
    triggerHaptic('light');
  }, [setNutritionLogs]);

  const handleLogWeight = useCallback((data: { weight: number; bodyFat?: number; notes?: string }) => {
    const now = Date.now();
    const today = todayStr();
    const entry: BodyLog = { id: now, date: now, weight: data.weight, bodyFat: data.bodyFat, notes: data.notes };
    setBodyLogs(prev => [entry, ...prev.filter(l => formatLocalDateKey(new Date(l.date)) !== today)]);
    setUserProfile((prev: any) => ({
      ...(prev || {}),
      bodyWeight: entry.weight,
      ...(entry.bodyFat !== undefined ? { bodyFat: entry.bodyFat } : {})
    }));
  }, [setBodyLogs, setUserProfile]);

  const saveGoal = useCallback(() => {
    setNutritionGoal(editGoal);
    setShowGoalEditor(false);
  }, [editGoal, setNutritionGoal]);


  // Latest body log
  const latestWeight = weightTrend.length > 0 ? weightTrend[weightTrend.length - 1] : null;

  // ─── RENDER ──────────────────────────────────────────────────────
    return (
        <div className="space-y-4 px-4 pb-8">
            {/* The Diary tab names the section; adding a meal lives in Today's primary action. */}
            <h2 className="sr-only">{TRANSLATIONS[lang].navDiaryNutrition}</h2>
            {/* ── Sub-tabs ── */}
            <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-[rgb(var(--surface-app))]">
                <div className="seg-reference grid-cols-3">
                    {([
                        { id: 'today',   label: TRANSLATIONS[lang].copy.nutri.today,        icon: 'Utensils' },
                        { id: 'body',    label: TRANSLATIONS[lang].copy.nutri.body,      icon: 'Scale' },
                        { id: 'history', label: TRANSLATIONS[lang].dietTrends, icon: 'BarChart2' },
                    ] as { id: NutriSubTab; label: string; icon: string }[]).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => onSubTabChange(tab.id)}
                            aria-pressed={subTab === tab.id}
                            className={`flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-[10px] px-1 text-xs font-semibold tracking-normal ${
                                subTab === tab.id ? 'bg-surface-elevated text-[rgb(var(--text-primary))]' : 'text-muted hover:text-[rgb(var(--text-primary))]'
                            }`}
                        >
                            <Icon name={tab.icon} size={12} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

      <div>
        {/* ─── TAB: TODAY ─────────────────────────────────────── */}
        {subTab === 'today' && (
          <TodayTab
            lang={lang}
            streak={streak}
            todayMacros={todayMacros}
            todayWater={todayWater}
            todayCardio={todayCardio}
            distanceUnit={distanceUnit}
            todayLog={todayLog}
            nutritionGoal={nutritionGoal}
            caloriesRemaining={caloriesRemaining}
            caloriesBurned={caloriesBurned}
            expandedMeal={expandedMeal}
            setExpandedMeal={setExpandedMeal}
            onAddMeal={() => setShowAddMeal(true)}
            onAddCardio={() => setShowAddCardio(true)}
            onEditGoals={() => { setEditGoal(nutritionGoal); setShowGoalEditor(true); }}
            onAddWater={handleAddWater}
            onDeleteCardio={handleDeleteCardio}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteMeal}
          />
        )}
        {/* ─── TAB: BODY ──────────────────────────────────────── */}
        {subTab === 'body' && (
          <BodyTab
            lang={lang}
            latestWeight={latestWeight}
            weightTrend={weightTrend}
            recentWeighIns={recentWeighIns}
            nutritionGoal={nutritionGoal}
            todayCalories={todayMacros.calories}
            tdee={tdee}
            bodyWeight={userProfile?.bodyWeight}
            bodyFat={userProfile?.bodyFat}
            onLogWeight={() => setShowLogWeight(true)}
            unit={unit}
            measurements={<MeasurementsSection />}
          />
        )}

        {/* ─── TAB: HISTORY ───────────────────────────────────── */}
        {subTab === 'history' && (
          <HistoryTab
            lang={lang}
            last14Days={last14Days}
            historyDayList={historyDayList}
            nutritionGoal={nutritionGoal}
            onGoToday={() => onSubTabChange('today')}
          />
        )}
      </div>

      {/* ─── EDIT ENTRY MODAL ──────────────────────────────── */}
      <Sheet
        open={!!editingEntry && !!editEntryDraft}
        onOpenChange={(open) => { if (!open) { setEditingEntry(null); setEditEntryDraft(null); } }}
        title={editEntryDraft?.name ?? ''}
        accent="primary"
        footer={
          <Button onClick={handleSaveEditEntry} fullWidth>
            {TRANSLATIONS[lang].copy.nutri.saveChanges}
          </Button>
        }
      >
        {editEntryDraft && (
          <div className="p-5 space-y-5">
            <p className="text-xs text-muted -mt-3">{TRANSLATIONS[lang].copy.nutri.editNutritionValues}</p>
            {/* Quick multiplier buttons */}
            <div>
              <p className="text-xs font-semibold text-muted mb-2">{TRANSLATIONS[lang].copy.nutri.quickScale}</p>
              <div className="flex gap-2">
                {[0.5, 0.75, 1, 1.5, 2].map(mult => (
                  <button
                    key={mult}
                    onClick={() => {
                      if (!editEntryDraft || !editingEntry) return;
                      setEditEntryDraft({
                        ...editEntryDraft,
                        calories: Math.round(editingEntry.calories * mult),
                        protein:  Math.round(editingEntry.protein  * mult),
                        carbs:    Math.round(editingEntry.carbs    * mult),
                        fat:      Math.round(editingEntry.fat      * mult),
                      });
                    }}
                    className="min-h-[44px] flex-1 rounded-xl bg-surface-elevated px-1 text-secondary text-xs font-semibold transition-colors hover:bg-surface-raised"
                  >
                    ×{mult}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual edit fields */}
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: 'calories', label: TRANSLATIONS[lang].copy.nutri.calories, unit: 'kcal', color: 'text-secondary' },
                { key: 'protein',  label: TRANSLATIONS[lang].copy.nutri.protein,  unit: 'g', color: 'text-blue-700 dark:text-blue-400' },
                { key: 'carbs',    label: TRANSLATIONS[lang].copy.nutri.carbs,       unit: 'g', color: 'text-amber-800 dark:text-amber-400' },
                { key: 'fat',      label: TRANSLATIONS[lang].copy.nutri.fat,         unit: 'g', color: 'text-pink-700 dark:text-pink-400' },
              ] as const).map(({ key, label, unit, color }) => (
                <div key={key}>
                  <label htmlFor={`edit-meal-${key}`} className={`text-xs font-semibold ${color} mb-1 block`}>{label} <span className="text-muted">({unit})</span></label>
                  <input
                    id={`edit-meal-${key}`}
                    type="number"
                    inputMode="numeric"
                    value={editEntryDraft[key]}
                    onChange={e => setEditEntryDraft(prev => prev ? { ...prev, [key]: Math.max(0, Number(e.target.value)) } : prev)}
                    className="gl-input"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Sheet>

      {/* ─── GOAL EDITOR MODAL ─────────────────────────────── */}
      <Sheet
        open={showGoalEditor}
        onOpenChange={setShowGoalEditor}
        title={TRANSLATIONS[lang].copy.nutri.editGoals}
        accent="primary"
        footer={
          <Button onClick={saveGoal} fullWidth>
            {TRANSLATIONS[lang].copy.nutri.saveGoals}
          </Button>
        }
      >
        <div className="p-5 space-y-4">
          {tdee && (
            <p className="text-xs text-muted -mt-2">
              {TRANSLATIONS[lang].copy.nutri.estimatedTdee}: <span className="text-secondary font-semibold">{tdee} kcal</span>
            </p>
          )}
          <div className="space-y-3">
            {(['calories', 'protein', 'carbs', 'fat'] as const).map(key => (
              <div key={key}>
                <label htmlFor={`nutrition-goal-${key}`} className="text-xs text-muted mb-1 block">{TRANSLATIONS[lang].copy.nutri[key]} {key === 'calories' ? '(kcal)' : '(g)'}</label>
                <input
                  id={`nutrition-goal-${key}`}
                  type="number"
                  inputMode="numeric"
                  value={editGoal[key]}
                  onChange={e => setEditGoal(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="gl-input"
                />
              </div>
            ))}
          </div>
        </div>
      </Sheet>

      {/* Modals */}
      <AddMealModal   isOpen={showAddMeal}   onClose={() => setShowAddMeal(false)}   onAdd={handleAddMeal}   lang={lang} />
      <AddCardioModal isOpen={showAddCardio} onClose={() => setShowAddCardio(false)} onAdd={handleAddCardio} lang={lang} />
      <LogWeightModal isOpen={showLogWeight} onClose={() => setShowLogWeight(false)} onLog={handleLogWeight} />

      {/* Undo Snackbars — stacked, food + cardio */}
      <div className="fixed bottom-24 left-4 right-4 z-modal flex flex-col gap-2 pointer-events-none">
        {lastDeletedEntry && (
          <div className="flex items-center justify-between bg-surface-elevated text-[rgb(var(--text-primary))] px-4 py-3 rounded-2xl shadow-sm border border-border-strong pointer-events-auto">
            <div className="flex items-center gap-2">
              <Icon name="Trash2" size={14} className="text-secondary" />
              <span className="text-xs font-bold">{TRANSLATIONS[lang].copy.nutri.itemDeleted}</span>
            </div>
            <button onClick={handleUndoDelete} className="min-h-11 text-xs font-semibold text-accent px-2">
              {TRANSLATIONS[lang].copy.nutri.undo}
            </button>
          </div>
        )}
        {lastDeletedCardio && (
          <div className="flex items-center justify-between bg-surface-elevated text-[rgb(var(--text-primary))] px-4 py-3 rounded-2xl shadow-sm border border-border-strong pointer-events-auto">
            <div className="flex items-center gap-2">
              <Icon name="Flame" size={14} className="text-secondary" />
              <span className="text-xs font-bold">{TRANSLATIONS[lang].copy.nutri.cardioDeleted}</span>
            </div>
            <button onClick={handleUndoDeleteCardio} className="min-h-11 text-xs font-semibold text-accent px-2">
              {TRANSLATIONS[lang].copy.nutri.undo}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
