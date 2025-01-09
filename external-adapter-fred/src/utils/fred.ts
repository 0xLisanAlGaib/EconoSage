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
    const response: AxiosResponse<FREDResponse> = await axios.get(this.baseURL, {
      params: {
        series_id: params.series_id,
        api_key: config.fredApiKey,
        file_type: 'json',
        observation_start: params.observation_start,
        observation_end: params.observation_end,
        units: params.units,
        frequency: params.frequency,
      },
    });

    return response.data;
  }
} 