import { blink } from '@/blink/client'

interface DatabaseConnection {
  id: string
  name: string
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl_mode?: string
}

interface QueryResult {
  success: boolean
  data?: any[]
  error?: string
  message?: string
  rowsAffected?: number
}

class ExternalDbService {
  private functionUrl = 'https://kock8a2o--external-db.functions.blink.new'

  async executeQuery(connectionId: string, query: string, params: any[] = []): Promise<QueryResult> {
    try {
      // Get the connection details from Blink's internal database
      const connection = await blink.db.database_connections.list({
        where: { id: connectionId }
      })

      if (!connection || connection.length === 0) {
        throw new Error('Database connection not found')
      }

      const conn = connection[0]
      const dbConnection = {
        host: conn.host,
        port: conn.port,
        database: conn.database, // Use the correct field name
        username: conn.username,
        password: conn.password,
        ssl_mode: conn.ssl_mode
      }

      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          connection: dbConnection,
          query,
          params
        })
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error('External DB query failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async getAuthToken(): Promise<string> {
    try {
      const user = await blink.auth.me()
      return user.id // Use user ID as token for now
    } catch {
      return 'anonymous'
    }
  }

  // Initialize external database schema
  async initializeSchema(connectionId: string): Promise<QueryResult> {
    const createTablesQuery = `
      -- Create saved_prompts table
      CREATE TABLE IF NOT EXISTS saved_prompts (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        prompt TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        tags TEXT[], -- PostgreSQL array type
        auto_execute BOOLEAN DEFAULT FALSE,
        is_starred BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used TIMESTAMP,
        usage_count INTEGER DEFAULT 0,
        variables JSONB,
        description TEXT
      );

      -- Create api_credentials table
      CREATE TABLE IF NOT EXISTS api_credentials (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        provider_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        api_key TEXT NOT NULL,
        model VARCHAR(255) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        last_tested TIMESTAMP,
        status VARCHAR(50) DEFAULT 'untested',
        usage_data JSONB,
        settings JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create ai_personas table
      CREATE TABLE IF NOT EXISTS ai_personas (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        instructions TEXT NOT NULL,
        tone VARCHAR(100) NOT NULL,
        expertise TEXT[],
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create ai_settings table
      CREATE TABLE IF NOT EXISTS ai_settings (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        default_persona VARCHAR(255),
        temperature DECIMAL(3,2) DEFAULT 0.7,
        max_tokens INTEGER DEFAULT 2048,
        top_p DECIMAL(3,2) DEFAULT 0.9,
        frequency_penalty DECIMAL(3,2) DEFAULT 0,
        presence_penalty DECIMAL(3,2) DEFAULT 0,
        response_format VARCHAR(50) DEFAULT 'detailed',
        include_explanations BOOLEAN DEFAULT TRUE,
        show_confidence BOOLEAN DEFAULT FALSE,
        enable_context_memory BOOLEAN DEFAULT TRUE,
        max_context_length INTEGER DEFAULT 4000,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON saved_prompts(user_id);
      CREATE INDEX IF NOT EXISTS idx_api_credentials_user_id ON api_credentials(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_personas_user_id ON ai_personas(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_settings_user_id ON ai_settings(user_id);
    `

    return this.executeQuery(connectionId, createTablesQuery)
  }

  // Saved Prompts operations
  async getSavedPrompts(connectionId: string, userId: string): Promise<any[]> {
    const result = await this.executeQuery(
      connectionId,
      'SELECT * FROM saved_prompts WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    return result.success ? result.data || [] : []
  }

  async createSavedPrompt(connectionId: string, prompt: any): Promise<QueryResult> {
    return this.executeQuery(
      connectionId,
      `INSERT INTO saved_prompts (id, user_id, name, prompt, category, tags, auto_execute, is_starred, created_at, usage_count, variables, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        prompt.id,
        prompt.user_id,
        prompt.name,
        prompt.prompt,
        prompt.category,
        prompt.tags,
        prompt.auto_execute,
        prompt.is_starred,
        prompt.created_at,
        prompt.usage_count,
        JSON.stringify(prompt.variables),
        prompt.description
      ]
    )
  }

  async updateSavedPrompt(connectionId: string, id: string, prompt: any): Promise<QueryResult> {
    return this.executeQuery(
      connectionId,
      `UPDATE saved_prompts SET name = $1, prompt = $2, category = $3, tags = $4, auto_execute = $5, 
       variables = $6, description = $7 WHERE id = $8`,
      [
        prompt.name,
        prompt.prompt,
        prompt.category,
        prompt.tags,
        prompt.auto_execute,
        JSON.stringify(prompt.variables),
        prompt.description,
        id
      ]
    )
  }

  async deleteSavedPrompt(connectionId: string, id: string): Promise<QueryResult> {
    return this.executeQuery(connectionId, 'DELETE FROM saved_prompts WHERE id = $1', [id])
  }

  // API Credentials operations
  async getApiCredentials(connectionId: string, userId: string): Promise<any[]> {
    const result = await this.executeQuery(
      connectionId,
      'SELECT * FROM api_credentials WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    return result.success ? result.data || [] : []
  }

  async createApiCredential(connectionId: string, credential: any): Promise<QueryResult> {
    return this.executeQuery(
      connectionId,
      `INSERT INTO api_credentials (id, user_id, provider_id, name, api_key, model, is_default, is_active, status, settings, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        credential.id,
        credential.user_id,
        credential.provider_id,
        credential.name,
        credential.api_key,
        credential.model,
        credential.is_default,
        credential.is_active,
        credential.status,
        JSON.stringify(credential.settings),
        credential.created_at
      ]
    )
  }

  // AI Personas operations
  async getAiPersonas(connectionId: string, userId: string): Promise<any[]> {
    const result = await this.executeQuery(
      connectionId,
      'SELECT * FROM ai_personas WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    return result.success ? result.data || [] : []
  }

  async createAiPersona(connectionId: string, persona: any): Promise<QueryResult> {
    return this.executeQuery(
      connectionId,
      `INSERT INTO ai_personas (id, user_id, name, description, instructions, tone, expertise, is_default, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        persona.id,
        persona.user_id,
        persona.name,
        persona.description,
        persona.instructions,
        persona.tone,
        persona.expertise,
        persona.is_default,
        persona.created_at
      ]
    )
  }

  // AI Settings operations
  async getAiSettings(connectionId: string, userId: string): Promise<any> {
    const result = await this.executeQuery(
      connectionId,
      'SELECT * FROM ai_settings WHERE user_id = $1 LIMIT 1',
      [userId]
    )
    return result.success && result.data && result.data.length > 0 ? result.data[0] : null
  }

  async saveAiSettings(connectionId: string, settings: any): Promise<QueryResult> {
    // Use UPSERT (INSERT ... ON CONFLICT)
    return this.executeQuery(
      connectionId,
      `INSERT INTO ai_settings (id, user_id, default_persona, temperature, max_tokens, top_p, frequency_penalty, presence_penalty, response_format, include_explanations, show_confidence, enable_context_memory, max_context_length, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (user_id) DO UPDATE SET
       default_persona = $3, temperature = $4, max_tokens = $5, top_p = $6, frequency_penalty = $7, presence_penalty = $8,
       response_format = $9, include_explanations = $10, show_confidence = $11, enable_context_memory = $12, max_context_length = $13, updated_at = $14`,
      [
        settings.id,
        settings.user_id,
        settings.default_persona,
        settings.temperature,
        settings.max_tokens,
        settings.top_p,
        settings.frequency_penalty,
        settings.presence_penalty,
        settings.response_format,
        settings.include_explanations,
        settings.show_confidence,
        settings.enable_context_memory,
        settings.max_context_length,
        settings.updated_at
      ]
    )
  }

  // Get available tables from external database
  async getTables(connectionId: string): Promise<any[]> {
    const result = await this.executeQuery(
      connectionId,
      `SELECT table_name, table_schema 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name`
    )
    return result.success ? result.data || [] : []
  }

  // Get table schema
  async getTableSchema(connectionId: string, tableName: string): Promise<any[]> {
    const result = await this.executeQuery(
      connectionId,
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns 
       WHERE table_name = $1 AND table_schema = 'public'
       ORDER BY ordinal_position`,
      [tableName]
    )
    return result.success ? result.data || [] : []
  }

  // Execute custom analysis query
  async executeAnalysisQuery(connectionId: string, query: string): Promise<QueryResult> {
    return this.executeQuery(connectionId, query)
  }
}

export const externalDb = new ExternalDbService()