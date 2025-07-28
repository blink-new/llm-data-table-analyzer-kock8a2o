import React, { useState, useEffect } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Database, 
  Wand2, 
  Play, 
  Save, 
  Download, 
  Upload, 
  Eye, 
  Code, 
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  AlertCircle,
  Info,
  Zap
} from 'lucide-react'

interface Column {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  defaultValue?: string
  constraints?: string[]
}

interface TableSchema {
  name: string
  columns: Column[]
  description?: string
}

interface SavedPrompt {
  id: string
  name: string
  prompt: string
  category: string
  autoExecute: boolean
  lastUsed?: Date
}

const TableCreator: React.FC = () => {
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSchema, setGeneratedSchema] = useState<TableSchema | null>(null)
  const [sqlQuery, setSqlQuery] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [selectedCredential, setSelectedCredential] = useState('')
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([])
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [newPromptName, setNewPromptName] = useState('')
  const [newPromptCategory, setNewPromptCategory] = useState('table-creation')

  // Load saved prompts and credentials
  useEffect(() => {
    const saved = localStorage.getItem('savedPrompts')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSavedPrompts(parsed.map((p: any) => ({
          ...p,
          lastUsed: p.lastUsed ? new Date(p.lastUsed) : undefined
        })))
      } catch (error) {
        console.error('Failed to parse saved prompts:', error)
        setSavedPrompts([])
      }
    }
  }, [])

  const generateCreateTableSQLHelper = (schema: TableSchema): string => {
    const columnDefinitions = schema.columns.map(col => {
      let def = `  ${col.name} ${col.type}`
      if (!col.nullable) def += ' NOT NULL'
      if (col.primaryKey) def += ' PRIMARY KEY'
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`
      if (col.constraints) {
        col.constraints.forEach(constraint => {
          def += ` ${constraint}`
        })
      }
      return def
    }).join(',\n')

    return `CREATE TABLE ${schema.name} (\n${columnDefinitions}\n);`
  }

  const handleGenerateSchema = async () => {
    if (!naturalLanguageInput.trim()) return

    setIsGenerating(true)
    try {
      // Simulate AI generation - in real app, this would call the selected LLM
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock generated schema
      const mockSchema: TableSchema = {
        name: 'users',
        description: 'User management table with authentication and profile data',
        columns: [
          { name: 'id', type: 'SERIAL', nullable: false, primaryKey: true },
          { name: 'email', type: 'VARCHAR(255)', nullable: false, constraints: ['UNIQUE'] },
          { name: 'password_hash', type: 'VARCHAR(255)', nullable: false },
          { name: 'first_name', type: 'VARCHAR(100)', nullable: true },
          { name: 'last_name', type: 'VARCHAR(100)', nullable: true },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'is_active', type: 'BOOLEAN', nullable: false, defaultValue: 'true' }
        ]
      }

      setGeneratedSchema(mockSchema)
      
      // Generate SQL
      const sql = generateCreateTableSQLHelper(mockSchema)
      setSqlQuery(sql)
    } catch (error) {
      console.error('Error generating schema:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExecuteSQL = async () => {
    if (!sqlQuery.trim()) return

    setIsExecuting(true)
    try {
      // Simulate SQL execution
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setExecutionResult({
        success: true,
        message: `Table "${generatedSchema?.name}" created successfully`,
        rowsAffected: 0,
        executionTime: '0.045s'
      })
    } catch (error) {
      setExecutionResult({
        success: false,
        message: 'Error creating table: ' + error,
        executionTime: '0.012s'
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleSavePrompt = () => {
    if (!newPromptName.trim() || !naturalLanguageInput.trim()) return

    const newPrompt: SavedPrompt = {
      id: Date.now().toString(),
      name: newPromptName,
      prompt: naturalLanguageInput,
      category: newPromptCategory,
      autoExecute: false,
      lastUsed: new Date()
    }

    const updated = [...savedPrompts, newPrompt]
    setSavedPrompts(updated)
    localStorage.setItem('savedPrompts', JSON.stringify(updated))
    
    setShowSavePrompt(false)
    setNewPromptName('')
  }

  const loadPrompt = (prompt: SavedPrompt) => {
    setNaturalLanguageInput(prompt.prompt)
    
    // Update last used
    const updated = savedPrompts.map(p => 
      p.id === prompt.id ? { ...p, lastUsed: new Date() } : p
    )
    setSavedPrompts(updated)
    localStorage.setItem('savedPrompts', JSON.stringify(updated))
  }

  const deletePrompt = (id: string) => {
    const updated = savedPrompts.filter(p => p.id !== id)
    setSavedPrompts(updated)
    localStorage.setItem('savedPrompts', JSON.stringify(updated))
  }

  const promptCategories = ['table-creation', 'schema-modification', 'data-modeling', 'optimization']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Table Creator</h1>
          <p className="text-muted-foreground">
            Create database tables using natural language with AI assistance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showSavePrompt} onOpenChange={setShowSavePrompt}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Prompt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Prompt Template</DialogTitle>
                <DialogDescription>
                  Save this prompt for future use and quick access
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt-name">Prompt Name</Label>
                  <Input
                    id="prompt-name"
                    value={newPromptName}
                    onChange={(e) => setNewPromptName(e.target.value)}
                    placeholder="e.g., User Management Table"
                  />
                </div>
                <div>
                  <Label htmlFor="prompt-category">Category</Label>
                  <Select value={newPromptCategory} onValueChange={setNewPromptCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {promptCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSavePrompt(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePrompt}>
                    Save Prompt
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Table</TabsTrigger>
          <TabsTrigger value="prompts">Saved Prompts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Natural Language Input
                </CardTitle>
                <CardDescription>
                  Describe the table you want to create in plain English
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="llm-credential">LLM Provider</Label>
                  <Select value={selectedCredential} onValueChange={setSelectedCredential}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select LLM credential" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai-1">OpenAI GPT-4</SelectItem>
                      <SelectItem value="anthropic-1">Claude 3 Opus</SelectItem>
                      <SelectItem value="google-1">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="natural-input">Table Description</Label>
                  <Textarea
                    id="natural-input"
                    value={naturalLanguageInput}
                    onChange={(e) => setNaturalLanguageInput(e.target.value)}
                    placeholder="Create a user management table with email, password, profile information, timestamps, and status tracking..."
                    className="min-h-[120px]"
                  />
                </div>

                <Button 
                  onClick={handleGenerateSchema}
                  disabled={!naturalLanguageInput.trim() || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Generating Schema...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Table Schema
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Schema Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Generated Schema
                </CardTitle>
                <CardDescription>
                  AI-generated table structure and column definitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedSchema ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{generatedSchema.name}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {generatedSchema.columns.length} columns
                        </span>
                      </div>
                      {generatedSchema.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {generatedSchema.description}
                        </p>
                      )}
                    </div>

                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Column</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Constraints</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {generatedSchema.columns.map((col, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {col.name}
                                  {col.primaryKey && (
                                    <Badge variant="outline" className="text-xs">PK</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                  {col.type}
                                </code>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {!col.nullable && (
                                    <Badge variant="secondary" className="text-xs">NOT NULL</Badge>
                                  )}
                                  {col.defaultValue && (
                                    <Badge variant="outline" className="text-xs">
                                      DEFAULT {col.defaultValue}
                                    </Badge>
                                  )}
                                  {col.constraints?.map((constraint, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {constraint}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <Database className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Generate a schema to see the table structure
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* SQL Query Section */}
          {sqlQuery && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Generated SQL
                </CardTitle>
                <CardDescription>
                  Review and execute the SQL CREATE TABLE statement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{sqlQuery}</code>
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => navigator.clipboard.writeText(sqlQuery)}
                  >
                    Copy
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleExecuteSQL}
                    disabled={isExecuting}
                    className="flex-1"
                  >
                    {isExecuting ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-pulse" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Execute SQL
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>

                {executionResult && (
                  <Alert className={executionResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <div className="flex items-center gap-2">
                      {executionResult.success ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className={executionResult.success ? "text-green-800" : "text-red-800"}>
                        {executionResult.message}
                        <span className="ml-2 text-xs opacity-70">
                          ({executionResult.executionTime})
                        </span>
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="prompts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Prompt Templates</CardTitle>
              <CardDescription>
                Quick access to your frequently used table creation prompts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedPrompts.length > 0 ? (
                <div className="grid gap-4">
                  {savedPrompts.map((prompt) => (
                    <div key={prompt.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{prompt.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {prompt.category.split('-').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadPrompt(prompt)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePrompt(prompt.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {prompt.prompt}
                      </p>
                      {prompt.lastUsed && (
                        <p className="text-xs text-muted-foreground">
                          Last used: {prompt.lastUsed instanceof Date ? prompt.lastUsed.toLocaleDateString() : new Date(prompt.lastUsed).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Save className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No saved prompts yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create a table and save the prompt for future use
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Creation History</CardTitle>
              <CardDescription>
                View your recent table creation activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No creation history yet</p>
                <p className="text-sm text-muted-foreground">
                  Your table creation history will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TableCreator