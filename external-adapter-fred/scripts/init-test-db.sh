#!/bin/bash

# Exit on error
set -e

# Load environment variables from test config
if [ -f "test/integration/.env.test" ]; then
    source test/integration/.env.test
else
    echo "Error: test/integration/.env.test file not found"
    exit 1
fi

echo "Initializing test database..."

# Check if PostgreSQL is running
pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER || {
    echo "PostgreSQL is not running. Please start PostgreSQL and try again."
    exit 1
}

# Function to run psql commands
run_psql() {
    PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -h $POSTGRES_HOST -p $POSTGRES_PORT "$@"
}

# Terminate existing connections to the database
run_psql -d postgres -c "
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '$POSTGRES_DB'
    AND pid <> pg_backend_pid();" || true

# Drop and recreate test database
run_psql -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;"
run_psql -d postgres -c "CREATE DATABASE $POSTGRES_DB;"

echo "Test database initialized successfully"

# Connect to test database and create schema
PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -h $POSTGRES_HOST -p $POSTGRES_PORT -d $POSTGRES_DB -v ON_ERROR_STOP=1 -f database/schema/init.sql

# Verify schema creation
run_psql -d $POSTGRES_DB -c "
    DO \$\$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'gdp_measurements'
        ) THEN
            RAISE EXCEPTION 'Table gdp_measurements does not exist';
        END IF;

        IF NOT EXISTS (
            SELECT 1 
            FROM pg_type 
            WHERE typname = 'data_status'
        ) THEN
            RAISE EXCEPTION 'Type data_status does not exist';
        END IF;
    END
    \$\$;"

echo "Schema verification successful"