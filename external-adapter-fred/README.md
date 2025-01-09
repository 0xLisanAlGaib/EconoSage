# Chainlink External Adapter for FRED (Federal Reserve Economic Data)

This external adapter provides a way to fetch economic data from the Federal Reserve Economic Data (FRED) API for use with Chainlink nodes.

## Features

- Fetches GDP and other economic data from FRED
- Supports various data transformations (units, frequencies)
- Handles rate limiting and API errors gracefully
- Full TypeScript support
- Comprehensive test suite
- Docker support

## Prerequisites

- Node.js 18+
- npm or yarn
- FRED API key ([Get one here](https://fredaccount.stlouisfed.org/apikeys))
- Docker (optional)

## Installation

### Local Installation

```bash
# Clone the repository
git clone <repository-url>
cd external-adapter-fred

# Install dependencies
npm install

# Build the project
npm run build
```

### Docker Installation

```bash
# Build the Docker image
docker build -t external-adapter-fred .

# Run the container
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e FRED_API_KEY=your-api-key \
  external-adapter-fred
```

## Configuration

The adapter requires the following environment variables:

| Variable       | Description               | Required | Default |
| -------------- | ------------------------- | -------- | ------- |
| `PORT`         | Port to run the server on | No       | 8080    |
| `FRED_API_KEY` | Your FRED API key         | Yes      | -       |

Create a `.env` file in the root directory:

```env
PORT=8080
FRED_API_KEY=your-api-key
```

## Usage

### API Endpoints

#### Health Check

```http
GET /
```

Response:

```json
{
  "status": "ok"
}
```

#### Request Data

```http
POST /
```

Request Body:

```json
{
  "id": "1",
  "data": {
    "series_id": "GDP",
    "units": "pc1",
    "frequency": "q",
    "observation_start": "2024-01-01",
    "observation_end": "2024-12-31"
  }
}
```

Parameters:

- `series_id` (required): FRED series ID (e.g., "GDP" for Gross Domestic Product)
- `units` (optional): Data transformation (e.g., "pc1" for Percent Change)
- `frequency` (optional): Data frequency (e.g., "q" for Quarterly)
- `observation_start` (optional): Start date (YYYY-MM-DD)
- `observation_end` (optional): End date (YYYY-MM-DD)
  For a more detailed insight on the parameters, please refer to the [FRED API documentation](https://fred.stlouisfed.org/docs/api/fred/series_observations.html).

Response:

```json
{
  "jobRunID": "1",
  "result": {
    "value": 2.5,
    "timestamp": 1703116800000,
    "series_id": "GDP",
    "units": "Percent Change"
  },
  "statusCode": 200,
  "data": {
    "observations": [
      {
        "date": "2023-12-01",
        "value": "2.5"
      }
    ]
  }
}
```

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

## Development

### Project Structure

```
external-adapter-fred/
├── src/
│   ├── adapter.ts        # Main adapter implementation
│   ├── config.ts         # Configuration management
│   ├── endpoint.ts       # Endpoint configuration
│   ├── index.ts          # Express server setup
│   ├── types/           # TypeScript type definitions
│   │   ├── request.ts   # Request type definitions
│   │   └── response.ts  # Response type definitions
│   └── utils/
│       ├── fred.ts      # FRED API client
│       └── validator.ts # Input validation
├── test/
│   ├── adapter.test.ts     # Adapter unit tests
│   ├── endpoint.test.ts    # Endpoint unit tests
│   ├── index.test.ts       # Server unit tests
│   ├── validator.test.ts   # Validator unit tests
│   └── integration/        # Integration tests
│       └── adapter.integration.test.ts
├── Dockerfile          # Docker configuration
├── .dockerignore      # Docker ignore file
├── .env.example       # Example environment variables
├── package.json       # Project dependencies
├── tsconfig.json      # TypeScript configuration
├── jest.config.js     # Jest test configuration
├── README.md          # Project documentation
└── LICENSE           # MIT license
```

### Adding New Features

1. Add new validation rules in `src/utils/validator.ts`
2. Implement new functionality in `src/adapter.ts`
3. Add corresponding tests in `test/` directory
4. Update documentation as needed

## Error Handling

The adapter handles various error scenarios:

- Invalid input parameters
- FRED API errors
- Rate limiting
- Network issues
- Invalid data formats

All errors are returned with appropriate HTTP status codes and descriptive messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[MIT License](LICENSE)
