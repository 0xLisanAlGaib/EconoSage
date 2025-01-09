import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { MockedClass } from 'jest-mock';
import { GDPAdapter } from '../src/adapter';
import { FREDClient } from '../src/utils/fred';
import { AdapterRequest } from '../src/types/request';

// Mock the FREDClient
jest.mock('../src/utils/fred');

describe('GDPAdapter', () => {
  let adapter: GDPAdapter;
  const MockedFREDClient = FREDClient as MockedClass<typeof FREDClient>;

  beforeEach(() => {
    // Clear all mocks before each test
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