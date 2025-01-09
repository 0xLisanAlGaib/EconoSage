import { AdapterRequest } from './types/request';
import { Validator } from './utils/validator';

export const FRED_ENDPOINT = 'https://api.stlouisfed.org/fred/series/observations';

export interface EndpointParams {
  series_id: string;
  observation_start?: string;
  observation_end?: string;
  units?: string;
  frequency?: string;
}

export class Endpoint {
  static validateRequest(request: AdapterRequest): EndpointParams {
    const validator = new Validator(request);
    
    // Required fields
    validator.validateRequiredParam('series_id');
    
    // Optional fields with validation
    const start = validator.validateOptionalParam('observation_start', Validator.isValidDate);
    const end = validator.validateOptionalParam('observation_end', Validator.isValidDate);
    
    // Validate date range if both dates are present
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (endDate < startDate) {
        throw new Error('End date must be after start date');
      }
    }

    validator.validateOptionalParam('units', Validator.isValidUnit);
    validator.validateOptionalParam('frequency', Validator.isValidFrequency);

    return {
      series_id: request.data.series_id,
      observation_start: start,
      observation_end: end,
      units: request.data.units,
      frequency: request.data.frequency,
    };
  }

  static getQueryParams(params: EndpointParams) {
    return {
      series_id: params.series_id,
      observation_start: params.observation_start,
      observation_end: params.observation_end,
      units: params.units || 'pc1', // Default to percent change
      frequency: params.frequency || 'q',  // Default to quarterly
      file_type: 'json',
    };
  }
} 