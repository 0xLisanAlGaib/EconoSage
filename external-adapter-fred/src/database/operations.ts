import db from './connection';

export type DataStatus = 'pending' | 'processed' | 'error';

export interface GDPMeasurement {
    value: number;
    date: Date;
    series_id: string;
    units?: string;
    status?: DataStatus;
    error_message?: string;
}

export class DatabaseOperations {
    // Helper function to convert date to UTC
    private static toUTCDate(date: Date): Date {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }

    // Insert a new GDP measurement
    static async insertGDPMeasurement(measurement: GDPMeasurement): Promise<number> {
        try {
            // Validate status before insertion
            const status = measurement.status || 'pending';
            if (!['pending', 'processed', 'error'].includes(status)) {
                throw new Error(`Invalid status: ${status}`);
            }

            const result = await db.tx(async t => {
                // Check if table exists, if not initialize schema
                const tableExists = await t.one(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'gdp_measurements'
                    )
                `);

                if (!tableExists.exists) {
                    throw new Error('GDP measurements table does not exist');
                }

                // Insert measurement
                return await t.one(
                    `INSERT INTO gdp_measurements(value, date, series_id, units, status)
                     VALUES($1, $2, $3, $4, $5::data_status)
                     RETURNING id`,
                    [
                        measurement.value,
                        this.toUTCDate(measurement.date),
                        measurement.series_id,
                        measurement.units || 'Percent Change',
                        status
                    ]
                );
            });

            return result.id;
        } catch (error) {
            console.error('Error inserting GDP measurement:', error);
            throw error;
        }
    }

    // Get the latest GDP measurement
    static async getLatestGDPMeasurement(): Promise<GDPMeasurement | null> {
        try {
            const result = await db.oneOrNone(
                `SELECT value, date AT TIME ZONE 'UTC' as date, series_id, units, status::text as status, error_message
                 FROM gdp_measurements
                 WHERE status = 'processed'
                 ORDER BY date DESC
                 LIMIT 1`
            );

            if (result) {
                result.date = this.toUTCDate(result.date);
            }

            return result;
        } catch (error) {
            console.error('Error getting latest GDP measurement:', error);
            throw error;
        }
    }

    // Update measurement status
    static async updateMeasurementStatus(
        id: number,
        status: DataStatus,
        error_message?: string
    ): Promise<void> {
        try {
            // Validate status before update
            if (!['pending', 'processed', 'error'].includes(status)) {
                throw new Error(`Invalid status: ${status}`);
            }

            await db.none(
                `UPDATE gdp_measurements
                 SET status = $1::data_status, error_message = $2
                 WHERE id = $3`,
                [status, error_message || null, id]
            );
        } catch (error) {
            console.error('Error updating measurement status:', error);
            throw error;
        }
    }

    // Get measurements by date range
    static async getMeasurementsByDateRange(
        startDate: Date,
        endDate: Date
    ): Promise<GDPMeasurement[]> {
        try {
            const results = await db.manyOrNone(
                `SELECT value, date AT TIME ZONE 'UTC' as date, series_id, units, status::text as status, error_message
                 FROM gdp_measurements
                 WHERE date BETWEEN $1 AND $2
                 ORDER BY date DESC`,
                [this.toUTCDate(startDate), this.toUTCDate(endDate)]
            );

            return results.map(result => ({
                ...result,
                date: this.toUTCDate(result.date)
            }));
        } catch (error) {
            console.error('Error getting measurements by date range:', error);
            throw error;
        }
    }

    // Delete old measurements
    static async deleteOldMeasurements(beforeDate: Date): Promise<number> {
        try {
            const result = await db.result(
                `DELETE FROM gdp_measurements
                 WHERE date < $1`,
                [this.toUTCDate(beforeDate)]
            );
            return result.rowCount;
        } catch (error) {
            console.error('Error deleting old measurements:', error);
            throw error;
        }
    }
} 