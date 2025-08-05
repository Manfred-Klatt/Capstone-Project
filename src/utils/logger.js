const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, align, metadata } = format;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const fs = require('fs');
const util = require('util');
const DailyRotateFile = require('winston-daily-rotate-file');
const stripAnsi = require('strip-ansi');
const sensitiveFields = ['password', 'token', 'authorization', 'apiKey', 'apikey', 'secret'];

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true, mode: 0o755 });
}

// Generate a unique instance ID for this process
const instanceId = uuidv4();
const hostname = os.hostname();
const pid = process.pid;

// Request ID management
const requestId = format((info, opts) => {
  info.requestId = global.requestId || 'no-request';
  return info;
});

// Sanitize sensitive data
const sanitize = format((info) => {
  if (!info.meta) return info;
  
  const sanitizeValue = (value) => {
    if (typeof value === 'string' && sensitiveFields.some(field => 
      value.toLowerCase().includes(field.toLowerCase())
    )) {
      return '[REDACTED]';
    }
    if (value && typeof value === 'object') {
      const sanitized = {};
      Object.keys(value).forEach(key => {
        if (sensitiveFields.includes(key.toLowerCase())) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value[key] === 'object' && value[key] !== null) {
          sanitized[key] = sanitizeValue(value[key]);
        } else {
          sanitized[key] = value[key];
        }
      });
      return sanitized;
    }
    return value;
  };

  info.meta = sanitizeValue(info.meta);
  return info;
});

// Enhanced log format
const jsonFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  // Handle Error objects
  const errorInfo = {};
  if (message instanceof Error) {
    errorInfo.message = message.message;
    errorInfo.stack = message.stack;
  }

  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    instanceId,
    hostname,
    pid,
    message: stack || message,
    ...(Object.keys(meta.meta || {}).length > 0 && { meta: meta.meta }),
    ...errorInfo
  };
  
  // Remove undefined values and circular references
  const cleanLogEntry = (obj) => {
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      try {
        if (obj[key] !== undefined && obj[key] !== null) {
          if (typeof obj[key] === 'object' && !(obj[key] instanceof Error)) {
            cleaned[key] = cleanLogEntry(obj[key]);
          } else {
            cleaned[key] = obj[key];
          }
        }
      } catch (e) {
        cleaned[key] = '[Circular or non-serializable]';
      }
    });
    return cleaned;
  };
  
  return JSON.stringify(cleanLogEntry(logEntry));
});

// Console format for development
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta.meta || {}).length > 0 
    ? '\n' + util.inspect(meta.meta, { colors: true, depth: null, compact: false })
    : '';
  
  return `${timestamp} [${level}] ${message} ${stack || ''}${metaString}`;
});

// Create logger instance with different formats for file and console
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.errors({ stack: true }),
    requestId(),
    sanitize(),
    metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    jsonFormat
  ),
  defaultMeta: { 
    service: 'acnh-quiz-api',
    env: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '0.0.1',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  },
  transports: [
    // Application logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '50m',
      maxFiles: '30d',
      level: 'info',
      json: true,
      utc: true,
      extension: '.log'
    }),
    // Error logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '50m',
      maxFiles: '90d',
      level: 'error',
      json: true,
      utc: true,
      extension: '.log'
    }),
    // Audit logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '50m',
      maxFiles: '365d',
      level: 'info',
      json: true,
      utc: true,
      extension: '.log',
      filter: (info) => info.audit === true
    })
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '50m',
      maxFiles: '30d',
      json: true,
      utc: true,
      extension: '.log'
    })
  ],
  exitOnError: false,
  handleExceptions: true,
  handleRejections: true
});

// Add console transport for non-production with colorized output
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    level: 'debug',
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'HH:mm:ss.SSS' }),
      format.simple(),
      consoleFormat
    ),
    handleExceptions: true,
    handleRejections: true
  }));
} else {
  // In production, log to console as JSON
  logger.add(new transports.Console({
    level: 'info',
    format: combine(
      timestamp(),
      jsonFormat
    )
  }));
}

// Add request ID middleware
logger.requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  
  // Store request ID for this request
  global.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  // Add request ID to response locals
  res.locals.requestId = requestId;
  
  next();
};

// Add request logging middleware
logger.requests = (req, res, next) => {
  const start = process.hrtime();
  const requestId = global.requestId || 'no-request-id';
  
  // Skip logging for health checks and static files
  if (req.path === '/health' || req.path.startsWith('/static')) {
    return next();
  }
  
  // Log request start
  logger.info('Request started', {
    meta: {
      type: 'request',
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      query: req.query,
      params: req.params,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      referrer: req.get('referer') || '',
      protocol: req.protocol,
      host: req.get('host'),
      requestId
    }
  });

  // Log response when finished
  res.on('finish', () => {
    const hrTime = process.hrtime(start);
    const duration = (hrTime[0] * 1000 + hrTime[1] / 1e6).toFixed(2); // in ms
    
    const logData = {
      type: 'response',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      contentLength: res.get('content-length') || '0',
      contentType: res.get('content-type') || '',
      requestId,
      user: req.user ? req.user.id : 'anonymous'
    };
    
    // Log at appropriate level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request error', { meta: logData });
    } else if (res.statusCode >= 400) {
      logger.warn('Request warning', { meta: logData });
    } else {
      logger.info('Request completed', { meta: logData });
    }
  });

  // Handle errors
  res.on('error', (err) => {
    logger.error('Response error', {
      meta: {
        error: err.message,
        stack: err.stack,
        requestId,
        url: req.originalUrl,
        method: req.method
      }
    });
  });

  next();
};

// Add audit logging
logger.audit = (action, data = {}) => {
  logger.info(`AUDIT: ${action}`, {
    audit: true,
    action,
    timestamp: new Date().toISOString(),
    user: data.userId || 'system',
    ip: data.ip || 'unknown',
    meta: {
      ...data,
      // Remove sensitive data that might be in the data object
      password: undefined,
      token: undefined,
      refreshToken: undefined
    }
  });
};

// Add performance monitoring with more detailed metrics
logger.startTimer = (operation, meta = {}) => {
  const start = process.hrtime();
  const startMemory = process.memoryUsage();
  const startCpu = process.cpuUsage();
  const timerId = uuidv4();
  
  // Log operation start
  logger.debug(`Operation started: ${operation}`, {
    meta: {
      type: 'performance',
      operation,
      timerId,
      startTime: new Date().toISOString(),
      memoryUsage: startMemory,
      cpuUsage: startCpu,
      ...meta
    }
  });
  
  return {
    id: timerId,
    operation,
    end: (endMeta = {}) => {
      const endMemory = process.memoryUsage();
      const endCpu = process.cpuUsage(startCpu);
      const diff = process.hrtime(start);
      const duration = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2); // in ms
      
      const memoryDiff = {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - (startMemory.external || 0)
      };
      
      const logData = {
        type: 'performance',
        operation,
        timerId,
        duration: `${duration}ms`,
        durationMs: parseFloat(duration),
        endTime: new Date().toISOString(),
        memory: {
          start: startMemory,
          end: endMemory,
          diff: memoryDiff
        },
        cpu: {
          user: endCpu.user / 1000, // convert to ms
          system: endCpu.system / 1000 // convert to ms
        },
        ...meta,
        ...endMeta
      };
      
      // Log at appropriate level based on duration
      const durationMs = parseFloat(duration);
      if (durationMs > 1000) {
        logger.warn(`Slow operation: ${operation} took ${duration}ms`, { meta: logData });
      } else if (durationMs > 500) {
        logger.info(`Operation completed: ${operation}`, { meta: logData });
      } else {
        logger.debug(`Operation completed: ${operation}`, { meta: logData });
      }
      
      return {
        duration: durationMs,
        memory: memoryDiff,
        cpu: logData.cpu
      };
    }
  };
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    meta: {
      type: 'unhandledRejection',
      reason: reason instanceof Error ? {
        message: reason.message,
        name: reason.name,
        stack: reason.stack,
        ...reason
      } : reason,
      promise: {
        isPending: promise.isPending(),
        isFulfilled: promise.isFulfilled ? promise.isFulfilled() : undefined,
        isRejected: promise.isRejected ? promise.isRejected() : undefined
      }
    }
  });
  
  // In production, consider whether to exit the process
  if (process.env.NODE_ENV === 'production') {
    // Give some time to log the error before exiting
    setTimeout(() => process.exit(1), 1000);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    meta: {
      type: 'uncaughtException',
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
        ...error
      },
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  });
  
  // In production, exit after logging
  if (process.env.NODE_ENV === 'production') {
    // Give some time to log the error before exiting
    setTimeout(() => process.exit(1), 1000);
  }
});

// Handle process warnings
process.on('warning', (warning) => {
  logger.warn('Process Warning', {
    meta: {
      type: 'processWarning',
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
      code: warning.code
    }
  });
});

// Handle process exit
process.on('exit', (code) => {
  logger.info('Process exiting', {
    meta: {
      type: 'processExit',
      code,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  });
});

// Handle process signals
const handleShutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully...`, {
    meta: {
      type: 'shutdown',
      signal,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  });
  
  // Close any open connections, etc.
  process.exit(0);
};

// Listen for shutdown signals
['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal => {
  process.on(signal, () => handleShutdown(signal));
});

module.exports = logger;
