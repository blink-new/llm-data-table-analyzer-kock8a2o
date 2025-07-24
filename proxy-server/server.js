const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const Joi = require('joi');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'postgresql-proxy' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// PostgreSQL connection pool configuration
const poolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    require: true,
    rejectUnauthorized: process.env.DB_SSL_MODE === 'verify-full'
  },
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 60000,
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  idleTimeoutMillis: 30000,
  allowExitOnIdle: false
};

// Create PostgreSQL connection pool
const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

// Middleware configuration
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn('Unauthorized access attempt', { 
      ip: req.ip, 
      userAgent: req.get('User-Agent'),
      path: req.path 
    });
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized: Invalid or missing API key' 
    });
  }
  
  next();
};

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Validation schemas
const querySchema = Joi.object({
  query: Joi.string().required().max(10000),
  params: Joi.array().items(Joi.any()).optional().default([])
});

const connectionTestSchema = Joi.object({
  host: Joi.string().required(),
  port: Joi.number().integer().min(1).max(65535).default(5432),
  database: Joi.string().required(),
  user: Joi.string().required(),
  password: Joi.string().required(),
  ssl_mode: Joi.string().valid('disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full').default('require')
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as server_time, version() as version');
    client.release();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        server_time: result.rows[0].server_time,
        version: result.rows[0].version
      }
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});

// Test database connection endpoint
app.post('/api/test-connection', authenticateApiKey, async (req, res) => {
  try {
    const { error, value } = connectionTestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const { host, port, database, user, password, ssl_mode } = value;
    
    const testPool = new Pool({
      host,
      port,
      database,
      user,
      password,
      ssl: {
        require: ssl_mode !== 'disable',
        rejectUnauthorized: ssl_mode === 'verify-full'
      },
      connectionTimeoutMillis: 10000,
      max: 1
    });

    const startTime = Date.now();
    const client = await testPool.connect();
    const result = await client.query('SELECT NOW() as server_time, version() as version');
    const latency = Date.now() - startTime;
    
    client.release();
    await testPool.end();

    logger.info('Connection test successful', { host, database, user, latency });

    res.json({
      success: true,
      message: 'Connection successful',
      latency: `${latency}ms`,
      server_info: {
        server_time: result.rows[0].server_time,
        version: result.rows[0].version
      }
    });

  } catch (error) {
    logger.error('Connection test failed', error);
    
    let errorMessage = 'Connection failed';
    if (error.code === 'ENOTFOUND') {
      errorMessage = 'Host not found. Please check the hostname.';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused. Please check if the server is running and the port is correct.';
    } else if (error.code === '28P01') {
      errorMessage = 'Authentication failed. Please check your username and password.';
    } else if (error.code === '3D000') {
      errorMessage = 'Database does not exist.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection timeout. Please check your network connection and firewall settings.';
    }

    res.status(400).json({
      success: false,
      error: errorMessage,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Execute SQL query endpoint
app.post('/api/query', authenticateApiKey, async (req, res) => {
  const startTime = Date.now();
  let client;

  try {
    const { error, value } = querySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const { query, params } = value;

    // Log the query (without sensitive data)
    logger.info('Executing query', { 
      queryLength: query.length,
      paramCount: params.length,
      ip: req.ip
    });

    client = await pool.connect();
    const result = await client.query(query, params);
    const executionTime = Date.now() - startTime;

    logger.info('Query executed successfully', {
      executionTime: `${executionTime}ms`,
      rowCount: result.rowCount
    });

    res.json({
      success: true,
      data: {
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields?.map(field => ({
          name: field.name,
          dataTypeID: field.dataTypeID
        })),
        executionTime: `${executionTime}ms`
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Query execution failed', {
      error: error.message,
      code: error.code,
      executionTime: `${executionTime}ms`
    });

    let errorMessage = 'Query execution failed';
    if (error.code === '42P01') {
      errorMessage = 'Table does not exist';
    } else if (error.code === '42703') {
      errorMessage = 'Column does not exist';
    } else if (error.code === '23505') {
      errorMessage = 'Duplicate key value violates unique constraint';
    } else if (error.code === '23503') {
      errorMessage = 'Foreign key constraint violation';
    }

    res.status(400).json({
      success: false,
      error: errorMessage,
      code: error.code,
      executionTime: `${executionTime}ms`,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });

  } finally {
    if (client) {
      client.release();
    }
  }
});

// Get database tables endpoint
app.get('/api/tables', authenticateApiKey, async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        table_name,
        table_schema,
        table_type
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_schema, table_name
    `);
    client.release();

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    logger.error('Failed to fetch tables', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tables',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get table schema endpoint
app.get('/api/tables/:tableName/schema', authenticateApiKey, async (req, res) => {
  try {
    const { tableName } = req.params;
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY ordinal_position
    `, [tableName]);
    
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Table not found'
      });
    }

    res.json({
      success: true,
      data: {
        table_name: tableName,
        columns: result.rows
      }
    });

  } catch (error) {
    logger.error('Failed to fetch table schema', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch table schema',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`PostgreSQL Proxy Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Database Host: ${process.env.DB_HOST}`);
});

module.exports = app;