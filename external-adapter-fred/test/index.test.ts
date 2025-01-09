import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { GDPAdapter } from '../src/adapter';
import { MockedClass } from 'jest-mock';

jest.mock('../src/adapter');

describe('API Endpoints', () => {
  let app: express.Application;
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
    app.post('/', async (req, res) => {
      try {
        if (!req.body || !req.body.id || !req.body.data) {
          return res.status(400).json({
            jobRunID: req.body?.id || '0',
            status: 'errored',
            statusCode: 400,
            error: 'Invalid request body',
          });
        }

        const response = await adapter.execute(req.body);
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
      const mockResponse = {
        jobRunID: '1',
        result: {
          value: 2.5,
          timestamp: 1672531200000,
          series_id: 'GDP',
          units: 'Percent Change'
        },
        statusCode: 200,
        data: { /* mock FRED response */ }
      };

      MockedGDPAdapter.prototype.execute.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/')
        .send({
          id: '1',
          data: {
            series_id: 'GDP'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
    });

    it('should handle missing request body', async () => {
      const response = await request(app)
        .post('/')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'errored',
        statusCode: 400,
        error: 'Invalid request body'
      });
    });

    it('should handle adapter errors', async () => {
      MockedGDPAdapter.prototype.execute.mockRejectedValueOnce(
        new Error('Test error')
      );

      const response = await request(app)
        .post('/')
        .send({
          id: '1',
          data: {
            series_id: 'GDP'
          }
        });

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        status: 'errored',
        statusCode: 500,
        error: 'Test error'
      });
    });

    it('should handle missing id in request', async () => {
      const response = await request(app)
        .post('/')
        .send({
          data: {
            series_id: 'GDP'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'errored',
        statusCode: 400,
        error: 'Invalid request body'
      });
    });

    it('should handle missing data in request', async () => {
      const response = await request(app)
        .post('/')
        .send({
          id: '1'
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'errored',
        statusCode: 400,
        error: 'Invalid request body'
      });
    });
  });
}); 