import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  BarChart3, 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Database, 
  Download, 
  Share, 
  Bookmark,
  TrendingUp,
  PieChart,
  LineChart,
  Filter,
  Search,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  Settings,
  Zap
} from 'lucide-react'
import { blink } from '@/blink/client'
import { DatabaseConnectionService } from '@/services/dbConnection'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  query?: string
  results?: any
  chartType?: string
  isLoading?: boolean
}

interface DatabaseConnection {
  id: string
  name: string
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl_mode: string
  status: string
}

interface DataTable {
  name: string
  columns: string[]
  rowCount: number
  lastUpdated: Date
}

interface AnalysisResult {
  query: string
  data: any[]
  insights: string[]
  chartSuggestions: string[]
  executionTime: string
  selectedTable?: string
}

const DataAnalyzer: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI data analyst. I can help you analyze your external PostgreSQL database. I will automatically select the most appropriate database connection and tables based on your questions and the AI instructions you\'ve configured. No need to manually select databases or tables - just ask your questions!',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [connections, setConnections] = useState<DatabaseConnection[]>([])
  const [selectedConnection, setSelectedConnection] = useState<DatabaseConnection | null>(null)
  const [availableTables, setAvailableTables] = useState<DataTable[]>([])
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load tables for a specific connection
  const loadTablesForConnection = async (connection: DatabaseConnection) => {
    try {
      console.log('Loading tables for connection:', connection.name)
      
      const tablesResult = await DatabaseConnectionService.getTables({
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        ssl_mode: connection.ssl_mode
      })
      
      if (tablesResult.success && tablesResult.data) {
        const tables = tablesResult.data.map((table: any) => ({
          name: table.table_name,
          columns: [],
          rowCount: 0,
          lastUpdated: new Date()
        }))
        
        console.log('Loaded tables:', tables)
        setAvailableTables(tables)
      } else {
        console.error('Failed to load tables:', tablesResult.error)
        setAvailableTables([])
      }
    } catch (error) {
      console.error('Error loading tables:', error)
      setAvailableTables([])
    }
  }

  // Load AI instructions and persona settings
  const loadAiInstructions = useCallback(async () => {
    try {
      const savedPersonas = localStorage.getItem('aiPersonas')
      const savedSettings = localStorage.getItem('aiSettings')
      
      let personas = []
      let settings = { defaultPersona: 'data-analyst' }
      
      if (savedPersonas) {
        try {
          personas = JSON.parse(savedPersonas).map((p: any) => ({
            ...p,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date()
          }))
        } catch (error) {
          console.error('Failed to parse personas:', error)
          personas = []
        }
      }
      if (savedSettings) {
        try {
          settings = JSON.parse(savedSettings)
        } catch (error) {
          console.error('Failed to parse settings:', error)
          settings = { defaultPersona: 'data-analyst' }
        }
      }
      
      const currentPersona = personas.find((p: any) => p.id === settings.defaultPersona)
      
      return {
        persona: currentPersona,
        settings,
        instructions: currentPersona?.instructions || 'You are a data analyst. Analyze the database schema and user query to determine the most appropriate table(s) to use for analysis. Select tables intelligently based on the user\'s question and provide meaningful insights.'
      }
    } catch (error) {
      console.error('Failed to load AI instructions:', error)
      return {
        persona: null,
        settings: { defaultPersona: 'data-analyst' },
        instructions: 'You are a data analyst. Analyze the database schema and user query to determine the most appropriate table(s) to use for analysis.'
      }
    }
  }, [])

  // Load database connections
  const loadConnections = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Loading database connections...')
      
      const user = await blink.auth.me()
      const connectionsData = await blink.db.database_connections.list({
        where: { user_id: user.id }
      })
      
      console.log('Loaded connections:', connectionsData)
      
      // Filter for connected databases only
      const connectedDatabases = connectionsData.filter((conn: any) => 
        conn.status === 'connected'
      )
      
      setConnections(connectedDatabases)
      
      // Auto-select the first connected database
      if (connectedDatabases.length > 0 && !selectedConnection) {
        const firstConnection = connectedDatabases[0]
        console.log('Auto-selecting connection:', firstConnection)
        setSelectedConnection(firstConnection)
        await loadTablesForConnection(firstConnection)
      }
      
    } catch (error) {
      console.error('Error loading connections:', error)
      setConnections([])
    } finally {
      setLoading(false)
    }
  }, [selectedConnection])

  // Smart table selection based on query content and AI instructions
  const selectBestTable = async (question: string, availableTables: DataTable[], aiInstructions: any) => {
    const questionLower = question.toLowerCase()
    
    // Look for table names mentioned directly in the question
    for (const table of availableTables) {
      if (questionLower.includes(table.name.toLowerCase())) {
        return table.name
      }
    }
    
    // Use AI instructions to guide table selection
    const instructions = aiInstructions.instructions || ''
    const instructionsLower = instructions.toLowerCase()
    
    // Look for patterns in AI instructions that might guide table selection
    for (const table of availableTables) {
      if (instructionsLower.includes(table.name.toLowerCase())) {
        return table.name
      }
    }
    
    // Look for common patterns based on question content
    const patterns = [
      { keywords: ['order', 'purchase', 'buy', 'sale', 'transaction'], tables: ['orders', 'sales', 'transactions', 'purchases'] },
      { keywords: ['user', 'customer', 'client', 'account'], tables: ['users', 'customers', 'clients', 'accounts'] },
      { keywords: ['product', 'item', 'inventory', 'catalog'], tables: ['products', 'items', 'inventory', 'catalog'] },
      { keywords: ['payment', 'billing', 'invoice', 'charge'], tables: ['payments', 'billing', 'invoices', 'charges'] },
      { keywords: ['employee', 'staff', 'worker'], tables: ['employees', 'staff', 'workers'] },
      { keywords: ['log', 'event', 'activity', 'audit'], tables: ['logs', 'events', 'activities', 'audit'] }
    ]
    
    for (const pattern of patterns) {
      if (pattern.keywords.some(keyword => questionLower.includes(keyword))) {
        for (const tableName of pattern.tables) {
          const matchingTable = availableTables.find(t => 
            t.name.toLowerCase().includes(tableName) || tableName.includes(t.name.toLowerCase())
          )
          if (matchingTable) {
            return matchingTable.name
          }
        }
      }
    }
    
    // Default to first available table
    return availableTables[0]?.name
  }

  // Generate analysis from external database
  const generateAnalysisFromExternalDB = async (question: string): Promise<AnalysisResult> => {
    try {
      if (!selectedConnection) {
        return {
          query: `-- No database connection selected`,
          data: [],
          insights: [
            'No database connection available.',
            'Please go to Database Connection page to set up your PostgreSQL connection.',
            'Once connected, I can analyze your external database automatically.'
          ],
          chartSuggestions: [],
          executionTime: '0.000s'
        }
      }

      if (availableTables.length === 0) {
        return {
          query: `-- No tables found in database`,
          data: [],
          insights: [
            'No tables found in the connected database.',
            'Please ensure your database has tables with data.',
            'You can create tables using the External Table Manager.'
          ],
          chartSuggestions: [],
          executionTime: '0.000s'
        }
      }

      // Load AI instructions
      const aiInstructions = await loadAiInstructions()
      
      // Select the best table based on the question and AI instructions
      const selectedTableName = await selectBestTable(question, availableTables, aiInstructions)
      
      if (!selectedTableName) {
        return {
          query: `-- No suitable table found for query: "${question}"`,
          data: [],
          insights: [
            `Could not find a suitable table for the query: "${question}"`,
            'Available tables: ' + availableTables.map(t => t.name).join(', '),
            'Please try rephrasing your question or check if the relevant data exists in your database.'
          ],
          chartSuggestions: ['table'],
          executionTime: '0.000s'
        }
      }

      const startTime = Date.now()
      
      // Generate appropriate query based on question type
      let query = ''
      let action = 'execute_query'
      
      const questionLower = question.toLowerCase()
      
      if (questionLower.includes('schema') || questionLower.includes('structure') || questionLower.includes('columns')) {
        action = 'get_table_schema'
        query = `-- Getting schema for table: ${selectedTableName}`
      } else if (questionLower.includes('count') || questionLower.includes('total') || questionLower.includes('how many')) {
        query = `SELECT COUNT(*) as total_rows FROM ${selectedTableName}`
      } else if (questionLower.includes('first') || questionLower.includes('sample') || questionLower.includes('preview') || questionLower.includes('show me')) {
        query = `SELECT * FROM ${selectedTableName} LIMIT 10`
      } else if (questionLower.includes('latest') || questionLower.includes('recent')) {
        query = `SELECT * FROM ${selectedTableName} ORDER BY created_at DESC LIMIT 10`
      } else {
        // Default: show sample data
        query = `SELECT * FROM ${selectedTableName} LIMIT 10`
      }

      // Execute the query against the external database
      let result
      if (action === 'get_table_schema') {
        result = await DatabaseConnectionService.getTableSchema({
          host: selectedConnection.host,
          port: selectedConnection.port,
          database: selectedConnection.database,
          username: selectedConnection.username,
          password: selectedConnection.password,
          ssl_mode: selectedConnection.ssl_mode
        }, selectedTableName)
      } else {
        result = await DatabaseConnectionService.executeQuery({
          host: selectedConnection.host,
          port: selectedConnection.port,
          database: selectedConnection.database,
          username: selectedConnection.username,
          password: selectedConnection.password,
          ssl_mode: selectedConnection.ssl_mode
        }, query)
      }
      
      const executionTime = Date.now() - startTime
      
      if (result.success) {
        const insights = [
          `🎯 AI selected table: "${selectedTableName}" from database "${selectedConnection.name}"`,
          `📊 Query executed successfully in ${executionTime}ms`,
          `💡 Based on AI instructions: ${aiInstructions.instructions.substring(0, 100)}...`
        ]
        
        if (result.data && result.data.length > 0) {
          insights.push(`📈 Found ${result.data.length} records`)
          
          // Add data-specific insights
          const firstRow = result.data[0]
          const columnCount = Object.keys(firstRow).length
          insights.push(`🔢 Table has ${columnCount} columns`)
          
          // Check for common patterns
          const columns = Object.keys(firstRow)
          if (columns.some(col => col.toLowerCase().includes('email'))) {
            insights.push('📧 Contains email data')
          }
          if (columns.some(col => col.toLowerCase().includes('date') || col.toLowerCase().includes('time'))) {
            insights.push('📅 Contains temporal data')
          }
          if (columns.some(col => col.toLowerCase().includes('price') || col.toLowerCase().includes('amount') || col.toLowerCase().includes('cost'))) {
            insights.push('💰 Contains financial data')
          }
        } else {
          insights.push('📭 No data found in the selected table')
        }

        return {
          query,
          data: result.data || [],
          insights,
          chartSuggestions: ['table', 'bar', 'line'],
          executionTime: `${executionTime}ms`,
          selectedTable: selectedTableName
        }
      } else {
        return {
          query,
          data: [],
          insights: [
            `❌ Query failed: ${result.error}`,
            `🎯 AI selected table: "${selectedTableName}"`,
            'Please check your database connection and try again.'
          ],
          chartSuggestions: [],
          executionTime: `${executionTime}ms`,
          selectedTable: selectedTableName
        }
      }
    } catch (error) {
      console.error('External database analysis error:', error)
      return {
        query: `-- Error in analysis`,
        data: [],
        insights: [
          `❌ Analysis failed: ${error.message}`,
          'The AI could not process your request. Please try a simpler query.',
          'Make sure your database connection is working properly.'
        ],
        chartSuggestions: [],
        executionTime: '0.000s'
      }
    }
  }

  useEffect(() => {
    loadConnections()
  }, [loadConnections])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    if (connections.length === 0) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Please set up a database connection first. Go to Database Connection page to configure your PostgreSQL connection.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    if (!selectedConnection) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'No active database connection found. Please ensure your database connection is properly configured and connected.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: 'Analyzing your external database and selecting the best table based on AI instructions...',
      timestamp: new Date(),
      isLoading: true
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])
    setInputMessage('')
    setIsAnalyzing(true)

    try {
      // Simulate AI thinking time
      await new Promise(resolve => setTimeout(resolve, 1500))

      const analysisResult = await generateAnalysisFromExternalDB(inputMessage)
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: analysisResult.insights.join('\n\n'),
        timestamp: new Date(),
        query: analysisResult.query,
        results: analysisResult.data,
        chartType: analysisResult.chartSuggestions[0]
      }

      setMessages(prev => prev.slice(0, -1).concat(assistantMessage))
      setAnalysisHistory(prev => [...prev, analysisResult])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: 'I encountered an error while analyzing your external database. Please check your connection and try again.',
        timestamp: new Date()
      }
      setMessages(prev => prev.slice(0, -1).concat(errorMessage))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickQuestions = [
    "What tables are available in my database?",
    "Show me the schema of the main table",
    "Count total records in the database",
    "Show me sample data from the most relevant table",
    "What's the structure of my data?",
    "Give me an overview of my database"
  ]

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Analyzer</h1>
          <p className="text-muted-foreground">
            Chat with AI to analyze your external PostgreSQL database - AI automatically selects the best tables based on your instructions
          </p>
          <div className="flex items-center gap-2 mt-2">
            {selectedConnection ? (
              <Badge variant="outline" className="text-xs">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Connected to {selectedConnection.name}
                </span>
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  No database connection
                </span>
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {availableTables.length} tables available
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadConnections}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {!selectedConnection && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a database connection first. Go to Database Connection page to set up your PostgreSQL connection.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="tables">Data Tables</TabsTrigger>
          <TabsTrigger value="history">Analysis History</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chat Interface */}
            <div className="lg:col-span-3">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    AI Data Analysis Chat
                  </CardTitle>
                  <CardDescription>
                    Ask questions about your external database - AI will automatically select the best tables based on your instructions
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {/* Messages */}
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`flex gap-3 max-w-[80%] ${
                              message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.type === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              {message.type === 'user' ? (
                                <User className="h-4 w-4" />
                              ) : (
                                <Bot className="h-4 w-4" />
                              )}
                            </div>
                            <div className={`rounded-lg p-3 ${
                              message.type === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}>
                              {message.isLoading ? (
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 animate-spin" />
                                  <span>Analyzing...</span>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                  {message.query && (
                                    <div className="mt-3 p-2 bg-background/50 rounded border">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Database className="h-3 w-3" />
                                        <span className="text-xs font-medium">Generated Query</span>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <code className="text-xs">{message.query}</code>
                                    </div>
                                  )}
                                  {message.results && message.results.length > 0 && (
                                    <div className="mt-3">
                                      <div className="text-xs font-medium mb-2">Data Preview</div>
                                      <div className="bg-background/50 rounded border p-2">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              {Object.keys(message.results[0] || {}).map(key => (
                                                <TableHead key={key} className="text-xs">{key}</TableHead>
                                              ))}
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {message.results.slice(0, 3).map((row: any, i: number) => (
                                              <TableRow key={i}>
                                                {Object.values(row).map((value: any, j: number) => (
                                                  <TableCell key={j} className="text-xs">{String(value)}</TableCell>
                                                ))}
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="text-xs opacity-70 mt-2">
                                {message.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="mt-4 space-y-2">
                    <div className="flex gap-2">
                      <Textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything about your external database... AI will automatically select the best tables based on your instructions!"
                        className="min-h-[60px] resize-none"
                        disabled={isAnalyzing || !selectedConnection}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isAnalyzing || !selectedConnection}
                        size="icon"
                        className="h-[60px] w-[60px]"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Quick Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full text-left justify-start h-auto p-2 text-xs"
                      onClick={() => handleQuickQuestion(question)}
                      disabled={!selectedConnection}
                    >
                      <Zap className="h-3 w-3 mr-2 flex-shrink-0" />
                      <span className="line-clamp-2">{question}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Available Tables</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? (
                    <div className="text-center py-4">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Loading tables...</p>
                    </div>
                  ) : availableTables.length > 0 ? (
                    availableTables.map((table) => (
                      <div key={table.name} className="p-2 border rounded text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <Database className="h-3 w-3" />
                          <span className="font-medium">{table.name}</span>
                        </div>
                        <div className="text-muted-foreground">
                          AI will automatically select when relevant
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Database className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {selectedConnection ? 'No tables found in database' : 'Connect to database first'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>External Database Tables</CardTitle>
              <CardDescription>
                Overview of your external PostgreSQL database tables - AI will automatically select the best ones for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedConnection ? (
                availableTables.length > 0 ? (
                  <div className="grid gap-4">
                    {availableTables.map((table) => (
                      <div key={table.name} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            <h3 className="font-medium">{table.name}</h3>
                            <Badge variant="secondary">
                              External Table
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Analyze
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          AI will automatically select this table when relevant to your queries based on your instructions
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No tables found</p>
                    <p className="text-sm text-muted-foreground">
                      Check your database connection or create tables using External Table Manager
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No database connection</p>
                  <p className="text-sm text-muted-foreground">
                    Please set up a database connection first
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analysis History</CardTitle>
              <CardDescription>
                Review your previous data analysis queries and AI table selections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysisHistory.length > 0 ? (
                <div className="space-y-4">
                  {analysisHistory.map((analysis, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          Query #{index + 1}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Executed in {analysis.executionTime}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {analysis.selectedTable && (
                          <div>
                            <Label className="text-xs">AI Selected Table</Label>
                            <p className="text-xs text-muted-foreground mt-1">{analysis.selectedTable}</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-xs">SQL Query</Label>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {analysis.query}
                          </pre>
                        </div>
                        <div>
                          <Label className="text-xs">Key Insights</Label>
                          <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                            {analysis.insights.map((insight, i) => (
                              <li key={i}>• {insight}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No analysis history yet</p>
                  <p className="text-sm text-muted-foreground">
                    Start analyzing your external database to see history here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Insights will be generated based on your external database analysis.
              The AI will automatically select the most relevant tables based on your instructions.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Insights</CardTitle>
              <CardDescription>
                Automated insights based on your external database analysis with intelligent table selection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No insights available yet</p>
                <p className="text-sm text-muted-foreground">
                  Start analyzing your external database to generate insights
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DataAnalyzer