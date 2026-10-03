import { describe, it, expect } from 'vitest';
import { getVolumeZone } from '../../views/StatsViewImpl';

describe('M2: volume zones keep integer thresholds with decimal averages', () => {
    it('stays MV below 6', () => {
        expect(getVolumeZone(5.9).label).toBe('MV');
        expect(getVolumeZone(0.1).label).toBe('MV');
    });

    it('switches to MEV at exactly 6', () => {
        expect(getVolumeZone(6).label).toBe('MEV');
        expect(getVolumeZone(11.9).label).toBe('MEV');
    });

    it('switches to MAV at 12 and MRV above 22', () => {
        expect(getVolumeZone(12).label).toBe('MAV');
        expect(getVolumeZone(22).label).toBe('MAV');
        expect(getVolumeZone(22.1).label).toBe('MRV');
    });
});
