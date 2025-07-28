import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { 
  Save, 
  Play, 
  Edit, 
  Trash2, 
  Copy, 
  Star,
  Clock,
  Tag,
  Search,
  Filter,
  Plus,
  BookOpen,
  Zap,
  Settings,
  Calendar,
  BarChart3,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  Upload,
  Database
} from 'lucide-react'
import { blink } from '@/blink/client'
import { externalDb } from '@/services/externalDb'

interface SavedPrompt {
  id: string
  name: string
  prompt: string
  category: string
  tags: string[]
  autoExecute: boolean
  isStarred: boolean
  createdAt: Date
  lastUsed?: Date
  usageCount: number
  variables?: { [key: string]: string }
  description?: string
}

interface PromptTemplate {
  id: string
  name: string
  description: string
  prompt: string
  category: string
  variables: string[]
  isPublic: boolean
}

const SavedPrompts: React.FC = () => {
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([])
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<SavedPrompt | null>(null)
  const [selectedConnection, setSelectedConnection] = useState('')
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newPrompt, setNewPrompt] = useState({
    name: '',
    prompt: '',
    category: 'table-creation',
    tags: '',
    description: '',
    autoExecute: false,
    variables: ''
  })

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'table-creation', label: 'Table Creation' },
    { value: 'data-analysis', label: 'Data Analysis' },
    { value: 'schema-modification', label: 'Schema Modification' },
    { value: 'optimization', label: 'Optimization' },
    { value: 'reporting', label: 'Reporting' }
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await blink.auth.me()
        
        // Load database connections
        const connectionsData = await blink.db.database_connections.list({
          where: { user_id: user.id, status: 'connected' },
          orderBy: { created_at: 'desc' }
        })
        setConnections(connectionsData)
        
        if (connectionsData.length > 0) {
          const firstConnection = connectionsData[0].id
          setSelectedConnection(firstConnection)
          
          console.log('Using connection:', firstConnection, connectionsData[0])
          
          // Initialize schema in external database
          console.log('Initializing schema...')
          const schemaResult = await externalDb.initializeSchema(firstConnection)
          console.log('Schema initialization result:', schemaResult)
          
          // Load saved prompts from external PostgreSQL database
          console.log('Loading saved prompts...')
          const prompts = await externalDb.getSavedPrompts(firstConnection, user.id)
          console.log('Loaded prompts:', prompts)
          
          setSavedPrompts(prompts.map((p: any) => ({
            ...p,
            createdAt: new Date(p.created_at),
            lastUsed: p.last_used ? new Date(p.last_used) : undefined,
            autoExecute: p.auto_execute,
            isStarred: p.is_starred,
            usageCount: p.usage_count,
            tags: Array.isArray(p.tags) ? p.tags : []
          })))
        }
        
        const mockTemplates: PromptTemplate[] = [
          {
            id: '1',
            name: 'Generic Data Table',
            description: 'Create a comprehensive data table for your application',
            prompt: 'Create a {{table_name}} table with fields for {{field_description}}. Include proper indexing, constraints, and data types suitable for PostgreSQL.',
            category: 'table-creation',
            variables: ['table_name', 'field_description'],
            isPublic: true
          },
          {
            id: '2',
            name: 'Data Distribution Analysis',
            description: 'Analyze data distribution patterns in your external database',
            prompt: 'Analyze data distribution for {{table_name}} showing patterns, outliers, and statistical summaries. Include data quality assessment.',
            category: 'data-analysis',
            variables: ['table_name', 'column_name'],
            isPublic: true
          },
          {
            id: '3',
            name: 'Database Optimization Review',
            description: 'Review and optimize database performance',
            prompt: 'Review the {{table_name}} table for performance optimization opportunities. Analyze query patterns, suggest indexing strategies, and identify potential bottlenecks.',
            category: 'optimization',
            variables: ['table_name', 'query_type'],
            isPublic: true
          }
        ]
        
        setPromptTemplates(mockTemplates)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  const handleCreatePrompt = async () => {
    if (!newPrompt.name.trim() || !newPrompt.prompt.trim() || !selectedConnection) return

    try {
      const user = await blink.auth.me()
      const prompt = {
        id: `prompt_${Date.now()}`,
        user_id: user.id,
        name: newPrompt.name,
        prompt: newPrompt.prompt,
        category: newPrompt.category,
        tags: newPrompt.tags.split(',').map(t => t.trim()).filter(Boolean),
        auto_execute: newPrompt.autoExecute,
        is_starred: false,
        created_at: new Date().toISOString(),
        usage_count: 0,
        description: newPrompt.description,
        variables: newPrompt.variables ? 
          Object.fromEntries(newPrompt.variables.split(',').map(v => [v.trim(), ''])) : 
          null
      }

      console.log('Creating prompt:', prompt)
      console.log('Using connection:', selectedConnection)
      
      const createResult = await externalDb.createSavedPrompt(selectedConnection, prompt)
      console.log('Create result:', createResult)
      
      // Reload prompts from external database
      const prompts = await externalDb.getSavedPrompts(selectedConnection, user.id)
      setSavedPrompts(prompts.map((p: any) => ({
        ...p,
        createdAt: new Date(p.created_at),
        lastUsed: p.last_used ? new Date(p.last_used) : undefined,
        autoExecute: p.auto_execute,
        isStarred: p.is_starred,
        usageCount: p.usage_count,
        tags: Array.isArray(p.tags) ? p.tags : []
      })))
      
      setNewPrompt({
        name: '',
        prompt: '',
        category: 'table-creation',
        tags: '',
        description: '',
        autoExecute: false,
        variables: ''
      })
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Failed to create prompt:', error)
      alert('Failed to save prompt. Please ensure your database connection is active.')
    }
  }

  const handleEditPrompt = (prompt: SavedPrompt) => {
    setEditingPrompt(prompt)
    setNewPrompt({
      name: prompt.name,
      prompt: prompt.prompt,
      category: prompt.category,
      tags: prompt.tags.join(', '),
      description: prompt.description || '',
      autoExecute: prompt.autoExecute,
      variables: prompt.variables ? Object.keys(prompt.variables).join(', ') : ''
    })
    setShowCreateDialog(true)
  }

  const handleUpdatePrompt = async () => {
    if (!editingPrompt || !newPrompt.name.trim() || !newPrompt.prompt.trim() || !selectedConnection) return

    try {
      const user = await blink.auth.me()
      const updatedPromptData = {
        id: editingPrompt.id,
        user_id: user.id,
        name: newPrompt.name,
        prompt: newPrompt.prompt,
        category: newPrompt.category,
        tags: newPrompt.tags.split(',').map(t => t.trim()).filter(Boolean),
        auto_execute: newPrompt.autoExecute,
        is_starred: editingPrompt.isStarred,
        created_at: editingPrompt.createdAt.toISOString(),
        usage_count: editingPrompt.usageCount,
        description: newPrompt.description,
        variables: newPrompt.variables ? 
          Object.fromEntries(newPrompt.variables.split(',').map(v => [v.trim(), ''])) : 
          null
      }

      await externalDb.updateSavedPrompt(selectedConnection, editingPrompt.id, updatedPromptData)
      
      // Reload prompts from external database
      const prompts = await externalDb.getSavedPrompts(selectedConnection, user.id)
      setSavedPrompts(prompts.map((p: any) => ({
        ...p,
        createdAt: new Date(p.created_at),
        lastUsed: p.last_used ? new Date(p.last_used) : undefined,
        autoExecute: p.auto_execute,
        isStarred: p.is_starred,
        usageCount: p.usage_count,
        tags: Array.isArray(p.tags) ? p.tags : []
      })))
      
      setEditingPrompt(null)
      setNewPrompt({
        name: '',
        prompt: '',
        category: 'table-creation',
        tags: '',
        description: '',
        autoExecute: false,
        variables: ''
      })
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Failed to update prompt:', error)
      alert('Failed to update prompt. Please ensure your database connection is active.')
    }
  }

  const handleDeletePrompt = async (id: string) => {
    if (!selectedConnection) return

    try {
      const user = await blink.auth.me()
      await externalDb.deleteSavedPrompt(selectedConnection, id)
      
      // Reload prompts from external database
      const prompts = await externalDb.getSavedPrompts(selectedConnection, user.id)
      setSavedPrompts(prompts.map((p: any) => ({
        ...p,
        createdAt: new Date(p.created_at),
        lastUsed: p.last_used ? new Date(p.last_used) : undefined,
        autoExecute: p.auto_execute,
        isStarred: p.is_starred,
        usageCount: p.usage_count,
        tags: Array.isArray(p.tags) ? p.tags : []
      })))
    } catch (error) {
      console.error('Failed to delete prompt:', error)
      alert('Failed to delete prompt. Please ensure your database connection is active.')
    }
  }

  const handleToggleStar = async (id: string) => {
    if (!selectedConnection) return

    try {
      const user = await blink.auth.me()
      const prompt = savedPrompts.find(p => p.id === id)
      if (!prompt) return

      const updatedPromptData = {
        id: prompt.id,
        user_id: user.id,
        name: prompt.name,
        prompt: prompt.prompt,
        category: prompt.category,
        tags: prompt.tags,
        auto_execute: prompt.autoExecute,
        is_starred: !prompt.isStarred,
        created_at: prompt.createdAt.toISOString(),
        usage_count: prompt.usageCount,
        description: prompt.description,
        variables: prompt.variables
      }

      await externalDb.updateSavedPrompt(selectedConnection, prompt.id, updatedPromptData)
      
      // Reload prompts from external database
      const prompts = await externalDb.getSavedPrompts(selectedConnection, user.id)
      setSavedPrompts(prompts.map((p: any) => ({
        ...p,
        createdAt: new Date(p.created_at),
        lastUsed: p.last_used ? new Date(p.last_used) : undefined,
        autoExecute: p.auto_execute,
        isStarred: p.is_starred,
        usageCount: p.usage_count,
        tags: Array.isArray(p.tags) ? p.tags : []
      })))
    } catch (error) {
      console.error('Failed to toggle star:', error)
      alert('Failed to update prompt. Please ensure your database connection is active.')
    }
  }

  const handleUsePrompt = async (prompt: SavedPrompt) => {
    if (!selectedConnection) return

    try {
      const user = await blink.auth.me()
      const updatedPromptData = {
        id: prompt.id,
        user_id: user.id,
        name: prompt.name,
        prompt: prompt.prompt,
        category: prompt.category,
        tags: prompt.tags,
        auto_execute: prompt.autoExecute,
        is_starred: prompt.isStarred,
        created_at: prompt.createdAt.toISOString(),
        last_used: new Date().toISOString(),
        usage_count: prompt.usageCount + 1,
        description: prompt.description,
        variables: prompt.variables
      }

      await externalDb.updateSavedPrompt(selectedConnection, prompt.id, updatedPromptData)
      
      // Reload prompts from external database
      const prompts = await externalDb.getSavedPrompts(selectedConnection, user.id)
      setSavedPrompts(prompts.map((p: any) => ({
        ...p,
        createdAt: new Date(p.created_at),
        lastUsed: p.last_used ? new Date(p.last_used) : undefined,
        autoExecute: p.auto_execute,
        isStarred: p.is_starred,
        usageCount: p.usage_count,
        tags: Array.isArray(p.tags) ? p.tags : []
      })))
      
      // Navigate to appropriate page with prompt loaded
      console.log('Using prompt:', prompt.prompt)
    } catch (error) {
      console.error('Failed to update prompt usage:', error)
      // Still allow navigation even if usage tracking fails
      console.log('Using prompt:', prompt.prompt)
    }
  }

  const handleUseTemplate = async (template: PromptTemplate) => {
    if (!selectedConnection) return

    try {
      const user = await blink.auth.me()
      const prompt = {
        id: `template_${Date.now()}`,
        user_id: user.id,
        name: template.name,
        prompt: template.prompt,
        category: template.category,
        tags: ['template'],
        auto_execute: false,
        is_starred: false,
        created_at: new Date().toISOString(),
        usage_count: 0,
        description: template.description,
        variables: template.variables.length > 0 ? 
          Object.fromEntries(template.variables.map(v => [v, ''])) : 
          null
      }

      await externalDb.createSavedPrompt(selectedConnection, prompt)
      
      // Reload prompts from external database
      const prompts = await externalDb.getSavedPrompts(selectedConnection, user.id)
      setSavedPrompts(prompts.map((p: any) => ({
        ...p,
        createdAt: new Date(p.created_at),
        lastUsed: p.last_used ? new Date(p.last_used) : undefined,
        autoExecute: p.auto_execute,
        isStarred: p.is_starred,
        usageCount: p.usage_count,
        tags: Array.isArray(p.tags) ? p.tags : []
      })))
    } catch (error) {
      console.error('Failed to create prompt from template:', error)
      alert('Failed to create prompt from template. Please ensure your database connection is active.')
    }
  }

  const filteredPrompts = savedPrompts.filter(prompt => {
    const matchesSearch = prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const starredPrompts = filteredPrompts.filter(p => p.isStarred)
  const autoExecutePrompts = filteredPrompts.filter(p => p.autoExecute)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (connections.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved Prompts</h1>
          <p className="text-muted-foreground">
            Manage your reusable prompt templates stored in your external PostgreSQL database
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No database connection found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Please connect to your PostgreSQL database first to manage saved prompts
            </p>
            <Button onClick={() => window.location.href = '/database-connection'}>
              <Database className="h-4 w-4 mr-2" />
              Connect Database
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved Prompts</h1>
          <p className="text-muted-foreground">
            Manage your reusable prompt templates stored in your external PostgreSQL database
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
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
                </DialogTitle>
                <DialogDescription>
                  {editingPrompt ? 'Update your prompt template' : 'Create a reusable prompt template for future use'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prompt-name">Prompt Name</Label>
                    <Input
                      id="prompt-name"
                      value={newPrompt.name}
                      onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                      placeholder="e.g., User Management Table"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prompt-category">Category</Label>
                    <Select value={newPrompt.category} onValueChange={(value) => setNewPrompt({ ...newPrompt, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="prompt-description">Description (Optional)</Label>
                  <Input
                    id="prompt-description"
                    value={newPrompt.description}
                    onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                    placeholder="Brief description of what this prompt does"
                  />
                </div>

                <div>
                  <Label htmlFor="prompt-content">Prompt Content</Label>
                  <Textarea
                    id="prompt-content"
                    value={newPrompt.prompt}
                    onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
                    placeholder="Enter your prompt template here. Use {{variable_name}} for variables."
                    className="min-h-[120px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prompt-tags">Tags (comma-separated)</Label>
                    <Input
                      id="prompt-tags"
                      value={newPrompt.tags}
                      onChange={(e) => setNewPrompt({ ...newPrompt, tags: e.target.value })}
                      placeholder="e.g., users, authentication, ecommerce"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prompt-variables">Variables (comma-separated)</Label>
                    <Input
                      id="prompt-variables"
                      value={newPrompt.variables}
                      onChange={(e) => setNewPrompt({ ...newPrompt, variables: e.target.value })}
                      placeholder="e.g., table_name, user_role"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-execute"
                    checked={newPrompt.autoExecute}
                    onCheckedChange={(checked) => setNewPrompt({ ...newPrompt, autoExecute: checked })}
                  />
                  <Label htmlFor="auto-execute">Auto-execute on login</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setShowCreateDialog(false)
                    setEditingPrompt(null)
                    setNewPrompt({
                      name: '',
                      prompt: '',
                      category: 'table-creation',
                      tags: '',
                      description: '',
                      autoExecute: false,
                      variables: ''
                    })
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={editingPrompt ? handleUpdatePrompt : handleCreatePrompt}>
                    {editingPrompt ? 'Update Prompt' : 'Create Prompt'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="my-prompts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="my-prompts">My Prompts</TabsTrigger>
          <TabsTrigger value="starred">Starred</TabsTrigger>
          <TabsTrigger value="auto-execute">Auto-Execute</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="my-prompts" className="space-y-4">
          {filteredPrompts.length > 0 ? (
            <div className="grid gap-4">
              {filteredPrompts.map((prompt) => (
                <Card key={prompt.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{prompt.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {categories.find(c => c.value === prompt.category)?.label}
                        </Badge>
                        {prompt.autoExecute && (
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Auto
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStar(prompt.id)}
                        >
                          <Star className={`h-4 w-4 ${prompt.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUsePrompt(prompt)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPrompt(prompt)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePrompt(prompt.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {prompt.description && (
                      <CardDescription>{prompt.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {prompt.prompt}
                      </p>
                      
                      {prompt.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {prompt.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>Created: {prompt.createdAt instanceof Date ? prompt.createdAt.toLocaleDateString() : new Date(prompt.createdAt).toLocaleDateString()}</span>
                          {prompt.lastUsed && (
                            <span>Last used: {prompt.lastUsed instanceof Date ? prompt.lastUsed.toLocaleDateString() : new Date(prompt.lastUsed).toLocaleDateString()}</span>
                          )}
                          <span>Used {prompt.usageCount} times</span>
                        </div>
                        {prompt.variables && Object.keys(prompt.variables).length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {Object.keys(prompt.variables).length} variables
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No prompts found</p>
              <p className="text-sm text-muted-foreground">
                Create your first prompt template to get started
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="starred" className="space-y-4">
          {starredPrompts.length > 0 ? (
            <div className="grid gap-4">
              {starredPrompts.map((prompt) => (
                <Card key={prompt.id} className="hover:shadow-md transition-shadow border-yellow-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <CardTitle className="text-lg">{prompt.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {categories.find(c => c.value === prompt.category)?.label}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUsePrompt(prompt)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {prompt.prompt}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No starred prompts</p>
              <p className="text-sm text-muted-foreground">
                Star your favorite prompts for quick access
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="auto-execute" className="space-y-4">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              Auto-execute prompts run automatically when you log in to the application.
              Use this feature for daily reports or routine data checks.
            </AlertDescription>
          </Alert>

          {autoExecutePrompts.length > 0 ? (
            <div className="grid gap-4">
              {autoExecutePrompts.map((prompt) => (
                <Card key={prompt.id} className="hover:shadow-md transition-shadow border-blue-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <CardTitle className="text-lg">{prompt.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          Auto-Execute
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUsePrompt(prompt)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {prompt.prompt}
                    </p>
                    {prompt.lastUsed && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last executed: {prompt.lastUsed instanceof Date ? prompt.lastUsed.toLocaleDateString() : new Date(prompt.lastUsed).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No auto-execute prompts</p>
              <p className="text-sm text-muted-foreground">
                Enable auto-execute on prompts for automated daily tasks
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              Browse and use pre-built prompt templates from the community.
              Click "Use Template" to add them to your saved prompts.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {promptTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {categories.find(c => c.value === template.category)?.label}
                      </Badge>
                      {template.isPublic && (
                        <Badge variant="secondary" className="text-xs">
                          Public
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {template.prompt}
                    </p>
                    
                    {template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-muted-foreground mr-2">Variables:</span>
                        {template.variables.map((variable, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SavedPrompts