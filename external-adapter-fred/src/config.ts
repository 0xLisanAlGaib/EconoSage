import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  fredApiKey: string;
}

if (!process.env.FRED_API_KEY) {
  throw new Error('FRED_API_KEY environment variable is required');
}

export const config: Config = {
  port: parseInt(process.env.PORT || '8080', 10),
  fredApiKey: process.env.FRED_API_KEY,
} 