import { describe, it, expect } from '@jest/globals';
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

    it('should throw error when required param is whitespace', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: '   '
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

    it('should handle empty string as undefined', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: 'GDP',
          observation_start: ''
        }
      };
      const validator = new Validator(request);
      expect(validator.validateOptionalParam('observation_start', Validator.isValidDate)).toBeUndefined();
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
      expect(Validator.isValidDate('')).toBe(false);
    });

    it('should handle leap year dates', () => {
      expect(Validator.isValidDate('2024-02-29')).toBe(true);
      expect(Validator.isValidDate('2023-02-29')).toBe(false);
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

    it('should handle case and whitespace', () => {
      expect(Validator.isValidUnit('PC1')).toBe(true);
      expect(Validator.isValidUnit(' pc1')).toBe(true);
      expect(Validator.isValidUnit('pc1 ')).toBe(true);
      expect(Validator.isValidUnit(' ')).toBe(false);
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

    it('should handle case and whitespace', () => {
      expect(Validator.isValidFrequency('Q')).toBe(true);
      expect(Validator.isValidFrequency(' q')).toBe(true);
      expect(Validator.isValidFrequency('q ')).toBe(true);
      expect(Validator.isValidFrequency(' ')).toBe(false);
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

    it('should handle boundary timestamps', () => {
      // Test minimum acceptable date (Unix epoch)
      expect(() => Validator.validateTimestamp(new Date('1970-01-01').getTime())).not.toThrow();
      // Test maximum acceptable date
      expect(() => Validator.validateTimestamp(new Date('2100-12-31').getTime())).not.toThrow();
    });

    it('should throw for zero timestamp', () => {
      expect(() => Validator.validateTimestamp(0)).toThrow('Invalid timestamp');
    });
  });

  describe('validateValue', () => {
    it('should return number for valid string values', () => {
      expect(Validator.validateValue('2.5')).toBe(2.5);
      expect(Validator.validateValue('-1.5')).toBe(-1.5);
      expect(Validator.validateValue('0')).toBe(0);
    });

    it('should throw for invalid values', () => {
      expect(() => Validator.validateValue('invalid')).toThrow('Invalid value');
      expect(() => Validator.validateValue('')).toThrow('Invalid value');
    });

    it('should handle scientific notation', () => {
      expect(Validator.validateValue('1e-10')).toBe(1e-10);
      expect(Validator.validateValue('1.23e+3')).toBe(1230);
    });
  });
}); 