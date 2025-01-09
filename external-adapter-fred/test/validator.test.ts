import { Validator } from '../src/utils/validator';
import { AdapterRequest } from '../src/types/request';

describe('Validator', () => {
  describe('validateRequiredParam', () => {
    it('should return param value when present', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: 'test'
        }
      };
      const validator = new Validator(request);
      expect(validator.validateRequiredParam('series_id')).toBe('test');
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
      expect(validator.validateOptionalParam('observation_start')).toBeUndefined();
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(Validator.isValidDate('2023-01-01')).toBe(true);
      expect(Validator.isValidDate('2023-12-31')).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(Validator.isValidDate('2023-13-01')).toBe(false);
      expect(Validator.isValidDate('2023-00-01')).toBe(false);
      expect(Validator.isValidDate('2023-01-32')).toBe(false);
      expect(Validator.isValidDate('invalid')).toBe(false);
    });

    it('should handle leap year dates', () => {
      expect(Validator.isValidDate('2024-02-29')).toBe(true); // Leap year
      expect(Validator.isValidDate('2023-02-29')).toBe(false); // Not a leap year
      expect(Validator.isValidDate('2024-02-30')).toBe(false); // Invalid even in leap year
    });
  });

  describe('isValidUnit', () => {
    it('should return true for valid units', () => {
      expect(Validator.isValidUnit('lin')).toBe(true);
      expect(Validator.isValidUnit('chg')).toBe(true);
      expect(Validator.isValidUnit('ch1')).toBe(true);
      expect(Validator.isValidUnit('pch')).toBe(true);
      expect(Validator.isValidUnit('pc1')).toBe(true);
      expect(Validator.isValidUnit('pca')).toBe(true);
      expect(Validator.isValidUnit('cch')).toBe(true);
      expect(Validator.isValidUnit('cca')).toBe(true);
      expect(Validator.isValidUnit('log')).toBe(true);
    });

    it('should return false for invalid units', () => {
      expect(Validator.isValidUnit('invalid')).toBe(false);
      expect(Validator.isValidUnit('')).toBe(false);
      expect(Validator.isValidUnit('123')).toBe(false);
    });

    it('should handle case and whitespace', () => {
      expect(Validator.isValidUnit('LIN')).toBe(true);
      expect(Validator.isValidUnit(' pch ')).toBe(true);
      expect(Validator.isValidUnit('PC1')).toBe(true);
    });
  });

  describe('isValidFrequency', () => {
    it('should return true for valid frequencies', () => {
      expect(Validator.isValidFrequency('d')).toBe(true);
      expect(Validator.isValidFrequency('w')).toBe(true);
      expect(Validator.isValidFrequency('bw')).toBe(true);
      expect(Validator.isValidFrequency('m')).toBe(true);
      expect(Validator.isValidFrequency('q')).toBe(true);
      expect(Validator.isValidFrequency('sa')).toBe(true);
      expect(Validator.isValidFrequency('a')).toBe(true);
    });

    it('should return false for invalid frequencies', () => {
      expect(Validator.isValidFrequency('invalid')).toBe(false);
      expect(Validator.isValidFrequency('')).toBe(false);
      expect(Validator.isValidFrequency('123')).toBe(false);
    });

    it('should handle case and whitespace', () => {
      expect(Validator.isValidFrequency('Q')).toBe(true);
      expect(Validator.isValidFrequency(' m ')).toBe(true);
      expect(Validator.isValidFrequency('BW')).toBe(true);
    });
  });

  describe('validateTimestamp', () => {
    it('should not throw for valid timestamps', () => {
      expect(() => Validator.validateTimestamp(Date.now())).not.toThrow();
      expect(() => Validator.validateTimestamp(1609459200000)).not.toThrow(); // 2021-01-01
    });

    it('should throw for invalid timestamps', () => {
      expect(() => Validator.validateTimestamp(-1)).toThrow('Invalid timestamp');
      expect(() => Validator.validateTimestamp(NaN)).toThrow('Invalid timestamp');
    });

    it('should handle boundary timestamps', () => {
      const maxDate = new Date(8640000000000000); // Maximum date
      expect(() => Validator.validateTimestamp(maxDate.getTime())).not.toThrow();
    });

    it('should throw for zero timestamp', () => {
      expect(() => Validator.validateTimestamp(0)).toThrow('Invalid timestamp');
    });
  });

  describe('validateValue', () => {
    it('should return number for valid string values', () => {
      expect(Validator.validateValue('123.45')).toBe(123.45);
      expect(Validator.validateValue('-123.45')).toBe(-123.45);
      expect(Validator.validateValue('0')).toBe(0);
    });

    it('should throw for invalid values', () => {
      expect(() => Validator.validateValue('invalid')).toThrow('Invalid value');
      expect(() => Validator.validateValue('')).toThrow('Invalid value');
      expect(() => Validator.validateValue('abc123')).toThrow('Invalid value');
    });

    it('should handle scientific notation', () => {
      expect(Validator.validateValue('1.23e-4')).toBe(0.000123);
      expect(Validator.validateValue('1.23E4')).toBe(12300);
    });
  });
}); 