import testDb, { initializeTestDb } from '../database/connection';

// Function to initialize the database schema
export async function initializeSchema() {
    try {
        // Initialize database connection
        await initializeTestDb();

        // Drop existing tables and types in the correct order
        await testDb.tx(async t => {
            // Drop everything first
            await t.none('DROP TABLE IF EXISTS gdp_measurements CASCADE');
            await t.none('DROP TYPE IF EXISTS data_status CASCADE');
            
            // Create type
            await t.none(`CREATE TYPE data_status AS ENUM ('pending', 'processed', 'error')`);
            
            // Create table with the type
            await t.none(`
                CREATE TABLE gdp_measurements (
                    id SERIAL PRIMARY KEY,
                    value DECIMAL NOT NULL,
                    date DATE NOT NULL,
                    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    status data_status NOT NULL DEFAULT 'pending',
                    source VARCHAR(50) NOT NULL DEFAULT 'FRED',
                    series_id VARCHAR(200) NOT NULL,
                    units VARCHAR(50) NOT NULL DEFAULT 'Percent Change',
                    error_message TEXT,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `);

            // Create indexes
            await t.none(`
                CREATE INDEX idx_gdp_measurements_date ON gdp_measurements(date);
                CREATE INDEX idx_gdp_measurements_status ON gdp_measurements(status);
            `);

            // Create update trigger function
            await t.none(`
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = NOW();
                    RETURN NEW;
                END;
                $$ language 'plpgsql';
            `);

            // Create trigger
            await t.none(`
                CREATE TRIGGER update_gdp_measurements_updated_at
                    BEFORE UPDATE ON gdp_measurements
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
            `);
        });

        console.log('Test database initialized successfully');
    } catch (error) {
        console.error('Error initializing test database:', error);
        throw error;
    }
}

// Function to clean up data
export async function cleanupData() {
    try {
        await testDb.none('TRUNCATE TABLE gdp_measurements RESTART IDENTITY CASCADE');
    } catch (error) {
        console.error('Error cleaning up data:', error);
        throw error;
    }
}

// Function to clean up schema
export async function cleanupSchema() {
    try {
        await testDb.tx(async t => {
            await t.none('DROP TABLE IF EXISTS gdp_measurements CASCADE');
            await t.none('DROP TYPE IF EXISTS data_status CASCADE');
        });
        await testDb.$pool.end();
    } catch (error) {
        console.error('Error cleaning up schema:', error);
        throw error;
    }
} 