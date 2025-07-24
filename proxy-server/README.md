# PostgreSQL Proxy Server

A secure Node.js proxy server that provides a static IP interface for connecting to Azure PostgreSQL databases. This server acts as a secure gateway between your frontend application and your PostgreSQL database, enabling IP whitelisting in Azure.

## Features

- 🔒 **Secure API Key Authentication**
- 🌐 **CORS Support** with configurable origins
- ⚡ **Connection Pooling** for optimal performance
- 🛡️ **Rate Limiting** to prevent abuse
- 📝 **Comprehensive Logging** with Winston
- 🔍 **Input Validation** with Joi
- 🏥 **Health Check Endpoints**
- ⏱️ **Timeout Handling** for connections and queries
- 🔐 **SSL/TLS Support** with multiple modes

## Quick Start

### 1. Installation

```bash
cd proxy-server
npm install
```

### 2. Configuration

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your database and security settings:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_HOST=prism-dev2.postgres.database.azure.com
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password

# SSL Configuration
DB_SSL_MODE=require
DB_CONNECTION_TIMEOUT=30000
DB_QUERY_TIMEOUT=60000
DB_MAX_CONNECTIONS=20

# Security Configuration
API_KEY=your_secure_api_key_here
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Test Connection

Test your database connection before starting the server:

```bash
npm run test
```

### 4. Start Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

## API Endpoints

### Health Check
```http
GET /health
```

Returns server and database health status.

### Test Database Connection
```http
POST /api/test-connection
X-API-Key: your_api_key

{
  "host": "prism-dev2.postgres.database.azure.com",
  "port": 5432,
  "database": "your_db",
  "user": "your_user",
  "password": "your_password",
  "ssl_mode": "require"
}
```

### Execute SQL Query
```http
POST /api/query
X-API-Key: your_api_key

{
  "query": "SELECT * FROM users WHERE id = $1",
  "params": [123]
}
```

### Get Database Tables
```http
GET /api/tables
X-API-Key: your_api_key
```

### Get Table Schema
```http
GET /api/tables/:tableName/schema
X-API-Key: your_api_key
```

## Frontend Integration

Update your frontend service to use the proxy server:

```javascript
// src/services/proxyDb.ts
class ProxyDatabaseService {
  private baseUrl = 'https://your-static-ip-server.com';
  private apiKey = 'your_api_key';

  async executeQuery(query: string, params: any[] = []) {
    const response = await fetch(`${this.baseUrl}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({ query, params })
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getTables() {
    const response = await fetch(`${this.baseUrl}/api/tables`, {
      headers: { 'X-API-Key': this.apiKey }
    });
    return response.json();
  }

  async getTableSchema(tableName: string) {
    const response = await fetch(`${this.baseUrl}/api/tables/${tableName}/schema`, {
      headers: { 'X-API-Key': this.apiKey }
    });
    return response.json();
  }
}

export const proxyDb = new ProxyDatabaseService();
```

## Deployment Options

### Option 1: DigitalOcean Droplet
1. Create a DigitalOcean droplet with a static IP
2. Install Node.js and PM2
3. Clone your code and configure environment
4. Use PM2 to run the server with auto-restart

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name postgresql-proxy

# Save PM2 configuration
pm2 save
pm2 startup
```

### Option 2: AWS EC2 with Elastic IP
1. Launch an EC2 instance
2. Attach an Elastic IP address
3. Configure security groups for your ports
4. Deploy and run the proxy server

### Option 3: Google Cloud VM with Static IP
1. Create a VM instance with a static external IP
2. Configure firewall rules
3. Deploy the proxy server

## Azure PostgreSQL Configuration

1. **Add Static IP to Firewall Rules:**
   - Go to Azure Portal → PostgreSQL Server → Connection Security
   - Add your proxy server's static IP to allowed IPs
   - Enable "Allow access to Azure services" if needed

2. **SSL Configuration:**
   - Ensure SSL is enforced in Azure PostgreSQL settings
   - Use `ssl_mode: "require"` in your configuration

## Security Best Practices

1. **API Key Security:**
   - Use a strong, randomly generated API key
   - Rotate API keys regularly
   - Never commit API keys to version control

2. **Network Security:**
   - Use HTTPS in production
   - Configure firewall rules to restrict access
   - Consider VPN for additional security

3. **Database Security:**
   - Use dedicated database users with minimal privileges
   - Enable SSL/TLS for database connections
   - Regularly update database credentials

## Monitoring and Logging

The server includes comprehensive logging with Winston:

- **Error logs:** `logs/error.log`
- **Combined logs:** `logs/combined.log`
- **Console output:** Real-time logging to console

Monitor these logs for:
- Connection failures
- Query performance issues
- Security violations
- Rate limit hits

## Troubleshooting

### Connection Issues
1. Check if the database server is accessible from your proxy server
2. Verify firewall rules allow connections on port 5432
3. Confirm SSL configuration matches Azure requirements
4. Test connection using the test script: `npm run test`

### Performance Issues
1. Monitor connection pool usage
2. Check query execution times in logs
3. Consider increasing connection pool size
4. Optimize slow queries

### Security Issues
1. Monitor failed authentication attempts
2. Check rate limiting effectiveness
3. Review CORS configuration
4. Audit API key usage

## License

MIT License - see LICENSE file for details.