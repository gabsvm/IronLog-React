import { describe, it, expect } from 'vitest';
import { INITIAL_TEMPLATES } from '../../data/defaultTemplates';
import { needsTemplateMetadataOnHome } from '../../data/templateMetadata';

describe('templateMetadata drift guard', () => {
    it('flags every multi-stage or guideline-bearing template for Home metadata loading', () => {
        for (const tpl of INITIAL_TEMPLATES) {
            const hasMultiStages = (tpl.stages?.length ?? 0) > 1;
            const hasGuidelines = (tpl.guidelineImages?.length ?? 0) > 0 || Boolean(tpl.guideId);
            if (hasMultiStages || hasGuidelines) {
                expect(
                    needsTemplateMetadataOnHome({ mesoType: tpl.id }),
                    `Template "${tpl.id}" has stages/guidelines and must be covered by needsTemplateMetadataOnHome`,
                ).toBe(true);
            }
        }
    });

    it('covers explicit stageId even on custom mesoTypes and skips plain single-stage templates', () => {
        expect(needsTemplateMetadataOnHome({ mesoType: 'custom', stageId: 'stage_1' })).toBe(true);
        expect(needsTemplateMetadataOnHome({ mesoType: 'ji3' })).toBe(false);
        expect(needsTemplateMetadataOnHome(null)).toBe(false);
    });
});
