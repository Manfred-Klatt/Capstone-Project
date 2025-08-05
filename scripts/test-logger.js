const logger = require('../src/utils/logger');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// Test basic logging
logger.info('Starting logger test');

// Test different log levels
logger.debug('This is a debug message', { debug: true });
logger.info('This is an info message', { info: true });
logger.warn('This is a warning message', { warning: true });
logger.error('This is an error message', { error: new Error('Test error') });

// Test performance timing
const testPerformance = () => {
  logger.info('Testing performance timers...');
  
  // Simple timer
  const timer1 = logger.startTimer('simple-operation');
  setTimeout(() => {
    timer1.end({ result: 'success', type: 'simple' });
  }, 150);
  
  // Nested timers
  const timer2 = logger.startTimer('nested-operations');
  const innerTimer1 = logger.startTimer('nested-1');
  
  setTimeout(() => {
    innerTimer1.end({ step: 1 });
    
    const innerTimer2 = logger.startTimer('nested-2');
    setTimeout(() => {
      innerTimer2.end({ step: 2 });
      timer2.end({ result: 'success', type: 'nested' });
    }, 100);
  }, 100);
};

// Test request logging simulation
const testRequestLogging = () => {
  logger.info('Testing request logging...');
  
  const mockRequest = (method, path, statusCode, requestId) => ({
    method,
    originalUrl: path,
    ip: '127.0.0.1',
    id: requestId || uuidv4(),
    headers: {
      'user-agent': 'Test-Agent/1.0',
      'x-request-id': requestId || uuidv4(),
      'accept': 'application/json',
      'content-type': 'application/json'
    },
    get(header) {
      return this.headers[header.toLowerCase()];
    }
  });

  const mockResponse = (statusCode) => {
    const res = {
      statusCode,
      get: (header) => {
        const headers = {
          'content-length': '1024',
          'content-type': 'application/json'
        };
        return headers[header.toLowerCase()];
      },
      on: function(event, callback) {
        if (event === 'finish') {
          // Simulate response finish after a short delay
          setTimeout(callback, 50);
        }
      }
    };
    return res;
  };

  // Test successful request
  const req1 = mockRequest('GET', '/api/test/success', 200);
  const res1 = mockResponse(200);
  
  // Test client error
  const req2 = mockRequest('POST', '/api/test/not-found', 404);
  const res2 = mockResponse(404);
  
  // Test server error
  const req3 = mockRequest('GET', '/api/test/error', 500);
  const res3 = mockResponse(500);
  
  // Process requests with a small delay between them
  const next = () => console.log('Next middleware called');
  
  logger.requests(req1, res1, next);
  
  setTimeout(() => {
    logger.requests(req2, res2, next);
    
    setTimeout(() => {
      logger.requests(req3, res3, next);
    }, 100);
  }, 100);
};

// Test error handling
const testErrorHandling = () => {
  logger.info('Testing error handling...');
  
  // Unhandled rejection
  Promise.reject(new Error('Test unhandled rejection'));
  
  // Uncaught exception
  setTimeout(() => {
    const error = new Error('Test uncaught exception');
    error.code = 'TEST_ERROR';
    error.context = { test: true };
    throw error;
  }, 200);
};

// Run all tests
const runTests = async () => {
  try {
    testPerformance();
    
    // Wait a bit before starting request tests
    setTimeout(() => {
      testRequestLogging();
      
      // Test error handling after request tests
      setTimeout(testErrorHandling, 500);
    }, 300);
    
    // Keep the process alive to see all logs
    setTimeout(() => {
      logger.info('Logger test completed');
      process.exit(0);
    }, 3000);
    
  } catch (error) {
    logger.error('Test failed', { error });
    process.exit(1);
  }
};

// Start the tests
runTests();
