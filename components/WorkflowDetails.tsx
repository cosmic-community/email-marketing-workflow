'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Edit, 
  Play, 
  Pause, 
  Copy, 
  Trash2, 
  Clock, 
  Users, 
  Mail,
  ChevronRight,
  Settings
} from 'lucide-react'
import { EmailWorkflow, EmailTemplate } from '@/types'
import EditWorkflowForm from '@/components/EditWorkflowForm'
import ContactEnrollmentModal from '@/components/ContactEnrollmentModal'
import ConfirmationModal from '@/components/ConfirmationModal'
import TimeAgo from '@/components/TimeAgo'

interface WorkflowDetailsProps {
  workflow: EmailWorkflow
  templates: EmailTemplate[]
}

export default function WorkflowDetails({ workflow, templates }: WorkflowDetailsProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const handleStatusChange = async (newStatus: 'Draft' | 'Active' | 'Paused') => {
    setIsUpdatingStatus(true)
    
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
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
      setIsUpdatingStatus(false)
    }
  }

  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/workflows/${workflow.id}/duplicate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to duplicate workflow')
      }

      const result = await response.json()
      router.push(`/workflows/${result.data.id}`)
    } catch (error) {
      console.error('Error duplicating workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to duplicate workflow')
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete workflow')
      }

      router.push('/workflows')
    } catch (error) {
      console.error('Error deleting workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete workflow')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTriggerDescription = () => {
    const trigger = workflow.metadata.trigger_type.value
    switch (trigger) {
      case 'Manual':
        return 'Contacts must be manually enrolled'
      case 'List Subscribe':
        return 'Triggered when contacts subscribe to specified lists'
      case 'Tag Added':
        return 'Triggered when specified tags are added to contacts'
      case 'Date Based':
        return `Triggered on ${workflow.metadata.trigger_date || 'specified date'}`
      default:
        return trigger
    }
  }

  const calculateStepDelay = (step: any) => {
    const days = step.delay_days || 0
    const hours = step.delay_hours || 0
    const minutes = step.delay_minutes || 0
    
    if (days === 0 && hours === 0 && minutes === 0) {
      return 'Immediate'
    }
    
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    
    return parts.join(' ')
  }

  const getTemplateById = (templateId: string) => {
    return templates.find(t => t.id === templateId)
  }

  if (isEditing) {
    return (
      <EditWorkflowForm
        workflow={workflow}
        templates={templates}
        onSave={() => setIsEditing(false)}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workflow.metadata.name}</h1>
            {workflow.metadata.description && (
              <p className="text-gray-600 mt-1">{workflow.metadata.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={getStatusColor(workflow.metadata.status.value)}>
              {workflow.metadata.status.value}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>

          {workflow.metadata.status.value === 'Draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('Active')}
              disabled={isUpdatingStatus}
            >
              <Play className="w-4 h-4 mr-2" />
              Activate
            </Button>
          )}

          {workflow.metadata.status.value === 'Active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('Paused')}
              disabled={isUpdatingStatus}
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}

          {workflow.metadata.status.value === 'Paused' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('Active')}
              disabled={isUpdatingStatus}
            >
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEnrollModal(true)}
            disabled={workflow.metadata.status.value !== 'Active'}
          >
            <Users className="w-4 h-4 mr-2" />
            Enroll Contacts
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workflow Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Workflow Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workflow.metadata.steps.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <Mail className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No steps configured yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setIsEditing(true)}
                    >
                      Add Steps
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workflow.metadata.steps.map((step, index) => {
                      const template = getTemplateById(step.template_id)
                      const delay = calculateStepDelay(step)
                      
                      return (
                        <div key={step.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900">
                                {template?.metadata.name || 'Unknown Template'}
                              </h4>
                              {!step.active && (
                                <Badge variant="outline" className="text-xs">Disabled</Badge>
                              )}
                            </div>
                            
                            {template && (
                              <p className="text-sm text-gray-600 mt-1">
                                Subject: {template.metadata.subject}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {delay}
                              </div>
                              {template && (
                                <span>{template.metadata.template_type.value}</span>
                              )}
                            </div>
                          </div>
                          
                          {index < workflow.metadata.steps.length - 1 && (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Enrolled</span>
                  <span className="font-medium">{workflow.metadata.stats?.total_enrolled || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium">{workflow.metadata.stats?.total_completed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-medium">{workflow.metadata.stats?.completion_rate || '0%'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Emails Sent</span>
                  <span className="font-medium">{workflow.metadata.stats?.total_emails_sent || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Workflow Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Workflow Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600">Trigger Type</span>
                  <p className="font-medium">{workflow.metadata.trigger_type.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{getTriggerDescription()}</p>
                </div>

                <Separator />

                <div>
                  <span className="text-sm text-gray-600">Created</span>
                  <p className="font-medium">
                    <TimeAgo date={workflow.created_at} />
                  </p>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Last Modified</span>
                  <p className="font-medium">
                    <TimeAgo date={workflow.metadata.last_modified} />
                  </p>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Steps</span>
                  <p className="font-medium">{workflow.metadata.steps.length} step{workflow.metadata.steps.length !== 1 ? 's' : ''}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ContactEnrollmentModal
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        workflowId={workflow.id}
        workflowName={workflow.metadata.name}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Workflow"
        message={`Are you sure you want to delete "${workflow.metadata.name}"? This action cannot be undone and will remove all associated enrollments.`}
        confirmText="Delete Workflow"
        isLoading={isDeleting}
        variant="destructive"
      />
    </>
  )
}