export const MULTI_STAGE_TEMPLATE_IDS = new Set([
    'tokita',
    'nh_silver_era',
    'nh_baki',
    'nh_toji',
    'nh_kratos',
    'nh_ult_beginner',
    'nh_ult_novice',
    'nh_ult_bridge',
    'nh_ult_intermediate',
    'nh_ult_advanced',
]);

export const needsTemplateMetadataOnHome = (
    meso: { mesoType?: string; stageId?: string } | null | undefined,
): boolean => {
    if (!meso) return false;
    if (meso.stageId) return true;
    const id = meso.mesoType || '';
    return MULTI_STAGE_TEMPLATE_IDS.has(id) || id === 'full_body' || id.startsWith('rp_');
};
