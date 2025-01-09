export interface AdapterResponse {
  jobRunID: string;
  result?: {
    value: number;
    timestamp: number;
    series_id: string;
    units?: string;
  };
  statusCode: number;
  status?: string;
  error?: string;
  data?: {
    observations: Array<{
      date: string;
      value: string;
    }>;
  };
} 