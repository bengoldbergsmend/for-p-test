const express = require('express');
const winston = require('winston');
const WinstonToNewRelic = require('winston-to-newrelic-logs');
const FormData = require('form-data');
const snowflake = require('snowflake-sdk');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configure Winston logger with New Relic transport
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    // New Relic transport (requires API key in environment)
    ...(process.env.NEW_RELIC_LICENSE_KEY ? [
      new WinstonToNewRelic({
        licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
        level: 'info'
      })
    ] : [])
  ]
});

// Snowflake connection configuration
const snowflakeConnection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT || 'test-account',
  username: process.env.SNOWFLAKE_USERNAME || 'test-user',
  password: process.env.SNOWFLAKE_PASSWORD || 'test-password',
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
  database: process.env.SNOWFLAKE_DATABASE || 'TEST_DB',
  schema: process.env.SNOWFLAKE_SCHEMA || 'PUBLIC'
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes

// Health check endpoint
app.get('/', (req, res) => {
  logger.info('Health check endpoint accessed');
  res.json({ 
    message: 'Security Test Project is running',
    timestamp: new Date().toISOString(),
    libraries: ['winston-to-newrelic-logs', 'form-data', 'snowflake-sdk']
  });
});

// Test Winston to New Relic logging
app.post('/log-test', (req, res) => {
  const { message, level = 'info' } = req.body;
  
  logger.log(level, message || 'Test log message', {
    endpoint: '/log-test',
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true, message: 'Log sent successfully' });
});

// Test Form Data functionality
app.post('/form-data-test', (req, res) => {
  try {
    const form = new FormData();
    
    // Add various types of data to test form-data library
    form.append('text_field', 'Test text data');
    form.append('number_field', '12345');
    form.append('json_field', JSON.stringify({ test: 'data', array: [1, 2, 3] }));
    form.append('timestamp', new Date().toISOString());
    
    // Log the form data creation
    logger.info('Form data created successfully', {
      endpoint: '/form-data-test',
      fields: ['text_field', 'number_field', 'json_field', 'timestamp']
    });
    
    res.json({ 
      success: true, 
      message: 'Form data created successfully',
      headers: form.getHeaders(),
      length: form.getLengthSync()
    });
  } catch (error) {
    logger.error('Error creating form data', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test Snowflake connection
app.get('/snowflake-test', (req, res) => {
  snowflakeConnection.connect((err, conn) => {
    if (err) {
      logger.error('Failed to connect to Snowflake', { error: err.message });
      return res.status(500).json({ 
        success: false, 
        error: 'Snowflake connection failed',
        details: err.message 
      });
    }
    
    // Execute a simple query
    conn.execute({
      sqlText: 'SELECT CURRENT_VERSION() as version, CURRENT_TIMESTAMP() as timestamp',
      complete: (err, stmt, rows) => {
        if (err) {
          logger.error('Snowflake query failed', { error: err.message });
          return res.status(500).json({ 
            success: false, 
            error: 'Query execution failed',
            details: err.message 
          });
        }
        
        logger.info('Snowflake query executed successfully', { 
          rowCount: rows.length,
          queryId: stmt.getQueryId()
        });
        
        res.json({ 
          success: true, 
          message: 'Snowflake connection and query successful',
          data: rows,
          queryId: stmt.getQueryId()
        });
      }
    });
  });
});

// Test endpoint that uses all libraries together
app.post('/integration-test', (req, res) => {
  try {
    const { testData } = req.body;
    
    // 1. Create form data
    const form = new FormData();
    form.append('integration_test', JSON.stringify(testData || { test: 'integration' }));
    form.append('timestamp', new Date().toISOString());
    
    // 2. Log to New Relic via Winston
    logger.info('Integration test started', {
      endpoint: '/integration-test',
      formDataSize: form.getLengthSync(),
      testData: testData
    });
    
    // 3. Test Snowflake connection
    snowflakeConnection.connect((err, conn) => {
      if (err) {
        logger.error('Integration test - Snowflake connection failed', { error: err.message });
        return res.status(500).json({ 
          success: false, 
          step: 'snowflake_connection',
          error: err.message 
        });
      }
      
      conn.execute({
        sqlText: 'SELECT $1 as test_data, CURRENT_TIMESTAMP() as processed_at',
        binds: [JSON.stringify(testData || { test: 'integration' })],
        complete: (err, stmt, rows) => {
          if (err) {
            logger.error('Integration test - Snowflake query failed', { error: err.message });
            return res.status(500).json({ 
              success: false, 
              step: 'snowflake_query',
              error: err.message 
            });
          }
          
          logger.info('Integration test completed successfully', {
            formDataCreated: true,
            snowflakeQueryExecuted: true,
            queryId: stmt.getQueryId(),
            resultRows: rows.length
          });
          
          res.json({
            success: true,
            message: 'All libraries integrated successfully',
            results: {
              formData: {
                created: true,
                size: form.getLengthSync(),
                headers: form.getHeaders()
              },
              logging: {
                logged: true,
                transport: 'winston-to-newrelic'
              },
              snowflake: {
                connected: true,
                queryExecuted: true,
                queryId: stmt.getQueryId(),
                data: rows
              }
            }
          });
        }
      });
    });
    
  } catch (error) {
    logger.error('Integration test failed', { error: error.message });
    res.status(500).json({ 
      success: false, 
      step: 'general_error',
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  logger.info(`Security test project started on port ${port}`, {
    port: port,
    nodeVersion: process.version,
    platform: process.platform
  });
  
  console.log(`🚀 Security Test Project running on http://localhost:${port}`);
  console.log(`📊 Endpoints available:`);
  console.log(`   GET  / - Health check`);
  console.log(`   POST /log-test - Test Winston to New Relic logging`);
  console.log(`   POST /form-data-test - Test Form Data functionality`);
  console.log(`   GET  /snowflake-test - Test Snowflake connection`);
  console.log(`   POST /integration-test - Test all libraries together`);
});

module.exports = app;