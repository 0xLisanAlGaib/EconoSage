-- Create enum for data status
CREATE TYPE data_status AS ENUM ('pending', 'processed', 'error');

-- Create table for GDP measurements
CREATE TABLE gdp_measurements (
    id SERIAL PRIMARY KEY,
    value DECIMAL NOT NULL,
    date DATE NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status data_status NOT NULL DEFAULT 'pending',
    source VARCHAR(50) NOT NULL DEFAULT 'FRED',
    series_id VARCHAR(50) NOT NULL,
    units VARCHAR(50) NOT NULL DEFAULT 'Percent Change',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on date for faster queries
CREATE INDEX idx_gdp_measurements_date ON gdp_measurements(date);

-- Create index on status for faster filtering
CREATE INDEX idx_gdp_measurements_status ON gdp_measurements(status);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_gdp_measurements_updated_at
    BEFORE UPDATE ON gdp_measurements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 