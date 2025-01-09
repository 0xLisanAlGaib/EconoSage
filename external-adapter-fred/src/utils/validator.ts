import { AdapterRequest } from '../types/request';

type ValidParamName = 'series_id' | 'observation_start' | 'observation_end' | 'units' | 'frequency';

export class Validator {
  private request: AdapterRequest;

  constructor(request: AdapterRequest) {
    this.request = request;
  }

  validateRequiredParam(paramName: ValidParamName) {
    const param = this.request.data[paramName];
    if (!param || param.trim() === '') {
      throw new Error(`${paramName} is required`);
    }
    return param;
  }

  validateOptionalParam(paramName: ValidParamName, validator?: (value: string) => boolean) {
    const param = this.request.data[paramName];
    if (param === undefined || param.trim() === '') {
      return undefined;
    }
    if (validator && !validator(param)) {
      throw new Error(`Invalid ${paramName} format`);
    }
    return param;
  }

  static isValidDate(date: string): boolean {
    try {
      // Handle ISO date strings
      if (date.includes('T')) {
        const parsed = new Date(date);
        return !isNaN(parsed.getTime());
      }

      // Handle YYYY-MM-DD format
      const [year, month, day] = date.split('-').map(Number);
      const parsed = new Date(year, month - 1, day);
      
      // Check if the date is valid and matches the input
      return parsed.getFullYear() === year &&
             parsed.getMonth() === month - 1 &&
             parsed.getDate() === day;
    } catch {
      return false;
    }
  }

  static isValidUnit(unit: string): boolean {
    const validUnits = ['lin', 'chg', 'ch1', 'pch', 'pc1', 'pca', 'cch', 'cca', 'log'];
    return validUnits.includes(unit);
  }

  static isValidFrequency(frequency: string): boolean {
    const validFrequencies = ['d', 'w', 'bw', 'm', 'q', 'sa', 'a'];
    return validFrequencies.includes(frequency);
  }

  static validateTimestamp(timestamp: number): void {
    if (isNaN(timestamp) || timestamp < 0) {
      throw new Error('Invalid timestamp');
    }

    const date = new Date(timestamp);
    if (!isFinite(date.getTime())) {
      throw new Error('Invalid timestamp');
    }

    // Only allow timestamps from Unix epoch (1970-01-01) through 2100-12-31
    const maxTimestamp = Date.UTC(2100, 11, 31, 23, 59, 59, 999);  // 2100-12-31 23:59:59.999 UTC
    
    if (timestamp > maxTimestamp) {
      throw new Error('Invalid timestamp');
    }
  }

  static validateValue(value: number): void {
    if (isNaN(value)) {
      throw new Error('Invalid value');
    }
  }
} 