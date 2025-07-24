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
import { Slider } from '@/components/ui/slider'
import { 
  Brain, 
  Settings, 
  Save, 
  RotateCcw, 
  Copy, 
  Download,
  Upload,
  Sparkles,
  MessageSquare,
  Database,
  BarChart3,
  Zap,
  User,
  Bot,
  Palette,
  Volume2,
  Clock,
  Target,
  Shield,
  CheckCircle,
  AlertCircle,
  Info,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'

interface AiPersona {
  id: string
  name: string
  description: string
  instructions: string
  tone: string
  expertise: string[]
  isDefault: boolean
  createdAt: Date
}

interface AiSettings {
  defaultPersona: string
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  responseFormat: 'detailed' | 'concise' | 'technical'
  includeExplanations: boolean
  showConfidence: boolean
  enableContextMemory: boolean
  maxContextLength: number
}

const AiInstructions: React.FC = () => {
  const [personas, setPersonas] = useState<AiPersona[]>([])
  const [settings, setSettings] = useState<AiSettings>({
    defaultPersona: 'data-analyst',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    frequencyPenalty: 0,
    presencePenalty: 0,
    responseFormat: 'detailed',
    includeExplanations: true,
    showConfidence: false,
    enableContextMemory: true,
    maxContextLength: 4000
  })
  const [showCreatePersona, setShowCreatePersona] = useState(false)
  const [editingPersona, setEditingPersona] = useState<AiPersona | null>(null)
  const [newPersona, setNewPersona] = useState({
    name: '',
    description: '',
    instructions: '',
    tone: 'professional',
    expertise: ''
  })

  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'technical', label: 'Technical' },
    { value: 'casual', label: 'Casual' },
    { value: 'formal', label: 'Formal' },
    { value: 'creative', label: 'Creative' }
  ]

  const responseFormats = [
    { value: 'detailed', label: 'Detailed', description: 'Comprehensive explanations with examples' },
    { value: 'concise', label: 'Concise', description: 'Brief, to-the-point responses' },
    { value: 'technical', label: 'Technical', description: 'Focus on technical details and implementation' }
  ]

  useEffect(() => {
    // Load saved personas and settings
    const savedPersonas = localStorage.getItem('aiPersonas')
    const savedSettings = localStorage.getItem('aiSettings')

    if (savedPersonas) {
      try {
        const parsed = JSON.parse(savedPersonas)
        setPersonas(parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt)
        })))
      } catch (error) {
        console.error('Failed to parse saved personas:', error)
        setPersonas([])
      }
    } else {
      // Initialize with default personas
      const defaultPersonas: AiPersona[] = [
        {
          id: 'data-analyst',
          name: 'Data Analyst',
          description: 'Expert in data analysis, SQL queries, and business insights',
          instructions: 'You are a senior data analyst with expertise in SQL, data visualization, and business intelligence. Always provide clear explanations of your analysis methodology and suggest actionable insights. When writing SQL queries, explain the logic and include comments. Focus on accuracy and practical business value.',
          tone: 'professional',
          expertise: ['SQL', 'Data Analysis', 'Business Intelligence', 'Statistics'],
          isDefault: true,
          createdAt: new Date()
        },
        {
          id: 'database-architect',
          name: 'Database Architect',
          description: 'Specialist in database design, optimization, and schema planning',
          instructions: 'You are a database architect with deep knowledge of relational database design, normalization, indexing strategies, and performance optimization. When creating tables, always consider scalability, data integrity, and query performance. Provide detailed explanations of design decisions and suggest best practices.',
          tone: 'technical',
          expertise: ['Database Design', 'SQL', 'Performance Optimization', 'Data Modeling'],
          isDefault: false,
          createdAt: new Date()
        },
        {
          id: 'business-consultant',
          name: 'Business Consultant',
          description: 'Focuses on business strategy and actionable recommendations',
          instructions: 'You are a business consultant who translates data insights into strategic recommendations. Focus on business impact, ROI, and actionable next steps. Use clear, non-technical language when explaining findings to stakeholders. Always connect data insights to business outcomes and growth opportunities.',
          tone: 'friendly',
          expertise: ['Business Strategy', 'Data Interpretation', 'ROI Analysis', 'Stakeholder Communication'],
          isDefault: false,
          createdAt: new Date()
        }
      ]
      setPersonas(defaultPersonas)
      localStorage.setItem('aiPersonas', JSON.stringify(defaultPersonas))
    }

    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const savePersonas = (newPersonas: AiPersona[]) => {
    setPersonas(newPersonas)
    localStorage.setItem('aiPersonas', JSON.stringify(newPersonas))
  }

  const saveSettings = (newSettings: AiSettings) => {
    setSettings(newSettings)
    localStorage.setItem('aiSettings', JSON.stringify(newSettings))
  }

  const handleCreatePersona = () => {
    if (!newPersona.name.trim() || !newPersona.instructions.trim()) return

    const persona: AiPersona = {
      id: Date.now().toString(),
      name: newPersona.name,
      description: newPersona.description,
      instructions: newPersona.instructions,
      tone: newPersona.tone,
      expertise: newPersona.expertise.split(',').map(e => e.trim()).filter(Boolean),
      isDefault: false,
      createdAt: new Date()
    }

    savePersonas([...personas, persona])
    setNewPersona({
      name: '',
      description: '',
      instructions: '',
      tone: 'professional',
      expertise: ''
    })
    setShowCreatePersona(false)
  }

  const handleEditPersona = (persona: AiPersona) => {
    setEditingPersona(persona)
    setNewPersona({
      name: persona.name,
      description: persona.description,
      instructions: persona.instructions,
      tone: persona.tone,
      expertise: persona.expertise.join(', ')
    })
    setShowCreatePersona(true)
  }

  const handleUpdatePersona = () => {
    if (!editingPersona || !newPersona.name.trim() || !newPersona.instructions.trim()) return

    const updatedPersona: AiPersona = {
      ...editingPersona,
      name: newPersona.name,
      description: newPersona.description,
      instructions: newPersona.instructions,
      tone: newPersona.tone,
      expertise: newPersona.expertise.split(',').map(e => e.trim()).filter(Boolean)
    }

    const updated = personas.map(p => p.id === editingPersona.id ? updatedPersona : p)
    savePersonas(updated)
    setEditingPersona(null)
    setNewPersona({
      name: '',
      description: '',
      instructions: '',
      tone: 'professional',
      expertise: ''
    })
    setShowCreatePersona(false)
  }

  const handleDeletePersona = (id: string) => {
    const updated = personas.filter(p => p.id !== id)
    savePersonas(updated)
    
    // If deleted persona was default, set first remaining as default
    if (settings.defaultPersona === id && updated.length > 0) {
      const newSettings = { ...settings, defaultPersona: updated[0].id }
      saveSettings(newSettings)
    }
  }

  const handleSetDefaultPersona = (id: string) => {
    const newSettings = { ...settings, defaultPersona: id }
    saveSettings(newSettings)
  }

  const resetToDefaults = () => {
    const defaultSettings: AiSettings = {
      defaultPersona: 'data-analyst',
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
      responseFormat: 'detailed',
      includeExplanations: true,
      showConfidence: false,
      enableContextMemory: true,
      maxContextLength: 4000
    }
    saveSettings(defaultSettings)
  }

  const exportSettings = () => {
    const exportData = {
      personas,
      settings,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai-instructions-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string)
        if (importData.personas) {
          const importedPersonas = importData.personas.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt)
          }))
          savePersonas(importedPersonas)
        }
        if (importData.settings) {
          saveSettings(importData.settings)
        }
      } catch (error) {
        console.error('Failed to import settings:', error)
      }
    }
    reader.readAsText(file)
  }

  const currentPersona = personas.find(p => p.id === settings.defaultPersona)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Instructions</h1>
          <p className="text-muted-foreground">
            Customize AI behavior, personas, and response settings for your data analysis needs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={importSettings}
            className="hidden"
          />
          <Dialog open={showCreatePersona} onOpenChange={setShowCreatePersona}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Persona
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPersona ? 'Edit AI Persona' : 'Create AI Persona'}
                </DialogTitle>
                <DialogDescription>
                  {editingPersona ? 'Update the AI persona settings' : 'Define a custom AI persona with specific instructions and behavior'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="persona-name">Persona Name</Label>
                    <Input
                      id="persona-name"
                      value={newPersona.name}
                      onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })}
                      placeholder="e.g., Senior Data Scientist"
                    />
                  </div>
                  <div>
                    <Label htmlFor="persona-tone">Tone</Label>
                    <Select value={newPersona.tone} onValueChange={(value) => setNewPersona({ ...newPersona, tone: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {toneOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="persona-description">Description</Label>
                  <Input
                    id="persona-description"
                    value={newPersona.description}
                    onChange={(e) => setNewPersona({ ...newPersona, description: e.target.value })}
                    placeholder="Brief description of the persona's role and expertise"
                  />
                </div>

                <div>
                  <Label htmlFor="persona-instructions">Instructions</Label>
                  <Textarea
                    id="persona-instructions"
                    value={newPersona.instructions}
                    onChange={(e) => setNewPersona({ ...newPersona, instructions: e.target.value })}
                    placeholder="Detailed instructions for how the AI should behave, respond, and approach tasks..."
                    className="min-h-[120px]"
                  />
                </div>

                <div>
                  <Label htmlFor="persona-expertise">Areas of Expertise (comma-separated)</Label>
                  <Input
                    id="persona-expertise"
                    value={newPersona.expertise}
                    onChange={(e) => setNewPersona({ ...newPersona, expertise: e.target.value })}
                    placeholder="e.g., Machine Learning, Python, Statistical Analysis"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setShowCreatePersona(false)
                    setEditingPersona(null)
                    setNewPersona({
                      name: '',
                      description: '',
                      instructions: '',
                      tone: 'professional',
                      expertise: ''
                    })
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={editingPersona ? handleUpdatePersona : handleCreatePersona}>
                    {editingPersona ? 'Update Persona' : 'Create Persona'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="personas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personas">AI Personas</TabsTrigger>
          <TabsTrigger value="settings">Model Settings</TabsTrigger>
          <TabsTrigger value="behavior">Response Behavior</TabsTrigger>
        </TabsList>

        <TabsContent value="personas" className="space-y-6">
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              AI personas define how the AI assistant behaves and responds to your queries. 
              Each persona has specific instructions, tone, and areas of expertise.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {personas.map((persona) => (
              <Card key={persona.id} className={`hover:shadow-md transition-shadow ${
                persona.id === settings.defaultPersona ? 'border-primary bg-primary/5' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{persona.name}</CardTitle>
                      <Badge variant="outline" className="text-xs capitalize">
                        {persona.tone}
                      </Badge>
                      {persona.id === settings.defaultPersona && (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {persona.id !== settings.defaultPersona && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefaultPersona(persona.id)}
                        >
                          <Target className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPersona(persona)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!persona.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePersona(persona.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardDescription>{persona.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Instructions</Label>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                        {persona.instructions}
                      </p>
                    </div>
                    
                    {persona.expertise.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Expertise</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {persona.expertise.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Created: {persona.createdAt instanceof Date ? persona.createdAt.toLocaleDateString() : new Date(persona.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              These settings control the AI model's behavior and response generation parameters.
              Adjust these values to fine-tune the AI's creativity, focus, and output length.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generation Parameters</CardTitle>
                <CardDescription>
                  Control creativity, randomness, and response characteristics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Temperature</Label>
                    <span className="text-sm text-muted-foreground">{settings.temperature}</span>
                  </div>
                  <Slider
                    value={[settings.temperature]}
                    onValueChange={([value]) => saveSettings({ ...settings, temperature: value })}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher values make responses more creative and varied
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Top P</Label>
                    <span className="text-sm text-muted-foreground">{settings.topP}</span>
                  </div>
                  <Slider
                    value={[settings.topP]}
                    onValueChange={([value]) => saveSettings({ ...settings, topP: value })}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Controls diversity via nucleus sampling
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Frequency Penalty</Label>
                    <span className="text-sm text-muted-foreground">{settings.frequencyPenalty}</span>
                  </div>
                  <Slider
                    value={[settings.frequencyPenalty]}
                    onValueChange={([value]) => saveSettings({ ...settings, frequencyPenalty: value })}
                    min={-2}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Reduces repetition of frequent tokens
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Presence Penalty</Label>
                    <span className="text-sm text-muted-foreground">{settings.presencePenalty}</span>
                  </div>
                  <Slider
                    value={[settings.presencePenalty]}
                    onValueChange={([value]) => saveSettings({ ...settings, presencePenalty: value })}
                    min={-2}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Encourages talking about new topics
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Output Settings</CardTitle>
                <CardDescription>
                  Configure response length and token limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="max-tokens">Max Tokens</Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    value={settings.maxTokens}
                    onChange={(e) => saveSettings({ ...settings, maxTokens: parseInt(e.target.value) || 2048 })}
                    min={100}
                    max={8192}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum length of AI responses (100-8192)
                  </p>
                </div>

                <div>
                  <Label htmlFor="context-length">Max Context Length</Label>
                  <Input
                    id="context-length"
                    type="number"
                    value={settings.maxContextLength}
                    onChange={(e) => saveSettings({ ...settings, maxContextLength: parseInt(e.target.value) || 4000 })}
                    min={1000}
                    max={16000}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum conversation context to maintain (1000-16000)
                  </p>
                </div>

                <div className="pt-4">
                  <Button variant="outline" onClick={resetToDefaults} className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertDescription>
              Configure how the AI formats responses and what additional information to include.
              These settings affect the style and structure of all AI responses.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Format</CardTitle>
                <CardDescription>
                  Choose how detailed and structured responses should be
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {responseFormats.map((format) => (
                  <div
                    key={format.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      settings.responseFormat === format.value 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => saveSettings({ ...settings, responseFormat: format.value as any })}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        settings.responseFormat === format.value 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground'
                      }`} />
                      <Label className="font-medium">{format.label}</Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-5">
                      {format.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Features</CardTitle>
                <CardDescription>
                  Enable or disable specific response enhancements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Explanations</Label>
                    <p className="text-sm text-muted-foreground">
                      Add detailed explanations for complex queries
                    </p>
                  </div>
                  <Switch
                    checked={settings.includeExplanations}
                    onCheckedChange={(checked) => saveSettings({ ...settings, includeExplanations: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Confidence Levels</Label>
                    <p className="text-sm text-muted-foreground">
                      Display AI confidence in responses
                    </p>
                  </div>
                  <Switch
                    checked={settings.showConfidence}
                    onCheckedChange={(checked) => saveSettings({ ...settings, showConfidence: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Context Memory</Label>
                    <p className="text-sm text-muted-foreground">
                      Remember conversation history
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableContextMemory}
                    onCheckedChange={(checked) => saveSettings({ ...settings, enableContextMemory: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {currentPersona && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Active Persona</CardTitle>
                <CardDescription>
                  Preview of how the AI will behave with current settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Bot className="h-8 w-8 text-primary" />
                    <div>
                      <h4 className="font-medium">{currentPersona.name}</h4>
                      <p className="text-sm text-muted-foreground">{currentPersona.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Tone</Label>
                      <p className="text-muted-foreground capitalize">{currentPersona.tone}</p>
                    </div>
                    <div>
                      <Label>Response Format</Label>
                      <p className="text-muted-foreground capitalize">{settings.responseFormat}</p>
                    </div>
                    <div>
                      <Label>Temperature</Label>
                      <p className="text-muted-foreground">{settings.temperature}</p>
                    </div>
                    <div>
                      <Label>Max Tokens</Label>
                      <p className="text-muted-foreground">{settings.maxTokens}</p>
                    </div>
                  </div>

                  <div>
                    <Label>Sample Response Preview</Label>
                    <div className="mt-2 p-3 bg-background border rounded-lg">
                      <p className="text-sm text-muted-foreground italic">
                        "Based on your sales data analysis request, I'll examine the revenue trends 
                        and provide actionable insights. {settings.includeExplanations && 'Let me explain my methodology: '}
                        {settings.responseFormat === 'technical' && 'I\'ll focus on the technical implementation details and SQL optimization. '}
                        {settings.responseFormat === 'concise' && 'Here\'s a brief summary: '}
                        {settings.showConfidence && '[Confidence: 95%] '}
                        The data shows..."
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AiInstructions