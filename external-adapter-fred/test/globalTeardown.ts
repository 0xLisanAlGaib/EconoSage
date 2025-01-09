import { cleanupSchema } from './integration/setup';

module.exports = async () => {
    try {
        await cleanupSchema();
    } catch (error) {
        console.error('Error in global teardown:', error);
        throw error;
    }
}; 