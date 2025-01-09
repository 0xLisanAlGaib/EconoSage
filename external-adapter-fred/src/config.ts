import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  fredApiKey: string;
}

export const config: Config = {
  port: parseInt(process.env.PORT || '8080', 10),
  fredApiKey: process.env.FRED_API_KEY || '',
} 