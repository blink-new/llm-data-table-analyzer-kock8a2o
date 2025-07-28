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

interface QueryResult {
  success: boolean;
  data?: any[];
  rowCount?: number;
  executionTime?: number;
  query?: string;
  message?: string;
}

const DB_CONNECTION_FUNCTION_URL = 'https://kock8a2o--db-connection.functions.blink.new';

export class DatabaseConnectionService {
  static async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    try {
      const response = await fetch(DB_CONNECTION_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_connection',
          config
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Network error: ${error.message}`,
        details: { error_type: 'NetworkError' }
      };
    }
  }

  static async getTables(config: ConnectionConfig): Promise<{ success: boolean; tables?: TableInfo[]; message?: string }> {
    try {
      const response = await fetch(DB_CONNECTION_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_tables',
          config
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Network error: ${error.message}`
      };
    }
  }

  static async getTableSchema(config: ConnectionConfig, tableName: string): Promise<{ success: boolean; schema?: ColumnInfo[]; message?: string }> {
    try {
      const response = await fetch(DB_CONNECTION_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_table_schema',
          config: { ...config, tableName }
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Network error: ${error.message}`
      };
    }
  }

  static async executeQuery(config: ConnectionConfig, query: string, params?: any[]): Promise<QueryResult> {
    try {
      const response = await fetch(DB_CONNECTION_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'execute_query',
          config: { ...config, query, params }
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Network error: ${error.message}`,
        query
      };
    }
  }

  static async createTable(config: ConnectionConfig, tableName: string, columns: Array<{
    name: string;
    type: string;
    nullable?: boolean;
    primaryKey?: boolean;
    defaultValue?: string;
  }>): Promise<QueryResult> {
    // Generate CREATE TABLE SQL
    const columnDefinitions = columns.map(col => {
      let definition = `"${col.name}" ${col.type}`;
      
      if (col.primaryKey) {
        definition += ' PRIMARY KEY';
      }
      
      if (!col.nullable && !col.primaryKey) {
        definition += ' NOT NULL';
      }
      
      if (col.defaultValue) {
        definition += ` DEFAULT ${col.defaultValue}`;
      }
      
      return definition;
    }).join(', ');

    const createTableSQL = `CREATE TABLE "${tableName}" (${columnDefinitions})`;
    
    return this.executeQuery(config, createTableSQL);
  }

  static async dropTable(config: ConnectionConfig, tableName: string): Promise<QueryResult> {
    const dropTableSQL = `DROP TABLE IF EXISTS "${tableName}"`;
    return this.executeQuery(config, dropTableSQL);
  }

  static async insertData(config: ConnectionConfig, tableName: string, data: Record<string, any>): Promise<QueryResult> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    
    const insertSQL = `INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders})`;
    
    return this.executeQuery(config, insertSQL, values);
  }

  static async selectData(config: ConnectionConfig, tableName: string, limit = 100): Promise<QueryResult> {
    const selectSQL = `SELECT * FROM "${tableName}" LIMIT $1`;
    return this.executeQuery(config, selectSQL, [limit]);
  }
}