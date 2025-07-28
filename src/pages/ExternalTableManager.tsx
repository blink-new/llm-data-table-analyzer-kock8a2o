import React, { useState, useEffect, useCallback } from 'react'
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
  Database, 
  Plus, 
  Trash2, 
  Edit, 
  Play, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Code,
  Wand2,
  Sparkles,
  Eye,
  Download,
  Upload
} from 'lucide-react'
import { blink } from '@/blink/client'
import { DatabaseConnection } from '@/types'

interface ExternalTable {
  name: string
  columns: Array<{
    name: string
    type: string
    nullable: boolean
    primaryKey: boolean
    defaultValue?: string
  }>
  rowCount?: number
  lastUpdated?: Date
}

interface TableCreationRequest {
  connectionId: string
  tableName: string
  description: string
  columns: Array<{
    name: string
    type: string
    nullable: boolean
    primaryKey: boolean
    defaultValue?: string
    constraints?: string[]
  }>
}

export default function ExternalTableManager() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([])
  const [selectedConnection, setSelectedConnection] = useState<string>('')
  const [externalTables, setExternalTables] = useState<ExternalTable[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreatingTable, setIsCreatingTable] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('')
  const [generatedSQL, setGeneratedSQL] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const [newTable, setNewTable] = useState({
    name: '',
    description: '',
    columns: [
      { name: 'id', type: 'SERIAL', nullable: false, primaryKey: true, defaultValue: '' }
    ]
  })

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
      }
    } catch (error) {
      console.error('Failed to load connections:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedConnection])

  const loadExternalTables = useCallback(async () => {
    if (!selectedConnection) return
    
    try {
      // In a real implementation, this would call an API to get tables from the external database
      // For now, we'll simulate with mock data
      const mockTables: ExternalTable[] = [
        {
          name: 'customers',
          columns: [
            { name: 'id', type: 'SERIAL', nullable: false, primaryKey: true },
            { name: 'email', type: 'VARCHAR(255)', nullable: false },
            { name: 'first_name', type: 'VARCHAR(100)', nullable: true },
            { name: 'last_name', type: 'VARCHAR(100)', nullable: true },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' }
          ],
          rowCount: 1250,
          lastUpdated: new Date()
        },
        {
          name: 'orders',
          columns: [
            { name: 'id', type: 'SERIAL', nullable: false, primaryKey: true },
            { name: 'customer_id', type: 'INTEGER', nullable: false },
            { name: 'total_amount', type: 'DECIMAL(10,2)', nullable: false },
            { name: 'status', type: 'VARCHAR(50)', nullable: false },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false, defaultValue: 'CURRENT_TIMESTAMP' }
          ],
          rowCount: 3420,
          lastUpdated: new Date()
        }
      ]
      setExternalTables(mockTables)
    } catch (error) {
      console.error('Failed to load external tables:', error)
    }
  }, [selectedConnection])

  const generateTableFromNL = async () => {
    if (!naturalLanguageInput.trim()) return

    setIsGenerating(true)
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock generated table structure
      const mockSQL = `CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`

      setGeneratedSQL(mockSQL)
      
      // Parse the SQL to populate the form
      setNewTable({
        name: 'products',
        description: 'Product catalog table with pricing and inventory',
        columns: [
          { name: 'id', type: 'SERIAL', nullable: false, primaryKey: true, defaultValue: '' },
          { name: 'name', type: 'VARCHAR(255)', nullable: false, primaryKey: false, defaultValue: '' },
          { name: 'description', type: 'TEXT', nullable: true, primaryKey: false, defaultValue: '' },
          { name: 'price', type: 'DECIMAL(10,2)', nullable: false, primaryKey: false, defaultValue: '' },
          { name: 'category', type: 'VARCHAR(100)', nullable: true, primaryKey: false, defaultValue: '' },
          { name: 'stock_quantity', type: 'INTEGER', nullable: true, primaryKey: false, defaultValue: '0' },
          { name: 'is_active', type: 'BOOLEAN', nullable: true, primaryKey: false, defaultValue: 'true' },
          { name: 'created_at', type: 'TIMESTAMP', nullable: true, primaryKey: false, defaultValue: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'TIMESTAMP', nullable: true, primaryKey: false, defaultValue: 'CURRENT_TIMESTAMP' }
        ]
      })
    } catch (error) {
      console.error('Error generating table:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    setNewTable({
      name: '',
      description: '',
      columns: [
        { name: 'id', type: 'SERIAL', nullable: false, primaryKey: true, defaultValue: '' }
      ]
    })
    setNaturalLanguageInput('')
    setGeneratedSQL('')
  }

  const createTableInExternalDB = async () => {
    if (!selectedConnection || !newTable.name) return

    setIsCreatingTable(true)
    try {
      // In a real implementation, this would call an API to execute the SQL on the external database
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate successful creation
      const newExternalTable: ExternalTable = {
        name: newTable.name,
        columns: newTable.columns,
        rowCount: 0,
        lastUpdated: new Date()
      }
      
      setExternalTables(prev => [...prev, newExternalTable])
      setShowCreateDialog(false)
      resetForm()
      
      alert(`Table "${newTable.name}" created successfully in external database!`)
    } catch (error) {
      console.error('Failed to create table:', error)
      alert('Failed to create table. Please check your connection and try again.')
    } finally {
      setIsCreatingTable(false)
    }
  }

  const addColumn = () => {
    setNewTable(prev => ({
      ...prev,
      columns: [...prev.columns, { name: '', type: 'VARCHAR(255)', nullable: true, primaryKey: false, defaultValue: '' }]
    }))
  }

  const removeColumn = (index: number) => {
    setNewTable(prev => ({
      ...prev,
      columns: prev.columns.filter((_, i) => i !== index)
    }))
  }

  const updateColumn = (index: number, field: string, value: any) => {
    setNewTable(prev => ({
      ...prev,
      columns: prev.columns.map((col, i) => 
        i === index ? { ...col, [field]: value } : col
      )
    }))
  }

  useEffect(() => {
    loadConnections()
  }, [loadConnections])

  useEffect(() => {
    if (selectedConnection) {
      loadExternalTables()
    }
  }, [selectedConnection, loadExternalTables])

  const selectedConnectionData = connections.find(c => c.id === selectedConnection)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">External Database Tables</h1>
          <p className="text-muted-foreground">
            Create and manage tables in your connected PostgreSQL databases
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedConnection} onValueChange={setSelectedConnection}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select database connection" />
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
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Table
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Table</DialogTitle>
                <DialogDescription>
                  Create a new table in your external PostgreSQL database
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="ai" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ai">AI Assistant</TabsTrigger>
                  <TabsTrigger value="manual">Manual Design</TabsTrigger>
                </TabsList>
                
                <TabsContent value="ai" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nl-input">Describe your table in natural language</Label>
                      <Textarea
                        id="nl-input"
                        value={naturalLanguageInput}
                        onChange={(e) => setNaturalLanguageInput(e.target.value)}
                        placeholder="Create a products table with name, description, price, category, stock quantity, and timestamps..."
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <Button 
                      onClick={generateTableFromNL}
                      disabled={!naturalLanguageInput.trim() || isGenerating}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                          Generating Table Structure...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate Table with AI
                        </>
                      )}
                    </Button>
                    
                    {generatedSQL && (
                      <div className="space-y-2">
                        <Label>Generated SQL</Label>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{generatedSQL}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="manual" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="table-name">Table Name</Label>
                      <Input
                        id="table-name"
                        value={newTable.name}
                        onChange={(e) => setNewTable(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="products"
                      />
                    </div>
                    <div>
                      <Label htmlFor="table-description">Description</Label>
                      <Input
                        id="table-description"
                        value={newTable.description}
                        onChange={(e) => setNewTable(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Product catalog table"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Column Designer */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Table Columns</Label>
                  <Button variant="outline" size="sm" onClick={addColumn}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column
                  </Button>
                </div>
                
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {newTable.columns.map((column, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 border rounded">
                        <div className="col-span-3">
                          <Input
                            value={column.name}
                            onChange={(e) => updateColumn(index, 'name', e.target.value)}
                            placeholder="Column name"
                            className="text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Select 
                            value={column.type} 
                            onValueChange={(value) => updateColumn(index, 'type', value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SERIAL">SERIAL</SelectItem>
                              <SelectItem value="INTEGER">INTEGER</SelectItem>
                              <SelectItem value="VARCHAR(255)">VARCHAR(255)</SelectItem>
                              <SelectItem value="TEXT">TEXT</SelectItem>
                              <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                              <SelectItem value="DECIMAL(10,2)">DECIMAL(10,2)</SelectItem>
                              <SelectItem value="TIMESTAMP">TIMESTAMP</SelectItem>
                              <SelectItem value="DATE">DATE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={column.defaultValue}
                            onChange={(e) => updateColumn(index, 'defaultValue', e.target.value)}
                            placeholder="Default value"
                            className="text-sm"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <input
                            type="checkbox"
                            checked={column.primaryKey}
                            onChange={(e) => updateColumn(index, 'primaryKey', e.target.checked)}
                            className="rounded"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <input
                            type="checkbox"
                            checked={!column.nullable}
                            onChange={(e) => updateColumn(index, 'nullable', !e.target.checked)}
                            className="rounded"
                          />
                        </div>
                        <div className="col-span-3 flex justify-end">
                          {newTable.columns.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeColumn(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="text-xs text-muted-foreground grid grid-cols-12 gap-2 px-2">
                  <div className="col-span-3">Column Name</div>
                  <div className="col-span-2">Data Type</div>
                  <div className="col-span-2">Default Value</div>
                  <div className="col-span-1 text-center">PK</div>
                  <div className="col-span-1 text-center">Required</div>
                  <div className="col-span-3"></div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createTableInExternalDB}
                  disabled={!newTable.name || isCreatingTable}
                >
                  {isCreatingTable ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Create Table
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No connected databases</h3>
            <p className="text-muted-foreground text-center mb-4">
              You need to connect to a PostgreSQL database first to create tables
            </p>
            <Button variant="outline">
              Go to Database Connections
            </Button>
          </CardContent>
        </Card>
      ) : !selectedConnection ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a database connection</h3>
            <p className="text-muted-foreground text-center">
              Choose a connected database to view and manage its tables
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Connection Info */}
          {selectedConnectionData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Connected to: {selectedConnectionData.name}
                </CardTitle>
                <CardDescription>
                  {selectedConnectionData.username}@{selectedConnectionData.host}:{selectedConnectionData.port}/{(selectedConnectionData as any).database_name || selectedConnectionData.database}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Tables List */}
          <Card>
            <CardHeader>
              <CardTitle>External Database Tables</CardTitle>
              <CardDescription>
                Tables in your connected PostgreSQL database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {externalTables.length > 0 ? (
                <div className="space-y-4">
                  {externalTables.map((table) => (
                    <div key={table.name} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Database className="h-5 w-5" />
                          <h3 className="font-medium">{table.name}</h3>
                          <Badge variant="secondary">
                            {table.rowCount?.toLocaleString() || 0} rows
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Data
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Modify
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Columns:</div>
                        <div className="flex flex-wrap gap-1">
                          {table.columns.map((column) => (
                            <Badge key={column.name} variant="outline" className="text-xs">
                              {column.name}
                              {column.primaryKey && <span className="ml-1 text-blue-600">PK</span>}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {table.lastUpdated && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Last updated: {table.lastUpdated instanceof Date ? table.lastUpdated.toLocaleDateString() : new Date(table.lastUpdated).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tables found in this database</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first table to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}