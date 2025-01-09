-- Create enum type for data status
DO $$ BEGIN
    CREATE TYPE data_status AS ENUM ('pending', 'processed', 'error');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create gdp_measurements table
CREATE TABLE IF NOT EXISTS gdp_measurements (
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
);

-- Create indexes if they don't exist
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_gdp_measurements_date ON gdp_measurements(date);
    CREATE INDEX IF NOT EXISTS idx_gdp_measurements_status ON gdp_measurements(status);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create or replace update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and create it
DROP TRIGGER IF EXISTS update_gdp_measurements_updated_at ON gdp_measurements;
CREATE TRIGGER update_gdp_measurements_updated_at
    BEFORE UPDATE ON gdp_measurements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 