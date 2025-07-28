import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Dashboard } from '@/pages/Dashboard'
import DatabaseConnection from '@/pages/DatabaseConnection'
import ExternalTableManager from '@/pages/ExternalTableManager'
import ApiSettings from '@/pages/ApiSettings'
import TableCreator from '@/pages/TableCreator'
import DataAnalyzer from '@/pages/DataAnalyzer'
import SavedPrompts from '@/pages/SavedPrompts'
import AiInstructions from '@/pages/AiInstructions'
import { blink } from '@/blink/client'
import { Toaster } from '@/components/ui/toaster'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setIsLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />
      case 'table-creator':
        return (
          <div className="flex-1 p-6">
            <TableCreator />
          </div>
        )
      case 'data-analyzer':
        return (
          <div className="flex-1 p-6">
            <DataAnalyzer />
          </div>
        )
      case 'database-connection':
        return (
          <div className="flex-1 p-6">
            <DatabaseConnection />
          </div>
        )
      case 'external-tables':
        return (
          <div className="flex-1 p-6">
            <ExternalTableManager />
          </div>
        )
      case 'saved-prompts':
        return (
          <div className="flex-1 p-6">
            <SavedPrompts />
          </div>
        )
      case 'ai-instructions':
        return (
          <div className="flex-1 p-6">
            <AiInstructions />
          </div>
        )
      case 'api-settings':
        return (
          <div className="flex-1 p-6">
            <ApiSettings />
          </div>
        )
      default:
        return <Dashboard onNavigate={handleNavigate} />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading DataLLM...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary mx-auto mb-4">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c0-2.21-1.79-4-4-4H4V7z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 3v18l-8-6V9l8-6z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to DataLLM</h1>
          <p className="text-muted-foreground mb-6">
            Create tables and analyze data with the power of AI
          </p>
          <p className="text-sm text-muted-foreground">
            Please sign in to continue
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentPage={currentPage} onNavigate={handleNavigate} />
        <main className="flex-1 overflow-y-auto bg-white">
          {renderCurrentPage()}
        </main>
      </div>
      <Toaster />
    </div>
  )
}

export default App