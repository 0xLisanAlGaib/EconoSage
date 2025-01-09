-- Up Migration
--> statement-breakpoint
CREATE TYPE data_status AS ENUM ('pending', 'processed', 'error');

--> statement-breakpoint
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

--> statement-breakpoint
CREATE INDEX idx_gdp_measurements_date ON gdp_measurements(date);
CREATE INDEX idx_gdp_measurements_status ON gdp_measurements(status);

--> statement-breakpoint
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

--> statement-breakpoint
CREATE TRIGGER update_gdp_measurements_updated_at
    BEFORE UPDATE ON gdp_measurements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Down Migration
--> statement-breakpoint
DROP TRIGGER IF EXISTS update_gdp_measurements_updated_at ON gdp_measurements;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS gdp_measurements;
DROP TYPE IF EXISTS data_status; 