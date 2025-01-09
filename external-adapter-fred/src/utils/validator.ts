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
    
    // Parse the date components
    const parts = date.split('-');
    if (parts.length !== 3) return false;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    // Check if the date components are valid numbers
    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
    
    // Check month range
    if (month < 1 || month > 12) return false;
    
    // Calculate days in month (accounting for leap years)
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // Check day range
    if (day < 1 || day > daysInMonth[month - 1]) return false;
    
    return true;
  }

  static isValidUnit(unit: string): boolean {
    if (!unit) return false;
    
    const validUnits = ['lin', 'chg', 'ch1', 'pch', 'pc1', 'pca', 'cch', 'cca', 'log'];
    const normalizedUnit = unit.trim().toLowerCase();
    return validUnits.includes(normalizedUnit);
  }

  static isValidFrequency(frequency: string): boolean {
    if (!frequency) return false;
    
    const validFrequencies = ['d', 'w', 'bw', 'm', 'q', 'sa', 'a'];
    const normalizedFreq = frequency.trim().toLowerCase();
    return validFrequencies.includes(normalizedFreq);
  }

  static validateTimestamp(timestamp: number): void {
    if (isNaN(timestamp) || timestamp <= 0) {
      throw new Error('Invalid timestamp');
    }

    const date = new Date(timestamp);
    if (date.toString() === 'Invalid Date' || date.getTime() !== timestamp) {
      throw new Error('Invalid timestamp');
    }
  }

  static validateValue(value: string): number {
    if (!value || value.trim() === '') {
      throw new Error('Invalid value');
    }

    // Handle scientific notation
    const numValue = Number(value);
    if (isNaN(numValue) || !isFinite(numValue)) {
      throw new Error('Invalid value');
    }
    return numValue;
  }
} 