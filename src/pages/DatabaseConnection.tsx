import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Clock,
  Shield
} from 'lucide-react'
import { blink } from '@/blink/client'
import { DatabaseConnection as DBConnection } from '@/types'
import { DatabaseConnectionService } from '@/services/dbConnection'

export default function DatabaseConnection() {
  const [connections, setConnections] = useState<DBConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConnection, setEditingConnection] = useState<DBConnection | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '5432',
    database: '',
    username: '',
    password: '',
    ssl_mode: 'require',
    connection_timeout: '30',
    max_connections: '10',
    description: ''
  })

  const loadConnections = async () => {
    try {
      const user = await blink.auth.me()
      const data = await blink.db.database_connections.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
      })
      setConnections(data)
    } catch (error) {
      console.error('Failed to load connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: '5432',
      database: '',
      username: '',
      password: '',
      ssl_mode: 'require',
      connection_timeout: '30',
      max_connections: '10',
      description: ''
    })
    setEditingConnection(null)
  }

  useEffect(() => {
    loadConnections()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const user = await blink.auth.me()
      
      const connectionData = {
        name: formData.name,
        host: formData.host,
        port: parseInt(formData.port),
        database: formData.database, // Use database as per interface
        username: formData.username,
        password: formData.password,
        ssl_mode: formData.ssl_mode,
        connection_timeout: parseInt(formData.connection_timeout),
        max_connections: parseInt(formData.max_connections),
        description: formData.description,
        updated_at: new Date().toISOString()
      }
      
      if (editingConnection) {
        await blink.db.database_connections.update(editingConnection.id, connectionData)
      } else {
        await blink.db.database_connections.create({
          ...connectionData,
          id: `conn_${Date.now()}`, // Generate unique ID
          user_id: user.id,
          status: 'disconnected',
          is_connected: false,
          created_at: new Date().toISOString()
        })
      }
      
      await loadConnections()
      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to save connection:', error)
      alert('Failed to save connection. Please try again.')
    }
  }

  const testConnection = async (connection: DBConnection) => {
    setTestingConnection(connection.id)
    try {
      // Use the real database connection service
      const config = {
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        ssl_mode: connection.ssl_mode,
        connection_timeout: connection.connection_timeout
      }
      
      const result = await DatabaseConnectionService.testConnection(config)
      
      if (result.success) {
        // Update connection status with success
        await blink.db.database_connections.update(connection.id, {
          status: 'connected',
          last_connected: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        
        alert(`✅ Connection successful!\n\nLatency: ${result.latency}ms\nDatabase: ${result.details?.database}\nVersion: ${result.details?.version?.substring(0, 50)}...`)
      } else {
        // Update connection status with error
        await blink.db.database_connections.update(connection.id, {
          status: 'error',
          updated_at: new Date().toISOString()
        })
        
        alert(`❌ Connection failed!\n\nError: ${result.message}\nLatency: ${result.latency}ms`)
      }
      
      await loadConnections()
    } catch (error) {
      await blink.db.database_connections.update(connection.id, {
        status: 'error',
        updated_at: new Date().toISOString()
      })
      console.error('Connection test failed:', error)
      alert(`❌ Connection test failed!\n\nError: ${error.message}`)
    } finally {
      setTestingConnection(null)
    }
  }

  const deleteConnection = async (id: string) => {
    if (confirm('Are you sure you want to delete this connection?')) {
      try {
        await blink.db.database_connections.delete(id)
        await loadConnections()
      } catch (error) {
        console.error('Failed to delete connection:', error)
      }
    }
  }

  const editConnection = (connection: DBConnection) => {
    setFormData({
      name: connection.name,
      host: connection.host,
      port: connection.port.toString(),
      database: connection.database,
      username: connection.username,
      password: connection.password,
      ssl_mode: connection.ssl_mode || 'require',
      connection_timeout: connection.connection_timeout?.toString() || '30',
      max_connections: connection.max_connections?.toString() || '10',
      description: connection.description || ''
    })
    setEditingConnection(connection)
    setIsDialogOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Disconnected</Badge>
    }
  }

  const togglePasswordVisibility = (connectionId: string) => {
    setShowPassword(prev => ({
      ...prev,
      [connectionId]: !prev[connectionId]
    }))
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Database Connections</h1>
          <p className="text-muted-foreground">
            Manage your PostgreSQL database connections for AI-powered data analysis
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConnection ? 'Edit Connection' : 'Add New Connection'}
              </DialogTitle>
              <DialogDescription>
                Configure your PostgreSQL database connection settings
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Connection Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="My Production DB"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="host">Host</Label>
                      <Input
                        id="host"
                        value={formData.host}
                        onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                        placeholder="localhost or IP address"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        type="number"
                        value={formData.port}
                        onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
                        placeholder="5432"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="database">Database Name</Label>
                      <Input
                        id="database"
                        value={formData.database}
                        onChange={(e) => setFormData(prev => ({ ...prev, database: e.target.value }))}
                        placeholder="myapp_production"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="postgres"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Production database for customer data analysis"
                      rows={3}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="connection_timeout">Connection Timeout (seconds)</Label>
                      <Input
                        id="connection_timeout"
                        type="number"
                        value={formData.connection_timeout}
                        onChange={(e) => setFormData(prev => ({ ...prev, connection_timeout: e.target.value }))}
                        placeholder="30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_connections">Max Connections</Label>
                      <Input
                        id="max_connections"
                        type="number"
                        value={formData.max_connections}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_connections: e.target.value }))}
                        placeholder="10"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="security" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ssl_mode">SSL Mode</Label>
                    <Select value={formData.ssl_mode} onValueChange={(value) => setFormData(prev => ({ ...prev, ssl_mode: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disable">Disable</SelectItem>
                        <SelectItem value="allow">Allow</SelectItem>
                        <SelectItem value="prefer">Prefer</SelectItem>
                        <SelectItem value="require">Require</SelectItem>
                        <SelectItem value="verify-ca">Verify CA</SelectItem>
                        <SelectItem value="verify-full">Verify Full</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Your connection credentials are encrypted and stored securely. We recommend using SSL for production databases.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingConnection ? 'Update Connection' : 'Add Connection'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No database connections</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first PostgreSQL connection to start analyzing data with AI
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {connections.map((connection) => (
            <Card key={connection.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(connection.status)}
                    <div>
                      <CardTitle className="text-lg">{connection.name}</CardTitle>
                      <CardDescription>
                        {connection.username}@{connection.host}:{connection.port}/{connection.database}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(connection.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection(connection)}
                      disabled={testingConnection === connection.id}
                    >
                      {testingConnection === connection.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                          Testing...
                        </>
                      ) : (
                        <>
                          <TestTube className="h-3 w-3 mr-2" />
                          Test
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editConnection(connection)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteConnection(connection.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Password</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePasswordVisibility(connection.id)}
                      >
                        {showPassword[connection.id] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {showPassword[connection.id] ? connection.password : '••••••••'}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm font-medium">SSL Mode</span>
                    <p className="text-sm text-muted-foreground">{connection.ssl_mode || 'require'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Last Connected</span>
                    <p className="text-sm text-muted-foreground">
                      {connection.last_connected 
                        ? new Date(connection.last_connected).toLocaleString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
                
                {connection.description && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">{connection.description}</p>
                  </div>
                )}
                
                <div className="mt-4 flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Timeout: {connection.connection_timeout || 30}s
                  </div>
                  <div className="flex items-center">
                    <Zap className="h-3 w-3 mr-1" />
                    Max Connections: {connection.max_connections || 10}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}