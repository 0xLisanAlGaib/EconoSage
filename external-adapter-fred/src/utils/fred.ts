import axios, { AxiosResponse } from 'axios';
import { config } from '../config';

export interface FREDResponse {
  observations: Array<{
    date: string;
    value: string;
  }>;
}

export interface GDPDataParams {
  series_id: string;
  observation_start?: string;
  observation_end?: string;
  units?: string;
  frequency?: string;
}

export class FREDClient {
  private readonly baseURL = 'https://api.stlouisfed.org/fred/series/observations';

  async getGDPData(params: GDPDataParams): Promise<FREDResponse> {
    try {
      const response: AxiosResponse<FREDResponse> = await axios.get(this.baseURL, {
        params: {
          series_id: params.series_id,
          api_key: config.fredApiKey,
          file_type: 'json',
          observation_start: params.observation_start,
          observation_end: params.observation_end,
          units: params.units || 'pc1', // Default to percent change
          frequency: params.frequency || 'q',  // Default to quarterly
        },
      });

      if (!response.data || !response.data.observations) {
        throw new Error('Invalid response from FRED API');
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          throw new Error(`FRED API Error: ${error.response.status} - ${error.response.data?.error_message || 'Unknown error'}`);
        } else if (error.request) {
          // The request was made but no response was received
          throw new Error('No response received from FRED API');
        } else {
          // Something happened in setting up the request
          throw new Error(`Error making request to FRED API: ${error.message}`);
        }
      }
      throw new Error('Unknown error occurred while fetching data from FRED API');
    }
  }
} 