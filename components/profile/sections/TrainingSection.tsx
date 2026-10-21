import React, { Suspense, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { usePro } from '../../../hooks/usePro';
import { useStore } from '../../../lib/store';
import { TRANSLATIONS } from '../../../constants';
import { GlobalTemplate } from '../../../types';
import { Icon } from '../../ui/Icon';
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { ExactAlarmRow } from '../ExactAlarmRow';
import { ReminderSettingsRow } from '../ReminderSettingsRow';
import { AdminTemplateManager } from '../../admin/AdminTemplateManager';
import { triggerHaptic } from '../../../utils/audio';
import { requestTimerNotificationPermission } from '../../../hooks/useTimer';
import { resolveWeightUnit, unitLabel } from '../../../utils/units';
import { Capacitor } from '@capacitor/core';
import {
    loadReminderConfig,
    saveReminderConfig,
    syncReminderSchedule,
    type WorkoutReminderConfig,
} from '../../../utils/reminders';

const PaywallModal = React.lazy(() => import('../../pro/PaywallModal').then(m => ({ default: m.PaywallModal })));

interface TrainingSectionProps {
    onClose: () => void;
    onOpenProgram: () => void;
    onOpenExercises: () => void;
}

/** Q18: "Entrenamiento" section, moved verbatim from ProfileSheet. */
export const TrainingSection: React.FC<TrainingSectionProps> = ({ onClose, onOpenProgram, onOpenExercises }) => {
    const { lang, config, setConfig, program, personalTemplates, setPersonalTemplates } = useApp();
    const { isAdmin } = useAuth();
    const { isPro, checkPro, showPaywall, setShowPaywall, featureAttempted } = usePro();
    const activeMeso = useStore(state => state.activeMeso);
    const t = TRANSLATIONS[lang];
    const ty = t.you;

    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [templateSaved, setTemplateSaved] = useState(false);
    const [showTemplateManager, setShowTemplateManager] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [notificationPerm, setNotificationPerm] = useState<string>(typeof Notification !== 'undefined' ? Notification.permission : 'default');
    const [reminderConfig, setReminderConfig] = useState<WorkoutReminderConfig>(() => loadReminderConfig());
    const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

    const handleReminderChange = (next: WorkoutReminderConfig) => {
        setReminderConfig(next);
        saveReminderConfig(next);
        void syncReminderSchedule(next);
    };

    const openSaveTemplate = () => {
        if (!activeMeso || program.length === 0) return;
        setTemplateName(activeMeso.name || ty.saveTemplateEmpty);
        setShowSaveTemplate(true);
    };

    const savePersonalTemplate = () => {
        const title = templateName.trim();
        if (!title || program.length === 0) return;

        const id = `personal_${Date.now()}`;
        const template: GlobalTemplate = {
            id,
            name: id,
            title: { en: title, es: title },
            description: {
                en: 'Private template saved from your active routine.',
                es: 'Plantilla privada guardada desde tu rutina activa.',
            },
            isPro: false,
            order: personalTemplates.length,
            scope: 'personal',
            program: JSON.parse(JSON.stringify(program)),
        };

        setPersonalTemplates(prev => [...prev, template]);
        setShowSaveTemplate(false);
        setTemplateSaved(true);
        window.setTimeout(() => setTemplateSaved(false), 3500);
    };

    const handleToggleRIR = () => {
        triggerHaptic('light');
        setConfig({ showRIR: !config.showRIR });
    };

    const handleToggleWakeLock = () => {
        triggerHaptic('light');
        setConfig({ keepScreenOn: !config.keepScreenOn });
    };

    const openProgramGated = () => {
        if (!checkPro('Custom Routines')) return;
        onClose();
        onOpenProgram();
    };

    const openExercisesGated = () => {
        if (!checkPro('Exercise Library')) return;
        onClose();
        onOpenExercises();
    };

    return (
        <div id="profile-section-training">
            <div className="label-reference px-1 mb-1.5">{ty.training}</div>
            <div className="gl-panel divide-y divide-[rgb(var(--border-subtle))] overflow-hidden">
                {activeMeso && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex min-h-[56px] w-full items-center gap-3 p-3 text-left transition-colors hover:bg-surface-elevated/40"
                    >
                        <span className="w-8 h-8 rounded-xl bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                            <Icon name="Calendar" size={17} />
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">{activeMeso.name}</div>
                            <div className="text-xs text-muted">
                                {ty.mesoWeek.replace('{week}', String(activeMeso.week)).replace('{target}', String(activeMeso.targetWeeks || activeMeso.duration))}
                            </div>
                        </div>
                    </button>
                )}
                <button
                    type="button"
                    onClick={openProgramGated}
                    className="flex min-h-[56px] w-full items-center gap-3 p-3 text-left transition-colors hover:bg-surface-elevated/40"
                >
                    <span className="w-8 h-8 rounded-xl bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                        <Icon name="Layout" size={17} />
                    </span>
                    <div className="flex-1 text-sm font-medium text-[rgb(var(--text-primary))]">{t.programEditor}</div>
                    {!isPro
                        ? <Icon name="Lock" size={16} className="text-yellow-500 shrink-0" />
                        : <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />}
                </button>
                <button
                    type="button"
                    onClick={openExercisesGated}
                    className="flex min-h-[56px] w-full items-center gap-3 p-3 text-left transition-colors hover:bg-surface-elevated/40"
                >
                    <span className="w-8 h-8 rounded-xl bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                        <Icon name="Dumbbell" size={17} />
                    </span>
                    <div className="flex-1 text-sm font-medium text-[rgb(var(--text-primary))]">{ty.exercisesRow}</div>
                    {!isPro
                        ? <Icon name="Lock" size={16} className="text-yellow-500 shrink-0" />
                        : <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />}
                </button>
                {isAdmin && (
                    <button
                        type="button"
                        onClick={() => setShowTemplateManager(true)}
                        className="flex min-h-[56px] w-full items-center gap-3 p-3 text-left transition-colors hover:bg-surface-elevated/40"
                    >
                        <span className="w-8 h-8 rounded-xl bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                            <Icon name="Copy" size={17} />
                        </span>
                        <div className="flex-1 text-sm font-medium text-[rgb(var(--text-primary))]">{t.manageTemplates}</div>
                        <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                    </button>
                )}
            </div>

            <button
                type="button"
                onClick={openSaveTemplate}
                disabled={!activeMeso || program.length === 0}
                className="gl-panel group flex min-h-[60px] w-full items-center justify-between gap-3 p-3.5 text-left disabled:opacity-45"
            >
                <div className="flex items-center gap-3 text-left">
                    <div className="rounded-xl bg-[rgb(var(--surface-elevated))] p-2 text-[rgb(var(--text-primary))]">
                        <Icon name="Copy" size={18} />
                    </div>
                    <div>
                        <span className="block text-sm font-bold text-[rgb(var(--text-primary))]">
                            {ty.saveTemplate}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                            {activeMeso && program.length > 0 ? ty.saveTemplatePrivate : ty.saveTemplateEmpty}
                        </span>
                    </div>
                </div>
                <Icon name="ChevronRight" size={16} className="shrink-0 text-muted" />
            </button>

            {templateSaved && (
                <p role="status" className="mt-2 px-1 text-xs font-bold text-primary-400">{ty.templateSaved}</p>
            )}

            <div className="label-reference px-1 mt-4 mb-1.5">{ty.workoutSetup}</div>
            <div className="gl-panel divide-y divide-[rgb(var(--border-subtle))] overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                    <span className="w-8 h-8 rounded-xl bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                        <Icon name="Gauge" size={17} />
                    </span>
                    <div className="flex-1 text-sm font-medium text-[rgb(var(--text-primary))]">{t.showRIR}</div>
                    <button
                        type="button"
                        onClick={handleToggleRIR}
                        aria-label={t.showRIR}
                        aria-pressed={config.showRIR}
                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config.showRIR ? 'bg-primary-500' : 'bg-surface-elevated border border-border-strong'}`}
                    >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all ${config.showRIR ? 'left-[22px] bg-white' : 'left-0.5 bg-white'}`} />
                    </button>
                </div>
                <div className="flex items-center gap-3 p-3">
                    <span className="w-8 h-8 rounded-xl bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                        <Icon name="Smartphone" size={17} />
                    </span>
                    <div className="flex-1 text-sm font-medium text-[rgb(var(--text-primary))]">{t.keepScreen}</div>
                    <button
                        type="button"
                        onClick={handleToggleWakeLock}
                        aria-label={t.keepScreen}
                        aria-pressed={config.keepScreenOn}
                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config.keepScreenOn ? 'bg-primary-500' : 'bg-surface-elevated border border-border-strong'}`}
                    >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all ${config.keepScreenOn ? 'left-[22px] bg-white' : 'left-0.5 bg-white'}`} />
                    </button>
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                    <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{t.restTimerDisplay}</span>
                    <div className="flex gap-1 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] p-1 shrink-0" role="group" aria-label={t.restTimerDisplay}>
                        <button
                            type="button"
                            onClick={() => setConfig({ ...config, restTimerDisplay: 'compact' })}
                            aria-pressed={(config.restTimerDisplay || 'compact') === 'compact'}
                            className={`min-h-[44px] px-3 text-xs rounded-lg font-semibold transition-all ${
                                (config.restTimerDisplay || 'compact') === 'compact'
                                    ? 'bg-primary-500 text-black shadow-sm'
                                    : 'text-muted hover:text-[rgb(var(--text-primary))]'
                            }`}
                        >
                            {t.restTimerCompact}
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfig({ ...config, restTimerDisplay: 'expanded' })}
                            aria-pressed={config.restTimerDisplay === 'expanded'}
                            className={`min-h-[44px] px-3 text-xs rounded-lg font-semibold transition-all ${
                                config.restTimerDisplay === 'expanded'
                                    ? 'bg-primary-500 text-black shadow-sm'
                                    : 'text-muted hover:text-[rgb(var(--text-primary))]'
                            }`}
                        >
                            {t.restTimerExpanded}
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                    <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{ty.weightUnit}</span>
                    <div className="flex gap-1 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] p-1 shrink-0" role="group" aria-label={ty.weightUnit}>
                        {(['kg', 'lb'] as const).map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setConfig({ ...config, weightUnit: option })}
                                aria-pressed={resolveWeightUnit(config) === option}
                                className={`min-h-[44px] px-3 text-xs rounded-lg font-semibold transition-all ${
                                    resolveWeightUnit(config) === option
                                        ? 'bg-primary-500 text-black shadow-sm'
                                        : 'text-muted hover:text-[rgb(var(--text-primary))]'
                                }`}
                            >
                                {unitLabel(option)}
                            </button>
                        ))}
                    </div>
                </div>
                {typeof window !== 'undefined' && 'Notification' in window && (
                    <div className="flex items-center justify-between gap-2 p-3">
                        <div className="flex flex-col pr-2">
                            <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{t.restNotifications}</span>
                            <span className="text-xs text-muted">{t.restNotificationsDesc}</span>
                            {/* S4: be honest about web timers (frozen with the screen off). */}
                            {!Capacitor.isNativePlatform() && (
                                <span data-testid="web-timer-caveat" className="mt-1 text-xs text-amber-400/90">{t.notifWebCaveat}</span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={async () => {
                                await requestTimerNotificationPermission();
                                if (typeof Notification !== 'undefined') {
                                    setNotificationPerm(Notification.permission);
                                }
                            }}
                            className={`min-h-[44px] px-3 text-xs rounded-xl font-bold transition-all shrink-0 ${
                                notificationPerm === 'granted'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : notificationPerm === 'denied'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-primary-500 text-zinc-950 hover:bg-primary-400'
                            }`}
                        >
                            {notificationPerm === 'granted'
                                ? ty.notifEnabled
                                : notificationPerm === 'denied'
                                ? ty.notifDenied
                                : ty.notifAllow}
                        </button>
                    </div>
                )}
                <ExactAlarmRow lang={lang} />
                {isNativeAndroid && (
                    <ReminderSettingsRow lang={lang} config={reminderConfig} onChange={handleReminderChange} />
                )}
            </div>

            {showPaywall && (
                <Suspense fallback={null}>
                    <PaywallModal onClose={() => setShowPaywall(false)} feature={featureAttempted} />
                </Suspense>
            )}

            <Sheet
                open={showSaveTemplate}
                onOpenChange={setShowSaveTemplate}
                title={ty.saveTemplateTitle}
                accent="primary"
                footer={<Button fullWidth onClick={savePersonalTemplate} disabled={!templateName.trim()}>{ty.saveTemplateBtn}</Button>}
            >
                <div className="p-5 space-y-3">
                    <p className="text-sm text-muted">
                        {ty.saveTemplateDesc}
                    </p>
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted">{ty.templateName}</label>
                        <input
                            autoFocus
                            value={templateName}
                            onChange={event => setTemplateName(event.target.value)}
                            maxLength={80}
                            className="gl-input font-bold"
                            placeholder={ty.templateNamePlaceholder}
                        />
                    </div>
                </div>
            </Sheet>

            {showTemplateManager && (
                <AdminTemplateManager onClose={() => setShowTemplateManager(false)} />
            )}
        </div>
    );
};
