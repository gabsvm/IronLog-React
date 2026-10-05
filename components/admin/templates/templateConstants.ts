// U5: moved verbatim from components/admin/AdminTemplateManager.tsx.
import { INITIAL_TEMPLATES } from '../../../data/defaultTemplates';

export const SUPERSET_COLORS = [
    { border: 'border-l-orange-500', bg: 'bg-orange-500/5', text: 'text-orange-500' },
    { border: 'border-l-blue-500', bg: 'bg-blue-500/5', text: 'text-blue-500' },
    { border: 'border-l-purple-500', bg: 'bg-purple-500/5', text: 'text-purple-500' },
    { border: 'border-l-emerald-500', bg: 'bg-emerald-500/5', text: 'text-emerald-500' },
    { border: 'border-l-pink-500', bg: 'bg-pink-500/5', text: 'text-pink-500' },
];

export const HARDCODED_IDS = new Set(INITIAL_TEMPLATES.map(t => t.id));

export type TemplateStatus = 'default' | 'modified' | 'custom';
