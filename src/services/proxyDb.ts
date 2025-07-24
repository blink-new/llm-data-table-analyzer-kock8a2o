interface QueryResult {
  success: boolean;
  data?: {
    rows: any[];
    rowCount: number;
    fields?: Array<{
      name: string;
      dataTypeID: number;
    }>;
    executionTime: string;
  };
  error?: string;
  code?: string;
  details?: string;
}

interface ConnectionTestResult {
  success: boolean;
  message?: string;
  latency?: string;
  server_info?: {
    server_time: string;
    version: string;
  };
  error?: string;
  code?: string;
  details?: string;
}

interface TableInfo {
  table_name: string;
  table_schema: string;
  table_type: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
}

interface TableSchema {
  success: boolean;
  data?: {
    table_name: string;
    columns: ColumnInfo[];
  };
  error?: string;
}

class ProxyDatabaseService {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    return response;
  }

  async testConnection(connectionDetails: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl_mode?: string;
  }): Promise<ConnectionTestResult> {
    try {
      const response = await this.makeRequest('/api/test-connection', {
        method: 'POST',
        body: JSON.stringify(connectionDetails),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Network error: Unable to connect to proxy server',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
    try {
      const response = await this.makeRequest('/api/query', {
        method: 'POST',
        body: JSON.stringify({ query, params }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Network error: Unable to execute query',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getTables(): Promise<{ success: boolean; data?: TableInfo[]; error?: string }> {
    try {
      const response = await this.makeRequest('/api/tables');
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Network error: Unable to fetch tables',
      };
    }
  }

  async getTableSchema(tableName: string): Promise<TableSchema> {
    try {
      const response = await this.makeRequest(`/api/tables/${encodeURIComponent(tableName)}/schema`);
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Network error: Unable to fetch table schema',
      };
    }
  }

  async checkHealth(): Promise<{ success: boolean; status?: string; database?: any; error?: string }> {
    try {
      const response = await this.makeRequest('/health');
      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Network error: Unable to check server health',
      };
    }
  }

  // Convenience methods for common operations
  async createTable(tableName: string, columns: Array<{
    name: string;
    type: string;
    nullable?: boolean;
    defaultValue?: string;
    primaryKey?: boolean;
  }>): Promise<QueryResult> {
    const columnDefinitions = columns.map(col => {
      let definition = `${col.name} ${col.type}`;
      
      if (col.primaryKey) {
        definition += ' PRIMARY KEY';
      }
      
      if (col.nullable === false) {
        definition += ' NOT NULL';
      }
      
      if (col.defaultValue) {
        definition += ` DEFAULT ${col.defaultValue}`;
      }
      
      return definition;
    }).join(', ');

    const query = `CREATE TABLE ${tableName} (${columnDefinitions})`;
    return this.executeQuery(query);
  }

  async insertRecord(tableName: string, data: Record<string, any>): Promise<QueryResult> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    return this.executeQuery(query, values);
  }

  async updateRecord(tableName: string, id: any, data: Record<string, any>): Promise<QueryResult> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
    
    const query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`;
    return this.executeQuery(query, [...values, id]);
  }

  async deleteRecord(tableName: string, id: any): Promise<QueryResult> {
    const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;
    return this.executeQuery(query, [id]);
  }

  async selectRecords(tableName: string, options: {
    where?: Record<string, any>;
    orderBy?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<QueryResult> {
    let query = `SELECT * FROM ${tableName}`;
    const params: any[] = [];
    let paramIndex = 1;

    if (options.where && Object.keys(options.where).length > 0) {
      const whereConditions = Object.entries(options.where).map(([key, value]) => {
        params.push(value);
        return `${key} = $${paramIndex++}`;
      });
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    }

    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
    }

    if (options.offset) {
      query += ` OFFSET ${options.offset}`;
    }

    return this.executeQuery(query, params);
  }
}

// Export a configured instance
// You'll need to replace these with your actual proxy server details
const PROXY_SERVER_URL = process.env.REACT_APP_PROXY_SERVER_URL || 'https://your-static-ip-server.com';
const PROXY_API_KEY = process.env.REACT_APP_PROXY_API_KEY || 'your_api_key_here';

export const proxyDb = new ProxyDatabaseService(PROXY_SERVER_URL, PROXY_API_KEY);
export { ProxyDatabaseService };
export type { QueryResult, ConnectionTestResult, TableInfo, ColumnInfo, TableSchema };