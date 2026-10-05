// T2: calisthenics skill builder, moved verbatim from components/workout/FreestyleSessionModal.tsx.
import { pickLang } from '../../../utils/i18n';
import React from 'react';
import { Icon } from '../../ui/Icon';
import { SKILL_PROGRESSION_MAP } from '../../../data/SkillProgressionMap';
import { CAL_SKILLS } from './freestyleData';
import type { FreestyleSessionState } from './useFreestyleSessionState';

export const FreestyleSkillPanel: React.FC<{ state: FreestyleSessionState }> = ({ state }) => {
    const { lang, discipline, selectedSkillId, setSelectedSkillId, selectedSkillFamilyId, setSelectedSkillFamilyId, calTab, setCalTab, f, handleStartBlank } = state;
    return (
        <>
            {discipline === 'calisthenics' && (
                <div className="space-y-4">
                    {/* Blank calisthenics option */}
                    <button
                        onClick={() => handleStartBlank(f.blankCal)}
                        className="w-full text-left p-4 rounded-2xl border-2 border-dashed border-primary-500/40 bg-primary-500/5 hover:border-primary-500/60 transition-all active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary-500/20 flex items-center justify-center shrink-0">
                                <Icon name="Plus" size={18} className="text-primary-400" />
                            </div>
                            <div>
                                <p className="font-black text-sm text-primary-400">
                                    {f.openSession}
                                </p>
                                <p className="text-xs text-muted mt-0.5">
                                    {f.noTemplate}
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Sub-tabs */}
                    <div className="flex bg-black/20 p-1 rounded-xl gap-1">
                        <button
                            onClick={() => { setCalTab('skills'); setSelectedSkillFamilyId(null); }}
                            className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                calTab === 'skills' ? 'bg-primary-600 text-black shadow' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {f.bySkill}
                        </button>
                        <button
                            onClick={() => { setCalTab('templates'); setSelectedSkillId(null); setSelectedSkillFamilyId(null); }}
                            className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                calTab === 'templates' ? 'bg-primary-600 text-black shadow' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {f.templatesTab}
                        </button>
                    </div>

                    {/* SKILL FAMILIES */}
                    {calTab === 'skills' && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                {f.chooseFamily}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.values(SKILL_PROGRESSION_MAP).map(family => {
                                    const isSelected = selectedSkillFamilyId === family.id;
                                    const colorMap: Record<string, string> = {
                                        'bg-violet-500': 'border-primary-500 bg-primary-500/10 text-primary-400',
                                        'bg-blue-500': 'border-primary-500 bg-primary-500/10 text-primary-400',
                                        'bg-amber-500': 'border-primary-500 bg-primary-500/10 text-primary-400',
                                        'bg-emerald-500': 'border-primary-500 bg-primary-500/10 text-primary-400',
                                        'bg-rose-500': 'border-primary-500 bg-primary-500/10 text-primary-400',
                                        'bg-cyan-500': 'border-primary-500 bg-primary-500/10 text-primary-400',
                                    };
                                    const selectedClass = colorMap[family.color] ?? 'border-primary-500 bg-primary-500/10 text-primary-400';
                                    return (
                                        <button
                                            key={family.id}
                                            onClick={() => {
                                                setSelectedSkillFamilyId(isSelected ? null : family.id);
                                                setSelectedSkillId(null);
                                            }}
                                            className={`p-3 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                                                isSelected
                                                    ? selectedClass
                                                    : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <Icon name={family.icon as any} size={14} />
                                                <span className="text-[11px] font-black">
                                                    {pickLang(lang, family.name)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted">
                                                {family.levels.length} {f.levels}
                                            </div>
                                            {/* Level dots */}
                                            <div className="flex gap-0.5 mt-1.5">
                                                {family.levels.map((_, i) => (
                                                    <div key={i} className={`w-2 h-1.5 rounded-full ${
                                                        isSelected ? 'bg-primary-500' : 'bg-zinc-700'
                                                    }`} />
                                                ))}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedSkillFamilyId && (() => {
                                const fam = SKILL_PROGRESSION_MAP[selectedSkillFamilyId];
                                if (!fam) return null;
                                return (
                                    <div className="bg-primary-500/5 border border-primary-500/20 rounded-2xl p-3 space-y-1.5">
                                        <p className="text-[10px] font-black uppercase text-primary-400 tracking-wider">
                                            {f.sessionExercises}
                                        </p>
                                        {fam.levels.map((lvl, i) => (
                                            <div key={i} className="flex items-center gap-2 text-[11px]">
                                                <div className="w-1 h-1 rounded-full bg-primary-400 shrink-0" />
                                                <span className="text-zinc-300">
                                                    {pickLang(lang, lvl.name)}
                                                </span>
                                                {lvl.unlockAt && (
                                                    <span className="text-zinc-600 ml-auto">
                                                        ({lvl.unlockAt.value}{lvl.unlockAt.unit === 'sec' ? 's' : 'r'})
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* SESSION TEMPLATES */}
                    {calTab === 'templates' && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                {f.fullDay}
                            </p>
                            {CAL_SKILLS.map(skill => {
                                const isSelected = selectedSkillId === skill.id;
                                return (
                                    <button
                                        key={skill.id}
                                        onClick={() => { setSelectedSkillId(isSelected ? null : skill.id); setSelectedSkillFamilyId(null); }}
                                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                                            isSelected
                                                ? 'border-primary-500 bg-primary-500/5'
                                                : 'border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                isSelected ? skill.color + ' text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                            }`}>
                                                <Icon name={skill.icon as any} size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-black text-sm ${
                                                    isSelected ? 'text-primary-400' : 'text-zinc-900 dark:text-white'
                                                }`}>
                                                    {pickLang(lang, skill.name)}
                                                </div>
                                                <div className="text-[10px] text-zinc-400 mt-0.5">
                                                    {pickLang(lang, skill.description)}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0 gap-1">
                                                <span className="text-xs font-bold text-muted">
                                                    {skill.exercises.length} {f.exAbbr}
                                                </span>
                                                {isSelected && <Icon name="Check" size={14} className="text-primary-500" />}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </>
    );
};
