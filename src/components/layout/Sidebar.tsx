import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard,
  Plus,
  BarChart3,
  Database,
  Settings,
  BookOpen,
  Brain,
  Zap
} from 'lucide-react'

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

const navigation = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & recent activity'
  },
  {
    id: 'table-creator',
    name: 'Table Creator',
    icon: Plus,
    description: 'Create tables with AI'
  },
  {
    id: 'data-analyzer',
    name: 'Data Analyzer',
    icon: BarChart3,
    description: 'Analyze data with AI'
  },
  {
    id: 'database-connection',
    name: 'Database',
    icon: Database,
    description: 'PostgreSQL connections'
  },
  {
    id: 'external-tables',
    name: 'External Tables',
    icon: Database,
    description: 'Manage external DB tables'
  },
  {
    id: 'saved-prompts',
    name: 'Saved Prompts',
    icon: BookOpen,
    description: 'Reusable prompt templates'
  },
  {
    id: 'ai-instructions',
    name: 'AI Instructions',
    icon: Brain,
    description: 'Custom AI behavior'
  },
  {
    id: 'api-settings',
    name: 'API Settings',
    icon: Settings,
    description: 'LLM credentials & usage'
  }
]

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col bg-gray-50/40 border-r">
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = currentPage === item.id
            const Icon = item.icon
            
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start h-auto p-3 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => onNavigate(item.id)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className={`text-xs ${
                      isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </Button>
            )
          })}
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4" />
          <span>Powered by AI</span>
          <Badge variant="secondary" className="text-xs">
            Beta
          </Badge>
        </div>
      </div>
    </div>
  )
}