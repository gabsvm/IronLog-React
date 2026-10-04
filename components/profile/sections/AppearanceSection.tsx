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
            <div className="seg-reference grid grid-cols-3 gap-1 p-1 mb-4">
                <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                        theme === 'dark'
                            ? 'bg-surface-elevated text-white border border-border-strong shadow-sm'
                            : 'text-muted hover:text-white'
                    }`}
                >
                    <Icon name="Moon" size={14} /> {ty.themeDark}
                </button>
                <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                        theme === 'light'
                            ? 'bg-surface-elevated text-white border border-border-strong shadow-sm'
                            : 'text-muted hover:text-white'
                    }`}
                >
                    <Icon name="Sun" size={14} /> {ty.themeLight}
                </button>
                <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                        theme === 'system'
                            ? 'bg-surface-elevated text-white border border-border-strong shadow-sm'
                            : 'text-muted hover:text-white'
                    }`}
                >
                    <Icon name="Smartphone" size={14} /> {ty.themeAuto}
                </button>
            </div>

            <div className="label-reference px-1 mb-1.5">{ty.accent}</div>
            <div className="card-reference p-4 mb-4">
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
            <div className="seg-reference grid grid-cols-2 gap-1 p-1 mb-4">
                <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`h-9 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                        lang === 'en'
                            ? 'bg-surface-elevated text-white border border-border-strong shadow-sm'
                            : 'text-muted hover:text-white'
                    }`}
                >
                    English
                </button>
                <button
                    type="button"
                    onClick={() => setLang('es')}
                    className={`h-9 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                        lang === 'es'
                            ? 'bg-surface-elevated text-white border border-border-strong shadow-sm'
                            : 'text-muted hover:text-white'
                    }`}
                >
                    Español
                </button>
            </div>

            <div className="card-reference p-3.5 space-y-3">
                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                        <Icon name="Zap" size={17} />
                    </span>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{ty.effectsTitle}</div>
                        <div className="text-xs text-muted truncate">
                            {effectsMode === 'system' && ty.effectsSystemDesc}
                            {effectsMode === 'full' && ty.effectsFullDesc}
                            {effectsMode === 'balanced' && ty.effectsBalancedDesc}
                            {effectsMode === 'reduced' && ty.effectsReducedDesc}
                        </div>
                    </div>
                    <span className="chip-reference text-xs font-semibold text-muted">
                        {resolvedEffects.toUpperCase()}
                    </span>
                </div>

                <div className="seg-reference grid grid-cols-4 gap-1 p-1">
                    <button
                        type="button"
                        onClick={() => setEffectsMode('system')}
                        className={`py-2 px-1 rounded-lg text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                            effectsMode === 'system'
                                ? 'bg-surface-elevated text-white border border-border-strong font-medium shadow-sm'
                                : 'text-muted hover:text-white'
                        }`}
                    >
                        <Icon name="Cpu" size={14} />
                        <span>{ty.effectsSystem}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setEffectsMode('full')}
                        className={`py-2 px-1 rounded-lg text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                            effectsMode === 'full'
                                ? 'bg-surface-elevated text-white border border-border-strong font-medium shadow-sm'
                                : 'text-muted hover:text-white'
                        }`}
                    >
                        <Icon name="Zap" size={14} />
                        <span>{ty.effectsFull}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setEffectsMode('balanced')}
                        className={`py-2 px-1 rounded-lg text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                            effectsMode === 'balanced'
                                ? 'bg-surface-elevated text-white border border-border-strong font-medium shadow-sm'
                                : 'text-muted hover:text-white'
                        }`}
                    >
                        <Icon name="Layers" size={14} />
                        <span>{ty.effectsBalanced}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setEffectsMode('reduced')}
                        className={`py-2 px-1 rounded-lg text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                            effectsMode === 'reduced'
                                ? 'bg-surface-elevated text-white border border-border-strong font-medium shadow-sm'
                                : 'text-muted hover:text-white'
                        }`}
                    >
                        <Icon name="EyeOff" size={14} />
                        <span>{ty.effectsReduced}</span>
                    </button>
                </div>
                <p className="text-[11px] text-muted leading-relaxed px-1">
                    {effectsMode === 'system' && ty.effectsSystemLong}
                    {effectsMode === 'full' && ty.effectsFullLong}
                    {effectsMode === 'balanced' && ty.effectsBalancedLong}
                    {effectsMode === 'reduced' && ty.effectsReducedLong}
                </p>
            </div>
        </div>
    );
};
