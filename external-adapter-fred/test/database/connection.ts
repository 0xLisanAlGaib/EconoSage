import pgPromise from 'pg-promise';
import { testConfig } from '../config';

// Initialize pg-promise with options
const pgp = pgPromise({
    // Extend error handling for database operations
    error: (error: any, e: any) => {
        if (e.cn) {
            // Connection-related error
            console.error('Test Database Connection Error:', error);
        } else {
            // Query-related error
            console.error('Test Database Query Error:', error);
        }
    }
});

// Test database connection configuration
const dbConfig = {
    host: testConfig.postgresHost,
    port: testConfig.postgresPort,
    database: testConfig.postgresDb,
    user: testConfig.postgresUser,
    password: testConfig.postgresPassword,
    // Add connection timeout and max retries
    max: 30, // max number of clients in the pool
    connectionTimeoutMillis: 10000, // how long to wait before timing out when connecting a new client
    // Add statement timeout
    statement_timeout: 15000, // 15 seconds
    // Add idle timeout
    idle_in_transaction_session_timeout: 15000, // 15 seconds
    // Add retry logic
    allowExitOnIdle: true,
    // Add connection parameters
    application_name: 'external-adapter-fred-test',
    keepAlive: true,
    keepAliveInitialDelayMillis: 1000
};

// Create test database instance
const testDb = pgp(dbConfig);

// Export an async function to test the connection
export const initializeTestDb = async () => {
    let retries = 5; // Increase retries
    let lastError: Error | null = null;

    while (retries > 0) {
        try {
            const connection = await testDb.connect();
            
            // Set transaction isolation level and other session parameters
            await connection.tx(async t => {
                await t.batch([
                    t.none('SET transaction_isolation TO serializable'),
                    t.none('SET lock_timeout = 5000'), // 5 seconds
                    t.none('SET statement_timeout = 15000'), // 15 seconds
                    t.none('SET idle_in_transaction_session_timeout = 15000') // 15 seconds
                ]);
            });

            console.log('Test database connection successful');
            connection.done(); // release the connection
            return testDb;
        } catch (error) {
            lastError = error as Error;
            console.error(`Test database connection attempt failed. Retries left: ${retries - 1}`, error);
            retries--;
            
            if (retries === 0) {
                throw new Error(`Failed to connect to test database after multiple attempts. Last error: ${lastError?.message}`);
            }
            
            // Exponential backoff: wait longer between each retry
            await new Promise(resolve => setTimeout(resolve, (5 - retries) * 1000));
        }
    }
    
    throw new Error('Failed to connect to test database after multiple attempts');
};

export default testDb;