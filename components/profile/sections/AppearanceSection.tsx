import React from 'react';
import { useApp } from '../../../context/AppContext';
import { TRANSLATIONS } from '../../../constants';
import { Icon } from '../../ui/Icon';
import { ColorPill } from './ColorPill';

/** Q18: "Apariencia" section, moved verbatim from ProfileSheet. */
export const AppearanceSection: React.FC = () => {
    const {
        lang, setLang, theme, setTheme, colorTheme, setColorTheme,
        effectsMode, setEffectsMode, resolvedEffects,
    } = useApp();
    const t = TRANSLATIONS[lang];
    const ty = t.you;

    return (
        <div id="profile-section-appearance">
            <div className="label-reference px-1 mb-1.5">{ty.appearance}</div>
            <div className="label-reference px-1 mb-1.5">{t.theme}</div>
            <div className="gl-panel gl-connected grid grid-cols-3 gap-1 p-1 mb-4">
                <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    aria-pressed={theme === 'dark'}
                    className={`min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        theme === 'dark'
                            ? 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border-strong))] shadow-sm'
                            : 'text-muted hover:text-[rgb(var(--text-primary))]'
                    }`}
                >
                    <Icon name="Moon" size={14} /> {ty.themeDark}
                </button>
                <button
                    type="button"
                    onClick={() => setTheme('light')}
                    aria-pressed={theme === 'light'}
                    className={`min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        theme === 'light'
                            ? 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border-strong))] shadow-sm'
                            : 'text-muted hover:text-[rgb(var(--text-primary))]'
                    }`}
                >
                    <Icon name="Sun" size={14} /> {ty.themeLight}
                </button>
                <button
                    type="button"
                    onClick={() => setTheme('system')}
                    aria-pressed={theme === 'system'}
                    className={`min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        theme === 'system'
                            ? 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border-strong))] shadow-sm'
                            : 'text-muted hover:text-[rgb(var(--text-primary))]'
                    }`}
                >
                    <Icon name="Smartphone" size={14} /> {ty.themeAuto}
                </button>
            </div>

            <div className="label-reference px-1 mb-1.5">{ty.accent}</div>
            <div className="gl-panel p-4 mb-4">
                <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-center text-xs">
                    <ColorPill color="bg-[#c4f13a]" checkDark label={ty.pillIron} active={colorTheme === 'iron'} onClick={() => setColorTheme('iron')} />
                    <ColorPill color="bg-[#378add]" label={ty.pillOcean} active={colorTheme === 'ocean'} onClick={() => setColorTheme('ocean')} />
                    <ColorPill color="bg-[#1d9e75]" label={ty.pillForest} active={colorTheme === 'forest'} onClick={() => setColorTheme('forest')} />
                    <ColorPill color="bg-[#8f4fc9]" label={ty.pillRoyal} active={colorTheme === 'royal'} onClick={() => setColorTheme('royal')} />
                    <ColorPill color="bg-[#d4631a]" label={ty.pillSunset} active={colorTheme === 'sunset'} onClick={() => setColorTheme('sunset')} />
                    <ColorPill color="bg-[#5f6068]" label={ty.pillMono} active={colorTheme === 'monochrome'} onClick={() => setColorTheme('monochrome')} />
                </div>
            </div>

            <div className="label-reference px-1 mb-1.5">{t.language}</div>
            <div className="gl-panel gl-connected grid grid-cols-2 gap-1 p-1 mb-4">
                {/* Autonyms stay literal by convention; one mapped control instead of a branch per language. */}
                {(['en', 'es'] as const).map((code) => (
                    <button
                        key={code}
                        type="button"
                        onClick={() => setLang(code)}
                        aria-pressed={lang === code}
                        className={`min-h-[44px] rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                            lang === code
                                ? 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border-strong))] shadow-sm'
                                : 'text-muted hover:text-[rgb(var(--text-primary))]'
                        }`}
                    >
                        {code === 'en' ? 'English' : 'Español'}
                    </button>
                ))}
            </div>

            <div className="gl-panel p-3.5 space-y-3">
                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-accent shrink-0">
                        <Icon name="Zap" size={17} />
                    </span>
                    <div className="flex-1 min-w-0 text-sm font-medium text-[rgb(var(--text-primary))]">{ty.effectsTitle}</div>
                    <span className="gl-pill text-xs">
                        {({ full: ty.effectsFull, balanced: ty.effectsBalanced, reduced: ty.effectsReduced } as Record<string, string>)[resolvedEffects] ?? resolvedEffects}
                    </span>
                </div>

                <div className="gl-panel gl-connected grid grid-cols-4 gap-1 p-1" role="group" aria-label={ty.effectsTitle}>
                    <button
                        type="button"
                        onClick={() => setEffectsMode('system')}
                        aria-pressed={effectsMode === 'system'}
                        className={`min-h-[44px] py-2 px-1 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                            effectsMode === 'system'
                                ? 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border-strong))] font-medium shadow-sm'
                                : 'text-muted hover:text-[rgb(var(--text-primary))]'
                        }`}
                    >
                        <Icon name="Cpu" size={14} />
                        <span>{ty.effectsSystem}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setEffectsMode('full')}
                        aria-pressed={effectsMode === 'full'}
                        className={`min-h-[44px] py-2 px-1 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                            effectsMode === 'full'
                                ? 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border-strong))] font-medium shadow-sm'
                                : 'text-muted hover:text-[rgb(var(--text-primary))]'
                        }`}
                    >
                        <Icon name="Zap" size={14} />
                        <span>{ty.effectsFull}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setEffectsMode('balanced')}
                        aria-pressed={effectsMode === 'balanced'}
                        className={`min-h-[44px] py-2 px-1 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                            effectsMode === 'balanced'
                                ? 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border-strong))] font-medium shadow-sm'
                                : 'text-muted hover:text-[rgb(var(--text-primary))]'
                        }`}
                    >
                        <Icon name="Layers" size={14} />
                        <span>{ty.effectsBalanced}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setEffectsMode('reduced')}
                        aria-pressed={effectsMode === 'reduced'}
                        className={`min-h-[44px] py-2 px-1 rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                            effectsMode === 'reduced'
                                ? 'bg-[rgb(var(--surface-elevated))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border-strong))] font-medium shadow-sm'
                                : 'text-muted hover:text-[rgb(var(--text-primary))]'
                        }`}
                    >
                        <Icon name="EyeOff" size={14} />
                        <span>{ty.effectsReduced}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
