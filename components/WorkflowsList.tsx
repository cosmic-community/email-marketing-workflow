'use client'

import { useState, useEffect } from 'react'
import { EmailWorkflow } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  Edit, 
  Copy, 
  Trash2, 
  Users, 
  Mail,
  Clock,
  TrendingUp,
  MoreHorizontal,
  Workflow
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TimeAgo from '@/components/TimeAgo'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function WorkflowsList() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<EmailWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, workflow: EmailWorkflow | null }>({
    isOpen: false,
    workflow: null
  })

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workflows')
      
      if (!response.ok) {
        throw new Error('Failed to fetch workflows')
      }

      const result = await response.json()
      setWorkflows(result.data || [])
    } catch (error) {
      console.error('Error fetching workflows:', error)
      alert('Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (workflow: EmailWorkflow) => {
    const newStatus = workflow.metadata.status.value === 'Active' ? 'Paused' : 'Active'
    
    try {
      setActionLoading(workflow.id)
      
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update workflow status')
      }

      await fetchWorkflows()
      router.refresh()
    } catch (error) {
      console.error('Error updating workflow status:', error)
      alert('Failed to update workflow status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDuplicate = async (workflow: EmailWorkflow) => {
    try {
      setActionLoading(workflow.id)
      
      const response = await fetch(`/api/workflows/${workflow.id}/duplicate`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate workflow')
      }

      await fetchWorkflows()
      router.refresh()
    } catch (error) {
      console.error('Error duplicating workflow:', error)
      alert('Failed to duplicate workflow')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (workflow: EmailWorkflow) => {
    try {
      setActionLoading(workflow.id)
      
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete workflow')
      }

      await fetchWorkflows()
      setDeleteModal({ isOpen: false, workflow: null })
      router.refresh()
    } catch (error) {
      console.error('Error deleting workflow:', error)
      alert('Failed to delete workflow')
    } finally {
      setActionLoading(null)
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
      case 'Completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTriggerTypeColor = (triggerType: string) => {
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

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (workflows.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent className="space-y-4">
          <Workflow className="w-16 h-16 mx-auto text-gray-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">No workflows yet</h3>
            <p className="text-gray-600">Create your first automated email sequence</p>
          </div>
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
    <>
      <div className="space-y-6">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Link 
                    href={`/workflows/${workflow.id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {workflow.metadata.name}
                  </Link>
                  <Badge className={getStatusColor(workflow.metadata.status.value)}>
                    {workflow.metadata.status.value}
                  </Badge>
                </CardTitle>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <Badge variant="outline" className={getTriggerTypeColor(workflow.metadata.trigger_type.value)}>
                    {workflow.metadata.trigger_type.value}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {workflow.metadata.steps.length} steps
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {workflow.metadata.stats?.total_enrolled || 0} enrolled
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <TimeAgo date={workflow.created_at} />
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={workflow.metadata.status.value === 'Active' ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => handleStatusToggle(workflow)}
                  disabled={actionLoading === workflow.id}
                >
                  {workflow.metadata.status.value === 'Active' ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      {workflow.metadata.status.value === 'Draft' ? 'Activate' : 'Resume'}
                    </>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/workflows/${workflow.id}`}>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/workflows/${workflow.id}/edit`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDuplicate(workflow)}
                      disabled={actionLoading === workflow.id}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setDeleteModal({ isOpen: true, workflow })}
                      className="text-red-600 focus:text-red-600"
                      disabled={actionLoading === workflow.id}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {workflow.metadata.description && (
                <p className="text-sm text-gray-600">{workflow.metadata.description}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {workflow.metadata.stats?.total_enrolled || 0}
                  </p>
                  <p className="text-xs text-gray-600">Total Enrolled</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {workflow.metadata.stats?.total_completed || 0}
                  </p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {workflow.metadata.stats?.completion_rate || '0%'}
                  </p>
                  <p className="text-xs text-gray-600">Completion Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {workflow.metadata.stats?.total_emails_sent || 0}
                  </p>
                  <p className="text-xs text-gray-600">Emails Sent</p>
                </div>
              </div>

              {/* Step Preview */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Workflow Steps:</h4>
                <div className="flex flex-wrap gap-2">
                  {workflow.metadata.steps.slice(0, 3).map((step, index) => (
                    <Badge key={step.id} variant="outline" className="text-xs">
                      Step {step.step_number}: {step.delay_days}d {step.delay_hours}h {step.delay_minutes}m
                    </Badge>
                  ))}
                  {workflow.metadata.steps.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{workflow.metadata.steps.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, workflow: null })}
        onConfirm={() => deleteModal.workflow && handleDelete(deleteModal.workflow)}
        title="Delete Workflow"
        message={`Are you sure you want to delete "${deleteModal.workflow?.metadata.name}"? This will also remove all enrollments and cannot be undone.`}
        confirmButtonText="Delete Workflow"
        isDestructive={true}
        isLoading={actionLoading === deleteModal.workflow?.id}
      />
    </>
  )
}