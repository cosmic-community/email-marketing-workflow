'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Play, 
  Pause, 
  Edit, 
  Copy, 
  Trash2, 
  Search, 
  Filter,
  Users,
  Mail,
  Clock,
  Calendar
} from 'lucide-react'
import { EmailWorkflow } from '@/types'
import ConfirmationModal from '@/components/ConfirmationModal'

interface WorkflowsListProps {
  workflows: EmailWorkflow[]
}

export default function WorkflowsList({ workflows }: WorkflowsListProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [triggerFilter, setTriggerFilter] = useState<string>('all')

  // Filter workflows based on search and filters
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.metadata.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || workflow.metadata.status.value === statusFilter
    const matchesTrigger = triggerFilter === 'all' || workflow.metadata.trigger_type.value === triggerFilter
    
    return matchesSearch && matchesStatus && matchesTrigger
  })

  const handleStatusChange = async (workflowId: string, newStatus: 'Active' | 'Paused' | 'Draft') => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update workflow status')
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating workflow status:', error)
      alert('Failed to update workflow status')
    }
  }

  const handleDuplicate = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/duplicate`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate workflow')
      }

      const result = await response.json()
      router.push(`/workflows/${result.data.id}/edit`)
    } catch (error) {
      console.error('Error duplicating workflow:', error)
      alert('Failed to duplicate workflow')
    }
  }

  const handleDelete = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete workflow')
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting workflow:', error)
      alert('Failed to delete workflow')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'Draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTriggerColor = (trigger: string) => {
    switch (trigger) {
      case 'Manual':
        return 'bg-blue-100 text-blue-800'
      case 'List Subscribe':
        return 'bg-purple-100 text-purple-800'
      case 'Tag Added':
        return 'bg-orange-100 text-orange-800'
      case 'Date Based':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (workflows.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No workflows yet</h3>
        <p className="mt-2 text-gray-600">
          Create your first email workflow to automate your email marketing.
        </p>
        <Button 
          className="mt-4" 
          onClick={() => router.push('/workflows/new')}
        >
          Create Your First Workflow
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 h-4 w-4" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select value={triggerFilter} onValueChange={setTriggerFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Triggers</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
              <SelectItem value="List Subscribe">List Subscribe</SelectItem>
              <SelectItem value="Tag Added">Tag Added</SelectItem>
              <SelectItem value="Date Based">Date Based</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Workflows Grid */}
      <div className="grid gap-6">
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <CardTitle className="text-lg mb-2">
                    <button
                      onClick={() => router.push(`/workflows/${workflow.id}`)}
                      className="text-left hover:text-blue-600 transition-colors"
                    >
                      {workflow.metadata.name}
                    </button>
                  </CardTitle>
                  {workflow.metadata.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {workflow.metadata.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getStatusColor(workflow.metadata.status.value)}>
                      {workflow.metadata.status.value}
                    </Badge>
                    <Badge variant="outline" className={getTriggerColor(workflow.metadata.trigger_type.value)}>
                      {workflow.metadata.trigger_type.value}
                    </Badge>
                    <Badge variant="secondary">
                      {workflow.metadata.steps.length} step{workflow.metadata.steps.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {workflow.metadata.status.value === 'Draft' && (
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStatusChange(workflow.id, 'Active')
                      }}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Activate
                    </Button>
                  )}
                  
                  {workflow.metadata.status.value === 'Active' && (
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStatusChange(workflow.id, 'Paused')
                      }}
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/workflows/${workflow.id}/edit`)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicate(workflow.id)
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  
                  <ConfirmationModal
                    title="Delete Workflow"
                    description={`Are you sure you want to delete "${workflow.metadata.name}"? This action cannot be undone.`}
                    onConfirm={() => handleDelete(workflow.id)}
                    trigger={
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    }
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Users className="w-4 h-4 mr-1" />
                    <span className="text-xs">Enrolled</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {workflow.metadata.stats?.total_enrolled || 0}
                  </span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="text-xs">Completed</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {workflow.metadata.stats?.total_completed || 0}
                  </span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Mail className="w-4 h-4 mr-1" />
                    <span className="text-xs">Emails Sent</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {workflow.metadata.stats?.total_emails_sent || 0}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Created: {formatDate(workflow.created_at)}
                </div>
                <div>
                  Modified: {formatDate(workflow.metadata.last_modified)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWorkflows.length === 0 && workflows.length > 0 && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No workflows found</h3>
          <p className="mt-2 text-gray-600">
            Try adjusting your search or filter criteria.
          </p>
          <Button 
            variant="outline"
            className="mt-4" 
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setTriggerFilter('all')
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}