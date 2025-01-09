export interface AdapterResponse {
  jobRunID: string;
  result: {
    value: number;      // GDP growth rate value
    timestamp: number;  // Unix timestamp of the observation
    series_id: string;  // FRED series ID
    units: string;      // Data units (e.g., "Percent Change")
  };
  statusCode: number;
  data?: any;          // Optional raw data from FRED
} 