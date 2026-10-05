// T2: FreestyleSessionModal state, effects and handlers, moved verbatim from
// components/workout/FreestyleSessionModal.tsx (the view is now an orchestrator).
import { pickLang } from '../../../utils/i18n';
import { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { CROSSFIT_EXERCISES, CALISTHENICS_EXERCISES } from '../../../data/disciplineExercises';
import { SKILL_PROGRESSION_MAP } from '../../../data/SkillProgressionMap';
import { ActiveSession, SessionExercise } from '../../../types';
import { TRANSLATIONS } from '../../../constants';
import { CF_WODS, CAL_SKILLS, makeSessionExercise } from './freestyleData';
import type { Discipline } from './freestyleData';

export interface FreestyleSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (session: ActiveSession) => void;
}

export const useFreestyleSessionState = ({ isOpen, onClose, onStart }: FreestyleSessionModalProps) => {
    const { lang, exercises: gymExercises } = useApp();
    const [discipline, setDiscipline] = useState<Discipline>('gym');
    const [selectedWodId, setSelectedWodId] = useState<string | null>(null);
    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
    const [selectedSkillFamilyId, setSelectedSkillFamilyId] = useState<string | null>(null);
    const [calTab, setCalTab] = useState<'skills' | 'templates'>('skills');
    const [query, setQuery] = useState('');
    const f = TRANSLATIONS[lang].freestyle;

    const allExercises = useMemo(() => [
        ...gymExercises,
        ...CROSSFIT_EXERCISES,
        ...CALISTHENICS_EXERCISES,
    ], [gymExercises]);

    const handleStartBlank = (label: string) => {
        onStart({
            id: Date.now(),
            dayIdx: -1,
            name: label,
            startTime: Date.now(),
            mesoId: -1,
            week: -1,
            exercises: [],
        });
        onClose();
    };

    const handleStartFreeGym = () => handleStartBlank(f.freeGym);

    const handleStartWod = () => {
        const wod = CF_WODS.find(w => w.id === selectedWodId);
        if (!wod) return;
        const exs: SessionExercise[] = wod.exercises.map((id, idx) => {
            const ex = allExercises.find(e => e.id === id) || CROSSFIT_EXERCISES[0];
            const reps = wod.sets[idx] || 10;
            return makeSessionExercise(ex, reps, 1);
        });
        onStart({
            id: Date.now(),
            dayIdx: -1,
            name: `WOD: ${wod.name} — ${wod.schema}`,
            startTime: Date.now(),
            mesoId: -1,
            week: -1,
            exercises: exs,
        });
        onClose();
    };

    const handleStartSkill = () => {
        const skill = CAL_SKILLS.find(s => s.id === selectedSkillId);
        if (!skill) return;
        const exs: SessionExercise[] = skill.exercises.map(id => {
            const ex = allExercises.find(e => e.id === id) || CALISTHENICS_EXERCISES[0];
            const isIso = !!(ex as any).isIsometric;
            return makeSessionExercise(ex, isIso ? 0 : 8, isIso ? 5 : 4);
        });
        onStart({
            id: Date.now(),
            dayIdx: -1,
            name: pickLang(lang, skill.name),
            startTime: Date.now(),
            mesoId: -1,
            week: -1,
            exercises: exs,
        });
        onClose();
    };

    const handleStartSkillFamily = () => {
        const family = SKILL_PROGRESSION_MAP[selectedSkillFamilyId || ''];
        if (!family) return;
        // Load all levels of the skill family as exercises for a focused skill session
        const exs: SessionExercise[] = family.levels.map(lvl => {
            const ex = allExercises.find(e => e.id === lvl.exerciseId);
            if (!ex) return null;
            const isIso = !!(ex as any).isIsometric;
            return makeSessionExercise(ex, isIso ? 0 : 6, isIso ? 5 : 4);
        }).filter(Boolean) as SessionExercise[];
        onStart({
            id: Date.now(),
            dayIdx: -1,
            name: `🎯 ${pickLang(lang, family.name)}`,
            startTime: Date.now(),
            mesoId: -1,
            week: -1,
            exercises: exs,
        });
        onClose();
    };

    const tabStyle = (active: boolean, color: string) =>
        `flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-2xl transition-all active:scale-95 ${
            active ? `${color} text-white shadow-lg` : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
        }`;

    const canStart =
        (discipline === 'gym') ||
        (discipline === 'crossfit' && !!selectedWodId) ||
        (discipline === 'calisthenics' && (!!selectedSkillId || !!selectedSkillFamilyId));

    const handleStart = () => {
        if (discipline === 'gym') handleStartFreeGym();
        else if (discipline === 'crossfit') handleStartWod();
        else if (selectedSkillFamilyId) handleStartSkillFamily();
        else handleStartSkill();
    };

    const startLabel = (() => {
        if (discipline === 'gym') return f.startFree;
        if (discipline === 'crossfit') {
            const w = CF_WODS.find(w => w.id === selectedWodId);
            return w ? `⚡ WOD: ${w.name}` : f.selectWod;
        }
        if (selectedSkillFamilyId) {
            const fam = SKILL_PROGRESSION_MAP[selectedSkillFamilyId];
            return fam ? `🎯 ${pickLang(lang, fam.name)}` : '🤸 Skill Session';
        }
        const s = CAL_SKILLS.find(s => s.id === selectedSkillId);
        return s ? `🤸 ${pickLang(lang, s.name)}` : f.selectSession;
    })();


    return {
        isOpen,
        onClose,
        onStart,
        lang,
        gymExercises,
        discipline,
        setDiscipline,
        selectedWodId,
        setSelectedWodId,
        selectedSkillId,
        setSelectedSkillId,
        selectedSkillFamilyId,
        setSelectedSkillFamilyId,
        calTab,
        setCalTab,
        query,
        setQuery,
        f,
        allExercises,
        handleStartBlank,
        handleStartFreeGym,
        handleStartWod,
        handleStartSkill,
        handleStartSkillFamily,
        tabStyle,
        canStart,
        handleStart,
        startLabel,
    };
};

export type FreestyleSessionState = ReturnType<typeof useFreestyleSessionState>;
