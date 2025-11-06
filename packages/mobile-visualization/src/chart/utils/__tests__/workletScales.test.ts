import {
  applyBandScale,
  applyLinearScale,
  applyLogScale,
  applyWorkletScale,
  getScaleBandwidth,
  type WorkletBandScale,
  type WorkletLinearScale,
  type WorkletLogScale,
} from '../workletScales';

describe('workletScales', () => {
  describe('applyLinearScale', () => {
    it('should correctly transform values using linear scale', () => {
      const scale: WorkletLinearScale = {
        type: 'linear',
        domain: [0, 100],
        range: [0, 200],
      };

      expect(applyLinearScale(0, scale)).toBe(0);
      expect(applyLinearScale(50, scale)).toBe(100);
      expect(applyLinearScale(100, scale)).toBe(200);
    });

    it('should handle inverted ranges', () => {
      const scale: WorkletLinearScale = {
        type: 'linear',
        domain: [0, 100],
        range: [200, 0], // Inverted (common for Y-axis)
      };

      expect(applyLinearScale(0, scale)).toBe(200);
      expect(applyLinearScale(50, scale)).toBe(100);
      expect(applyLinearScale(100, scale)).toBe(0);
    });

    it('should handle negative domains', () => {
      const scale: WorkletLinearScale = {
        type: 'linear',
        domain: [-50, 50],
        range: [0, 100],
      };

      expect(applyLinearScale(-50, scale)).toBe(0);
      expect(applyLinearScale(0, scale)).toBe(50);
      expect(applyLinearScale(50, scale)).toBe(100);
    });
  });

  describe('applyLogScale', () => {
    it('should correctly transform values using log scale (base 10)', () => {
      const scale: WorkletLogScale = {
        type: 'log',
        domain: [1, 100],
        range: [0, 200],
        base: 10,
      };

      expect(applyLogScale(1, scale)).toBe(0);
      expect(applyLogScale(10, scale)).toBe(100);
      expect(applyLogScale(100, scale)).toBe(200);
    });

    it('should use base 10 as default', () => {
      const scale: WorkletLogScale = {
        type: 'log',
        domain: [1, 100],
        range: [0, 200],
      };

      expect(applyLogScale(1, scale)).toBe(0);
      expect(applyLogScale(10, scale)).toBe(100);
      expect(applyLogScale(100, scale)).toBe(200);
    });

    it('should handle natural log (base e)', () => {
      const scale: WorkletLogScale = {
        type: 'log',
        domain: [1, Math.E * Math.E],
        range: [0, 200],
        base: Math.E,
      };

      expect(applyLogScale(1, scale)).toBe(0);
      expect(applyLogScale(Math.E, scale)).toBe(100);
      expect(applyLogScale(Math.E * Math.E, scale)).toBe(200);
    });
  });

  describe('applyBandScale', () => {
    it('should correctly position band values', () => {
      const scale: WorkletBandScale = {
        type: 'band',
        domain: ['A', 'B', 'C'],
        range: [0, 300],
        bandwidth: 80, // (300 / 3) - some padding
      };

      expect(applyBandScale('A', scale)).toBe(0);
      expect(applyBandScale('B', scale)).toBe(100);
      expect(applyBandScale('C', scale)).toBe(200);
    });

    it('should handle numeric band domains', () => {
      const scale: WorkletBandScale = {
        type: 'band',
        domain: [0, 1, 2],
        range: [0, 300],
        bandwidth: 80,
      };

      expect(applyBandScale(0, scale)).toBe(0);
      expect(applyBandScale(1, scale)).toBe(100);
      expect(applyBandScale(2, scale)).toBe(200);
    });

    it('should return start position for unknown values', () => {
      const scale: WorkletBandScale = {
        type: 'band',
        domain: ['A', 'B', 'C'],
        range: [0, 300],
        bandwidth: 80,
      };

      expect(applyBandScale('D', scale)).toBe(0);
    });
  });

  describe('applyWorkletScale', () => {
    it('should delegate to correct scale function based on type', () => {
      const linearScale: WorkletLinearScale = {
        type: 'linear',
        domain: [0, 100],
        range: [0, 200],
      };

      const logScale: WorkletLogScale = {
        type: 'log',
        domain: [1, 100],
        range: [0, 200],
      };

      const bandScale: WorkletBandScale = {
        type: 'band',
        domain: ['A', 'B'],
        range: [0, 200],
        bandwidth: 80,
      };

      expect(applyWorkletScale(50, linearScale)).toBe(100);
      expect(applyWorkletScale(10, logScale)).toBe(100);
      expect(applyWorkletScale('B', bandScale)).toBe(100);
    });
  });

  describe('getScaleBandwidth', () => {
    it('should return bandwidth for band scales', () => {
      const bandScale: WorkletBandScale = {
        type: 'band',
        domain: ['A', 'B', 'C'],
        range: [0, 300],
        bandwidth: 80,
      };

      expect(getScaleBandwidth(bandScale)).toBe(80);
    });

    it('should return 0 for non-band scales', () => {
      const linearScale: WorkletLinearScale = {
        type: 'linear',
        domain: [0, 100],
        range: [0, 200],
      };

      const logScale: WorkletLogScale = {
        type: 'log',
        domain: [1, 100],
        range: [0, 200],
      };

      expect(getScaleBandwidth(linearScale)).toBe(0);
      expect(getScaleBandwidth(logScale)).toBe(0);
    });
  });
});
