import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
    port: number;
    fredApiKey: string;
    postgresHost: string;
    postgresPort: number;
    postgresDb: string;
    postgresUser: string;
    postgresPassword: string;
}

export const config: Config = {
    port: parseInt(process.env.PORT || '8080', 10),
    fredApiKey: process.env.FRED_API_KEY || '',
    postgresHost: process.env.POSTGRES_HOST || 'localhost',
    postgresPort: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    postgresDb: process.env.POSTGRES_DB || 'econosage',
    postgresUser: process.env.POSTGRES_USER || 'postgres',
    postgresPassword: process.env.POSTGRES_PASSWORD || ''
};

// Validate required configuration
const requiredEnvVars = [
    'FRED_API_KEY',
    'POSTGRES_HOST',
    'POSTGRES_DB',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
} 