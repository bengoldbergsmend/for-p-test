# Security Test Project

A basic npm project that uses `winston-to-newrelic-logs`, `form-data`, and `snowflake-sdk` libraries for security testing purposes.

## Libraries Included

- **winston-to-newrelic-logs** (v4.0.0) - Winston transport for sending logs to New Relic
- **form-data** (v4.0.0) - Library for creating form data streams
- **snowflake-sdk** (v1.9.3) - Snowflake SDK for database connectivity

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your actual credentials:

```env
# New Relic Configuration (optional)
NEW_RELIC_LICENSE_KEY=your_actual_license_key

# Snowflake Configuration
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USERNAME=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=TEST_DB
SNOWFLAKE_SCHEMA=PUBLIC

# Server Configuration
PORT=3000
```

### 3. Run the Application

```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
- **GET** `/` - Returns application status and library information

### Individual Library Tests

#### Winston to New Relic Logging
- **POST** `/log-test`
- Body: `{ "message": "Test message", "level": "info" }`
- Tests logging functionality with New Relic transport

#### Form Data Testing
- **POST** `/form-data-test`
- Tests form-data library functionality
- Creates form with various field types

#### Snowflake Testing
- **GET** `/snowflake-test`
- Tests Snowflake database connection
- Executes a simple query to verify connectivity

### Integration Test
- **POST** `/integration-test`
- Body: `{ "testData": { "any": "data" } }`
- Tests all three libraries working together

## Usage Examples

### Test Winston Logging
```bash
curl -X POST http://localhost:3000/log-test \
  -H "Content-Type: application/json" \
  -d '{"message": "Security test log", "level": "warn"}'
```

### Test Form Data
```bash
curl -X POST http://localhost:3000/form-data-test
```

### Test Snowflake Connection
```bash
curl http://localhost:3000/snowflake-test
```

### Test Integration
```bash
curl -X POST http://localhost:3000/integration-test \
  -H "Content-Type: application/json" \
  -d '{"testData": {"security": "test", "timestamp": "2024-01-01"}}'
```

## Security Testing Notes

This project is designed for security testing and includes:

1. **Multiple dependency vectors** - Three different npm packages with their transitive dependencies
2. **Network connectivity** - New Relic and Snowflake integrations for testing external connections
3. **Data handling** - Form data processing and JSON manipulation
4. **Logging mechanisms** - Winston logging with external transport
5. **Database connectivity** - Snowflake SDK for testing database security

## Configuration Notes

- **New Relic**: Optional - logs will work without it, but New Relic transport will be skipped
- **Snowflake**: Required for database testing endpoints to work properly
- **Environment Variables**: Use the provided `env.example` as a template

## Dependencies

The project includes additional dependencies for a complete testing environment:
- `express` - Web framework
- `dotenv` - Environment variable management
- `winston` - Core logging library

## Error Handling

The application includes comprehensive error handling and logging for security testing scenarios. All errors are logged with context information including timestamps, IP addresses, and request details.