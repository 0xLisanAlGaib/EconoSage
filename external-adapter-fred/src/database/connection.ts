import pgPromise from 'pg-promise';
import { config } from '../config';

// Initialize pg-promise with options
const pgp = pgPromise({
    // Extend error handling for database operations
    error: (error: any, e: any) => {
        if (e.cn) {
            // Connection-related error
            console.error('Database Connection Error:', error);
        } else {
            // Query-related error
            console.error('Database Query Error:', error);
        }
    }
});

// Database connection configuration
const dbConfig = {
    host: config.postgresHost,
    port: config.postgresPort,
    database: config.postgresDb,
    user: config.postgresUser,
    password: config.postgresPassword,
    // Add SSL configuration if needed for production
    ...(process.env.NODE_ENV === 'production' && {
        ssl: {
            rejectUnauthorized: false
        }
    })
};

// Create database instance
const db = pgp(dbConfig);

// Test the connection
db.connect()
    .then(obj => {
        console.log('Database connection successful');
        obj.done(); // success, release the connection;
    })
    .catch(error => {
        console.error('Database connection error:', error);
    });

export default db; 