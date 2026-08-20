import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { GlobalTemplate, MuscleGroup, ProgramDay } from '../../types';
import { getTranslated } from '../../utils';
import { Icon } from '../ui/Icon';
import { NhLogbookCoachView } from './NhLogbookCoachView';
import {
  NH_MASSTERPLAN_GUIDES,
  NH_PROGRAMMING_TEACHING_POINTS,
  NH_ROLE_LIBRARY,
  auditNhProgram,
  buildNhTeachingDraft,
  makeNhSchoolTemplate,
  type NhEvidenceKind,
  type NhMovementRole,
  type NhProgrammingLevel,
} from '../../programs/naturalHypertrophy/programmingSchool';
import {
  NH_ALPHA_BETA_PROTOCOL,
  NH_ICEBERG_CURRICULUM,
  NH_SELF_PROGRAMMING_PATH_VERIFIED,
  NH_SELF_PROGRAMMING_SOURCE_LESSONS,
} from '../../programs/naturalHypertrophy/nhSelfProgrammingProtocol';
import {
  appendNhLabChange,
  attachNhLabMeta,
  createNhLabMeta,
  isNhLabTemplate,
  nhLabCanStartAlpha,
  nhLabDaysInPhase,
  nhLabNextPhase,
  nhLabPhaseLabel,
  transitionNhLabPhase,
  type NhLabChangeReason,
  type NhLabTemplate,
} from '../../programs/naturalHypertrophy/nhLabLifecycle';
import { collectNhExerciseHistory } from '../../programs/naturalHypertrophy/nhLogbookAnalysis';
import {
  getNhRoleFromSlot,
  localizeNhTeachingDraft,
  summarizeNhAudit,
  uniqueNhRepRanges,
  updateNhDraftSlot,
} from '../../programs/naturalHypertrophy/nhSchoolProductLogic';

type Screen = 'home' | 'learn' | 'path' | 'iceberg' | 'massterplans' | 'analyze' | 'audit' | 'create' | 'builder' | 'preview' | 'selfcoach' | 'lifecycle';
type FitState = 'works' | 'irritates' | 'unsure';

interface Props {
  lang: 'en' | 'es';
  templates: GlobalTemplate[];
  onBack: () => void;
  onSaveTemplate: (template: GlobalTemplate, openEditor: boolean) => void;
}

const MUSCLES: MuscleGroup[] = ['CHEST','BACK','QUADS','HAMSTRINGS','SHOULDERS','BICEPS','TRICEPS','CALVES','ABS','NECK'];
const MODIFY_REASONS: Array<{ id: NhLabChangeReason; en: string; es: string }> = [
  { id: 'pain', en: 'Pain / discomfort', es: 'Molestia / dolor' },
  { id: 'recovery', en: 'Recovery', es: 'Recuperación' },
  { id: 'session_length', en: 'Session too long', es: 'Sesión demasiado larga' },
  { id: 'plateau', en: 'Real plateau', es: 'Plateau real' },
  { id: 'priority', en: 'Change priority', es: 'Cambiar prioridad' },
  { id: 'logistics', en: 'Gym / logistics', es: 'Gimnasio / logística' },
  { id: 'range', en: 'Rep bracket does not fit', es: 'El rango de reps no encaja' },
  { id: 'volume', en: 'Volume adjustment', es: 'Ajustar volumen' },
  { id: 'exercise_fit', en: 'Exercise does not fit me', es: 'El ejercicio no me sirve' },
  { id: 'other', en: 'I am learning / other', es: 'Estoy aprendiendo / otro' },
];

const muscleLabel = (muscle: MuscleGroup, lang: 'en' | 'es') => {
  const map: Record<MuscleGroup, { en: string; es: string }> = {
    CHEST:{en:'Chest',es:'Pecho'}, BACK:{en:'Back',es:'Espalda'}, QUADS:{en:'Quads',es:'Cuádriceps'}, HAMSTRINGS:{en:'Hamstrings',es:'Femoral'},
    GLUTES:{en:'Glutes',es:'Glúteos'}, CALVES:{en:'Calves',es:'Gemelos'}, SHOULDERS:{en:'Shoulders',es:'Hombros'}, BICEPS:{en:'Biceps',es:'Bíceps'},
    TRICEPS:{en:'Triceps',es:'Tríceps'}, TRAPS:{en:'Traps',es:'Trapecios'}, ABS:{en:'Abs',es:'Abdomen'}, FOREARMS:{en:'Forearms',es:'Antebrazos'},
    NECK:{en:'Neck',es:'Cuello'}, CARDIO:{en:'Cardio',es:'Cardio'},
  };
  return map[muscle][lang];
};

const evidenceLabel = (kind: NhEvidenceKind, lang: 'en' | 'es') => {
  if (kind === 'nh_principle') return lang === 'es' ? 'PRINCIPIO NH' : 'NH PRINCIPLE';
  if (kind === 'inference') return lang === 'es' ? 'INFERENCIA' : 'INFERENCE';
  return lang === 'es' ? 'REGLA GAINSLAB' : 'GAINSLAB RULE';
};

const evidenceClass = (kind: NhEvidenceKind) => kind === 'nh_principle'
  ? 'border-primary-500/25 bg-primary-500/10 text-primary-400'
  : kind === 'inference'
    ? 'border-sky-500/25 bg-sky-500/10 text-sky-400'
    : 'border-amber-500/25 bg-amber-500/10 text-amber-400';

const EvidenceBadge = ({ kind, lang }: { kind: NhEvidenceKind; lang: 'en' | 'es' }) => (
  <span className={`inline-flex rounded-lg border px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] ${evidenceClass(kind)}`}>{evidenceLabel(kind, lang)}</span>
);

const LevelCard = ({ icon, title, subtitle, onClick }: { icon: string; title: string; subtitle: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="flex min-h-[78px] w-full items-center gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 text-left active:bg-[rgb(var(--surface-elevated))]">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500"><Icon name={icon} size={19}/></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-black">{title}</span><span className="mt-1 block text-xs leading-5 text-[rgb(var(--text-muted))]">{subtitle}</span></span>
    <Icon name="ChevronRight" size={17} className="shrink-0 text-[rgb(var(--text-muted))]"/>
  </button>
);

const phaseClass = (phase: string) => phase === 'alpha'
  ? 'border-sky-500/25 bg-sky-500/10 text-sky-400'
  : phase === 'beta'
    ? 'border-violet-500/25 bg-violet-500/10 text-violet-400'
    : phase === 'mature'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
      : 'border-amber-500/25 bg-amber-500/10 text-amber-400';

export const NhProgrammingSchoolView: React.FC<Props> = ({ lang, templates, onBack, onSaveTemplate }) => {
  const { logs, exercises, personalTemplates, setPersonalTemplates } = useApp();
  const [screen, setScreen] = useState<Screen>('home');
  const [lessonLevel, setLessonLevel] = useState<NhProgrammingLevel>('understand');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [days, setDays] = useState<3|4|5>(4);
  const [priorities, setPriorities] = useState<MuscleGroup[]>([]);
  const [draftName, setDraftName] = useState(lang === 'es' ? 'Mi programa' : 'My program');
  const [draft, setDraft] = useState<ProgramDay[] | null>(null);
  const [fitByExercise, setFitByExercise] = useState<Record<string, FitState>>({});
  const [manualExperience, setManualExperience] = useState<Record<string, boolean>>({});
  const [modifyReason, setModifyReason] = useState<NhLabChangeReason | ''>('');
  const [lifecycleTemplateId, setLifecycleTemplateId] = useState('');
  const [changeReason, setChangeReason] = useState<NhLabChangeReason>('other');
  const [changeNote, setChangeNote] = useState('');

  const history = useMemo(() => collectNhExerciseHistory(Array.isArray(logs) ? logs : []), [logs]);
  const historyById = useMemo(() => new Map(history.map(item => [item.exerciseId, item])), [history]);
  const exerciseById = useMemo(() => new Map((Array.isArray(exercises) ? exercises : []).map(item => [String(item.id), item])), [exercises]);
  const selectedTemplate = useMemo(() => templates.find(item => item.id === selectedTemplateId) || null, [templates, selectedTemplateId]);
  const selectedAudit = useMemo(() => selectedTemplate ? auditNhProgram(selectedTemplate.program) : null, [selectedTemplate]);
  const draftAudit = useMemo(() => draft ? auditNhProgram(draft) : null, [draft]);
  const labTemplates = useMemo(() => (Array.isArray(personalTemplates) ? personalTemplates : []).filter(isNhLabTemplate), [personalTemplates]);
  const selectedLabTemplate = useMemo(() => labTemplates.find(item => item.id === lifecycleTemplateId) || null, [labTemplates, lifecycleTemplateId]);
  const lessons = useMemo(() => [
    ...NH_PROGRAMMING_TEACHING_POINTS.map(item => item.id === 'program-before-running'
      ? { ...item, sourceScope: 'How to program evolving rep ranges; How to never have to buy a training program again in your life; How to program your training yourself Part 2; AlphaBeta testing your program.' }
      : item),
    ...NH_SELF_PROGRAMMING_SOURCE_LESSONS,
  ].filter(item => item.level === lessonLevel), [lessonLevel]);

  const levelNames: Array<{ id: NhProgrammingLevel; label: string }> = [
    { id: 'understand', label: lang === 'es' ? '1 · Entender' : '1 · Understand' },
    { id: 'modify', label: lang === 'es' ? '2 · Modificar' : '2 · Modify' },
    { id: 'build', label: lang === 'es' ? '3 · Crear' : '3 · Build' },
    { id: 'self_coach', label: lang === 'es' ? '4 · Autoentrenarte' : '4 · Self-coach' },
  ];

  const exerciseName = (id?: string | null) => {
    if (!id) return lang === 'es' ? 'Sin elegir' : 'Not chosen';
    const exercise = exerciseById.get(String(id));
    if (!exercise) return String(id);
    return typeof exercise.name === 'object' ? String(getTranslated(exercise.name, lang)) : String(exercise.name);
  };
  const roleDefinition = (role: NhMovementRole | null) => role ? NH_ROLE_LIBRARY.find(item => item.id === role) || null : null;
  const isExperienced = (id: string) => !!historyById.get(id)?.experiencedByGainsLabHeuristic || !!manualExperience[id];

  const togglePriority = (muscle: MuscleGroup) => {
    setPriorities(prev => prev.includes(muscle) ? prev.filter(item => item !== muscle) : prev.length >= 2 ? [prev[1], muscle] : [...prev, muscle]);
  };

  const beginBuilder = () => {
    const scaffold = buildNhTeachingDraft({ days, priorities, experiencedExerciseIds: ['__manual_choice_required__'] });
    setDraft(localizeNhTeachingDraft(scaffold, lang));
    setFitByExercise({});
    setManualExperience({});
    setScreen('builder');
  };

  const builderStatus = useMemo(() => {
    if (!draft) return { slots: 0, chosen: 0, experienced: 0, fits: 0, ready: false };
    const slots = draft.flatMap(day => day.slots || []);
    const chosenSlots = slots.filter(slot => !!slot.exerciseId);
    const experiencedSlots = chosenSlots.filter(slot => {
      const id = String(slot.exerciseId || '');
      return !!historyById.get(id)?.experiencedByGainsLabHeuristic || !!manualExperience[id];
    });
    const fitSlots = chosenSlots.filter(slot => fitByExercise[String(slot.exerciseId || '')] === 'works');
    return {
      slots: slots.length,
      chosen: chosenSlots.length,
      experienced: experiencedSlots.length,
      fits: fitSlots.length,
      ready: slots.length > 0 && chosenSlots.length === slots.length && experiencedSlots.length === slots.length && fitSlots.length === slots.length,
    };
  }, [draft, fitByExercise, historyById, manualExperience]);

  const makeLabDraft = (program: ProgramDay[], name: string, source?: GlobalTemplate, reason?: NhLabChangeReason): GlobalTemplate => {
    const base = makeNhSchoolTemplate(program.map(day => ({ ...day, slots: (day.slots || []).map(slot => ({ ...slot })) })), `${name} · NH Lab`);
    const exerciseReadiness = source ? undefined : Object.fromEntries(program.flatMap(day => day.slots || []).filter(slot => !!slot.exerciseId).map(slot => {
      const id = String(slot.exerciseId);
      return [id, {
        experienced: !!historyById.get(id)?.experiencedByGainsLabHeuristic || !!manualExperience[id],
        fit: fitByExercise[id] || 'unsure',
      }];
    }));
    const meta = createNhLabMeta({
      sourceTemplateId: source?.id,
      sourceTemplateName: source ? String(getTranslated(source.title, lang)) : undefined,
      initialReason: reason,
      initialNote: source
        ? `${lang === 'es' ? 'Copia didáctica creada desde' : 'Teaching copy created from'} ${String(getTranslated(source.title, lang))}.`
        : (lang === 'es' ? 'Borrador creado con el constructor guiado de Programming School.' : 'Draft created with the Programming School guided builder.'),
      exerciseReadiness,
    });
    return attachNhLabMeta(base, meta);
  };

  const saveDraft = (openEditor: boolean) => {
    if (!draft) return;
    onSaveTemplate(makeLabDraft(draft, draftName.trim() || (lang === 'es' ? 'Mi programa' : 'My program')), openEditor);
  };

  const createLearningCopy = () => {
    if (!selectedTemplate || !modifyReason) return;
    const copy = makeLabDraft(selectedTemplate.program, String(getTranslated(selectedTemplate.title, lang)), selectedTemplate, modifyReason);
    onSaveTemplate(copy, true);
  };

  const updateLabTemplate = (updated: GlobalTemplate) => setPersonalTemplates(prev => prev.map(item => item.id === updated.id ? updated : item));
  const advanceLifecycle = (template: NhLabTemplate) => {
    if (!template.nhLab) return;
    const next = nhLabNextPhase(template.nhLab.phase);
    if (!next) return;
    if (next === 'alpha' && !nhLabCanStartAlpha(template)) return;
    updateLabTemplate(transitionNhLabPhase(template, next));
  };
  const recordChange = (template: NhLabTemplate) => {
    if (!changeNote.trim()) return;
    updateLabTemplate(appendNhLabChange(template, changeReason, changeNote));
    setChangeNote('');
  };

  const headerTitle = screen === 'home' ? 'Programming School'
    : screen === 'learn' ? (lang === 'es' ? 'Aprender el método' : 'Learn the method')
    : screen === 'path' ? (lang === 'es' ? 'Programarte vos mismo' : 'Program for yourself')
    : screen === 'iceberg' ? (lang === 'es' ? 'Mapa de aprendizaje' : 'Learning map')
    : screen === 'massterplans' ? 'MASSterplans'
    : screen === 'analyze' || screen === 'audit' ? (lang === 'es' ? 'Analizar / modificar' : 'Analyze / modify')
    : screen === 'selfcoach' ? 'Self-Coach · Logbook'
    : screen === 'lifecycle' ? (lang === 'es' ? 'Laboratorio Alpha/Beta' : 'Alpha/Beta Lab')
    : (lang === 'es' ? 'Crear desde cero' : 'Build from scratch');

  const goBack = () => {
    if (screen === 'home') onBack();
    else if (screen === 'audit') setScreen('analyze');
    else if (screen === 'builder') setScreen('create');
    else if (screen === 'preview') setScreen('builder');
    else setScreen('home');
  };

  const renderHome = () => (
    <div className="space-y-5">
      <section className="rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-500/15 to-[rgb(var(--surface-raised))] p-6"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary-500">Natural Hypertrophy · GainsLab</p><h1 className="mt-2 text-3xl font-black">Programming School</h1><p className="mt-3 text-sm leading-6 text-[rgb(var(--text-secondary))]">{lang === 'es' ? 'No es otra fábrica de rutinas. Aprendés a entender, decidir, probar y modificar tu propio sistema con el logbook como feedback.' : 'This is not another routine factory. You learn to understand, decide, test and modify your own system with the logbook as feedback.'}</p><div className="mt-4 flex flex-wrap gap-2"><EvidenceBadge kind="nh_principle" lang={lang}/><EvidenceBadge kind="inference" lang={lang}/><EvidenceBadge kind="gainslab_rule" lang={lang}/></div></section>
      <div className="space-y-2"><LevelCard icon="BookOpen" title={lang === 'es' ? 'Aprender los 4 niveles' : 'Learn the 4 levels'} subtitle={lang === 'es' ? '85%, evolving reps/sets, frecuencia, deloads, plateaus, sobrecarga y selección de ejercicios.' : '85%, evolving reps/sets, frequency, deloads, plateaus, overload and exercise selection.'} onClick={() => setScreen('learn')}/><LevelCard icon="BookOpen" title={lang === 'es' ? 'Ruta: programarte vos mismo' : 'Path: program for yourself'} subtitle={lang === 'es' ? 'Partes 1–3: experiencia → borrador → Alpha → Beta → sistema personal maduro.' : 'Parts 1–3: experience → draft → Alpha → Beta → mature personal system.'} onClick={() => setScreen('path')}/><LevelCard icon="Layers" title="Hypertrophy Iceberg" subtitle={lang === 'es' ? 'Mapa curricular para no aprender 40 variables a la vez.' : 'Curriculum map so you do not learn 40 variables at once.'} onClick={() => setScreen('iceberg')}/><LevelCard icon="BarChart2" title="MASSterplans" subtitle={lang === 'es' ? 'Espalda, hombros y antebrazos como marcos progresivos, no recetas.' : 'Back, shoulders and forearms as progressive frameworks, not recipes.'} onClick={() => setScreen('massterplans')}/><LevelCard icon="Search" title={lang === 'es' ? 'Analizar / modificar una rutina' : 'Analyze / modify a routine'} subtitle={lang === 'es' ? 'Primero explicás qué problema querés resolver; después tocás una copia.' : 'First state the problem you are trying to solve; then touch a copy.'} onClick={() => setScreen('analyze')}/><LevelCard icon="Plus" title={lang === 'es' ? 'Crear mi programa guiado' : 'Build my program with guidance'} subtitle={lang === 'es' ? 'GainsLab pone funciones; vos elegís ejercicios, experiencia, tolerancia, series y rangos.' : 'GainsLab lays out functions; you choose exercises, experience, tolerance, sets and brackets.'} onClick={() => setScreen('create')}/><LevelCard icon="Repeat" title={lang === 'es' ? 'Draft → Alpha → Beta → Maduro' : 'Draft → Alpha → Beta → Mature'} subtitle={lang === 'es' ? `${labTemplates.length} programa(s) NH Lab · registrá cambios y evolución sin reescribir todo.` : `${labTemplates.length} NH Lab program(s) · record changes and evolution without rebuilding everything.`} onClick={() => setScreen('lifecycle')}/><LevelCard icon="Brain" title={lang === 'es' ? 'Autoentrenarme con mi logbook' : 'Self-coach with my logbook'} subtitle={lang === 'es' ? 'Compara sólo exposiciones equivalentes y separa trabajo duro de un plateau real.' : 'Compare only like-for-like exposures and separate hard work from a real plateau.'} onClick={() => setScreen('selfcoach')}/></div>
    </div>
  );

  const renderLearn = () => <div className="space-y-4"><div className="flex gap-1.5 overflow-x-auto pb-1 scroll-container">{levelNames.map(item => <button key={item.id} type="button" onClick={() => setLessonLevel(item.id)} className={`min-h-9 shrink-0 rounded-xl px-3 text-[10px] font-black ${lessonLevel === item.id ? 'bg-primary-500 text-black' : 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'}`}>{item.label}</button>)}</div>{lessons.map(item => <section key={item.id} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><EvidenceBadge kind={item.kind as NhEvidenceKind} lang={lang}/><h3 className="mt-3 text-base font-black">{item.title[lang]}</h3><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-secondary))]">{item.summary[lang]}</p>{item.sourceScope && <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.08em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Fuente' : 'Source'} · {item.sourceScope}</p>}</section>)}</div>;

  const renderPath = () => <div className="space-y-3"><section className="rounded-3xl border border-primary-500/25 bg-primary-500/[0.06] p-5"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-primary-500">NH · SELF PROGRAMMING · PARTS 1–3</p><h2 className="mt-2 text-xl font-black">{lang === 'es' ? 'De depender de rutinas a construir un sistema' : 'From depending on routines to building a system'}</h2></section>{NH_SELF_PROGRAMMING_PATH_VERIFIED.map(stage => <React.Fragment key={stage.id}><section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-black">{stage.title[lang]}</h3><span className="rounded-lg bg-primary-500/10 px-2 py-1 text-[8px] font-black text-primary-400">VERIFIED</span></div><p className="mt-2 text-xs font-bold leading-5 text-[rgb(var(--text-secondary))]">{stage.action[lang]}</p><p className="mt-2 text-[10px] leading-4 text-[rgb(var(--text-muted))]">{stage.reason[lang]}</p></section>{stage.id === 'alpha-beta' && <section className="space-y-2">{NH_ALPHA_BETA_PROTOCOL.map(phase => <div key={phase.id} className="rounded-2xl border border-primary-500/15 bg-primary-500/[0.04] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black">{phase.title[lang]}</p><p className="mt-1 text-[10px] font-bold text-primary-400">{phase.timing[lang]}</p></div><EvidenceBadge kind="nh_principle" lang={lang}/></div><p className="mt-3 text-xs font-bold leading-5 text-[rgb(var(--text-secondary))]">{phase.goal[lang]}</p></div>)}</section>}</React.Fragment>)}<button type="button" onClick={() => setScreen('lifecycle')} className="min-h-12 w-full rounded-2xl bg-primary-500 px-4 text-sm font-black text-black">{lang === 'es' ? 'Abrir laboratorio Alpha/Beta' : 'Open Alpha/Beta Lab'}</button></div>;

  const renderIceberg = () => <div className="space-y-4"><section className="rounded-3xl border border-primary-500/25 bg-primary-500/[0.06] p-5"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-primary-500">THE HYPERTROPHY ICEBERG</p><h2 className="mt-2 text-xl font-black">{lang === 'es' ? 'Aprendé por profundidad' : 'Learn by depth'}</h2><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Es un mapa de cuándo un concepto empieza a ser útil, no un ranking científico.' : 'This maps when a concept starts becoming useful; it is not a scientific ranking.'}</p></section>{NH_ICEBERG_CURRICULUM.map((level,index) => <section key={level.id} className="rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><div className="flex items-center justify-between"><h3 className="text-base font-black">{level.title[lang]}</h3><span className="text-[9px] font-black text-primary-400">{index + 1}/5</span></div><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-secondary))]">{level.purpose[lang]}</p><div className="mt-3 flex flex-wrap gap-2">{level.concepts.map((concept,i) => <span key={i} className="rounded-xl bg-[rgb(var(--surface-base))] px-3 py-2 text-[10px] font-bold text-[rgb(var(--text-secondary))]">{concept[lang]}</span>)}</div><p className="mt-3 text-[9px] leading-4 text-[rgb(var(--text-muted))]">{level.note[lang]}</p></section>)}</div>;

  const renderMassterplans = () => <div className="space-y-4"><section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4"><p className="text-xs font-black text-amber-300">{lang === 'es' ? 'Marcos de NH, no límites universales' : 'NH frameworks, not universal limits'}</p></section>{NH_MASSTERPLAN_GUIDES.map(guide => <section key={guide.id} className="rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><h2 className="text-base font-black">{guide.title[lang]}</h2><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-secondary))]">{guide.principle[lang]}</p><div className="mt-4 space-y-2">{guide.stages.map(stage => <div key={stage.id} className="rounded-2xl bg-[rgb(var(--surface-base))] p-3"><p className="text-xs font-black">{stage.title[lang]}</p><p className="mt-1 text-[10px] leading-4 text-[rgb(var(--text-secondary))]">{stage.prescription[lang]}</p><p className="mt-2 text-[9px] font-bold leading-4 text-primary-400">{stage.graduation[lang]}</p></div>)}</div><p className="mt-3 text-[9px] leading-4 text-[rgb(var(--text-muted))]">{guide.caveat[lang]}</p></section>)}</div>;

  const renderAnalyze = () => <div className="space-y-4"><section className="rounded-2xl border border-primary-500/20 bg-primary-500/[0.05] p-4"><h2 className="text-base font-black">{lang === 'es' ? 'Primero entendé; después modificá' : 'Understand first; modify second'}</h2><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Elegí una rutina. El original nunca se toca: Programming School la desarma por funciones y sólo crea una copia cuando definís qué problema querés resolver.' : 'Choose a routine. The original is never touched: Programming School breaks it into functions and creates a copy only after you define the problem you are solving.'}</p></section><div className="space-y-2">{templates.slice().sort((a,b) => a.order-b.order).map(template => <button type="button" key={template.id} onClick={() => { setSelectedTemplateId(template.id); setModifyReason(''); setScreen('audit'); }} className="w-full rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 text-left"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-black">{String(getTranslated(template.title, lang))}</p><p className="mt-1 text-[10px] font-bold text-[rgb(var(--text-muted))]">{template.program.length} {lang === 'es' ? 'días' : 'days'}</p></div><Icon name="ChevronRight" size={16}/></div></button>)}</div></div>;

  const renderAudit = () => {
    if (!selectedTemplate || !selectedAudit) return null;
    const categories = summarizeNhAudit(selectedAudit);
    const roleRows = selectedTemplate.program.flatMap((day, dayIndex) => (day.slots || []).map((slot, slotIndex) => ({ day, dayIndex, slot, slotIndex, role: getNhRoleFromSlot(slot) })));
    return <div className="space-y-4"><section className="rounded-3xl border border-primary-500/25 bg-primary-500/[0.06] p-5"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-primary-500">NH PROGRAM AUDIT</p><h2 className="mt-1 text-xl font-black">{String(getTranslated(selectedTemplate.title, lang))}</h2><p className="mt-2 text-[10px] leading-4 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Sin nota 0–100: el objetivo es saber qué revisar, no perseguir un score arbitrario.' : 'No 0–100 grade: the objective is to know what to inspect, not chase an arbitrary score.'}</p></section><div className="grid grid-cols-2 gap-2">{categories.map(category => <div key={category.id} className={`rounded-2xl border p-3 ${category.state === 'clear' ? 'border-emerald-500/20 bg-emerald-500/[0.05]' : category.state === 'change' ? 'border-rose-500/20 bg-rose-500/[0.05]' : 'border-amber-500/20 bg-amber-500/[0.05]'}`}><div className="flex items-center justify-between"><p className="text-[10px] font-black">{category.title[lang]}</p><span className="text-[8px] font-black uppercase">{category.state === 'clear' ? 'OK' : category.state === 'change' ? (lang === 'es' ? 'CAMBIO' : 'CHANGE') : (lang === 'es' ? 'REVISAR' : 'REVIEW')}</span></div><p className="mt-2 text-[9px] leading-4 text-[rgb(var(--text-muted))]">{category.summary[lang]}</p></div>)}</div>{selectedAudit.findings.length > 0 && <section className="space-y-2">{selectedAudit.findings.map(finding => { const severity = finding.kind === 'inference' && finding.id.startsWith('adjacent-hinges-') ? 'watch' : finding.severity; return <div key={finding.id} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><div className="flex items-center justify-between"><EvidenceBadge kind={finding.kind} lang={lang}/><span className="text-[8px] font-black uppercase text-[rgb(var(--text-muted))]">{severity}</span></div><h4 className="mt-3 text-sm font-black">{finding.title[lang]}</h4><p className="mt-1 text-xs leading-5 text-[rgb(var(--text-secondary))]">{finding.detail[lang]}</p></div>; })}</section>}<section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><h3 className="text-sm font-black">{lang === 'es' ? 'Mapa de funciones' : 'Function map'}</h3><div className="mt-3 space-y-2">{roleRows.slice(0,18).map(row => <div key={`${row.dayIndex}-${row.slotIndex}`} className="flex items-center justify-between gap-3 rounded-xl bg-[rgb(var(--surface-base))] px-3 py-2"><div className="min-w-0"><p className="truncate text-[10px] font-bold">{exerciseName(row.slot.exerciseId) || row.slot.label}</p><p className="text-[8px] text-[rgb(var(--text-muted))]">{String(getTranslated(row.day.dayName, lang))}</p></div><span className="shrink-0 text-[9px] font-black text-primary-400">{row.role ? roleDefinition(row.role)?.title[lang] : (lang === 'es' ? 'Sin clasificar' : 'Unclassified')}</span></div>)}</div></section><section className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-4"><h3 className="text-sm font-black">{lang === 'es' ? '¿Qué problema querés resolver?' : 'What problem are you solving?'}</h3><div className="mt-3 grid grid-cols-2 gap-2">{MODIFY_REASONS.map(reason => <button key={reason.id} type="button" onClick={() => setModifyReason(reason.id)} className={`min-h-11 rounded-xl border px-3 text-left text-[10px] font-bold ${modifyReason === reason.id ? 'border-violet-500/35 bg-violet-500/15 text-violet-300' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))]'}`}>{reason[lang]}</button>)}</div><p className="mt-3 text-[9px] leading-4 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'La copia conserva esta razón en su changelog. La idea es evitar cambios por aburrimiento o reflejo.' : 'The copy keeps this reason in its changelog. The point is to avoid changes driven by boredom or reflex.'}</p></section><button type="button" disabled={!modifyReason} onClick={createLearningCopy} className="min-h-12 w-full rounded-2xl bg-primary-500 px-4 text-sm font-black text-black disabled:opacity-40">{lang === 'es' ? 'Crear copia didáctica y abrir editor' : 'Create teaching copy and open editor'}</button></div>;
  };

  const renderCreate = () => <div className="space-y-5"><section className="rounded-3xl border border-primary-500/25 bg-primary-500/[0.06] p-5"><EvidenceBadge kind="nh_principle" lang={lang}/><h2 className="mt-3 text-xl font-black">{lang === 'es' ? 'Vos programás. GainsLab te hace preguntas.' : 'You program. GainsLab asks questions.'}</h2><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'El siguiente paso sólo crea un esqueleto de funciones. No elige ejercicios por vos.' : 'The next step only creates a movement-function scaffold. It does not choose exercises for you.'}</p></section><section><p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">{lang === 'es' ? '1 · Marco simple' : '1 · Simple frame'}</p><div className="space-y-2">{([{days:3,en:'Full body · 3 days',es:'Full body · 3 días',descEn:'Restrictive frame; fewer places to hide unnecessary complexity.',descEs:'Marco restrictivo; menos lugares para esconder complejidad innecesaria.'},{days:4,en:'Upper / Lower · 4 days',es:'Upper / Lower · 4 días',descEn:'GainsLab teaching frame with clear upper/lower recovery boundaries.',descEs:'Marco didáctico de GainsLab con límites claros torso/pierna.'},{days:5,en:'Upper / Lower + Arms · 5 days',es:'Upper / Lower + Brazos · 5 días',descEn:'More distribution capacity, but more decisions to justify.',descEs:'Más capacidad de distribución, pero más decisiones que justificar.'}] as const).map(option => <button key={option.days} type="button" onClick={() => setDays(option.days)} className={`w-full rounded-2xl border p-4 text-left ${days === option.days ? 'border-primary-500/35 bg-primary-500/10' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]'}`}><p className="text-sm font-black">{option[lang]}</p><p className="mt-1 text-[10px] leading-4 text-[rgb(var(--text-muted))]">{lang === 'es' ? option.descEs : option.descEn}</p></button>)}</div></section><section><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">{lang === 'es' ? '2 · Prioridades' : '2 · Priorities'}</p><span className="text-[9px] font-bold text-[rgb(var(--text-muted))]">{priorities.length}/2</span></div><div className="grid grid-cols-2 gap-2">{MUSCLES.map(muscle => <button key={muscle} type="button" onClick={() => togglePriority(muscle)} className={`min-h-11 rounded-xl border px-3 text-left text-xs font-bold ${priorities.includes(muscle) ? 'border-primary-500/30 bg-primary-500/10 text-primary-400' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]'}`}>{muscleLabel(muscle, lang)}</button>)}</div></section><section><p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">{lang === 'es' ? '3 · Nombre del borrador' : '3 · Draft name'}</p><input value={draftName} onChange={event => setDraftName(event.target.value)} className="min-h-12 w-full rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-4 text-sm font-bold outline-none focus:border-primary-500/50"/></section><button type="button" onClick={beginBuilder} className="min-h-12 w-full rounded-2xl bg-primary-500 px-4 text-sm font-black text-black">{lang === 'es' ? 'Construir sólo el esqueleto de funciones' : 'Build the function scaffold only'}</button></div>;

  const renderBuilder = () => {
    if (!draft) return null;
    return <div className="space-y-4"><section className="rounded-3xl border border-primary-500/25 bg-primary-500/[0.06] p-5"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-primary-500">GUIDED BUILDER</p><h2 className="mt-1 text-xl font-black">{draftName}</h2><div className="mt-3 grid grid-cols-4 gap-2 text-center"><div><p className="text-lg font-black">{builderStatus.chosen}/{builderStatus.slots}</p><p className="text-[8px] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'elegidos' : 'chosen'}</p></div><div><p className="text-lg font-black">{builderStatus.experienced}/{builderStatus.slots}</p><p className="text-[8px] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'experiencia' : 'experience'}</p></div><div><p className="text-lg font-black">{builderStatus.fits}/{builderStatus.slots}</p><p className="text-[8px] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'tolerados' : 'fit'}</p></div><div><p className={`text-lg font-black ${builderStatus.ready ? 'text-emerald-400' : 'text-amber-400'}`}>{builderStatus.ready ? 'READY' : 'DRAFT'}</p><p className="text-[8px] text-[rgb(var(--text-muted))]">Alpha</p></div></div></section>{draft.map((day, dayIndex) => <section key={day.id} className="rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><h3 className="text-base font-black">{String(getTranslated(day.dayName, lang))}</h3><div className="mt-4 space-y-4">{(day.slots || []).map((slot, slotIndex) => {
      const role = getNhRoleFromSlot(slot);
      const definition = roleDefinition(role);
      const candidateIds = definition ? definition.candidateExerciseIds.filter(id => exerciseById.has(String(id))) : [];
      const selectedId = slot.exerciseId ? String(slot.exerciseId) : '';
      const selectedHistory = selectedId ? historyById.get(selectedId) : null;
      const experienced = selectedId ? isExperienced(selectedId) : false;
      const fit = selectedId ? fitByExercise[selectedId] : undefined;
      return <div key={`${day.id}-${slotIndex}`} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black">{definition?.title[lang] || slot.label || slot.muscle}</p><p className="mt-1 text-[9px] leading-4 text-[rgb(var(--text-muted))]">{definition?.purpose[lang]}</p></div><span className="rounded-lg bg-primary-500/10 px-2 py-1 text-[8px] font-black text-primary-400">{definition?.systemicCost?.toUpperCase()}</span></div><p className="mt-3 text-[9px] font-black uppercase tracking-[0.08em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Elegí el ejercicio' : 'Choose the exercise'}</p><select value={selectedId} onChange={event => setDraft(prev => prev ? updateNhDraftSlot(prev, dayIndex, slotIndex, { exerciseId: event.target.value || null }) : prev)} className="mt-1 min-h-11 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-3 text-xs font-bold"><option value="">{lang === 'es' ? '— Elegir —' : '— Choose —'}</option>{candidateIds.map(id => { const h = historyById.get(String(id)); return <option key={id} value={id}>{exerciseName(id)}{h?.experiencedByGainsLabHeuristic ? ` · ${lang === 'es' ? 'historial ✓' : 'history ✓'}` : ''}</option>; })}</select>{selectedId && <div className="mt-3 space-y-2"><div className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black">{lang === 'es' ? 'Experiencia con este movimiento' : 'Experience with this movement'}</p><p className="mt-1 text-[9px] text-[rgb(var(--text-muted))]">{selectedHistory ? `${selectedHistory.exposureCount} ${lang === 'es' ? 'exposiciones' : 'exposures'} · ${selectedHistory.spanDays}d` : (lang === 'es' ? 'Sin historial suficiente en GainsLab' : 'No sufficient GainsLab history')}</p></div><span className={`text-[9px] font-black ${experienced ? 'text-emerald-400' : 'text-amber-400'}`}>{experienced ? 'OK' : '?'}</span></div>{!selectedHistory?.experiencedByGainsLabHeuristic && <button type="button" onClick={() => setManualExperience(prev => ({ ...prev, [selectedId]: !prev[selectedId] }))} className={`mt-2 min-h-9 w-full rounded-xl border px-3 text-[9px] font-bold ${manualExperience[selectedId] ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-[rgb(var(--border-subtle))]'}`}>{manualExperience[selectedId] ? (lang === 'es' ? '✓ Confirmo que ya lo practicaba antes' : '✓ I confirm prior practice') : (lang === 'es' ? 'Confirmar experiencia previa fuera del logbook' : 'Confirm prior experience outside the logbook')}</button>}</div><div className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-3"><p className="text-[10px] font-black">{lang === 'es' ? '¿Cómo encaja con tu cuerpo?' : 'How does it fit your body?'}</p><div className="mt-2 grid grid-cols-3 gap-1.5">{([{id:'works',en:'Works',es:'Me funciona'},{id:'irritates',en:'Irritates',es:'Me molesta'},{id:'unsure',en:'Unsure',es:'No sé'}] as const).map(option => <button key={option.id} type="button" onClick={() => setFitByExercise(prev => ({ ...prev, [selectedId]: option.id }))} className={`min-h-9 rounded-lg border px-2 text-[9px] font-bold ${fit === option.id ? option.id === 'works' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-[rgb(var(--border-subtle))]'}`}>{option[lang]}</button>)}</div></div></div>}<div className="mt-3 grid grid-cols-2 gap-2"><div><p className="text-[9px] font-black uppercase text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Series' : 'Sets'}</p><div className="mt-1 flex min-h-11 items-center justify-between rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]"><button type="button" className="h-10 w-10 font-black" onClick={() => setDraft(prev => prev ? updateNhDraftSlot(prev, dayIndex, slotIndex, { setTarget: Math.max(1, Number(slot.setTarget || 1) - 1) }) : prev)}>−</button><span className="font-black">{slot.setTarget}</span><button type="button" className="h-10 w-10 font-black" onClick={() => setDraft(prev => prev ? updateNhDraftSlot(prev, dayIndex, slotIndex, { setTarget: Math.min(6, Number(slot.setTarget || 1) + 1) }) : prev)}>+</button></div></div><div><p className="text-[9px] font-black uppercase text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Rango' : 'Bracket'}</p><select value={slot.reps || ''} onChange={event => setDraft(prev => prev ? updateNhDraftSlot(prev, dayIndex, slotIndex, { reps: event.target.value }) : prev)} className="mt-1 min-h-11 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-3 text-xs font-black">{role ? uniqueNhRepRanges(role).map(range => <option key={range} value={range}>{range}</option>) : <option value={slot.reps}>{slot.reps}</option>}</select></div></div></div>;
    })}</div></section>)}<section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4"><p className="text-[10px] font-black text-amber-300">{lang === 'es' ? 'GAINSLAB RULE · listo para Alpha' : 'GAINSLAB RULE · Alpha readiness'}</p><p className="mt-1 text-[10px] leading-4 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Guardar un borrador siempre está permitido. Para declararlo listo para Alpha exigimos ejercicio elegido, experiencia confirmada y que vos marques que el movimiento te funciona. Esta confirmación queda persistida con el borrador.' : 'Saving a draft is always allowed. To call it Alpha-ready we require an exercise choice, confirmed experience and your own confirmation that the movement fits you. This readiness is persisted with the draft.'}</p></section><button type="button" onClick={() => setScreen('preview')} className="min-h-12 w-full rounded-2xl bg-primary-500 px-4 text-sm font-black text-black">{lang === 'es' ? 'Revisar mi borrador' : 'Review my draft'}</button></div>;
  };

  const renderPreview = () => {
    if (!draft || !draftAudit) return null;
    const categories = summarizeNhAudit(draftAudit);
    return <div className="space-y-4"><section className="rounded-3xl border border-primary-500/25 bg-primary-500/[0.06] p-5"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-primary-500">NH TEACHING DRAFT</p><h2 className="mt-1 text-xl font-black">{draftName}</h2><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-muted))]">{builderStatus.ready ? (lang === 'es' ? 'El checklist de producto está completo. Podés guardarlo como borrador y decidir cuándo iniciar Alpha.' : 'The product checklist is complete. Save it as a draft and decide when to start Alpha.') : (lang === 'es' ? 'Todavía hay decisiones sin cerrar. Eso está bien: un borrador no tiene que fingir que está listo.' : 'Some decisions are still unresolved. That is fine: a draft does not need to pretend it is ready.')}</p></section><div className="grid grid-cols-2 gap-2">{categories.map(category => <div key={category.id} className={`rounded-2xl border p-3 ${category.state === 'clear' ? 'border-emerald-500/20 bg-emerald-500/[0.05]' : category.state === 'change' ? 'border-rose-500/20 bg-rose-500/[0.05]' : 'border-amber-500/20 bg-amber-500/[0.05]'}`}><p className="text-[10px] font-black">{category.title[lang]}</p><p className="mt-1 text-[8px] font-black uppercase">{category.state === 'clear' ? 'OK' : category.state === 'change' ? (lang === 'es' ? 'CAMBIO' : 'CHANGE') : (lang === 'es' ? 'REVISAR' : 'REVIEW')}</p></div>)}</div>{draft.map(day => <section key={day.id} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><h3 className="text-sm font-black">{String(getTranslated(day.dayName, lang))}</h3><div className="mt-3 space-y-2">{(day.slots || []).map((slot,index) => <div key={index} className="grid grid-cols-[1fr_auto] gap-3 rounded-xl bg-[rgb(var(--surface-base))] px-3 py-2"><div><p className="text-[10px] font-bold">{exerciseName(slot.exerciseId)}</p><p className="text-[8px] text-[rgb(var(--text-muted))]">{slot.label}</p></div><p className="text-xs font-black">{slot.setTarget}×{slot.reps}</p></div>)}</div></section>)}<button type="button" onClick={() => saveDraft(false)} className="min-h-12 w-full rounded-2xl bg-primary-500 px-4 text-sm font-black text-black">{lang === 'es' ? 'Guardar como BORRADOR en Mías' : 'Save as DRAFT in Mine'}</button><button type="button" onClick={() => saveDraft(true)} className="min-h-11 w-full rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-4 text-xs font-bold">{lang === 'es' ? 'Guardar y abrir editor avanzado' : 'Save and open advanced editor'}</button></div>;
  };

  const renderLifecycle = () => {
    if (selectedLabTemplate?.nhLab) {
      const meta = selectedLabTemplate.nhLab;
      const next = nhLabNextPhase(meta.phase);
      const daysInPhase = nhLabDaysInPhase(selectedLabTemplate);
      const phaseGuidance = meta.phase === 'draft' ? (lang === 'es' ? 'El borrador todavía es teoría. Cerrá decisiones antes de empezar a probarlo.' : 'The draft is still theory. Close the open decisions before testing it.') : meta.phase === 'alpha' ? (lang === 'es' ? 'Alpha ≈ 2–3 meses en la guía de NH: buscá errores obvios y simplificá antes de agregar.' : 'Alpha is roughly 2–3 months in NH guidance: find obvious errors and simplify before adding.') : meta.phase === 'beta' ? (lang === 'es' ? 'Beta es largo: ajustá reps, sets, ubicación o variantes antes de reconstruir el programa.' : 'Beta is long: tweak reps, sets, placement or variations before rebuilding the program.') : (lang === 'es' ? 'Maduro significa estable pero flexible, no congelado.' : 'Mature means stable but flexible, not frozen.');
      return <div className="space-y-4"><button type="button" onClick={() => setLifecycleTemplateId('')} className="text-xs font-bold text-primary-400">← {lang === 'es' ? 'Todos mis NH Lab' : 'All NH Lab programs'}</button><section className="rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-black">{String(getTranslated(selectedLabTemplate.title, lang))}</h2><p className="mt-1 text-[10px] text-[rgb(var(--text-muted))]">{daysInPhase} {lang === 'es' ? 'días en fase' : 'days in phase'}</p></div><span className={`rounded-xl border px-3 py-2 text-[9px] font-black ${phaseClass(meta.phase)}`}>{nhLabPhaseLabel(meta.phase, lang)}</span></div><p className="mt-4 text-xs leading-5 text-[rgb(var(--text-secondary))]">{phaseGuidance}</p>{meta.sourceTemplateName && <p className="mt-3 text-[9px] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Origen' : 'Source'} · {meta.sourceTemplateName}</p>}</section>{next && <section className="rounded-2xl border border-primary-500/20 bg-primary-500/[0.05] p-4"><p className="text-xs font-black">{lang === 'es' ? 'Siguiente fase' : 'Next phase'} · {nhLabPhaseLabel(next, lang)}</p>{next === 'alpha' && !nhLabCanStartAlpha(selectedLabTemplate) && <p className="mt-2 text-[10px] leading-4 text-amber-400">{lang === 'es' ? 'No está listo: faltan decisiones estructurales o alguna confirmación de experiencia/tolerancia.' : 'Not ready: structural decisions or experience/fit confirmations are still missing.'}</p>}<button type="button" disabled={next === 'alpha' && !nhLabCanStartAlpha(selectedLabTemplate)} onClick={() => advanceLifecycle(selectedLabTemplate)} className="mt-3 min-h-11 w-full rounded-xl bg-primary-500 px-4 text-xs font-black text-black disabled:opacity-40">{lang === 'es' ? `Pasar a ${nhLabPhaseLabel(next, lang)}` : `Move to ${nhLabPhaseLabel(next, lang)}`}</button></section>}<section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><h3 className="text-sm font-black">{lang === 'es' ? 'Registrar una modificación' : 'Record a modification'}</h3><select value={changeReason} onChange={event => setChangeReason(event.target.value as NhLabChangeReason)} className="mt-3 min-h-11 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] px-3 text-xs font-bold">{MODIFY_REASONS.map(reason => <option key={reason.id} value={reason.id}>{reason[lang]}</option>)}</select><textarea value={changeNote} onChange={event => setChangeNote(event.target.value)} placeholder={lang === 'es' ? 'Qué cambiaste y por qué...' : 'What changed and why...'} className="mt-2 min-h-24 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] p-3 text-xs outline-none focus:border-primary-500/50"/><button type="button" disabled={!changeNote.trim()} onClick={() => recordChange(selectedLabTemplate)} className="mt-2 min-h-10 w-full rounded-xl border border-primary-500/30 bg-primary-500/10 text-xs font-black text-primary-400 disabled:opacity-40">{lang === 'es' ? 'Añadir al changelog' : 'Add to changelog'}</button></section><section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-black">Changelog</h3><span className="text-[9px] text-[rgb(var(--text-muted))]">{meta.changeLog.length}</span></div><div className="mt-3 space-y-2">{meta.changeLog.length === 0 ? <p className="text-[10px] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Todavía no registraste cambios.' : 'No changes recorded yet.'}</p> : meta.changeLog.slice(0,20).map(entry => <div key={entry.id} className="rounded-xl bg-[rgb(var(--surface-base))] p-3"><div className="flex items-center justify-between"><span className="text-[8px] font-black uppercase text-primary-400">{entry.phase} · {entry.reason}</span><span className="text-[8px] text-[rgb(var(--text-muted))]">{new Date(entry.at).toLocaleDateString()}</span></div><p className="mt-1 text-[10px] leading-4 text-[rgb(var(--text-secondary))]">{entry.note}</p></div>)}</div></section><button type="button" onClick={() => onSaveTemplate(selectedLabTemplate, true)} className="min-h-11 w-full rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-xs font-black">{lang === 'es' ? 'Abrir programa en editor' : 'Open program in editor'}</button></div>;
    }
    return <div className="space-y-4"><section className="rounded-3xl border border-primary-500/25 bg-primary-500/[0.06] p-5"><h2 className="text-xl font-black">{lang === 'es' ? 'Tus experimentos de programación' : 'Your programming experiments'}</h2><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'La fase no cambia automáticamente porque pasaron X días. NH da horizontes; vos decidís cuándo el programa ya respondió las preguntas de esa fase.' : 'The phase does not change automatically because X days passed. NH gives horizons; you decide when the program has answered that phase’s questions.'}</p></section>{labTemplates.length === 0 ? <div className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] p-8 text-center"><p className="text-sm font-black">{lang === 'es' ? 'Todavía no hay programas NH Lab' : 'No NH Lab programs yet'}</p><button type="button" onClick={() => setScreen('create')} className="mt-4 rounded-xl bg-primary-500 px-4 py-2 text-xs font-black text-black">{lang === 'es' ? 'Crear el primero' : 'Build the first one'}</button></div> : <div className="space-y-2">{labTemplates.map(template => <button key={template.id} type="button" onClick={() => setLifecycleTemplateId(template.id)} className="w-full rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 text-left"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-black">{String(getTranslated(template.title, lang))}</p><p className="mt-1 text-[9px] text-[rgb(var(--text-muted))]">{nhLabDaysInPhase(template)}d · {template.nhLab?.changeLog.length || 0} changes</p></div>{template.nhLab && <span className={`rounded-lg border px-2 py-1 text-[8px] font-black ${phaseClass(template.nhLab.phase)}`}>{nhLabPhaseLabel(template.nhLab.phase, lang)}</span>}</div></button>)}</div>}</div>;
  };

  const body = screen === 'home' ? renderHome() : screen === 'learn' ? renderLearn() : screen === 'path' ? renderPath() : screen === 'iceberg' ? renderIceberg() : screen === 'massterplans' ? renderMassterplans() : screen === 'analyze' ? renderAnalyze() : screen === 'audit' ? renderAudit() : screen === 'create' ? renderCreate() : screen === 'builder' ? renderBuilder() : screen === 'preview' ? renderPreview() : screen === 'selfcoach' ? <NhLogbookCoachView lang={lang}/> : renderLifecycle();

  return <div className="fixed inset-0 z-modal flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]"><header className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-app)/0.98)] px-4 pt-safe"><div className="mx-auto flex h-14 w-full max-w-xl items-center gap-3"><button type="button" onClick={goBack} className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]" aria-label={lang === 'es' ? 'Volver' : 'Back'}><Icon name="ChevronLeft" size={21}/></button><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary-500">Natural Hypertrophy</p><p className="truncate text-sm font-black">{headerTitle}</p></div></div></header><main className="flex-1 overflow-y-auto scroll-container"><div className="mx-auto w-full max-w-xl p-4 pb-[calc(env(safe-area-inset-bottom)+2rem)]">{body}</div></main></div>;
};
