// Stable template/day identity for Strong "Previous set: same template only".
// Pure helpers: no context, no IO. Owners: TemplateIdentityFix.
// A template application freezes (templateId, templateDayKey per day); the
// session copies them at build and the log at completion. Anything without
// them (pre-feature, custom, wizard, KONG, detached, imported) falls back to
// the legacy plan-day pair (mesoId, dayIdx) at read time. Never inferred.
import type { ActiveSession, Log, MesoCycle, ProgramDay } from '../types';

export interface TemplateContext {
    templateId: string;
    templateDayKey: string;
}

/** Structured-program veto (mirrors isTemplateUpdateEligible): Strong scoping never applies to KONG. */
export const isKongTemplateContext = (systemId?: string | null): boolean => {
    const s = String(systemId ?? '').toLowerCase();
    return s === 'kong_4day' || s.startsWith('kong_');
};

const dayNameText = (dayName: unknown): string => {
    if (dayName && typeof dayName === 'object') {
        if ('en' in dayName && typeof dayName.en === 'string' && dayName.en) return dayName.en;
        if ('es' in dayName && typeof dayName.es === 'string' && dayName.es) return dayName.es;
    }
    return typeof dayName === 'string' ? dayName : '';
};

const slugDayName = (dayName: unknown): string =>
    dayNameText(dayName)
        .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'day';

/**
 * Freeze the stable key for one template day. Prefers an explicitly stamped
 * key, then the day id, then a slug+index fallback (always non-empty so a
 * frozen mesocycle never holds a hole).
 */
export const resolveTemplateDayKey = (day: ProgramDay | null | undefined, idx: number): string => {
    const frozen = String(day?.templateDayKey ?? '').trim();
    if (frozen) return frozen.slice(0, 80);
    const id = String(day?.id ?? '').trim();
    if (id) return id.slice(0, 80);
    return `${slugDayName(day?.dayName)}-${idx}`;
};

/** Freeze every day key of a template program at apply time (index = dayIdx). */
export const resolveTemplateDayKeys = (program: ProgramDay[] | null | undefined): (string | null)[] =>
    (Array.isArray(program) ? program : []).map((day, i) => resolveTemplateDayKey(day, i));

/**
 * Identity to stamp on a session/log, or null when Strong scoping must not
 * apply (KONG) or cannot be proven (no templateId: custom, wizard,
 * pre-feature mesocycles). NEVER falls back to mesoType: it also carries
 * program ids ('hyp_1', …) and is not a template identity without evidence.
 */
export const getSessionTemplateContext = (
    activeMeso: MesoCycle | null | undefined,
    dayIdx?: number | null,
    programDay?: ProgramDay | null | undefined,
): TemplateContext | null => {
    if (!activeMeso || dayIdx == null || dayIdx < 0) return null;
    if (isKongTemplateContext(activeMeso.programSystem?.systemId)) return null;
    const templateId = String(activeMeso.templateId ?? '').trim();
    if (!templateId) return null;
    const frozen = Array.isArray(activeMeso.templateDayKeys) ? activeMeso.templateDayKeys[dayIdx] : null;
    const key = String(frozen ?? programDay?.templateDayKey ?? programDay?.id ?? '').trim();
    if (!key) return null;
    return { templateId, templateDayKey: key };
};

/** True when a session/log carries provable template identity. */
export const hasTemplateIdentity = (
    value: Pick<ActiveSession, 'templateId' | 'templateDayKey'> | Pick<Log, 'templateId' | 'templateDayKey'> | null | undefined,
): value is TemplateContext =>
    !!value && typeof value.templateId === 'string' && !!value.templateId
        && typeof value.templateDayKey === 'string' && !!value.templateDayKey;
