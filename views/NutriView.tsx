import { pickLang } from '../utils/i18n';
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
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


// Extracted in Phase 6.3 to views/nutri/ for clarity
import { todayStr, getTodayLog, sumMacros, calcStreak, calcTDEE } from './nutri/nutritionHelpers';
import { formatLocalDateKey, addLocalDays } from '../utils/localDate';
import { TodayTab } from './nutri/TodayTab';
import { BodyTab } from './nutri/BodyTab';
import { HistoryTab } from './nutri/HistoryTab';

// ─── COMPONENT ──────────────────────────────────────────────────────
type SubTab = 'today' | 'body' | 'history';

export const NutriView: React.FC = () => {
  const {
    lang, nutritionLogs, setNutritionLogs,
    cardioSessions, setCardioSessions,
    nutritionGoal, setNutritionGoal,
    userProfile, setUserProfile, bodyLogs, setBodyLogs, config
  } = useApp();
  const unit = resolveWeightUnit(config);

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

  const [subTab, setSubTab]             = useState<SubTab>('today');
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

  const todayLog    = useMemo(() => getTodayLog(nutritionLogs), [nutritionLogs]);
  const todayMacros = useMemo(() => sumMacros(todayLog.entries), [todayLog]);
  const todayWater  = todayLog.waterMl ?? 0;
  const todayCardio = useMemo(() => { const d = todayStr(); return cardioSessions.filter(s => s.date === d); }, [cardioSessions]);
  const streak      = useMemo(() => calcStreak(nutritionLogs), [nutritionLogs]);
  const tdee        = useMemo(() => calcTDEE(userProfile), [userProfile]);

  const caloriesBurned    = useMemo(() => todayCardio.reduce((a, s) => a + (s.caloriesBurned || 0), 0), [todayCardio]);
  const caloriesRemaining = nutritionGoal.calories + caloriesBurned - todayMacros.calories;
  const proteinRemaining  = nutritionGoal.protein - todayMacros.protein;

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
      {/* ── Header ── */}
      <div className="pt-2">
        <h1 className="text-[20px] font-black uppercase tracking-tight text-[rgb(var(--text-primary))]">
          {pickLang(lang, { es: 'NUTRICIÓN', en: 'NUTRITION' })}
        </h1>
      </div>

      {/* ── Sub-tabs ── */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-[rgb(var(--surface-app))]">
        <div className="seg-reference grid grid-cols-3 rounded-[6px] p-1 bg-surface-raised border border-border-subtle">
          {([
            { id: 'today',   label: TRANSLATIONS[lang].copy.nutri.today,        icon: 'Utensils' },
            { id: 'body',    label: TRANSLATIONS[lang].copy.nutri.body,      icon: 'Scale' },
            { id: 'history', label: TRANSLATIONS[lang].dietTrends, icon: 'BarChart2' },
          ] as { id: SubTab; label: string; icon: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              aria-pressed={subTab === tab.id}
              className={`expressive-press flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-[4px] py-2 text-[11px] font-extrabold uppercase tracking-wider transition-all ${
                subTab === tab.id ? 'bg-primary-500 text-zinc-950 shadow-sm' : 'text-muted hover:text-[rgb(var(--text-primary))]'
              }`}
            >
              <Icon name={tab.icon as any} size={12} />
              <span className="truncate">{tab.label}</span>
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
            todayLog={todayLog}
            nutritionGoal={nutritionGoal}
            caloriesRemaining={caloriesRemaining}
            caloriesBurned={caloriesBurned}
            proteinRemaining={proteinRemaining}
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
          />
        )}

        {/* ─── TAB: HISTORY ───────────────────────────────────── */}
        {subTab === 'history' && (
          <HistoryTab
            lang={lang}
            last14Days={last14Days}
            historyDayList={historyDayList}
            nutritionGoal={nutritionGoal}
            onGoToday={() => setSubTab('today')}
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
            <p className="text-[11px] text-zinc-500 -mt-3">{TRANSLATIONS[lang].copy.nutri.editNutritionValues}</p>
            {/* Quick multiplier buttons */}
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{TRANSLATIONS[lang].copy.nutri.quickScale}</p>
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
                    className="flex-1 py-2 rounded-[6px] bg-zinc-800 text-zinc-300 text-xs font-bold active:scale-95 transition-all hover:bg-zinc-700"
                  >
                    ×{mult}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual edit fields */}
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: 'calories', label: TRANSLATIONS[lang].copy.nutri.calories, unit: 'kcal', color: 'text-zinc-300' },
                { key: 'protein',  label: TRANSLATIONS[lang].copy.nutri.protein,  unit: 'g', color: 'text-blue-400' },
                { key: 'carbs',    label: TRANSLATIONS[lang].copy.nutri.carbs,       unit: 'g', color: 'text-amber-400' },
                { key: 'fat',      label: TRANSLATIONS[lang].copy.nutri.fat,         unit: 'g', color: 'text-pink-400' },
              ] as const).map(({ key, label, unit, color }) => (
                <div key={key}>
                  <label className={`text-[11px] font-bold ${color} mb-1 block`}>{label} <span className="text-zinc-600">({unit})</span></label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={editEntryDraft[key]}
                    onChange={e => setEditEntryDraft(prev => prev ? { ...prev, [key]: Math.max(0, Number(e.target.value)) } : prev)}
                    className="w-full bg-zinc-800 border border-zinc-700/50 rounded-[6px] px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all glow-input-neon"
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
            <p className="text-[11px] text-zinc-500 -mt-2">
              {TRANSLATIONS[lang].copy.nutri.estimatedTdee}: <span className="text-zinc-300 font-bold">{tdee} kcal</span>
            </p>
          )}
          <div className="space-y-3">
            {(['calories', 'protein', 'carbs', 'fat'] as const).map(key => (
              <div key={key}>
                <label className="text-xs text-zinc-500 mb-1 block">{TRANSLATIONS[lang].copy.nutri[key]} {key === 'calories' ? '(kcal)' : '(g)'}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={editGoal[key]}
                  onChange={e => setEditGoal(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="w-full bg-zinc-800 border border-zinc-700/50 rounded-[6px] px-4 py-3 text-white text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all glow-input-neon"
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
          <div className="flex items-center justify-between bg-zinc-800 text-white px-4 py-3 rounded-[8px] shadow-2xl border border-zinc-700 animate-in fade-in slide-in-from-bottom-4 pointer-events-auto">
            <div className="flex items-center gap-2">
              <Icon name="Trash2" size={14} className="text-zinc-400" />
              <span className="text-xs font-bold">{TRANSLATIONS[lang].copy.nutri.itemDeleted}</span>
            </div>
            <button onClick={handleUndoDelete} className="text-xs font-black text-red-500 uppercase tracking-wider px-2 py-1 rounded-[4px] active:scale-95 transition-transform">
              {TRANSLATIONS[lang].copy.nutri.undo}
            </button>
          </div>
        )}
        {lastDeletedCardio && (
          <div className="flex items-center justify-between bg-zinc-800 text-white px-4 py-3 rounded-[8px] shadow-2xl border border-zinc-700 animate-in fade-in slide-in-from-bottom-4 pointer-events-auto">
            <div className="flex items-center gap-2">
              <Icon name="Flame" size={14} className="text-zinc-400" />
              <span className="text-xs font-bold">{TRANSLATIONS[lang].copy.nutri.cardioDeleted}</span>
            </div>
            <button onClick={handleUndoDeleteCardio} className="text-xs font-black text-red-500 uppercase tracking-wider px-2 py-1 rounded-[4px] active:scale-95 transition-transform">
              {TRANSLATIONS[lang].copy.nutri.undo}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
