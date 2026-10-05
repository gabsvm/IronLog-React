// U5: ProgramHub state, moved verbatim from components/programs/ProgramHub.tsx.
import { pickLang } from '../../../utils/i18n';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Log, MesoCycle } from '../../../types';
import { KONG_4DAY_V1 } from '../../../programs/kong/kong4Day';
import { getProgramBlockForWeek, resolveProgramDay } from '../../../programs/engine/ProgramResolver';
import { calculateProgramMetrics } from '../../../programs/engine/ProgramMetrics';
import { TRANSLATIONS } from '../../../constants';
import { ES_BLOCK_COPY } from './hubData';
import type { HubPanel } from './hubData';

export interface ProgramHubProps {
  meso: MesoCycle;
  logs: Log[];
  onClose: () => void;
  lang: 'en' | 'es';
}

export const useProgramHubState = ({ meso, logs, onClose, lang }: ProgramHubProps) => {
  const [panel, setPanel] = useState<HubPanel>('home');
  const [selectedWeek, setSelectedWeek] = useState(Math.max(1, Math.min(12, meso.week || 1)));
  const [selectedDay, setSelectedDay] = useState(0);
  const [openPrinciple, setOpenPrinciple] = useState<string>('weak-points');
  const onCloseRef = useRef(onClose);
  const handlingPopState = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentState = window.history.state || {};
    window.history.pushState({ ...currentState, kongHub: true, kongPanel: 'home' }, '', '#kong');

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.kongHub) {
        handlingPopState.current = true;
        setPanel(event.state.kongPanel || 'home');
        return;
      }
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (handlingPopState.current) {
      handlingPopState.current = false;
      return;
    }
    const currentState = window.history.state;
    if (!currentState?.kongHub || currentState.kongPanel === panel) return;
    window.history.pushState({ ...currentState, kongPanel: panel }, '', `#kong-${panel}`);
  }, [panel]);

  const { block, blockWeek } = getProgramBlockForWeek(KONG_4DAY_V1, meso.week);
  const scheduleProgress = useMemo(() => {
    const resolved = new Set<string>();
    const completed = new Set<string>();
    logs.forEach((log) => {
      if (log.mesoId !== meso.id || log.week < 1 || log.week > meso.week || log.dayIdx < 0 || log.dayIdx >= KONG_4DAY_V1.daysPerWeek) return;
      const key = `${log.week}:${log.dayIdx}`;
      resolved.add(key);
      if (!log.skipped) completed.add(key);
    });
    return { resolved: resolved.size, completed: completed.size };
  }, [logs, meso.id, meso.week]);
  const metrics = calculateProgramMetrics(logs, meso.id, scheduleProgress.resolved, meso.programSystem?.startedBodyWeight, KONG_4DAY_V1.daysPerWeek);
  const h = TRANSLATIONS[lang].programHub;
  const title = (text: { en: string; es: string }) => text[lang];
  const blockName = (blockNumber: number) =>
    pickLang(lang, { es: ES_BLOCK_COPY[blockNumber]?.name, en: undefined }) || title(KONG_4DAY_V1.blocks[blockNumber - 1].name);
  const blockGoal = (blockNumber: number) =>
    pickLang(lang, { es: ES_BLOCK_COPY[blockNumber]?.goal, en: undefined }) || title(KONG_4DAY_V1.blocks[blockNumber - 1].goal);

  const selectedResolution = getProgramBlockForWeek(KONG_4DAY_V1, selectedWeek);
  const selectedResolvedDay = resolveProgramDay(KONG_4DAY_V1, selectedWeek, selectedDay, meso.programSystem?.substitutions || {});

  const persistentSubstitutions = useMemo(() => {
    const substitutions = meso.programSystem?.substitutions || {};
    const allSlots = KONG_4DAY_V1.blocks.flatMap((candidateBlock) => candidateBlock.days.flatMap((day) => day.exercises));
    return Object.entries(substitutions).map(([slotId, replacementId]) => {
      const slot = allSlots.find((candidate) => candidate.slotId === slotId);
      return {
        slotId,
        source: slot?.sourceExerciseName || slotId,
        replacement: String(replacementId).replaceAll('_', ' '),
      };
    });
  }, [meso.programSystem?.substitutions]);

  const metricCards: Array<{ key: keyof typeof metrics; label: string; value: string }> = [
    { key: 'sessionsCompleted', label: h.metricSessions, value: String(metrics.sessionsCompleted) },
    { key: 'weeksCompleted', label: h.metricWeeks, value: String(metrics.weeksCompleted) },
    { key: 'setsCompleted', label: h.metricSets, value: String(metrics.setsCompleted) },
    { key: 'totalVolume', label: h.metricVolume, value: Math.round(metrics.totalVolume).toLocaleString() },
    { key: 'totalSeconds', label: h.metricTimeMin, value: String(Math.round(metrics.totalSeconds / 60)) },
    { key: 'averageDensity', label: h.metricDensity, value: metrics.averageDensity.toFixed(metrics.averageDensity >= 10 ? 0 : 1) },
    { key: 'adherence', label: h.metricAdherence, value: `${Math.round(metrics.adherence * 100)}%` },
  ];

  const accessItems: Array<{ id: HubPanel; icon: string; label: string; description: string }> = [
    {
      id: 'block',
      icon: 'Layers',
      label: h.accessBlockLabel,
      description: `${h.blockWord} ${block.number} · ${blockName(block.number)}`,
    },
    {
      id: 'principles',
      icon: 'BookOpen',
      label: h.accessPrinciplesLabel,
      description: h.accessPrinciplesDesc,
    },
    {
      id: 'rpe',
      icon: 'Target',
      label: h.accessRpeLabel,
      description: h.accessRpeDesc,
    },
    {
      id: 'substitutions',
      icon: 'Repeat2',
      label: h.accessSubsLabel,
      description: persistentSubstitutions.length > 0
        ? `${persistentSubstitutions.length} ${persistentSubstitutions.length === 1 ? h.subsChangeOne : h.subsChangeMany}`
        : h.accessSubsEmpty,
    },
    {
      id: 'program',
      icon: 'Calendar',
      label: h.accessProgramLabel,
      description: h.accessProgramDesc,
    },
    {
      id: 'progress',
      icon: 'TrendingUp',
      label: h.accessProgressLabel,
      description: h.accessProgressDesc,
    },
  ];

  const goHome = () => {
    if (typeof window !== 'undefined' && window.history.state?.kongHub && panel !== 'home') {
      window.history.back();
      return;
    }
    setPanel('home');
  };

  const closeHub = () => {
    if (typeof window !== 'undefined' && window.history.state?.kongHub) {
      window.history.back();
      return;
    }
    onCloseRef.current();
  };


    return {
        meso,
        logs,
        onClose,
        lang,
        panel,
        setPanel,
        selectedWeek,
        setSelectedWeek,
        selectedDay,
        setSelectedDay,
        openPrinciple,
        setOpenPrinciple,
        onCloseRef,
        handlingPopState,
        block,
        blockWeek,
        scheduleProgress,
        metrics,
        h,
        title,
        blockName,
        blockGoal,
        selectedResolution,
        selectedResolvedDay,
        persistentSubstitutions,
        metricCards,
        accessItems,
        goHome,
        closeHub,
    };
};

export type HubState = ReturnType<typeof useProgramHubState>;
