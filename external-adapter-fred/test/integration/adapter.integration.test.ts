import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import express, { Express, Request, Response } from 'express';
import request from 'supertest';
import { Server } from 'http';
import { GDPAdapter } from '../../src/adapter';
import { config } from '../../src/config';
import { AdapterRequest } from '../../src/types/request';
import { AdapterResponse } from '../../src/types/response';

jest.setTimeout(30000); // Increase timeout for all tests in this file

describe('FRED Adapter Integration', () => {
  let app: Express;
  let server: Server;

  beforeAll((): void => {
    // Setup express app
    app = express();
    app.use(express.json());

    const adapter = new GDPAdapter();
    app.post('/', (req: Request, res: Response): void => {
      void (async (): Promise<void> => {
        try {
          const response = await adapter.execute(req.body as AdapterRequest);
          res.json(response);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          res.status(500).json({
            jobRunID: (req.body as AdapterRequest)?.id || '0',
            status: 'errored',
            statusCode: 500,
            error: errorMessage,
          });
        }
      })();
    });

    // Start server
    server = app.listen(0);
  });

  afterAll((done): void => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it('should fetch real GDP data from FRED', async () => {
    const response = await request(app)
      .post('/')
      .send({
        id: '1',
        data: {
          series_id: 'GDP',
          units: 'pc1',
          frequency: 'q',
        },
      });

    expect(response.status).toBe(200);
    const body = response.body as AdapterResponse;
    expect(body).toMatchObject({
      jobRunID: '1',
      result: {
        series_id: 'GDP',
        units: 'pc1',
      },
      statusCode: 200,
    });

    // Verify the response contains valid data
    if (!body.result) {
      throw new Error('Response is missing result');
    }
    expect(body.result.value).toEqual(expect.any(Number));
    expect(body.result.timestamp).toEqual(expect.any(Number));
    expect(new Date(body.result.timestamp).getTime()).toBe(body.result.timestamp);
  });

  it('should handle invalid series_id', async () => {
    const response = await request(app)
      .post('/')
      .send({
        id: '1',
        data: {
          series_id: 'INVALID_SERIES',
          units: 'pc1',
          frequency: 'q',
        },
      });

    expect(response.status).toBe(500);
    const body = response.body as AdapterResponse;
    expect(body).toMatchObject({
      jobRunID: '1',
      status: 'errored',
      statusCode: 500,
    });
  });

  it('should handle invalid API key', async () => {
    const originalKey = config.fredApiKey;
    let testServer: Server | undefined;
    
    try {
      config.fredApiKey = 'invalid_key';
      
      // Create a new app instance for this test
      const testApp = express();
      testApp.use(express.json());
      const adapter = new GDPAdapter();
      
      testApp.post('/', (req: Request, res: Response): void => {
        void (async (): Promise<void> => {
          try {
            const response = await adapter.execute(req.body as AdapterRequest);
            res.json(response);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({
              jobRunID: (req.body as AdapterRequest)?.id || '0',
              status: 'errored',
              statusCode: 500,
              error: errorMessage,
            });
          }
        })();
      });

      // Start test server
      testServer = testApp.listen(0);

      const response = await request(testApp)
        .post('/')
        .send({
          id: '1',
          data: {
            series_id: 'GDP',
            units: 'pc1',
            frequency: 'q',
          },
        });

      expect(response.status).toBe(500);
      const body = response.body as AdapterResponse;
      if (!body.error) {
        throw new Error('Response is missing error message');
      }
      expect(body.error).toContain('API Error');
    } finally {
      // Restore API key and close test server
      config.fredApiKey = originalKey;
      if (testServer) {
        await new Promise<void>((resolve): void => {
          testServer!.close(() => resolve());
        });
      }
    }
  });

  it('should handle optional parameters', async () => {
    const response = await request(app)
      .post('/')
      .send({
        id: '1',
        data: {
          series_id: 'GDP',
          units: 'pc1',
          frequency: 'q',
          observation_start: '2023-01-01',
          observation_end: '2023-12-31',
        },
      });

    expect(response.status).toBe(200);
    const body = response.body as AdapterResponse;
    expect(body).toMatchObject({
      jobRunID: '1',
      result: {
        series_id: 'GDP',
        units: 'pc1',
      },
      statusCode: 200,
    });

    // Verify the timestamp is within the specified range
    if (!body.result) {
      throw new Error('Response is missing result');
    }
    const timestamp = body.result.timestamp;
    expect(timestamp).toBeGreaterThanOrEqual(new Date('2023-01-01').getTime());
    expect(timestamp).toBeLessThanOrEqual(new Date('2023-12-31').getTime());
  });
}); 