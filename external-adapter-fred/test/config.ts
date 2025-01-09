import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: 'test/integration/.env.test' });

interface TestConfig {
    port: number;
    fredApiKey: string;
    postgresHost: string;
    postgresPort: number;
    postgresDb: string;
    postgresUser: string;
    postgresPassword: string;
}

export const testConfig: TestConfig = {
    port: parseInt(process.env.PORT || '8081', 10),
    fredApiKey: process.env.FRED_API_KEY || 'test_api_key',
    postgresHost: process.env.POSTGRES_HOST || 'localhost',
    postgresPort: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    postgresDb: process.env.POSTGRES_DB || 'econosage_test',
    postgresUser: process.env.POSTGRES_USER || 'postgres',
    postgresPassword: process.env.POSTGRES_PASSWORD || ''
};

// Validate test configuration
const requiredEnvVars = [
    'POSTGRES_HOST',
    'POSTGRES_DB',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required test environment variable: ${envVar}`);
    }
} 