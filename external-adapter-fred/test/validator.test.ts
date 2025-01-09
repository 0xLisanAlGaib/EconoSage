import { jest, describe, it, expect } from '@jest/globals';
import { Validator } from '../src/utils/validator';
import { AdapterRequest } from '../src/types/request';

describe('Validator', () => {
  describe('validateRequiredParam', () => {
    it('should return param value when present', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: 'GDP'
        }
      };
      const validator = new Validator(request);
      expect(validator.validateRequiredParam('series_id')).toBe('GDP');
    });

    it('should throw error when required param is missing', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: ''
        }
      };
      const validator = new Validator(request);
      expect(() => validator.validateRequiredParam('series_id')).toThrow('series_id is required');
    });
  });

  describe('validateOptionalParam', () => {
    it('should return undefined when param is not present', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: 'GDP'
        }
      };
      const validator = new Validator(request);
      expect(validator.validateOptionalParam('observation_start')).toBeUndefined();
    });

    it('should validate param when validator function is provided', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: 'GDP',
          observation_start: '2023-01-01'
        }
      };
      const validator = new Validator(request);
      expect(validator.validateOptionalParam('observation_start', Validator.isValidDate)).toBe('2023-01-01');
    });

    it('should throw error when validation fails', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: 'GDP',
          observation_start: 'invalid-date'
        }
      };
      const validator = new Validator(request);
      expect(() => validator.validateOptionalParam('observation_start', Validator.isValidDate))
        .toThrow('Invalid observation_start format');
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(Validator.isValidDate('2023-01-01')).toBe(true);
      expect(Validator.isValidDate('2023-12-31T23:59:59Z')).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(Validator.isValidDate('invalid')).toBe(false);
      expect(Validator.isValidDate('2023-13-01')).toBe(false);
    });
  });

  describe('isValidUnit', () => {
    it('should return true for valid units', () => {
      expect(Validator.isValidUnit('pc1')).toBe(true);
      expect(Validator.isValidUnit('lin')).toBe(true);
    });

    it('should return false for invalid units', () => {
      expect(Validator.isValidUnit('invalid')).toBe(false);
      expect(Validator.isValidUnit('')).toBe(false);
    });
  });

  describe('isValidFrequency', () => {
    it('should return true for valid frequencies', () => {
      expect(Validator.isValidFrequency('q')).toBe(true);
      expect(Validator.isValidFrequency('m')).toBe(true);
    });

    it('should return false for invalid frequencies', () => {
      expect(Validator.isValidFrequency('invalid')).toBe(false);
      expect(Validator.isValidFrequency('')).toBe(false);
    });
  });

  describe('validateTimestamp', () => {
    it('should not throw for valid timestamps', () => {
      expect(() => Validator.validateTimestamp(1672531200000)).not.toThrow();
    });

    it('should throw for invalid timestamps', () => {
      expect(() => Validator.validateTimestamp(NaN)).toThrow('Invalid timestamp');
      expect(() => Validator.validateTimestamp(-1)).toThrow('Invalid timestamp');
    });
  });

  describe('validateValue', () => {
    it('should not throw for valid numbers', () => {
      expect(() => Validator.validateValue(2.5)).not.toThrow();
      expect(() => Validator.validateValue(-1.5)).not.toThrow();
    });

    it('should throw for invalid numbers', () => {
      expect(() => Validator.validateValue(NaN)).toThrow('Invalid value');
    });
  });
}); 