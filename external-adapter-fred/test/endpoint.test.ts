import { jest, describe, it, expect } from '@jest/globals';
import { Endpoint } from '../src/endpoint';
import { AdapterRequest } from '../src/types/request';

describe('Endpoint', () => {
  describe('validateRequest', () => {
    it('should validate request with required parameters', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: 'GDP'
        }
      };

      const params = Endpoint.validateRequest(request);
      expect(params).toEqual({
        series_id: 'GDP',
        observation_start: undefined,
        observation_end: undefined,
        units: undefined,
        frequency: undefined
      });
    });

    it('should validate request with all parameters', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: 'GDP',
          observation_start: '2023-01-01',
          observation_end: '2023-12-31',
          units: 'pc1',
          frequency: 'q'
        }
      };

      const params = Endpoint.validateRequest(request);
      expect(params).toEqual({
        series_id: 'GDP',
        observation_start: '2023-01-01',
        observation_end: '2023-12-31',
        units: 'pc1',
        frequency: 'q'
      });
    });

    it('should throw error for missing series_id', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: ''
        }
      };

      expect(() => Endpoint.validateRequest(request)).toThrow('series_id is required');
    });

    it('should throw error for invalid date format', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: 'GDP',
          observation_start: 'invalid-date'
        }
      };

      expect(() => Endpoint.validateRequest(request)).toThrow('Invalid observation_start format');
    });

    it('should throw error for invalid unit', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: 'GDP',
          units: 'invalid'
        }
      };

      expect(() => Endpoint.validateRequest(request)).toThrow('Invalid units format');
    });

    it('should throw error for invalid frequency', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: 'GDP',
          frequency: 'invalid'
        }
      };

      expect(() => Endpoint.validateRequest(request)).toThrow('Invalid frequency format');
    });

    it('should throw error when end date is before start date', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: 'GDP',
          observation_start: '2023-12-31',
          observation_end: '2023-01-01'
        }
      };

      expect(() => Endpoint.validateRequest(request)).toThrow('End date must be after start date');
    });

    it('should handle boundary dates', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: 'GDP',
          observation_start: '1900-01-01',
          observation_end: '2100-12-31'
        }
      };

      const params = Endpoint.validateRequest(request);
      expect(params.observation_start).toBe('1900-01-01');
      expect(params.observation_end).toBe('2100-12-31');
    });

    it('should handle mixed valid and invalid parameters', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: 'GDP',
          observation_start: '2023-01-01',  // valid
          observation_end: 'invalid-date',  // invalid
          units: 'pc1',                    // valid
          frequency: 'invalid'             // invalid
        }
      };

      expect(() => Endpoint.validateRequest(request)).toThrow('Invalid observation_end format');
    });

    it('should handle special characters in series_id', () => {
      const request: AdapterRequest = {
        id: '1',
        data: {
          series_id: 'GDP-TEST_123'
        }
      };

      const params = Endpoint.validateRequest(request);
      expect(params.series_id).toBe('GDP-TEST_123');
    });
  });

  describe('getQueryParams', () => {
    it('should return query params with defaults', () => {
      const params = {
        series_id: 'GDP'
      };

      const queryParams = Endpoint.getQueryParams(params);
      expect(queryParams).toEqual({
        series_id: 'GDP',
        observation_start: undefined,
        observation_end: undefined,
        units: 'pc1',
        frequency: 'q',
        file_type: 'json'
      });
    });

    it('should return query params with custom values', () => {
      const params = {
        series_id: 'GDP',
        observation_start: '2023-01-01',
        observation_end: '2023-12-31',
        units: 'lin',
        frequency: 'm'
      };

      const queryParams = Endpoint.getQueryParams(params);
      expect(queryParams).toEqual({
        series_id: 'GDP',
        observation_start: '2023-01-01',
        observation_end: '2023-12-31',
        units: 'lin',
        frequency: 'm',
        file_type: 'json'
      });
    });

    it('should handle undefined optional parameters', () => {
      const params = {
        series_id: 'GDP',
        observation_start: undefined,
        observation_end: undefined,
        units: undefined,
        frequency: undefined
      };

      const queryParams = Endpoint.getQueryParams(params);
      expect(queryParams).toEqual({
        series_id: 'GDP',
        observation_start: undefined,
        observation_end: undefined,
        units: 'pc1',
        frequency: 'q',
        file_type: 'json'
      });
    });

    it('should handle empty string parameters', () => {
      const params = {
        series_id: 'GDP',
        observation_start: '',
        observation_end: '',
        units: '',
        frequency: ''
      };

      const queryParams = Endpoint.getQueryParams(params);
      expect(queryParams).toEqual({
        series_id: 'GDP',
        observation_start: '',
        observation_end: '',
        units: 'pc1',  // default when empty
        frequency: 'q',  // default when empty
        file_type: 'json'
      });
    });
  });
}); 