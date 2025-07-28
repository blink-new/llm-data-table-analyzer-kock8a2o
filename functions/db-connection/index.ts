import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl_mode?: string;
  connection_timeout?: number;
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
  latency?: number;
}

serve(async (req) => {
  // Handle CORS for frontend calls
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { action, config } = await req.json();

    switch (action) {
      case 'test_connection':
        return await testConnection(config);
      case 'get_tables':
        return await getTables(config);
      case 'get_table_schema':
        return await getTableSchema(config);
      case 'execute_query':
        return await executeQuery(config);
      default:
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Invalid action' 
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});

async function testConnection(config: ConnectionConfig): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // Import PostgreSQL client
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    
    // Create connection configuration
    const clientConfig = {
      user: config.username,
      password: config.password,
      database: config.database,
      hostname: config.host,
      port: config.port,
      tls: getSslConfig(config.ssl_mode),
    };

    // Create client with timeout
    const client = new Client(clientConfig);
    
    // Set connection timeout
    const timeout = (config.connection_timeout || 30) * 1000;
    const connectionPromise = client.connect();
    
    // Race between connection and timeout
    await Promise.race([
      connectionPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), timeout)
      )
    ]);

    // Test with a simple query
    const result = await client.queryObject('SELECT version() as version, current_database() as database');
    const latency = Date.now() - startTime;
    
    // Close connection
    await client.end();

    const response: ConnectionTestResult = {
      success: true,
      message: 'Connection successful',
      latency,
      details: {
        version: result.rows[0]?.version,
        database: result.rows[0]?.database,
        connected_at: new Date().toISOString()
      }
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    const latency = Date.now() - startTime;
    
    const response: ConnectionTestResult = {
      success: false,
      message: getErrorMessage(error),
      latency,
      details: {
        error_type: error.name || 'DatabaseError',
        attempted_at: new Date().toISOString()
      }
    };

    return new Response(JSON.stringify(response), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

async function getTables(config: ConnectionConfig): Promise<Response> {
  try {
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    
    const client = new Client({
      user: config.username,
      password: config.password,
      database: config.database,
      hostname: config.host,
      port: config.port,
      tls: getSslConfig(config.ssl_mode),
    });

    await client.connect();

    // Get all tables in the database
    const result = await client.queryObject(`
      SELECT 
        table_name,
        table_schema,
        table_type
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_schema, table_name
    `);

    await client.end();

    return new Response(JSON.stringify({
      success: true,
      tables: result.rows
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: getErrorMessage(error)
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

async function getTableSchema(config: ConnectionConfig & { tableName: string }): Promise<Response> {
  try {
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    
    const client = new Client({
      user: config.username,
      password: config.password,
      database: config.database,
      hostname: config.host,
      port: config.port,
      tls: getSslConfig(config.ssl_mode),
    });

    await client.connect();

    // Get table schema information
    const result = await client.queryObject(`
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
      ORDER BY ordinal_position
    `, [config.tableName]);

    await client.end();

    return new Response(JSON.stringify({
      success: true,
      schema: result.rows
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: getErrorMessage(error)
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

async function executeQuery(config: ConnectionConfig & { query: string; params?: any[] }): Promise<Response> {
  try {
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    
    const client = new Client({
      user: config.username,
      password: config.password,
      database: config.database,
      hostname: config.host,
      port: config.port,
      tls: getSslConfig(config.ssl_mode),
    });

    await client.connect();

    // Execute the query
    const startTime = Date.now();
    const result = await client.queryObject(config.query, config.params || []);
    const executionTime = Date.now() - startTime;

    await client.end();

    return new Response(JSON.stringify({
      success: true,
      data: result.rows,
      rowCount: result.rowCount,
      executionTime,
      query: config.query
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: getErrorMessage(error),
      query: config.query
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

function getSslConfig(sslMode?: string) {
  switch (sslMode) {
    case 'disable':
      return false;
    case 'require':
    case 'verify-ca':
    case 'verify-full':
      return { enforce: true };
    case 'prefer':
    case 'allow':
    default:
      return { enforce: false };
  }
}

function getErrorMessage(error: any): string {
  if (error.message) {
    // Common PostgreSQL error patterns
    if (error.message.includes('ECONNREFUSED')) {
      return 'Connection refused. Please check if the database server is running and accessible.';
    }
    if (error.message.includes('ENOTFOUND')) {
      return 'Host not found. Please check the hostname or IP address.';
    }
    if (error.message.includes('authentication failed')) {
      return 'Authentication failed. Please check your username and password.';
    }
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      return 'Database does not exist. Please check the database name.';
    }
    if (error.message.includes('timeout')) {
      return 'Connection timeout. The database server may be slow to respond.';
    }
    if (error.message.includes('SSL')) {
      return 'SSL connection error. Please check your SSL configuration.';
    }
    
    return error.message;
  }
  
  return 'Unknown database connection error';
}