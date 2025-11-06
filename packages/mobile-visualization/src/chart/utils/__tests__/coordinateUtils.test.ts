import {
  areCoordinateArraysValid,
  findClosestXIndex,
  findClosestXIndexBinary,
  getAllSeriesCoordinatesAtIndex,
  getDataY,
  getScreenX,
  getScreenY,
  getSeriesCoordinateAtIndex,
} from '../coordinateUtils';

describe('coordinateUtils', () => {
  const mockXOutputs = [10, 20, 30, 40, 50]; // Screen X positions
  const mockSeriesCoordinates = {
    series1: {
      yInputs: [
        [0, 100],
        [0, 200],
        [0, 150],
        null,
        [0, 300],
      ] as Array<[number, number] | null>,
      yOutputs: [90, 80, 85, 0, 70], // Screen Y positions (inverted)
    },
    series2: {
      yInputs: [
        [0, 50],
        [0, 75],
        [0, 100],
        [0, 125],
        [0, 150],
      ] as Array<[number, number] | null>,
      yOutputs: [95, 92, 90, 87, 85],
    },
  };

  describe('findClosestXIndex', () => {
    it('should find the closest index for exact matches', () => {
      expect(findClosestXIndex(mockXOutputs, 30)).toBe(2);
      expect(findClosestXIndex(mockXOutputs, 10)).toBe(0);
      expect(findClosestXIndex(mockXOutputs, 50)).toBe(4);
    });

    it('should find the closest index for approximate matches', () => {
      expect(findClosestXIndex(mockXOutputs, 25)).toBe(2); // Closer to 30 than 20
      expect(findClosestXIndex(mockXOutputs, 15)).toBe(1); // Closer to 20 than 10
      expect(findClosestXIndex(mockXOutputs, 45)).toBe(4); // Closer to 50 than 40
    });

    it('should handle empty arrays', () => {
      expect(findClosestXIndex([], 25)).toBe(-1);
    });

    it('should handle out-of-bounds values', () => {
      expect(findClosestXIndex(mockXOutputs, 0)).toBe(0); // Before first
      expect(findClosestXIndex(mockXOutputs, 100)).toBe(4); // After last
    });
  });

  describe('findClosestXIndexBinary', () => {
    it('should produce same results as linear search', () => {
      const testValues = [0, 15, 25, 35, 45, 100];
      
      testValues.forEach(value => {
        const linearResult = findClosestXIndex(mockXOutputs, value);
        const binaryResult = findClosestXIndexBinary(mockXOutputs, value);
        expect(binaryResult).toBe(linearResult);
      });
    });

    it('should handle empty arrays', () => {
      expect(findClosestXIndexBinary([], 25)).toBe(-1);
    });
  });

  describe('getScreenX', () => {
    it('should return correct screen X coordinates', () => {
      expect(getScreenX(mockXOutputs, 0)).toBe(10);
      expect(getScreenX(mockXOutputs, 2)).toBe(30);
      expect(getScreenX(mockXOutputs, 4)).toBe(50);
    });

    it('should clamp indices to valid range', () => {
      expect(getScreenX(mockXOutputs, -1)).toBe(10); // Clamped to 0
      expect(getScreenX(mockXOutputs, 10)).toBe(50); // Clamped to last index
    });

    it('should handle empty arrays', () => {
      expect(getScreenX([], 0)).toBe(0);
    });
  });

  describe('getScreenY', () => {
    it('should return correct screen Y coordinates', () => {
      const yOutputs = mockSeriesCoordinates.series1.yOutputs;
      expect(getScreenY(yOutputs, 0)).toBe(90);
      expect(getScreenY(yOutputs, 1)).toBe(80);
      expect(getScreenY(yOutputs, 2)).toBe(85);
    });

    it('should clamp indices to valid range', () => {
      const yOutputs = mockSeriesCoordinates.series1.yOutputs;
      expect(getScreenY(yOutputs, -1)).toBe(90); // Clamped to 0
      expect(getScreenY(yOutputs, 10)).toBe(70); // Clamped to last index
    });
  });

  describe('getDataY', () => {
    it('should return correct data Y values', () => {
      const yInputs = mockSeriesCoordinates.series1.yInputs;
      expect(getDataY(yInputs, 0)).toEqual([0, 100]);
      expect(getDataY(yInputs, 1)).toEqual([0, 200]);
      expect(getDataY(yInputs, 3)).toBeNull(); // null value
    });

    it('should clamp indices to valid range', () => {
      const yInputs = mockSeriesCoordinates.series1.yInputs;
      expect(getDataY(yInputs, -1)).toEqual([0, 100]); // Clamped to 0
      expect(getDataY(yInputs, 10)).toEqual([0, 300]); // Clamped to last index
    });
  });

  describe('getSeriesCoordinateAtIndex', () => {
    it('should return coordinates for existing series', () => {
      const result = getSeriesCoordinateAtIndex(
        mockXOutputs,
        mockSeriesCoordinates,
        'series1',
        1
      );

      expect(result).toEqual({
        seriesId: 'series1',
        screenX: 20,
        screenY: 80,
        dataY: [0, 200],
      });
    });

    it('should return null for non-existent series', () => {
      const result = getSeriesCoordinateAtIndex(
        mockXOutputs,
        mockSeriesCoordinates,
        'nonexistent',
        1
      );

      expect(result).toBeNull();
    });
  });

  describe('getAllSeriesCoordinatesAtIndex', () => {
    it('should return coordinates for all series at index', () => {
      const result = getAllSeriesCoordinatesAtIndex(
        mockXOutputs,
        mockSeriesCoordinates,
        1
      );

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        seriesId: 'series1',
        screenX: 20,
        screenY: 80,
        dataY: [0, 200],
      });
      expect(result).toContainEqual({
        seriesId: 'series2',
        screenX: 20,
        screenY: 92,
        dataY: [0, 75],
      });
    });

    it('should handle empty series coordinates', () => {
      const result = getAllSeriesCoordinatesAtIndex(mockXOutputs, {}, 1);
      expect(result).toHaveLength(0);
    });
  });

  describe('areCoordinateArraysValid', () => {
    it('should return true for valid coordinate arrays', () => {
      const validArrays = {
        xInputs: [0, 1, 2, 3, 4],
        xOutputs: [10, 20, 30, 40, 50],
        seriesCoordinates: mockSeriesCoordinates,
      };

      expect(areCoordinateArraysValid(validArrays)).toBe(true);
    });

    it('should return false for empty arrays', () => {
      const emptyArrays = {
        xInputs: [],
        xOutputs: [],
        seriesCoordinates: {},
      };

      expect(areCoordinateArraysValid(emptyArrays)).toBe(false);
    });

    it('should return false for mismatched array lengths', () => {
      const mismatchedArrays = {
        xInputs: [0, 1, 2],
        xOutputs: [10, 20], // Different length
        seriesCoordinates: mockSeriesCoordinates,
      };

      expect(areCoordinateArraysValid(mismatchedArrays)).toBe(false);
    });
  });
});
