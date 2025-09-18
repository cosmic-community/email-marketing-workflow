'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Edit, 
  Play, 
  Pause, 
  Users, 
  Mail, 
  Clock, 
  BarChart3,
  Copy,
  Trash2,
  Plus
} from 'lucide-react'
import { EmailWorkflow } from '@/types'
import { EditWorkflowForm } from '@/components/EditWorkflowForm'
import { ContactEnrollmentModal } from '@/components/ContactEnrollmentModal'

interface WorkflowDetailsProps {
  workflow: EmailWorkflow
}

export default function WorkflowDetails({ workflow }: WorkflowDetailsProps) {
  const router = useRouter()
  const [showEditForm, setShowEditForm] = useState(false)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusUpdate = async (newStatus: 'Draft' | 'Active' | 'Paused') => {
    try {
      setIsUpdating(true)
      
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
      setIsUpdating(false)
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
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return
    }

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
    }
  }

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

  const formatDelay = (days: number, hours: number, minutes: number) => {
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    return parts.length > 0 ? parts.join(' ') : 'Immediate'
  }

  if (showEditForm) {
    return (
      <EditWorkflowForm
        workflow={workflow}
        onCancel={() => setShowEditForm(false)}
        onSave={() => {
          setShowEditForm(false)
          router.refresh()
        }}
      />
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{workflow.metadata.name}</h1>
            {workflow.metadata.description && (
              <p className="text-gray-600 mt-1">{workflow.metadata.description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(workflow.metadata.status.value)}>
              {workflow.metadata.status.value}
            </Badge>
            <Badge className={getTriggerColor(workflow.metadata.trigger_type.value)}>
              {workflow.metadata.trigger_type.value}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => setShowEditForm(true)}
            variant="outline"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Workflow
          </Button>

          {workflow.metadata.status.value === 'Draft' && (
            <Button 
              onClick={() => handleStatusUpdate('Active')}
              disabled={isUpdating}
            >
              <Play className="w-4 h-4 mr-2" />
              Activate
            </Button>
          )}

          {workflow.metadata.status.value === 'Active' && (
            <Button 
              onClick={() => handleStatusUpdate('Paused')}
              disabled={isUpdating}
              variant="outline"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}

          <Button 
            onClick={() => setShowEnrollmentModal(true)}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Enroll Contacts
          </Button>

          <Button onClick={handleDuplicate} variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </Button>

          <Button 
            onClick={handleDelete} 
            variant="outline"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="w-4 h-4 mr-2 text-blue-600" />
                Total Enrolled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workflow.metadata.stats?.total_enrolled || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-green-600" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workflow.metadata.stats?.total_completed || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Mail className="w-4 h-4 mr-2 text-purple-600" />
                Emails Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workflow.metadata.stats?.total_emails_sent || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-orange-600" />
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workflow.metadata.stats?.completion_rate || '0%'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Steps</CardTitle>
            <CardDescription>
              Sequence of emails in this workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workflow.metadata.steps && workflow.metadata.steps.length > 0 ? (
              <div className="space-y-4">
                {workflow.metadata.steps
                  .sort((a, b) => a.step_number - b.step_number)
                  .map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {step.step_number}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">Step {step.step_number}</h4>
                        {!step.active && (
                          <Badge variant="secondary" className="text-xs">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Template ID: {step.template_id}
                      </p>
                    </div>
                    
                    <div className="flex-shrink-0 flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {index === 0 ? 'Immediate' : formatDelay(step.delay_days, step.delay_hours, step.delay_minutes)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No steps configured
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trigger Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Trigger Configuration</CardTitle>
            <CardDescription>
              How contacts are enrolled in this workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Trigger Type</label>
                <div className="mt-1">
                  <Badge className={getTriggerColor(workflow.metadata.trigger_type.value)}>
                    {workflow.metadata.trigger_type.value}
                  </Badge>
                </div>
              </div>

              {workflow.metadata.trigger_lists && workflow.metadata.trigger_lists.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Trigger Lists</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {workflow.metadata.trigger_lists.map(listId => (
                      <Badge key={listId} variant="outline">
                        List: {listId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {workflow.metadata.trigger_tags && workflow.metadata.trigger_tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Trigger Tags</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {workflow.metadata.trigger_tags.map(tag => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {workflow.metadata.trigger_date && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Trigger Date</label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {workflow.metadata.trigger_date}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Enrollment Modal */}
      {showEnrollmentModal && (
        <ContactEnrollmentModal
          workflowId={workflow.id}
          workflowName={workflow.metadata.name}
          isOpen={showEnrollmentModal}
          onClose={() => setShowEnrollmentModal(false)}
        />
      )}
    </>
  )
}