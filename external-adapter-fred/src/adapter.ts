import { AdapterRequest } from './types/request';
import { AdapterResponse } from './types/response';
import { FREDClient } from './utils/fred';
import { Endpoint } from './endpoint';
import { Validator } from './utils/validator';
import { DatabaseOperations, GDPMeasurement } from './database/operations';

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
      const value = Validator.validateValue(latestObservation.value);

      // Convert and validate timestamp
      const date = new Date(latestObservation.date);
      Validator.validateTimestamp(date.getTime());

      // Prepare the response
      const response: AdapterResponse = {
        jobRunID: id,
        result: {
          value,
          timestamp: date.getTime(),
          series_id: params.series_id,
          units: params.units || 'Percent Change',
        },
        statusCode: 200,
        status: 'success',
        data: fredResponse,
      };

      // Try to store in database, but don't fail if database operations fail
      try {
        const measurement: GDPMeasurement = {
          value,
          date,
          series_id: params.series_id,
          units: params.units || 'Percent Change',
          status: 'pending'
        };

        // Insert measurement and get its ID
        const measurementId = await DatabaseOperations.insertGDPMeasurement(measurement);

        // Mark as processed if everything is OK
        await DatabaseOperations.updateMeasurementStatus(measurementId, 'processed');
      } catch (error) {
        // Log database errors but don't fail the request
        console.error('Database operation failed:', error);
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        const response: AdapterResponse = {
          jobRunID: id,
          statusCode: 500,
          status: 'errored',
          error: error.message,
        };
        return response;
      }
      throw new Error('Unknown error in adapter');
    }
  }
} 