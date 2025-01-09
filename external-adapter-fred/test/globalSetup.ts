import { initializeSchema } from './integration/setup';

module.exports = async () => {
    try {
        await initializeSchema();
    } catch (error) {
        console.error('Error in global setup:', error);
        throw error;
    }
}; 