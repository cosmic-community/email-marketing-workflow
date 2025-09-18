'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EmailWorkflow } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  MoreVertical, 
  Play, 
  Pause, 
  Edit, 
  Copy, 
  Trash2, 
  Users, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import TimeAgo from './TimeAgo'
import ConfirmationModal from './ConfirmationModal'

interface WorkflowsListProps {
  workflows: EmailWorkflow[]
}

export default function WorkflowsList({ workflows }: WorkflowsListProps) {
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <Play className="w-3 h-3 mr-1" />
      case 'Draft':
        return <Edit className="w-3 h-3 mr-1" />
      case 'Paused':
        return <Pause className="w-3 h-3 mr-1" />
      case 'Completed':
        return <CheckCircle className="w-3 h-3 mr-1" />
      default:
        return <XCircle className="w-3 h-3 mr-1" />
    }
  }

  const handleDeleteWorkflow = async () => {
    if (!deleteWorkflowId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/workflows/${deleteWorkflowId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete workflow')
      }

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error deleting workflow:', error)
      alert('Failed to delete workflow. Please try again.')
    } finally {
      setIsDeleting(false)
      setDeleteWorkflowId(null)
    }
  }

  const handleDuplicateWorkflow = async (workflowId: string) => {
    setDuplicatingId(workflowId)
    try {
      const response = await fetch(`/api/workflows/${workflowId}/duplicate`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate workflow')
      }

      // Refresh the page to show the new workflow
      window.location.reload()
    } catch (error) {
      console.error('Error duplicating workflow:', error)
      alert('Failed to duplicate workflow. Please try again.')
    } finally {
      setDuplicatingId(null)
    }
  }

  const handleStatusToggle = async (workflowId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active'
    
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update workflow status')
      }

      // Refresh the page to show updated status
      window.location.reload()
    } catch (error) {
      console.error('Error updating workflow status:', error)
      alert('Failed to update workflow status. Please try again.')
    }
  }

  if (workflows.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No workflows yet</h3>
        <p className="text-gray-600 mb-6">
          Create your first automated email workflow to start nurturing your contacts.
        </p>
        <Link href="/workflows/new">
          <Button>Create Your First Workflow</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">
                  {workflow.metadata.name}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/workflows/${workflow.id}`}>
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
                      onClick={() => handleStatusToggle(workflow.id, workflow.metadata.status.value)}
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
                    <DropdownMenuItem
                      onClick={() => handleDuplicateWorkflow(workflow.id)}
                      disabled={duplicatingId === workflow.id}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {duplicatingId === workflow.id ? 'Duplicating...' : 'Duplicate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteWorkflowId(workflow.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(workflow.metadata.status.value)}>
                  {getStatusIcon(workflow.metadata.status.value)}
                  {workflow.metadata.status.value}
                </Badge>
                <Badge variant="outline">
                  {workflow.metadata.trigger_type.value}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {workflow.metadata.description && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {workflow.metadata.description}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Steps:</span>
                  <span className="font-medium">{workflow.metadata.steps.length}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Enrolled:</span>
                  <span className="font-medium">
                    {workflow.metadata.stats?.total_enrolled || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Completion Rate:</span>
                  <span className="font-medium">
                    {workflow.metadata.stats?.completion_rate || '0%'}
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-0 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                <TimeAgo date={workflow.metadata.last_modified} />
              </div>
              <Link href={`/workflows/${workflow.id}`}>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <ConfirmationModal
        isOpen={!!deleteWorkflowId}
        onClose={() => setDeleteWorkflowId(null)}
        onConfirm={handleDeleteWorkflow}
        title="Delete Workflow"
        message="Are you sure you want to delete this workflow? This action cannot be undone and will also remove all enrollments."
        confirmLabel="Delete"
        isLoading={isDeleting}
        variant="destructive"
      />
    </>
  )
}