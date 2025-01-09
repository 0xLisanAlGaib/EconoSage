import db from './connection';

export interface GDPMeasurement {
    value: number;
    date: Date;
    series_id: string;
    units?: string;
    status?: 'pending' | 'processed' | 'error';
    error_message?: string;
}

export class DatabaseOperations {
    // Insert a new GDP measurement
    static async insertGDPMeasurement(measurement: GDPMeasurement): Promise<number> {
        try {
            const result = await db.one(
                `INSERT INTO gdp_measurements(value, date, series_id, units, status)
                 VALUES($1, $2, $3, $4, $5)
                 RETURNING id`,
                [
                    measurement.value,
                    measurement.date,
                    measurement.series_id,
                    measurement.units || 'Percent Change',
                    measurement.status || 'pending'
                ]
            );
            return result.id;
        } catch (error) {
            console.error('Error inserting GDP measurement:', error);
            throw error;
        }
    }

    // Get the latest GDP measurement
    static async getLatestGDPMeasurement(): Promise<GDPMeasurement | null> {
        try {
            return await db.oneOrNone(
                `SELECT value, date, series_id, units, status, error_message
                 FROM gdp_measurements
                 WHERE status = 'processed'
                 ORDER BY date DESC
                 LIMIT 1`
            );
        } catch (error) {
            console.error('Error getting latest GDP measurement:', error);
            throw error;
        }
    }

    // Update measurement status
    static async updateMeasurementStatus(
        id: number,
        status: 'pending' | 'processed' | 'error',
        error_message?: string
    ): Promise<void> {
        try {
            await db.none(
                `UPDATE gdp_measurements
                 SET status = $1, error_message = $2
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
            return await db.manyOrNone(
                `SELECT value, date, series_id, units, status, error_message
                 FROM gdp_measurements
                 WHERE date BETWEEN $1 AND $2
                 ORDER BY date DESC`,
                [startDate, endDate]
            );
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
                [beforeDate]
            );
            return result.rowCount;
        } catch (error) {
            console.error('Error deleting old measurements:', error);
            throw error;
        }
    }
} 