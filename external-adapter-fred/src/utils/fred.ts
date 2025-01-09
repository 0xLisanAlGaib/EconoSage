import axios from 'axios';
import { config } from '../config';

export class FREDClient {
  private baseURL = 'https://api.stlouisfed.org/fred/series/observations';
  private apiKey: string;

  constructor() {
    this.apiKey = config.fredApiKey;
    if (!this.apiKey) {
      throw new Error('FRED API key is required');
    }
  }

  async getGDPData(params: {
    series_id: string;
    observation_start?: string;
    observation_end?: string;
    units?: string;
    frequency?: string;
  }) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          series_id: params.series_id,
          api_key: this.apiKey,
          file_type: 'json',
          observation_start: params.observation_start,
          observation_end: params.observation_end,
          units: params.units || 'pc1',  // Percent Change from Previous Period
          frequency: params.frequency || 'q',  // Quarterly
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`FRED API Error: ${error.message}`);
      }
      throw error;
    }
  }
} 