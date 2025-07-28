export interface DatabaseConnection {
  id: string
  name: string
  host: string
  port: number
  database: string
  username: string
  password: string
  status: string
  ssl_mode?: string
  connection_timeout?: number
  max_connections?: number
  description?: string
  last_connected?: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface SavedPrompt {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  isAutoExecute: boolean
  variables: PromptVariable[]
  createdAt: string
  userId: string
}

export interface PromptVariable {
  name: string
  type: 'text' | 'number' | 'date' | 'select'
  defaultValue?: string
  options?: string[]
}

export interface AICredentials {
  id: string
  provider: 'openai' | 'anthropic' | 'google'
  apiKey: string
  isActive: boolean
  usage: {
    tokensUsed: number
    estimatedCost: number
  }
  userId: string
}

export interface AIInstructions {
  id: string
  title: string
  content: string
  isGlobal: boolean
  projectId?: string
  userId: string
}

export interface TableSchema {
  name: string
  columns: ColumnDefinition[]
}

export interface ColumnDefinition {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  defaultValue?: string
}

export interface QueryResult {
  columns: string[]
  rows: any[]
  executionTime: number
  rowCount: number
}