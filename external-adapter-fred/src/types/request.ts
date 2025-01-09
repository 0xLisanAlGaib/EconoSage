export interface AdapterRequest {
  id: string;
  data: {
    series_id: string;      // FRED series ID (e.g., 'GDP')
    observation_start?: string;  // Optional start date
    observation_end?: string;    // Optional end date
    units?: string;             // Optional units specification
    frequency?: string;         // Optional frequency specification
  };
} 