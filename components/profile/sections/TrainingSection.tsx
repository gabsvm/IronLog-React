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
            <div className="card-reference divide-y divide-border-subtle overflow-hidden">
                {activeMeso && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-elevated/40 transition-colors"
                    >
                        <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                            <Icon name="Calendar" size={17} />
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{activeMeso.name}</div>
                            <div className="text-xs text-muted">
                                {ty.mesoWeek.replace('{week}', String(activeMeso.week)).replace('{target}', String(activeMeso.targetWeeks || activeMeso.duration))}
                            </div>
                        </div>
                        <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={openProgramGated}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-elevated/40 transition-colors"
                >
                    <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                        <Icon name="Layout" size={17} />
                    </span>
                    <div className="flex-1 text-sm font-medium text-white">{t.programEditor}</div>
                    {!isPro
                        ? <Icon name="Lock" size={16} className="text-yellow-500 shrink-0" />
                        : <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />}
                </button>
                <button
                    type="button"
                    onClick={openExercisesGated}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-elevated/40 transition-colors"
                >
                    <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                        <Icon name="Dumbbell" size={17} />
                    </span>
                    <div className="flex-1 text-sm font-medium text-white">{ty.exercisesRow}</div>
                    {!isPro
                        ? <Icon name="Lock" size={16} className="text-yellow-500 shrink-0" />
                        : <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />}
                </button>
                {isAdmin && (
                    <button
                        type="button"
                        onClick={() => setShowTemplateManager(true)}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-elevated/40 transition-colors"
                    >
                        <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                            <Icon name="Copy" size={17} />
                        </span>
                        <div className="flex-1 text-sm font-medium text-white">{t.manageTemplates}</div>
                        <Icon name="ChevronRight" size={16} className="text-muted shrink-0" />
                    </button>
                )}
            </div>

            <button
                type="button"
                onClick={openSaveTemplate}
                disabled={!activeMeso || program.length === 0}
                className="mt-2 w-full p-3.5 bg-zinc-50 dark:bg-white/5 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all border border-zinc-100 dark:border-white/5 hover:border-zinc-300 dark:hover:border-zinc-600 disabled:opacity-45 disabled:active:scale-100"
            >
                <div className="flex items-center gap-3 text-left">
                    <div className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white">
                        <Icon name="Copy" size={18} />
                    </div>
                    <div>
                        <span className="block font-bold text-sm text-zinc-700 dark:text-zinc-200">
                            {ty.saveTemplate}
                        </span>
                        <span className="block text-xs text-muted mt-0.5">
                            {activeMeso && program.length > 0 ? ty.saveTemplatePrivate : ty.saveTemplateEmpty}
                        </span>
                    </div>
                </div>
                <Icon name="ChevronRight" size={16} className="text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white" />
            </button>
            <p className="text-xs text-muted leading-snug px-1 mt-2">
                {ty.twoBlockHint}
            </p>

            <div className="label-reference px-1 mt-4 mb-1.5">{ty.workoutSetup}</div>
            <div className="card-reference divide-y divide-border-subtle overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                    <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                        <Icon name="Gauge" size={17} />
                    </span>
                    <div className="flex-1 text-sm font-medium text-white">{t.showRIR}</div>
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
                    <span className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-primary-400 shrink-0">
                        <Icon name="Smartphone" size={17} />
                    </span>
                    <div className="flex-1 text-sm font-medium text-white">{t.keepScreen}</div>
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
                    <span className="text-sm font-medium text-white">{t.restTimerDisplay}</span>
                    <div className="flex gap-1 bg-zinc-200/50 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-border-subtle shrink-0">
                        <button
                            type="button"
                            onClick={() => setConfig({ ...config, restTimerDisplay: 'compact' })}
                            className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                                (config.restTimerDisplay || 'compact') === 'compact'
                                    ? 'bg-primary-500 text-black shadow-sm'
                                    : 'text-muted hover:text-white'
                            }`}
                        >
                            {t.restTimerCompact}
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfig({ ...config, restTimerDisplay: 'expanded' })}
                            className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                                config.restTimerDisplay === 'expanded'
                                    ? 'bg-primary-500 text-black shadow-sm'
                                    : 'text-muted hover:text-white'
                            }`}
                        >
                            {t.restTimerExpanded}
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                    <span className="text-sm font-medium text-white">{ty.weightUnit}</span>
                    <div className="flex gap-1 bg-zinc-200/50 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-border-subtle shrink-0" role="group" aria-label={ty.weightUnit}>
                        {(['kg', 'lb'] as const).map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setConfig({ ...config, weightUnit: option })}
                                aria-pressed={resolveWeightUnit(config) === option}
                                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                                    resolveWeightUnit(config) === option
                                        ? 'bg-primary-500 text-black shadow-sm'
                                        : 'text-muted hover:text-white'
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
                            <span className="text-sm font-medium text-white">{t.restNotifications}</span>
                            <span className="text-[10px] text-muted">{t.restNotificationsDesc}</span>
                            {/* S4: be honest about web timers (frozen with the screen off). */}
                            {!Capacitor.isNativePlatform() && (
                                <span data-testid="web-timer-caveat" className="mt-1 text-[10px] text-amber-400/90">{t.notifWebCaveat}</span>
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
                            className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all shrink-0 ${
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
                    <p className="text-sm text-zinc-500">
                        {ty.saveTemplateDesc}
                    </p>
                    <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-2">{ty.templateName}</label>
                        <input
                            autoFocus
                            value={templateName}
                            onChange={event => setTemplateName(event.target.value)}
                            maxLength={80}
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 font-bold text-zinc-900 dark:text-white outline-none focus:border-primary-500"
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
