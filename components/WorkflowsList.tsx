'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu'
import { 
  Play, 
  Pause, 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  Users, 
  Mail, 
  Calendar,
  Target,
  TrendingUp,
  Clock
} from 'lucide-react'
import { EmailWorkflow } from '@/types'
import ConfirmationModal from '@/components/ConfirmationModal'
import TimeAgo from '@/components/TimeAgo'

interface WorkflowsListProps {
  workflows: EmailWorkflow[]
}

export default function WorkflowsList({ workflows }: WorkflowsListProps) {
  const router = useRouter()
  const [deletingWorkflow, setDeletingWorkflow] = useState<EmailWorkflow | null>(null)
  const [duplicatingWorkflow, setDuplicatingWorkflow] = useState<EmailWorkflow | null>(null)
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})

  const handleDeleteWorkflow = async (workflow: EmailWorkflow) => {
    if (loading[`delete-${workflow.id}`]) return

    setLoading(prev => ({ ...prev, [`delete-${workflow.id}`]: true }))

    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete workflow')
      }

      setDeletingWorkflow(null)
      router.refresh()
    } catch (error) {
      console.error('Error deleting workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete workflow')
    } finally {
      setLoading(prev => ({ ...prev, [`delete-${workflow.id}`]: false }))
    }
  }

  const handleDuplicateWorkflow = async (workflow: EmailWorkflow) => {
    if (loading[`duplicate-${workflow.id}`]) return

    setLoading(prev => ({ ...prev, [`duplicate-${workflow.id}`]: true }))

    try {
      const response = await fetch(`/api/workflows/${workflow.id}/duplicate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to duplicate workflow')
      }

      const result = await response.json()
      setDuplicatingWorkflow(null)
      router.push(`/workflows/${result.data.id}/edit`)
      router.refresh()
    } catch (error) {
      console.error('Error duplicating workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to duplicate workflow')
    } finally {
      setLoading(prev => ({ ...prev, [`duplicate-${workflow.id}`]: false }))
    }
  }

  const handleStatusToggle = async (workflow: EmailWorkflow) => {
    const newStatus = workflow.metadata.status.value === 'Active' ? 'Paused' : 'Active'
    
    if (loading[`status-${workflow.id}`]) return

    setLoading(prev => ({ ...prev, [`status-${workflow.id}`]: true }))

    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${newStatus.toLowerCase()} workflow`)
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating workflow status:', error)
      alert(error instanceof Error ? error.message : `Failed to ${newStatus.toLowerCase()} workflow`)
    } finally {
      setLoading(prev => ({ ...prev, [`status-${workflow.id}`]: false }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Paused': return 'bg-yellow-100 text-yellow-800'
      case 'Completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'List Subscribe': return <Users className="w-4 h-4" />
      case 'Tag Added': return <Target className="w-4 h-4" />
      case 'Date Based': return <Calendar className="w-4 h-4" />
      default: return <Play className="w-4 h-4" />
    }
  }

  if (workflows.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Create your first automated email workflow to nurture leads and engage customers.
        </p>
        <Button onClick={() => router.push('/workflows/new')}>
          Create Your First Workflow
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-6">
        {workflows.map(workflow => (
          <Card key={workflow.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <CardTitle 
                      className="text-xl cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => router.push(`/workflows/${workflow.id}`)}
                    >
                      {workflow.metadata.name}
                    </CardTitle>
                    <Badge className={getStatusColor(workflow.metadata.status.value)}>
                      {workflow.metadata.status.value}
                    </Badge>
                  </div>
                  
                  {workflow.metadata.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {workflow.metadata.description}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => router.push(`/workflows/${workflow.id}`)}>
                      <Mail className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/workflows/${workflow.id}/edit`)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Workflow
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleStatusToggle(workflow)}
                      disabled={loading[`status-${workflow.id}`]}
                    >
                      {workflow.metadata.status.value === 'Active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause Workflow
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Activate Workflow
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setDuplicatingWorkflow(workflow)}
                      disabled={loading[`duplicate-${workflow.id}`]}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeletingWorkflow(workflow)}
                      className="text-red-600 hover:text-red-700"
                      disabled={loading[`delete-${workflow.id}`]}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Trigger Info */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  {getTriggerIcon(workflow.metadata.trigger_type.value)}
                  <span>Trigger: {workflow.metadata.trigger_type.value}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>{workflow.metadata.steps.length} step{workflow.metadata.steps.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    <TimeAgo date={workflow.modified_at} />
                  </span>
                </div>
              </div>

              {/* Stats */}
              {workflow.metadata.stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {workflow.metadata.stats.total_enrolled}
                    </div>
                    <div className="text-xs text-gray-500">Enrolled</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {workflow.metadata.stats.total_completed}
                    </div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {workflow.metadata.stats.completion_rate}
                    </div>
                    <div className="text-xs text-gray-500">Completion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {workflow.metadata.stats.total_emails_sent}
                    </div>
                    <div className="text-xs text-gray-500">Emails Sent</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => router.push(`/workflows/${workflow.id}`)}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  View Details
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => router.push(`/workflows/${workflow.id}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>

                {workflow.metadata.status.value !== 'Active' && (
                  <Button 
                    size="sm"
                    onClick={() => handleStatusToggle(workflow)}
                    disabled={loading[`status-${workflow.id}`]}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {loading[`status-${workflow.id}`] ? (
                      <Clock className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-1" />
                    )}
                    Activate
                  </Button>
                )}

                {workflow.metadata.status.value === 'Active' && (
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusToggle(workflow)}
                    disabled={loading[`status-${workflow.id}`]}
                  >
                    {loading[`status-${workflow.id}`] ? (
                      <Clock className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Pause className="w-4 h-4 mr-1" />
                    )}
                    Pause
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingWorkflow && (
        <ConfirmationModal
          isOpen={true}
          onOpenChange={(open: boolean) => !open && setDeletingWorkflow(null)}
          title="Delete Workflow"
          message={`Are you sure you want to delete "${deletingWorkflow.metadata.name}"? This action cannot be undone and will also remove all associated enrollments.`}
          confirmText="Delete Workflow"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={() => handleDeleteWorkflow(deletingWorkflow)}
          isLoading={loading[`delete-${deletingWorkflow.id}`]}
        />
      )}

      {/* Duplicate Confirmation Modal */}
      {duplicatingWorkflow && (
        <ConfirmationModal
          isOpen={true}
          onOpenChange={(open: boolean) => !open && setDuplicatingWorkflow(null)}
          title="Duplicate Workflow"
          message={`This will create a copy of "${duplicatingWorkflow.metadata.name}" with all the same steps and settings. You can then edit the copy as needed.`}
          confirmText="Duplicate Workflow"
          cancelText="Cancel"
          onConfirm={() => handleDuplicateWorkflow(duplicatingWorkflow)}
          isLoading={loading[`duplicate-${duplicatingWorkflow.id}`]}
        />
      )}
    </>
  )
}