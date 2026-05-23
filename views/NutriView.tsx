import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { FoodEntry, CardioSession, NutritionLog, NutritionGoal, BodyLog } from '../types';
import { MacroRing } from '../components/nutrition/MacroRing';
import { AddMealModal } from '../components/nutrition/AddMealModal';
import { AddCardioModal } from '../components/nutrition/AddCardioModal';
import { LogWeightModal } from '../components/nutrition/LogWeightModal';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { triggerHaptic } from '../utils/audio';


// Extracted in Phase 6.3 to views/nutri/ for clarity
import { todayStr, getTodayLog, sumMacros, MEAL_ORDER, MEAL_META, ACTIVITY_EMOJI, WATER_GOAL_ML, calcStreak, calcTDEE } from './nutri/nutritionHelpers';
import { MacroBar } from './nutri/MacroBar';
import { WaterTracker } from './nutri/WaterTracker';
import { BodyTab } from './nutri/BodyTab';
import { HistoryTab } from './nutri/HistoryTab';

// ─── COMPONENT ──────────────────────────────────────────────────────
type SubTab = 'today' | 'body' | 'history';

export const NutriView: React.FC = () => {
  const {
    lang, nutritionLogs, setNutritionLogs,
    cardioSessions, setCardioSessions,
    nutritionGoal, setNutritionGoal,
    userProfile, bodyLogs, setBodyLogs
  } = useApp();

  const nutritionLogsRef = useRef(nutritionLogs);
  nutritionLogsRef.current = nutritionLogs;
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardioSessionsRef = useRef(cardioSessions);
  cardioSessionsRef.current = cardioSessions;
  const undoCardioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const log = nutritionLogs.find(l => l.date === dateStr);
      const macros = log ? sumMacros(log.entries) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
      days.push({
        date: dateStr,
        label: d.toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', { weekday: 'short' }),
        shortDate: d.toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', { day: 'numeric' }),
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
    setBodyLogs(prev => [entry, ...prev.filter(l => new Date(l.date).toISOString().split('T')[0] !== today)]);
  }, [setBodyLogs]);

  const saveGoal = useCallback(() => {
    setNutritionGoal(editGoal);
    setShowGoalEditor(false);
  }, [editGoal, setNutritionGoal]);

  const l = (en: string, es: string) => lang === 'en' ? en : es;

  // Latest body log
  const latestWeight = weightTrend.length > 0 ? weightTrend[weightTrend.length - 1] : null;

  // ─── RENDER ──────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* ── Sub-tabs ── */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex gap-1 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
          {([
            { id: 'today',   label: l('Today', 'Hoy'),        icon: 'Utensils' },
            { id: 'body',    label: l('Body', 'Cuerpo'),      icon: 'Scale' },
            { id: 'history', label: l('History', 'Historial'), icon: 'BarChart2' },
          ] as { id: SubTab; label: string; icon: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                subTab === tab.id ? 'bg-white text-black' : 'text-zinc-500'
              }`}
            >
              <Icon name={tab.icon as any} size={12} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-container px-4 pb-28">

        {/* ─── TAB: TODAY ─────────────────────────────────────── */}
        {subTab === 'today' && (
          <div className="space-y-3 pt-1">

            {/* Hero card — calories + key metrics */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                    {l('Today', 'Hoy')}
                    {streak > 1 && (
                      <span className="ml-2 text-orange-400">🔥 {streak} {l('day streak', 'días seguidos')}</span>
                    )}
                  </p>
                  <div className={`text-4xl font-black leading-none ${caloriesRemaining < 0 ? 'text-orange-400' : caloriesRemaining < 200 ? 'text-yellow-400' : 'text-white'}`}>
                    {caloriesRemaining > 0 ? caloriesRemaining : Math.abs(caloriesRemaining)}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {caloriesRemaining >= 0
                      ? l('kcal remaining', 'kcal restantes')
                      : l('kcal over goal', 'kcal sobre la meta')}
                  </p>
                </div>
                <MacroRing
                  calories={todayMacros.calories}
                  goalCalories={nutritionGoal.calories}
                  protein={todayMacros.protein}
                  carbs={todayMacros.carbs}
                  fat={todayMacros.fat}
                  size={88}
                />
              </div>

              {/* Macro bars */}
              <div className="flex gap-3">
                <MacroBar value={todayMacros.protein} goal={nutritionGoal.protein} color="text-blue-400" label={l('Protein', 'Proteína')} />
                <MacroBar value={todayMacros.carbs}   goal={nutritionGoal.carbs}   color="text-amber-400" label="Carbs" />
                <MacroBar value={todayMacros.fat}     goal={nutritionGoal.fat}     color="text-pink-400"  label={l('Fat', 'Grasa')} />
              </div>

              {/* Protein callout */}
              {proteinRemaining > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <p className="text-[11px] text-zinc-400">
                    <span className="text-blue-400 font-bold">{Math.round(proteinRemaining)}g</span>
                    {' '}{l('protein to hit your goal', 'de proteína para llegar a tu meta')}
                  </p>
                </div>
              )}

              {/* Cardio burned row */}
              {caloriesBurned > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-[11px] text-zinc-400">
                    <span className="text-red-400 font-bold">+{caloriesBurned} kcal</span>
                    {' '}{l('burned from cardio — added to budget', 'quemadas en cardio — sumadas al presupuesto')}
                  </p>
                </div>
              )}

              {/* Goal editor link */}
              <button
                onClick={() => { setEditGoal(nutritionGoal); setShowGoalEditor(true); }}
                className="mt-3 w-full text-center text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {l('Edit Goals', 'Editar Metas')} →
              </button>
            </div>

            {/* Water tracker */}
            <WaterTracker waterMl={todayWater} onAdd={handleAddWater} lang={lang} />

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowAddMeal(true)}
                className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center">
                  <Icon name="Plus" size={16} className="text-green-400" />
                </div>
                <span className="text-sm font-bold text-white">{l('Add Food', 'Agregar Comida')}</span>
              </button>
              <button
                onClick={() => setShowAddCardio(true)}
                className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <Icon name="Flame" size={16} className="text-red-400" />
                </div>
                <span className="text-sm font-bold text-white">{l('Log Cardio', 'Cardio')}</span>
              </button>
            </div>

            {/* Today cardio summary (inline, compact) */}
            {todayCardio.length > 0 && (
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-3">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  {l('Today\'s Cardio', 'Cardio de Hoy')}
                </p>
                <div className="space-y-1.5">
                  {todayCardio.map(s => (
                    <div key={s.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <span>{ACTIVITY_EMOJI[s.activityType] || '🏋️'}</span>
                        <span className="text-zinc-300 capitalize text-xs">{s.activityType.replace('_', ' ')} · {s.durationMin}min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.caloriesBurned && <span className="text-xs font-bold text-red-400">~{s.caloriesBurned} kcal</span>}
                        <button onClick={() => handleDeleteCardio(s.id)} className="text-zinc-700 hover:text-red-500 transition-colors">
                          <Icon name="X" size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meal Groups */}
            {MEAL_ORDER.map(mealType => {
              const entries = todayLog.entries.filter(e => e.mealType === mealType);
              if (entries.length === 0) return null;
              const meta    = MEAL_META[mealType];
              const mealCals = entries.reduce((a, e) => a + e.calories, 0);
              const mealProt = entries.reduce((a, e) => a + e.protein, 0);
              const isExpanded = expandedMeal === mealType;
              return (
                <div key={mealType} className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
                  <button
                    onClick={() => setExpandedMeal(isExpanded ? null : mealType)}
                    className="w-full flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{meta.emoji}</span>
                      <div className="text-left">
                        <p className="font-bold text-white text-sm">{lang === 'en' ? meta.en : meta.es}</p>
                        <p className="text-[10px] text-zinc-500">{entries.length} {l('items', 'alimentos')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-zinc-300">{mealCals} kcal</p>
                        <p className="text-[10px] text-blue-400">{Math.round(mealProt)}g P</p>
                      </div>
                      <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-zinc-600" />
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-zinc-800 divide-y divide-zinc-800/70">
                      {entries.map(entry => (
                        <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-sm text-white font-medium truncate">{entry.name}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              <span className="text-blue-400">{entry.protein}g P</span>
                              {' · '}
                              <span className="text-amber-400">{entry.carbs}g C</span>
                              {' · '}
                              <span className="text-pink-400">{entry.fat}g F</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-sm font-bold text-zinc-300 mr-1">{entry.calories}</span>
                            <button onClick={() => handleEditEntry(entry)} className="text-zinc-600 hover:text-zinc-300 transition-colors active:scale-90 p-2 rounded-lg">
                              <Icon name="Pencil" size={14} />
                            </button>
                            <button onClick={() => handleDeleteMeal(entry.id)} className="text-zinc-700 hover:text-red-500 transition-colors active:scale-90 p-2 rounded-lg">
                              <Icon name="Trash2" size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {todayLog.entries.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <div className="text-4xl">🥗</div>
                <p className="text-zinc-500 text-sm">{l('No food logged yet.', 'Sin comidas registradas.')}</p>
                <p className="text-zinc-600 text-xs">{l('Tap "Add Food" to start.', 'Toca "Agregar Comida" para empezar.')}</p>
              </div>
            )}
          </div>
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
          />
        )}

        {/* ─── TAB: HISTORY ───────────────────────────────────── */}
        {subTab === 'history' && (
          <HistoryTab
            lang={lang}
            last14Days={last14Days}
            historyDayList={historyDayList}
            nutritionGoal={nutritionGoal}
          />
        )}
      </div>

      {/* ─── EDIT ENTRY MODAL ──────────────────────────────── */}
      {editingEntry && editEntryDraft && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end" onClick={() => { setEditingEntry(null); setEditEntryDraft(null); }}>
          <div className="w-full bg-zinc-900 rounded-t-3xl border-t border-zinc-800 p-6 pb-safe" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-base font-bold text-white truncate">{editEntryDraft.name}</h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">{l('Edit nutrition values', 'Editar valores nutricionales')}</p>
              </div>
              <button onClick={() => { setEditingEntry(null); setEditEntryDraft(null); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                <Icon name="X" size={16} />
              </button>
            </div>

            {/* Quick multiplier buttons */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{l('Quick scale', 'Escalar')}</p>
              <div className="flex gap-2">
                {[0.5, 0.75, 1, 1.5, 2].map(mult => (
                  <button
                    key={mult}
                    onClick={() => {
                      if (!editEntryDraft) return;
                      setEditEntryDraft({
                        ...editEntryDraft,
                        calories: Math.round(editEntryDraft.calories * mult),
                        protein:  Math.round(editEntryDraft.protein  * mult),
                        carbs:    Math.round(editEntryDraft.carbs    * mult),
                        fat:      Math.round(editEntryDraft.fat      * mult),
                      });
                    }}
                    className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold active:scale-95 transition-all hover:bg-zinc-700"
                  >
                    ×{mult}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual edit fields */}
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: 'calories', label: l('Calories', 'Calorías'), unit: 'kcal', color: 'text-zinc-300' },
                { key: 'protein',  label: l('Protein', 'Proteína'),  unit: 'g', color: 'text-blue-400' },
                { key: 'carbs',    label: 'Carbs',                   unit: 'g', color: 'text-amber-400' },
                { key: 'fat',      label: l('Fat', 'Grasa'),         unit: 'g', color: 'text-pink-400' },
              ] as const).map(({ key, label, unit, color }) => (
                <div key={key}>
                  <label className={`text-[11px] font-bold ${color} mb-1 block`}>{label} <span className="text-zinc-600">({unit})</span></label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={editEntryDraft[key]}
                    onChange={e => setEditEntryDraft(prev => prev ? { ...prev, [key]: Math.max(0, Number(e.target.value)) } : prev)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-zinc-500"
                  />
                </div>
              ))}
            </div>
            <Button onClick={handleSaveEditEntry} fullWidth className="mt-4">
              {l('Save Changes', 'Guardar Cambios')}
            </Button>
          </div>
        </div>
      )}

      {/* ─── GOAL EDITOR MODAL ─────────────────────────────── */}
      {showGoalEditor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end" onClick={() => setShowGoalEditor(false)}>
          <div className="w-full bg-zinc-900 rounded-t-3xl border-t border-zinc-800 p-6 pb-safe animate-spring-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-white">{l('Edit Goals', 'Editar Metas')}</h2>
              <button onClick={() => setShowGoalEditor(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                <Icon name="X" size={16} />
              </button>
            </div>
            {tdee && (
              <p className="text-[11px] text-zinc-500 mb-4">
                {l('Estimated TDEE', 'TDEE estimado')}: <span className="text-zinc-300 font-bold">{tdee} kcal</span>
              </p>
            )}
            <div className="space-y-3">
              {(['calories', 'protein', 'carbs', 'fat'] as const).map(key => (
                <div key={key}>
                  <label className="text-xs text-zinc-500 capitalize mb-1 block">{key} {key === 'calories' ? '(kcal)' : '(g)'}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={editGoal[key]}
                    onChange={e => setEditGoal(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-zinc-500"
                  />
                </div>
              ))}
            </div>
            <Button onClick={saveGoal} fullWidth className="mt-5">
              {l('Save Goals', 'Guardar Metas')}
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddMealModal   isOpen={showAddMeal}   onClose={() => setShowAddMeal(false)}   onAdd={handleAddMeal}   lang={lang} />
      <AddCardioModal isOpen={showAddCardio} onClose={() => setShowAddCardio(false)} onAdd={handleAddCardio} lang={lang} />
      <LogWeightModal isOpen={showLogWeight} onClose={() => setShowLogWeight(false)} onLog={handleLogWeight} />

      {/* Undo Snackbars — stacked, food + cardio */}
      <div className="fixed bottom-24 left-4 right-4 z-modal flex flex-col gap-2 pointer-events-none">
        {lastDeletedEntry && (
          <div className="flex items-center justify-between bg-zinc-800 text-white px-4 py-3 rounded-2xl shadow-2xl border border-zinc-700 animate-in fade-in slide-in-from-bottom-4 pointer-events-auto">
            <div className="flex items-center gap-2">
              <Icon name="Trash2" size={14} className="text-zinc-400" />
              <span className="text-xs font-bold">{l('Item deleted', 'Alimento eliminado')}</span>
            </div>
            <button onClick={handleUndoDelete} className="text-xs font-black text-red-500 uppercase tracking-wider px-2 py-1 active:scale-95 transition-transform">
              {l('Undo', 'Deshacer')}
            </button>
          </div>
        )}
        {lastDeletedCardio && (
          <div className="flex items-center justify-between bg-zinc-800 text-white px-4 py-3 rounded-2xl shadow-2xl border border-zinc-700 animate-in fade-in slide-in-from-bottom-4 pointer-events-auto">
            <div className="flex items-center gap-2">
              <Icon name="Flame" size={14} className="text-zinc-400" />
              <span className="text-xs font-bold">{l('Cardio deleted', 'Cardio eliminado')}</span>
            </div>
            <button onClick={handleUndoDeleteCardio} className="text-xs font-black text-red-500 uppercase tracking-wider px-2 py-1 active:scale-95 transition-transform">
              {l('Undo', 'Deshacer')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
