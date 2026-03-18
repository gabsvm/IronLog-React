import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FoodEntry, CardioSession, NutritionLog, NutritionGoal } from '../types';
import { MacroRing } from '../components/nutrition/MacroRing';
import { AddMealModal } from '../components/nutrition/AddMealModal';
import { AddCardioModal } from '../components/nutrition/AddCardioModal';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';

// ─── HELPERS ────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];

const getTodayLog = (logs: NutritionLog[]): NutritionLog => {
  const today = todayStr();
  return logs.find(l => l.date === today) || { date: today, entries: [] };
};

const sumMacros = (entries: FoodEntry[]) =>
  entries.reduce((acc, e) => ({
    calories: acc.calories + e.calories,
    protein:  acc.protein  + e.protein,
    carbs:    acc.carbs    + e.carbs,
    fat:      acc.fat      + e.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_META: Record<string, { emoji: string; en: string; es: string }> = {
  breakfast: { emoji: '🌅', en: 'Breakfast', es: 'Desayuno' },
  lunch:     { emoji: '☀️', en: 'Lunch',     es: 'Almuerzo' },
  dinner:    { emoji: '🌙', en: 'Dinner',    es: 'Cena' },
  snack:     { emoji: '🍎', en: 'Snack',     es: 'Snack' },
};

const ACTIVITY_EMOJI: Record<string, string> = {
  running: '🏃', cycling: '🚴', walking: '🚶', swimming: '🏊',
  rowing: '🚣', elliptical: '⚙️', jump_rope: '🪢', hiit: '⚡', other: '🏋️'
};

// ─── TIPS ENGINE ────────────────────────────────────────────────────
const getTips = (lang: 'en' | 'es', profile: any, goal: NutritionGoal) => {
  const bw = profile?.bodyWeight || 75;
  const bf = profile?.bodyFat;
  const userGoal = profile?.goal || 'hypertrophy';

  const tips = {
    muscle: lang === 'en' ? [
      `📌 Your protein target is ~${Math.round(bw * 2.2)}g/day (2.2g per kg). You're ${Math.round(bw * 2.2)}g/day.`,
      `⚡ Eat in a caloric surplus of 200-400 kcal above maintenance to maximize muscle gain without excess fat.`,
      `🍚 Carbs are your primary fuel. Prioritize them around your training window (pre + post workout).`,
      `😴 Consume ~40g of casein protein before bed to promote overnight muscle protein synthesis.`,
      `💧 Aim for 35-40ml of water per kg of bodyweight daily for optimal performance and recovery.`,
      `🥚 Distribute protein across 4-5 meals throughout the day for maximum muscle protein synthesis.`,
      `🧠 Track your trend weight (7-day average) — daily fluctuations of 1-2kg are completely normal.`,
    ] : [
      `📌 Tu objetivo de proteína es ~${Math.round(bw * 2.2)}g/día (2.2g por kg de peso corporal).`,
      `⚡ Come en superávit calórico de 200-400 kcal sobre tu mantenimiento para maximizar la ganancia muscular.`,
      `🍚 Los carbohidratos son tu combustible principal. Priorízalos alrededor del entrenamiento (antes + después).`,
      `😴 Consume ~40g de proteína de caseína antes de dormir para favorecer la síntesis proteica nocturna.`,
      `💧 Apunta a 35-40ml de agua por kg de peso corporal diario para un rendimiento y recuperación óptimos.`,
      `🥚 Distribuí la proteína en 4-5 comidas a lo largo del día para maximizar la síntesis proteica muscular.`,
      `🧠 Seguí tu peso promedio semanal (7 días) — las fluctuaciones diarias de 1-2kg son completamente normales.`,
    ],
    fat_loss: lang === 'en' ? [
      `🔥 A deficit of 300-500 kcal/day leads to ~0.3-0.5 kg/week of fat loss — the sustainable sweet spot.`,
      `💪 Keep protein HIGH (2.2-2.5g/kg) to preserve muscle while in a caloric deficit.`,
      `🥦 Prioritize fiber-rich vegetables and lean proteins — they keep you full with fewer calories.`,
      `🏃 Adding 150-200 kcal of daily cardio is more sustainable than cutting more food.`,
      `⏰ Try eating in a 8-10 hour window (time-restricted eating) — it naturally reduces caloric intake.`,
      `📉 Avoid rapid weight loss >1% of bodyweight/week — it significantly increases muscle loss.`,
      bf && bf > 20 ? `📊 At ${bf}% body fat, a moderate deficit will give excellent results without sacrificing muscle.` : ``,
    ].filter(Boolean) : [
      `🔥 Un déficit de 300-500 kcal/día produce ~0.3-0.5 kg/semana de pérdida de grasa — el punto óptimo sostenible.`,
      `💪 Mantené la proteína ALTA (2.2-2.5g/kg) para preservar músculo durante el déficit calórico.`,
      `🥦 Priorizá vegetales ricos en fibra y proteínas magras — te mantienen saciado con menos calorías.`,
      `🏃 Agregar 150-200 kcal de cardio diario es más sostenible que recortar más comida.`,
      `⏰ Intentá comer en una ventana de 8-10 horas (ayuno intermitente) — reduce naturalmente la ingesta calórica.`,
      `📉 Evitá perder >1% de tu peso corporal/semana — aumenta significativamente la pérdida muscular.`,
      bf && bf > 20 ? `📊 Con ${bf}% de grasa corporal, un déficit moderado dará excelentes resultados sin sacrificar músculo.` : ``,
    ].filter(Boolean),
    general: lang === 'en' ? [
      `🔬 There's no "best diet" — the best diet is the one you can sustain consistently for months.`,
      `🥩 Whole foods should make up 80% of your intake. The remaining 20% can be flexible.`,
      `📊 Track for 2-3 weeks to understand your true baseline — then make adjustments from real data.`,
      `🧂 Watch sodium on training days — it affects water retention and can mislead the scale.`,
      `☀️ Vitamin D + Omega-3 are the two supplements with the most evidence for body composition.`,
      `🍺 Alcohol significantly impairs muscle protein synthesis even in moderate amounts.`,
    ] : [
      `🔬 No existe la "mejor dieta" — la mejor dieta es la que podés sostener consistentemente por meses.`,
      `🥩 Los alimentos enteros deben componer el 80% de tu ingesta. El 20% restante puede ser flexible.`,
      `📊 Registrá durante 2-3 semanas para entender tu línea de base real — luego ajustá desde datos reales.`,
      `🧂 Controlá el sodio en días de entrenamiento — afecta la retención de agua y puede engañar a la balanza.`,
      `☀️ Vitamina D + Omega-3 son los dos suplementos con más evidencia para composición corporal.`,
      `🍺 El alcohol deteriora significativamente la síntesis proteica muscular incluso en cantidades moderadas.`,
    ],
  };

  return { muscle: tips.muscle, fatLoss: tips.fat_loss, general: tips.general };
};

// ─── COMPONENT ──────────────────────────────────────────────────────
type SubTab = 'today' | 'cardio' | 'tips' | 'history';

export const NutriView: React.FC = () => {
  const { lang, nutritionLogs, setNutritionLogs, cardioSessions, setCardioSessions, nutritionGoal, setNutritionGoal, userProfile } = useApp();

  const [subTab, setSubTab]         = useState<SubTab>('today');
  const [showAddMeal, setShowAddMeal]     = useState(false);
  const [showAddCardio, setShowAddCardio] = useState(false);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [expandedMeal, setExpandedMeal]   = useState<string | null>(null);

  // Goal editor state
  const [editGoal, setEditGoal] = useState(nutritionGoal);

  const todayLog = useMemo(() => getTodayLog(nutritionLogs), [nutritionLogs]);
  const todayMacros = useMemo(() => sumMacros(todayLog.entries), [todayLog]);
  const todayCardio = useMemo(() => cardioSessions.filter(s => s.date === todayStr()), [cardioSessions]);

  // Last 7 days for history
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const log = nutritionLogs.find(l => l.date === dateStr);
      const macros = log ? sumMacros(log.entries) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
      days.push({ date: dateStr, label: d.toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', { weekday: 'short' }), ...macros });
    }
    return days;
  }, [nutritionLogs, lang]);

  const handleAddMeal = (entry: FoodEntry) => {
    const today = todayStr();
    setNutritionLogs(prev => {
      const existing = prev.find(l => l.date === today);
      if (existing) {
        return prev.map(l => l.date === today ? { ...l, entries: [...l.entries, entry] } : l);
      }
      return [...prev, { date: today, entries: [entry] }];
    });
  };

  const handleDeleteMeal = (entryId: string) => {
    const today = todayStr();
    setNutritionLogs(prev =>
      prev.map(l => l.date === today ? { ...l, entries: l.entries.filter(e => e.id !== entryId) } : l)
    );
  };

  const handleAddCardio = (session: CardioSession) => {
    setCardioSessions(prev => [session, ...prev]);
  };

  const handleDeleteCardio = (id: string) => {
    setCardioSessions(prev => prev.filter(s => s.id !== id));
  };

  const saveGoal = () => {
    setNutritionGoal(editGoal);
    setShowGoalEditor(false);
  };

  const t = {
    today:   lang === 'en' ? 'Today'   : 'Hoy',
    cardio:  lang === 'en' ? 'Cardio'  : 'Cardio',
    tips:    lang === 'en' ? 'Tips'    : 'Tips',
    history: lang === 'en' ? 'History' : 'Historial',
    goal:    lang === 'en' ? 'Goal'    : 'Meta',
    remaining: lang === 'en' ? 'remaining' : 'restantes',
    noMeals: lang === 'en' ? 'No meals logged today. Tap + to start.' : 'Sin comidas hoy. Tocá + para empezar.',
    noCardio: lang === 'en' ? 'No cardio today.' : 'Sin cardio hoy.',
    addMeal:  lang === 'en' ? 'Add Food' : 'Agregar Comida',
    addCardio: lang === 'en' ? 'Log Cardio' : 'Registrar Cardio',
    totalBurned: lang === 'en' ? 'Total Burned' : 'Total Quemado',
    netCalories: lang === 'en' ? 'Net Calories' : 'Calorías Netas',
    editGoals: lang === 'en' ? 'Edit Goals' : 'Editar Metas',
  };

  const tips = getTips(lang, userProfile, nutritionGoal);
  const totalCarboBurned = todayCardio.reduce((acc, s) => acc + (s.caloriesBurned || 0), 0);
  const netCalories = todayMacros.calories - totalCarboBurned;

  // ─── RENDER ──────────────────────────────────────────────────────
  const SubTabBtn = ({ id, label }: { id: SubTab; label: string }) => (
    <button onClick={() => setSubTab(id)}
      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-xl
        ${subTab === id ? 'bg-white text-black' : 'text-zinc-500'}`}>
      {label}
    </button>
  );

  return (
    <div className="min-h-full px-4 pt-4">

      {/* Sub-tab nav */}
      <div className="flex gap-1 bg-zinc-900 p-1 rounded-2xl mb-5 border border-zinc-800">
        <SubTabBtn id="today"   label={t.today} />
        <SubTabBtn id="cardio"  label={t.cardio} />
        <SubTabBtn id="tips"    label={t.tips} />
        <SubTabBtn id="history" label={t.history} />
      </div>

      {/* ─── TAB: TODAY ─────────────────────────────────────── */}
      {subTab === 'today' && (
        <div className="space-y-4">
          {/* Macro Ring + Goal Summary */}
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{t.today}</h3>
              <button onClick={() => { setEditGoal(nutritionGoal); setShowGoalEditor(true); }}
                className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
                <Icon name="Edit" size={12} /> {t.editGoals}
              </button>
            </div>
            <div className="flex items-center gap-6">
              <MacroRing
                calories={todayMacros.calories}
                goalCalories={nutritionGoal.calories}
                protein={todayMacros.protein}
                carbs={todayMacros.carbs}
                fat={todayMacros.fat}
              />
              <div className="flex-1 space-y-3">
                {/* Protein */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-blue-400 font-bold">Proteína</span>
                    <span className="text-zinc-400">{todayMacros.protein}g / {nutritionGoal.protein}g</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (todayMacros.protein / nutritionGoal.protein) * 100)}%` }} />
                  </div>
                </div>
                {/* Carbs */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-amber-400 font-bold">Carbs</span>
                    <span className="text-zinc-400">{todayMacros.carbs}g / {nutritionGoal.carbs}g</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (todayMacros.carbs / nutritionGoal.carbs) * 100)}%` }} />
                  </div>
                </div>
                {/* Fat */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-pink-400 font-bold">Grasa</span>
                    <span className="text-zinc-400">{todayMacros.fat}g / {nutritionGoal.fat}g</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (todayMacros.fat / nutritionGoal.fat) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
            {/* Net calories row */}
            {totalCarboBurned > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
                <span className="text-xs text-zinc-500">{t.netCalories}</span>
                <span className={`text-sm font-bold ${netCalories < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {netCalories} kcal
                </span>
              </div>
            )}
          </div>

          {/* Meal Groups */}
          {MEAL_ORDER.map(mealType => {
            const entries = todayLog.entries.filter(e => e.mealType === mealType);
            if (entries.length === 0) return null;
            const meta = MEAL_META[mealType];
            const mealCals = entries.reduce((a, e) => a + e.calories, 0);
            const isExpanded = expandedMeal === mealType;
            return (
              <div key={mealType} className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
                <button onClick={() => setExpandedMeal(isExpanded ? null : mealType)}
                  className="w-full flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{meta.emoji}</span>
                    <span className="font-semibold text-white">{lang === 'en' ? meta.en : meta.es}</span>
                    <span className="text-xs text-zinc-500">{entries.length} items</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-300">{mealCals} kcal</span>
                    <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-zinc-600" />
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-zinc-800 divide-y divide-zinc-800">
                    {entries.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm text-white font-medium">{entry.name}</p>
                          <p className="text-[11px] text-zinc-500">
                            {entry.protein}g P · {entry.carbs}g C · {entry.fat}g F
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-zinc-300">{entry.calories} kcal</span>
                          <button onClick={() => handleDeleteMeal(entry.id)} className="text-zinc-700 hover:text-red-500 transition-colors">
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
            <div className="text-center py-10 text-zinc-600 text-sm">{t.noMeals}</div>
          )}

          <Button onClick={() => setShowAddMeal(true)} fullWidth variant="outline">
            <Icon name="Plus" size={16} /> {t.addMeal}
          </Button>
        </div>
      )}

      {/* ─── TAB: CARDIO ────────────────────────────────────── */}
      {subTab === 'cardio' && (
        <div className="space-y-4">
          {/* Today's summary */}
          {todayCardio.length > 0 && (
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Hoy</p>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{todayCardio.reduce((a, s) => a + s.durationMin, 0)}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">min</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-red-400">{totalCarboBurned}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">kcal</p>
                </div>
                {todayCardio.some(s => s.distanceKm) && (
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">
                      {todayCardio.reduce((a, s) => a + (s.distanceKm || 0), 0).toFixed(1)}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase">km</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cardio cards */}
          {cardioSessions.slice(0, 20).map(session => (
            <div key={session.id} className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ACTIVITY_EMOJI[session.activityType] || '🏋️'}</span>
                <div>
                  <p className="text-sm font-semibold text-white capitalize">
                    {session.activityType.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {session.date} · {session.durationMin} min
                    {session.distanceKm ? ` · ${session.distanceKm}km` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {session.caloriesBurned && (
                  <span className="text-sm font-bold text-red-400">~{session.caloriesBurned} kcal</span>
                )}
                <button onClick={() => handleDeleteCardio(session.id)} className="text-zinc-700 hover:text-red-500 transition-colors">
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            </div>
          ))}

          {cardioSessions.length === 0 && (
            <div className="text-center py-10 text-zinc-600 text-sm">{t.noCardio}</div>
          )}

          <Button onClick={() => setShowAddCardio(true)} fullWidth variant="outline">
            <Icon name="Plus" size={16} /> {t.addCardio}
          </Button>
        </div>
      )}

      {/* ─── TAB: TIPS ──────────────────────────────────────── */}
      {subTab === 'tips' && (
        <div className="space-y-5">
          {/* Muscle gain tips */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💪</span>
              <h3 className="text-sm font-bold text-white">
                {lang === 'en' ? 'Muscle Gain' : 'Ganar Músculo'}
              </h3>
            </div>
            <div className="space-y-2">
              {tips.muscle.map((tip, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
                  <p className="text-sm text-zinc-300 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Fat loss tips */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔥</span>
              <h3 className="text-sm font-bold text-white">
                {lang === 'en' ? 'Fat Loss / Body Recomp' : 'Perder Grasa / Recomposición'}
              </h3>
            </div>
            <div className="space-y-2">
              {tips.fatLoss.map((tip, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
                  <p className="text-sm text-zinc-300 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* General tips */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🧪</span>
              <h3 className="text-sm font-bold text-white">
                {lang === 'en' ? 'General Nutrition Science' : 'Ciencia Nutricional General'}
              </h3>
            </div>
            <div className="space-y-2">
              {tips.general.map((tip, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
                  <p className="text-sm text-zinc-300 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Personalized note based on profile */}
          {userProfile?.bodyWeight && (
            <div className="bg-red-950/20 border border-red-500/20 rounded-3xl p-4">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                {lang === 'en' ? '📊 Your Personal Targets' : '📊 Tus Objetivos Personales'}
              </p>
              <div className="space-y-1 text-sm text-zinc-300">
                <p>• {lang === 'en' ? 'Minimum protein' : 'Proteína mínima'}: <strong className="text-white">{Math.round(userProfile.bodyWeight * 2.0)}g/día</strong></p>
                <p>• {lang === 'en' ? 'Optimal protein' : 'Proteína óptima'}: <strong className="text-white">{Math.round(userProfile.bodyWeight * 2.2)}g/día</strong></p>
                <p>• {lang === 'en' ? 'Daily water' : 'Agua diaria'}: <strong className="text-white">{Math.round(userProfile.bodyWeight * 37)}ml</strong></p>
                {userProfile.bodyFat && <p>• {lang === 'en' ? 'Body fat' : 'Grasa corporal'}: <strong className="text-white">{userProfile.bodyFat}%</strong></p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: HISTORY ───────────────────────────────────── */}
      {subTab === 'history' && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            {lang === 'en' ? 'Last 7 Days' : 'Últimos 7 Días'}
          </p>
          {/* Bar chart — calories */}
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 mb-4">kcal / día</p>
            <div className="flex items-end gap-2 h-28">
              {last7Days.map(day => {
                const pct = Math.min(day.calories / Math.max(nutritionGoal.calories, 1), 1.2);
                const isToday = day.date === todayStr();
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-zinc-600">{day.calories > 0 ? day.calories : ''}</span>
                    <div className="w-full rounded-t-lg transition-all duration-500 relative"
                      style={{
                        height: `${Math.max(pct * 96, day.calories > 0 ? 4 : 0)}px`,
                        backgroundColor: isToday ? '#ef4444' : '#3f3f46',
                        minHeight: day.calories > 0 ? '4px' : '0'
                      }}>
                      {pct > 1 && <div className="absolute inset-x-0 top-0 h-1 bg-orange-400 rounded-t-lg" />}
                    </div>
                    <span className="text-[9px] text-zinc-500 capitalize">{day.label}</span>
                  </div>
                );
              })}
            </div>
            {/* Goal line label */}
            <p className="text-[10px] text-zinc-600 mt-2 text-center">
              {lang === 'en' ? `Goal: ${nutritionGoal.calories} kcal` : `Meta: ${nutritionGoal.calories} kcal`}
            </p>
          </div>

          {/* Detailed day list */}
          {[...last7Days].reverse().map(day => {
            if (day.calories === 0) return null;
            return (
              <div key={day.date} className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-white">{day.date}</span>
                  <span className="text-sm font-bold text-zinc-300">{day.calories} kcal</span>
                </div>
                <div className="flex gap-4 text-xs text-zinc-500">
                  <span className="text-blue-400">{day.protein}g P</span>
                  <span className="text-amber-400">{day.carbs}g C</span>
                  <span className="text-pink-400">{day.fat}g F</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── GOAL EDITOR MODAL ─────────────────────────────── */}
      {showGoalEditor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end">
          <div className="w-full bg-zinc-900 rounded-t-3xl border-t border-zinc-800 p-6 pb-safe animate-spring-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{t.editGoals}</h2>
              <button onClick={() => setShowGoalEditor(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {(['calories', 'protein', 'carbs', 'fat'] as const).map(key => (
                <div key={key}>
                  <label className="text-xs text-zinc-500 capitalize mb-1 block">{key} {key === 'calories' ? '(kcal)' : '(g)'}</label>
                  <input type="number" inputMode="numeric" value={editGoal[key]}
                    onChange={e => setEditGoal(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-zinc-500" />
                </div>
              ))}
            </div>
            <Button onClick={saveGoal} fullWidth className="mt-5">
              {lang === 'en' ? 'Save Goals' : 'Guardar Metas'}
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddMealModal   isOpen={showAddMeal}   onClose={() => setShowAddMeal(false)}   onAdd={handleAddMeal}   lang={lang} />
      <AddCardioModal isOpen={showAddCardio} onClose={() => setShowAddCardio(false)} onAdd={handleAddCardio} lang={lang} />
    </div>
  );
};