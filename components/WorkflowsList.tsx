'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Play, 
  Pause, 
  Edit, 
  Users, 
  Mail, 
  Calendar,
  BarChart3,
  Clock,
  Tag,
  List
} from 'lucide-react'
import { EmailWorkflow } from '@/types'
import TimeAgo from '@/components/TimeAgo'

interface WorkflowsListProps {
  workflows: EmailWorkflow[]
}

export default function WorkflowsList({ workflows }: WorkflowsListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'paused'>('all')

  const filteredWorkflows = workflows.filter(workflow => {
    if (filter === 'all') return true
    return workflow.metadata.status.value.toLowerCase() === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Draft':
        return 'bg-gray-100 text-gray-800'
      case 'Paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'Completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'Manual':
        return <Users className="w-4 h-4" />
      case 'List Subscribe':
        return <List className="w-4 h-4" />
      case 'Tag Added':
        return <Tag className="w-4 h-4" />
      case 'Date Based':
        return <Calendar className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  const getTriggerColor = (triggerType: string) => {
    switch (triggerType) {
      case 'Manual':
        return 'bg-purple-100 text-purple-800'
      case 'List Subscribe':
        return 'bg-blue-100 text-blue-800'
      case 'Tag Added':
        return 'bg-green-100 text-green-800'
      case 'Date Based':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (workflows.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <CardTitle className="text-xl text-gray-600 mb-2">
            No Email Workflows Yet
          </CardTitle>
          <CardDescription className="mb-6">
            Create your first automated email workflow to nurture leads and engage customers
          </CardDescription>
          <Link href="/workflows/new">
            <Button>
              <Play className="w-4 h-4 mr-2" />
              Create Your First Workflow
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex space-x-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({workflows.length})
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active ({workflows.filter(w => w.metadata.status.value === 'Active').length})
        </Button>
        <Button
          variant={filter === 'draft' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('draft')}
        >
          Draft ({workflows.filter(w => w.metadata.status.value === 'Draft').length})
        </Button>
        <Button
          variant={filter === 'paused' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('paused')}
        >
          Paused ({workflows.filter(w => w.metadata.status.value === 'Paused').length})
        </Button>
      </div>

      {/* Workflows Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    {workflow.metadata.name}
                  </CardTitle>
                  {workflow.metadata.description && (
                    <CardDescription className="mt-1 line-clamp-2">
                      {workflow.metadata.description}
                    </CardDescription>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Badge className={getStatusColor(workflow.metadata.status.value)}>
                  {workflow.metadata.status.value === 'Active' && <Play className="w-3 h-3 mr-1" />}
                  {workflow.metadata.status.value === 'Paused' && <Pause className="w-3 h-3 mr-1" />}
                  {workflow.metadata.status.value}
                </Badge>
                <Badge className={getTriggerColor(workflow.metadata.trigger_type.value)}>
                  {getTriggerIcon(workflow.metadata.trigger_type.value)}
                  <span className="ml-1">{workflow.metadata.trigger_type.value}</span>
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Steps Count */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {workflow.metadata.steps?.length || 0} steps
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <TimeAgo date={workflow.modified_at} />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-center border-t pt-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {workflow.metadata.stats?.total_enrolled || 0}
                  </div>
                  <div className="text-xs text-gray-600 flex items-center justify-center">
                    <Users className="w-3 h-3 mr-1" />
                    Enrolled
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {workflow.metadata.stats?.completion_rate || '0%'}
                  </div>
                  <div className="text-xs text-gray-600 flex items-center justify-center">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Completion
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Link href={`/workflows/${workflow.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </Link>
                <Link href={`/workflows/${workflow.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWorkflows.length === 0 && filter !== 'all' && (
        <Card>
          <CardContent className="text-center py-8">
            <CardDescription>
              No workflows found with status: {filter}
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  )
}