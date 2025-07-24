import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  Settings, 
  LogOut, 
  Zap,
  User
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { blink } from '@/blink/client'

interface HeaderProps {
  currentPage: string
  onNavigate: (page: string) => void
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const [user, setUser] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const handleLogout = () => {
    blink.auth.logout()
  }

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Dashboard'
      case 'table-creator': return 'Table Creator'
      case 'data-analyzer': return 'Data Analyzer'
      case 'database-connection': return 'Database Connection'
      case 'api-settings': return 'API Settings'
      case 'saved-prompts': return 'Saved Prompts'
      case 'ai-instructions': return 'AI Instructions'
      default: return 'Dashboard'
    }
  }

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Database className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-lg">DataLLM</span>
          </div>
          <div className="hidden md:flex items-center space-x-1">
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{getPageTitle()}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Badge 
            variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
            className="hidden sm:flex"
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${
              connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            {connectionStatus === 'connected' ? 'Database Connected' : 'No Database'}
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('api-settings')}
            className="hidden sm:flex"
          >
            <Zap className="h-4 w-4 mr-2" />
            API Settings
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.email || 'User'}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate('api-settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}