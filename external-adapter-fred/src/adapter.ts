import { AdapterRequest } from './types/request';
import { AdapterResponse } from './types/response';
import { FREDClient } from './utils/fred';
import { Endpoint } from './endpoint';
import { Validator } from './utils/validator';

export class GDPAdapter {
  private fredClient: FREDClient;

  constructor() {
    this.fredClient = new FREDClient();
  }

  async execute(request: AdapterRequest): Promise<AdapterResponse> {
    const { id } = request;

    try {
      // Validate request parameters
      const params = Endpoint.validateRequest(request);

      // Get GDP data from FRED with validated parameters
      const fredResponse = await this.fredClient.getGDPData(params);

      // Validate response data
      if (!fredResponse.observations || !Array.isArray(fredResponse.observations)) {
        throw new Error('No observations found');
      }

      if (fredResponse.observations.length === 0) {
        throw new Error('No observations found');
      }

      const latestObservation = fredResponse.observations[fredResponse.observations.length - 1];
      
      // Validate date first
      if (!Validator.isValidDate(latestObservation.date)) {
        throw new Error('Invalid timestamp');
      }

      // Then validate value
      const value = parseFloat(latestObservation.value);
      if (isNaN(value)) {
        throw new Error('Invalid value');
      }

      // Convert and validate timestamp
      const timestamp = new Date(latestObservation.date).getTime();
      Validator.validateTimestamp(timestamp);

      // Prepare the response
      const response: AdapterResponse = {
        jobRunID: id,
        result: {
          value,
          timestamp,
          series_id: params.series_id,
          units: params.units || 'Percent Change',
        },
        statusCode: 200,
        data: fredResponse,
      };

      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Adapter Error: ${error.message}`);
      }
      throw new Error('Unknown error in adapter');
    }
  }
} 