import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { pickLang } from '../../utils/i18n';
import type { HomeViewState } from './useHomeViewState';

export const HomeResumeSession: React.FC<{ state: Pick<HomeViewState, 'activeSession' | 'onResumeSession' | 'lang'> }> = ({ state }) => {
    const { activeSession, onResumeSession, lang } = state;
    if (!activeSession || !onResumeSession) return null;
    return (
        <section className="gl-panel space-y-3 p-4" aria-label={pickLang(lang, { es: 'Sesión en curso', en: 'Session in progress' })}>
            <div>
                <p className="gl-eyebrow">{pickLang(lang, { es: 'En curso', en: 'In progress' })}</p>
                <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--text-primary))]">{activeSession.name}</h2>
            </div>
            <button type="button" className="gl-primary min-h-[48px] w-full gap-2" onClick={onResumeSession}>
                <Icon name="Play" size={18} /><span>{pickLang(lang, { es: 'Retomar', en: 'Resume session' })}</span>
            </button>
        </section>
    );
};

export const HomeQuickActions: React.FC<{ state: Pick<HomeViewState, 'onStartFreeSession' | 'onAddMeal' | 'h' | 'lang'> }> = ({ state }) => {
    const { onStartFreeSession, onAddMeal, h, lang } = state;
    if (!onStartFreeSession && !onAddMeal) return null;
    return (
        <div className="grid gap-2 sm:grid-cols-2">
            {onStartFreeSession && <button type="button" onClick={onStartFreeSession} className="gl-quiet min-h-[48px] gap-2 px-4 text-left text-sm">
                <Icon name="Zap" size={18} /><span>{pickLang(lang, { es: 'Sesión libre', en: 'Freestyle session' })} · {h.freeRowShort}</span>
            </button>}
            {onAddMeal && <button type="button" onClick={onAddMeal} className="gl-quiet min-h-[48px] gap-2 px-4 text-left text-sm">
                <Icon name="Plus" size={18} /><span>{pickLang(lang, { es: 'Añadir comida', en: 'Add meal' })}</span>
            </button>}
        </div>
    );
};
