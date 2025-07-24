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
}

const DataAnalyzer: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI data analyst. I can help you analyze your external PostgreSQL database tables, generate insights, create visualizations, and answer questions about your data. Please ensure your database connection is active and select a table to get started.',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState('')
  const [selectedTable, setSelectedTable] = useState('')
  const [selectedCredential, setSelectedCredential] = useState('')
  const [connections, setConnections] = useState<any[]>([])
  const [availableTables, setAvailableTables] = useState<DataTable[]>([])
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadTablesForConnection = useCallback(async (connectionId: string) => {
    try {
      // This would fetch actual tables from your external PostgreSQL database
      // For now, show empty state until real connection is implemented
      setAvailableTables([])
    } catch (error) {
      console.error('Failed to load tables:', error)
      setAvailableTables([])
    }
  }, [])

  const loadConnections = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      const data = await blink.db.database_connections.list({
        where: { user_id: user.id, status: 'connected' },
        orderBy: { created_at: 'desc' }
      })
      setConnections(data)
      if (data.length > 0 && !selectedConnection) {
        setSelectedConnection(data[0].id)
        // Load tables for the selected connection
        loadTablesForConnection(data[0].id)
      }
    } catch (error) {
      console.error('Failed to load connections:', error)
    }
  }, [selectedConnection, loadTablesForConnection])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    loadConnections()
  }, [loadConnections])

  useEffect(() => {
    if (selectedConnection) {
      loadTablesForConnection(selectedConnection)
    }
  }, [selectedConnection, loadTablesForConnection])

  const generateAnalysisFromExternalDB = async (question: string, connectionId: string): Promise<AnalysisResult> => {
    if (!connectionId || !selectedTable) {
      return {
        query: `-- Please select a database connection and table first`,
        data: [],
        insights: [
          'To analyze your data, please ensure:',
          '1. Your PostgreSQL database connection is active and selected',
          '2. A table is selected from your external database',
          '3. Your LLM API credentials are configured',
          'Once properly connected, I can analyze your actual data and provide real insights.'
        ],
        chartSuggestions: [],
        executionTime: '0.000s'
      }
    }

    // This would use the selected LLM to generate SQL queries and analyze your external PostgreSQL data
    // For now, return a placeholder response
    return {
      query: `-- AI-generated query for your external PostgreSQL database
-- This will be generated based on your question: "${question}"
-- and executed against table: ${selectedTable}`,
      data: [],
      insights: [
        `Analysis request: "${question}"`,
        'Your external PostgreSQL database connection is required to execute this analysis.',
        'Please ensure your database credentials are properly configured.',
        'The AI will generate appropriate SQL queries based on your table schema.'
      ],
      chartSuggestions: ['table', 'chart'],
      executionTime: '0.000s'
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    if (!selectedConnection) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Please select a database connection first. Go to Database Connection page to set up your PostgreSQL connection.',
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
      content: 'Analyzing your external database...',
      timestamp: new Date(),
      isLoading: true
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])
    setInputMessage('')
    setIsAnalyzing(true)

    try {
      // Simulate AI analysis with external database
      await new Promise(resolve => setTimeout(resolve, 2000))

      const analysisResult = await generateAnalysisFromExternalDB(inputMessage, selectedConnection)
      
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
    "Show me the schema of the selected table",
    "Count total rows in this table",
    "Show me the first 10 records",
    "Analyze data distribution in this table",
    "Find any null values or data quality issues"
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
            Chat with AI to analyze your external PostgreSQL database
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedConnection} onValueChange={setSelectedConnection}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select database" />
            </SelectTrigger>
            <SelectContent>
              {connections.map(conn => (
                <SelectItem key={conn.id} value={conn.id}>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {conn.name}
                    <Badge variant="outline" className="text-xs">
                      {(conn as any).database_name || conn.database}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              {availableTables.map(table => (
                <SelectItem key={table.name} value={table.name}>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {table.name}
                    <Badge variant="secondary" className="text-xs">
                      {table.rowCount.toLocaleString()}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCredential} onValueChange={setSelectedCredential}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="LLM Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai-1">OpenAI GPT-4</SelectItem>
              <SelectItem value="anthropic-1">Claude 3 Opus</SelectItem>
              <SelectItem value="google-1">Gemini Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
                    Ask questions about your external PostgreSQL database in natural language
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
                                                  <TableCell key={j} className="text-xs">{value}</TableCell>
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
                        placeholder="Ask me anything about your external PostgreSQL database... (e.g., 'Show me the table schema')"
                        className="min-h-[60px] resize-none"
                        disabled={isAnalyzing}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isAnalyzing}
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
                  {availableTables.length > 0 ? (
                    availableTables.map((table) => (
                      <div key={table.name} className="p-2 border rounded text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <Database className="h-3 w-3" />
                          <span className="font-medium">{table.name}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {table.columns.length} columns • {table.rowCount.toLocaleString()} rows
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <Database className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        No tables found. Please check your database connection.
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
                Overview of your connected PostgreSQL database tables and their structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableTables.length > 0 ? (
                <div className="grid gap-4">
                  {availableTables.map((table) => (
                    <div key={table.name} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Database className="h-5 w-5" />
                          <h3 className="font-medium">{table.name}</h3>
                          <Badge variant="secondary">
                            {table.rowCount.toLocaleString()} rows
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analyze
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {table.columns.map((column) => (
                          <Badge key={column} variant="outline" className="text-xs">
                            {column}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last updated: {table.lastUpdated.toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tables found</p>
                  <p className="text-sm text-muted-foreground">
                    Please check your PostgreSQL database connection
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
                Review your previous data analysis queries and results
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
              Insights will be generated based on your external PostgreSQL database analysis.
              Please ensure your database connection is active and start analyzing your data.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Insights</CardTitle>
              <CardDescription>
                Automated insights based on your external database analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No insights available yet</p>
                <p className="text-sm text-muted-foreground">
                  Start analyzing your external PostgreSQL database to generate insights
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