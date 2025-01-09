import { describe, it, expect, beforeEach } from '@jest/globals';
import express, { Express } from 'express';
import request from 'supertest';
import { GDPAdapter } from '../src/adapter';
import { AdapterRequest } from '../src/types/request';
import { AdapterResponse } from '../src/types/response';
import { MockedClass } from 'jest-mock';
import { app } from '../src/index';
import { testConfig } from './config';
import testDb from './database/connection';

jest.mock('../src/adapter');

describe('API Endpoints', () => {
  let app: Express;
  const MockedGDPAdapter = GDPAdapter as MockedClass<typeof GDPAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a fresh app instance for each test
    app = express();
    app.use(express.json());

    // Setup routes (copied from index.ts)
    app.get('/', (_, res) => {
      res.json({ status: 'ok' });
    });

    const adapter = new GDPAdapter();
    app.post('/', async (req: express.Request, res: express.Response) => {
      try {
        if (!req.body || !req.body.id || !req.body.data) {
          const response: AdapterResponse = {
            jobRunID: req.body?.id || '0',
            status: 'errored',
            statusCode: 400,
            error: 'Invalid request body',
          };
          return res.status(400).json(response);
        }

        const response = await adapter.execute(req.body as AdapterRequest);
        res.status(response.statusCode).json(response);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const response: AdapterResponse = {
          jobRunID: (req.body as AdapterRequest)?.id || '0',
          status: 'errored',
          statusCode: 500,
          error: errorMessage,
        };
        res.status(500).json(response);
      }
    });
  });

  beforeEach(async () => {
    await testDb.none('TRUNCATE TABLE gdp_measurements RESTART IDENTITY CASCADE');
  });

  describe('GET /', () => {
    it('should return health check status', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('POST /', () => {
    it('should handle valid request', async () => {
      const mockResponse: AdapterResponse = {
        jobRunID: '1',
        result: {
          value: 123.45,
          timestamp: Date.now(),
          series_id: 'GDPC1',
          units: 'pc1',
        },
        statusCode: 200,
        status: 'success',
      };

      MockedGDPAdapter.prototype.execute.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/')
        .send({
          id: '1',
          data: {
            series_id: 'GDPC1',
            units: 'pc1',
            frequency: 'q'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('jobRunID', '1');
      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('value');
      expect(typeof response.body.result.value).toBe('number');
    });

    it('should handle missing request body', async () => {
      const response = await request(app)
        .post('/')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('jobRunID', '0');
      expect(response.body).toHaveProperty('status', 'errored');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should handle adapter errors', async () => {
      const mockError: AdapterResponse = {
        jobRunID: '1',
        status: 'errored',
        statusCode: 500,
        error: 'FRED API Error: Invalid series ID',
      };

      MockedGDPAdapter.prototype.execute.mockResolvedValueOnce(mockError);

      const response = await request(app)
        .post('/')
        .send({
          id: '1',
          data: {
            series_id: 'INVALID_SERIES'
          }
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('jobRunID', '1');
      expect(response.body).toHaveProperty('status', 'errored');
      expect(response.body).toHaveProperty('statusCode', 500);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing id in request', async () => {
      const response = await request(app)
        .post('/')
        .send({
          data: {
            series_id: 'GDPC1'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('jobRunID', '0');
      expect(response.body).toHaveProperty('status', 'errored');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should handle missing data in request', async () => {
      const response = await request(app)
        .post('/')
        .send({
          id: '1'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('jobRunID', '1');
      expect(response.body).toHaveProperty('status', 'errored');
      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });
}); 