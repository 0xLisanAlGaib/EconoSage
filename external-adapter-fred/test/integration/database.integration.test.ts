import { DatabaseOperations, GDPMeasurement, DataStatus } from '../../src/database/operations';
import testDb from '../database/connection';
import { cleanupData } from './setup';

describe('Database Operations', () => {
    const sampleMeasurement: GDPMeasurement = {
        value: 2.5,
        date: new Date(Date.UTC(2023, 0, 1)),
        series_id: 'GDP',
        units: 'Percent Change',
        status: 'pending' as DataStatus
    };

    beforeEach(async () => {
        await cleanupData();
    });

    describe('insertGDPMeasurement', () => {
        it('should insert a GDP measurement and return the ID', async () => {
            const result = await DatabaseOperations.insertGDPMeasurement(sampleMeasurement);
            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThan(0);

            const inserted = await testDb.one('SELECT * FROM gdp_measurements WHERE id = $1', [result]);
            expect(Number(inserted.value)).toBe(sampleMeasurement.value);
            expect(inserted.series_id).toBe(sampleMeasurement.series_id);
        });
    });

    describe('getLatestGDPMeasurement', () => {
        it('should return the latest GDP measurement', async () => {
            const olderMeasurement: GDPMeasurement = { 
                ...sampleMeasurement, 
                date: new Date(Date.UTC(2023, 0, 1)),
                status: 'processed' as DataStatus
            };
            const newerMeasurement: GDPMeasurement = { 
                ...sampleMeasurement, 
                date: new Date(Date.UTC(2023, 1, 1)),
                status: 'processed' as DataStatus
            };

            await DatabaseOperations.insertGDPMeasurement(olderMeasurement);
            await DatabaseOperations.insertGDPMeasurement(newerMeasurement);

            const latest = await DatabaseOperations.getLatestGDPMeasurement();
            expect(latest).toBeDefined();
            expect(Number(latest?.value)).toBe(newerMeasurement.value);
            expect(latest?.date.toISOString().split('T')[0]).toBe('2023-02-01');
        });

        it('should return null when no measurements exist', async () => {
            const latest = await DatabaseOperations.getLatestGDPMeasurement();
            expect(latest).toBeNull();
        });
    });

    describe('updateMeasurementStatus', () => {
        it('should update the status of a measurement', async () => {
            const inserted = await DatabaseOperations.insertGDPMeasurement(sampleMeasurement);
            await DatabaseOperations.updateMeasurementStatus(inserted, 'processed' as DataStatus);
            
            const updated = await testDb.one('SELECT status FROM gdp_measurements WHERE id = $1', [inserted]);
            expect(updated.status).toBe('processed');
        });
    });

    describe('getMeasurementsByDateRange', () => {
        it('should return measurements within the specified date range', async () => {
            const measurements: GDPMeasurement[] = [
                { ...sampleMeasurement, date: new Date(Date.UTC(2023, 0, 1)), status: 'processed' as DataStatus },
                { ...sampleMeasurement, date: new Date(Date.UTC(2023, 1, 1)), status: 'processed' as DataStatus },
                { ...sampleMeasurement, date: new Date(Date.UTC(2023, 2, 1)), status: 'processed' as DataStatus }
            ];

            for (const measurement of measurements) {
                await DatabaseOperations.insertGDPMeasurement(measurement);
            }

            const results = await DatabaseOperations.getMeasurementsByDateRange(
                new Date(Date.UTC(2023, 0, 15)),
                new Date(Date.UTC(2023, 1, 15))
            );

            expect(results).toHaveLength(1);
            expect(results[0].date.toISOString().split('T')[0]).toBe('2023-02-01');
        });
    });

    describe('deleteOldMeasurements', () => {
        it('should delete measurements older than the specified date', async () => {
            const measurements: GDPMeasurement[] = [
                { ...sampleMeasurement, date: new Date(Date.UTC(2023, 0, 1)), status: 'processed' as DataStatus },
                { ...sampleMeasurement, date: new Date(Date.UTC(2023, 1, 1)), status: 'processed' as DataStatus },
                { ...sampleMeasurement, date: new Date(Date.UTC(2023, 2, 1)), status: 'processed' as DataStatus }
            ];

            for (const measurement of measurements) {
                await DatabaseOperations.insertGDPMeasurement(measurement);
            }

            const deletedCount = await DatabaseOperations.deleteOldMeasurements(new Date(Date.UTC(2023, 1, 15)));
            expect(deletedCount).toBe(2);

            const remaining = await testDb.any('SELECT * FROM gdp_measurements');
            expect(remaining).toHaveLength(1);
            expect(remaining[0].date.toISOString().split('T')[0]).toBe('2023-03-01');
        });
    });
}); 