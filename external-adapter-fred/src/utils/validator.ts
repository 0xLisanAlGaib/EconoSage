import { AdapterRequest } from '../types/request';

type ValidParamName = 'series_id' | 'observation_start' | 'observation_end' | 'units' | 'frequency';

export class Validator {
  private request: AdapterRequest;

  constructor(request: AdapterRequest) {
    this.request = request;
  }

  validateRequiredParam(paramName: ValidParamName) {
    const param = this.request.data[paramName];
    if (!param) {
      throw new Error(`${paramName} is required`);
    }
    return param;
  }

  validateOptionalParam(paramName: ValidParamName, validator?: (value: string) => boolean) {
    const param = this.request.data[paramName];
    if (param && validator && !validator(param)) {
      throw new Error(`Invalid ${paramName} format`);
    }
    return param;
  }

  static isValidDate(date: string): boolean {
    const parsed = Date.parse(date);
    return !isNaN(parsed);
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
    if (isNaN(timestamp) || timestamp <= 0) {
      throw new Error('Invalid timestamp');
    }
  }

  static validateValue(value: number): void {
    if (isNaN(value)) {
      throw new Error('Invalid value');
    }
  }
} 