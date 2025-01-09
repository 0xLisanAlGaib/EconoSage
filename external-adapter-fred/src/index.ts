import express from 'express';
import { config } from './config';
import { GDPAdapter } from './adapter';
import { AdapterRequest } from './types/request';
import { AdapterResponse } from './types/response';

export const app = express();
const adapter = new GDPAdapter();

// Middleware to parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/', (_, res) => {
  res.json({ status: 'ok' });
});

// Main adapter endpoint
app.post('/', async (req, res) => {
  try {
    // Validate request body
    if (!req.body || !req.body.id || !req.body.data) {
      const response: AdapterResponse = {
        jobRunID: req.body?.id || '0',
        status: 'errored',
        statusCode: 400,
        error: 'Invalid request body',
      };
      return res.status(400).json(response);
    }

    // Execute adapter
    const request: AdapterRequest = req.body;
    const response = await adapter.execute(request);
    
    // Send response with appropriate status code
    res.status(response.statusCode).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: AdapterResponse = {
      jobRunID: req.body?.id || '0',
      status: 'errored',
      statusCode: 500,
      error: errorMessage,
    };
    res.status(500).json(response);
  }
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
} 