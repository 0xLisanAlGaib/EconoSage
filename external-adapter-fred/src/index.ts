import express from 'express';
import { config } from './config';
import { GDPAdapter } from './adapter';
import { AdapterRequest } from './types/request';

const app = express();
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
      return res.status(400).json({
        jobRunID: req.body?.id || '0',
        status: 'errored',
        statusCode: 400,
        error: 'Invalid request body',
      });
    }

    // Execute adapter
    const request: AdapterRequest = req.body;
    const response = await adapter.execute(request);
    
    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      jobRunID: req.body?.id || '0',
      status: 'errored',
      statusCode: 500,
      error: errorMessage,
    });
  }
});

// Start server
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
}); 