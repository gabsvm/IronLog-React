import { GlobalTemplate } from '../types';
import {
    NH_ULT_BEGINNER,
    NH_ULT_NOVICE,
    NH_ULT_BRIDGE,
    NH_ULT_INTERMEDIATE,
    NH_ULT_ADVANCED,
    NH_ULTIMATE_STAGES,
    NH_ULTIMATE_TEMPLATES,
} from './nh/ultimateSeries';
import {
    NH_BAKI_PROG_1,
    NH_BAKI,
    NH_BAKI_PROG_2_2,
    NH_TOJI_STAGE_1,
    NH_TOJI_STAGE_2,
    NH_TOJI,
    NH_KRATOS_STAGE_1,
    NH_KRATOS_STAGE_2,
    NH_KRATOS,
    NH_DOOM_SLAYER,
    NH_SUPERMAN,
    NH_GUTS,
    NH_ANIME_AND_GAMING_TEMPLATES,
} from './nh/animeAndGaming';
import {
    NH_SILVER_ERA,
    NH_SILVER_ERA_ADVANCED,
    NH_GENTLEMAN_SPLIT,
    NH_APOLLONIAN,
    NH_ALEX_EUBANK,
    NH_BALD_OMNI_HYBRID,
    NH_KINOBODY,
    NH_AESTHETICS_AND_COLLABS_TEMPLATES,
} from './nh/aestheticsAndCollabs';

export {
    NH_ULT_BEGINNER,
    NH_ULT_NOVICE,
    NH_ULT_BRIDGE,
    NH_ULT_INTERMEDIATE,
    NH_ULT_ADVANCED,
    NH_ULTIMATE_STAGES,
    NH_ULTIMATE_TEMPLATES,
    NH_BAKI_PROG_1,
    NH_BAKI,
    NH_BAKI_PROG_2_2,
    NH_TOJI_STAGE_1,
    NH_TOJI_STAGE_2,
    NH_TOJI,
    NH_KRATOS_STAGE_1,
    NH_KRATOS_STAGE_2,
    NH_KRATOS,
    NH_DOOM_SLAYER,
    NH_SUPERMAN,
    NH_GUTS,
    NH_ANIME_AND_GAMING_TEMPLATES,
    NH_SILVER_ERA,
    NH_SILVER_ERA_ADVANCED,
    NH_GENTLEMAN_SPLIT,
    NH_APOLLONIAN,
    NH_ALEX_EUBANK,
    NH_BALD_OMNI_HYBRID,
    NH_KINOBODY,
    NH_AESTHETICS_AND_COLLABS_TEMPLATES,
};

// Preserve the historical template ordering expected across tests and TemplateSelector.
const byId = new Map<string, GlobalTemplate>(
    [...NH_ULTIMATE_TEMPLATES, ...NH_ANIME_AND_GAMING_TEMPLATES, ...NH_AESTHETICS_AND_COLLABS_TEMPLATES].map((tpl) => [tpl.id, tpl]),
);

const ORDERED_NH_IDS = [
    'nh_ult_beginner',
    'nh_ult_novice',
    'nh_ult_bridge',
    'nh_ult_intermediate',
    'nh_ult_advanced',
    'nh_baki',
    'nh_toji',
    'nh_doom_slayer',
    'nh_superman',
    'nh_gentleman_split',
    'nh_silver_era',
    'nh_apollonian',
    'nh_alex_eubank',
    'nh_bald_omni_hybrid',
    'nh_guts',
    'nh_kratos',
    'nh_kinobody',
];

export const NATURAL_HYPERTROPHY_TEMPLATES: GlobalTemplate[] = ORDERED_NH_IDS
    .map((id) => byId.get(id))
    .filter((tpl): tpl is GlobalTemplate => Boolean(tpl));
