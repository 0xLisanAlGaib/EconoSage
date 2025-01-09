import { AdapterRequest } from '../types/request';

type ValidParamName = 'series_id' | 'observation_start' | 'observation_end' | 'units' | 'frequency';

export class Validator {
  private request: AdapterRequest;

  constructor(request: AdapterRequest) {
    this.request = request;
  }

  validateRequiredParam(paramName: ValidParamName): string {
    const param = this.request.data[paramName];
    if (!param || param.trim() === '') {
      throw new Error(`${paramName} is required`);
    }
    return param;
  }

  validateOptionalParam(
    paramName: ValidParamName,
    validator?: (value: string) => boolean,
  ): string | undefined {
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
    if (!date) return false;
    
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
  }

  static isValidUnit(unit: string): boolean {
    if (!unit) return false;
    
    const validUnits = ['lin', 'chg', 'ch1', 'pch', 'pc1', 'pca', 'cch', 'cca', 'log'];
    return validUnits.includes(unit.trim().toLowerCase());
  }

  static isValidFrequency(frequency: string): boolean {
    if (!frequency) return false;
    
    const validFrequencies = ['d', 'w', 'bw', 'm', 'q', 'sa', 'a'];
    return validFrequencies.includes(frequency.trim().toLowerCase());
  }

  static validateTimestamp(timestamp: number): void {
    if (isNaN(timestamp) || timestamp <= 0) {
      throw new Error('Invalid timestamp');
    }

    const date = new Date(timestamp);
    const minDate = new Date('1970-01-01').getTime();
    const maxDate = new Date('2100-12-31').getTime();

    if (date.getTime() < minDate || date.getTime() > maxDate) {
      throw new Error('Invalid timestamp');
    }
  }

  static validateValue(value: string): number {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      throw new Error('Invalid value');
    }
    return numValue;
  }
} 