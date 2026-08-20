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
  type NhProgrammingLevel,
} from '../../programs/naturalHypertrophy/programmingSchool';
import {
  NH_ALPHA_BETA_PROTOCOL,
  NH_ICEBERG_CURRICULUM,
  NH_SELF_PROGRAMMING_PATH_VERIFIED,
  NH_SELF_PROGRAMMING_SOURCE_LESSONS,
} from '../../programs/naturalHypertrophy/nhSelfProgrammingProtocol';

type Screen = 'home' | 'learn' | 'path' | 'iceberg' | 'massterplans' | 'analyze' | 'audit' | 'create' | 'preview' | 'selfcoach';

interface Props {
  lang: 'en' | 'es';
  templates: GlobalTemplate[];
  onBack: () => void;
  onSaveTemplate: (template: GlobalTemplate, openEditor: boolean) => void;
}

const MUSCLES: MuscleGroup[] = ['CHEST','BACK','QUADS','HAMSTRINGS','SHOULDERS','BICEPS','TRICEPS','CALVES','ABS','NECK'];
const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeLogTime = (value: unknown) => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
};

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
  <span className={`inline-flex rounded-lg border px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] ${evidenceClass(kind)}`}>
    {evidenceLabel(kind, lang)}
  </span>
);

const LevelCard = ({ icon, title, subtitle, onClick }: { icon: string; title: string; subtitle: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="flex min-h-[78px] w-full items-center gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 text-left active:bg-[rgb(var(--surface-elevated))]">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500"><Icon name={icon} size={19}/></span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-black">{title}</span><span className="mt-1 block text-xs leading-5 text-[rgb(var(--text-muted))]">{subtitle}</span></span>
    <Icon name="ChevronRight" size={17} className="shrink-0 text-[rgb(var(--text-muted))]"/>
  </button>
);

export const NhProgrammingSchoolView: React.FC<Props> = ({ lang, templates, onBack, onSaveTemplate }) => {
  const { logs } = useApp();
  const [screen, setScreen] = useState<Screen>('home');
  const [lessonLevel, setLessonLevel] = useState<NhProgrammingLevel>('understand');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [days, setDays] = useState<3|4|5>(4);
  const [priorities, setPriorities] = useState<MuscleGroup[]>([]);
  const [draft, setDraft] = useState<ProgramDay[] | null>(null);

  const experiencedExerciseIds = useMemo(() => {
    const history = new Map<string, number[]>();
    (Array.isArray(logs) ? logs : []).filter(log => !log.skipped).forEach(log => {
      const time = normalizeLogTime(log.endTime || log.startTime);
      if (!time) return;
      (log.exercises || []).forEach(exercise => {
        const hasWork = (exercise.sets || []).some(set => set.completed && !set.skipped && set.type !== 'warmup' && set.type !== 'avt_hop');
        if (!hasWork || exercise.id == null) return;
        const id = String(exercise.id);
        const list = history.get(id) || [];
        list.push(time);
        history.set(id, list);
      });
    });

    return Array.from(history.entries()).filter(([, times]) => {
      const ordered = times.slice().sort((a,b) => a-b);
      const span = ordered.length > 1 ? ordered[ordered.length - 1] - ordered[0] : 0;
      return ordered.length >= 6 && span >= 90 * DAY_MS;
    }).map(([id]) => id);
  }, [logs]);

  const selectedTemplate = useMemo(() => templates.find(item => item.id === selectedTemplateId) || null, [templates, selectedTemplateId]);
  const selectedAudit = useMemo(() => selectedTemplate ? auditNhProgram(selectedTemplate.program) : null, [selectedTemplate]);
  const draftAudit = useMemo(() => draft ? auditNhProgram(draft) : null, [draft]);
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

  const togglePriority = (muscle: MuscleGroup) => {
    setPriorities(prev => prev.includes(muscle) ? prev.filter(item => item !== muscle) : prev.length >= 2 ? [prev[1], muscle] : [...prev, muscle]);
  };

  const createPreview = () => {
    const pool = experiencedExerciseIds.length > 0 ? experiencedExerciseIds : ['__no_experienced_lifts__'];
    setDraft(buildNhTeachingDraft({ days, priorities, experiencedExerciseIds: pool }));
    setScreen('preview');
  };

  const saveDraft = (program: ProgramDay[], baseName: string, openEditor: boolean) => {
    const name = `${baseName} · NH Lab`;
    onSaveTemplate(makeNhSchoolTemplate(program, name), openEditor);
  };

  const headerTitle = screen === 'home' ? 'Programming School'
    : screen === 'learn' ? (lang === 'es' ? 'Aprender el método' : 'Learn the method')
    : screen === 'path' ? (lang === 'es' ? 'Programarte vos mismo' : 'Program for yourself')
    : screen === 'iceberg' ? (lang === 'es' ? 'Mapa de aprendizaje' : 'Learning map')
    : screen === 'massterplans' ? 'MASSterplans'
    : screen === 'analyze' || screen === 'audit' ? (lang === 'es' ? 'Analizar una rutina' : 'Analyze a routine')
    : screen === 'selfcoach' ? 'Self-Coach · Logbook'
    : (lang === 'es' ? 'Crear desde cero' : 'Build from scratch');

  const goBack = () => {
    if (screen === 'home') onBack();
    else if (screen === 'audit') setScreen('analyze');
    else if (screen === 'preview') setScreen('create');
    else setScreen('home');
  };

  const renderHome = () => (
    <div className="space-y-5">
      <section className="rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-500/15 to-[rgb(var(--surface-raised))] p-6">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary-500">Natural Hypertrophy · GainsLab</p>
        <h1 className="mt-2 text-3xl font-black">Programming School</h1>
        <p className="mt-3 text-sm leading-6 text-[rgb(var(--text-secondary))]">
          {lang === 'es'
            ? 'El objetivo no es darte otra rutina para copiar. Es enseñarte qué función cumple cada decisión, cómo leer tu logbook y cómo terminar programando para vos mismo.'
            : 'The goal is not to hand you another routine to copy. It is to teach what each decision does, how to read your logbook, and how to eventually program for yourself.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2"><EvidenceBadge kind="nh_principle" lang={lang}/><EvidenceBadge kind="inference" lang={lang}/><EvidenceBadge kind="gainslab_rule" lang={lang}/></div>
      </section>

      <div className="space-y-2">
        <LevelCard icon="BookOpen" title={lang === 'es' ? 'Aprender los 4 niveles' : 'Learn the 4 levels'} subtitle={lang === 'es' ? '85%, evolving reps/sets, frecuencia, deloads, plateaus, sobrecarga, variantes y selección de ejercicios.' : '85%, evolving reps/sets, frequency, deloads, plateaus, overload, variations and exercise selection.'} onClick={() => setScreen('learn')}/>
        <LevelCard icon="BookOpen" title={lang === 'es' ? 'Ruta: programarte vos mismo' : 'Path: program for yourself'} subtitle={lang === 'es' ? 'Las Partes 1, 2 y 3 ya están trazadas: experiencia, borrador, Alpha, Beta y sistema personal maduro.' : 'Parts 1, 2 and 3 are now sourced: experience, draft, Alpha, Beta and a mature personal system.'} onClick={() => setScreen('path')}/>
        <LevelCard icon="Layers" title={lang === 'es' ? 'Hypertrophy Iceberg · mapa de aprendizaje' : 'Hypertrophy Iceberg · learning map'} subtitle={lang === 'es' ? 'Aprendé en orden: fundamentos → tracking → variables → programación → herramientas de nicho.' : 'Learn in order: foundations → tracking → variables → programming → niche tools.'} onClick={() => setScreen('iceberg')}/>
        <LevelCard icon="BarChart2" title="MASSterplans" subtitle={lang === 'es' ? 'Espalda, hombros y antebrazos como marcos progresivos, no rutinas para copiar.' : 'Back, shoulders and forearms as progressive frameworks, not routines to copy.'} onClick={() => setScreen('massterplans')}/>
        <LevelCard icon="Search" title={lang === 'es' ? 'Analizar / modificar una rutina' : 'Analyze / modify a routine'} subtitle={lang === 'es' ? 'Desarma una rutina existente y revisa cobertura, redundancia, interferencia y costo.' : 'Break an existing routine apart and inspect coverage, redundancy, interference and cost.'} onClick={() => setScreen('analyze')}/>
        <LevelCard icon="Plus" title={lang === 'es' ? 'Crear un borrador propio' : 'Build your own draft'} subtitle={lang === 'es' ? 'GainsLab usa primero ejercicios con historial suficiente en tu logbook y deja placeholders cuando no hay experiencia demostrada.' : 'GainsLab first uses exercises with enough history in your logbook and leaves placeholders when experience is not demonstrated.'} onClick={() => setScreen('create')}/>
        <LevelCard icon="BarChart2" title={lang === 'es' ? 'Autoentrenarme con mi logbook' : 'Self-coach with my logbook'} subtitle={lang === 'es' ? 'Distingue progreso, trabajo difícil normal y un plateau que sí merece intervención.' : 'Distinguish progress, normal hard work and a plateau that actually deserves intervention.'} onClick={() => setScreen('selfcoach')}/>
      </div>

      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
        <div className="flex items-start gap-3"><Icon name="AlertTriangle" size={17} className="mt-0.5 shrink-0 text-amber-400"/><div><p className="text-xs font-black text-amber-300">{lang === 'es' ? 'Trazabilidad primero' : 'Traceability first'}</p><p className="mt-1 text-xs leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Cuando GainsLab convierte una idea de NH en una regla concreta de software, la etiqueta como propia. Las prescripciones de NH tampoco se presentan como leyes científicas universales.' : 'When GainsLab turns an NH idea into a concrete software rule, it labels that rule as its own. NH prescriptions are also not presented as universal scientific laws.'}</p></div></div>
      </section>
    </div>
  );

  const renderLearn = () => (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1 scroll-container">{levelNames.map(item => <button key={item.id} type="button" onClick={() => setLessonLevel(item.id)} className={`min-h-9 shrink-0 rounded-xl px-3 text-[10px] font-black ${lessonLevel === item.id ? 'bg-primary-500 text-black' : 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'}`}>{item.label}</button>)}</div>
      {lessons.map(item => <section key={item.id} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><EvidenceBadge kind={item.kind as NhEvidenceKind} lang={lang}/><h3 className="mt-3 text-base font-black">{item.title[lang]}</h3><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-secondary))]">{item.summary[lang]}</p>{item.sourceScope && <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.08em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Ámbito de la fuente' : 'Source scope'} · {item.sourceScope}</p>}</section>)}
      <section className="rounded-2xl border border-primary-500/20 bg-primary-500/[0.05] p-4"><p className="text-xs font-black">{lang === 'es' ? 'La pregunta que querés aprender a hacer' : 'The question you want to learn to ask'}</p><p className="mt-2 text-sm font-black leading-6">{lang === 'es' ? '“¿Qué necesita cambiar mi programa y qué evidencia tengo de que necesita cambiar?”' : '“What needs to change in my program, and what evidence do I have that it needs to change?”'}</p></section>
    </div>
  );

  const renderPath = () => (
    <div className="space-y-3">
      <section className="rounded-3xl border border-primary-500/25 bg-primary-500/[0.06] p-5">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-primary-500">NH · SELF PROGRAMMING · PARTS 1–3</p>
        <h2 className="mt-2 text-xl font-black">{lang === 'es' ? 'De copiar rutinas a construir la tuya' : 'From copying routines to building your own'}</h2>
        <p className="mt-2 text-xs leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'La ruta ya está completa y trazada: Parte 1 explica la emancipación y el banco de experiencia; Parte 2 construye el programa; Parte 3 define Alpha y Beta. No queda ninguna etapa marcada como fuente pendiente.' : 'The route is now complete and sourced: Part 1 covers emancipation and experience, Part 2 writes the program, and Part 3 defines Alpha and Beta. No stage remains source-pending.'}</p>
      </section>
      {NH_SELF_PROGRAMMING_PATH_VERIFIED.map(stage => <React.Fragment key={stage.id}><section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-black">{stage.title[lang]}</h3><span className="rounded-lg bg-primary-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-primary-400">{lang === 'es' ? 'VERIFICADO' : 'VERIFIED'}</span></div><p className="mt-2 text-xs font-bold leading-5 text-[rgb(var(--text-secondary))]">{stage.action[lang]}</p><p className="mt-2 text-[10px] leading-4 text-[rgb(var(--text-muted))]">{stage.reason[lang]}</p><p className="mt-3 text-[9px] font-bold uppercase tracking-[0.08em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Fuente' : 'Source'} · {stage.sourceScope}</p></section>{stage.id === 'alpha-beta' && <section className="space-y-2">{NH_ALPHA_BETA_PROTOCOL.map(phase => <div key={phase.id} className="rounded-2xl border border-primary-500/15 bg-primary-500/[0.04] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black">{phase.title[lang]}</p><p className="mt-1 text-[10px] font-bold text-primary-400">{phase.timing[lang]}</p></div><EvidenceBadge kind="nh_principle" lang={lang}/></div><p className="mt-3 text-xs font-bold leading-5 text-[rgb(var(--text-secondary))]">{phase.goal[lang]}</p><div className="mt-3 space-y-1.5">{phase.actions.map((item,index) => <div key={`a-${index}`} className="flex gap-2 text-[10px] leading-4 text-[rgb(var(--text-secondary))]"><span className="font-black text-emerald-400">✓</span><span>{item[lang]}</span></div>)}</div><div className="mt-3 space-y-1.5">{phase.avoid.map((item,index) => <div key={`x-${index}`} className="flex gap-2 text-[10px] leading-4 text-[rgb(var(--text-muted))]"><span className="font-black text-rose-400">×</span><span>{item[lang]}</span></div>)}</div></div>)}</section>}</React.Fragment>)}
    </div>
  );

  const renderIceberg = () => (
    <div className="space-y-4">
      <section className="rounded-3xl border border-primary-500/25 bg-primary-500/[0.06] p-5"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-primary-500">THE HYPERTROPHY ICEBERG</p><h2 className="mt-2 text-xl font-black">{lang === 'es' ? 'No aprendás todo a la vez' : 'Do not learn everything at once'}</h2><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'NH usa el iceberg como mapa de cuándo un concepto empieza a ser útil, no como ranking científico. GainsLab lo usa como currículo: cada profundidad desbloquea preguntas más complejas.' : 'NH uses the iceberg as a map of when a concept becomes useful, not as a scientific ranking. GainsLab uses it as curriculum: each depth introduces more complex questions.'}</p></section>
      {NH_ICEBERG_CURRICULUM.map((level,index) => <section key={level.id} className="rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><div className="flex items-center justify-between"><h3 className="text-base font-black">{level.title[lang]}</h3><span className="text-[9px] font-black text-primary-400">{index + 1}/5</span></div><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-secondary))]">{level.purpose[lang]}</p><div className="mt-3 space-y-2">{level.concepts.map((concept,conceptIndex) => <div key={conceptIndex} className="rounded-xl bg-[rgb(var(--surface-base))] px-3 py-2 text-[10px] font-bold text-[rgb(var(--text-secondary))]">{concept[lang]}</div>)}</div><p className="mt-3 text-[9px] leading-4 text-[rgb(var(--text-muted))]">{level.note[lang]}</p></section>)}
    </div>
  );

  const renderMassterplans = () => (
    <div className="space-y-4">
      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4"><p className="text-xs font-black text-amber-300">{lang === 'es' ? 'No son límites científicos universales' : 'Not universal scientific limits'}</p><p className="mt-1 text-[10px] leading-4 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Son marcos y prescripciones de Natural Hypertrophy. GainsLab conserva el contexto y evita convertirlos en “MEV/MRV” universales.' : 'These are Natural Hypertrophy frameworks and prescriptions. GainsLab preserves context rather than turning them into universal MEV/MRV numbers.'}</p></section>
      {NH_MASSTERPLAN_GUIDES.map(guide => <section key={guide.id} className="rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><h2 className="text-base font-black">{guide.title[lang]}</h2><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-secondary))]">{guide.principle[lang]}</p><div className="mt-4 space-y-2">{guide.stages.map(stage => <div key={stage.id} className="rounded-2xl bg-[rgb(var(--surface-base))] p-3"><p className="text-xs font-black">{stage.title[lang]}</p><p className="mt-1 text-[10px] leading-4 text-[rgb(var(--text-secondary))]">{stage.prescription[lang]}</p><p className="mt-2 text-[9px] font-bold leading-4 text-primary-400">{stage.graduation[lang]}</p></div>)}</div><p className="mt-3 text-[9px] leading-4 text-[rgb(var(--text-muted))]">{guide.caveat[lang]}</p></section>)}
    </div>
  );

  const renderAnalyze = () => (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><h2 className="text-base font-black">{lang === 'es' ? 'Elegí una rutina para desmontar' : 'Choose a routine to take apart'}</h2><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'No se modifica el original. El laboratorio audita la estructura y sólo crea una copia personal si decidís trabajar sobre ella.' : 'The original is never modified. The lab audits the structure and creates a personal copy only if you choose to work on it.'}</p></section>
      <div className="space-y-2">{templates.slice().sort((a,b) => a.order-b.order).map(template => <button type="button" key={template.id} onClick={() => { setSelectedTemplateId(template.id); setScreen('audit'); }} className="w-full rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 text-left active:bg-[rgb(var(--surface-elevated))]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-black">{String(getTranslated(template.title, lang))}</p><p className="mt-1 text-[10px] font-bold text-[rgb(var(--text-muted))]">{template.program.length} {lang === 'es' ? 'días' : 'days'}{template.scope === 'personal' ? ` · ${lang === 'es' ? 'personal' : 'personal'}` : ''}</p></div><Icon name="ChevronRight" size={16} className="shrink-0 text-[rgb(var(--text-muted))]"/></div></button>)}</div>
    </div>
  );

  const renderAudit = () => {
    if (!selectedTemplate || !selectedAudit) return null;
    const sets = Object.entries(selectedAudit.directSets).filter(([, value]) => Number(value) > 0).sort((a,b) => Number(b[1])-Number(a[1]));
    return <div className="space-y-4">
      <section className="rounded-3xl border border-primary-500/25 bg-primary-500/[0.06] p-5"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-primary-500">NH PROGRAM AUDIT</p><h2 className="mt-1 text-xl font-black">{String(getTranslated(selectedTemplate.title, lang))}</h2><div className="mt-4 flex items-end justify-between"><div><p className="text-4xl font-black tabular-nums">{selectedAudit.score}</p><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'score didáctico' : 'teaching score'}</p></div><span className="text-xs font-bold text-[rgb(var(--text-muted))]">{selectedAudit.findings.length} {lang === 'es' ? 'observaciones' : 'findings'}</span></div><p className="mt-3 text-[10px] leading-4 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'El score es una heurística de GainsLab para ordenar la auditoría; no es una puntuación de Natural Hypertrophy ni determina si la rutina “sirve”.' : 'The score is a GainsLab heuristic for organizing the audit; it is not a Natural Hypertrophy score and does not decide whether the routine “works”.'}</p></section>
      <section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><h3 className="text-sm font-black">{lang === 'es' ? 'Series directas' : 'Direct sets'}</h3><div className="mt-3 flex flex-wrap gap-2">{sets.map(([muscle, value]) => <span key={muscle} className="rounded-xl bg-[rgb(var(--surface-base))] px-3 py-2 text-[10px] font-bold"><span className="text-[rgb(var(--text-muted))]">{muscleLabel(muscle as MuscleGroup, lang)}</span> <span className="ml-1 text-[rgb(var(--text-primary))]">{value}</span></span>)}</div></section>
      <section className="space-y-2">{selectedAudit.findings.length === 0 ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4"><p className="text-sm font-black text-emerald-400">{lang === 'es' ? 'Sin alertas estructurales del auditor actual' : 'No structural flags from the current auditor'}</p><p className="mt-1 text-xs leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Eso no significa que sea perfecta: todavía hay que mirar rendimiento, recuperación, molestias y prioridades.' : 'That does not make it perfect: performance, recovery, discomfort and priorities still matter.'}</p></div> : selectedAudit.findings.map(finding => <div key={finding.id} className={`rounded-2xl border p-4 ${finding.severity === 'change' ? 'border-rose-500/20 bg-rose-500/[0.05]' : finding.severity === 'watch' ? 'border-amber-500/20 bg-amber-500/[0.05]' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]'}`}><div className="flex items-center justify-between gap-2"><EvidenceBadge kind={finding.kind} lang={lang}/><span className="text-[8px] font-black uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">{finding.severity}</span></div><h4 className="mt-3 text-sm font-black">{finding.title[lang]}</h4><p className="mt-1 text-xs leading-5 text-[rgb(var(--text-secondary))]">{finding.detail[lang]}</p></div>)}</section>
      <button type="button" onClick={() => saveDraft(selectedTemplate.program.map(day => ({...day, slots: (day.slots||[]).map(slot => ({...slot}))})), String(getTranslated(selectedTemplate.title, lang)), true)} className="min-h-12 w-full rounded-2xl bg-primary-500 px-4 text-sm font-black text-black">{lang === 'es' ? 'Crear copia y abrir editor' : 'Create copy and open editor'}</button>
    </div>;
  };

  const renderCreate = () => (
    <div className="space-y-5">
      <section className="rounded-2xl border border-primary-500/20 bg-primary-500/[0.05] p-4"><EvidenceBadge kind="nh_principle" lang={lang}/><h2 className="mt-3 text-base font-black">{lang === 'es' ? 'Primero: ejercicios que ya conocés' : 'First: lifts you already know'}</h2><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? `NH dice que el primer programa propio debe construirse desde ejercicios practicados regularmente durante unos 3 meses. Tu logbook tiene ${experiencedExerciseIds.length} ejercicios que pasan la heurística actual de GainsLab.` : `NH says the first self-written program should be built from exercises practiced regularly for about 3 months. Your logbook has ${experiencedExerciseIds.length} exercises that pass the current GainsLab heuristic.`}</p><p className="mt-2 text-[9px] leading-4 text-amber-400">{lang === 'es' ? 'GAINSLAB RULE · “regularmente” no viene con un número exacto: usamos ≥6 exposiciones distribuidas en ≥90 días. Si una familia no tiene un ejercicio con ese historial, el borrador deja un placeholder en vez de inventar experiencia.' : 'GAINSLAB RULE · “regularly” has no exact count in the source: we use ≥6 exposures spread across ≥90 days. If a movement family has no exercise with that history, the draft leaves a placeholder instead of inventing experience.'}</p></section>
      <section><p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">{lang === 'es' ? '1 · Días reales disponibles' : '1 · Real days available'}</p><div className="grid grid-cols-3 gap-2">{([3,4,5] as const).map(value => <button key={value} type="button" onClick={() => setDays(value)} className={`min-h-14 rounded-2xl border text-lg font-black ${days === value ? 'border-primary-500/30 bg-primary-500/10 text-primary-400' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]'}`}>{value}</button>)}</div></section>
      <section><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">{lang === 'es' ? '2 · Prioridades' : '2 · Priorities'}</p><span className="text-[9px] font-bold text-[rgb(var(--text-muted))]">{priorities.length}/2</span></div><div className="grid grid-cols-2 gap-2">{MUSCLES.map(muscle => <button key={muscle} type="button" onClick={() => togglePriority(muscle)} className={`min-h-11 rounded-xl border px-3 text-left text-xs font-bold ${priorities.includes(muscle) ? 'border-primary-500/30 bg-primary-500/10 text-primary-400' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))]'}`}>{muscleLabel(muscle, lang)}</button>)}</div><p className="mt-2 text-[10px] leading-4 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Priorizar significa asignar recursos. No intentamos especializar todo a la vez.' : 'Prioritizing means allocating resources. We do not try to specialize everything at once.'}</p></section>
      <section><p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">{lang === 'es' ? '3 · Funciones que estás aprendiendo' : '3 · Functions you are learning'}</p><div className="grid grid-cols-2 gap-2">{NH_ROLE_LIBRARY.slice(0,10).map(item => <div key={item.id} className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-3"><p className="text-[10px] font-black">{item.title[lang]}</p><p className="mt-1 text-[9px] text-[rgb(var(--text-muted))]">{item.defaultRepRange} · {item.systemicCost.toUpperCase()}</p></div>)}</div></section>
      <button type="button" onClick={createPreview} className="min-h-12 w-full rounded-2xl bg-primary-500 px-4 text-sm font-black text-black">{lang === 'es' ? 'Construir borrador y auditar' : 'Build scaffold and audit'}</button>
    </div>
  );

  const renderPreview = () => {
    if (!draft || !draftAudit) return null;
    const placeholders = draft.reduce((sum, day) => sum + day.slots.filter(slot => !slot.exerciseId).length, 0);
    return <div className="space-y-4">
      <section className="rounded-3xl border border-primary-500/25 bg-primary-500/[0.06] p-5"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-primary-500">NH TEACHING DRAFT</p><h2 className="mt-1 text-xl font-black">{days} {lang === 'es' ? 'días' : 'days'}{priorities.length ? ` · ${priorities.map(item => muscleLabel(item, lang)).join(' + ')}` : ''}</h2><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? `Usamos tu historial cuando existe. Quedaron ${placeholders} placeholders porque GainsLab no encontró un ejercicio con historial suficiente para esas funciones.` : `Your history is used where available. ${placeholders} placeholders remain because GainsLab did not find an exercise with enough history for those functions.`}</p></section>
      {draft.map((day, dayIndex) => <section key={day.id} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-black">{getTranslated(day.dayName, lang)}</h3><span className="text-[9px] font-black text-[rgb(var(--text-muted))]">{day.slots.length} SLOTS</span></div><div className="mt-3 divide-y divide-[rgb(var(--border-subtle)/0.6)]">{day.slots.map((slot,index) => <div key={`${dayIndex}-${index}`} className="grid grid-cols-[1fr_auto] gap-3 py-2.5"><div><p className="text-xs font-bold">{slot.label || slot.muscle}</p><p className={`mt-0.5 text-[9px] ${slot.exerciseId ? 'text-[rgb(var(--text-muted))]' : 'font-bold text-amber-400'}`}>{slot.exerciseId || (lang === 'es' ? 'PLACEHOLDER · elegí un ejercicio que ya conozcas' : 'PLACEHOLDER · choose a lift you already know')}</p></div><p className="text-xs font-black tabular-nums">{slot.setTarget}×{slot.reps}</p></div>)}</div></section>)}
      <section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-black">{lang === 'es' ? 'Auditoría del borrador' : 'Scaffold audit'}</h3><span className="text-lg font-black text-primary-400">{draftAudit.score}</span></div><p className="mt-2 text-[10px] leading-4 text-[rgb(var(--text-muted))]">{lang === 'es' ? `${draftAudit.findings.length} observaciones. El score no convierte este borrador en “tu programa final”. La ruta NH ahora te lleva explícitamente por Alpha y Beta antes de tratarlo como maduro.` : `${draftAudit.findings.length} findings. The score does not turn this scaffold into your “final program”. The NH path now explicitly takes it through Alpha and Beta before treating it as mature.`}</p></section>
      <button type="button" onClick={() => saveDraft(draft, lang === 'es' ? 'Mi programa' : 'My program', true)} className="min-h-12 w-full rounded-2xl bg-primary-500 px-4 text-sm font-black text-black">{lang === 'es' ? 'Guardar en Mías y abrir editor' : 'Save to Mine and open editor'}</button>
      <button type="button" onClick={() => saveDraft(draft, lang === 'es' ? 'Mi programa' : 'My program', false)} className="min-h-11 w-full rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-4 text-xs font-bold">{lang === 'es' ? 'Guardar borrador sin editar' : 'Save scaffold without editing'}</button>
    </div>;
  };

  const body = screen === 'home' ? renderHome()
    : screen === 'learn' ? renderLearn()
    : screen === 'path' ? renderPath()
    : screen === 'iceberg' ? renderIceberg()
    : screen === 'massterplans' ? renderMassterplans()
    : screen === 'analyze' ? renderAnalyze()
    : screen === 'audit' ? renderAudit()
    : screen === 'create' ? renderCreate()
    : screen === 'selfcoach' ? <NhLogbookCoachView lang={lang}/>
    : renderPreview();

  return (
    <div className="fixed inset-0 z-modal flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]">
      <header className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-app)/0.98)] px-4 pt-safe">
        <div className="mx-auto flex h-14 w-full max-w-xl items-center gap-3">
          <button type="button" onClick={goBack} className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]" aria-label={lang === 'es' ? 'Volver' : 'Back'}><Icon name="ChevronLeft" size={21}/></button>
          <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary-500">Natural Hypertrophy</p><p className="truncate text-sm font-black">{headerTitle}</p></div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto scroll-container"><div className="mx-auto w-full max-w-xl p-4 pb-[calc(env(safe-area-inset-bottom)+2rem)]">{body}</div></main>
    </div>
  );
};