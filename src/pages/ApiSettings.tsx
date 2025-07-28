import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Key, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  Zap,
  Brain,
  Sparkles,
  Shield,
  DollarSign,
  Clock,
  BarChart3
} from 'lucide-react'

interface LLMProvider {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  models: string[]
  pricing: string
  website: string
}

interface ApiCredential {
  id: string
  providerId: string
  name: string
  apiKey: string
  model: string
  isDefault: boolean
  isActive: boolean
  lastTested?: Date
  status: 'connected' | 'error' | 'untested'
  usage?: {
    requests: number
    tokens: number
    cost: number
  }
  settings: {
    maxTokens: number
    temperature: number
    topP: number
    frequencyPenalty: number
    presencePenalty: number
  }
}

const LLM_PROVIDERS: LLMProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: <Brain className="h-5 w-5" />,
    description: 'GPT-4, GPT-3.5 Turbo, and other OpenAI models',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
    pricing: '$0.01-0.06 per 1K tokens',
    website: 'https://platform.openai.com'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: <Sparkles className="h-5 w-5" />,
    description: 'Claude 3 Opus, Sonnet, and Haiku models',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    pricing: '$0.015-0.075 per 1K tokens',
    website: 'https://console.anthropic.com'
  },
  {
    id: 'google',
    name: 'Google AI',
    icon: <Zap className="h-5 w-5" />,
    description: 'Gemini Pro and other Google AI models',
    models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro'],
    pricing: '$0.0005-0.002 per 1K tokens',
    website: 'https://makersuite.google.com'
  }
]

export default function ApiSettings() {
  const [credentials, setCredentials] = useState<ApiCredential[]>([])
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({})
  const [isAddingCredential, setIsAddingCredential] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [testingCredential, setTestingCredential] = useState<string | null>(null)
  const [newCredential, setNewCredential] = useState({
    name: '',
    apiKey: '',
    model: '',
    settings: {
      maxTokens: 4000,
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    }
  })

  const resetForm = () => {
    setNewCredential({
      name: '',
      apiKey: '',
      model: '',
      settings: {
        maxTokens: 4000,
        temperature: 0.7,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0
      }
    })
    setSelectedProvider('')
    setIsAddingCredential(false)
  }

  const handleAddCredential = () => {
    if (!newCredential.name || !newCredential.apiKey || !selectedProvider || !newCredential.model) {
      return
    }

    const credential: ApiCredential = {
      id: `cred_${Date.now()}`,
      providerId: selectedProvider,
      name: newCredential.name,
      apiKey: newCredential.apiKey,
      model: newCredential.model,
      isDefault: credentials.length === 0,
      isActive: true,
      status: 'untested',
      settings: newCredential.settings
    }

    setCredentials(prev => [...prev, credential])
    resetForm()
  }

  const handleDeleteCredential = (id: string) => {
    setCredentials(prev => prev.filter(cred => cred.id !== id))
  }

  const handleTestCredential = async (id: string) => {
    setTestingCredential(id)
    
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setCredentials(prev => prev.map(cred => 
      cred.id === id 
        ? { 
            ...cred, 
            status: Math.random() > 0.2 ? 'connected' : 'error',
            lastTested: new Date(),
            usage: {
              requests: Math.floor(Math.random() * 1000),
              tokens: Math.floor(Math.random() * 50000),
              cost: Math.random() * 25
            }
          }
        : cred
    ))
    
    setTestingCredential(null)
  }

  const handleSetDefault = (id: string) => {
    setCredentials(prev => prev.map(cred => ({
      ...cred,
      isDefault: cred.id === id
    })))
  }

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const getProviderInfo = (providerId: string) => {
    return LLM_PROVIDERS.find(p => p.id === providerId)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Untested</Badge>
    }
  }

  useEffect(() => {
    // Load saved credentials from localStorage
    const savedCredentials = localStorage.getItem('llm-credentials')
    if (savedCredentials) {
      try {
        const parsed = JSON.parse(savedCredentials)
        setCredentials(parsed.map((cred: any) => ({
          ...cred,
          lastTested: cred.lastTested ? new Date(cred.lastTested) : undefined
        })))
      } catch (error) {
        console.error('Failed to load credentials:', error)
        setCredentials([])
      }
    }
  }, [])

  useEffect(() => {
    // Save credentials to localStorage
    localStorage.setItem('llm-credentials', JSON.stringify(credentials))
  }, [credentials])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Settings</h1>
        <p className="text-muted-foreground">
          Manage your LLM API credentials and configure AI model settings
        </p>
      </div>

      <Tabs defaultValue="credentials" className="space-y-6">
        <TabsList>
          <TabsTrigger value="credentials">API Credentials</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="usage">Usage & Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">API Credentials</h2>
              <p className="text-sm text-muted-foreground">
                Add and manage your LLM provider API keys
              </p>
            </div>
            <Button onClick={() => setIsAddingCredential(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Credential
            </Button>
          </div>

          {credentials.length === 0 && !isAddingCredential && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Key className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No API credentials configured</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add your first LLM API credential to start using AI features
                </p>
                <Button onClick={() => setIsAddingCredential(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Credential
                </Button>
              </CardContent>
            </Card>
          )}

          {isAddingCredential && (
            <Card>
              <CardHeader>
                <CardTitle>Add New API Credential</CardTitle>
                <CardDescription>
                  Configure a new LLM provider API key
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {LLM_PROVIDERS.map(provider => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center gap-2">
                              {provider.icon}
                              {provider.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Credential Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., My OpenAI Key"
                      value={newCredential.name}
                      onChange={(e) => setNewCredential(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your API key"
                    value={newCredential.apiKey}
                    onChange={(e) => setNewCredential(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>

                {selectedProvider && (
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Select value={newCredential.model} onValueChange={(value) => setNewCredential(prev => ({ ...prev, model: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {getProviderInfo(selectedProvider)?.models.map(model => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3">Model Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        value={newCredential.settings.maxTokens}
                        onChange={(e) => setNewCredential(prev => ({
                          ...prev,
                          settings: { ...prev.settings, maxTokens: parseInt(e.target.value) || 4000 }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature</Label>
                      <Input
                        id="temperature"
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={newCredential.settings.temperature}
                        onChange={(e) => setNewCredential(prev => ({
                          ...prev,
                          settings: { ...prev.settings, temperature: parseFloat(e.target.value) || 0.7 }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCredential}>
                    Add Credential
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {credentials.map(credential => {
              const provider = getProviderInfo(credential.providerId)
              return (
                <Card key={credential.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2">
                          {provider?.icon}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{credential.name}</h3>
                              {credential.isDefault && (
                                <Badge variant="secondary">Default</Badge>
                              )}
                              {getStatusBadge(credential.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {provider?.name} • {credential.model}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestCredential(credential.id)}
                          disabled={testingCredential === credential.id}
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          {testingCredential === credential.id ? 'Testing...' : 'Test'}
                        </Button>
                        
                        {!credential.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(credential.id)}
                          >
                            Set Default
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete API Credential</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{credential.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCredential(credential.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">API Key:</Label>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {showApiKey[credential.id] 
                              ? credential.apiKey 
                              : `${credential.apiKey.slice(0, 8)}${'*'.repeat(20)}`
                            }
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleApiKeyVisibility(credential.id)}
                          >
                            {showApiKey[credential.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {credential.lastTested && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Last tested: {credential.lastTested instanceof Date ? credential.lastTested.toLocaleString() : new Date(credential.lastTested).toLocaleString()}
                        </div>
                      )}

                      {credential.usage && (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Requests:</span>
                            <span className="ml-2 font-medium">{credential.usage.requests.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tokens:</span>
                            <span className="ml-2 font-medium">{credential.usage.tokens.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cost:</span>
                            <span className="ml-2 font-medium">${credential.usage.cost.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Available Providers</h2>
            <p className="text-sm text-muted-foreground">
              Learn about supported LLM providers and their capabilities
            </p>
          </div>

          <div className="grid gap-4">
            {LLM_PROVIDERS.map(provider => (
              <Card key={provider.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-3">
                      {provider.icon}
                      <div>
                        <h3 className="font-semibold">{provider.name}</h3>
                        <p className="text-sm text-muted-foreground">{provider.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Available Models:</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {provider.models.map(model => (
                          <Badge key={model} variant="outline">{model}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-muted-foreground">Pricing: </span>
                        <span className="text-sm font-medium">{provider.pricing}</span>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={provider.website} target="_blank" rel="noopener noreferrer">
                          Get API Key
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Usage & Billing</h2>
            <p className="text-sm text-muted-foreground">
              Monitor your API usage and costs across all providers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Total Requests</h3>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {credentials.reduce((sum, cred) => sum + (cred.usage?.requests || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-semibold">Total Tokens</h3>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {credentials.reduce((sum, cred) => sum + (cred.usage?.tokens || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Total Cost</h3>
                </div>
                <p className="text-2xl font-bold mt-2">
                  ${credentials.reduce((sum, cred) => sum + (cred.usage?.cost || 0), 0).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Notice:</strong> Your API keys are stored locally in your browser and never sent to our servers. 
              We recommend regularly rotating your API keys for security.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  )
}