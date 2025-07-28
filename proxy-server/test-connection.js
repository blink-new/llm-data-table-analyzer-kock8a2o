const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('Testing PostgreSQL connection...');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`SSL Mode: ${process.env.DB_SSL_MODE}`);

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      require: process.env.DB_SSL_MODE === 'require',
      rejectUnauthorized: process.env.DB_SSL_MODE === 'verify-full'
    },
    connectionTimeoutMillis: 30000
  });

  try {
    const startTime = Date.now();
    const client = await pool.connect();
    const latency = Date.now() - startTime;
    
    console.log(`✅ Connection successful! (${latency}ms)`);
    
    const result = await client.query('SELECT NOW() as server_time, version() as version');
    console.log(`📅 Server Time: ${result.rows[0].server_time}`);
    console.log(`🔧 Version: ${result.rows[0].version}`);
    
    // Test a simple query
    const tablesResult = await client.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    `);
    console.log(`📊 User Tables: ${tablesResult.rows[0].table_count}`);
    
    client.release();
    console.log('✅ Connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error Code:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Suggestion: Check if the hostname is correct');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Suggestion: Check if the server is running and port is correct');
    } else if (error.code === '28P01') {
      console.error('💡 Suggestion: Check username and password');
    } else if (error.code === '3D000') {
      console.error('💡 Suggestion: Check if the database exists');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('💡 Suggestion: Check network connectivity and firewall settings');
    }
  } finally {
    await pool.end();
  }
}

testConnection();