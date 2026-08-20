import type { ProgramDay, ProgramSlot } from '../../types';
import {
  NH_ROLE_LIBRARY,
  getNhMovementRole,
  type NhMovementRole,
  type NhProgramAudit,
} from './programmingSchool';

export type NhAuditCategoryId = 'coverage' | 'recovery' | 'redundancy' | 'balance';
export type NhAuditCategoryState = 'clear' | 'review' | 'change';

export interface NhAuditCategory {
  id: NhAuditCategoryId;
  state: NhAuditCategoryState;
  title: { en: string; es: string };
  summary: { en: string; es: string };
  findingIds: string[];
}

const categoryConfig: Record<NhAuditCategoryId, Omit<NhAuditCategory, 'state' | 'findingIds'>> = {
  coverage: {
    id: 'coverage',
    title: { en: 'Movement coverage', es: 'Cobertura de funciones' },
    summary: { en: 'Are the movement families you intended to train actually represented?', es: '¿Están representadas las familias de movimiento que pretendés entrenar?' },
  },
  recovery: {
    id: 'recovery',
    title: { en: 'Recovery / distribution', es: 'Recuperación / distribución' },
    summary: { en: 'Does demanding work appear distributed in a way that deserves a recovery check?', es: '¿El trabajo demandante está distribuido de forma que merezca revisar recuperación?' },
  },
  redundancy: {
    id: 'redundancy',
    title: { en: 'Redundancy / interference', es: 'Redundancia / interferencia' },
    summary: { en: 'Are similar roles or competing supersets concentrated without a clear reason?', es: '¿Hay roles similares o superseries competitivas concentradas sin una razón clara?' },
  },
  balance: {
    id: 'balance',
    title: { en: 'Exercise balance', es: 'Balance de ejercicios' },
    summary: { en: 'Does the plan combine broader mass-building work with precise lower-cost work?', es: '¿El plan combina trabajo global con trabajo preciso de menor costo?' },
  },
};

const categoryForFinding = (id: string): NhAuditCategoryId => {
  if (id === 'empty' || id.startsWith('back-missing-')) return 'coverage';
  if (id.startsWith('adjacent-hinges-') || id.startsWith('back-daily-density-') || id.startsWith('arm-volume-') || id === 'shoulder-specialization-volume') return 'recovery';
  if (id.startsWith('redundancy-') || id.startsWith('superset-competition-')) return 'redundancy';
  return 'balance';
};

export function summarizeNhAudit(audit: NhProgramAudit): NhAuditCategory[] {
  const ids: NhAuditCategoryId[] = ['coverage', 'recovery', 'redundancy', 'balance'];
  return ids.map(id => {
    const findings = audit.findings.filter(item => categoryForFinding(item.id) === id);
    const hardChange = findings.some(item => item.severity === 'change' && item.kind !== 'inference');
    const state: NhAuditCategoryState = hardChange ? 'change' : findings.length ? 'review' : 'clear';
    return { ...categoryConfig[id], state, findingIds: findings.map(item => item.id) };
  });
}

export function getNhRoleFromSlot(slot: ProgramSlot): NhMovementRole | null {
  const fromExercise = getNhMovementRole(slot.exerciseId);
  if (fromExercise) return fromExercise;
  const note = String(slot.notes || '');
  const match = note.match(/NH School role:\s*([a-z_]+)/i);
  if (match && NH_ROLE_LIBRARY.some(item => item.id === match[1])) return match[1] as NhMovementRole;
  const label = String(slot.label || '').trim().toLowerCase();
  const byLabel = NH_ROLE_LIBRARY.find(item => item.title.en.toLowerCase() === label || item.title.es.toLowerCase() === label);
  return byLabel?.id || null;
}

export function localizeNhTeachingDraft(program: ProgramDay[], lang: 'en' | 'es'): ProgramDay[] {
  return program.map(day => ({
    ...day,
    slots: (day.slots || []).map(slot => {
      const role = getNhRoleFromSlot(slot);
      const definition = role ? NH_ROLE_LIBRARY.find(item => item.id === role) : null;
      return { ...slot, label: definition ? definition.title[lang] : slot.label };
    }),
  }));
}

export function updateNhDraftSlot(
  program: ProgramDay[],
  dayIndex: number,
  slotIndex: number,
  patch: Partial<ProgramSlot>,
): ProgramDay[] {
  return program.map((day, dIndex) => dIndex !== dayIndex ? day : ({
    ...day,
    slots: (day.slots || []).map((slot, sIndex) => sIndex !== slotIndex ? slot : ({ ...slot, ...patch })),
  }));
}

export function uniqueNhRepRanges(role: NhMovementRole): string[] {
  const definition = NH_ROLE_LIBRARY.find(item => item.id === role);
  const candidates = [definition?.defaultRepRange, '4-8', '6-10', '8-12', '10-15', '12-20'].filter(Boolean) as string[];
  return Array.from(new Set(candidates));
}
