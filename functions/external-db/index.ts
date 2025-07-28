import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts"

interface DatabaseConnection {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl_mode?: string
}

interface QueryRequest {
  connection: DatabaseConnection
  query: string
  params?: any[]
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
    })
  }

  try {
    const { connection, query, params = [] }: QueryRequest = await req.json()

    console.log('Connecting to:', `${connection.username}@${connection.host}:${connection.port}/${connection.database}`)
    console.log('Executing query:', query)
    console.log('With params:', params)

    // Create PostgreSQL client
    const client = new Client({
      user: connection.username,
      database: connection.database,
      hostname: connection.host,
      port: connection.port,
      password: connection.password,
      tls: {
        enabled: connection.ssl_mode !== 'disable',
        enforce: connection.ssl_mode === 'require' || connection.ssl_mode === 'verify-ca' || connection.ssl_mode === 'verify-full',
        caCertificates: []
      }
    })

    try {
      // Connect to the database
      await client.connect()
      console.log('Successfully connected to PostgreSQL database')

      // Execute the query with parameters
      const result = await client.queryObject({
        text: query,
        args: params
      })

      await client.end()

      return new Response(JSON.stringify({
        success: true,
        data: result.rows,
        rowsAffected: result.rowCount || 0,
        message: 'Query executed successfully'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })

    } catch (dbError) {
      console.error('Database query error:', dbError)
      
      // Try to close connection if it was opened
      try {
        await client.end()
      } catch (closeError) {
        console.error('Error closing connection:', closeError)
      }

      return new Response(JSON.stringify({
        success: false,
        error: `Database query failed: ${dbError.message}`,
        details: dbError.toString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

  } catch (error) {
    console.error('External DB operation failed:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'External database operation failed',
      details: error.toString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})