'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MoreHorizontal, 
  Play, 
  Pause, 
  Edit, 
  Copy, 
  Trash2, 
  Users, 
  Mail,
  Calendar,
  CheckCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import TimeAgo from '@/components/TimeAgo'
import ConfirmationModal from '@/components/ConfirmationModal'
import ContactEnrollmentModal from '@/components/ContactEnrollmentModal'
import { EmailWorkflow } from '@/types'

interface WorkflowsListProps {
  workflows: EmailWorkflow[]
}

export default function WorkflowsList({ workflows }: WorkflowsListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [enrollmentModal, setEnrollmentModal] = useState<{
    isOpen: boolean
    workflowId: string
    workflowName: string
  }>({
    isOpen: false,
    workflowId: '',
    workflowName: ''
  })

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete workflow')
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete workflow')
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusToggle = async (workflow: EmailWorkflow) => {
    const newStatus = workflow.metadata.status.value === 'Active' ? 'Paused' : 'Active'
    setStatusUpdatingId(workflow.id)

    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update workflow status')
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating workflow status:', error)
      alert(error instanceof Error ? error.message : 'Failed to update workflow status')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id)

    try {
      const response = await fetch(`/api/workflows/${id}/duplicate`, {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to duplicate workflow')
      }

      router.refresh()
    } catch (error) {
      console.error('Error duplicating workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to duplicate workflow')
    } finally {
      setDuplicatingId(null)
    }
  }

  const openEnrollmentModal = (workflow: EmailWorkflow) => {
    setEnrollmentModal({
      isOpen: true,
      workflowId: workflow.id,
      workflowName: workflow.metadata.name
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Paused': return 'bg-yellow-100 text-yellow-800'
      case 'Completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTriggerTypeColor = (triggerType: string) => {
    switch (triggerType) {
      case 'Manual': return 'bg-purple-100 text-purple-800'
      case 'List Subscribe': return 'bg-blue-100 text-blue-800'
      case 'Tag Added': return 'bg-orange-100 text-orange-800'
      case 'Date Based': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (workflows.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No workflows</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first email workflow.
        </p>
        <div className="mt-6">
          <Link href="/workflows/new">
            <Button>Create Workflow</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="divide-y divide-gray-200">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <Link 
                      href={`/workflows/${workflow.id}`}
                      className="text-lg font-medium text-blue-600 hover:text-blue-800 truncate"
                    >
                      {workflow.metadata.name}
                    </Link>
                    <Badge className={getStatusColor(workflow.metadata.status.value)}>
                      {workflow.metadata.status.value}
                    </Badge>
                    <Badge className={getTriggerTypeColor(workflow.metadata.trigger_type.value)}>
                      {workflow.metadata.trigger_type.value}
                    </Badge>
                  </div>
                  
                  {workflow.metadata.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {workflow.metadata.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      <span>{workflow.metadata.steps.length} steps</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{workflow.metadata.stats?.total_enrolled || 0} enrolled</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span>{workflow.metadata.stats?.completion_rate || '0%'} completion</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>Created <TimeAgo date={workflow.created_at} /></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {workflow.metadata.status.value === 'Active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEnrollmentModal(workflow)}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Enroll Contacts
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link 
                          href={`/workflows/${workflow.id}/edit`}
                          className="flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Workflow
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={() => handleStatusToggle(workflow)}
                        disabled={statusUpdatingId === workflow.id}
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
                        onClick={() => handleDuplicate(workflow.id)}
                        disabled={duplicatingId === workflow.id}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={() => setDeletingId(workflow.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && handleDelete(deletingId)}
        title="Delete Workflow"
        message="Are you sure you want to delete this workflow? This action cannot be undone and will also remove all enrollments."
        confirmLabel="Delete"
        isLoading={false}
        variant="destructive"
      />

      {/* Contact Enrollment Modal */}
      <ContactEnrollmentModal
        isOpen={enrollmentModal.isOpen}
        onClose={() => setEnrollmentModal({ isOpen: false, workflowId: '', workflowName: '' })}
        workflowId={enrollmentModal.workflowId}
        workflowName={enrollmentModal.workflowName}
      />
    </>
  )
}