import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GDPAdapter } from '../src/adapter';
import { FREDClient } from '../src/utils/fred';
import { AdapterRequest } from '../src/types/request';
import { MockedClass } from 'jest-mock';

// Import FREDResponse type from fred.ts
import type { FREDResponse } from '../src/utils/fred';

jest.mock('../src/utils/fred');

describe('GDPAdapter', () => {
  let adapter: GDPAdapter;
  const MockedFREDClient = FREDClient as MockedClass<typeof FREDClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new GDPAdapter();
  });

  it('should throw error if series_id is missing', async () => {
    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: ''  // Empty string to test missing value
      }
    };

    await expect(adapter.execute(request)).rejects.toThrow('Adapter Error: series_id is required');
  });

  it('should handle successful GDP data fetch', async () => {
    // Mock the FRED API response
    const mockFredResponse = {
      observations: [
        {
          date: '2023-12-01',
          value: '2.5'
        }
      ]
    };

    // Setup the mock implementation
    MockedFREDClient.prototype.getGDPData.mockResolvedValueOnce(mockFredResponse);

    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: 'GDP',
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
        units: 'Percent Change'
      },
      statusCode: 200,
      data: mockFredResponse
    });

    // Verify FRED client was called with correct parameters
    expect(MockedFREDClient.prototype.getGDPData).toHaveBeenCalledWith({
      series_id: 'GDP',
      observation_start: undefined,
      observation_end: undefined,
      units: undefined,
      frequency: undefined
    });
  });

  it('should handle request with all optional parameters', async () => {
    const mockFredResponse = {
      observations: [
        {
          date: '2023-12-01',
          value: '2.5'
        }
      ]
    };

    MockedFREDClient.prototype.getGDPData.mockResolvedValueOnce(mockFredResponse);

    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: 'GDP',
        observation_start: '2023-01-01',
        observation_end: '2023-12-31',
        units: 'lin',
        frequency: 'm'
      }
    };

    await adapter.execute(request);

    expect(MockedFREDClient.prototype.getGDPData).toHaveBeenCalledWith({
      series_id: 'GDP',
      observation_start: '2023-01-01',
      observation_end: '2023-12-31',
      units: 'lin',
      frequency: 'm'
    });
  });

  it('should return latest observation when multiple are present', async () => {
    const mockFredResponse = {
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

    MockedFREDClient.prototype.getGDPData.mockResolvedValueOnce(mockFredResponse);

    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: 'GDP'
      }
    };

    const response = await adapter.execute(request);
    if (!response.result) {
      throw new Error('Response is missing result');
    }
    expect(response.result.value).toBe(2.5);
    expect(response.result.timestamp).toBe(new Date('2023-12-01').getTime());
  });

  it('should handle empty observations', async () => {
    MockedFREDClient.prototype.getGDPData.mockResolvedValueOnce({
      observations: []
    });

    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: 'GDP'
      }
    };

    await expect(adapter.execute(request)).rejects.toThrow('Adapter Error: No observations found');
  });

  it('should handle invalid value from FRED', async () => {
    MockedFREDClient.prototype.getGDPData.mockResolvedValueOnce({
      observations: [
        {
          date: '2023-12-01',
          value: 'invalid'
        }
      ]
    });

    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: 'GDP'
      }
    };

    await expect(adapter.execute(request)).rejects.toThrow('Adapter Error: Invalid value');
  });

  it('should handle invalid date from FRED', async () => {
    MockedFREDClient.prototype.getGDPData.mockResolvedValueOnce({
      observations: [
        {
          date: 'invalid-date',
          value: '2.5'
        }
      ]
    });

    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: 'GDP'
      }
    };

    await expect(adapter.execute(request)).rejects.toThrow('Adapter Error: Invalid timestamp');
  });

  it('should handle malformed FRED response', async () => {
    MockedFREDClient.prototype.getGDPData.mockResolvedValueOnce({
      observations: []
    } as FREDResponse);

    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: 'GDP'
      }
    };

    await expect(adapter.execute(request)).rejects.toThrow('Adapter Error: No observations found');
  });

  it('should handle FRED API errors', async () => {
    MockedFREDClient.prototype.getGDPData.mockRejectedValueOnce(
      new Error('FRED API Error: Rate limit exceeded')
    );

    const request: AdapterRequest = {
      id: '1',
      data: {
        series_id: 'GDP'
      }
    };

    await expect(adapter.execute(request)).rejects.toThrow('Adapter Error: FRED API Error: Rate limit exceeded');
  });
}); 