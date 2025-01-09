import axios, { AxiosError } from 'axios';
import { config } from '../config';
import { FRED_ENDPOINT, EndpointParams } from '../endpoint';

export class FREDClient {
  private apiKey: string;

  constructor() {
    this.apiKey = config.fredApiKey;
    if (!this.apiKey) {
      throw new Error('FRED API key is required');
    }
  }

  async getGDPData(params: EndpointParams) {
    try {
      const response = await axios.get(FRED_ENDPOINT, {
        params: {
          ...params,
          api_key: this.apiKey,
          file_type: 'json',
        },
      });

      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw new Error(`FRED API Error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while fetching FRED data');
    }
  }
} 