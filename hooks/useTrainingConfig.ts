import { useCallback, useMemo } from 'react';
import { useAppConfig } from '../context/AppContext';
import type { TrainingConfigFields } from '../types';
import { sanitizeTrainingConfig } from '../utils/strongTraining';

/**
 * Live binding over the real AppState['config'] slice (atoms live in
 * AppProvider under TRAINING_CONFIG_KEYS, so values written by the old
 * per-field atoms are picked up verbatim). Same tuple contract as before:
 * sanitized fields + patch merged through AppConfig.setConfig. Reactive:
 * any config change re-renders consumers. Requires an AppProvider ancestor
 * (useAppConfig throws otherwise) — no silent fallback, no parallel store.
 */
export const useTrainingConfig = (): [TrainingConfigFields, (patch: Partial<TrainingConfigFields>) => void] => {
    const { config, setConfig } = useAppConfig();

    const fields = useMemo<TrainingConfigFields>(
        () => sanitizeTrainingConfig(config),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sanitized snapshot of the whole config slice; recompute when any field changes.
        [config.previousScope, config.incompleteSets, config.defaultSets, config.defaultRestSeconds, config.warmupRestSeconds, config.restIncrementSeconds, config.restSound, config.restVibrate, config.autoStartRest, config.bodyWeightUnit, config.distanceUnit, config.sizeUnit, config.weekStart, config.oneRmFormula, config.plateBarKg, config.platePlatesKg],
    );

    const patch = useCallback((p: Partial<TrainingConfigFields>) => {
        setConfig(sanitizeTrainingConfig({ ...fields, ...p }));
    }, [fields, setConfig]);

    return [fields, patch];
};
