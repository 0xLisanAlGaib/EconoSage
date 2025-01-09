import { describe, it, expect } from '@jest/globals';
import { GDPAdapter } from '../src/adapter';
import { FREDClient } from '../src/utils/fred';
import { AdapterResponse } from '../src/types/response';
import { AdapterRequest } from '../src/types/request';

jest.mock('../src/utils/fred');
const MockedFREDClient = FREDClient as jest.MockedClass<typeof FREDClient>;

describe('GDPAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if series_id is missing', async () => {
    const adapter = new GDPAdapter();
    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: ''  // Empty string to test missing value
      }
    };

    const response = await adapter.execute(request);
    expect(response.jobRunID).toBe('1');
    expect(response.statusCode).toBe(500);
    expect(response.status).toBe('errored');
    expect(response.error).toBe('series_id is required');
  });

  it('should handle successful GDP data fetch', async () => {
    const mockResponse = {
      observations: [
        {
          date: '2023-12-01',
          value: '2.5'
        }
      ]
    };

    MockedFREDClient.prototype.getGDPData.mockResolvedValueOnce(mockResponse);

    const adapter = new GDPAdapter();
    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: 'GDP'
      }
    };

    const response = await adapter.execute(request);

    // Verify the response structure
    expect(response).toEqual({
      jobRunID: '1',
      result: {
        value: 2.5,
        timestamp: new Date('2023-12-01').getTime(),
        series_id: 'GDP',
        units: 'Percent Change',
      },
      statusCode: 200,
      status: 'success',
      data: mockResponse,
    });
  });

  it('should handle request with all optional parameters', async () => {
    const mockResponse = {
      observations: [
        {
          date: '2023-12-01',
          value: '2.5'
        }
      ]
    };

    MockedFREDClient.prototype.getGDPData.mockResolvedValueOnce(mockResponse);

    const adapter = new GDPAdapter();
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

    const response = await adapter.execute(request);
    expect(response.statusCode).toBe(200);
    expect(response.status).toBe('success');
    expect(response.result).toBeDefined();
  });

  it('should return latest observation when multiple are present', async () => {
    const mockResponse = {
      observations: [
        {
          date: '2023-11-01',
          value: '2.0'
        },
        {
          date: '2023-12-01',
          value: '2.5'
        }
      ]
    };

    MockedFREDClient.prototype.getGDPData.mockResolvedValueOnce(mockResponse);

    const adapter = new GDPAdapter();
    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: 'GDP'
      }
    };

    const response = await adapter.execute(request);
    expect(response.statusCode).toBe(200);
    expect(response.status).toBe('success');
    expect(response.result?.value).toBe(2.5);
  });

  it('should handle empty observations', async () => {
    const mockResponse = {
      observations: []
    };

    MockedFREDClient.prototype.getGDPData.mockResolvedValueOnce(mockResponse);

    const adapter = new GDPAdapter();
    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: 'GDP'
      }
    };

    const response = await adapter.execute(request);
    expect(response.statusCode).toBe(500);
    expect(response.status).toBe('errored');
    expect(response.error).toBe('No observations found');
  });

  it('should handle invalid value from FRED', async () => {
    const mockResponse = {
      observations: [
        {
          date: '2023-12-01',
          value: 'invalid'
        }
      ]
    };

    MockedFREDClient.prototype.getGDPData.mockResolvedValueOnce(mockResponse);

    const adapter = new GDPAdapter();
    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: 'GDP'
      }
    };

    const response = await adapter.execute(request);
    expect(response.statusCode).toBe(500);
    expect(response.status).toBe('errored');
    expect(response.error).toBe('Invalid value');
  });

  it('should handle invalid date from FRED', async () => {
    const mockResponse = {
      observations: [
        {
          date: 'invalid',
          value: '2.5'
        }
      ]
    };

    MockedFREDClient.prototype.getGDPData.mockResolvedValueOnce(mockResponse);

    const adapter = new GDPAdapter();
    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: 'GDP'
      }
    };

    const response = await adapter.execute(request);
    expect(response.statusCode).toBe(500);
    expect(response.status).toBe('errored');
    expect(response.error).toBe('Invalid timestamp');
  });

  it('should handle malformed FRED response', async () => {
    const mockResponse = {
      // Missing observations array
    };

    MockedFREDClient.prototype.getGDPData.mockResolvedValueOnce(mockResponse as any);

    const adapter = new GDPAdapter();
    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: 'GDP'
      }
    };

    const response = await adapter.execute(request);
    expect(response.statusCode).toBe(500);
    expect(response.status).toBe('errored');
    expect(response.error).toBe('No observations found');
  });

  it('should handle FRED API errors', async () => {
    MockedFREDClient.prototype.getGDPData.mockRejectedValueOnce(new Error('FRED API Error: Rate limit exceeded'));

    const adapter = new GDPAdapter();
    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: 'GDP'
      }
    };

    const response = await adapter.execute(request);
    expect(response.statusCode).toBe(500);
    expect(response.status).toBe('errored');
    expect(response.error).toBe('FRED API Error: Rate limit exceeded');
  });
}); 