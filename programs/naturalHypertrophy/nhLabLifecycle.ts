import type { GlobalTemplate } from '../../types';

export type NhLabPhase = 'draft' | 'alpha' | 'beta' | 'mature';
export type NhLabChangeReason =
  | 'pain'
  | 'recovery'
  | 'session_length'
  | 'plateau'
  | 'priority'
  | 'logistics'
  | 'technique'
  | 'range'
  | 'volume'
  | 'exercise_fit'
  | 'other';

export interface NhLabChangeEntry {
  id: string;
  at: number;
  phase: NhLabPhase;
  reason: NhLabChangeReason;
  note: string;
}

export interface NhLabMeta {
  version: 1;
  phase: NhLabPhase;
  createdAt: number;
  phaseStartedAt: number;
  sourceTemplateId?: string;
  sourceTemplateName?: string;
  changeLog: NhLabChangeEntry[];
}

export type NhLabTemplate = GlobalTemplate & { nhLab?: NhLabMeta };

const makeEntryId = (at: number) => `nh_change_${at}_${Math.random().toString(36).slice(2, 8)}`;

export function createNhLabMeta(options: {
  now?: number;
  sourceTemplateId?: string;
  sourceTemplateName?: string;
  initialReason?: NhLabChangeReason;
  initialNote?: string;
} = {}): NhLabMeta {
  const now = options.now ?? Date.now();
  const changeLog: NhLabChangeEntry[] = [];
  if (options.initialReason || options.initialNote) {
    changeLog.push({
      id: makeEntryId(now),
      at: now,
      phase: 'draft',
      reason: options.initialReason || 'other',
      note: options.initialNote || 'Created in NH Programming School.',
    });
  }
  return {
    version: 1,
    phase: 'draft',
    createdAt: now,
    phaseStartedAt: now,
    sourceTemplateId: options.sourceTemplateId,
    sourceTemplateName: options.sourceTemplateName,
    changeLog,
  };
}

export function attachNhLabMeta<T extends GlobalTemplate>(template: T, meta?: NhLabMeta): T & { nhLab: NhLabMeta } {
  return { ...template, nhLab: meta || createNhLabMeta() };
}

export function isNhLabTemplate(template: GlobalTemplate): template is NhLabTemplate & { nhLab: NhLabMeta } {
  const meta = (template as NhLabTemplate).nhLab;
  return !!meta && meta.version === 1 && ['draft', 'alpha', 'beta', 'mature'].includes(meta.phase);
}

export function appendNhLabChange(
  template: GlobalTemplate,
  reason: NhLabChangeReason,
  note: string,
  now = Date.now(),
): NhLabTemplate {
  const current = isNhLabTemplate(template) ? template.nhLab : createNhLabMeta({ now });
  const entry: NhLabChangeEntry = {
    id: makeEntryId(now),
    at: now,
    phase: current.phase,
    reason,
    note: note.trim() || 'Programming change recorded.',
  };
  return {
    ...template,
    nhLab: {
      ...current,
      changeLog: [entry, ...current.changeLog],
    },
  };
}

export function transitionNhLabPhase(template: GlobalTemplate, next: NhLabPhase, now = Date.now()): NhLabTemplate {
  const current = isNhLabTemplate(template) ? template.nhLab : createNhLabMeta({ now });
  if (current.phase === next) return { ...template, nhLab: current };
  const order: NhLabPhase[] = ['draft', 'alpha', 'beta', 'mature'];
  const currentIndex = order.indexOf(current.phase);
  const nextIndex = order.indexOf(next);
  if (nextIndex !== currentIndex + 1) return { ...template, nhLab: current };
  const entry: NhLabChangeEntry = {
    id: makeEntryId(now),
    at: now,
    phase: next,
    reason: 'other',
    note: `Lifecycle advanced from ${current.phase.toUpperCase()} to ${next.toUpperCase()}.`,
  };
  return {
    ...template,
    nhLab: {
      ...current,
      phase: next,
      phaseStartedAt: now,
      changeLog: [entry, ...current.changeLog],
    },
  };
}

export function nhLabDaysInPhase(template: GlobalTemplate, now = Date.now()): number {
  if (!isNhLabTemplate(template)) return 0;
  return Math.max(0, Math.floor((now - template.nhLab.phaseStartedAt) / 86_400_000));
}

export function nhLabCanStartAlpha(template: GlobalTemplate): boolean {
  return template.program.length > 0 && template.program.every(day =>
    Array.isArray(day.slots) && day.slots.length > 0 && day.slots.every(slot => !!slot.exerciseId && Number(slot.setTarget) > 0 && !!slot.reps)
  );
}

export function nhLabNextPhase(phase: NhLabPhase): NhLabPhase | null {
  if (phase === 'draft') return 'alpha';
  if (phase === 'alpha') return 'beta';
  if (phase === 'beta') return 'mature';
  return null;
}

export function nhLabPhaseLabel(phase: NhLabPhase, lang: 'en' | 'es'): string {
  const labels: Record<NhLabPhase, { en: string; es: string }> = {
    draft: { en: 'DRAFT', es: 'BORRADOR' },
    alpha: { en: 'ALPHA', es: 'ALPHA' },
    beta: { en: 'BETA', es: 'BETA' },
    mature: { en: 'MATURE', es: 'MADURO' },
  };
  return labels[phase][lang];
}
